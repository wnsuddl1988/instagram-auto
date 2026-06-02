/**
 * _lh10-make-render-plan.mjs
 * LH-10 무음 렌더용 render_plan.json 생성
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PLAN_PATH = join(ROOT, "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh10_plan_story_fixed_v1_motion_safe.json");
const IMG_DIR   = join(ROOT, "output/v2/paid_qa/lh10_pexels_stock_images");
const OUT_DIR   = join(ROOT, "output/v2/paid_qa/lh10_silent_render");

mkdirSync(OUT_DIR, { recursive: true });

const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));

plan.scenes = plan.scenes.map((scene) => {
  const padded = String(scene.sceneNumber).padStart(2, "0");
  const imgPath = join(IMG_DIR, `scene_${padded}.jpg`);
  const exists = existsSync(imgPath);
  console.log(`scene ${padded}: ${exists ? "✅" : "❌ MISSING"} — ${imgPath}`);
  return {
    ...scene,
    durationSec: scene.duration ?? 5,   // render_v2.py는 durationSec 사용
    localImagePath: imgPath,
    narrationPath: null,
  };
});

plan.narrationPath = null;  // 무음 렌더

plan._renderMeta = {
  imageProvider: "pexels",
  imagesDir: IMG_DIR,
  narrationPath: null,
  silentRender: true,
  renderedAt: "2026-05-30",
  basedOnPlan: PLAN_PATH,
};

const outPath = join(OUT_DIR, "render_plan.json");
writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf8");
console.log("\nrender_plan.json 생성:", outPath);
