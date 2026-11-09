/**
 * 콘텐츠 유닛에 그 편 주제에 맞는 계산기 링크를 넣는다(Owner 2026-10-14, _calc-links.mjs 매핑).
 *  - youtubeDescription: "내 금액으로 바로 계산" 블록(계산기 이름 + 추적 주소)을 챕터/포인트 위에 넣는다.
 *  - threadsLink: 스레드 글 끝에 붙는 링크를 이 계산기 추적 주소로 지정한다(없으면 링크트리 기본값).
 *  - 인스타 캡션은 링크가 눌리지 않아 건드리지 않는다.
 * 쓰기 전에 주소를 실제로 열어(200·정식 주소 일치) 확인한다 — 안 열리면 ABORT, 아무것도 쓰지 않는다.
 * 이미 들어 있으면 그대로 둔다(멱등). 기본은 미리보기(--write 없이는 파일을 바꾸지 않는다).
 * 매핑이 없는 편은 "연결 계산기 없음"으로 끝낸다(종료 코드 0).
 *
 *   node scripts/patch-content-unit-calc-link.mjs --content-unit <path.json> [--ep <파일번호>] [--write] [--no-check]
 */
import fs from "node:fs";
import { OWL_CALC_LINKS, calcBaseUrl, calcTrackedUrl, fileEpFrom } from "./_calc-links.mjs";

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const file = flag("--content-unit");
const write = args.includes("--write");
const noCheck = args.includes("--no-check");
if (!file || !fs.existsSync(file)) { console.error("사용법: --content-unit <content-unit.json> [--ep N] [--write]"); process.exit(2); }

const cu = JSON.parse(fs.readFileSync(file, "utf8"));
const ep = fileEpFrom(cu.contentId, flag("--ep"));
const entry = ep != null ? OWL_CALC_LINKS[ep] : null;
if (!entry) {
  console.log(`연결 계산기 없음(contentId ${cu.contentId}, 파일 번호 ${ep ?? "미확인"}) — 링크트리 기본 링크 유지. 맞는 계산기가 생기면 scripts/_calc-links.mjs에 추가.`);
  process.exit(0);
}

const base = calcBaseUrl(entry.slug);
const ytUrl = calcTrackedUrl(entry.slug, "youtube", ep);
const thUrl = calcTrackedUrl(entry.slug, "threads", ep);

if (!noCheck) {
  try {
    const r = await fetch(ytUrl, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (link-check)" } });
    const html = await r.text();
    const canonical = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1] ?? /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i.exec(html)?.[1];
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    if (!r.url.startsWith(base)) throw new Error(`다른 주소로 이동됨: ${r.url}`);
    if (canonical && canonical !== base) throw new Error(`정식 주소(canonical)가 다름: ${canonical}`);
    console.log(`- 링크 열림 확인: ${base} → 200${canonical ? " · 정식 주소 일치" : " · canonical 태그 못 찾음(확인 권장)"}`);
  } catch (e) {
    console.error(`ABORT: 계산기 링크 확인 실패(${e.message}) — 저장하지 않음. 주소·슬러그를 다시 확인할 것.`);
    process.exit(1);
  }
}

let changed = false;
if (typeof cu.youtubeDescription === "string" && cu.youtubeDescription.trim() !== "") {
  if (cu.youtubeDescription.includes(`/tools/${entry.slug}`)) {
    console.log("- youtubeDescription: 이미 계산기 링크 있음");
  } else {
    const lines = cu.youtubeDescription.split("\n");
    const block = [entry.cta, ytUrl, ""];
    let at = lines.findIndex((l) => l.trim() === "챕터");
    if (at < 0) at = lines.findIndex((l) => l.trim() === "이 영상 포인트");
    if (at < 0) at = lines.findIndex((l) => l.includes("이번 주 경제번역"));
    if (at < 0) at = lines.length;
    cu.youtubeDescription = [...lines.slice(0, at), ...block, ...lines.slice(at)].join("\n");
    console.log(`- youtubeDescription: 계산기 링크 추가("${entry.cta}")`);
    changed = true;
  }
}
if (cu.threadsLink === thUrl) {
  console.log("- threadsLink: 이미 지정됨");
} else {
  cu.threadsLink = thUrl;
  console.log(`- threadsLink: ${thUrl}`);
  changed = true;
}
cu.calculatorLink = { fileEp: ep, slug: entry.slug, label: entry.label };

if (changed && write) {
  fs.writeFileSync(file, JSON.stringify(cu, null, 2) + "\n", "utf8");
  console.log("저장 완료:", file);
} else if (changed) {
  console.log("(미리보기 — --write 로 저장)");
}
