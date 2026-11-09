import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import type {
  EditorialV2DraftRecoveryRequest,
  EditorialV2DraftSaveRequest,
} from "../../../../../../lib/editorial-v2/draft-contracts";
import { EDITORIAL_V2_DRAFT_MAX_BYTES } from "../../../../../../lib/editorial-v2/draft-contracts";
import { buildDraftRecoveryPlan, inspectDraftRecoveryState, recoverDraftFromLastKnownGood } from "../../../../../../lib/editorial-v2/draft-recovery";
import { inspectProjectDraft, readProjectDraft, writeProjectDraft } from "../../../../../../lib/editorial-v2/draft-store-node";
import { isEditorialV2LocalPersistenceEnabled } from "../../../../../../lib/editorial-v2/persistence-contracts";
import { resolveEditorialV2LocalStoreConfiguration } from "../../../../../../lib/editorial-v2/persistence-data-root";
import { isEditorialV2ProjectId } from "../../../../../../lib/editorial-v2/project-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DRAFT_REQUEST_BYTES = EDITORIAL_V2_DRAFT_MAX_BYTES + 65_536;

interface RouteContext {
  readonly params: Promise<{ readonly projectId: string }>;
}

function jsonError(status: number, code: string, message: string, extra: Readonly<Record<string, unknown>> = {}) {
  return NextResponse.json({ ok: false, code, message, ...extra }, { status });
}

function containsForbiddenClientPath(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsForbiddenClientPath);
  return Object.entries(value as Readonly<Record<string, unknown>>).some(([key, entry]) => {
    const normalized = key.toLowerCase();
    return normalized === "dataroot" || normalized === "filesystempath" || normalized === "absolutepath" || containsForbiddenClientPath(entry);
  });
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
    try { expectedOrigins.add(new URL(`${protocol}://${host}`).origin); } catch { throw new Error("MUTATION_HOST_INVALID"); }
  }
  let observed: string;
  try { observed = new URL(origin).origin; } catch { throw new Error("MUTATION_ORIGIN_INVALID"); }
  if (!expectedOrigins.has(observed)) throw new Error("CROSS_ORIGIN_DRAFT_MUTATION_FORBIDDEN");
}

async function readJsonObject(request: Request): Promise<Readonly<Record<string, unknown>>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("CONTENT_TYPE_JSON_REQUIRED");
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_DRAFT_REQUEST_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_DRAFT_REQUEST_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("REQUEST_JSON_INVALID"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("REQUEST_OBJECT_REQUIRED");
  if (containsForbiddenClientPath(parsed)) throw new Error("CLIENT_FILESYSTEM_PATH_FORBIDDEN");
  return parsed as Readonly<Record<string, unknown>>;
}

async function projectIdFrom(context: RouteContext): Promise<string | null> {
  try {
    const projectId = decodeURIComponent((await context.params).projectId);
    return isEditorialV2ProjectId(projectId) ? projectId : null;
  } catch {
    return null;
  }
}

function featureDisabledResponse() {
  return jsonError(503, "LOCAL_PERSISTENCE_DISABLED", "V2 local draft persistence가 비활성 상태입니다.");
}

function statusFor(status: string): number {
  if (status === "not_found") return 404;
  if (status === "draft_revision_conflict" || status === "base_project_conflict" || status === "integrity_conflict" || status === "schema_conflict" || status === "corrupted") return 409;
  if (status === "disabled") return 503;
  if (status === "validation_error") return 400;
  return 500;
}

function requestFailure(error: unknown, fallback: string) {
  const code = error instanceof Error ? error.message : fallback;
  const status = code === "REQUEST_BODY_TOO_LARGE" ? 413
    : code === "CONTENT_TYPE_JSON_REQUIRED" ? 415
      : code.includes("ORIGIN") ? 403 : 400;
  return jsonError(status, code, "Draft mutation 요청을 처리하지 못했습니다.");
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return featureDisabledResponse();
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    const configuration = resolveEditorialV2LocalStoreConfiguration();
    const result = await readProjectDraft(configuration, projectId);
    if (result.status === "not_found") return NextResponse.json({ ok: true, localOnly: true, encrypted: false, draft: null, recoveryState: null, message: "DRAFT_NOT_FOUND" });
    if (!result.ok || !result.draft) {
      if (result.status === "corrupted") {
        const recoveryState = (await inspectProjectDraft(configuration, projectId)).state;
        const recoveryPlan = buildDraftRecoveryPlan(recoveryState);
        return jsonError(409, "DRAFT_CORRUPTED", result.message, { recoveryState, recoveryPlan });
      }
      return jsonError(statusFor(result.status), result.status, result.message);
    }
    return NextResponse.json({ ok: true, localOnly: true, encrypted: false, draft: result.draft, recoveryState: null, message: result.message });
  } catch {
    return jsonError(500, "DRAFT_READ_FAILED", "로컬 draft를 읽지 못했습니다.");
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return featureDisabledResponse();
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    assertMutationSameOrigin(request);
    const body = await readJsonObject(request);
    if (body.action !== "save_draft") return jsonError(400, "MUTATION_ACTION_INVALID", "명시적 save_draft action이 필요합니다.");
    const input = {
      projectId: typeof body.projectId === "string" ? body.projectId : "",
      expectedDraftRevision: body.expectedDraftRevision,
      expectedBaseProjectRevision: body.expectedBaseProjectRevision,
      draft: body.draft,
    } as unknown as EditorialV2DraftSaveRequest;
    if (input.projectId !== projectId) return jsonError(400, "DRAFT_PROJECT_IDENTITY_MISMATCH", "URL과 draft request의 Project ID가 다릅니다.");
    const result = await writeProjectDraft(resolveEditorialV2LocalStoreConfiguration(), input);
    if (!result.ok) return jsonError(statusFor(result.status), result.status, result.message, { result, conflict: result.conflict });
    return NextResponse.json({ ok: true, action: "save_draft", result });
  } catch (error) {
    return requestFailure(error, "DRAFT_SAVE_FAILED");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return featureDisabledResponse();
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    assertMutationSameOrigin(request);
    const body = await readJsonObject(request);
    if (body.action !== "recover_draft") return jsonError(400, "MUTATION_ACTION_INVALID", "명시적 recover_draft action이 필요합니다.");
    const input: EditorialV2DraftRecoveryRequest = {
      action: "recover_draft",
      ownerConfirmed: body.ownerConfirmed === true,
      expectedCorruptedRevision: Number.isSafeInteger(body.expectedCorruptedRevision) ? Number(body.expectedCorruptedRevision) : null,
      approvedAtIso: typeof body.approvedAtIso === "string" ? body.approvedAtIso : "",
    };
    if (!input.ownerConfirmed) return jsonError(400, "DRAFT_RECOVERY_OWNER_CONFIRMATION_REQUIRED", "Draft recovery에는 Owner 확인이 필요합니다.");
    const configuration = resolveEditorialV2LocalStoreConfiguration();
    const state = await inspectDraftRecoveryState(configuration, projectId);
    const plan = buildDraftRecoveryPlan(state);
    if (!plan.required) return jsonError(409, "DRAFT_RECOVERY_NOT_REQUIRED_OR_UNAVAILABLE", plan.message, { recoveryState: state, recoveryPlan: plan });
    const result = await recoverDraftFromLastKnownGood(configuration, projectId, input);
    if (!result.ok) return jsonError(statusFor(result.status), result.status, result.message, { result, recoveryState: state, recoveryPlan: plan });
    return NextResponse.json({ ok: true, action: "recover_draft", result, recoveryPlan: plan });
  } catch (error) {
    return requestFailure(error, "DRAFT_RECOVERY_FAILED");
  }
}
