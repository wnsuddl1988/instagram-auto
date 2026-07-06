#!/usr/bin/env node
/**
 * plan-vercel-blob-instagram-upload-no-upload.mjs
 *
 * Vercel Blob Instagram upload plan — NO-UPLOAD dry planner.
 * task: vercel-blob-dependency-code-integration-no-upload-v1
 *
 * approved local Instagram/full-frame mp4를 read-only로 읽어
 * size / sha256 / deterministic pathname / put 옵션 plan만 만든다.
 *
 * 불변 조건 (이 slice):
 * - @vercel/blob import/호출 금지 (SDK 미참조).
 * - Blob object upload / list / head / get / delete / copy 금지.
 * - network / env / secret / token 접근 금지.
 * - 입력 mp4는 read-only(fs.readFile)로만 접근하고 수정하지 않는다.
 * - output은 작은 JSON evidence만 stdout으로 출력한다(파일 write 없음).
 */
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

// deterministic pathname 계약 (lib/instagram-blob-media.ts와 동일)
const PLATFORM = "instagram";
const VARIANT_ID = "instagram_reels_full_frame_1080x1920";
const PATH_PREFIX = "instagram/reels";
const EXTENSION = "mp4";
const CONTENT_TYPE = "video/mp4";
const SIZE_CAP_BYTES = 35 * 1024 * 1024;

// approved input (HANDOFF 지정)
const INPUT_PATH =
  "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
const EXPECTED_BYTES = 20294549;

// plan용 결정론적 식별자 (실제 콘텐츠 메타에서 유래; 이 planner에서는 고정 라벨 사용)
const CONTENT_ID = "t1_lifestyle_inflation";
const VERSION = "v3_2";

function buildPathname({ contentId, variantId, version, sha256 }) {
  const sha256_12 = sha256.slice(0, 12);
  return `${PATH_PREFIX}/${contentId}/${variantId}/${version}/${sha256_12}.${EXTENSION}`;
}

async function main() {
  const evidence = {
    task: "vercel-blob-dependency-code-integration-no-upload-v1",
    mode: "NO_UPLOAD_DRY_PLAN",
    platform: PLATFORM,
    variantId: VARIANT_ID,
    input: INPUT_PATH,
    expectedBytes: EXPECTED_BYTES,
    // side-effect 카운터 (전부 0이어야 정상)
    sideEffects: {
      blobSdkImported: false,
      objectUploadCount: 0,
      networkCallCount: 0,
      envSecretAccessCount: 0,
      fileWriteCount: 0,
    },
  };

  // read-only stat + read
  let st;
  try {
    st = await stat(INPUT_PATH);
  } catch (e) {
    evidence.status = "BLOCKED_INPUT_NOT_FOUND";
    evidence.detail = String(e).slice(0, 160);
    process.stdout.write(JSON.stringify(evidence, null, 2) + "\n");
    process.exit(2);
  }

  evidence.sizeBytes = st.size;
  evidence.sizeCapBytes = SIZE_CAP_BYTES;
  evidence.sizeMatchesExpected = st.size === EXPECTED_BYTES;
  evidence.withinSizeCap = st.size <= SIZE_CAP_BYTES;

  if (!evidence.withinSizeCap) {
    evidence.status = "BLOCKED_SIZE_EXCEEDS_CAP";
    process.stdout.write(JSON.stringify(evidence, null, 2) + "\n");
    process.exit(3);
  }

  // sha256 (read-only)
  const buf = await readFile(INPUT_PATH);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  evidence.sha256 = sha256;
  evidence.sha256_12 = sha256.slice(0, 12);

  // deterministic pathname + put option plan (실제 put 호출 없음)
  evidence.pathname = buildPathname({
    contentId: CONTENT_ID,
    variantId: VARIANT_ID,
    version: VERSION,
    sha256,
  });
  evidence.putOptionPlan = {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    multipart: true,
    contentType: CONTENT_TYPE,
  };

  evidence.status = "PLANNED_NO_UPLOAD";
  evidence.uploadPerformed = false;
  evidence.note =
    "size/hash/pathname/put-option plan만 생성함. @vercel/blob 미참조, upload/list/head/get/delete/copy 0, network/env 0, file write 0.";

  process.stdout.write(JSON.stringify(evidence, null, 2) + "\n");
}

main().catch((e) => {
  process.stderr.write("planner error: " + String(e) + "\n");
  process.exit(1);
});
