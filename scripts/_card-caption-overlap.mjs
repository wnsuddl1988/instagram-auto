/**
 * 카드·보드와 자막이 겹치는지 검사하는 공용 모듈 (2026-10-02, 부엉 19편 Owner 지적: "자막이 카드 문구를 가린다").
 *
 * 사고: 두 줄 자막 블록의 가운데가 y=1290이면 윗줄이 y≈1187(화면 62%)에서 시작해, 카드 아래 끝(62~65%)에 붙거나 글자를
 * 덮었다(19편 s4 "16일까지" 뭉개짐, 12편 s5·9·13·15 근접). 색상으로 카드를 자동 검출하는 방법은 카드가 부엉이 흰 가슴·밝은 바닥과
 * 한 덩어리로 합쳐져 신뢰할 수 없어서(시험 후 폐기), 두 겹으로 막는다.
 *  ① 자동(기하): 카드 씬의 모든 자막 블록 윗줄이 CARD_TEXT_LIMIT_PCT(이미지 규칙 "글자는 세로 22~60%")+여유 안으로 올라오면 실패,
 *     모든 블록 아래 끝이 유튜브 채널명·제목 줄(원본 y≈1510)에 닿으면 실패.
 *  ② 사람 확인 기록: `captionCardFrames`가 카드 씬마다 "두 줄 자막이 뜬 순간" 프레임 시트를 만들고, 판정은 qa/edge-review.json의
 *     `captionOverlap`(씬별 ok/over)로 남긴다(run-episode-qa-once.mjs가 없거나 낡았거나 over면 반드시 수정).
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

export const FRAME_H = 1920;
export const CARD_TEXT_LIMIT_PCT = 60;     // 이미지 규칙: 카드 글자는 세로 22~60%
export const CAPTION_CARD_MARGIN_PCT = 5;  // 카드 아래 끝이 글자 한계보다 최대 5% 더 내려오는 경우(19편 s4 실측 약 65%)를 허용
export const YOUTUBE_UI_TOP_PX = 1510;     // 유튜브 채널명·제목 줄이 시작하는 원본 y(실측 2026-09-30)

/** ASS 자막을 블록(시작·끝이 같은 줄 묶음)으로 읽고 각 블록의 위/아래 y(px)를 계산 */
export function readCaptionBlocks(assPath, fallbackFont = 96) {
  const toSec = (t) => { const [h, m, s] = t.split(":"); return +h * 3600 + +m * 60 + +s; };
  const map = new Map();
  for (const l of fs.readFileSync(assPath, "utf8").split(/\r?\n/)) {
    if (!l.startsWith("Dialogue:")) continue;
    const f = l.split(",");
    const y = Number((/\\pos\(\d+,(\d+)\)/.exec(l) ?? [])[1]);
    const fsz = Number((/\\fs(\d+)/.exec(l) ?? [])[1]) || fallbackFont;
    if (!Number.isFinite(y)) continue;
    const key = `${f[1]}|${f[2]}`;
    if (!map.has(key)) map.set(key, { start: toSec(f[1].trim()), end: toSec(f[2].trim()), ys: [], fs: fsz });
    map.get(key).ys.push(y);
  }
  return [...map.values()].map((b) => ({
    start: b.start, end: b.end, lines: b.ys.length,
    top: Math.min(...b.ys) - b.fs / 2,
    bottom: Math.max(...b.ys) + b.fs / 2 + 8, // 외곽선 약 8px
  }));
}

/**
 * ① 자동 검사. cardScenes = [{ scene, start, end }](초). 반환: { mustFix: string[], minTopPx, maxBottomPx }
 * layoutV2가 아닌 옛 배치(자막 y=1470)는 카드와 겹치지 않으므로 아래 끝 검사만 한다.
 */
export function checkCaptionGeometry(blocks, cardScenes, { layoutV2 }) {
  const mustFix = [];
  const warn = [];
  const limitTop = ((CARD_TEXT_LIMIT_PCT + CAPTION_CARD_MARGIN_PCT) / 100) * FRAME_H;
  let minTop = Infinity, maxBottom = 0;
  const overBottom = [];
  for (const b of blocks) {
    if (b.bottom > maxBottom) maxBottom = b.bottom;
    if (b.bottom > YOUTUBE_UI_TOP_PX - 10) overBottom.push(b);
  }
  if (overBottom.length) {
    const worst = Math.round(Math.max(...overBottom.map((b) => b.bottom)));
    if (layoutV2) {
      mustFix.push(`자막 ${overBottom.length}개 블록의 아래 끝(최대 y=${worst}px)이 유튜브 채널명·제목 줄(y≈${YOUTUBE_UI_TOP_PX})에 닿음(예: ${overBottom[0].start.toFixed(1)}초) → 조립기 CAPTION_FIXED_Y 확인`);
    } else {
      // 옛 배치(자막 y=1470): 카드를 가슴 높이에 든 편에서 카드 아래 끝(약 68%)과 유튜브 UI 사이의 절충이라 확인만 권한다(2026-10-02, 부엉 17편 준비 중 판단 — Owner는 같은 배치의 15·16편을 검수·배포함).
      warn.push(`옛 자막 배치(y=1470): 두 줄 자막 ${overBottom.length}개 블록의 아래 끝(최대 y=${worst}px)이 유튜브 채널명·제목 줄(y≈${YOUTUBE_UI_TOP_PX})에 닿을 수 있음 — 카드와 UI 사이 절충 배치(새 체계 편은 y=1360으로 해결)`);
    }
  }
  if (layoutV2) {
    for (const sc of cardScenes) {
      for (const b of blocks.filter((x) => x.start >= sc.start - 0.05 && x.end <= sc.end + 0.3)) {
        if (b.top < minTop) minTop = b.top;
        if (b.top < limitTop) {
          mustFix.push(`s${sc.scene} 카드 씬 자막 윗줄 y=${Math.round(b.top)}px(${(b.top / FRAME_H * 100).toFixed(1)}%)가 카드 글자 한계 ${CARD_TEXT_LIMIT_PCT}%+여유 ${CAPTION_CARD_MARGIN_PCT}% = ${Math.round(limitTop)}px보다 위 → 카드 글자를 덮을 수 있음(조립기 CAPTION_FIXED_Y 확인)`);
          break;
        }
      }
    }
  }
  return { mustFix: [...new Set(mustFix)], warn, minTopPx: Number.isFinite(minTop) ? minTop : null, maxBottomPx: maxBottom };
}

/**
 * ② 카드 씬마다 "두 줄 자막이 뜬 순간"(없으면 첫 블록) 프레임을 `<outPrefix>.sN.png`로 뽑고, 5씬씩 가로로 이은
 * `<outPrefix>-1.png`, `-2.png` … 시트를 만든다. 반환: { sheets: string[], picks: [{scene,t}] }
 */
export function captionCardFrames({ video, blocks, cardScenes, outPrefix, fontFile = "assets/fonts/BlackHanSans.ttf" }) {
  const picks = [];
  const labeled = [];
  for (const sc of cardScenes) {
    const inScene = blocks.filter((b) => b.start >= sc.start - 0.05 && b.end <= sc.end + 0.3);
    const two = inScene.filter((b) => b.lines >= 2 && b.start >= sc.start + 0.2);
    const pick = two[0] ?? inScene[0];
    const t = pick ? (pick.start + pick.end) / 2 : sc.start + 2;
    picks.push({ scene: sc.scene, t });
    const f = `${outPrefix}.s${sc.scene}.png`;
    const lab = `${outPrefix}.l${sc.scene}.png`;
    spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(2), "-i", video, "-frames:v", "1", "-vf", "scale=432:-1", f]);
    spawnSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-vf", `drawtext=fontfile=${fontFile}:text='s${sc.scene} ${t.toFixed(1)}s':fontsize=26:fontcolor=yellow:borderw=2:bordercolor=black:x=6:y=6`, lab]);
    fs.rmSync(f, { force: true });
    labeled.push(lab);
  }
  const sheets = [];
  for (let g = 0; g * 5 < labeled.length; g += 1) {
    const part = labeled.slice(g * 5, g * 5 + 5);
    const args = ["-v", "error", "-y"];
    part.forEach((p) => args.push("-i", p));
    const out = `${outPrefix}-${g + 1}.png`;
    args.push("-filter_complex", part.length > 1 ? `hstack=inputs=${part.length}` : "null", out);
    spawnSync("ffmpeg", args);
    sheets.push(out);
  }
  labeled.forEach((p) => fs.rmSync(p, { force: true }));
  return { sheets, picks };
}
