import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { isEditorialV2Enabled } from "../../../../../../lib/editorial-v2/feature-flag";
import {
  isLocalPreviewRenderEnabled,
  LOCAL_PREVIEW_MAX_REQUEST_BYTES,
} from "../../../../../../lib/editorial-v2/local-preview-contracts";
import { renderLocalProjectPreview, readLocalPreviewBytes } from "../../../../../../lib/editorial-v2/local-preview-executor-node";
import { buildLocalPreviewRenderInput } from "../../../../../../lib/editorial-v2/local-preview-input";
import {
  readLatestLocalPreviewMetadata,
  readLocalPreviewMediaDescriptorByRenderId,
  readLocalPreviewMetadataByRenderId,
} from "../../../../../../lib/editorial-v2/local-preview-store-node";
import {
  parseLocalPreviewRenderRequest,
  summarizeLocalPreviewValidation,
  validateLocalPreviewInput,
  validateLocalPreviewRequest,
} from "../../../../../../lib/editorial-v2/local-preview-validation";
import { isEditorialV2LocalPersistenceEnabled } from "../../../../../../lib/editorial-v2/persistence-contracts";
import { resolveEditorialV2LocalStoreConfiguration } from "../../../../../../lib/editorial-v2/persistence-data-root";
import { isEditorialV2ProjectId } from "../../../../../../lib/editorial-v2/project-snapshot";
import { readProject } from "../../../../../../lib/editorial-v2/project-store-node";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly projectId: string }>;
}

function jsonError(status: number, code: string, message: string, extra: Readonly<Record<string, unknown>> = {}) {
  return NextResponse.json({ ok: false, code, message, ...extra }, { status });
}

function featureError() {
  if (!isEditorialV2Enabled(process.env)) return jsonError(404, "EDITORIAL_V2_DISABLED", "Shorts Editorial OS V2가 비활성 상태입니다.");
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return jsonError(503, "LOCAL_PERSISTENCE_DISABLED", "V2 local persistence가 비활성 상태입니다.");
  if (!isLocalPreviewRenderEnabled(process.env)) return jsonError(503, "LOCAL_PREVIEW_RENDER_DISABLED", "V2 local preview render가 비활성 상태입니다.");
  return null;
}

async function projectIdFrom(context: RouteContext): Promise<string | null> {
  try {
    const projectId = decodeURIComponent((await context.params).projectId);
    return isEditorialV2ProjectId(projectId) ? projectId : null;
  } catch { return null; }
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
    try { expectedOrigins.add(new URL(`${protocol}://${host}`).origin); } catch { throw new Error("PREVIEW_MUTATION_HOST_INVALID"); }
  }
  let observed: string;
  try { observed = new URL(origin).origin; } catch { throw new Error("PREVIEW_MUTATION_ORIGIN_INVALID"); }
  if (!expectedOrigins.has(observed)) throw new Error("CROSS_ORIGIN_PREVIEW_MUTATION_FORBIDDEN");
}

async function readRequestObject(request: Request): Promise<Readonly<Record<string, unknown>>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("CONTENT_TYPE_JSON_REQUIRED");
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > LOCAL_PREVIEW_MAX_REQUEST_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > LOCAL_PREVIEW_MAX_REQUEST_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error("REQUEST_JSON_INVALID"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("REQUEST_OBJECT_REQUIRED");
  return value as Readonly<Record<string, unknown>>;
}

function requestFailure(error: unknown) {
  const code = error instanceof Error ? error.message : "LOCAL_PREVIEW_REQUEST_FAILED";
  const status = code === "REQUEST_BODY_TOO_LARGE" ? 413
    : code === "CONTENT_TYPE_JSON_REQUIRED" ? 415
      : code.includes("ORIGIN") ? 403
        : code.includes("NOT_FOUND") ? 404
          : code.includes("MISMATCH") || code.includes("CONFLICT") ? 409 : 400;
  return jsonError(status, code, "Local preview 요청을 처리하지 못했습니다.");
}

export async function GET(request: Request, context: RouteContext) {
  const disabled = featureError();
  if (disabled) return disabled;
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    const url = new URL(request.url);
    if ([...url.searchParams.keys()].some((key) => key !== "renderId" && key !== "media")) return jsonError(400, "PREVIEW_QUERY_INVALID", "renderId와 media query만 허용됩니다.");
    const renderId = url.searchParams.get("renderId");
    const media = url.searchParams.get("media");
    if (media !== null && media !== "1") return jsonError(400, "PREVIEW_MEDIA_QUERY_INVALID", "media=1만 허용됩니다.");
    const configuration = resolveEditorialV2LocalStoreConfiguration();
    if (media === "1") {
      if (!renderId) return jsonError(400, "PREVIEW_RENDER_ID_REQUIRED", "Media 조회에는 renderId가 필요합니다.");
      const descriptor = await readLocalPreviewMediaDescriptorByRenderId(configuration, projectId, renderId);
      const bytes = await readLocalPreviewBytes(descriptor.mediaPath);
      if (bytes.byteLength !== descriptor.outputBytes) return jsonError(409, "PREVIEW_MEDIA_SIZE_MISMATCH", "저장된 media 크기가 metadata와 다릅니다.");
      return new Response(new Uint8Array(bytes), { status: 200, headers: { "Content-Type": "video/mp4", "Content-Length": String(bytes.byteLength), "Cache-Control": "no-store", "Content-Disposition": `inline; filename="${descriptor.renderId}.mp4"`, "X-Content-Type-Options": "nosniff" } });
    }
    const metadata = renderId
      ? await readLocalPreviewMetadataByRenderId(configuration, projectId, renderId)
      : await readLatestLocalPreviewMetadata(configuration, projectId);
    if (!metadata) return jsonError(404, "LOCAL_PREVIEW_NOT_FOUND", "저장된 local preview가 없습니다.");
    return NextResponse.json({ ok: true, localOnly: true, productionReady: false, metadata });
  } catch (error) { return requestFailure(error); }
}

export async function POST(request: Request, context: RouteContext) {
  const disabled = featureError();
  if (disabled) return disabled;
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    assertMutationSameOrigin(request);
    const body = await readRequestObject(request);
    const requestValidation = summarizeLocalPreviewValidation(validateLocalPreviewRequest(body));
    if (!requestValidation.valid) return jsonError(400, "LOCAL_PREVIEW_REQUEST_INVALID", "Identifier-only preview request가 필요합니다.", { validation: requestValidation });
    const renderRequest = parseLocalPreviewRenderRequest(body);
    const configuration = resolveEditorialV2LocalStoreConfiguration();
    const projectResult = await readProject(configuration, projectId);
    if (!projectResult.ok || !projectResult.snapshot) return jsonError(projectResult.status === "not_found" ? 404 : 409, projectResult.status, projectResult.message);
    const project = projectResult.snapshot;
    if (project.metadata.status !== "active") return jsonError(409, "ARCHIVED_PROJECT_PREVIEW_BLOCKED", "Archived project는 preview render할 수 없습니다.");
    if (project.revision !== renderRequest.expectedProjectRevision) return jsonError(409, "PROJECT_REVISION_MISMATCH", "Persisted project revision이 요청 identity와 다릅니다.");
    const renderCheckpoint = project.approvedCheckpoints.find((entry) => entry.stageId === "render_integration");
    if (!renderCheckpoint) return jsonError(409, "RENDER_CHECKPOINT_MISSING", "Persisted Render Integration checkpoint가 없습니다.");
    if (renderCheckpoint.payloadHash !== renderRequest.expectedRenderCheckpointHash) return jsonError(409, "RENDER_CHECKPOINT_HASH_MISMATCH", "Persisted Render checkpoint identity가 현재 session과 다릅니다.");
    const input = buildLocalPreviewRenderInput(project);
    const inputValidation = summarizeLocalPreviewValidation(validateLocalPreviewInput(input));
    if (!inputValidation.valid) return jsonError(409, "LOCAL_PREVIEW_INPUT_BLOCKED", "Canonical render input validation이 실패했습니다.", { validation: inputValidation });
    const result = await renderLocalProjectPreview(configuration, input);
    if (!result.ok || !result.metadata || !result.identity) return jsonError(500, "LOCAL_PREVIEW_RENDER_FAILED", result.message);
    return NextResponse.json({ ok: true, localOnly: true, productionReady: false, status: result.status, cacheStatus: result.cacheStatus, ffmpegExecuted: result.ffmpegExecuted, identity: result.identity, metadata: result.metadata });
  } catch (error) { return requestFailure(error); }
}
