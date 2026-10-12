const urls = [
  "https://www.hankyung.com/it/article/2003061691081",
  "http://bizhankook.com/articles/20234.html",
  "https://www.newsis.com/view/NISX20221111_0002082675",
  "https://www.segye.com/newsView/20240116515186",
  "https://www.inews24.com/view/1258400",
  "https://m.dailian.co.kr/news/view/807157",
  "https://www.ddaily.co.kr/page/view/2011031315394398071",
  "https://www.traveltimes.co.kr/news/articleView.html?idxno=29077",
  "https://m.etnews.com/200210280197",
  "https://www.mt.co.kr/opinion/2020/06/26/2020062520044444620",
  "https://www.khan.co.kr/article/201302181132591",
  "https://m.etnews.com/201303260488",
  "https://www.seoul.co.kr/news/society/2014/09/05/20140905800018",
  "https://m.seoul.co.kr/news/life/2022/04/05/20220405500187",
  "https://mobile.newsis.com/view/NISX20220406_0001822771",
  "https://news.bizwatch.co.kr/article/consumer/2022/04/08/0008",
  "https://www.etoday.co.kr/news/view/2114841",
  "https://news.tf.co.kr/read/ogmeta/1926257.htm",
  "https://www.inews24.com/view/1457560",
  "https://www.ajunews.com/view/20220411150958674",
  "https://www.fnnews.com/news/202202230911072628",
  "https://www.khan.co.kr/article/201211131045267/amp",
  "https://www.koreatimes.co.kr/sports/20121111/eagles-hurler-eyes-big-deal",
  "https://osen.co.kr/article/G1109495968",
  "https://www.sisain.co.kr/news/articleView.html?idxno=28805",
  "https://www.sidae.com/article/2017031309328033277",
  "https://enter.etoday.co.kr/news/view/100420",
  "https://mbiz.heraldcorp.com/article/1277510",
  "https://www.newspim.com/news/view/20170330000191",
  "https://www.munhwa.com/article/11162360",
  "https://www.sidae.com/article/2017040514178056669",
];
for (const u of urls) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(u, { signal: ctl.signal, redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (story-vetting)", "accept-language": "ko,en;q=0.8" } });
    const txt = r.ok ? await r.text() : "";
    console.log(r.status, txt.length, u);
  } catch (e) { console.log("ERR", e.name === "AbortError" ? "timeout" : e.message, u); }
  finally { clearTimeout(t); }
}
