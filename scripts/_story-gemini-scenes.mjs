/**
 * 스토리형 영상프롬프트.md → Gemini(Veo, 항상 10초) 장면 사전 (2026-10-12).
 * run-owl-veo-motion-submit-then-collect-v1.mjs 의 --scene-prompts "scripts/_story-gemini-scenes.mjs:STORY_GEMINI_SCENES" 로 쓴다.
 * 환경변수 STORY_EP=<편 번호> 필수. 대상 = 그 편의 "10초 티어" 장면 중 Downloads\스토리 N편\<장면번호>.mp4 가 없는 것.
 * (8초 티어는 Flow Lite 몫이다 — scripts/flow-queue-runner.mjs.)  STORY_GEMINI_ALL=1 이면 8초 티어도 포함(Gemini는 길이와 무관하게 10초 생성).
 */
import fs from "node:fs";

const n = Number(process.env.STORY_EP);
if (!n) throw new Error("STORY_EP 환경변수(편 번호)가 필요합니다");
// Owner가 Downloads를 매일 지운다(10/13) → 프롬프트 문서는 저장소 _ai/, 클립은 C:/tmp 백업 폴더(러너 --out-dir도 이 폴더로 줄 것)
const dir = `C:/tmp/money-shorts-os/story-clips-backup/ep${n}`;
const dlDir = `C:/Users/PC/Downloads/스토리 ${n}편`;
const md = `C:/Users/PC/jjy/instagram-auto/_ai/story-ep${n}-video-generation-prompts.md`;
if (!fs.existsSync(md)) throw new Error(`프롬프트 파일 없음: ${md}`);
const t = fs.readFileSync(md, "utf8");
const rows = {};
for (const m of t.matchAll(/^\|\s*(s(\d+)) [^|]*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)) rows[m[2]] = { image: m[3], tier: Number(m[4]) };

export const STORY_GEMINI_SCENES = {};
for (const m of t.matchAll(/^## s(\d+) [^\n]*\n+```[^\n]*\n([\s\S]*?)\n```/gm)) {
  const row = rows[m[1]];
  if (!row) continue;
  if (row.tier !== 10 && process.env.STORY_GEMINI_ALL !== "1") continue;
  if (fs.existsSync(`${dir}/${m[1]}.mp4`) || fs.existsSync(`${dlDir}/${m[1]}.mp4`)) continue;
  STORY_GEMINI_SCENES[`s${m[1]}`] = {
    refImage: `C:/tmp/story-ep${n}-images/${row.image}`,
    prompt: m[2].trim(),
    outputName: `${m[1]}.mp4`,
    requiredKeywords: [{ key: "Animate this image", label: "시작 문구" }, { key: "CAMERA LOCK", label: "카메라 고정" }],
  };
}
