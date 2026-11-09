#!/usr/bin/env node
/**
 * 페이스북 페이지 토큰 읽기 전용 점검 (2026-10-13, Owner 승인: 페이스북 릴스 자동 배포 준비).
 * 래퍼(run-owner-command-with-local-env-no-log.mjs facebook-page-token-check --arm)로만 실행한다.
 * 토큰 값은 출력하지 않는다. 출력: 토큰 종류·권한·만료, 접근 가능한 페이지 이름·ID, 경제번역소 페이지 토큰 확보 여부.
 * 게시·수정·삭제 호출 없음(GET만).
 */
const ARM = process.argv.includes("--arm");
const TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const API = "https://graph.facebook.com/v25.0";
if (!ARM) { console.log("--arm 없음 — 준비 확인만(호출 없음)"); process.exit(0); }
if (!TOKEN) { console.error("ABORT: FACEBOOK_PAGE_ACCESS_TOKEN 없음"); process.exit(2); }
const get = async (path, params = {}) => {
  const u = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("access_token", TOKEN);
  const r = await fetch(u);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${path}: ${j.error?.message ?? r.status}`.replace(TOKEN, "***"));
  return j;
};
try {
  const me = await get("me", { fields: "id,name" });
  console.log(`토큰 주체: ${me.name ?? "(이름 없음)"} (id ${me.id})`);
  try {
    const perms = await get("me/permissions");
    const granted = (perms.data ?? []).filter((p) => p.status === "granted").map((p) => p.permission);
    console.log(`권한(${granted.length}): ${granted.join(", ")}`);
    for (const need of ["pages_show_list", "pages_read_engagement", "pages_manage_posts"]) console.log(`  ${granted.includes(need) ? "✅" : "❌"} ${need}`);
  } catch (e) { console.log(`권한 조회 생략: ${e.message.slice(0, 120)}`); }
  const acc = await get("me/accounts", { fields: "id,name,tasks,access_token" });
  const pages = acc.data ?? [];
  console.log(`접근 가능한 페이지 ${pages.length}개`);
  for (const p of pages) console.log(`  - ${p.name} (id ${p.id}) 작업권한: ${(p.tasks ?? []).join(",")} 페이지토큰: ${p.access_token ? "있음" : "없음"}`);
  const target = pages.find((p) => /경제번역소/.test(p.name ?? ""));
  console.log(target ? `\n✅ 경제번역소 페이지 확인: id ${target.id}, 콘텐츠 작성 ${(target.tasks ?? []).includes("CREATE_CONTENT") ? "가능" : "확인 필요"}` : "\n❌ 경제번역소 페이지를 찾지 못함");
} catch (e) {
  console.error("ERROR:", e.message);
  process.exit(1);
}
