import fs from "node:fs";
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

make(11, "story-ep11-posco", "포스코 스토리형 11편 배경음. 구간: 호기심 → 막힌 돈 → 쓰임을 바꾸는 전환 → 건설 → 시험과 흑자 → 여운",
  [1, 4, 7, 11, 13, 15],
  [
    { name: "curious_hook", ...CURIOUS("a small mystery about a steel mill") },
    { name: "blocked_money", ...SERIOUS("a worry building") },
    { name: "change_of_use", ...TURN("strings opening up slowly") },
    { name: "building", ...STEADY("a sense of work being built") },
    { name: "test_and_profit", ...BRIGHT("a gentle sense of achievement") },
    { name: "outro", ...OUTRO },
  ], 84);
make(12, "story-ep12-disney-florida", "디즈니 스토리형 12편 배경음. 구간: 정체 모를 매입 미스터리 → 기자의 추적 → 정체가 드러남 → 공식 발표 → 땅 위의 결말 → 여운",
  [1, 6, 9, 12, 14, 16],
  [
    { name: "mystery_buyer", ...CURIOUS("a quiet unsolved mystery") },
    { name: "reporter_chase", positive: ["curious and tense", "plucked strings", "a quiet investigation", "restrained pulse"], negative: ["comedy", "loud"] },
    { name: "reveal", ...TURN("a secret slowly coming to light") },
    { name: "announcement", ...STEADY("a calm official announcement") },
    { name: "payoff", ...BRIGHT("a bright sense of something grand") },
    { name: "outro", ...OUTRO },
  ], 84);
make(13, "story-ep13-cuckoo", "쿠쿠 스토리형 13편 배경음. 구간: 호기심 → 하청의 위기 → 이름을 거는 베팅 → 결과 → 성장 → 여운",
  [1, 4, 8, 12, 14, 16],
  [
    { name: "curious_hook", ...CURIOUS("a quiet factory feeling") },
    { name: "subcontract_crisis", ...SERIOUS("a worry building") },
    { name: "own_name_bet", positive: ["rising tension", "low strings", "a weighty decision", "restrained pulse", "slightly uncertain"], negative: ["comedy", "loud"] },
    { name: "result", ...TURN("hopeful piano brightening") },
    { name: "growth", ...BRIGHT("a gentle sense of growth") },
    { name: "outro", ...OUTRO },
  ], 84);
make(14, "story-ep14-nintendo", "닌텐도 스토리형 14편 배경음. 구간: 이상한 사업 호기심 → 막힌 본업과 실패 → 직원의 장난감 → 상품화 결정과 성공 → 정체 공개 → 여운",
  [1, 5, 9, 13, 17, 18],
  [
    { name: "odd_hook", ...CURIOUS("a whimsical small mystery") },
    { name: "blocked_and_failed", ...SERIOUS("a business slowing down") },
    { name: "tinkering", positive: ["warm and curious", "light pizzicato strings", "someone tinkering quietly", "soft piano"], negative: ["loud", "fast"] },
    { name: "decision_and_success", ...BRIGHT("a gentle rising sense of success") },
    { name: "reveal", ...BRIGHT("a bright warm reveal") },
    { name: "outro", ...OUTRO },
  ], 84);
make(15, "story-ep15-hanjin", "한진해운 스토리형 15편 배경음. 구간: 묶인 짐 미스터리 → 신용이 끊김 → 번지는 피해 → 살릴 길 질문 → 파산과 정리 → 여운",
  [1, 4, 7, 12, 14, 16],
  [
    { name: "stranded_mystery", ...CURIOUS("a quiet sense of something stuck at sea") },
    { name: "credit_cut", ...SERIOUS("a heavy decision made") },
    { name: "damage_spreads", positive: ["rising tension", "low strings", "a widening problem", "restrained pulse", "slightly uncertain"], negative: ["comedy", "loud"] },
    { name: "last_path", ...TURN("a fading hope") },
    { name: "bankruptcy", ...SERIOUS("a solemn conclusion") },
    { name: "outro", ...OUTRO },
  ], 84);
