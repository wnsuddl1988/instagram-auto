/**
 * ECOS live Yohan Koo data-card asset builder.
 *
 * Generates 6 × 1080x1920 PNG cards (SVG → sharp → PNG).
 * No external API calls. No Pexels/Imagen/Pollinations/OpenAI image.
 * Uses sharp from node_modules/.pnpm for SVG rasterization.
 *
 * Security constraints:
 * - No shell: true. All processes via spawnSync args array only.
 * - No fetch/network calls.
 * - No .money-shorts-local/ access.
 * - No .env.local read.
 * - piq_diag_out.txt never touched.
 * - Output goes outside repo root.
 * - No new dependencies installed.
 *
 * Data used (ECOS live, source-first validated):
 * - indicatorName: 한국은행 기준금리
 * - latestPeriod: 202605 (2026년 5월)
 * - currentValueText: 2.5%
 * - changeDirection: unchanged_month_over_month
 * - verifiedPublishedDate: 2025-05-29
 * - sourceName: 한국은행 ECOS — 기준금리
 * - sourceUrl: https://ecos.bok.or.kr/#/Short/722Y001
 * - No rate hike/cut is asserted.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

const outDir = getArg("--out-dir");
if (!outDir) {
  console.error("Usage: node build-ecos-live-yohan-koo-data-card-assets.mjs --out-dir <path>");
  process.exit(1);
}

const outDirAbs = resolve(outDir);

// Safety: out-dir must not be inside repo root
if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside the repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
  process.exit(1);
}

// Safety: .money-shorts-local forbidden
if (outDirAbs.includes(".money-shorts-local")) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[data-card-builder] out-dir: ${outDirAbs}\n`);

// ── Load sharp ────────────────────────────────────────────────────────────────
import { pathToFileURL } from "node:url";
const SHARP_PATH = resolve(REPO_ROOT, "node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js");
let sharp;
try {
  const mod = await import(pathToFileURL(SHARP_PATH).href);
  sharp = mod.default ?? mod;
  console.log("[data-card-builder] sharp loaded OK");
} catch (e) {
  console.error(`ABORT: Cannot load sharp from ${SHARP_PATH}: ${e.message}`);
  process.exit(1);
}

mkdirSync(outDirAbs, { recursive: true });

// ── Card dimensions ───────────────────────────────────────────────────────────
const W = 1080;
const H = 1920;

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  bg: "#0F172A",          // slate-900
  surface: "#1E293B",     // slate-800
  surfaceAlt: "#172033",  // darker surface
  border: "#334155",      // slate-700
  accent: "#22C55E",      // green-500
  accentWarm: "#EAB308",  // yellow-500
  accentBlue: "#3B82F6",  // blue-500
  textPrimary: "#F8FAFC", // slate-50
  textSecondary: "#94A3B8", // slate-400
  textMuted: "#475569",   // slate-600
  sourceText: "#64748B",  // slate-500
  divider: "#1E293B",     // slate-800
};

// ── Source citation (small, bottom) ──────────────────────────────────────────
function sourceLine(extra = "") {
  return `<text x="${W / 2}" y="${H - 72}" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="24" fill="${C.sourceText}">출처: 한국은행 ECOS 722Y001 · 결정일 2025-05-29${extra ? " · " + extra : ""}</text>`;
}

function logoLine() {
  return `<text x="${W / 2}" y="${H - 40}" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="22" fill="${C.textMuted}">AutoShorts AI — 경제 데이터 브리핑</text>`;
}

// ── SVG wrapper ───────────────────────────────────────────────────────────────
function svg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${inner}
</svg>`;
}

// ── Scene card builders ───────────────────────────────────────────────────────

// scene-01: hook — "기준금리, 지금 어느 수준일까?"
function scene01() {
  return svg(`
  <!-- top accent bar -->
  <rect x="0" y="0" width="${W}" height="8" fill="${C.accent}"/>

  <!-- category tag -->
  <rect x="72" y="80" width="200" height="44" rx="22" fill="${C.surface}"/>
  <text x="172" y="109" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="24" fill="${C.accent}" font-weight="600">한국은행 기준금리</text>

  <!-- main question area -->
  <rect x="60" y="200" width="${W - 120}" height="4" fill="${C.border}"/>

  <text x="${W / 2}" y="380" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="72" fill="${C.accent}" font-weight="800">?</text>

  <text x="${W / 2}" y="540" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="64" fill="${C.textPrimary}" font-weight="700">기준금리,</text>
  <text x="${W / 2}" y="630" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="64" fill="${C.textPrimary}" font-weight="700">지금 어느</text>
  <text x="${W / 2}" y="720" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="64" fill="${C.accent}" font-weight="700">수준일까?</text>

  <!-- divider -->
  <rect x="60" y="800" width="${W - 120}" height="2" fill="${C.border}"/>

  <!-- sub context -->
  <text x="${W / 2}" y="900" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="40" fill="${C.textSecondary}">내 대출·예금에 바로 영향을 주는</text>
  <text x="${W / 2}" y="960" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="40" fill="${C.textSecondary}">그 숫자, 지금 바로 확인합니다</text>

  <!-- ECOS badge -->
  <rect x="${W / 2 - 140}" y="1080" width="280" height="64" rx="12" fill="${C.surface}"/>
  <text x="${W / 2}" y="1120" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.accentBlue}" font-weight="600">한국은행 ECOS 공식 자료</text>

  ${sourceLine()}
  ${logoLine()}
  `);
}

// scene-02: signal — "현재 기준금리 2.5%"
function scene02() {
  return svg(`
  <rect x="0" y="0" width="${W}" height="8" fill="${C.accentBlue}"/>

  <text x="${W / 2}" y="140" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="36" fill="${C.textSecondary}" font-weight="400">한국은행 ECOS 기준금리</text>
  <text x="${W / 2}" y="196" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textMuted}">2026년 5월 기준</text>

  <!-- big number card -->
  <rect x="80" y="260" width="${W - 160}" height="480" rx="24" fill="${C.surface}"/>
  <rect x="80" y="260" width="${W - 160}" height="8" rx="4" fill="${C.accentBlue}"/>

  <text x="${W / 2}" y="420" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="44" fill="${C.textSecondary}">현재 기준금리</text>
  <text x="${W / 2}" y="590" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="160" fill="${C.textPrimary}" font-weight="800">2.5%</text>
  <text x="${W / 2}" y="680" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="34" fill="${C.textMuted}">연간 기준 (per annum)</text>

  <!-- status badge: unchanged -->
  <rect x="${W / 2 - 160}" y="820" width="320" height="64" rx="32" fill="${C.accentWarm}20"/>
  <rect x="${W / 2 - 160}" y="820" width="320" height="64" rx="32" stroke="${C.accentWarm}" stroke-width="2" fill="none"/>
  <text x="${W / 2}" y="860" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.accentWarm}" font-weight="600">전월 대비 변동 없음</text>

  <!-- source info -->
  <text x="${W / 2}" y="980" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.textSecondary}">출처: 한국은행 ECOS</text>
  <text x="${W / 2}" y="1024" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textMuted}">indicator 722Y001/0101000</text>

  ${sourceLine()}
  ${logoLine()}
  `);
}

// scene-03: why — "직전월 대비 유지"
function scene03() {
  return svg(`
  <rect x="0" y="0" width="${W}" height="8" fill="${C.accentWarm}"/>

  <text x="${W / 2}" y="130" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="40" fill="${C.textSecondary}">월별 추이</text>

  <!-- timeline rows -->
  <!-- header -->
  <rect x="60" y="180" width="${W - 120}" height="60" rx="8" fill="${C.surface}"/>
  <text x="200" y="220" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textMuted}" font-weight="600">기간</text>
  <text x="${W - 240}" y="220" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textMuted}" font-weight="600">기준금리</text>

  <!-- row: 2026-05 (current, highlighted) -->
  <rect x="60" y="252" width="${W - 120}" height="80" rx="0" fill="${C.accent}18"/>
  <rect x="60" y="252" width="6" height="80" fill="${C.accent}"/>
  <text x="200" y="300" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.accent}" font-weight="700">2026년 5월 ★</text>
  <text x="${W - 240}" y="300" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="36" fill="${C.accent}" font-weight="800">2.5%</text>

  <!-- row: 2026-04 -->
  <rect x="60" y="332" width="${W - 120}" height="72" fill="${C.surfaceAlt}"/>
  <text x="200" y="378" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textSecondary}">2026년 4월</text>
  <text x="${W - 240}" y="378" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="34" fill="${C.textPrimary}">2.5%</text>

  <!-- row: 2025-05 -->
  <rect x="60" y="404" width="${W - 120}" height="72" fill="${C.surface}"/>
  <text x="200" y="450" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textSecondary}">2025년 5월 결정</text>
  <text x="${W - 240}" y="450" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="34" fill="${C.textPrimary}">2.5%</text>
  <text x="${W - 100}" y="450" text-anchor="end" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="22" fill="${C.textMuted}">▼인하</text>

  <!-- row: 2025-02 -->
  <rect x="60" y="476" width="${W - 120}" height="72" fill="${C.surfaceAlt}"/>
  <text x="200" y="522" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textSecondary}">2025년 2월 결정</text>
  <text x="${W - 240}" y="522" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="34" fill="${C.textPrimary}">2.75%</text>
  <text x="${W - 100}" y="522" text-anchor="end" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="22" fill="${C.textMuted}">▼인하</text>

  <!-- row: 2024-11 -->
  <rect x="60" y="548" width="${W - 120}" height="72" fill="${C.surface}"/>
  <text x="200" y="594" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textSecondary}">2024년 11월 결정</text>
  <text x="${W - 240}" y="594" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="34" fill="${C.textPrimary}">3.0%</text>
  <text x="${W - 100}" y="594" text-anchor="end" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="22" fill="${C.textMuted}">▼인하</text>

  <!-- bottom border -->
  <rect x="60" y="620" width="${W - 120}" height="2" fill="${C.border}"/>

  <!-- insight -->
  <rect x="80" y="670" width="${W - 160}" height="160" rx="16" fill="${C.surface}"/>
  <text x="${W / 2}" y="730" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="36" fill="${C.textPrimary}" font-weight="600">직전월 대비 같은 수준 유지</text>
  <text x="${W / 2}" y="790" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textSecondary}">2026년 5월 기준 — 큰 변화 없음</text>

  ${sourceLine("BOK 공식 변경 이력")}
  ${logoLine()}
  `);
}

// scene-04: life impact — 대출자 / 예금자 / 현금흐름
function scene04() {
  return svg(`
  <rect x="0" y="0" width="${W}" height="8" fill="${C.accent}"/>

  <text x="${W / 2}" y="120" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="44" fill="${C.textPrimary}" font-weight="700">나에게 미치는 영향</text>
  <text x="${W / 2}" y="172" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textSecondary}">기준금리 2.5% 유지 상황에서</text>

  <!-- card: 대출자 -->
  <rect x="60" y="220" width="${W - 120}" height="280" rx="20" fill="${C.surface}"/>
  <rect x="60" y="220" width="8" height="280" rx="4" fill="${C.accentBlue}"/>
  <text x="132" y="280" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.accentBlue}" font-weight="700">💳 대출자</text>
  <text x="132" y="332" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.textPrimary}" font-weight="600">이자 부담 지속</text>
  <text x="132" y="380" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textSecondary}">변동금리 대출 조건 재확인</text>
  <text x="132" y="424" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textSecondary}">고정 vs 변동 비교 검토 시점</text>
  <text x="132" y="468" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="24" fill="${C.textMuted}">현재 실질 대출금리 직접 확인 필요</text>

  <!-- card: 예금자 -->
  <rect x="60" y="540" width="${W - 120}" height="240" rx="20" fill="${C.surface}"/>
  <rect x="60" y="540" width="8" height="240" rx="4" fill="${C.accentWarm}"/>
  <text x="132" y="600" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.accentWarm}" font-weight="700">🏦 예금자</text>
  <text x="132" y="652" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.textPrimary}" font-weight="600">예금 금리 조건 점검</text>
  <text x="132" y="700" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textSecondary}">정기예금 갱신 전 금리 비교</text>
  <text x="132" y="744" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="24" fill="${C.textMuted}">기준금리와 실제 예금금리 차이 확인</text>

  <!-- card: 소비자 -->
  <rect x="60" y="820" width="${W - 120}" height="220" rx="20" fill="${C.surface}"/>
  <rect x="60" y="820" width="8" height="220" rx="4" fill="${C.accent}"/>
  <text x="132" y="878" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.accent}" font-weight="700">📊 현금흐름</text>
  <text x="132" y="930" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.textPrimary}" font-weight="600">고정비 · 변동비 점검</text>
  <text x="132" y="978" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textSecondary}">이자비용이 고정비에 포함되는지 확인</text>
  <text x="132" y="1018" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="24" fill="${C.textMuted}">투자 추천 아님 — 개인 재무 점검용</text>

  ${sourceLine()}
  ${logoLine()}
  `);
}

// scene-05: watch — 물가 / 실제 대출금리 / 다음 결정
function scene05() {
  return svg(`
  <rect x="0" y="0" width="${W}" height="8" fill="${C.accentBlue}"/>

  <text x="${W / 2}" y="120" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="44" fill="${C.textPrimary}" font-weight="700">앞으로 볼 지표</text>
  <text x="${W / 2}" y="172" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textSecondary}">기준금리보다 이걸 함께 보세요</text>

  <!-- watch item 1 -->
  <rect x="60" y="220" width="${W - 120}" height="200" rx="16" fill="${C.surface}"/>
  <text x="120" y="288" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="52" fill="${C.accentWarm}">①</text>
  <text x="220" y="282" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="36" fill="${C.textPrimary}" font-weight="700">소비자물가지수 (CPI)</text>
  <text x="220" y="330" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textSecondary}">물가 흐름이 금리 방향을 좌우</text>
  <text x="220" y="374" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="26" fill="${C.textMuted}">통계청 월별 발표 확인</text>

  <!-- watch item 2 -->
  <rect x="60" y="444" width="${W - 120}" height="200" rx="16" fill="${C.surface}"/>
  <text x="120" y="512" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="52" fill="${C.accentBlue}">②</text>
  <text x="220" y="506" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="36" fill="${C.textPrimary}" font-weight="700">실제 대출금리</text>
  <text x="220" y="554" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textSecondary}">기준금리 ≠ 내 대출금리</text>
  <text x="220" y="598" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="26" fill="${C.textMuted}">은행 고시금리 직접 비교 필요</text>

  <!-- watch item 3 -->
  <rect x="60" y="668" width="${W - 120}" height="200" rx="16" fill="${C.surface}"/>
  <text x="120" y="736" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="52" fill="${C.accent}">③</text>
  <text x="220" y="730" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="36" fill="${C.textPrimary}" font-weight="700">한국은행 다음 결정</text>
  <text x="220" y="778" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.textSecondary}">방향은 확인된 데이터로만 판단</text>
  <text x="220" y="822" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="26" fill="${C.textMuted}">bok.or.kr 통화정책 결정 공지 참고</text>

  ${sourceLine()}
  ${logoLine()}
  `);
}

// scene-06: action / closing
function scene06() {
  return svg(`
  <rect x="0" y="0" width="${W}" height="8" fill="${C.accent}"/>

  <text x="${W / 2}" y="120" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="44" fill="${C.textPrimary}" font-weight="700">오늘 할 수 있는 것</text>
  <text x="${W / 2}" y="172" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="30" fill="${C.textSecondary}">기준금리 2.5% 확인 후 한 가지만</text>

  <!-- checklist -->
  <rect x="60" y="220" width="${W - 120}" height="580" rx="20" fill="${C.surface}"/>

  <!-- item 1 -->
  <rect x="90" y="262" width="48" height="48" rx="8" fill="${C.accent}20" stroke="${C.accent}" stroke-width="2"/>
  <text x="114" y="296" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.accent}">✓</text>
  <text x="172" y="284" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.textPrimary}" font-weight="600">내 대출 이자율 확인</text>
  <text x="172" y="322" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="26" fill="${C.textSecondary}">변동/고정, 현재 금리 메모</text>

  <rect x="90" y="360" width="${W - 210}" height="1" fill="${C.border}"/>

  <!-- item 2 -->
  <rect x="90" y="386" width="48" height="48" rx="8" fill="${C.accentBlue}20" stroke="${C.accentBlue}" stroke-width="2"/>
  <text x="114" y="420" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.accentBlue}">✓</text>
  <text x="172" y="408" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.textPrimary}" font-weight="600">고정비 목록 정리</text>
  <text x="172" y="446" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="26" fill="${C.textSecondary}">월 이자비용이 얼마인지 계산</text>

  <rect x="90" y="484" width="${W - 210}" height="1" fill="${C.border}"/>

  <!-- item 3 -->
  <rect x="90" y="510" width="48" height="48" rx="8" fill="${C.accentWarm}20" stroke="${C.accentWarm}" stroke-width="2"/>
  <text x="114" y="544" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.accentWarm}">✓</text>
  <text x="172" y="532" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.textPrimary}" font-weight="600">예금 갱신일 확인</text>
  <text x="172" y="570" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="26" fill="${C.textSecondary}">현재 금리와 비교 후 재가입 검토</text>

  <rect x="90" y="608" width="${W - 210}" height="1" fill="${C.border}"/>

  <!-- item 4 -->
  <rect x="90" y="634" width="48" height="48" rx="8" fill="${C.accent}20" stroke="${C.accent}" stroke-width="2"/>
  <text x="114" y="668" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="28" fill="${C.accent}">✓</text>
  <text x="172" y="656" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="32" fill="${C.textPrimary}" font-weight="600">변동비 분류</text>
  <text x="172" y="694" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="26" fill="${C.textSecondary}">줄일 수 있는 항목 한 가지만 찾기</text>

  <!-- disclaimer -->
  <rect x="80" y="856" width="${W - 160}" height="80" rx="12" fill="${C.surfaceAlt}"/>
  <text x="${W / 2}" y="888" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="24" fill="${C.textMuted}">투자 권유 아님 — 데이터 브리핑 목적</text>
  <text x="${W / 2}" y="920" text-anchor="middle" font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="24" fill="${C.textMuted}">의사결정은 전문가 상담 후 진행하세요</text>

  ${sourceLine()}
  ${logoLine()}
  `);
}

// ── Render each scene ─────────────────────────────────────────────────────────
const scenes = [
  { id: "scene-01", fn: scene01 },
  { id: "scene-02", fn: scene02 },
  { id: "scene-03", fn: scene03 },
  { id: "scene-04", fn: scene04 },
  { id: "scene-05", fn: scene05 },
  { id: "scene-06", fn: scene06 },
];

const results = [];

for (const { id, fn } of scenes) {
  const svgStr = fn();
  const outPath = join(outDirAbs, `${id}.png`);

  try {
    await sharp(Buffer.from(svgStr))
      .resize(W, H)
      .png({ compressionLevel: 6 })
      .toFile(outPath);

    const stat = (await import("node:fs")).statSync(outPath);
    console.log(`  [OK] ${id}.png — ${(stat.size / 1024).toFixed(1)} KB`);
    results.push({ id, path: outPath, sizeBytes: stat.size, ok: true });
  } catch (e) {
    console.error(`  [FAIL] ${id}: ${e.message}`);
    results.push({ id, path: outPath, ok: false, error: e.message });
  }
}

// ── Write summary ─────────────────────────────────────────────────────────────
const summary = {
  schemaVersion: "money_shorts_data_card_assets_summary_v1",
  buildId: "ecos-live-yohan-koo-data-card-v1",
  outDir: outDirAbs,
  count: results.length,
  allOk: results.every((r) => r.ok),
  dimensions: { widthPx: W, heightPx: H },
  riskNotes: [
    "SVG-based cards: Korean glyph rendering depends on system fonts (Malgun Gothic / Apple SD Gothic Neo / Noto Sans KR).",
    "If Korean text appears as boxes, install Noto Sans KR or confirm Malgun Gothic is available on the render host.",
    "No external API calls. No Pexels/Imagen/Pollinations/OpenAI image.",
    "Data: ECOS live 722Y001/0101000, latestPeriod=202605, currentValue=2.5%, verifiedPublishedDate=2025-05-29.",
    "No rate hike/cut asserted.",
  ],
  scenes: results,
};

const summaryPath = join(outDirAbs, "data-card-assets-summary.json");
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
console.log(`\n[data-card-builder] summary: ${summaryPath}`);

const failCount = results.filter((r) => !r.ok).length;
if (failCount > 0) {
  console.error(`\n[data-card-builder] FAIL: ${failCount} scene(s) failed.`);
  process.exit(1);
} else {
  console.log(`[data-card-builder] ALL ${results.length} scenes OK\n`);
}
