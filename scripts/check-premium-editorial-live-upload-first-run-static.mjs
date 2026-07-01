#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-live-upload-first-run-static.mjs
//
// LIVE UPLOAD FIRST-RUN RUNNER — STRUCTURE/SAFETY GUARD (no execution)
//
// 검증: runner가 안전 원칙을 코드 수준에서 지키는지.
//   - --arm 게이트로만 실제 업로드 활성화 (armed 없으면 preflight-only).
//   - preflight 통과 + credential ready + (instagram) public https url 있을 때만 upload.
//   - credential/token 원문을 record에 쓰지 않는다 (masked identifier만).
//   - 자동 재시도/자동 수정 루프 없음.
//   - Instagram public video_url 요구, 임의 hosting/Supabase 없음.
//   - DB/Supabase import 없음. env 파일 write 없음. repo 안 mp4/token write 없음.
//   - out-dir repo 밖 guard. shell:false.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUNNER_PATH = join(__dirname, "run-premium-editorial-live-upload-first-run-v1.mjs");
const SELF_PATH = join(__dirname, "check-premium-editorial-live-upload-first-run-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

let runnerText, selfText;
try {
  runnerText = readFileSync(RUNNER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read inputs: ${e.message}`);
  process.exit(2);
}

// ── § A. arm gate + upload conditionality ────────────────────────────────────
check("A-01: runner recognizes --arm flag", /args\.includes\(["']--arm["']\)/.test(runnerText));
check("A-02: upload attempts gated on status === 'ready_to_attempt'", /results\.youtube\.status === ["']ready_to_attempt["']/.test(runnerText) && /results\.instagram\.status === ["']ready_to_attempt["']/.test(runnerText));
check("A-03: not-armed path yields skipped_not_armed (no upload)", /skipped_not_armed/.test(runnerText));
check("A-04: base preflight failure blocks upload", /base_preflight_failed/.test(runnerText));

// ── § B. credential safety (masked only, no raw tokens in record) ─────────────
check("B-01: maskSecret helper present", /function maskSecret/.test(runnerText));
check("B-02: record uses masked token fields (accessTokenMasked)", /accessTokenMasked/.test(runnerText));
check("B-03: record does NOT write raw accessToken value into record object",
  !/record[\s\S]*rawAccessToken/.test(runnerText) && !/accessToken:\s*ytAccessToken/.test(runnerText));
check("B-04: note states tokens never written to record", /never written to this record/.test(runnerText));
check("B-05: credential resolution is read-only (resolveEnv, no env file write for secrets)", /function resolveEnv/.test(runnerText));

// ── § C. no auto-retry / no auto-fix loop ─────────────────────────────────────
// polling loop(<=24)은 허용되지만, 업로드 실패 후 재시도 루프는 없어야 한다.
check("C-01: no retry loop around youtube insert", !/for\s*\([^)]*\)\s*\{[\s\S]{0,400}videos\.insert/.test(runnerText));
check("C-02: single instagram publish (no retry around media_publish)", (runnerText.match(/media_publish/g) || []).length <= 2);
check("C-03: failure sets status=failed and does not re-enter upload", /results\.youtube\.status = ["']failed["']/.test(runnerText) && /results\.instagram\.status = ["']failed["']/.test(runnerText));

// ── § D. Instagram public url requirement, no arbitrary hosting ───────────────
check("D-01: instagram requires public https url", /blocked_public_video_url_required/.test(runnerText));
check("D-02: instagram url must be https", /\^https:\\\/\\\//.test(runnerText) || /\/\^https/.test(runnerText));
// note: runner는 "Supabase upload forbidden"이라는 금지 설명 문구를 담을 수 있으므로,
// 단순 포함이 아니라 실제 supabase 호출/import 형태만 감지한다.
check("D-03: no actual Supabase upload call/import in runner (only forbidden-wording allowed)",
  !/from\s+["'][^"']*supabase/i.test(runnerText) &&
  !/supabase[\s\S]{0,20}\.(from|storage|upload)\s*\(/i.test(runnerText) &&
  !/createClient\s*\(/.test(runnerText));
check("D-04: no arbitrary hosting/CDN upload call", !/cloudinary|s3\.upload|putObject|uploadToBucket/i.test(runnerText));

// ── § E. no DB, no env-file write, no repo artifact write ─────────────────────
check("E-01: no supabase/DB import", !/from\s+["'].*supabase/.test(runnerText) && !/updateGenerationStatus/.test(runnerText));
check("E-02: out-dir repo-root guard present", /outDirAbs\.startsWith\(REPO_ROOT/.test(runnerText));
check("E-03: record written only into outDirAbs (repo-outside)", /writeFileSync\(recordPath/.test(runnerText) && /join\(outDirAbs,/.test(runnerText));
check("E-04: no writeFileSync into repo scripts/output/mp4", !/writeFileSync\([^)]*\.mp4/.test(runnerText));
check("E-05: .env.local loader is read-only (readFileSync, no writeFileSync to .env)", !/writeFileSync\([^)]*\.env/.test(runnerText));
check("E-06: shell:false on spawnSync (ffprobe only)", /shell:\s*false/.test(runnerText));
check("E-07: only ffprobe spawned (no ffmpeg render/mux)", /spawnSync\(["']ffprobe["']/.test(runnerText) && !/spawnSync\(["']ffmpeg["']/.test(runnerText));

// ── § F. categoryId from metadata (not hardcoded 22) ──────────────────────────
check("F-01: youtube categoryId sourced from metadata (yt.categoryId)", /categoryId:\s*yt\.categoryId/.test(runnerText));
check("F-02: runner does NOT hardcode categoryId '22'", !/categoryId:\s*["']22["']/.test(runnerText));
check("F-03: preflight enforces categoryId === '27'", /youtube_shorts\?\.categoryId === ["']27["']/.test(runnerText));

// ── § G. stale wording preflight ──────────────────────────────────────────────
check("G-01: preflight rejects stale 2025.01", /no stale '2025\.01'/.test(runnerText));
check("G-02: preflight rejects pink noise", /pink noise/i.test(runnerText));

// ── self-guard ────────────────────────────────────────────────────────────────
check("H-01: guard does NOT import googleapis/openai/playwright", !/(import|require)[^\n]*['"`](googleapis|openai|playwright)['"`]/.test(selfText));

// ── result ──────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  LIVE UPLOAD FIRST-RUN RUNNER — STRUCTURE/SAFETY GUARD`);
console.log(`══════════════════════════════════════════════════════════`);
for (const r of results) {
  console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
}
console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}  |  PASS : ${pass.length}  |  FAIL : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);
if (fail.length > 0) {
  console.error(`GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) console.error(`  FAIL  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  process.exit(1);
} else {
  console.log(`GUARD OK: live upload first-run runner structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
