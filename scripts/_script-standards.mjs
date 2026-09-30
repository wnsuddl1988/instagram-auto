/**
 * 대본 기준 대조 라이브러리 (2026-09-30 밤, 최우선 규칙 26).
 *
 * CLI(check-script-standards.mjs) · TTS 게이트(no-log 래퍼 owl-tts) · 편 QA(run-episode-qa-once.mjs)가 같은 규칙을 쓰도록
 * 여기 한 곳에 둔다. 기준 문서(CURRENT_STANDARDS §1 부엉 v2, §3 황소 v3, A-2, 규칙 17 훅)가 바뀌면 **같은 날 이 파일을 고친다**
 * (고치지 않으면 기준과 검사가 어긋나 같은 사고가 다시 난다). 회귀 테스트: scripts/check-script-standards-selftest.mjs.
 *
 * 기계로 못 잡는 것(사람이 본다): 훅 H3 구체 대상, 팩트 정확성·출처, 매수 암시의 미묘한 표현, 허용리스트 밖 종목 실명, 문장 흐름.
 */
import { checkHook } from "./_hook-rules.mjs";

export const SCRIPT_STANDARDS_VERSION = "script_standards_v1_2026-09-30";

// ── 숫자를 한글로 읽은 기준 글자 수(공백·문장부호 제외) ──────────────────────────────────────────
const D = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const small = (n) => {
  let s = "";
  for (const [p, w] of [[1000, "천"], [100, "백"], [10, "십"]]) {
    const d = Math.floor(n / p) % 10;
    if (d) s += (d === 1 ? "" : D[d]) + w;
  }
  return s + (n % 10 ? D[n % 10] : "");
};
const readInt = (n) => {
  if (n === 0) return "영";
  const eok = Math.floor(n / 1e8);
  const man = Math.floor((n % 1e8) / 1e4);
  const rest = n % 1e4;
  return (eok ? small(eok) + "억" : "") + (man ? (man === 1 ? "" : small(man)) + "만" : "") + (rest ? small(rest) : "");
};
const spoken = (t) =>
  t
    .replace(/([0-9][0-9,]*)\.([0-9]+)/g, (_, a, b) => readInt(Number(a.replace(/,/g, ""))) + "점" + [...b].map((c) => D[Number(c)] || "영").join(""))
    .replace(/[0-9][0-9,]*/g, (m) => readInt(Number(m.replace(/,/g, ""))))
    .replace(/%/g, "퍼센트");
export const spokenChars = (t) => spoken(t).replace(/[\s.,?!~·…'"“”‘’\-]/g, "").length;
export const estimatedSeconds = (t) => spokenChars(t) / (/[0-9]/.test(t) ? 4.8 : 5.5);

const BAN_COMMON = [
  [/님들|딱 1분만 집중|정리할게|꼭 기억하고|진짜 부자되자/, "경제사냥꾼 문구"],
  [/진짜 이유|정체(가|는|를)? /, "벤치마크식 '진짜 이유/정체' 틀"],
  [/투자 판단의 책임/, "리스크 고지는 나레이션에 넣지 않는다(자막바)"],
];
const BAN_OWL = [
  [/다들,|핵심만 짚어줄게|한 줄로 정리하면|이것만은 챙겨가/, "황소특보 고유 문구"],
  [/금박사/, "18편부터 금박사 언급 금지"],
];
// "사라지다"를 매수 암시로 오판하지 않게 "사라(?!지)"
const BAN_BULL = [[/미리 주워|담아\s*두|매수\s*추천|사야\s*해|사라(?!지)/, "매수 암시"]];

const endingOf = (t) => {
  const s = t.trim().replace(/[.?!…"”'\s]+$/g, "");
  if (/야$/.test(s)) return "야";
  if (/거든$/.test(s)) return "거든";
  if (/(돼|되)$/.test(s)) return "돼";
  return s.slice(-2);
};

/** character: "owl" | "bull", scenes: narration 문자열 배열, hookType: "T1"~"T5" | null */
export function checkScriptStandards({ character, scenes, hookType = null }) {
  if (!["owl", "bull"].includes(character)) throw new Error(`character는 owl|bull: ${character}`);
  const fix = []; // 반드시 수정
  const warn = []; // 확인 권장
  const ok = [];
  const has = (t, re) => re.test(t ?? "");
  const find = (re) => scenes.findIndex((t) => re.test(t));
  const n = scenes.length;
  const need = (cond, msg) => (cond ? ok.push(msg) : fix.push(`누락: ${msg}`));

  // 1) 씬 수
  const [minScene, maxScene] = character === "owl" ? [11, 13] : [12, 17];
  if (n < minScene || n > maxScene) {
    (character === "owl" ? fix : warn).push(`씬 수 ${n}개 — ${character === "owl" ? "부엉 v2는 11~13씬" : "황소 v3는 12~14(자연스러우면 중간안 ≤17)"}`);
  } else ok.push(`씬 수 ${n}개`);

  // 2) 씬당 발화 9.5초(약 50자) 이내
  const longScenes = scenes.map((t, i) => [i + 1, estimatedSeconds(t), spokenChars(t)]).filter(([, s]) => s > 9.5);
  if (longScenes.length) fix.push(`씬당 발화 9.5초 초과: ${longScenes.map(([i, s, c]) => `${i}번 ${s.toFixed(1)}초(${c}자)`).join(", ")}`);
  else ok.push(`모든 씬 9.5초 이내(최대 ${Math.max(...scenes.map(estimatedSeconds)).toFixed(1)}초)`);

  // 3) 총 글자 수(숫자를 한글로 읽은 기준)
  const total = scenes.reduce((s, t) => s + spokenChars(t), 0);
  const [minChars, maxChars] = character === "owl" ? [560, 640] : [600, 640];
  if (total < minChars || total > maxChars) warn.push(`총 ${total}자 — 목표 ${minChars}~${maxChars}자(추정치라 TTS 실측으로 보정)`);
  else ok.push(`총 ${total}자(목표 ${minChars}~${maxChars})`);

  // 4) 훅(규칙 17 H1~H4)
  const hook = checkHook({ hookType, sceneBackgrounds: {}, scenes: [{ narration: scenes[0] }] });
  if (hook.mustFix.length) fix.push(...hook.mustFix);
  else ok.push("훅 규칙 H1~H4 통과");
  warn.push(...hook.warn.filter((w) => !/hookType/.test(w)));
  if (!hookType) warn.push("hookType(T1~T5) 미지정 — 스펙에 기록해야 성과 비교가 된다");

  // 5) 금지 표현
  const bans = [...BAN_COMMON, ...(character === "owl" ? BAN_OWL : BAN_BULL)];
  scenes.forEach((t, i) => bans.forEach(([re, why]) => has(t, re) && fix.push(`${i + 1}번 금지 표현(${why}): "${t.match(re)[0]}"`)));
  if (has(scenes[n - 1], /팔로우/)) fix.push("마지막 씬에서 팔로우를 말하지 않는다(CTA 클립에 있음)");

  // 6) 같은 수치 두 번 금지(월 표기는 시점일 수 있어 확인 권장으로)
  const tokens = scenes.map(
    (t) =>
      new Set(
        [...t.matchAll(/([0-9][0-9,.]*\s?(?:퍼센트|%|세|개월|년|월|일|원|만 원|억|조|배|곳|명|개|위|번|가지|차|분|초|시간|주)?)/g)].map((m) =>
          m[1].replace(/\s/g, ""),
        ),
      ),
  );
  const seen = new Map();
  tokens.forEach((set, i) => set.forEach((tk) => seen.set(tk, [...(seen.get(tk) ?? []), i + 1])));
  const dups = [...seen.entries()].filter(([, at]) => at.length >= 2);
  const monthDups = dups.filter(([tk]) => /^[0-9]+월$/.test(tk));
  const realDups = dups.filter(([tk]) => !/^[0-9]+월$/.test(tk));
  if (realDups.length) fix.push(`같은 수치 중복: ${realDups.map(([tk, at]) => `"${tk}" ${at.join("·")}번`).join(", ")}`);
  else ok.push("같은 수치 두 번 쓰지 않음");
  if (monthDups.length) warn.push(`월 표기 반복(수치가 아니라 시점일 수 있음, 확인): ${monthDups.map(([tk, at]) => `"${tk}" ${at.join("·")}번`).join(", ")}`);

  // 7) 연속 씬 어미 반복
  const ends = scenes.map(endingOf);
  const repeats = [];
  for (let i = 1; i < n; i += 1) if (ends[i] === ends[i - 1]) repeats.push(`${i}·${i + 1}번("${ends[i]}")`);
  if (repeats.length) fix.push(`연속 씬 같은 어미: ${repeats.join(", ")} — 연속 씬의 어미·동사를 반복하지 않는다(A-2)`);
  else ok.push("연속 씬 어미 반복 없음");

  // 8) 오프닝 고정 문구(훅 뒤 한 문장)
  const OPENING =
    character === "owl" ? /안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야\./ : /안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야\./;
  const openIdx = find(OPENING);
  if (openIdx < 0) fix.push("오프닝 고정 문구 없음");
  else if (openIdx === 0) fix.push("오프닝(자기소개)이 첫 씬 — 훅 뒤로(규칙 17 H2)");
  else if (openIdx > 2) warn.push(`오프닝이 ${openIdx + 1}번 씬 — 훅 뒤 한 문장이어야 함(보통 2~3번)`);
  else ok.push(`오프닝 고정 문구(${openIdx + 1}번)`);

  // 9) 캐릭터별 구조 요소
  if (character === "owl") {
    const qIdx = find(/답부터 말하면/);
    need(qIdx >= 0 && has(scenes[qIdx], /(어떻게 해야|달라질까|뭐가 달라)/), "핵심 질문+즉답(C형 '뭐가 달라질까' / D형 '어떻게 해야 할까' + '답부터 말하면')");
    if (qIdx >= 0) {
      const pos = (qIdx + 1) / n;
      if (pos < 0.25 || pos > 0.5) warn.push(`핵심 질문 위치 ${Math.round(pos * 100)}%(약 30~35% 지점 권장, ${qIdx + 1}번)`);
    }
    need(find(/(첫째|둘째)/) >= 0, "항목 단(첫째·둘째, 대상·금액)");
    const itemStarts = scenes.map((t, i) => (/(첫째|둘째|셋째)/.test(t) ? i : -1)).filter((i) => i >= 0);
    const missing = [];
    itemStarts.forEach((s, k) => {
      const end = k + 1 < itemStarts.length ? itemStarts[k + 1] : Math.min(n, s + 2);
      if (!/(쉽게 풀면|비유하면|마치 |처럼)/.test(scenes.slice(s, end).join(" "))) missing.push(`${s + 1}번 항목`);
    });
    if (missing.length) fix.push(`항목마다 "쉽게 풀면"/비유 1개 누락: ${missing.join(", ")}`);
    else if (itemStarts.length) ok.push("항목마다 '쉽게 풀면'/비유 있음");
    need(find(/(이면|라면|하면|채우면|받으면)[^.]*[0-9]/) >= 0, "계산 예시 1개(숫자로 풀어 주는 씬)");
    need(find(/(그렇다고|무작정|놓치면|사라지거든|안 돼)/) >= 0, "주의(놓치면 손해 보는 조건 한 줄)");
    const sumIdx = find(/콕 집어 정리하면/);
    need(sumIdx >= 0 && (has(scenes[sumIdx], /두 가지/) || has(scenes[sumIdx + 1], /두 가지/)), "정리+확인: '콕 집어 정리하면' + 먼저 확인할 것 '두 가지'");
    if (sumIdx >= 0) {
      const before = scenes[sumIdx].split(/먼저 확인|확인할 건|지금 먼저/)[0].replace(/콕 집어 정리하면,?/, "").trim();
      if (before.length < 12) fix.push("정리 씬에 '한 문장 결론'이 없음(확인할 것만 있음)");
    }
    const agency = /(위원회|공단|부|청|원|은행|국회|정부|공사|금융위|기재부|국토부|고용부|복지부|공정위|금감원)[가는이을를]? ?[^.]{0,30}(발표|의결|밝혔|시행|받는다|통과)/;
    need(scenes.slice(2, 7).some((t) => agency.test(t)), "상황: 기관이 날짜·수치를 발표(기관명 + 발표/시행)");
    const change = scenes.slice(2, 8).some((t) => /(원래|이전|기존|예전|1차|지난)/.test(t) && /(이번|이제|바뀌|달라|부터는)/.test(t));
    if (!change) warn.push("상황: '기존 vs 변경' 대비(원래는 ~였는데 이제는 ~) 문장을 찾지 못함 — 제도 변경형이면 필수");
    else ok.push("상황: 기존 vs 변경 대비 있음");
    need(has(scenes[n - 1], /댓글/) && has(scenes[n - 1], /(저장|다시 확인|확인해)/), "마지막 씬: 저장·확인 + 댓글 요청");
  } else {
    need(/^다들,/.test(scenes[0]), "훅 첫마디 '다들,'");
    need(find(/숫자부터 보자/) >= 0, "상황 '(먼저) 숫자부터 보자'");
    need(find(/한마디로/) >= 0, "핵심 질문+즉답 '그럼 왜 ~걸까? 한마디로 ~'");
    need(find(/첫째/) >= 0 && find(/둘째/) >= 0, "근거 첫째·둘째(근거가 두 갈래면 축을 나눔)");
    need(find(/물론/) >= 0, "균형 '물론 조심할 것도 있어'(반대 시각·리스크)");
    const sum = find(/한 줄로 정리하면/);
    need(sum >= 0 && (has(scenes[sum], /두 가지/) || has(scenes[sum + 1], /두 가지/)), "요약+체크 '한 줄로 정리하면' + 확인할 것 '두 가지'(같은 씬 또는 바로 다음 씬)");
    need(find(/이것만은 챙겨가/) >= 0, "당부 '이것만은 챙겨가'");
    need(find(/황소특보가 제일 먼저 들고 올게/) >= 0, "다음 단계 예고 '황소특보가 제일 먼저 들고 올게'");
    need(has(scenes[n - 1], /댓글/), "마지막 씬 댓글 요청");
    if (find(/(쫓지 말고|이유를 알아야)/) < 0) warn.push("엔딩 5박자 ④ 이득 각인('쫓지 말고 이유를 알아라, 이유를 알아야 다음 신호가 읽힌다') 문구를 찾지 못함");
    if (find(/(이 종목|이 주식).*(사|담)/) >= 0) fix.push("매수 암시 의심 표현");
  }

  return { character, n, total, fix, warn, ok, version: SCRIPT_STANDARDS_VERSION };
}

export function formatScriptStandardsReport(r) {
  const lines = [`=== 대본 기준 대조 (${r.character === "owl" ? "부엉박사 v2 §1" : "황소특보 v3 §3"}) — ${r.n}씬 · ${r.total}자 ===`];
  for (const m of r.ok) lines.push(`  ✅ ${m}`);
  for (const m of r.warn) lines.push(`  ⚠  ${m}`);
  for (const m of r.fix) lines.push(`  ❌ ${m}`);
  lines.push(`반드시 수정 ${r.fix.length} · 확인 권장 ${r.warn.length} · 통과 ${r.ok.length}`);
  lines.push("※ 기계로 못 잡는 것은 사람이 본다: 훅 H3 구체 대상, 팩트·출처, 매수 암시의 미묘한 표현, 허용리스트 밖 종목 실명, 흐름.");
  return lines.join("\n");
}

/** TTS 스크립트 JSON(scenes[].narration, 선택 hookType·character)에서 대본을 꺼낸다. */
export function scenesFromTtsScript(json) {
  return (json.scenes ?? []).map((s) => String(s.narration ?? ""));
}
