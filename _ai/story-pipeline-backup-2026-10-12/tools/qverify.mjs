// 사용: node qverify.mjs facts-ep16.json [...]  → 각 출처 인용문이 실제 페이지에 있는지(공백·문장부호 무시) 대조
import fs from "node:fs";
const norm = (t) => String(t).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/[\s"'“”‘’「」『』·,.\-–—…()\[\]]/g, "").toLowerCase();
const cache = new Map();
const get = async (u) => {
  if (!cache.has(u)) cache.set(u, (async () => {
    try { const r = await fetch(u, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (story-vetting)", "accept-language": "ko,en;q=0.8" } }); return r.ok ? await r.text() : `HTTP ${r.status}`; } catch (e) { return `ERR ${e.message}`; }
  })());
  return cache.get(u);
};
for (const f of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  console.log(`## ${f}`);
  for (const fact of j.facts) {
    const res = [];
    for (const s of fact.sources) {
      const t = await get(s.url);
      const bad = /^(HTTP|ERR)/.test(t);
      res.push(bad ? `접속불가(${t.slice(0, 20)})` : norm(t).includes(norm(s.quote)) ? "일치" : "원문에 없음");
    }
    console.log(`${fact.id} | ${res.join(" / ")} | ${fact.claim.slice(0, 40)}`);
  }
}
