// 사용: node dump-page.mjs <url> [시작문자열] [길이]  → 본문 텍스트 일부 출력
const [url, startKw, lenArg] = process.argv.slice(2);
const strip = (t) => String(t).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ");
const r = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (story-vetting)", "accept-language": "ko,en;q=0.8" } });
if (!r.ok) { console.log("HTTP", r.status, url); process.exit(0); }
const text = strip(await r.text());
let s = 0;
if (startKw) { const i = text.indexOf(startKw); if (i >= 0) s = i; }
console.log(`## ${url}\n${text.slice(s, s + Number(lenArg || 1500))}`);
