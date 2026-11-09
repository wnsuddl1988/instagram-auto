#!/usr/bin/env node
/**
 * 스레드 토큰 읽기 전용 점검 (2026-10-13, Owner 승인: 스레드 자동 게시 준비).
 * 래퍼(run-owner-command-with-local-env-no-log.mjs threads-token-check --arm)로만 실행. 토큰 값은 출력하지 않는다. GET만.
 */
const ARM = process.argv.includes("--arm");
const TOKEN = process.env.THREADS_ACCESS_TOKEN;
if (!ARM) { console.log("--arm 없음 — 준비 확인만(호출 없음)"); process.exit(0); }
if (!TOKEN) { console.error("ABORT: THREADS_ACCESS_TOKEN 없음"); process.exit(2); }
const get = async (path, params = {}) => {
  const u = new URL(`https://graph.threads.net/v1.0/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("access_token", TOKEN);
  const r = await fetch(u);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${path}: ${j.error?.message ?? r.status}`.split(TOKEN).join("***"));
  return j;
};
try {
  const me = await get("me", { fields: "id,username,name" });
  console.log(`계정: @${me.username} (${me.name ?? ""}) id ${me.id}`);
  try {
    const lim = await get(`${me.id}/threads_publishing_limit`, { fields: "quota_usage,config" });
    const d = lim.data?.[0] ?? {};
    console.log(`게시 한도: 24시간 사용 ${d.quota_usage ?? "?"} / ${d.config?.quota_total ?? "?"}`);
  } catch (e) { console.log(`게시 한도 조회 실패(권한 확인 필요): ${e.message.slice(0, 140)}`); }
  console.log(/gyeongjebeonyeokso/.test(me.username ?? "") ? "✅ 경제번역소 스레드 계정 확인" : "⚠ 예상 계정(gyeongjebeonyeokso)과 다름");
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
