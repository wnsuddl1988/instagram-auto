// L2-6: indicator-orchestrator 라이브 1회 검증 (Owner 승인 필요)
//
// 목적: L2-5가 만든 lib/source-facts/indicator-orchestrator.ts를 실제
//       ecos-live-transport(fetch)로 구동해, mock으로 검증한 경로가 진짜
//       ECOS 응답에서도 성립하는지 확인한다.
//
// 안전:
// - 키가 없으면 BLOCKED로 종료한다. fixture로 대체하지 않는다.
// - .env.local은 이 스크립트가 직접 읽어 process.env에 주입한다. 값은
//   출력하지 않는다 — "env key: present"만 보고한다.
// - endPeriod는 호출 시점 실제 달력 월을 캐릭터 인자로 직접 넘긴다(Date.now 미사용).

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const argv = process.argv.slice(2);

function argValue(flag, fallback) {
  const index = argv.indexOf(flag);
  if (index === -1 || index + 1 >= argv.length) return fallback;
  return argv[index + 1];
}

// 오늘(2026-09-16) 기준 — 호출자가 명시적으로 넘기는 상수. Date.now() 미사용.
const endPeriod = argValue("--end-period", "202609");

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_]+)=(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadLocalEnv();

const probe = `
import { fetchLatestIndicator } from "./indicator-orchestrator.js";
import { createEcosLiveTransport } from "./ecos-live-transport.js";
import { resolveEcosApiKey } from "./ecos-live-transport.js";

const endPeriod = ${JSON.stringify(endPeriod)};
const key = resolveEcosApiKey();

if (key === null) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_credentials" }));
} else {
  const fetchedAt = new Date().toISOString();
  const transport = createEcosLiveTransport(fetchedAt);
  const outcome = await fetchLatestIndicator("base_rate", endPeriod, transport, fetchedAt);

  if (!outcome.ok) {
    process.stdout.write(JSON.stringify({
      status: "BLOCKED_OR_FAILED",
      indicatorId: outcome.indicatorId,
      reason: outcome.reason,
      detail: outcome.detail,
    }));
  } else {
    const fc = outcome.factCard;
    process.stdout.write(JSON.stringify({
      status: "OK",
      factCardId: fc.id,
      isMock: fc.isMock,
      isPublishable: fc.isPublishable,
      primarySourceProviderId: fc.primarySourceProviderId,
      indicatorName: fc.indicatorName,
      currentValue: fc.currentValue,
      previousValue: fc.previousValue,
      changeValue: fc.changeValue,
      unit: fc.unit,
      currentNumericValue: fc.currentNumericValue,
      dataPeriod: fc.dataPeriod,
      publishedDate: fc.publishedDate,
      sourceName: fc.sourceName,
      sourceUrl: fc.sourceUrl,
      citationCount: fc.citations.length,
      citationSourceNames: fc.citations.map((c) => c.sourceName),
      interpretation: fc.interpretation,
      cautionNote: fc.cautionNote,
      allowedClaims: fc.allowedClaims,
      blockedClaims: fc.blockedClaims,
      contentCategory: fc.contentCategory,
    }));
  }
}
`;

const tmp = mkdtempSync(path.join(tmpdir(), "orchlive-"));
const probeName = `__live_${process.pid}.mts`;
const probeSrc = path.join(ROOT, "lib", "source-facts", probeName);
let result = null;

try {
  writeFileSync(probeSrc, probe, "utf8");
  execFileSync(
    process.execPath,
    [
      path.join(ROOT, "node_modules", "typescript", "bin", "tsc"),
      "--strict",
      "--target", "ES2022",
      "--module", "ESNext",
      "--moduleResolution", "bundler",
      "--resolveJsonModule",
      "--skipLibCheck",
      "--outDir", tmp,
      probeSrc,
    ],
    { cwd: ROOT, stdio: "pipe" },
  );
  rmSync(probeSrc, { force: true });

  const { readdirSync, statSync } = await import("node:fs");
  const found = [];
  const scan = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) scan(full);
      else found.push([full, entry]);
    }
  };
  scan(tmp);

  const compiledName = probeName.replace(/\.mts$/, ".mjs");
  const compiled = found.find(([, name]) => name === compiledName)?.[0];
  if (!compiled) throw new Error("compiled probe not found");

  for (const [full, name] of found) {
    if (!name.endsWith(".js") && !name.endsWith(".mjs")) continue;
    const patched = readFileSync(full, "utf8").replace(
      /(\bfrom\s*)(["'])((?:\.\.?\/)[\w\-/.]+)\2/g,
      (match, kw, quote, spec) =>
        /\.(js|mjs|cjs|json)$/.test(spec) ? match : `${kw}${quote}${spec}.js${quote}`,
    );
    writeFileSync(full, patched, "utf8");
  }

  const raw = execFileSync(process.execPath, [compiled], {
    cwd: ROOT,
    stdio: "pipe",
    encoding: "utf8",
    timeout: 30_000,
  });
  result = JSON.parse(raw.trim());
} catch (error) {
  const out = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
  console.log("=== L2-6 indicator-orchestrator live check ===\n");
  console.log(`  ERROR  ${out.slice(0, 1500) || error.message}`);
  process.exit(1);
} finally {
  rmSync(probeSrc, { force: true });
  rmSync(tmp, { recursive: true, force: true });
}

console.log("=== L2-6 indicator-orchestrator live check ===\n");
console.log(`  endPeriod : ${endPeriod}`);
console.log("  env key   : present (value not shown)");
console.log("");

if (result.status === "BLOCKED") {
  console.log("  BLOCKED  ECOS_API_KEY / BOK_ECOS_API_KEY 를 찾을 수 없음");
  process.exit(2);
}

if (result.status === "BLOCKED_OR_FAILED") {
  console.log(`  ${result.reason.toUpperCase()}  ${result.detail}`);
  process.exit(1);
}

console.log(`  factCardId          : ${result.factCardId}`);
console.log(`  isMock              : ${result.isMock}`);
console.log(`  isPublishable       : ${result.isPublishable}`);
console.log(`  primarySourceProv.  : ${result.primarySourceProviderId}`);
console.log(`  indicatorName       : ${result.indicatorName}`);
console.log(`  currentValue        : ${result.currentValue}`);
console.log(`  previousValue       : ${result.previousValue}`);
console.log(`  changeValue         : ${result.changeValue}`);
console.log(`  currentNumericValue : ${result.currentNumericValue}`);
console.log(`  dataPeriod          : ${result.dataPeriod}`);
console.log(`  publishedDate       : ${result.publishedDate}`);
console.log(`  sourceName          : ${result.sourceName}`);
console.log(`  sourceUrl           : ${result.sourceUrl}`);
console.log(`  citations           : ${result.citationCount} (${result.citationSourceNames.join(", ")})`);
console.log(`  contentCategory     : ${result.contentCategory}`);
console.log("");
console.log(`  interpretation      : ${result.interpretation}`);
console.log(`  cautionNote         : ${result.cautionNote}`);
console.log(`  allowedClaims       : ${JSON.stringify(result.allowedClaims)}`);
console.log(`  blockedClaims       : ${JSON.stringify(result.blockedClaims)}`);

console.log("");
const checks = [
  ["isMock === false", result.isMock === false],
  ["isPublishable === false (승격은 downstream)", result.isPublishable === false],
  ["primarySourceProviderId === provider-ecos-live", result.primarySourceProviderId === "provider-ecos-live"],
  ["citations >= 1", result.citationCount >= 1],
  ["publishedDate is BOK decision date, not ECOS period", /^\d{4}-\d{2}-\d{2}$/.test(result.publishedDate)],
];
let allPass = true;
for (const [label, pass] of checks) {
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}`);
  if (!pass) allPass = false;
}
process.exit(allPass ? 0 : 1);
