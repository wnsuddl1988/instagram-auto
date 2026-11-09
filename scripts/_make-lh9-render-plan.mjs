/**
 * _make-lh9-render-plan.mjs
 * LH-9 render_plan.json 생성 스크립트
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const PLAN_PATH = join(ROOT, "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh9_plan_story_fixed_v1.json");
const IMG_DIR = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_images_fixed");
const OUT_DIR = join(ROOT, "output/v2/paid_qa/lh9_silent_render");

const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));

// scene별 localImagePath 주입
plan.scenes = plan.scenes.map((scene) => {
  const padded = String(scene.sceneNumber).padStart(2, "0");
  const imgPath = join(IMG_DIR, `scene_${padded}.jpg`);
  const exists = existsSync(imgPath);
  console.log(`scene ${padded}: ${exists ? "OK" : "MISSING"} — ${imgPath}`);
  return {
    ...scene,
    localImagePath: imgPath,
    visualAnchorId: "",
  };
});

plan._renderMeta = {
  imageProvider: "pexels-fixed",
  imagesDir: IMG_DIR,
  narrationPath: null,
  silentRender: true,
  renderedAt: "2026-05-24",
  basedOnPlan: PLAN_PATH,
};

const outPath = join(OUT_DIR, "render_plan.json");
writeFileSync(outPath, JSON.stringify(plan, null, 2), "utf8");
console.log("\nrender_plan.json 생성:", outPath);
