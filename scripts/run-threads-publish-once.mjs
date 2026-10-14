#!/usr/bin/env node
/**
 * 스레드 게시 1회 (2026-10-13, Owner 승인: 규칙 34 배포 확장).
 * 래퍼로만 실행: node scripts/run-owner-command-with-local-env-no-log.mjs threads-publish \
 *   --content-unit <manifest> --blob-result <publish>/instagram-blob-upload-once-result.merged.json --out-dir <publish>/threads [--text-only] [--arm]
 * - 글: 콘텐츠 유닛 threadsText가 있으면 그대로, 없으면 instagramCaption에서 자동(500자 한도, 해시태그·출처·팔로우 줄 제외).
 *   링크트리 주소가 생기면 콘텐츠 유닛 threadsLink(또는 기본값 파일)로 끝에 붙인다.
 * - 영상: 인스타 게시 때 올린 Blob 공개 URL을 첨부(--text-only면 글만).
 * - 게시 전 토큰 자동 연장(_threads-common.mjs, 7일 주기). 같은 contentId 재게시는 차단. --arm 없으면 글 미리보기만.
 */
import fs from "node:fs";
import path from "node:path";
import { ensureFreshToken, buildThreadsText, threadsLength } from "./_threads-common.mjs";

const A = process.argv.slice(2);
const arg = (n) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : undefined; };
const ARM = A.includes("--arm"), TEXT_ONLY = A.includes("--text-only");
const CU = arg("--content-unit"), BLOB = arg("--blob-result"), OUT = arg("--out-dir");
const API = "https://graph.threads.net/v1.0";
const log = (m) => console.log(`[threads] ${m}`);
const die = (m, code = 1) => { console.error(`ABORT: ${m}`); process.exit(code); };
if (!CU || !BLOB || !OUT) die("--content-unit, --blob-result, --out-dir 필요", 2);

const unit = JSON.parse(fs.readFileSync(CU, "utf8"));
const blob = JSON.parse(fs.readFileSync(BLOB, "utf8"));
const videoUrl = blob.uploadedUrl;
if (!TEXT_ONLY && !/^https:\/\//.test(videoUrl ?? "")) die("blob-result에 uploadedUrl 없음", 2);
const DEFAULT_LINK_FILE = "C:/tmp/money-shorts-os/threads/default-link.txt";
const link = unit.threadsLink ?? (fs.existsSync(DEFAULT_LINK_FILE) ? fs.readFileSync(DEFAULT_LINK_FILE, "utf8").trim() : undefined);
const text = buildThreadsText(unit, { link });
const len = threadsLength(text);
if (!text || len > 500) die(`스레드 글 길이 이상(${len}자, 한도 500)`, 2);

fs.mkdirSync(OUT, { recursive: true });
const RESULT = path.join(OUT, "threads-publish-result.json");
if (fs.existsSync(RESULT)) {
  const prev = JSON.parse(fs.readFileSync(RESULT, "utf8"));
  if (prev.status === "PUBLISHED" && prev.contentId === unit.contentId) die(`이미 게시됨(${prev.permalink}) — 중복 게시 방지로 중단`, 3);
}
log(`contentId: ${unit.contentId} · 형식: ${TEXT_ONLY ? "글만" : "글+영상"} · 글 ${len}자${link ? " · 링크 포함" : " · 링크 없음"}`);
console.log("──── 스레드 글 미리보기 ────\n" + text + "\n────────────────────────");
if (!ARM) { log("--arm 없음 — 미리보기만(API 호출 없음)"); process.exit(0); }

let token = process.env.THREADS_ACCESS_TOKEN;
if (!token) die("THREADS_ACCESS_TOKEN 없음", 2);
token = await ensureFreshToken(token, log);
const scrub = (s) => String(s).split(token).join("***");
const call = async (method, p, params = {}) => {
  const u = new URL(`${API}/${p}`);
  const body = new URLSearchParams({ ...params, access_token: token });
  const r = method === "GET" ? await fetch(`${u}?${body}`) : await fetch(u, { method, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(scrub(`${method} ${p}: ${j.error?.message ?? r.status}`));
  return j;
};
const record = (o) => fs.writeFileSync(RESULT, JSON.stringify({ schemaVersion: "threads_publish_result_v1", contentId: unit.contentId, textLength: len, withVideo: !TEXT_ONLY, ...o, finishedAt: new Date().toISOString() }, null, 2));
try {
  const params = TEXT_ONLY ? { media_type: "TEXT", text } : { media_type: "VIDEO", video_url: videoUrl, text };
  const c = await call("POST", "me/threads", params);
  log(`컨테이너 생성: ${c.id} — 처리 대기`);
  record({ status: "CONTAINER", containerId: c.id });
  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, TEXT_ONLY ? 2000 : 6000));
    const s = await call("GET", c.id, { fields: "status,error_message" });
    if (s.status === "FINISHED") break;
    if (s.status === "ERROR" || s.status === "EXPIRED") throw new Error(`컨테이너 ${s.status}: ${s.error_message ?? ""}`);
    if (i % 3 === 0) log(`처리 중(${s.status})`);
    if (i === 59) throw new Error("컨테이너 처리 시간 초과");
  }
  const p = await call("POST", "me/threads_publish", { creation_id: c.id });
  const info = await call("GET", p.id, { fields: "permalink" }).catch(() => ({}));
  record({ status: "PUBLISHED", containerId: c.id, mediaId: p.id, permalink: info.permalink ?? null });
  console.log(`\n════════════════════════════════════════\n  스레드 게시 완료\n  mediaId: ${p.id}\n  링크:    ${info.permalink ?? "(조회 실패)"}\n  결과 기록: ${RESULT}\n════════════════════════════════════════`);
} catch (e) {
  record({ status: "FAILED", error: scrub(e.message) });
  die(scrub(e.message));
}
