import fs from "node:fs";
// 사용: node story-bgm-plans-21-25.mjs <편번호>...  (템포 1.2 적용이 끝난 편만 생성)
const FIXED = { 21: true, 24: true };
const sumPath = (n) => `C:/tmp/money-shorts-os/story-ep${n}-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.${FIXED[n] ? "audio-fixed." : ""}tempo1.2-gap0.25-pre.json`;
const ms = (a, b) => Math.round((b - a) * 1000);
function make(n, label, note, cutScenes, defs, bpm) {
  const s = JSON.parse(fs.readFileSync(sumPath(n), "utf8"));
  const st = (k) => s.scenes.find((x) => x.sceneNumber === k).startSec;
  const total = s.timelineDurationSec;
  const cuts = [0, ...cutScenes.slice(1).map(st), total];
  if (cuts.length - 1 !== defs.length) throw new Error("sections mismatch");
  const sections = defs.map((d, i) => ({ ...d, durationMs: ms(cuts[i], cuts[i + 1]) }));
  const plan = {
    label,
    note: `${note} — 장면 시각은 tempo-1.2-gap0.25-pre 요약 기준(전체 ${total}초). 내레이션 아래 낮게 깔 연주곡.`,
    positiveGlobalStyles: ["cinematic documentary underscore", "piano and strings", "subtle background music for narration", "instrumental", `steady tempo around ${bpm} bpm`],
    negativeGlobalStyles: ["EDM", "rock", "heavy drums", "comedy", "loud brass fanfare", "busy melody", "vocals"],
    sections,
  };
  const dir = `C:/tmp/money-shorts-os/story-ep${n}-bgm`;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/story-ep${n}-bgm-plan.json`, JSON.stringify(plan, null, 2));
  console.log(`ep${n}`, sections.map((x) => `${x.name} ${(x.durationMs / 1000).toFixed(1)}s`).join(" | "), "합", (sections.reduce((a, x) => a + x.durationMs, 0) / 1000).toFixed(3), "목표", total);
}
const N = ["loud", "dramatic", "fast"];
const CURIOUS = (extra) => ({ positive: ["curious and quiet", "light plucked strings", extra, "sparse piano"], negative: N });
const SERIOUS = (extra) => ({ positive: ["serious and measured", "low strings", extra, "slow pulse", "minor color"], negative: ["happy", "loud"] });
const TURN = (extra) => ({ positive: ["a quiet turning point", "hopeful piano", extra, "gentle rising pulse"], negative: ["comedy", "loud"] });
const STEADY = (extra) => ({ positive: ["warm steady strings", "calm working rhythm", "soft piano", extra], negative: ["loud", "fanfare"] });
const BRIGHT = (extra) => ({ positive: ["confident warm strings", "bright piano", extra, "clean steady pulse"], negative: ["comedy", "loud"] });
const TENSION = (extra) => ({ positive: ["rising tension", "low strings", extra, "restrained pulse", "slightly uncertain"], negative: ["comedy", "loud"] });
const OUTRO = { positive: ["reflective", "warm lingering piano", "quiet resolution", "soft fade out"], negative: ["loud", "sudden ending"] };

const plans = {
  21: () => make(21, "story-ep21-seolhyang", "설향 딸기 스토리형 21편 배경음. 구간: 86% 일본 품종과 요구 호기심 → 협약과 협상 → 시간이 없다 → 외면과 단 한 농가 → 퍼짐과 결과 → 여운",
    [1, 3, 6, 8, 13, 16],
    [
      { name: "curious_hook", ...CURIOUS("a quiet question about strawberry fields") },
      { name: "treaty_and_royalty", ...SERIOUS("a quiet sense of pressure") },
      { name: "time_pressure", ...TENSION("a race against time") },
      { name: "rejected_then_one_farm", ...TURN("one small success growing") },
      { name: "spread_and_result", ...BRIGHT("a gentle warm sense of relief") },
      { name: "outro", ...OUTRO },
    ], 84),
  22: () => make(22, "story-ep22-tenwon", "10원 동전 스토리형 22편 배경음. 구간: 동전 값 역설 호기심 → 금속값 급등과 손해 → 재료 교체 결정 → 새 동전의 작은 문제 → 결과와 절감 → 여운",
    [1, 4, 8, 11, 13, 16],
    [
      { name: "curious_hook", ...CURIOUS("a quiet question about a small coin") },
      { name: "metal_costs", ...SERIOUS("metal prices quietly rising") },
      { name: "decision", ...TURN("a calm decision being made") },
      { name: "small_worry", ...STEADY("a small practical worry") },
      { name: "result_and_saving", ...BRIGHT("a gentle sense of relief") },
      { name: "outro", ...OUTRO },
    ], 84),
  23: () => make(23, "story-ep23-yuhan", "유일한의 유언 스토리형 23편 배경음. 구간: 한 줄 유언 호기심 → 상장과 소유 나눔 → 아들까지 물러남과 유언 → 주식 기증과 재단 → 딸과 생활 지식 → 여운",
    [1, 4, 7, 11, 14, 16],
    [
      { name: "curious_hook", ...CURIOUS("a quiet question about a short will") },
      { name: "split_ownership", ...STEADY("a calm explanation of ownership") },
      { name: "why_and_will", ...SERIOUS("a quiet family decision") },
      { name: "shares_to_foundation", ...TURN("a quiet generous turning point") },
      { name: "daughter_and_lesson", ...BRIGHT("a warm sense of continuing") },
      { name: "outro", ...OUTRO },
    ], 84),
  24: () => make(24, "story-ep24-longpadding", "평창 롱패딩 스토리형 24편 배경음. 구간: 전날 저녁 줄 호기심 → 값과 인기의 이유 → 밤샘 줄과 매진 → 중고 웃돈 → 시간도 값이라는 교훈 → 여운",
    [1, 4, 8, 11, 14, 16],
    [
      { name: "curious_hook", ...CURIOUS("a quiet evening queue outside a store") },
      { name: "why_popular", ...STEADY("a sense of crowd and bustle") },
      { name: "night_queue_soldout", ...TENSION("a long night of waiting") },
      { name: "resale", ...SERIOUS("a quiet unease about prices") },
      { name: "time_is_value", ...BRIGHT("a gentle warm realization") },
      { name: "outro", ...OUTRO },
    ], 84),
  25: () => make(25, "story-ep25-anipang", "애니팡 스토리형 25편 배경음. 구간: 팡팡 소리 호기심 → PC 성과와 카카오톡 선택 → 제안과 시장 → 출시와 하트 → 설치 숫자 → 여운",
    [1, 4, 7, 10, 13, 15],
    [
      { name: "curious_hook", ...CURIOUS("a quiet subway ride") },
      { name: "pc_and_choice", ...STEADY("a calm thoughtful choice") },
      { name: "proposal_and_market", ...TURN("a quiet hopeful proposal") },
      { name: "launch_and_hearts", ...BRIGHT("a light playful pulse") },
      { name: "growth_numbers", ...BRIGHT("a gentle sense of growth spreading") },
      { name: "outro", ...OUTRO },
    ], 84),
};
for (const a of process.argv.slice(2)) plans[Number(a)]();
