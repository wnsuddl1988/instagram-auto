import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import type {
  EditorialV2ArchiveRequest,
  EditorialV2CheckpointWriteRequest,
  EditorialV2RecoveryRequest,
} from "../../../../../lib/editorial-v2/persistence-contracts";
import {
  EDITORIAL_V2_MAX_REQUEST_BYTES,
  isEditorialV2LocalPersistenceEnabled,
} from "../../../../../lib/editorial-v2/persistence-contracts";
import { resolveEditorialV2LocalStoreConfiguration } from "../../../../../lib/editorial-v2/persistence-data-root";
import { buildProjectRecoveryPlan, inspectProjectRecoveryState, recoverFromLastKnownGood } from "../../../../../lib/editorial-v2/project-recovery";
import { isEditorialV2ProjectId } from "../../../../../lib/editorial-v2/project-snapshot";
import { archiveProject, readProject, writeProjectCheckpoint } from "../../../../../lib/editorial-v2/project-store-node";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly projectId: string }>;
}

function jsonError(status: number, code: string, message: string, extra: Readonly<Record<string, unknown>> = {}) {
  return NextResponse.json({ ok: false, code, message, ...extra }, { status });
}

function containsDataRoot(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsDataRoot);
  return Object.entries(value as Readonly<Record<string, unknown>>).some(([key, entry]) => key.toLowerCase() === "dataroot" || containsDataRoot(entry));
}

async function readJsonObject(request: Request): Promise<Readonly<Record<string, unknown>>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) throw new Error("CONTENT_TYPE_JSON_REQUIRED");
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > EDITORIAL_V2_MAX_REQUEST_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > EDITORIAL_V2_MAX_REQUEST_BYTES) throw new Error("REQUEST_BODY_TOO_LARGE");
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error("REQUEST_JSON_INVALID"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("REQUEST_OBJECT_REQUIRED");
  if (containsDataRoot(parsed)) throw new Error("CLIENT_DATA_ROOT_FORBIDDEN");
  return parsed as Readonly<Record<string, unknown>>;
}

function featureDisabledResponse() {
  return jsonError(503, "LOCAL_PERSISTENCE_DISABLED", "V2 local approved-checkpoint persistence가 비활성 상태입니다.");
}

async function projectIdFrom(context: RouteContext): Promise<string | null> {
  const projectId = decodeURIComponent((await context.params).projectId);
  return isEditorialV2ProjectId(projectId) ? projectId : null;
}

function resultStatus(status: string): number {
  if (status === "not_found") return 404;
  if (status === "schema_conflict" || status === "integrity_conflict") return 409;
  if (status === "disabled") return 503;
  if (status === "validation_error") return 400;
  return 500;
}

export async function GET(_request: Request, context: RouteContext) {
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return featureDisabledResponse();
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    const configuration = resolveEditorialV2LocalStoreConfiguration();
    const result = await readProject(configuration, projectId);
    if (!result.ok || !result.snapshot) {
      if (result.status === "integrity_conflict") {
        const recoveryState = await inspectProjectRecoveryState(configuration, projectId);
        const recoveryPlan = buildProjectRecoveryPlan(recoveryState);
        return jsonError(409, result.status, result.message, { recoveryState, recoveryPlan });
      }
      return jsonError(resultStatus(result.status), result.status, result.message);
    }
    return NextResponse.json({ ok: true, localOnly: true, fullDraftAutosave: false, fullWorkbenchHydration: false, snapshot: result.snapshot });
  } catch {
    return jsonError(500, "PROJECT_READ_FAILED", "로컬 프로젝트를 읽지 못했습니다.");
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return featureDisabledResponse();
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    const body = await readJsonObject(request);
    if (body.action !== "save_approved_checkpoint") return jsonError(400, "MUTATION_ACTION_INVALID", "명시적 save_approved_checkpoint action이 필요합니다.");
    const input = {
      ownerConfirmed: body.ownerConfirmed === true,
      checkpoint: body.checkpoint,
      rawArtifacts: Array.isArray(body.rawArtifacts) ? body.rawArtifacts : [],
    } as unknown as EditorialV2CheckpointWriteRequest;
    const result = await writeProjectCheckpoint(resolveEditorialV2LocalStoreConfiguration(), projectId, input);
    if (!result.ok) return jsonError(resultStatus(result.status), result.status, result.message);
    return NextResponse.json({ ok: true, action: "save_approved_checkpoint", result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CHECKPOINT_SAVE_FAILED";
    const status = code === "REQUEST_BODY_TOO_LARGE" ? 413 : code === "CONTENT_TYPE_JSON_REQUIRED" ? 415 : 400;
    return jsonError(status, code, "승인 checkpoint 저장 요청을 처리하지 못했습니다.");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return featureDisabledResponse();
  const projectId = await projectIdFrom(context);
  if (!projectId) return jsonError(400, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  try {
    const body = await readJsonObject(request);
    const configuration = resolveEditorialV2LocalStoreConfiguration();
    if (body.action === "archive") {
      const input: EditorialV2ArchiveRequest = { action: "archive", ownerConfirmed: body.ownerConfirmed === true, archivedAtIso: typeof body.archivedAtIso === "string" ? body.archivedAtIso : "" };
      const result = await archiveProject(configuration, projectId, input);
      if (!result.ok) return jsonError(resultStatus(result.status), result.status, result.message);
      return NextResponse.json({ ok: true, action: "archive", result });
    }
    if (body.action === "recover") {
      if (body.candidate !== "last_known_good" && body.candidate !== "latest_valid_history") return jsonError(400, "RECOVERY_CANDIDATE_INVALID", "명시적인 recovery candidate가 필요합니다.");
      const input: EditorialV2RecoveryRequest = {
        action: "recover",
        ownerConfirmed: body.ownerConfirmed === true,
        candidate: body.candidate,
        approvedAtIso: typeof body.approvedAtIso === "string" ? body.approvedAtIso : "",
      };
      const result = await recoverFromLastKnownGood(configuration, projectId, input);
      if (!result.ok) return jsonError(resultStatus(result.status), result.status, result.message);
      return NextResponse.json({ ok: true, action: "recover", result });
    }
    return jsonError(400, "MUTATION_ACTION_INVALID", "archive 또는 recover action이 필요합니다.");
  } catch (error) {
    const code = error instanceof Error ? error.message : "PROJECT_PATCH_FAILED";
    const status = code === "REQUEST_BODY_TOO_LARGE" ? 413 : code === "CONTENT_TYPE_JSON_REQUIRED" ? 415 : 400;
    return jsonError(status, code, "프로젝트 변경 요청을 처리하지 못했습니다.");
  }
}
