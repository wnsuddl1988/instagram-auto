#!/usr/bin/env node
/**
 * 페이스북 페이지 릴스 게시 1회 (2026-10-13, Owner 승인: 채널 전략 규칙 34 — 배포 확장).
 * 래퍼로만 실행: node scripts/run-owner-command-with-local-env-no-log.mjs facebook-reels-publish \
 *   --content-unit <manifest> --blob-result <publish>/instagram-blob-upload-once-result.merged.json --out-dir <publish>/facebook [--arm]
 *
 * - 영상은 인스타 게시 때 이미 Blob에 올린 공개 URL(uploadedUrl)을 그대로 쓴다(추가 업로드 없음).
 * - 흐름(공식 Reels Publishing API): 페이지 토큰 확보 → video_reels start → rupload(file_url 헤더) → 처리 대기 → finish(PUBLISHED, description).
 * - 설명 = 콘텐츠 유닛의 instagramCaption(인스타와 같은 캡션).
 * - --arm 없으면 준비 확인만 하고 API를 부르지 않는다. 같은 contentId로 이미 PUBLISHED 결과가 있으면 다시 올리지 않는다(중복 게시 방지).
 * - 토큰 값은 출력·기록하지 않는다.
 */
import fs from "node:fs";
import path from "node:path";

const A = process.argv.slice(2);
const arg = (n) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : undefined; };
const ARM = A.includes("--arm");
const CU = arg("--content-unit"), BLOB = arg("--blob-result"), OUT = arg("--out-dir");
const API = "https://graph.facebook.com/v25.0";
const log = (m) => console.log(`[fb-reels] ${m}`);
const die = (m, code = 1) => { console.error(`ABORT: ${m}`); process.exit(code); };
if (!CU || !BLOB || !OUT) die("--content-unit, --blob-result, --out-dir 필요", 2);

const unit = JSON.parse(fs.readFileSync(CU, "utf8"));
const blob = JSON.parse(fs.readFileSync(BLOB, "utf8"));
const videoUrl = blob.uploadedUrl;
if (!/^https:\/\//.test(videoUrl ?? "")) die("blob-result에 uploadedUrl(공개 영상 URL)이 없음", 2);
if (blob.contentId && unit.contentId && blob.contentId !== unit.contentId) die(`contentId 불일치: unit ${unit.contentId} ≠ blob ${blob.contentId}`, 2);
const description = String(unit.instagramCaption ?? "").trim();
if (!description) die("콘텐츠 유닛에 instagramCaption 없음", 2);

fs.mkdirSync(OUT, { recursive: true });
const RESULT = path.join(OUT, "facebook-reels-publish-result.json");
if (fs.existsSync(RESULT)) {
  const prev = JSON.parse(fs.readFileSync(RESULT, "utf8"));
  if (prev.status === "PUBLISHED" && prev.contentId === unit.contentId) die(`이미 게시됨(videoId ${prev.videoId}) — 중복 게시 방지로 중단`, 3);
}

log(`contentId: ${unit.contentId}`);
log(`영상 URL: ${videoUrl}`);
log(`설명: ${description.length}자 (첫 줄: ${description.split("\n")[0].slice(0, 60)})`);
if (!ARM) { log("--arm 없음 — 준비 확인만 완료(API 호출 없음)"); process.exit(0); }

const userToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
if (!userToken) die("FACEBOOK_PAGE_ACCESS_TOKEN 없음", 2);
const scrub = (s) => String(s).split(userToken).join("***");
const call = async (method, url, { params = {}, headers = {}, token } = {}) => {
  const u = new URL(url);
  if (method === "GET") for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const body = method === "POST" && !headers.file_url ? new URLSearchParams(params) : undefined;
  const r = await fetch(u, { method, headers: { Authorization: `OAuth ${token}`, ...headers }, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(scrub(`${method} ${u.pathname}: ${j.error?.message ?? r.status}`).split(token).join("***"));
  return j;
};

const record = (o) => fs.writeFileSync(RESULT, JSON.stringify({ schemaVersion: "facebook_reels_publish_result_v1", contentId: unit.contentId, videoUrl, ...o, finishedAt: new Date().toISOString() }, null, 2));
try {
  const acc = await call("GET", `${API}/me/accounts`, { params: { fields: "id,name,access_token,tasks" }, token: userToken });
  const page = (acc.data ?? []).find((p) => (process.env.FACEBOOK_PAGE_ID ? p.id === process.env.FACEBOOK_PAGE_ID : /경제번역소/.test(p.name ?? "")));
  if (!page?.access_token) throw new Error("경제번역소 페이지 토큰을 찾지 못함");
  const pt = page.access_token;
  log(`페이지: ${page.name} (id ${page.id})`);

  const start = await call("POST", `${API}/${page.id}/video_reels`, { params: { upload_phase: "start" }, token: pt });
  const videoId = start.video_id;
  log(`업로드 세션 시작: videoId ${videoId}`);
  record({ status: "STARTED", pageId: page.id, videoId });

  await call("POST", `https://rupload.facebook.com/video-upload/v25.0/${videoId}`, { headers: { file_url: videoUrl }, token: pt });
  log("영상 URL 전달 완료 — 처리 대기");

  let st = null;
  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await call("GET", `${API}/${videoId}`, { params: { fields: "status" }, token: pt });
    st = s.status ?? {};
    const up = st.uploading_phase?.status, pr = st.processing_phase?.status;
    if (i % 3 === 0) log(`상태: 업로드 ${up ?? "-"} / 처리 ${pr ?? "-"} / 전체 ${st.video_status ?? "-"}`);
    if (up === "error" || pr === "error") throw new Error(`처리 오류: ${JSON.stringify(st).slice(0, 300)}`);
    if (up === "complete" && (pr === "complete" || st.video_status === "ready")) break;
  }

  const fin = await call("POST", `${API}/${page.id}/video_reels`, { params: { video_id: videoId, upload_phase: "finish", video_state: "PUBLISHED", description }, token: pt });
  if (fin.success !== true) throw new Error(`finish 응답 이상: ${JSON.stringify(fin).slice(0, 200)}`);
  const permalink = `https://www.facebook.com/reel/${videoId}`;
  record({ status: "PUBLISHED", pageId: page.id, videoId, permalink });
  console.log("\n════════════════════════════════════════");
  console.log(`  페이스북 릴스 게시 완료\n  videoId:  ${videoId}\n  링크:     ${permalink}\n  결과 기록: ${RESULT}`);
  console.log("════════════════════════════════════════");
} catch (e) {
  record({ status: "FAILED", error: scrub(e.message) });
  die(scrub(e.message));
}
