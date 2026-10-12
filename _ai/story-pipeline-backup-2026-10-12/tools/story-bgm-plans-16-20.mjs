import fs from "node:fs";
// 사용: node story-bgm-plans-16-20.mjs <편번호>...  (TTS가 확정된 편만 생성)
const sumPath = (n) => `C:/tmp/money-shorts-os/story-ep${n}-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json`;
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
    note: `${note} — 장면 시각은 tempo-1.2-gap0.25-pre.audio-fixed 요약 기준(전체 ${total}초). 내레이션 아래 낮게 깔 연주곡.`,
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
const OUTRO = { positive: ["reflective", "warm lingering piano", "quiet resolution", "soft fade out"], negative: ["loud", "sudden ending"] };

const plans = {
  16: () => make(16, "story-ep16-buldak", "불닭볶음면 스토리형 16편 배경음. 구간: 1년 투입·조롱 호기심 → 명동 장면 → 출시와 '먹을 수 없다' → 입소문 → 유튜버 도전과 성장 → 여운",
    [1, 3, 6, 9, 12, 17],
    [
      { name: "curious_hook", ...CURIOUS("a quiet question about a very spicy noodle") },
      { name: "myeongdong_scene", positive: ["warm and curious", "light pizzicato strings", "a street restaurant at night", "soft piano"], negative: ["loud", "fast"] },
      { name: "launch_and_rejection", ...SERIOUS("a worry after a launch") },
      { name: "word_of_mouth", ...TURN("hopeful piano brightening slowly") },
      { name: "growth", ...BRIGHT("a gentle sense of growth spreading") },
      { name: "outro", ...OUTRO },
    ], 84),
  17: () => make(17, "story-ep17-freechal", "프리챌 스토리형 17편 배경음. 구간: 공짜 커뮤니티 호기심 → 돈을 받는 이유 → 경쟁 사이트의 평생 무료 → 시행과 이탈 → 종료와 여운",
    [1, 4, 7, 10, 15],
    [
      { name: "curious_hook", ...CURIOUS("a quiet online community feeling") },
      { name: "reason_for_fee", ...STEADY("a calm explanation of costs") },
      { name: "rivals_free", positive: ["rising tension", "low strings", "a quiet competition", "restrained pulse", "slightly uncertain"], negative: ["comedy", "loud"] },
      { name: "launch_and_exit", ...SERIOUS("members slowly leaving") },
      { name: "outro", ...OUTRO },
    ], 84),
  18: () => make(18, "story-ep18-pokemon", "포켓몬빵 스토리형 18편 배경음. 구간: 줄 서는 어른들 호기심 → 재출시와 추억 → 선반이 비고 개수 제한 → 거래와 사과 → 향수와 결과 → 여운",
    [1, 4, 6, 10, 12, 16],
    [
      { name: "curious_hook", ...CURIOUS("a quiet early morning queue") },
      { name: "relaunch_memory", positive: ["warm and nostalgic", "light music box colors", "gentle piano", "soft strings"], negative: ["loud", "fast"] },
      { name: "empty_shelves", ...SERIOUS("a sense of scarcity") },
      { name: "trading_and_apology", positive: ["rising tension", "low strings", "a widening problem", "restrained pulse", "slightly uncertain"], negative: ["comedy", "loud"] },
      { name: "nostalgia_and_result", ...BRIGHT("a gentle warm sense of memory") },
      { name: "outro", ...OUTRO },
    ], 84),
  19: () => make(19, "story-ep19-ryu", "류현진 포스팅 스토리형 19편 배경음. 구간: 큰 숫자 호기심 → 응찰과 수락 → 산 건 협상권 → 거절과 압박 → 마감과 계약 → 여운",
    [1, 3, 7, 10, 14, 16],
    [
      { name: "curious_hook", ...CURIOUS("a quiet question about a large sum") },
      { name: "bids_and_acceptance", ...STEADY("a calm explanation of a bidding process") },
      { name: "what_was_bought", ...TURN("a quiet realization") },
      { name: "refusal_and_pressure", positive: ["rising tension", "low strings", "a negotiation standoff", "restrained pulse", "slightly uncertain"], negative: ["comedy", "loud"] },
      { name: "deadline_and_deal", ...BRIGHT("a sense of relief at the deadline") },
      { name: "outro", ...OUTRO },
    ], 84),
  20: () => make(20, "story-ep20-castella", "대왕카스테라 스토리형 20편 배경음. 구간: 닮은 가게 호기심 → 인기와 난립 → 방송 → 맞섬 → 매출 급감과 분석 → 여운",
    [1, 3, 6, 8, 12, 15],
    [
      { name: "curious_hook", ...CURIOUS("a quiet shopping street") },
      { name: "boom_and_spread", ...STEADY("a sense of crowd and bustle") },
      { name: "broadcast", ...SERIOUS("a news report feeling") },
      { name: "dispute", positive: ["rising tension", "low strings", "two sides disagreeing", "restrained pulse", "slightly uncertain"], negative: ["comedy", "loud"] },
      { name: "drop_and_analysis", ...SERIOUS("a quiet decline") },
      { name: "outro", ...OUTRO },
    ], 84),
};
for (const a of process.argv.slice(2)) plans[Number(a)]();
