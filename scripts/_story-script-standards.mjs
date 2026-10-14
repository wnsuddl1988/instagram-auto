/**
 * 스토리형 대본 기준 검사 (2026-10-07, 규칙 27 "실수는 기억이 아니라 게이트로").
 * 기준 원문 = `_ai/story-format-structure-v1.md` §2-0(주요 템플릿 = 꼭 이룰 것)·§4(금지 목록).
 *
 * ★ 2026-10-07 오후 개정(Owner "주요 템플릿만 정해놓자는 거지, 그 안에 어떤 구조로 대본을 정형화하자는 말이 아니잖아",
 *   "시간은 75~90초를 권장, 강력하게 막을 필요는 없어"): 길이·장면 수·전환 문장 수·마무리 형식은 **권장(warn)**으로 내리고,
 *   반드시 수정(fix)은 ① 사실·표현 금지 목록(설명형 문구·세대 전제·투자 권유·존댓말) ② **지난 편과 같은 문장 틀 반복**
 *   ③ (TTS 단계) 설계 파일 누락·미완성·출처 1곳뿐인 사실 — 에만 건다. 형식을 강제하지 않고, 반복과 건너뛰기를 막는다.
 *
 * ★ 2026-10-07 밤 개정(v3, 올림픽 2편 v2~v13 반려 총정리 — Owner "대본이 맥락이 있어야지"): 설계 파일이 있으면
 *   ④ 맥락 게이트(checkStoryContext)도 반드시 수정 — 줄거리(spine) 6칸, 첫 문장에 주인공·무슨 일, 장면마다 앞 문장과의 연결,
 *   (독자 검수 — 지금 대본 hash로 한 3연령 새 독자 점검 — 는 2026-10-08 Owner 지시로 폐지.) "반전 뒤 더 놀라운 것" 필수 칸은 정형화라 삭제.
 *
 * 반드시 수정(fix) = Owner에게 보이기 전에 고친다. 확인 권장(warn) = 사람이 원문으로 다시 확인.
 */

import fs from "node:fs";
import crypto from "node:crypto";

/**
 * ★★★ 2026-10-11 밤 개정(v4, Owner "이 구조를 기본 베이스로 — 검사기 기준 자체를 지금 대본 구조로 변경"):
 *   기준 구조 = 11~15편 확정본(11 포스코 v7 · 12 디즈니 v5 · 13 쿠쿠 v7 · 14 닌텐도 v10 · 15 한진해운 v8)이고,
 *   원문은 `_ai/story-script-rules.md` 맨 위 "기본 베이스 구조(절대규칙)"와 Owner 9원칙이다.
 *   이 기준이 검사하는 것(checkStoryBaseStructure): 결말(결과)을 훅에 주지 않음 · 날짜(연도) 3개 이하 · 질문 고리 · 사실 연속 구간 ·
 *   마지막 장면 팔로우 · 장면 14~18 / 450~560자. 단독 출처 숫자·퍼즐의 답·"넘어갈 수 없는 이유"의 질은 기계가 못 보므로
 *   설계 파일(열린 고리 표·숫자별 2출처)과 사람(Owner 시점 2회 읽기)이 본다. 검사기 통과 ≠ 규칙 준수(Owner 10/11).
 */
export const STORY_SCRIPT_STANDARDS_VERSION = "story_script_standards_v4_base_structure_2026_10_11";

// ── 기본 베이스 구조(11~15편 확정본에서 뽑은 것) ──
export const STORY_BASE_STRUCTURE = [
  "1 훅: 시청자에게 걸린 사건·미스터리 한 컷(주인공+상황+이상한 점), 결말(결과)은 말하지 않는다",
  "2 퍼즐 질문: 왜·어떻게·누가 — 답이 사료에 있는 질문",
  "3 맥락·배경 2~4장면: 누가·무엇이 불리한가, 경제 번역 한 문장(장애물이 왜 생겼나)",
  "4 장애물·위기 숫자 + 열린 고리(질문 또는 '그런데')",
  "5 선택·결정적 장면: 주체의 선택(날짜 단독 짧은 장면 가능)",
  "6 전환·반전",
  "7 결과·숫자: 결말은 여기서 처음 드러난다(끝에 가깝게)",
  "8 마무리 1장면: 의미 한 줄 + 팔로우",
];
const YEAR_RE = /(1[89]\d{2}|20\d{2})\s?년/g;
const RESULT_RE = /(흑자|1위|성공|해냈|이겼|살렸|들어섰|올랐|돌아섰|우승|대박|세계적)/;
const OPEN_LOOP_RE = /[?？]|(그런데|하지만|그러다|그러자|그럼|도대체|까\.)/;
export const STORY_EPISODE_LEDGER_PATH = "lib/source-facts/story-episode-ledger.json";

const chars = (t) => t.replace(/[^\p{L}\p{N}]/gu, "").length;

// §4-1 설명형·투자속보식 훅/구조 표식(스토리형에서는 쓰지 않는다)
const EXPLAINER_MARKERS = [
  [/안녕[,.\s]/, "오프닝 인사(스토리형은 인사 없음)"],
  [/콕\s?집어/, "설명형 문구 '콕 집어'"],
  [/정리하면/, "설명형 정리 문구"],
  [/(^|\s)(첫째|둘째|셋째)[,\s]/, "목록식 전개(첫째·둘째)"],
  [/쉽게 풀면/, "설명형 문구 '쉽게 풀면'"],
  [/알고 있었어\?|줄 알지\?|줄 알았지\?/, "설명형 훅 템플릿(규칙 17 T1~T5)"],
  [/저장해\s?(둬|두고)/, "설명형 저장 유도"],
];
// §4-6 특정 세대·상황 전제
const AGE_PREMISE = [/그 시절/, /기억나\??/, /너희 집/, /우리 때/, /요즘 애들/];
// §4-7 투자 권유로 읽히는 표현
const INVEST = [/사\s?둬/, /사\s?놔/, /사야\s?해/, /투자해\s?봐/, /담아\s?둬/, /매수/, /금이 답/, /지금이 기회/, /사는 게 맞/, /사는 쪽/, /금을 사[.,?!\s]|금을 사$/];
// 말투: 부엉박사 반말(존댓말 다큐체 금지)
const POLITE = /(습니다|십시오|세요|어요|아요|에요|예요|해요|죠\.)/;
// 긴장·전환 표식(권장 참고용 — 형식 강제 아님)
const TURN = /(그런데|하지만|그러다|그러자|더 놀라운|진짜 반전|그리고\s?\d|그리고 [가-힣]+년)/;

// ── 지난 편과 같은 문장 틀 반복 ──
// 숫자는 #로 바꾸고 글자·숫자만 남겨 비교한다("1998년의 한국이야" ≈ "1981년의 한국이야").
// 공통 부분 길이 ≥ REPEAT_FIX 이면 반드시 수정, ≥ REPEAT_WARN 이면 확인 권장. 기능 문구는 예외.
const REPEAT_FIX = 10;
const REPEAT_WARN = 7;
const REPEAT_ALLOW = [/댓글로알려줘/g, /댓글로남겨줘/g];
const norm = (t) => {
  let s = String(t).replace(/[0-9][0-9,.]*/g, "#").replace(/[^\p{L}#]/gu, "");
  for (const re of REPEAT_ALLOW) s = s.replace(re, "");
  return s;
};
function longestCommon(a, b) {
  if (!a || !b) return { len: 0, text: "" };
  let best = 0;
  let end = 0;
  const prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    let diagPrev = 0;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = prev[j];
      prev[j] = a[i - 1] === b[j - 1] ? diagPrev + 1 : 0;
      if (prev[j] > best) {
        best = prev[j];
        end = i;
      }
      diagPrev = tmp;
    }
  }
  return { len: best, text: a.slice(end - best, end) };
}

export function loadStoryLedger(root = process.cwd()) {
  const p = `${root}/${STORY_EPISODE_LEDGER_PATH}`;
  if (!fs.existsSync(p)) return [];
  const ledger = JSON.parse(fs.readFileSync(p, "utf8"));
  return (ledger.episodes ?? [])
    .filter((e) => e.scenesPath && fs.existsSync(e.scenesPath))
    .map((e) => ({ ...e, scenes: JSON.parse(fs.readFileSync(e.scenesPath, "utf8")).map((x) => (typeof x === "string" ? x : x.narration)) }));
}

const samePath = (a, b) => a && b && String(a).replace(/\\/g, "/").toLowerCase() === String(b).replace(/\\/g, "/").toLowerCase();

/**
 * 기본 베이스 구조 게이트(v4). 11~15편 확정본이 모두 통과하는 기준만 fix로 둔다.
 *  - 훅(첫 2장면)이 결말을 말하면 fix (Owner 9원칙 4: 결과를 처음에 던지면 "아~" 하고 넘어간다)
 *  - 날짜(서로 다른 연도) 4개 이상이면 fix (연표 나열, 규칙 2~3개)
 *  - 마지막 장면에 팔로우 유도가 없으면 fix
 *  - 질문 장면이 하나도 없으면 fix (퍼즐 없는 대본)
 *  - 열린 고리 없이 6장면 넘게 이어지면 warn(이탈 구간)
 *  - 결말이 처음 드러나는 위치를 알려 준다(끝에 가까워야 함)
 */
export function checkStoryBaseStructure(scenes) {
  const fix = [];
  const warn = [];
  const ok = [];
  const n = scenes.length;
  // 1) 훅이 결말을 말하는가
  const head = scenes.slice(0, 2);
  head.forEach((t, i) => {
    if (RESULT_RE.test(t)) fix.push(`s${i + 1} 훅이 결말(결과)을 말함 — 기본 베이스는 사건·미스터리로 시작하고 결말은 끝까지 쥔다(Owner 9원칙 4): "${t}"`);
  });
  if (!head.some((t) => RESULT_RE.test(t))) ok.push("훅이 결말을 말하지 않음");
  const firstResult = scenes.findIndex((t) => RESULT_RE.test(t));
  if (firstResult >= 0) {
    if (firstResult + 1 <= Math.ceil(n * 0.4)) warn.push(`결말 표현이 s${firstResult + 1}(전체 ${n}장면 중 앞 40% 안)에서 처음 나옴 — 결말은 끝에 가깝게`);
    else ok.push(`결말 표현이 처음 나오는 장면 s${firstResult + 1}/${n}`);
  }
  // 2) 날짜(연도) 개수
  const years = new Set();
  for (const t of scenes) for (const m of String(t).matchAll(YEAR_RE)) years.add(m[1]);
  if (years.size >= 4) fix.push(`연도 ${years.size}개(${[...years].sort().join("·")}) — 날짜는 2~3개(연표 나열 금지). "그해·이듬해·3년 만에"로 이어 간다`);
  else ok.push(`연도 ${years.size}개`);
  // 3) 질문(퍼즐) 장치
  const qs = scenes.map((t, i) => (/[?？]/.test(t) ? i + 1 : null)).filter(Boolean);
  if (!qs.length) fix.push("질문 장면이 없음 — 기본 베이스는 퍼즐(왜·어떻게·누구)을 한 번 이상 던지고 답을 뒤에서 준다");
  else if (qs.length === 1) warn.push(`질문 장면이 1개(s${qs[0]}) — 보통 2개 이상(훅 직후 퍼즐 + 위기 지점)`);
  else ok.push(`질문 장면 ${qs.length}개(s${qs.join(",s")})`);
  // 4) 열린 고리 없이 길게 이어지는 구간
  let run = 0;
  let worst = { len: 0, from: 0 };
  let start = 0;
  scenes.forEach((t, i) => {
    if (OPEN_LOOP_RE.test(t)) { run = 0; start = i + 1; return; }
    run += 1;
    if (run > worst.len) worst = { len: run, from: start + 1 };
  });
  if (worst.len >= 6) warn.push(`열린 고리(질문·전환) 없이 ${worst.len}장면 연속(s${worst.from}~s${worst.from + worst.len - 1}) — 이탈 구간. 질문·장애물·"그런데"로 끊어 준다`);
  else ok.push(`열린 고리 없는 연속 구간 최대 ${worst.len}장면`);
  // 5) 마무리 = 의미 한 줄 + 팔로우
  const last = scenes[n - 1] ?? "";
  if (!/팔로우/.test(last)) fix.push(`마지막 장면에 팔로우 유도가 없음(의미 한 줄 + 팔로우): "${last}"`);
  else ok.push("마지막 장면에 팔로우 유도");
  if (chars(last) > 100) warn.push(`마지막 장면 ${chars(last)}자 — 의미는 한 줄로(권장 100자 이하)`);
  return { fix, warn, ok };
}

export function checkStoryScriptStandards({ scenes, scenesPath = null, priorEpisodes = [], design = null, requireDesign = false }) {
  const fix = [];
  const warn = [];
  const ok = [];
  const n = scenes.length;
  const total = scenes.reduce((s, t) => s + chars(t), 0);

  // 분량 — 기본 베이스(11~15편: 15~18장면, 461~557자)
  if (total < 400 || total > 640) fix.push(`글자 수 ${total}자 — 기본 베이스는 450~560자(11~15편 확정본 461~557자). 400자 미만은 재료 부족(보강 조사), 640자 초과는 90초를 넘긴다`);
  else if (total < 450 || total > 560) warn.push(`글자 수 ${total}자 — 기본 베이스 450~560자(75~90초) 밖`);
  else ok.push(`글자 수 ${total}자(기본 베이스 범위)`);
  if (n < 10 || n > 24) fix.push(`장면 ${n}개 — 기본 베이스는 14~18장면(11~15편 15~18개)`);
  else if (n < 14 || n > 19) warn.push(`장면 ${n}개 — 기본 베이스 14~18장면 밖`);
  else ok.push(`장면 ${n}개`);

  // ★ 기본 베이스 구조 게이트(v4) — 결말 선공개·날짜 나열·질문 고리·팔로우
  const base = checkStoryBaseStructure(scenes);
  fix.push(...base.fix);
  warn.push(...base.warn);
  ok.push(...base.ok);

  // 금지 목록 — 반드시 수정
  scenes.forEach((t, i) => {
    for (const [re, label] of EXPLAINER_MARKERS) if (re.test(t)) fix.push(`s${i + 1} ${label}: "${t}"`);
    if (AGE_PREMISE.some((re) => re.test(t))) fix.push(`s${i + 1} 세대·상황 전제(독자 = 인스타 20~40대 + 유튜브 전 연령): "${t}"`);
    if (INVEST.some((re) => re.test(t))) fix.push(`s${i + 1} 투자 권유로 읽힘: "${t}"`);
    if (POLITE.test(t)) fix.push(`s${i + 1} 존댓말(부엉박사 반말 유지): "${t}"`);
  });

  // 긴장 — 기본 베이스는 질문·'그런데' 등 열린 고리로 끌고 간다(마무리는 질문이 아니라 의미 한 줄 + 팔로우)
  const turns = scenes.filter((t) => TURN.test(t)).length;
  const loops = scenes.filter((t) => OPEN_LOOP_RE.test(t)).length;
  if (loops < 3) warn.push(`열린 고리(질문·전환) ${loops}회 — 기본 베이스(11~15편)는 3회 이상. 장면마다 '넘어갈 수 없는 이유'가 있는지 열린 고리 표로 확인`);
  else ok.push(`열린 고리(질문·전환) ${loops}회`);
  if (turns === 0) warn.push("'그런데·하지만' 같은 전환 표식 0회 — 질문·단서로 끌고 가는 구조라면 괜찮지만 이탈 구간이 없는지 확인");

  // 지난 편과 같은 문장 틀 — 반드시 수정(≥10자) / 확인 권장(≥7자)
  const others = priorEpisodes.filter((e) => !samePath(e.scenesPath, scenesPath));
  let repeatHits = 0;
  scenes.forEach((t, i) => {
    const a = norm(t);
    let best = { len: 0 };
    for (const e of others) {
      e.scenes.forEach((u, j) => {
        const c = longestCommon(a, norm(u));
        if (c.len > best.len) best = { ...c, ep: e.episode, sj: j + 1, other: u };
      });
    }
    if (best.len >= REPEAT_FIX) {
      repeatHits += 1;
      fix.push(`s${i + 1} 스토리 ${best.ep}편 s${best.sj}와 같은 문장 틀("${best.text}") — 지난 편 틀 반복 금지(§2-0): "${t}" / 지난 편: "${best.other}"`);
    } else if (best.len >= REPEAT_WARN) {
      warn.push(`s${i + 1} 스토리 ${best.ep}편 s${best.sj}와 일부 겹침("${best.text}") — 틀 반복인지 확인: "${t}"`);
    }
  });
  if (others.length) {
    if (!repeatHits) ok.push(`지난 편 ${others.length}개와 같은 문장 틀 없음`);
  } else {
    warn.push("비교할 지난 편 없음(story-episode-ledger.json 확인)");
  }

  // 참고 경고(사실 확인 유도)
  const first = scenes[0] ?? "";
  if (chars(first) > 60) warn.push(`s1 ${chars(first)}자 — 첫 2초에 장면이 들어오는지 확인(훅은 한 컷, 길면 두 장면으로 나눈다)`);
  scenes.forEach((t, i) => {
    if (/(한국뿐|나라뿐|우리뿐|뿐인 나라|유일|최초|처음으로)/.test(t)) warn.push(`s${i + 1} '유일·최초' 주장 — 지금 기준으로 다시 확인(금 모으기 "한국뿐" 정정 사례): "${t}"`);
    if (/(선뜻|기부|헌납|바쳤|아무 대가)/.test(t)) warn.push(`s${i + 1} 기증 성격 표현 — 실제 성격(기증/매각) 원문 확인(금 모으기는 매각): "${t}"`);
    if (/(흑자|이익|수익|남긴|남았)/.test(t)) warn.push(`s${i + 1} 결산·수익 표현 — 숫자 구성(기부금·보조금 포함 여부)까지 원문 확인(§4-7-1, 올림픽 흑자 사례): "${t}"`);
    if (/덕분에|때문에 (위기|빚)/.test(t)) warn.push(`s${i + 1} 인과 표현 — 사실 아닌 인과인지 확인(§4-4): "${t}"`);
  });

  // 설계 파일 — TTS 단계에서는 필수
  if (design) {
    const d = checkStoryDesign(design);
    fix.push(...d.fix.map((m) => `설계: ${m}`));
    warn.push(...d.warn.map((m) => `설계: ${m}`));
    if (!d.fix.length) ok.push("설계 파일 필수 항목·출처 확인");
    const c = checkStoryContext(design, scenes);
    fix.push(...c.fix.map((m) => `맥락: ${m}`));
    warn.push(...c.warn.map((m) => `맥락: ${m}`));
    if (!c.fix.length) ok.push("맥락(줄거리·첫 문장·장면 연결) 확인");
  } else if (requireDesign) {
    fix.push("설계 파일 없음 — TTS 스크립트 JSON에 storyDesignPath(관심·긴장·주체의 선택·반전·의미·사실 출처·지난 편과 다른 점) 필요(§5 1-3, §9)");
  }

  return { character: "story", n, total, fix, warn, ok, hash: storyScenesHash(scenes), version: STORY_SCRIPT_STANDARDS_VERSION };
}

// ── 설계 파일(§9) 검사: 형식이 아니라 "생각을 건너뛰지 않았는지"와 "출처"를 본다 ──
const filled = (v) => typeof v === "string" ? v.trim().length >= 4 : Array.isArray(v) ? v.length > 0 : !!v;
export function checkStoryDesign(d) {
  const fix = [];
  const warn = [];
  const need = [
    ["interest.hook", d?.interest?.hook, "관심 — 고른 훅"],
    ["interest.candidates", Array.isArray(d?.interest?.candidates) && d.interest.candidates.length >= 2 ? d.interest.candidates : null, "관심 — 비교한 훅 후보 2개 이상"],
    ["interest.whyChosen", d?.interest?.whyChosen, "관심 — 이 훅을 고른 이유(훅 점검표 결과)"],
    ["tension", Array.isArray(d?.tension) && d.tension.length ? d.tension : null, "긴장 — 이야기가 쉽게 안 풀리는 지점(1개 이상)"],
    ["choice", d?.choice, "주체의 선택 — 누가 무엇을 결정·행동했나"],
    ["reversal.result", d?.reversal?.result, "반전 — 예상을 뒤집는 결과"],
    ["meaning", d?.meaning, "의미 — 시청자가 들고 갈 한 줄"],
    ["differentFromPrevious", d?.differentFromPrevious, "지난 편과 무엇이 다른가(순서·훅·뼈대·마무리)"],
    ["improvedFrom", d?.improvedFrom, "벤치마크·지난 편에서 무엇을 응용해 더 좋게 했나"],
  ];
  for (const [key, val, label] of need) if (!filled(val)) fix.push(`${label} 비어 있음(${key})`);
  const facts = Array.isArray(d?.facts) ? d.facts : [];
  if (!facts.length) fix.push("사실 목록(facts) 비어 있음 — 대본에 쓴 숫자·인과·성격마다 출처");
  for (const f of facts) {
    const srcs = Array.isArray(f.sources) ? f.sources.filter(Boolean) : [];
    if (f.status === "excluded") continue;
    // Owner가 출처 1곳짜리를 명시적으로 쓰라고 한 경우(approvalQuote 필수) — 대본에 출처·"추산" 표기를 남기고 보고서에 명시
    if (srcs.length < 2 && f.ownerApproved === true && filled(f.approvalQuote)) continue;
    if (srcs.length < 2) fix.push(`사실 "${f.claim ?? f.id}" 출처 ${srcs.length}곳 — 2곳 이상이거나 status "excluded"(대본에서 뺌)`);
  }
  if (d?.politicalCheck == null) warn.push("정치색 점검(politicalCheck) 기록 없음(§6-1)");
  return { fix, warn };
}

// ── 소재 검증 게이트(2026-10-07 밤, 올림픽 2편 폐기 후 — Owner "소재부터 정확히 찾고 대본으로 만들 만한 내용이 있는 걸 하면 될 거 아니야, 어떻게든 막아라") ──
// 대본·설계 전에 소재 재료가 충분한지 "출처 URL + 원문 인용"으로 증명한다. 자기 신고(ok:true)가 아니라
// ① 출처마다 URL과 원문 인용이 있어야 하고 ② `check-story-topic-vetting.mjs --verify --write`가 실제 페이지에서 인용문을 찾아야(자동 대조) 통과한다.
export const STORY_TOPIC_VETTING_DIR = "C:/tmp/story-topic-vetting";
const urlOk = (u) => /^https?:\/\/[^\s/]+\.[^\s/]+/.test(String(u ?? ""));
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^(www|m)\./, ""); } catch { return ""; } };
// 위키 계열 3차 자료(출처 개수에 안 셈, 원문을 찾는 길잡이로만 쓴다)
export const isTertiaryHost = (h) => /(^|\.)(wikipedia\.org|wikiwand\.com|namu\.wiki|fandom\.com|wikia\.org)$/.test(String(h ?? ""));
const srcOk = (s) => String(s?.name ?? "").trim().length >= 2 && urlOk(s?.url) && String(s?.quote ?? "").trim().length >= 10;
export const vettingFactsHash = (v) => crypto.createHash("sha1").update(JSON.stringify({ facts: v?.facts ?? [], beats: v?.beats ?? [], decisiveFactId: v?.decisiveFactId })).digest("hex").slice(0, 12);
export function checkStoryTopicVetting(v) {
  const fix = [];
  const warn = [];
  const ok = [];
  const sp = v?.spine ?? {};
  for (const [k, label] of [["who", "주인공(누가)"], ["situation", "상황(무슨 일·언제)"], ["stake", "걸린 것"], ["action", "주인공이 한 일"], ["outcome", "결과"], ["decisiveScene", "결과를 바꾼 결정적 장면"]]) {
    if (!filled(sp[k])) fix.push(`줄거리 ${label} 비어 있음(spine.${k})`);
  }
  const facts = Array.isArray(v?.facts) ? v.facts : [];
  const live = facts.filter((f) => f.status !== "excluded");
  const byId = new Map(facts.map((f) => [f.id, f]));
  // 2026-10-14: 위키 계열(누구나 고치는 3차 자료)은 출처 2곳에 세지 않는다 — 소재를 버리라는 게 아니라 위키 각주의 원문(기사·공식 자료)으로
  // 바꾸라는 것(6·7·12·14편 장부 점검에서 해외 소재가 영문 위키에 기댄 것이 드러남). 계산으로 나온 숫자는 derivedFrom(입력 사실 id)과
  // formula(계산식)를 적으면, 입력 사실이 모두 출처 2곳일 때 출처 없이 통과한다(예: 80만 원×12×20년). 보도된 숫자는 계산으로 대신하지 않는다.
  const srcs2 = (f) => (Array.isArray(f.sources) ? f.sources : []).filter(srcOk).filter((x) => !isTertiaryHost(hostOf(x.url)));
  const good = (f, seen = new Set()) => {
    if (Array.isArray(f.derivedFrom) && f.derivedFrom.length && filled(f.formula)) {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return f.derivedFrom.every((id) => byId.has(id) && byId.get(id).status !== "excluded" && good(byId.get(id), seen));
    }
    const s = srcs2(f);
    return s.length >= 2 && new Set(s.map((x) => hostOf(x.url))).size >= 2;
  };
  for (const f of live) {
    if (good(f)) continue;
    const wikiN = (Array.isArray(f.sources) ? f.sources : []).filter((x) => isTertiaryHost(hostOf(x?.url))).length;
    if (Array.isArray(f.derivedFrom) && f.derivedFrom.length) fix.push(`사실 "${f.claim ?? f.id}": 계산 숫자인데 formula가 없거나 입력 사실(${f.derivedFrom.join(", ")}) 중 출처 2곳이 아닌 것이 있음`);
    else if (wikiN) fix.push(`사실 "${f.claim ?? f.id}": 위키 계열 출처 ${wikiN}곳은 2곳에 세지 않음 — 위키 각주의 원문(기사·공식 자료)을 찾아 바꾸거나 status "excluded"`);
    else fix.push(`사실 "${f.claim ?? f.id}": 서로 다른 사이트 출처 2곳(이름·URL·원문 인용 10자 이상)이 없음 — 채우거나 status "excluded"`);
  }
  if (live.length > 12) warn.push(`살아 있는 사실 ${live.length}개 — 12개 이하 권장(과수집은 토큰 낭비, 삼양·삼성·한진 검증에서 소재당 26~37만 토큰이 든 원인). _ai/templates/story-topic-vetting-prompt.md`);
  const goodFacts = live.filter((f) => good(f));
  const goodIds = new Set(goodFacts.map((f) => f.id));
  const numeric = goodFacts.filter((f) => f.numeric === true && /\d/.test(f.claim ?? ""));
  // 2026-10-12 Owner "숫자 4개 규칙은 내가 만든 게 아니다, 완화해도 돼" — 개수 하한 폐지(fix→warn). 쓰는 숫자만 각각 출처 2곳이면 된다.
  if (numeric.length < 1) warn.push(`확인된 숫자 사실 ${numeric.length}개 — 숫자가 하나도 없으면 일화 설명에 그치기 쉽다(참고). 개수 하한은 없고, 쓰는 숫자는 각각 출처 2곳`);
  else ok.push(`확인된 숫자 사실 ${numeric.length}개`);
  const dec = goodFacts.find((f) => f.id === v?.decisiveFactId);
  if (!dec) fix.push("결정적 장면(decisiveFactId)이 출처 2곳으로 확인된 사실이 아님 — 결과를 바꾼 장면이 없으면 활동 나열이 된다(올림픽 2편 교훈)");
  else ok.push("결정적 장면 출처 2곳");
  const econ = goodFacts.filter((f) => f.economy === true && f.numeric === true);
  if (!econ.length) fix.push("숫자가 있는 경제 근거 사실(economy:true, numeric:true, 출처 2곳)이 없음 — 채널 정체성(경제번역소). 출처 1곳짜리 경제 숫자는 대본에 못 쓴다");
  else ok.push(`경제 근거 숫자 ${econ.length}개`);
  const beats = Array.isArray(v?.beats) ? v.beats : [];
  const goodBeats = beats.filter((b) => String(b?.visual ?? "").trim().length >= 10 && Array.isArray(b.factIds) && b.factIds.length && b.factIds.every((id) => goodIds.has(id)));
  const badBeats = beats.length - goodBeats.length;
  if (badBeats) fix.push(`beats ${badBeats}개가 근거 없음 — 장면 재료(beats)는 visual(화면에 보이는 것) 10자 이상 + 출처 2곳 확인된 factIds만 인정`);
  if (goodBeats.length < 10) fix.push(`근거 있는 장면 재료 ${goodBeats.length}개 — 10개 이상 필요(재료가 얇으면 말 늘이기가 된다, 올림픽 7~8번 교훈)`);
  else ok.push(`근거 있는 장면 재료 ${goodBeats.length}개`);
  const dm = v?.demand ?? {};
  if (!(Number(dm.views) >= 10000 && urlOk(dm.url) && filled(dm.evidence))) {
    if (filled(dm.exceptionReason)) warn.push(`수요 근거 없음(예외 사유: ${dm.exceptionReason})`);
    else fix.push("수요 근거 없음 — 벤치마크 채널의 같은·비슷한 소재 영상 조회수 1만 이상(demand.views·url·evidence). '같은 쇼츠가 없다'는 수요 근거가 아니다");
  } else ok.push(`수요 근거 조회수 ${dm.views}`);
  // 2026-10-08 Owner "독자 검수 앞으로 하지 마, 당장 없애. 토큰만 많이 쓰고 시간 낭비, 효율 없음" — 소재 읽기 점검(topicRead) 게이트 폐지.
  // 소재는 러너로 찾고 Owner와 대본을 맞춰 간다. 사실 검증(원문 대조·출처 2곳)은 그대로 유지한다.
  if (!filled(v?.politicalCheck)) fix.push("정치색·논쟁 점검(politicalCheck) 비어 있음");
  const ver = v?.verification;
  if (!ver) fix.push("URL 원문 대조 기록(verification) 없음 — node scripts/check-story-topic-vetting.mjs --file <검증파일> --verify --write 를 실행");
  else {
    if (ver.factsHash !== vettingFactsHash(v)) fix.push("사실·장면 재료가 대조 뒤에 바뀜 — --verify --write 다시 실행");
    if ((ver.notFound ?? 0) > 0) fix.push(`원문 인용을 페이지에서 못 찾은 출처 ${ver.notFound}개 — 인용문을 고치거나 사실 제외`);
    if ((ver.unreachable ?? 0) > (ver.manual ?? 0)) fix.push(`접속 못 한 출처 ${ver.unreachable}개 중 직접 읽어 확인(manualVerified:true)한 것이 ${ver.manual ?? 0}개 — 나머지는 직접 읽고 표시하거나 제외`);
    if (!fix.some((m) => /대조/.test(m)) && !(ver.notFound > 0)) ok.push(`URL 원문 대조 통과(일치 ${ver.ok ?? 0}·직접확인 ${ver.manual ?? 0})`);
  }
  return { fix, warn, ok };
}

// ── 맥락 게이트(2026-10-07 밤, 올림픽 2편 v2~v13 반려 총정리) ──
// Owner: "대본이 맥락이 있어야지. 앞뒤 없이 일본 방송국이 왜 나오는데 1초 만에 넘기겠다" / "벤치마킹한 영상들도 다 맥락 없이 아무 말이나 하면서 시작하더나?"
// 규칙을 맞추느라 처음 듣는 사람이 이해 못 하는 문장을 막는다. 순서: 줄거리(맥락) → 첫 문장 → 장면마다 앞 문장과의 연결 → 지금 대본으로 새 독자 점검.
// Owner가 지금까지 요구한 것 전부(스토리형, 2026-10-07) — 보고 전에 항목별 ok + 근거를 설계 파일 ownerChecklist에 적는다. 새 요구가 생기면 여기에 추가한다.
export const OWNER_CHECK_IDS = [
  ["context-first", "첫 문장 하나에 상황·주인공·걸린 것(맥락 먼저)"],
  ["hook-benchmark", "훅 = 시청자에게 걸린 사건·미스터리(결말은 비공개, v4 기본 베이스)·후보 2~3개 비교·훅 점검표 O/X"],
  ["scene-count-detail", "장면 14~18개(기본 베이스)·장면마다 한 가지 내용(합쳐서 요약하지 않음)"],
  ["economy-link", "경제 연결 장면(채널 정체성, 사실 2곳)"],
  ["team-not-one-person", "한 사람(정주영) 혼자 해낸 이야기로 읽히지 않음"],
  ["political", "정치색·반일·미화 점검"],
  ["facts-two-sources", "사실 출처 2곳·과장(흑자 등) 없음·단정 인과 없음"],
  ["no-template-repeat", "지난 편 문장 틀 반복·정형화 없음, 덧붙인 장면 없음"],
  ["all-ages", "전 연령(세대 전제·투자 권유 없음), 부엉박사 반말"],
  ["closing-one-point", "마지막 부엉박사 말은 요점 하나, 장황하지 않음"],
  ["closing-summary-follow", "마지막 부엉박사 말 = 요약 한마디 + 팔로우 유도(Owner 10/7 밤)"],
  ["tension-device", "긴장 장치(짧은 단독 장면·질문·\"그런데\" 전환 등)가 대본에 실제로 있음(Owner 10/7 밤)"],
  // 2026-10-08 Owner 지시로 "새 독자 점검(cold-read-current)" 항목 폐지 — 독자 검수는 하지 않는다.
];
// v4 기본 베이스(2026-10-11 밤 Owner 9원칙) — 11편부터 설계 파일 ownerChecklist에 항목별 ok + 근거 필수
export const BASE_STRUCTURE_CHECK_IDS = [
  ["base-structure", "기본 베이스 구조(훅 사건 → 퍼즐 질문 → 맥락·경제 번역 → 장애물 → 선택 → 전환 → 결과 → 의미+팔로우)를 따름"],
  ["open-loop-table", "장면별 열린 고리 표(다음이 궁금한 이유·결말 노출 여부)를 적었고 결말은 끝 장면 가까이서 처음 드러남"],
  ["topic-locked", "주제를 바꾸지 않았다(대본이 약하면 대본을 고침, 교체는 Owner 요청 또는 설계 단계 1회·근거)"],
  ["numbers-by-number", "숫자마다 서로 다른 사이트 2곳에서 같은 값으로 확인(결합 사실은 숫자별로 분해, 회사 자료는 독립 출처 아님)"],
  ["dates-2-3", "연도 2~3개(연표 나열 아님), 인과·시간 순서는 연도로 확인"],
  ["owner-eye-twice", "Owner 시점으로 처음부터 끝까지 2번 읽고 '아~ 하고 넘어갈' 구간을 고침"],
];
export const storyScenesHash =(scenes) => crypto.createHash("sha1").update(JSON.stringify(scenes)).digest("hex").slice(0, 12);
export function checkStoryContext(d, scenes) {
  const fix = [];
  const warn = [];
  // 소재 검증 파일이 통과해야 설계·대본으로 넘어간다
  const vp = d?.topicVettingPath;
  if (!vp) fix.push("topicVettingPath(소재 검증 파일) 없음 — 대본 전에 소재 재료를 출처 URL·원문 인용으로 검증해야 한다(§5 0단계)");
  else if (!fs.existsSync(vp)) fix.push(`소재 검증 파일을 찾을 수 없음: ${vp}`);
  else {
    const vr = checkStoryTopicVetting(JSON.parse(fs.readFileSync(vp, "utf8")));
    fix.push(...vr.fix.map((m) => `소재 검증: ${m}`));
    warn.push(...vr.warn.map((m) => `소재 검증: ${m}`));
  }
  const sp = d?.spine ?? {};
  const spineNeed = [
    ["who", "주인공(누가)"],
    ["situation", "상황(무슨 일·언제)"],
    ["stake", "걸린 것(왜 중요한가·무엇이 불리한가)"],
    ["action", "주인공이 한 일"],
    ["outcome", "어떻게 됐나"],
    ["decisiveScene", "결과를 바꾼 결정적 장면(사실 2곳) — 없으면 활동 나열이 된다"],
  ];
  for (const [k, label] of spineNeed) if (!filled(sp[k])) fix.push(`줄거리 ${label} 비어 있음(spine.${k}) — 줄거리가 평범한 말로 이어지지 않으면 대본을 쓰지 않는다`);
  const first = scenes[0] ?? "";
  const whoTerms = Array.isArray(sp.whoTerms) ? sp.whoTerms.filter(Boolean) : [];
  const situationTerms = Array.isArray(sp.situationTerms) ? sp.situationTerms.filter(Boolean) : [];
  if (!whoTerms.length) fix.push("spine.whoTerms(주인공을 가리키는 말) 없음");
  else if (!whoTerms.some((w) => first.includes(w))) fix.push(`첫 문장에 주인공이 없음(${whoTerms.join("·")}) — 곁가지 인물·장면이나 숫자로 시작하면 누구 이야기인지 모른다(올림픽 v8 "82명 중 3표" 반려): "${first}"`);
  if (!situationTerms.length) fix.push("spine.situationTerms(무슨 일인지 가리키는 말) 없음");
  else if (!situationTerms.some((w) => first.includes(w))) fix.push(`첫 문장에 무슨 일인지가 없음(${situationTerms.join("·")}) — 처음 듣는 사람이 첫 문장만으로 상황을 알아야 한다(올림픽 v11 "일본 방송국들은 축하 특집…" 반려): "${first}"`);
  const links = Array.isArray(d?.sceneLinks) ? d.sceneLinks : [];
  if (links.length !== scenes.length) fix.push(`장면 연결(sceneLinks) ${links.length}개 ≠ 장면 ${scenes.length}개 — 장면마다 "앞 문장에서 왜 이 문장이 나오나"를 적는다`);
  else links.forEach((l, i) => {
    const why = typeof l === "string" ? l : l?.why;
    if (!filled(why)) fix.push(`s${i + 1} 장면 연결 이유 비어 있음`);
    else if (/덤|채우기|칸 채|분위기용|있으면 좋/.test(why)) fix.push(`s${i + 1} 이야기에 필요 없는 장면(${why}) — 빼거나 이야기 축에 묶는다(v8~12 미·소 장면 반려)`);
  });
  // 경제 연결(Owner "경제랑 연관된 부분은 기존엔 있었는데 지금은 또 없네" — 고칠 때마다 하나씩 누락): 경제 근거 장면이 있어야 한다
  const eco = Array.isArray(d?.economyScenes) ? d.economyScenes : [];
  const ECON = /(경제|나라 살림|재정|돈|비용|소득|성장|건설|투자|예산|GDP|수출|일자리|적자|흑자|값|가격|매출|손해|시장)/;
  if (!eco.length) fix.push("경제 연결 장면(economyScenes) 없음 — 채널 정체성(경제번역소): 이야기의 같은 대상 위에서 경제 근거 장면을 번호로 적는다(사실 출처 2곳)");
  else for (const no of eco) {
    const t = scenes[no - 1];
    if (!t) fix.push(`economyScenes ${no}번 장면 없음`);
    else if (!ECON.test(t)) fix.push(`economyScenes ${no}번 장면에 경제 표현이 없음: "${t}"`);
  }
  // 경제 번역(Owner 2026-10-07 "경제번역소인데 무슨 관련인지 의문, 이야기 흐름 안에 조금씩 자연스럽게, 흐름이 이상해지면 안 돼"):
  // 3편부터 이야기 중간에 장애물 직후 한 문장씩 경제를 풀어 쓴 지점이 2곳 이상 있어야 하고, 각각 근거 사실이 적혀 있어야 한다.
  if (Number(d?.episode) >= 3) {
    const tr = Array.isArray(d?.economyTranslation) ? d.economyTranslation : [];
    const okTr = tr.filter((x) => Number.isInteger(x?.scene) && scenes[x.scene - 1] && filled(x?.text) && filled(x?.basis));
    if (okTr.length < 2) fix.push(`경제 번역 지점(economyTranslation) ${okTr.length}곳 — 3편부터 이야기 중간(장애물 직후, 같은 대상, 한 문장)에 2곳 이상 {scene, text, basis}로 적는다(규칙: _ai/story-format-structure-v1.md §2-0 경제 번역)`);
    if (okTr.length > 5) warn.push(`경제 번역 지점 ${okTr.length}곳 — 5곳 넘으면 강의처럼 읽힌다(2~4곳 권장)`);
  }
  // 전달 메시지·채널 적합성(Owner 2026-10-07 밤 "4편이든 5편이든 어떤 주제를 하든 전달하고자 하는 내용이 확실히 있어야 하고 우리 채널에 맞는 스토리로 풀어 갈 수 있어야 돼, 명심해"):
  // 4편부터 설계에 ① 시청자가 가져갈 메시지 한 줄 ② 왜 경제번역소 이야기인가 ③ 메시지를 가리키는 키워드를 적고, 그 키워드가 이야기 곳곳(마지막 장면 포함 3곳 이상)에 이어져 마지막 한마디로 모여야 한다.
  if (Number(d?.episode) >= 4) {
    if (!filled(d?.coreMessage) || String(d.coreMessage).trim().length < 10) fix.push("전달 메시지(coreMessage) 없음 — 시청자가 영상을 보고 가져갈 내용을 한 줄(10자 이상)로 적는다. 소재 설명이 아니라 '그래서 무엇을 알게 되나'(Owner 10/7 밤)");
    if (!filled(d?.channelFit) || String(d.channelFit).trim().length < 10) fix.push("채널 적합성(channelFit) 없음 — 이 이야기가 왜 경제번역소 이야기인지(일상 경제로 번역되는 지점)를 한 줄로 적는다(Owner 10/7 밤)");
    const kws = Array.isArray(d?.messageKeywords) ? d.messageKeywords.filter(Boolean) : [];
    if (!kws.length) fix.push("전달 메시지 키워드(messageKeywords) 없음 — coreMessage를 가리키는 핵심 단어 1~3개를 적는다(대본에 이어져야 함)");
    else {
      const hit = scenes.map((t, i) => (kws.some((k) => String(t).includes(k)) ? i + 1 : null)).filter(Boolean);
      if (hit.length < 3 || !hit.includes(scenes.length)) fix.push(`전달 메시지 키워드(${kws.join("·")})가 ${hit.length}개 장면(${hit.join(",") || "없음"})에만 나옴 — 마지막 장면 포함 3곳 이상에 이어져야 메시지가 이야기 곳곳에서 쌓여 마지막 한마디로 모인다`);
    }
  }
  // 숫자가 없으면 일화 설명에 그친다(Owner 올림픽 2편 "구체적 숫자가 없으니 일화 설명에 가깝다") — 출처 확인된 숫자 사실 4개 이상
  const numFacts = (Array.isArray(d?.facts) ? d.facts : []).filter((f) => f.status !== "excluded" && /\d/.test(f.claim ?? "")).length;
  // 2026-10-12 Owner 완화: 숫자 4개 하한 폐지(fix→warn). 숫자가 하나도 없을 때만 참고 경고.
  if (numFacts < 1) warn.push(`확인된 숫자 사실 ${numFacts}개 — 숫자가 하나도 없으면 일화 설명에 그치기 쉽다(참고). 개수 하한은 없다`);
  // Owner 요구 체크리스트(고칠 때마다 이전 요구를 흘리는 실수 방지) — 모든 항목 ok + 근거가 있어야 보고 가능
  let need = Number(d?.episode) >= 4
    ? [...OWNER_CHECK_IDS, ["clear-message-channel-fit", "전달하려는 내용이 확실하고 경제번역소 채널에 맞는 스토리(Owner 10/7 밤)"]]
    : OWNER_CHECK_IDS;
  if (Number(d?.episode) >= 11) need = [...need, ...BASE_STRUCTURE_CHECK_IDS];
  const list = Array.isArray(d?.ownerChecklist) ? d.ownerChecklist : [];
  for (const [id, label] of need) {
    const it = list.find((x) => x?.id === id);
    if (!it) fix.push(`Owner 요구 체크리스트에 "${label}"(${id}) 없음 — 보고 전에 항목별 근거를 적는다`);
    else if (it.ok !== true || !filled(it.evidence)) fix.push(`Owner 요구 "${label}"(${id}) 미충족 또는 근거 없음`);
  }
  // 부엉박사 마무리 = 요약 한마디 + 팔로우 유도(Owner 10/7 밤 "부엉박사는 요약 한마디와 팔로우 유도도 있어야지")
  if (!/팔로우/.test(scenes[scenes.length - 1] ?? "")) fix.push(`마지막 장면에 팔로우 유도가 없음 — 요약 한마디 + 팔로우 유도: "${scenes[scenes.length - 1] ?? ""}"`);
  // 긴장 장치: 짧은 단독 장면(10자 이하 날짜·한 마디) 또는 질문 장면이 있어야 함
  const shortScenes = scenes.filter((t, i) => i > 0 && i < scenes.length - 1 && chars(t) <= 12).length;
  const questions = scenes.filter((t, i) => i < scenes.length - 1 && /[?？]|(까\.|할까|했을까)/.test(t)).length;
  if (!shortScenes && !questions) warn.push("긴장 장치(짧은 단독 장면·질문)가 보이지 않음 — Owner '긴장감을 줄 말투나 장치'(10/7 밤)");
  // 마지막 장면(부엉박사 한 줄) — Owner "너무 장황, 요점을 모르겠어"
  const lastLen = chars(scenes[scenes.length - 1] ?? "");
  if (lastLen > 70) warn.push(`마지막 장면 ${lastLen}자 — 요점 하나만 한 호흡으로(권장 70자 이하, 올림픽 2편 "너무 장황" 반려)`);
  // 2026-10-08 Owner "독자 검수 앞으로 하지 마, 당장 없애" — coldRead 기록·hash 일치·튀는 문장 집계 게이트 폐지. hash는 편 기록용으로만 계산한다.
  const cr = null;
  const hash = storyScenesHash(scenes);
  if (cr) {
    if (cr.scenesHash !== hash) fix.push(`새 독자 점검이 지금 대본과 다름(기록 ${cr.scenesHash ?? "없음"} ≠ 현재 ${hash}) — 고친 대본으로 다시 점검`);
    const readers = Array.isArray(cr.readers) ? cr.readers : [];
    if (readers.length < 3) fix.push(`새 독자 점검 독자 ${readers.length}명 — 3연령(26·38·58) 필요`);
    // 전달 메시지 도착 확인(Owner 2026-10-07 밤 금융실명제 제외: "읽으면서 그래서 뭘 말하고자 하는지를 모르겠네"): 독자가 다 보고 남긴 한 줄(takeaway)에 의도한 메시지 키워드가 있는지 본다. 참고(경고)이며 막지 않는다.
    if (Number(d?.episode) >= 4) {
      const kws = Array.isArray(d?.messageKeywords) ? d.messageKeywords.filter(Boolean) : [];
      const tk = readers.filter((r) => filled(r.takeaway));
      if (tk.length < 3) warn.push(`독자가 남긴 한 줄(takeaway) ${tk.length}명만 기록됨 — 새 독자 점검 5번 '다 보고 남는 한 줄'을 독자별로 적어 의도한 메시지(${d?.coreMessage ?? "없음"})와 비교한다`);
      else {
        const hit = tk.filter((r) => kws.some((k) => String(r.takeaway).includes(k))).length;
        if (hit < 2) warn.push(`독자가 남긴 한 줄이 의도한 메시지와 다름(키워드 ${kws.join("·")}가 ${hit}/${tk.length}명) — 메시지가 도착하지 않았다. 독자 한 줄: ${tk.map((r) => `${r.age}세 "${r.takeaway}"`).join(" / ")}`);
      }
    }
    const notUnderstood = readers.filter((r) => r.firstLineUnderstood !== true);
    // 2026-10-07 밤: "모든 독자가 첫 문장을 이해해야 한다"는 Owner 발언이 아니라 내가 만든 구현이고(규칙 28), 결과를 숨기는 훅이면 26세 시뮬레이션이 소재와 무관하게 '아니오'로 답해 변별력이 없었다(금융실명제·대우) → 막는 기준(fix)에서 경고(warn)로 내린다. Owner의 '맥락 먼저'는 spine 용어 검사와 사람 판단으로 본다.
    if (notUnderstood.length) warn.push(`첫 문장만으로 상황을 이해 못 한 독자 ${notUnderstood.map((r) => r.age).join("·")}세(참고, 막지 않음) — 훅이 '결과 숨김'이면 흔한 결과이므로 두 번째 문장과 함께 읽어 보고 판단`);
    const counts = new Map();
    for (const r of readers) for (const ln of new Set([...(r.jumpyLines ?? []), ...(r.addOnLines ?? [])])) counts.set(ln, (counts.get(ln) ?? 0) + 1);
    const accepted = new Set((cr.acceptedRisks ?? []).map((a) => a.line));
    for (const [ln, c] of counts) {
      if (c >= 2 && !accepted.has(ln)) fix.push(`s${ln} 맥락 없이 튀는 문장(독자 ${c}명) — 고치고 다시 점검`);
      else if (c === 1 && !accepted.has(ln)) warn.push(`s${ln} 독자 1명이 튄다고 함 — 확인`);
    }
  }
  return { fix, warn, hash };
}

export function formatStoryScriptStandardsReport(r) {
  const lines = [`=== 스토리형 대본 기준 대조 v4 기본 베이스(11~15편 확정 구조, Owner 9원칙) — ${r.n}장면 · ${r.total}자 · 대본 hash ${r.hash ?? "-"} ===`];
  for (const m of r.ok) lines.push(`  ✅ ${m}`);
  for (const m of r.warn) lines.push(`  ⚠  ${m}`);
  for (const m of r.fix) lines.push(`  ❌ ${m}`);
  lines.push(`반드시 수정 ${r.fix.length} · 확인 권장 ${r.warn.length} · 통과 ${r.ok.length}`);
  lines.push("※ 검사기 통과 ≠ 규칙 준수. 기계로 못 잡는 것: ① 시청자에게 걸린 것(상식 테스트: '그게 나랑 무슨 상관?' 대신 '왜?!'가 나오는가) ② 퍼즐의 답이 사료에 있는가 ③ 숫자마다 2출처(같은 값) ④ 장면마다 넘어갈 수 없는 이유 ⑤ 경제 번역이 이야기 안에 자연스러운가 ⑥ Owner 시점 2회 읽기 — 보고에 열린 고리 표와 점검표를 붙인다.");
  return lines.join("\n");
}
