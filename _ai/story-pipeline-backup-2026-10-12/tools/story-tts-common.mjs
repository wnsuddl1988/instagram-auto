// 스토리형 8~10편 공통 TTS 스크립트 빌더(5·6·7편 build-tts-script.mjs 형식 그대로)
import fs from "node:fs";
export function buildTts({ n, dir, scenesFile, designFile, candidate, title, perf, tags, keys, coreQuestionScenes = [] }) {
  const scenes = JSON.parse(fs.readFileSync(`${dir}/${scenesFile}`, "utf8"));
  if (perf.length !== scenes.length || tags.length !== scenes.length || keys.length !== scenes.length)
    throw new Error(`length mismatch perf ${perf.length}/tags ${tags.length}/keys ${keys.length}/scenes ${scenes.length}`);
  let mism = 0;
  scenes.forEach((s, i) => {
    const a = s.split(/\s+/).length, b = perf[i].split(/\s+/).length;
    if (a !== b) { mism++; console.log(`⚠ s${i + 1} 어절 수 표시 ${a} ≠ 낭독 ${b}: ${s} || ${perf[i]}`); }
  });
  console.log(`어절 불일치 ${mism}곳`);
  const roles = scenes.map((_, i) => (i === 0 ? "hook" : i === scenes.length - 1 ? "save" : coreQuestionScenes.includes(i + 1) ? "core_question" : "evidence"));
  const out = {
    ttsEngineVersion: "money_shorts_korean_director_v2",
    prosodyPolicy: "korean_native_cadence_v2",
    modelId: "eleven_v3",
    formatProfile: "story_v1",
    storyDesignPath: `${dir}/${designFile}`,
    storyScenesPath: `${dir}/${scenesFile}`,
    sourceSpecVersion: "story_format_structure_v3",
    sourceCandidate: candidate,
    title,
    hookType: "story",
    topicSpeechProfile: { globalV3Tag: "confident", baseSpeed: 1.1, baseStability: 0.44 },
    scenes: scenes.map((s, i) => {
      const parts = perf[i].split(/(?<=[,.?])\s+/).filter(Boolean);
      return {
        sceneNumber: i + 1,
        sceneKey: `s${i + 1}_${keys[i]}`,
        sceneRole: roles[i],
        narration: s,
        captionDisplayText: s,
        speechDirection: {
          engineVersion: "money_shorts_speech_direction_v2",
          performanceText: perf[i],
          v3AudioTag: tags[i],
          segments: parts.map((t, k) => ({ text: t, pauseAfterMs: k === parts.length - 1 ? 420 : 150 })),
        },
      };
    }),
  };
  const outDir = `C:/tmp/money-shorts-os/story-ep${n}-tts`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(`${outDir}/story-ep${n}-tts-script.json`, JSON.stringify(out, null, 2));
  console.log("wrote", out.scenes.length, "scenes ->", `${outDir}/story-ep${n}-tts-script.json`);
  return mism;
}
