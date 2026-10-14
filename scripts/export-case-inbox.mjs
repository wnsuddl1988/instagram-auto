#!/usr/bin/env node
/**
 * 경제번역소 CASE 내보내기(형식 v1, CASE 창 요청 2026-10-14) — 쇼츠 쪽 원자료를 읽어서
 * C:\Users\PC\jjy\econ-case\case-source\inbox\{story,money}\ 로 JSON을 쓴다. 쇼츠 저장소의 다른 파일은 읽기만 한다.
 *
 *   node scripts/export-case-inbox.mjs            # 내보낼 수 있는 편 전부 (완성 편 = scheduled, 게시 편 = published)
 *   node scripts/export-case-inbox.mjs --dry      # 쓰지 않고 요약만
 *   node scripts/export-case-inbox.mjs --only story-ep8,owl-int52
 *
 * 원자료(위치표: _ai/story-case-source-map-2026-10-14.md)
 *  - 나레이션 = TTS 대본(captionDisplayText = 화면에 나간 문장)
 *  - 스토리 사실 = 소재 검증 파일(C:/tmp/story-topic-vetting) 중 status "ok"·출처 2곳 이상·인용 있는 것만
 *  - 게시 정보 = 게시 폴더의 결과 파일(인스타·유튜브·페이스북·스레드), 스토리는 _ai/story-performance-ids.json과 대조
 *  - 보충 장부(선택) = _ai/case-facts/{story-ep{N}|owl-int{N}}.json — { facts, rules, deadlines } 를 덧붙인다(부엉박사 사실·제도·마감은 여기에만 있음)
 * 지어내지 않는다: 장부에 없는 값(numeric의 value·unit, eventDate)은 null로 둔다.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isTertiaryHost } from "./_story-script-standards.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const INBOX = "C:/Users/PC/jjy/econ-case/case-source/inbox";
const TMP = "C:/tmp";
const VETTING = `${TMP}/story-topic-vetting`;
const CURATED = path.join(ROOT, "_ai/case-facts");
const A = process.argv.slice(2);
const DRY = A.includes("--dry");
const ONLY = A.includes("--only") ? new Set(A[A.indexOf("--only") + 1].split(",")) : null;

// 스토리 1~15편 소재 검증 파일(게시 번호 기준, 위치표). 16편 이후는 story-ep{N}-*.json을 찾는다. 1편은 검증 파일이 없어 보충 장부(_ai/case-facts/story-ep1.json, 2026-10-14 사후 조사)만 쓴다.
const STORY_VETTING = {
  1: null, 2: "samsung-tokyo-declaration-1983", 3: "hyundai-500won-1971", 4: "daewoo-breakup-1999",
  5: "samsung-anycall-burning-1995", 6: "hyundai-warranty-90s", 7: "baemin-2019", 8: "lg-exit-2021",
  9: "hanaro-adsl-1999", 10: "yuhan-kimberly-4jo2gyo",
};
// Owner가 폐기한 스토리 편 — 완성본이 있어도 scheduled로 내보내지 않고 status "withdrawn"(+사유)으로 내보낸다(2026-10-14, CASE 창 문의로 발견한 오류).
const DISCARDED_STORY = { 4: "Owner 2026-10-10 폐기(만들고 나니 소재가 이상해 배포하지 않음) — 게시 예정 없음" };
// 부엉박사 통합 번호 → 파일 번호(_ai/episode-numbering-unified.md). 통합 46편 이전은 통합 번호 미부여라 제외.
const OWL_INTEGRATED = { 47: 25, 49: 26, 50: 27, 51: 28, 52: 29, 53: 30, 54: 31, 55: 32, 56: 33 };

const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null);
const kstNow = () => {
  const d = new Date(Date.now() + 9 * 3600e3).toISOString().replace("Z", "");
  return `${d.slice(0, 19)}+09:00`;
};
const kstDate = (iso) => (iso ? new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 10) : null);
const shortcodeOf = (permalink) => (/\/(?:reel|p)\/([^/?#]+)/.exec(permalink ?? "") ?? [])[1] ?? null;
const threadsCodeOf = (permalink) => (/\/post\/([^/?#]+)/.exec(permalink ?? "") ?? [])[1] ?? null;

function narrationFrom(ttsPath) {
  const t = readJson(ttsPath);
  if (!t) return { title: null, narration: null };
  const narration = t.scenes.map((s) => ({ scene: Number(s.sceneNumber), text: String(s.captionDisplayText ?? s.narration ?? "").trim() }));
  return { title: t.title ?? null, narration };
}

/** 게시 폴더들(이름이 prefix로 시작)에서 결과 파일을 모은다. 인스타 shortcode가 주어지면 그 게시물의 결과만 쓴다. */
function publishedFrom(prefix, wantIg) {
  const dirs = fs.readdirSync(TMP).filter((n) => n === prefix || n.startsWith(`${prefix}-v`)).map((n) => `${TMP}/${n}`);
  let ig = null; let yt = null; let fb = null; let th = null; let unit = null;
  for (const d of dirs) {
    const r = readJson(`${d}/owl-instagram-publish-result.json`);
    if (r?.status === "PUBLISHED" && (!wantIg || shortcodeOf(r.permalink) === wantIg)) ig = r;
    const y = readJson(`${d}/owl-youtube-publish-result.json`);
    if (y?.videoId) yt = y;
    const f = readJson(`${d}/facebook/facebook-reels-publish-result.json`);
    if (f?.status === "PUBLISHED") fb = f;
    const t = readJson(`${d}/threads/threads-publish-result.json`);
    if (t?.status === "PUBLISHED") th = t;
    unit = readJson(`${d}/owl-content-unit.json`) ?? unit;
  }
  return { ig, yt, fb, th, unit };
}

function storyFacts(ep) {
  let file = STORY_VETTING[ep];
  if (file === undefined) {
    const hit = fs.readdirSync(VETTING).find((n) => n.startsWith(`story-ep${ep}-`) && n.endsWith(".json"));
    file = hit ? hit.replace(/\.json$/, "") : null;
  }
  if (!file) return { facts: [], vettingFile: null, skipped: 0 };
  const v = readJson(`${VETTING}/${file}.json`);
  const all = v?.facts ?? [];
  // 위키 계열은 출처로 내보내지 않고 개수에도 안 센다(2026-10-14, 소재 검증 게이트와 같은 기준)
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^(www|m)\./, ""); } catch { return ""; } };
  const realSources = (f) => (f.sources ?? []).filter((s) => s.url && s.quote && !isTertiaryHost(hostOf(s.url)));
  const usable = all.filter((f) => f.status === "ok" && realSources(f).length >= 2);
  return {
    vettingFile: `${file}.json`,
    skipped: all.length - usable.length,
    facts: usable.map((f) => ({
      id: f.id,
      claim: f.claim,
      numeric: null, // 장부에 값·단위 칸이 없다(숫자 포함 여부만 hasNumber로 전달)
      hasNumber: Boolean(f.numeric),
      eventDate: null,
      sources: realSources(f).map((s) => ({ name: s.name, url: s.url, quote: s.quote })),
    })),
  };
}

function curated(key) {
  const c = readJson(path.join(CURATED, `${key}.json`));
  // 형식 v1: numeric = {value, unit, asOf} 또는 null, 숫자 포함 여부는 hasNumber(불리언). 장부에 불리언 numeric이 있으면 hasNumber로 옮긴다(2026-10-14 CASE G18).
  const facts = (c?.facts ?? []).map((f) => {
    if (typeof f.numeric !== "boolean") return { ...f, numeric: f.numeric ?? null, hasNumber: f.hasNumber ?? Boolean(f.numeric) };
    const { numeric, ...rest } = f;
    return { ...rest, numeric: null, hasNumber: f.hasNumber ?? numeric };
  });
  return { facts, rules: c?.rules ?? [], deadlines: c?.deadlines ?? [], corrections: c?.corrections ?? [] };
}

/** 같은 편 재내보내기는 덮어쓰기 — 단 정정 기록(corrections)은 이전 파일 것 + 보충 장부 것을 합친다(같은 date·factId·note는 하나로). */
function mergedCorrections(outPath, key) {
  const seen = new Set();
  return [...(readJson(outPath)?.corrections ?? []), ...curated(key).corrections].filter((c) => {
    const k = `${c.date}|${c.factId}|${c.note}`;
    return seen.has(k) ? false : (seen.add(k), true);
  });
}

function publishedBlock(p, idsEntry) {
  const igCode = idsEntry?.ig ?? shortcodeOf(p.ig?.permalink);
  const yt = idsEntry?.yt ?? p.yt?.videoId ?? null;
  if (!igCode && !yt) return null;
  return {
    date: kstDate(p.ig?.publishedAt ?? p.yt?.publishAt ?? null),
    ig: igCode ?? null,
    yt,
    fb: p.fb?.videoId ?? null,
    threads: threadsCodeOf(p.th?.permalink),
  };
}

function uniqueIds(facts) {
  const seen = new Set();
  return facts.filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)));
}

const out = [];
const ids = readJson(path.join(ROOT, "_ai/story-performance-ids.json"))?.episodes ?? [];

// ── 스토리 ──
for (let ep = 1; ep <= 40; ep += 1) {
  const key = `story-ep${ep}`;
  if (ONLY && !ONLY.has(key)) continue;
  const tts = `${TMP}/money-shorts-os/${key}-tts/${key}-tts-script.json`;
  if (!fs.existsSync(tts)) continue;
  const finalDone = fs.readdirSync(TMP).filter((n) => n.startsWith(`${key}-assembled`))
    .some((n) => fs.readdirSync(`${TMP}/${n}`).some((f) => /mastered.*\.mp4$/.test(f)));
  const idsEntry = ids.find((e) => e.ep === ep) ?? null;
  const p = publishedFrom(`${key}-publish`, idsEntry?.ig);
  const pub = idsEntry ? publishedBlock(p, idsEntry) : null;
  if (!pub && !finalDone) continue; // 완성 전 편은 내보내지 않는다
  const { title: workingTitle, narration } = narrationFrom(tts);
  const sf = storyFacts(ep);
  const c = curated(key);
  const outPath = `${INBOX}/story/${key}.json`;
  const title = p.unit?.youtubeTitle ?? p.unit?.title ?? null;
  out.push({
    outPath,
    note: `사실 ${sf.facts.length + c.facts.length}개(검증 파일 ${sf.vettingFile ?? "없음"}, 제외 ${sf.skipped})`,
    doc: {
      schemaVersion: 1, exportedAt: kstNow(), series: "story", ep,
      status: DISCARDED_STORY[ep] && !pub ? "withdrawn" : pub ? "published" : "scheduled",
      ...(DISCARDED_STORY[ep] && !pub ? { withdrawnReason: DISCARDED_STORY[ep] } : {}),
      published: pub,
      title: title ?? workingTitle,
      titleIsWorking: !title, // 게시 제목이 아직 없으면 제작용 제목(게시 때 바뀜)
      narration,
      facts: uniqueIds([...sf.facts, ...c.facts]),
      corrections: mergedCorrections(outPath, key),
    },
  });
}

// ── 부엉박사 통합편 ──
let batchDefs = [];
try { batchDefs = (await import(pathToFileURL(path.join(ROOT, "scripts/_owl-batch-1015-defs.mjs")).href)).OWL_BATCH_1015; } catch { /* 없으면 스펙에서 */ }
for (const [integratedStr, fileEp] of Object.entries(OWL_INTEGRATED)) {
  const integratedEp = Number(integratedStr);
  const key = `owl-int${integratedEp}`;
  if (ONLY && !ONLY.has(key)) continue;
  const tts = `${TMP}/money-shorts-os/owl-ep${fileEp}-tts/owl-ep${fileEp}-tts-script.json`;
  if (!fs.existsSync(tts)) continue;
  const p = publishedFrom(`owl-ep${fileEp}-publish`, null);
  const pub = p.ig || p.yt ? publishedBlock(p, null) : null;
  const finalDone = fs.existsSync(`${TMP}/owl-ep${fileEp}-final/owl_episode_final_mastered.mp4`);
  if (!pub && !finalDone) continue;
  let specTitle = batchDefs.find((d) => d.ep === fileEp)?.title ?? null;
  if (!specTitle) {
    const specPath = path.join(ROOT, `scripts/_owl-v2-ep${fileEp}-assembly-spec.mjs`);
    if (fs.existsSync(specPath)) {
      const mod = await import(pathToFileURL(specPath).href);
      specTitle = Object.values(mod).find((v) => v && typeof v === "object" && v.title)?.title ?? null;
    }
  }
  const { title: ttsTitle, narration } = narrationFrom(tts);
  const c = curated(key);
  const outPath = `${INBOX}/money/${key}.json`;
  // sourceHints(CASE 합의 10/14): 52편 이후, 정의 파일의 출처 이름만. CASE는 조사 출발점으로만 쓰고 근거로 쓰지 않는다.
  const rawSources = integratedEp >= 52 ? batchDefs.find((d) => d.ep === fileEp)?.sources : null;
  const splitTop = (s) => { // 괄호 밖의 · , 에서만 나눈다("발표 보도(뉴스핌·아시아경제)"는 한 덩어리)
    const parts = []; let cur = ""; let depth = 0;
    for (const ch of String(s)) {
      if ("(（".includes(ch)) depth += 1;
      if (")）".includes(ch)) depth = Math.max(0, depth - 1);
      if (depth === 0 && "·,".includes(ch)) { parts.push(cur); cur = ""; } else cur += ch;
    }
    return [...parts, cur].map((x) => x.trim()).filter(Boolean);
  };
  const sourceHints = rawSources ? [...new Set(splitTop(rawSources))] : [];
  const title = p.unit?.youtubeTitle ?? p.unit?.title ?? specTitle ?? ttsTitle;
  out.push({
    outPath,
    note: `사실 ${c.facts.length}개·제도 ${c.rules.length}개·마감 ${c.deadlines.length}개(보충 장부 ${fs.existsSync(path.join(CURATED, `${key}.json`)) ? "있음" : "없음"})`,
    doc: {
      schemaVersion: 1, exportedAt: kstNow(), series: "owl", integratedEp,
      status: pub ? "published" : "scheduled",
      published: pub,
      title,
      titleIsWorking: !(p.unit?.youtubeTitle ?? p.unit?.title ?? specTitle),
      narration,
      sourceHints,
      facts: uniqueIds(c.facts),
      rules: c.rules,
      deadlines: c.deadlines,
      corrections: mergedCorrections(outPath, key),
    },
  });
}

// ── 쓰기 전 기계 점검(형식 v1) ──
const problems = [];
for (const { outPath, doc } of out) {
  const name = path.basename(outPath);
  if (doc.status === "published" && (!doc.published?.date || !(doc.published.ig || doc.published.yt))) problems.push(`${name}: published인데 날짜·인스타/유튜브 ID 부족`);
  if (doc.status === "scheduled" && doc.published) problems.push(`${name}: scheduled인데 published 값 있음`);
  if (!doc.narration?.length || doc.narration.some((n) => !n.text)) problems.push(`${name}: 나레이션 비었음`);
  for (const f of doc.facts) if ((f.sources ?? []).length < 2) problems.push(`${name}: 사실 ${f.id} 출처 2곳 미만`);
  for (const f of doc.facts) if ((f.sources ?? []).some((s) => { try { return isTertiaryHost(new URL(s.url).hostname.replace(/^(www|m)\./, "")); } catch { return false; } })) problems.push(`${name}: 사실 ${f.id}에 위키 계열 출처 — 원문 출처로 바꿀 것`);
  for (const f of doc.facts) {
    if (f.numeric !== null && (typeof f.numeric !== "object" || !("value" in f.numeric))) problems.push(`${name}: 사실 ${f.id} numeric은 {value, unit, asOf} 또는 null이어야 함`);
    if (typeof f.hasNumber !== "boolean") problems.push(`${name}: 사실 ${f.id} hasNumber(불리언) 없음`);
  }
}

for (const { outPath, doc, note } of out) {
  const pub = doc.published ? `${doc.published.date} ig=${doc.published.ig} yt=${doc.published.yt} fb=${doc.published.fb ? "O" : "-"} th=${doc.published.threads ? "O" : "-"}` : "-";
  console.log(`${path.basename(outPath).padEnd(18)} ${doc.status.padEnd(9)} ${pub} | 장면 ${doc.narration.length} | ${note} | ${doc.title}${doc.titleIsWorking ? " (제작용 제목)" : ""}`);
}
if (problems.length) {
  console.error(`\nABORT: 형식 점검 실패 ${problems.length}건 — 아무것도 쓰지 않음\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
if (DRY) { console.log(`\n(--dry) ${out.length}개, 쓰지 않음`); process.exit(0); }
for (const { outPath, doc } of out) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const tmp = `${outPath}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(doc, null, 2)}\n`);
  fs.renameSync(tmp, outPath);
}
console.log(`\n${out.length}개 내보냄 → ${INBOX}`);
