// 사용: node grep-page.mjs <url> <키워드1> <키워드2> ...  → 페이지 본문에서 키워드 주변 원문(±45자)을 최대 3개씩 보여 준다
const [url, ...kws] = process.argv.slice(2);
const strip = (t) => String(t).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/\s+/g, " ");
const r = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (story-vetting)", "accept-language": "ko,en;q=0.8" } });
if (!r.ok) { console.log("HTTP", r.status, url); process.exit(0); }
const text = strip(await r.text());
console.log(`## ${url} (${text.length}자)`);
for (const k of kws) {
  let i = 0, n = 0;
  const hits = [];
  while ((i = text.indexOf(k, i)) >= 0 && n < 3) { hits.push(text.slice(Math.max(0, i - 45), i + k.length + 60)); i += k.length; n++; }
  console.log(`- [${k}] ${hits.length ? "" : "없음"}`);
  hits.forEach((h) => console.log(`    …${h}…`));
}
