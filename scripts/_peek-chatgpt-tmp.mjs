import { chromium } from "playwright";
const b = await chromium.connectOverCDP("http://localhost:9222");
const pages = b.contexts().flatMap((c) => c.pages());
for (const p of pages) {
  if (!/chatgpt\.com/.test(p.url())) continue;
  await p.screenshot({ path: "C:/tmp/peek-chatgpt.png" });
  const t = await p.evaluate(() => document.body.innerText.slice(-700));
  console.log(p.url(), "\n", t);
}
await b.close();
