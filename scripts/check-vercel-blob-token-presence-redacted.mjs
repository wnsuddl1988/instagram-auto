#!/usr/bin/env node
/**
 * check-vercel-blob-token-presence-redacted.mjs
 *
 * BLOB_READ_WRITE_TOKEN의 runtime 존재 여부만 REDACTED로 확인한다.
 * task: vercel-blob-env-token-write-or-pull-v1
 *
 * 안전 계약 (절대 위반 금지):
 * - 토큰 값 / 길이 / prefix / suffix / hash / 일부 문자도 출력하지 않는다.
 * - 오직 boolean presence(있음/없음)만 stdout으로 보고한다.
 * - 파일 write 없음, network 없음, 다른 env 값 접근 없음.
 *
 * 사용:
 *   node scripts/check-vercel-blob-token-presence-redacted.mjs
 *   vercel env run -e production -- node scripts/check-vercel-blob-token-presence-redacted.mjs
 */

const NAME = "BLOB_READ_WRITE_TOKEN";

// 값 자체는 지역 변수에도 담지 않는다. 존재 여부(boolean)만 파생한다.
const present =
  Object.prototype.hasOwnProperty.call(process.env, NAME) &&
  typeof process.env[NAME] === "string" &&
  process.env[NAME].trim().length > 0;

// REDACTED 출력: 값/길이/prefix/suffix/hash 없음. presence boolean만.
const report = {
  name: NAME,
  present,
  valueRedacted: true,
  note: present
    ? "runtime에 토큰이 존재함(값은 읽지/출력하지 않음)."
    : "runtime에 토큰이 없음(이 실행 컨텍스트 기준).",
};

process.stdout.write(JSON.stringify(report) + "\n");
// presence 여부와 무관하게 정상 종료(0). 이 스크립트는 검사 도구이지 게이트가 아니다.
process.exit(0);
