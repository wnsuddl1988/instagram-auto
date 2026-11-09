/**
 * upload-hard-block.ts — Golden Sample v3.2 Slice 0: upload hard block safety guard
 *
 * 목적: uploadReady=false / automationExpansionReady=false 금지 상태를 코드로 강제한다(fail-closed).
 * 이 모듈은 업로드를 허용하는 경로를 제공하지 않는다. 허용은 미래의 Owner 승인 slice에서
 * 서버측 upload readiness contract(fixture/ledger)가 추가된 뒤에만 가능하다.
 *
 * 불변 조건 (v3.2 production standard §8 / gap analysis H1·H2):
 * - 결정적 + side-effect free: env/network/credential/DB/파일 접근 없음, import 없음.
 * - 클라이언트 입력 불신: request body가 uploadReady / automationExpansionReady /
 *   ownerApproved 값을 true로 담아 보내더라도 allowed가 될 수 없다.
 *   입력은 인가 판단에 사용하지 않는다.
 */

export type UploadHardBlockBlockerCode =
  | "upload_not_owner_approved"
  | "upload_ready_false"
  | "automation_expansion_not_approved"
  | "server_side_upload_contract_missing";

export const UPLOAD_HARD_BLOCK_ERROR = "UPLOAD_BLOCKED_BY_GOLDEN_SAMPLE_GUARD" as const;

export interface UploadHardBlockResult {
  /**
   * 현재 계약에서는 항상 false다. boolean 타입인 이유는 미래 Owner 승인 slice에서
   * 서버측 contract 평가 경로가 추가될 확장 지점을 타입으로 유지하기 위함이며,
   * 이 slice에는 true를 만들 수 있는 코드 경로가 존재하지 않는다.
   */
  allowed: boolean;
  error: typeof UPLOAD_HARD_BLOCK_ERROR;
  uploadReady: false;
  automationExpansionReady: false;
  blockerCodes: UploadHardBlockBlockerCode[];
}

/**
 * 업로드 진입점(hard block) 평가. 무조건 blocked 결과를 반환한다.
 *
 * TODO(미래 Owner 승인 slice — gap analysis Slice 6 "upload readiness"):
 *   서버측 upload readiness fixture/ledger(money_shorts_owner_upload_approval_v1 확장 +
 *   v3.2 pre-upload 6게이트 결과 + owner_qa_pass)를 읽어 평가하는 경로를 여기에 추가한다.
 *   그 전까지 이 함수는 입력과 무관하게 fail-closed다. env/DB에서 승인을 읽는 구현은
 *   이 slice 범위 밖이며 별도 승인 없이 추가하지 않는다.
 */
export function evaluateGoldenSampleUploadHardBlock(
  _input?: unknown
): UploadHardBlockResult {
  return {
    allowed: false,
    error: UPLOAD_HARD_BLOCK_ERROR,
    uploadReady: false,
    automationExpansionReady: false,
    blockerCodes: [
      "upload_not_owner_approved",
      "upload_ready_false",
      "automation_expansion_not_approved",
      "server_side_upload_contract_missing",
    ],
  };
}
