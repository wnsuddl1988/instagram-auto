/**
 * 부엉박사 영상 프롬프트(_ai/owl-ep{N}-video-generation-prompts.md) → Gemini(Veo, 항상 10초) 장면 사전 (2026-10-13).
 * run-owl-veo-motion-submit-then-collect-v1.mjs 의 --scene-prompts "scripts/_owl-gemini-scenes.mjs:OWL_GEMINI_SCENES" 로 쓴다.
 * 환경변수 OWL_EP=<파일 편 번호> 필수. 대상 = 그 편 장면 중 C:/tmp/owl-ep{N}-videos/<저장 파일명>이 아직 없고 이미지가 있는 것.
 * Gemini는 길이와 무관하게 10초를 만들므로 10초 티어(카드 씬) 위주로 맡긴다(--scenes로 고른다).
 */
import fs from "node:fs";

const n = Number(process.env.OWL_EP);
if (!n) throw new Error("OWL_EP 환경변수(파일 편 번호)가 필요합니다");
const md = `C:/Users/PC/jjy/instagram-auto/_ai/owl-ep${n}-video-generation-prompts.md`;
if (!fs.existsSync(md)) throw new Error(`프롬프트 파일 없음: ${md}`);
const t = fs.readFileSync(md, "utf8");
const rows = {};
for (const m of t.matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)) rows[m[1]] = { image: m[2], video: m[3], tier: Number(m[4]) };

// 2026-10-14 Owner "오류 난 건 다시 시도하든지 프롬프트 바꿔서 하든지": 내용 거부된 장면은 한 번만 '문구 비인용' 판으로 다시 맡긴다.
// 56편(경찰·금융당국 사칭 문자) s6 "금융당국 소비자경보"·s7 "발송일은…"처럼 공공기관 경보문으로 읽히는 카드 문구를 프롬프트에 따옴표로
// 적으면 거부되는 것으로 보여, 한글 인용 문구를 "기준 이미지의 카드 문구"로 바꿔 쓴다(이미지 속 카드 글자는 그대로 유지하라는 지시는 남김).
const NOQUOTE = new Set(String(process.env.GEMINI_NOQUOTE_SCENES ?? "").split(",").filter(Boolean).map(Number));
const noQuote = (p) => p.replace(/["“][^"”]*[가-힣][^"”]*["”]/g, "the card text exactly as printed in the reference image")
  .replace(/the card text exactly as printed in the reference image on the first line, the card text exactly as printed in the reference image on the second line/g, "the two lines exactly as printed in the reference image")
  .replace(/\(the card text exactly as printed in the reference image(?:, the card text exactly as printed in the reference image)*\)/g, "(exactly as printed in the reference image)");

export const OWL_GEMINI_SCENES = {};
for (const m of t.matchAll(/^## s(\d+) [^\n]*\n+```[^\n]*\n([\s\S]*?)\n```/gm)) {
  const row = rows[m[1]];
  if (!row) continue;
  if (fs.existsSync(`C:/tmp/owl-ep${n}-videos/${row.video}`)) continue;
  const refImage = `C:/tmp/owl-ep${n}-images/${row.image}`;
  if (!fs.existsSync(refImage)) continue;
  const base = m[2].trim().replace(/Animate this image into an 8-second video clip/, "Animate this image into a 10-second video clip");
  OWL_GEMINI_SCENES[`s${m[1]}`] = {
    refImage,
    // Gemini는 10초 고정이므로 8초 티어 프롬프트의 시간 표기를 10초로 바꾼다(입 멈춤 시각은 그대로).
    prompt: NOQUOTE.has(Number(m[1])) ? noQuote(base) : base,
    outputName: row.video,
    tier: row.tier,
    requiredKeywords: [{ key: "Animate this image", label: "시작 문구" }, { key: "CAMERA LOCK", label: "카메라 고정" }],
  };
}
