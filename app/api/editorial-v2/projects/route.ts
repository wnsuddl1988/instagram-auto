import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import type { EditorialV2ProjectCreateRequest } from "../../../../lib/editorial-v2/persistence-contracts";
import {
  EDITORIAL_V2_MAX_REQUEST_BYTES,
  isEditorialV2LocalPersistenceEnabled,
} from "../../../../lib/editorial-v2/persistence-contracts";
import { resolveEditorialV2LocalStoreConfiguration } from "../../../../lib/editorial-v2/persistence-data-root";
import { createProject, listProjects } from "../../../../lib/editorial-v2/project-store-node";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function containsDataRoot(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsDataRoot);
  const record = value as Readonly<Record<string, unknown>>;
  return Object.entries(record).some(([key, entry]) => key.toLowerCase() === "dataroot" || containsDataRoot(entry));
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

export async function GET() {
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return featureDisabledResponse();
  try {
    const configuration = resolveEditorialV2LocalStoreConfiguration();
    const projects = await listProjects(configuration, { includeArchived: true });
    return NextResponse.json({ ok: true, localOnly: true, approvedCheckpointPersistence: true, fullDraftAutosave: false, fullWorkbenchHydration: false, projects });
  } catch {
    return jsonError(500, "PROJECT_LIST_FAILED", "로컬 프로젝트 목록을 읽지 못했습니다.");
  }
}

export async function POST(request: Request) {
  if (!isEditorialV2LocalPersistenceEnabled(process.env)) return featureDisabledResponse();
  try {
    const body = await readJsonObject(request);
    if (body.action !== "create") return jsonError(400, "MUTATION_ACTION_INVALID", "명시적 create action이 필요합니다.");
    const input: EditorialV2ProjectCreateRequest = {
      displayName: typeof body.displayName === "string" ? body.displayName : "",
      creationTimestampIso: typeof body.creationTimestampIso === "string" ? body.creationTimestampIso : "",
    };
    const configuration = resolveEditorialV2LocalStoreConfiguration();
    const result = await createProject(configuration, input);
    if (!result.ok) return jsonError(result.status === "validation_error" ? 400 : 500, result.status, result.message);
    return NextResponse.json({ ok: true, action: "create", result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PROJECT_CREATE_FAILED";
    const status = code === "REQUEST_BODY_TOO_LARGE" ? 413 : code === "CONTENT_TYPE_JSON_REQUIRED" ? 415 : 400;
    return jsonError(status, code, "프로젝트 생성 요청을 처리하지 못했습니다.");
  }
}
