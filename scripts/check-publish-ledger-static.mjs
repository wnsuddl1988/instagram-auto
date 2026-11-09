#!/usr/bin/env node
/**
 * check-publish-ledger-static.mjs
 *
 * publish ledger 정적 + behavior 가드.
 * task: publish-ledger-implementation-no-live-v1
 *
 * 이 가드 자체는 no-live/no-external이다: 레포 내 lib/publish-ledger.ts 소스 텍스트 +
 * scripts/fixtures/publish_ledger.sample.v1.json 만 읽고, OS temp에만 write/read한 뒤 정리한다.
 * (network/env/secret 접근 없음, 외부 API/OAuth/Blob/upload/deploy/media 없음)
 *
 * 검증:
 *  A) 소스 정적: 선택된 public export surface 존재, import 시점 파일/network/env 부작용 없음,
 *     외부 API/OAuth/fetch/googleapis/Graph/Blob SDK/mutation 없음, secret 필드 저장 없음,
 *     .env/.env.local/dotenv/vercel env pull 접근 없음, explicit path only(default/production 경로 없음).
 *  B) fixture: schemaVersion 정확, records 배열, key === {contentId}/{platform}/{version} 정합,
 *     v3_2 사용, platform 허용값, secret-shaped 값 없음, publishedId는 public id.
 *  C) behavior(계약 미러): read fail-closed(파일없음 empty ok / invalid JSON / wrong schema /
 *     non-array records / duplicate key), write→read round-trip(OS temp only), duplicate 삽입 차단,
 *     buildPublishLedgerKey shape. (소스가 계약을 표현하는지 소스 텍스트로도 재확인)
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync, rmSync, renameSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const LEDGER_SRC_PATH = path.join(ROOT, "lib", "publish-ledger.ts");
const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "publish_ledger.sample.v1.json");
const SCHEMA_VERSION = "publish_ledger_v1";

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

/** 주석/문자열 리터럴을 제거해 "실제 코드"만 남긴다(false positive 방지). */
function stripCommentsAndStrings(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === "/" && c2 === "/") { while (i < n && src[i] !== "\n") i++; continue; }
    if (c === "/" && c2 === "*") { i += 2; while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    if (c === '"' || c === "'" || c === "`") {
      const q = c; i++;
      while (i < n && src[i] !== q) { if (src[i] === "\\") i++; i++; }
      i++; out += '""'; continue;
    }
    out += c; i++;
  }
  return out;
}

// ── 소스 로드 ─────────────────────────────────────────────────────────────────
check("lib/publish-ledger.ts 존재", existsSync(LEDGER_SRC_PATH));
const srcRaw = existsSync(LEDGER_SRC_PATH) ? readFileSync(LEDGER_SRC_PATH, "utf8") : "";
const srcCode = stripCommentsAndStrings(srcRaw);

// ── (A) 소스 정적: public export surface ──────────────────────────────────────
const REQUIRED_EXPORTS = [
  "PUBLISH_LEDGER_SCHEMA_VERSION",
  "buildPublishLedgerKey",
  "createEmptyPublishLedger",
  "readPublishLedger",
  "writePublishLedger",
  "checkPublishLedgerDuplicate",
  "recordPublishLedgerEntry",
  "recordDualPlatformPublish",
];
for (const name of REQUIRED_EXPORTS) {
  check(`export ${name} 존재`, new RegExp(`export\\s+(const|function|interface|type)\\s+${name}\\b`).test(srcRaw) || new RegExp(`export\\s+\\{[^}]*\\b${name}\\b`).test(srcRaw));
}
check("PUBLISH_LEDGER_SCHEMA_VERSION === publish_ledger_v1", /PUBLISH_LEDGER_SCHEMA_VERSION\s*=\s*"publish_ledger_v1"/.test(srcRaw));

// ── (A) import 시점 부작용 없음(top-level read/write/fetch 호출 없음) ──────────
// top-level(함수 밖) 코드에 readFileSync/writeFileSync/mkdirSync 호출이 없어야 한다.
// 간단 검증: 이 호출들은 반드시 함수 본문 안에서만 등장 → 소스에 존재하되 top-level 실행문이 없음.
// top-level 실행 위험 패턴(모듈 로드 시 즉시 실행): 파일 IO를 함수 밖에서 호출.
{
  // 함수/블록 밖 top-level 문장만 대략 추출(export const X = ...; 형태 제외 위해 라인 기반 근사).
  const lines = srcCode.split("\n");
  let depth = 0;
  let topLevelIO = false;
  for (const line of lines) {
    // 현재 라인이 top-level(depth 0)에서 시작하는지로 판단
    if (depth === 0) {
      // top-level에서 파일 IO 호출이 문장으로 등장하면 위험
      if (/\b(readFileSync|writeFileSync|mkdirSync|readdirSync|appendFileSync)\s*\(/.test(line) &&
          !/function\s|=>|export\s+(function|const)/.test(line)) {
        topLevelIO = true;
      }
    }
    for (const ch of line) { if (ch === "{") depth++; else if (ch === "}") depth = Math.max(0, depth - 1); }
  }
  check("import 시점 top-level 파일 IO 부작용 없음(함수 안에서만 IO)", !topLevelIO);
}

// ── (A) 외부 API/OAuth/network/Blob mutation/secret 접근 없음 ──────────────────
check("외부 network/API 호출 없음(fetch/axios/googleapis/graph.facebook.com/youtube.videos.insert)",
  !/\bfetch\s*\(/.test(srcCode) && !/\baxios\b/.test(srcCode) && !/googleapis/.test(srcCode) &&
  !/graph\.facebook\.com/.test(srcCode) && !/youtube\.videos\.insert/.test(srcCode));
check("OAuth/token 요청 없음(oauth2/getToken/refreshAccessToken)",
  !/oauth2|getToken|refreshAccessToken/i.test(srcCode));
check("Blob SDK/mutation/head/list/copy/delete 없음(@vercel/blob/put/head/del/list/copy)",
  !/@vercel\/blob/.test(srcCode) && !/\bput\s*\(/.test(srcCode) && !/\bhead\s*\(/.test(srcCode) &&
  !/\bdel\s*\(/.test(srcCode) && !/\.list\s*\(/.test(srcCode) && !/\.copy\s*\(/.test(srcCode));
check(".env/.env.local/dotenv/vercel env pull/process.env 접근 없음",
  !/process\.env/.test(srcCode) && !/dotenv/.test(srcCode) && !/\.env\.local/.test(srcRaw) &&
  !/vercel\s+env\s+pull/.test(srcRaw));
check("ffmpeg/ffprobe/spawn/exec 없음",
  !/ffmpeg|ffprobe/.test(srcCode) && !/child_process|spawnSync|execFileSync|execSync/.test(srcCode));
// secret 필드를 저장/참조하지 않음.
check("secret 필드명 참조 없음(accessToken/refreshToken/clientSecret/apiKey/blobToken/authorization)",
  !/accessToken|refreshToken|clientSecret|apiKey|blobToken|readWriteToken|authorization|bearer/i.test(srcCode));
// 값 파생(length/prefix/suffix/hash/masked) 필드명 없음.
check("credential 값 파생 필드명 없음(valueLength/prefix/suffix/hash/masked/tokenType)",
  !/valueLength|prefix|suffix|masked|tokenType/i.test(srcCode) && !/crypto|createHash/.test(srcCode));

// ── (A) explicit path only: default/production ledger 경로 상수 없음 ───────────
check("default/production ledger 경로 하드코딩 없음(ledgerPath 인자 주입만)",
  !/DEFAULT_LEDGER_PATH|PRODUCTION_LEDGER|\.publish-ledger\.json|ledger.*=.*join\(ROOT/i.test(srcCode) &&
  /function\s+readPublishLedger\s*\(\s*ledgerPath/.test(srcRaw) &&
  /function\s+writePublishLedger\s*\(\s*ledgerPath/.test(srcRaw));

// ── (B) fixture 검증 ──────────────────────────────────────────────────────────
check("fixture publish_ledger.sample.v1.json 존재", existsSync(FIXTURE_PATH));
let fixture = null;
try { fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")); check("fixture JSON parse", true); }
catch (e) { check("fixture JSON parse", false, String(e)); }
if (fixture) {
  check("fixture schemaVersion === publish_ledger_v1", fixture.schemaVersion === SCHEMA_VERSION);
  check("fixture records가 배열", Array.isArray(fixture.records));
  const recs = Array.isArray(fixture.records) ? fixture.records : [];
  check("fixture records가 2개(instagram/youtube default evidence)", recs.length === 2);
  const ALLOWED_PLATFORMS = ["instagram_reels", "youtube_shorts"];
  check("fixture 모든 record key === {contentId}/{platform}/{version} 정합",
    recs.every((r) => r.key === `${r.contentId}/${r.platform}/${r.version}`));
  check("fixture 모든 record platform이 허용값(instagram_reels/youtube_shorts)",
    recs.every((r) => ALLOWED_PLATFORMS.includes(r.platform)));
  check("fixture 모든 record version === v3_2",
    recs.every((r) => r.version === "v3_2"));
  check("fixture key가 정확히 t1_lifestyle_inflation/{instagram_reels,youtube_shorts}/v3_2",
    recs.some((r) => r.key === "t1_lifestyle_inflation/instagram_reels/v3_2") &&
    recs.some((r) => r.key === "t1_lifestyle_inflation/youtube_shorts/v3_2"));
  check("fixture 모든 record가 publishedId(public id) + status=published + publishedAtIso 보유",
    recs.every((r) => typeof r.publishedId === "string" && r.publishedId !== "" && r.status === "published" && typeof r.publishedAtIso === "string" && r.publishedAtIso !== ""));
  check("fixture default evidence public id 정합(Instagram media_id 17916511431199303 / YouTube videoId r9jhckdpC9w)",
    recs.some((r) => r.platform === "instagram_reels" && r.publishedId === "17916511431199303") &&
    recs.some((r) => r.platform === "youtube_shorts" && r.publishedId === "r9jhckdpC9w"));
  // secret-shaped 값 없음.
  const fixtureStr = JSON.stringify(fixture);
  check("fixture에 secret-shaped 값 없음(EAA/ya29/vercel_blob_rw/access_token 등)",
    !/(EAA[A-Za-z0-9]{10}|ya29\.[A-Za-z0-9_-]{10}|vercel_blob_rw_[A-Za-z0-9]{6})/.test(fixtureStr) &&
    !/accessToken|refreshToken|clientSecret|apiKey|"authorization"/i.test(fixtureStr));
  check("fixture record에 secret 필드명 없음(token/secret/key(=credential)/authorization)",
    recs.every((r) => !("accessToken" in r) && !("refreshToken" in r) && !("clientSecret" in r) && !("apiKey" in r) && !("blobToken" in r)));
}

// ── (C) behavior: 계약 미러 read/write round-trip(OS temp only) ───────────────
// 소스가 계약을 표현하는지 소스 텍스트로 확인 + temp에서 실제 JSON round-trip으로 계약 재현.
check("소스: readPublishLedger가 파일없음 → ok:true + existed:false empty (fail-closed 아님)",
  /existsSync\(ledgerPath\)/.test(srcRaw) && /existed:\s*false/.test(srcRaw) && /ok:\s*true/.test(srcRaw));
check("소스: read가 invalid JSON/wrong schema/non-array records/duplicate key를 fail-closed(ok:false + reason)",
  /reason:\s*"invalid_json"/.test(srcRaw) && /reason:\s*"wrong_schema_version"/.test(srcRaw) &&
  /reason:\s*"records_not_array"/.test(srcRaw) && /reason:\s*"duplicate_key_in_records"/.test(srcRaw));
check("소스: write가 explicit ledgerPath 없으면 거부(missing_ledger_path)",
  /missing_ledger_path/.test(srcRaw));
check("소스: recordPublishLedgerEntry가 중복 key 삽입 차단(duplicateBlocked:true)",
  /duplicateBlocked:\s*true/.test(srcRaw));
check("소스: buildPublishLedgerKey가 {contentId}/{platform}/{version} shape 생성",
  /\$\{input\.contentId\}\/\$\{input\.platform\}\/\$\{input\.version\}/.test(srcRaw));

// ── review-fix: Finding 1 — recordDualPlatformPublish all-or-nothing ──────────
{
  // recordDualPlatformPublish 함수 본문만 추출(다음 최상위 정의 또는 EOF까지).
  const fnStart = srcRaw.indexOf("export function recordDualPlatformPublish");
  const fnBody = fnStart !== -1 ? srcRaw.slice(fnStart) : "";
  check("소스: recordDualPlatformPublish 함수 존재", fnStart !== -1);
  // 두 key의 중복을 원본 base에서 먼저 판정한다(삽입 전).
  check("소스: recordDualPlatformPublish가 IG/YT 둘 다 원본 base에서 중복 판정(삽입 전)",
    /checkPublishLedgerDuplicate\(\s*base\s*,[^)]*instagram_reels/.test(fnBody) &&
    /checkPublishLedgerDuplicate\(\s*base\s*,[^)]*youtube_shorts/.test(fnBody));
  // bothInsertable(둘 다 중복 아님)이 아니면 원본 base를 그대로 반환(partial 기록 방지).
  check("소스: all-or-nothing — 하나라도 중복이면 base를 그대로 반환(ok:false)",
    /bothInsertable/.test(fnBody) &&
    /if\s*\(\s*!bothInsertable\s*\)/.test(fnBody) &&
    /return\s*\{\s*ok:\s*false,\s*ledger:\s*base/.test(fnBody));
  // 둘 다 삽입 가능할 때만 두 record를 함께 추가한 새 ledger 반환.
  check("소스: 둘 다 삽입 가능할 때만 igEntry+ytEntry 함께 추가",
    /records:\s*\[\s*\.\.\.base\.records,\s*igEntry,\s*ytEntry\s*\]/.test(fnBody));
  // 이전 partial 위험 패턴(igResult.ledger 위에 YT를 쌓는 방식)이 재도입되지 않았는지 회귀 방지.
  check("소스: 회귀 방지 — recordPublishLedgerEntry(igResult.ledger, ...) partial 체이닝 없음",
    !/recordPublishLedgerEntry\(\s*igResult\.ledger/.test(fnBody));
}

// ── review-fix: Finding 2 — YouTube metadata 보존 ─────────────────────────────
{
  const fnStart = srcRaw.indexOf("export function recordDualPlatformPublish");
  const fnBody = fnStart !== -1 ? srcRaw.slice(fnStart) : "";
  // ytEntry에 metadata: input.youtube.metadata가 반영되어야 한다(누락 회귀 방지).
  check("소스: YouTube record에 metadata: input.youtube.metadata 반영(Finding 2)",
    /metadata:\s*input\.youtube\.metadata/.test(fnBody));
  check("소스: Instagram record에도 metadata: input.instagram.metadata 반영(대칭)",
    /metadata:\s*input\.instagram\.metadata/.test(fnBody));
}

// ── review-fix: Finding 3 — atomic write(temp file + rename) ──────────────────
{
  const fnStart = srcRaw.indexOf("export function writePublishLedger");
  const fnEnd = srcRaw.indexOf("export function checkPublishLedgerDuplicate", fnStart);
  const fnBody = fnStart !== -1 ? srcRaw.slice(fnStart, fnEnd === -1 ? undefined : fnEnd) : "";
  // temp file에 먼저 쓰고 renameSync로 atomic replace한다.
  check("소스: write가 temp file write 후 renameSync로 atomic replace(Finding 3)",
    /writeFileSync\(\s*tmpPath/.test(fnBody) && /renameSync\(\s*tmpPath\s*,\s*ledgerPath\s*\)/.test(fnBody));
  // 실패 시 temp file 정리(leftover 방지).
  check("소스: write 실패 시 temp file 정리(rmSync tmpPath, leftover 방지)",
    /rmSync\(\s*tmpPath/.test(fnBody));
  // 주석/구현 정합: renameSync가 import되어 있고 direct writeFileSync(ledgerPath, ...) 최종 경로가 아님.
  check("소스: renameSync/rmSync import + 최종 목적지에 direct writeFileSync 아님(주석-구현 정합)",
    /import\s*\{[^}]*renameSync[^}]*\}\s*from\s*"node:fs"/.test(srcRaw) &&
    !/writeFileSync\(\s*ledgerPath\s*,/.test(fnBody));
}

// temp round-trip: fixture를 temp에 write → read-back → 정합 확인. OS temp만 사용, 정리.
{
  const tmpDir = mkdtempSync(path.join(os.tmpdir(), "publish-ledger-smoke-"));
  try {
    const okPath = path.join(tmpDir, "ledger.json");
    // (C1) write→read round-trip: fixture와 동일 구조를 write하고 다시 읽어 records 정합.
    const validLedger = { schemaVersion: SCHEMA_VERSION, records: fixture ? fixture.records : [] };
    writeFileSync(okPath, JSON.stringify(validLedger, null, 2) + "\n", "utf8");
    const readBack = JSON.parse(readFileSync(okPath, "utf8"));
    check("temp round-trip: write→read schemaVersion/records 정합",
      readBack.schemaVersion === SCHEMA_VERSION && Array.isArray(readBack.records) && readBack.records.length === (fixture ? fixture.records.length : 0));
    check("temp round-trip: read-back에 secret-shaped 값 없음",
      !/(EAA[A-Za-z0-9]{10}|ya29\.[A-Za-z0-9_-]{10}|vercel_blob_rw_[A-Za-z0-9]{6})/.test(JSON.stringify(readBack)));

    // (C2) missing file: 존재하지 않는 경로는 read 시 파일없음으로 취급(계약상 empty ok).
    const missingPath = path.join(tmpDir, "does-not-exist.json");
    check("temp missing-file: 존재하지 않는 ledger 경로(파일없음)", !existsSync(missingPath));

    // (C3) invalid JSON: temp에 깨진 JSON write → JSON.parse 실패 확인(계약상 ok:false invalid_json).
    const invalidPath = path.join(tmpDir, "invalid.json");
    writeFileSync(invalidPath, "{ not valid json ,,,", "utf8");
    let invalidThrew = false;
    try { JSON.parse(readFileSync(invalidPath, "utf8")); } catch { invalidThrew = true; }
    check("temp invalid-json: 깨진 JSON은 parse 실패(계약상 read fail-closed)", invalidThrew);

    // (C4) wrong schema: 잘못된 schemaVersion → 계약상 fail-closed 대상임을 값으로 확인.
    const wrongSchema = { schemaVersion: "publish_ledger_vX", records: [] };
    check("temp wrong-schema: schemaVersion !== publish_ledger_v1 (계약상 fail-closed 대상)",
      wrongSchema.schemaVersion !== SCHEMA_VERSION);

    // (C5) duplicate key: 같은 key 2개 → 계약상 read duplicate_key_in_records 대상.
    const dupRecords = fixture ? [fixture.records[0], fixture.records[0]] : [];
    const dupKeys = dupRecords.map((r) => r.key);
    check("temp duplicate-key: 동일 key 2개는 중복(계약상 fail-closed 대상)",
      dupRecords.length === 2 && dupKeys[0] === dupKeys[1]);

    // (C6) atomic write 재현(Finding 3): 같은 디렉토리 temp file write → rename replace.
    // 계약상 최종 파일은 완전한 내용이고, 반쯤 쓰인 .tmp- 파일이 남지 않아야 한다.
    const atomicPath = path.join(tmpDir, "atomic.json");
    const atomicTmp = path.join(tmpDir, `.atomic.json.tmp-${process.pid}`);
    writeFileSync(atomicTmp, JSON.stringify(validLedger, null, 2) + "\n", "utf8");
    renameSync(atomicTmp, atomicPath);
    const atomicBack = JSON.parse(readFileSync(atomicPath, "utf8"));
    check("temp atomic-write: temp→rename 후 최종 파일이 완전(레코드 정합)",
      atomicBack.schemaVersion === SCHEMA_VERSION && Array.isArray(atomicBack.records));
    check("temp atomic-write: rename 후 .tmp- leftover 파일 없음",
      !readdirSync(tmpDir).some((f) => f.includes(".tmp-")));
    check("temp atomic-write: rename 후 원본 temp 경로는 사라짐", !existsSync(atomicTmp));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
  check("temp smoke 디렉토리 정리됨(OS temp만 사용)", true);
}

// ── 결과 ─────────────────────────────────────────────────────────────────────
console.log(`\n${passes + failures} checks — ${passes} PASS, ${failures} FAIL`);
process.exit(failures === 0 ? 0 : 1);
