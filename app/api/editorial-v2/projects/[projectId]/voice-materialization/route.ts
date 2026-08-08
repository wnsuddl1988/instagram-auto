import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { isEditorialV2Enabled } from "../../../../../../lib/editorial-v2/feature-flag";
import { isEditorialV2LocalPersistenceEnabled } from "../../../../../../lib/editorial-v2/persistence-contracts";
import { resolveEditorialV2LocalStoreConfiguration } from "../../../../../../lib/editorial-v2/persistence-data-root";
import { isEditorialV2ProjectId } from "../../../../../../lib/editorial-v2/project-snapshot";
import { readProject } from "../../../../../../lib/editorial-v2/project-store-node";
import {
  ELEVENLABS_API_KEY_ENV,
  PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
  VOICE_MATERIALIZATION_MAX_REQUEST_BYTES,
  VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE,
  isExternalTtsEnabled,
  isMaterializationSetId,
  isVoiceMaterializationIdentifier,
} from "../../../../../../lib/editorial-v2/voice-materialization-contracts";
import {
  assertPa4lRequestedSceneIds,
  assertPa4lSingleScenePlan,
  buildVoiceMaterializationPlan,
  buildVoiceMaterializationPlanPreview,
  materializeVoiceMaterializationPlan,
} from "../../../../../../lib/editorial-v2/voice-materialization-node";
import { buildVoiceMaterializationRecoveryPlan } from "../../../../../../lib/editorial-v2/voice-materialization-recovery";
import {
  readLatestVoiceMaterializationSet,
  readVoiceMaterializationSet,
  readVoiceSceneAudioBytes,
  readVoiceSceneAudioDescriptor,
} from "../../../../../../lib/editorial-v2/voice-audio-store-node";
import {
  parseVoiceMaterializationRequest,
  validateVoiceMaterializationRequest,
} from "../../../../../../lib/editorial-v2/voice-materialization-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly projectId: string }>;
}

const activeMaterializations = new Set<string>();

function jsonError(status: number, code: string, message: string, extra: Readonly<Record<string, unknown>> = {}) {
  return NextResponse.json({ ok: false, code, message, ...extra }, { status });
}

function baseFeatureError() {
  if (!isEditorialV2Enabled(process.env)) return jsonError(404, "EDITORIAL_V2_DISABLED", "Shorts Editorial OS V2가 비활성 상태입니다.");
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return jsonError(503, "LOCAL_PERSISTENCE_DISABLED", "V2 local persistence가 비활성 상태입니다.");
  return null;
}

async function projectIdFrom(context: RouteContext): Promise<string | null> {
  try {
    const projectId = decodeURIComponent((await context.params).projectId);
    return isEditorialV2ProjectId(projectId) ? projectId : null;
  } catch { return null; }
}

function credentialConfigured(): boolean {
  const value = process.env[ELEVENLABS_API_KEY_ENV];
  return typeof value === "string" && value.length > 0;
}

function assertMutationSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestUrl = new URL(request.url);
  const expectedOrigins = new Set([requestUrl.origin]);
  const host = request.headers.get("host")?.trim();
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (host) {
    const protocol = forwardedProtocol === "https" || forwardedProtocol === "http" ? forwardedProtocol : requestUrl.protocol.slice(0, -1);
    try { expectedOrigins.add(new URL(`${protocol}://${host}`).origin); } catch { throw new Error("VOICE_MUTATION_HOST_INVALID"); }
  }
  let observed: string;
  try { observed = new URL(origin).origin; } catch { throw new Error("VOICE_MUTATION_ORIGIN_INVALID"); }
  if (!expectedOrigins.has(observed)) throw new Error("CROSS_ORIGIN_VOICE_MUTATION_FORBIDDEN");
}

async function readRequestObject(request: Request): Promise<Readonly<Record<string, unknown>>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("CONTENT_TYPE_JSON_REQUIRED");
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > VOICE_MATERIALIZATION_MAX_REQUEST_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > VOICE_MATERIALIZATION_MAX_REQUEST_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error("REQUEST_JSON_INVALID"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("REQUEST_OBJECT_REQUIRED");
  return value as Readonly<Record<string, unknown>>;
}

function requestFailure(error: unknown) {
  const raw = error instanceof Error ? error.message.split(":", 1)[0] ?? "" : "";
  const code = /^[A-Z][A-Z0-9_]{2,127}$/u.test(raw) ? raw : "VOICE_MATERIALIZATION_REQUEST_FAILED";
  const status = code === "REQUEST_BODY_TOO_LARGE" ? 413
    : code === "CONTENT_TYPE_JSON_REQUIRED" ? 415
      : code.includes("ORIGIN") ? 403
        : code.includes("NOT_FOUND") || code.includes("MISSING") ? 404
          : code.includes("MISMATCH") || code.includes("STALE") || code.includes("CONFLICT") || code.includes("IN_FLIGHT") || code.includes("RETRY") ? 409
            : code.startsWith("ELEVENLABS_HTTP_") ? 502 : 400;
  return jsonError(status, code, "Voice materialization 요청을 처리하지 못했습니다.");
}

async function loadCanonicalProject(projectId: string) {
  const configuration = resolveEditorialV2LocalStoreConfiguration();
  const projectResult = await readProject(configuration, projectId);
  if (!projectResult.ok || !projectResult.snapshot) throw new Error(projectResult.status === "not_found" ? "VOICE_PROJECT_NOT_FOUND" : "VOICE_PROJECT_INTEGRITY_CONFLICT");
  if (projectResult.snapshot.metadata.status !== "active") throw new Error("ARCHIVED_PROJECT_VOICE_MATERIALIZATION_BLOCKED");
  return { configuration, project: projectResult.snapshot };
}

export async function GET(request: Request, context: RouteContext) {
  const disabled = baseFeatureError();
  if (disabled) return disabled;
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode");
    const allowedKeys = mode === "plan" ? new Set(["mode", "voiceId", "modelId", "executionMode"])
      : mode === "status" ? new Set(["mode", "materializationSetId"])
        : mode === "audio" ? new Set(["mode", "materializationSetId", "sceneId"])
          : new Set<string>();
    if (allowedKeys.size === 0 || [...url.searchParams.keys()].some((key) => !allowedKeys.has(key))) return jsonError(400, "VOICE_QUERY_INVALID", "Voice materialization query가 올바르지 않습니다.");
    const { configuration, project } = await loadCanonicalProject(projectId);
    if (mode === "plan") {
      const voiceId = url.searchParams.get("voiceId");
      const modelId = url.searchParams.get("modelId");
      if (!isVoiceMaterializationIdentifier(voiceId) || !isVoiceMaterializationIdentifier(modelId)) return jsonError(400, "VOICE_OR_MODEL_ID_INVALID", "Voice ID와 model ID가 필요합니다.");
      const executionMode = url.searchParams.get("executionMode");
      if (executionMode !== PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE) return jsonError(409, "LIVE_FULL_MATERIALIZATION_NOT_ACTIVATED", "최초 live 검증은 PA-4L single-scene mode만 허용됩니다.");
      const plan = buildVoiceMaterializationPlan(project, { voiceId, modelId, executionMode });
      assertPa4lSingleScenePlan(plan);
      const preview = await buildVoiceMaterializationPlanPreview(configuration, plan, {
        featureEnabled: isExternalTtsEnabled(process.env),
        credentialConfigured: credentialConfigured(),
      });
      return NextResponse.json({ ok: true, localOnly: true, liveProviderStatus: "IMPLEMENTED_BUT_LIVE_UNVERIFIED", preview });
    }
    const materializationSetId = url.searchParams.get("materializationSetId");
    if (mode === "status") {
      if (materializationSetId !== null && !isMaterializationSetId(materializationSetId)) return jsonError(400, "MATERIALIZATION_SET_ID_INVALID", "Materialization set ID가 올바르지 않습니다.");
      const set = materializationSetId
        ? await readVoiceMaterializationSet(configuration, projectId, materializationSetId)
        : await readLatestVoiceMaterializationSet(configuration, projectId);
      if (!set) return jsonError(404, "VOICE_MATERIALIZATION_SET_NOT_FOUND", "저장된 voice materialization set이 없습니다.");
      const currentPlan = buildVoiceMaterializationPlan(project, {
        voiceId: set.voiceId,
        modelId: set.modelId,
        executionMode: set.executionMode ?? VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE,
      });
      const recovery = buildVoiceMaterializationRecoveryPlan(set, currentPlan);
      return NextResponse.json({ ok: true, localOnly: true, productionVoiceQualityApproval: "NOT_APPROVED", set, recovery });
    }
    if (!materializationSetId || !isMaterializationSetId(materializationSetId)) return jsonError(400, "MATERIALIZATION_SET_ID_INVALID", "Audio 조회에는 materialization set ID가 필요합니다.");
    const sceneId = url.searchParams.get("sceneId");
    if (!sceneId || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/u.test(sceneId)) return jsonError(400, "SCENE_ID_INVALID", "Audio 조회에는 scene ID가 필요합니다.");
    const set = await readVoiceMaterializationSet(configuration, projectId, materializationSetId);
    if (!set) return jsonError(404, "VOICE_MATERIALIZATION_SET_NOT_FOUND", "저장된 voice materialization set이 없습니다.");
    const scene = set.sceneEntries.find((entry) => entry.sceneId === sceneId);
    if (!scene || (scene.status !== "cache_hit" && scene.status !== "generated")) return jsonError(404, "VOICE_SCENE_AUDIO_NOT_FOUND", "완료된 scene audio가 없습니다.");
    const descriptor = await readVoiceSceneAudioDescriptor(configuration, projectId, scene.sceneAudioIdentity);
    const bytes = await readVoiceSceneAudioBytes(descriptor);
    return new Response(new Uint8Array(bytes).buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${scene.sceneId}.mp3"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) { return requestFailure(error); }
}

export async function POST(request: Request, context: RouteContext) {
  const disabled = baseFeatureError();
  if (disabled) return disabled;
  if (!isExternalTtsEnabled(process.env)) return jsonError(503, "EXTERNAL_TTS_DISABLED", "External TTS feature가 비활성 상태입니다.");
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    assertMutationSameOrigin(request);
    const body = await readRequestObject(request);
    const requestIssues = validateVoiceMaterializationRequest(body);
    if (requestIssues.length > 0) return jsonError(400, "VOICE_MATERIALIZATION_REQUEST_INVALID", "Identifier/config-only paid TTS request가 필요합니다.", { issues: requestIssues });
    const parsed = parseVoiceMaterializationRequest(body);
    const { configuration, project } = await loadCanonicalProject(projectId);
    if (project.revision !== parsed.expectedProjectRevision) throw new Error("PROJECT_REVISION_MISMATCH");
    const renderCheckpoint = project.approvedCheckpoints.find((entry) => entry.stageId === "render_integration");
    if (!renderCheckpoint) throw new Error("RENDER_CHECKPOINT_MISSING");
    if (renderCheckpoint.payloadHash !== parsed.expectedRenderCheckpointHash) throw new Error("RENDER_CHECKPOINT_HASH_MISMATCH");
    if (parsed.executionMode !== PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE) throw new Error("LIVE_FULL_MATERIALIZATION_NOT_ACTIVATED");
    const plan = buildVoiceMaterializationPlan(project, {
      voiceId: parsed.voiceId,
      modelId: parsed.modelId,
      executionMode: parsed.executionMode,
    });
    assertPa4lRequestedSceneIds(plan, parsed.requestedSceneIds);
    if (plan.planHash !== parsed.expectedPlanHash) throw new Error("VOICE_MATERIALIZATION_PLAN_HASH_MISMATCH");
    const apiKey = process.env[ELEVENLABS_API_KEY_ENV];
    if (typeof apiKey !== "string" || apiKey.length === 0) throw new Error("ELEVENLABS_CREDENTIAL_MISSING");
    const inFlightKey = `${projectId}:${plan.materializationSetId}`;
    if (activeMaterializations.has(inFlightKey)) throw new Error("VOICE_MATERIALIZATION_IN_FLIGHT");
    activeMaterializations.add(inFlightKey);
    try {
      const result = await materializeVoiceMaterializationPlan(plan, {
        configuration,
        apiKey,
        mode: "initial",
        executionMode: PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
        requestedSceneIds: parsed.requestedSceneIds,
      });
      return NextResponse.json({
        ok: true,
        localOnly: true,
        liveProviderStatus: "IMPLEMENTED_BUT_LIVE_UNVERIFIED",
        productionVoiceQualityApproval: "NOT_APPROVED",
        executionOk: result.ok,
        result,
      });
    } finally {
      activeMaterializations.delete(inFlightKey);
    }
  } catch (error) { return requestFailure(error); }
}
