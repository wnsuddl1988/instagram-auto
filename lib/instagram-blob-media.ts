/**
 * instagram-blob-media.ts — Vercel Blob Instagram media integration (no-upload / fail-closed)
 *
 * task: vercel-blob-dependency-code-integration-no-upload-v1
 * Owner approval: APPROVE_VERCEL_BLOB_DEPENDENCY_AND_CODE_INTEGRATION_NO_UPLOAD
 *
 * 목적:
 * - Instagram full-frame mp4를 Vercel Blob public direct URL로 업로드할 "준비"만 한다.
 * - deterministic immutable pathname, Instagram-only/variant/size/content-type guard,
 *   SDK put() 옵션 plan, no-upload plan builder를 제공한다.
 * - 실제 업로드(put 호출)는 이 slice에서 금지다. uploadInstagramBlob()은
 *   future approval token APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST 없이는 절대 성공하지 못한다(fail-closed).
 *
 * 불변 조건:
 * - 이 모듈은 import 시점에 env/network/credential 접근을 하지 않는다.
 * - plan builder는 순수 함수(side-effect free)다: 실제 파일 IO/네트워크/업로드 없음.
 * - @vercel/blob의 put()은 upload 경로에서만, 그것도 fail-closed 게이트를 통과한 뒤에만 참조된다.
 *   (이 slice에서는 게이트가 항상 막혀 있어 put()이 호출되지 않는다.)
 *
 * 계약 근거:
 * - docs/vercel-blob-instagram-integration-packet.md
 * - scripts/fixtures/vercel_blob_instagram_integration_packet.v1.json
 * - SDK: put(pathname, body, { access, addRandomSuffix, allowOverwrite, multipart, contentType })
 */

import type { PutBlobResult, PutCommandOptions } from "@vercel/blob";

// ── 상수 계약 ────────────────────────────────────────────────────────────────

/** 이 slice가 허용하는 유일한 platform. YouTube는 Blob/public URL을 쓰지 않는다. */
export const INSTAGRAM_BLOB_PLATFORM = "instagram" as const;

/** Blob 업로드 대상 유일 variant. YouTube letterbox 변형은 이 경로 대상이 아니다. */
export const INSTAGRAM_BLOB_VARIANT_ID = "instagram_reels_full_frame_1080x1920" as const;

/** deterministic pathname prefix. */
export const INSTAGRAM_BLOB_PATH_PREFIX = "instagram/reels" as const;

/** 허용 확장자 / content type. */
export const INSTAGRAM_BLOB_EXTENSION = "mp4" as const;
export const INSTAGRAM_BLOB_CONTENT_TYPE = "video/mp4" as const;

/** size guard: 35MB fail-closed cap (bytes). */
export const INSTAGRAM_BLOB_SIZE_CAP_BYTES = 35 * 1024 * 1024;

/** 실제 object upload를 허용하기 위한 future approval token. 이 slice에는 존재하지 않는다. */
export const INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN =
  "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST" as const;

export const INSTAGRAM_BLOB_UPLOAD_BLOCKED_ERROR =
  "INSTAGRAM_BLOB_UPLOAD_BLOCKED_NO_APPROVAL" as const;

// ── blocker / 타입 ───────────────────────────────────────────────────────────

export type InstagramBlobPlanBlockerCode =
  | "platform_not_instagram"
  | "variant_not_full_frame_1080x1920"
  | "extension_not_mp4"
  | "content_type_not_video_mp4"
  | "size_missing_or_invalid"
  | "size_exceeds_cap"
  | "content_id_missing"
  | "version_missing"
  | "sha256_missing_or_invalid";

export type InstagramBlobUploadBlockerCode =
  | "upload_not_owner_approved"
  | "object_upload_test_token_missing"
  | "plan_not_valid";

export interface InstagramBlobPlanInput {
  platform: string;
  variantId: string;
  contentId: string;
  version: string;
  /** mp4 콘텐츠 SHA-256 (hex 64자). pathname의 sha256_12는 앞 12자다. */
  sha256: string;
  sizeBytes: number;
  extension?: string;
  contentType?: string;
}

/** put()에 넘길 예정인 옵션 plan. 실제 put은 이 slice에서 호출하지 않는다. */
export interface InstagramBlobPutOptionPlan {
  access: "public";
  addRandomSuffix: false;
  allowOverwrite: false;
  multipart: true;
  contentType: typeof INSTAGRAM_BLOB_CONTENT_TYPE;
}

export interface InstagramBlobUploadPlan {
  ok: true;
  platform: typeof INSTAGRAM_BLOB_PLATFORM;
  variantId: typeof INSTAGRAM_BLOB_VARIANT_ID;
  pathname: string;
  sha256_12: string;
  sizeBytes: number;
  sizeCapBytes: number;
  putOptions: InstagramBlobPutOptionPlan;
  /** 이 slice에서는 항상 false. 실제 업로드가 계획에서 배제되었음을 표시한다. */
  uploadPerformed: false;
}

export interface InstagramBlobPlanFailure {
  ok: false;
  blockerCodes: InstagramBlobPlanBlockerCode[];
}

export type InstagramBlobPlanResult =
  | InstagramBlobUploadPlan
  | InstagramBlobPlanFailure;

// ── deterministic pathname builder ───────────────────────────────────────────

const SHA256_HEX_RE = /^[0-9a-f]{64}$/;

/**
 * deterministic immutable pathname:
 *   instagram/reels/{contentId}/{variantId}/{version}/{sha256_12}.mp4
 * 같은 (contentId, variantId, version, sha256_12)는 항상 같은 pathname으로 매핑된다.
 */
export function buildInstagramBlobPathname(args: {
  contentId: string;
  variantId: string;
  version: string;
  sha256: string;
}): string {
  const sha256_12 = args.sha256.slice(0, 12);
  return `${INSTAGRAM_BLOB_PATH_PREFIX}/${args.contentId}/${args.variantId}/${args.version}/${sha256_12}.${INSTAGRAM_BLOB_EXTENSION}`;
}

/** put()에 넘길 고정 옵션 plan. 결정론적 immutable 계약을 옵션으로 표현한다. */
export function instagramBlobPutOptionPlan(): InstagramBlobPutOptionPlan {
  return {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    multipart: true,
    contentType: INSTAGRAM_BLOB_CONTENT_TYPE,
  };
}

// ── plan builder (guard) ─────────────────────────────────────────────────────

/**
 * no-upload plan builder. 모든 guard를 통과하면 pathname + put 옵션 plan을 반환한다.
 * 하나라도 실패하면 blockerCodes와 함께 fail-closed(ok:false). 실제 업로드는 하지 않는다.
 */
export function planInstagramBlobUpload(
  input: InstagramBlobPlanInput
): InstagramBlobPlanResult {
  const blockerCodes: InstagramBlobPlanBlockerCode[] = [];

  if (input.platform !== INSTAGRAM_BLOB_PLATFORM) {
    blockerCodes.push("platform_not_instagram");
  }
  if (input.variantId !== INSTAGRAM_BLOB_VARIANT_ID) {
    blockerCodes.push("variant_not_full_frame_1080x1920");
  }

  const extension = input.extension ?? INSTAGRAM_BLOB_EXTENSION;
  if (extension !== INSTAGRAM_BLOB_EXTENSION) {
    blockerCodes.push("extension_not_mp4");
  }
  const contentType = input.contentType ?? INSTAGRAM_BLOB_CONTENT_TYPE;
  if (contentType !== INSTAGRAM_BLOB_CONTENT_TYPE) {
    blockerCodes.push("content_type_not_video_mp4");
  }

  if (
    typeof input.sizeBytes !== "number" ||
    !Number.isInteger(input.sizeBytes) ||
    input.sizeBytes <= 0
  ) {
    blockerCodes.push("size_missing_or_invalid");
  } else if (input.sizeBytes > INSTAGRAM_BLOB_SIZE_CAP_BYTES) {
    blockerCodes.push("size_exceeds_cap");
  }

  if (typeof input.contentId !== "string" || input.contentId.trim() === "") {
    blockerCodes.push("content_id_missing");
  }
  if (typeof input.version !== "string" || input.version.trim() === "") {
    blockerCodes.push("version_missing");
  }
  if (typeof input.sha256 !== "string" || !SHA256_HEX_RE.test(input.sha256)) {
    blockerCodes.push("sha256_missing_or_invalid");
  }

  if (blockerCodes.length > 0) {
    return { ok: false, blockerCodes };
  }

  return {
    ok: true,
    platform: INSTAGRAM_BLOB_PLATFORM,
    variantId: INSTAGRAM_BLOB_VARIANT_ID,
    pathname: buildInstagramBlobPathname({
      contentId: input.contentId,
      variantId: input.variantId,
      version: input.version,
      sha256: input.sha256,
    }),
    sha256_12: input.sha256.slice(0, 12),
    sizeBytes: input.sizeBytes,
    sizeCapBytes: INSTAGRAM_BLOB_SIZE_CAP_BYTES,
    putOptions: instagramBlobPutOptionPlan(),
    uploadPerformed: false,
  };
}

// ── upload (fail-closed) ─────────────────────────────────────────────────────

export interface InstagramBlobUploadResult {
  /** 이 slice에서는 항상 false. put()을 성공시킬 수 있는 코드 경로가 없다. */
  uploaded: boolean;
  error: typeof INSTAGRAM_BLOB_UPLOAD_BLOCKED_ERROR;
  blockerCodes: InstagramBlobUploadBlockerCode[];
  /** put()이 실제 실행되었다면 채워질 자리. 이 slice에서는 언제나 null. */
  result: PutBlobResult | null;
}

export interface InstagramBlobUploadAuthorization {
  /** future approval token. APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST가 아니면 무조건 거부. */
  approvalToken?: string;
  ownerApproved?: boolean;
}

/**
 * 실제 Blob object 업로드 진입점 — 이 slice에서는 무조건 fail-closed.
 *
 * 입력(authorization)이 approvalToken/ownerApproved를 담아 보내더라도 uploaded=true가 될 수 없다.
 * put()을 호출하는 코드 경로는 이 함수에 존재하지 않으며, env/credential resolution도 트리거하지 않는다.
 *
 * TODO(future Owner 승인 slice — APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST):
 *   승인 토큰 검증 + planInstagramBlobUpload 통과 + verified public URL 게이트 이후에만
 *   @vercel/blob put(pathname, body, plan.putOptions)를 호출하는 경로를 여기에 추가한다.
 *   그 전까지 이 함수는 입력과 무관하게 blocked다. credential/env 접근은 이 slice 범위 밖이다.
 */
export function uploadInstagramBlob(
  _plan: InstagramBlobPlanResult,
  _body?: unknown,
  _auth?: InstagramBlobUploadAuthorization
): InstagramBlobUploadResult {
  // 이 slice에는 put()을 성공시키는 경로가 없다. 항상 blocked를 반환한다.
  return {
    uploaded: false,
    error: INSTAGRAM_BLOB_UPLOAD_BLOCKED_ERROR,
    blockerCodes: [
      "upload_not_owner_approved",
      "object_upload_test_token_missing",
    ],
    result: null,
  };
}

/** put() 옵션 타입이 SDK 계약과 호환됨을 컴파일 타임에 확인하기 위한 참조. */
export type InstagramBlobPutCommandOptions = PutCommandOptions;
