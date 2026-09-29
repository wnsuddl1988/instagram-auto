// L2-3: 네이버 뉴스 검색 API 라이브 1회 호출 (Owner 승인 필요)
//
// 목적: L2-2 커넥터가 가정한 응답 구조를 실제 응답으로 검증한다.
//       공식 문서가 본 환경에서 fetch 차단되어 2차 출처로만 확인한 상태였다.
//
// 안전:
// - 키가 없으면 BLOCKED을 보고하고 종료한다. fixture로 대체해 가짜 성공을 만들지 않는다.
// - 자격증명은 헤더로만 전송하며 출력·에러에 절대 포함하지 않는다.
// - 기본 1회 호출. --keyword로 검색어만 바꿀 수 있다.

import { execFileSync } from "node:child_process";
import {
  existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const argv = process.argv.slice(2);

function argValue(flag, fallback) {
  const index = argv.indexOf(flag);
  if (index === -1 || index + 1 >= argv.length) return fallback;
  return argv[index + 1];
}

const keyword = argValue("--keyword", "리볼빙");
const display = Number.parseInt(argValue("--display", "10"), 10);

// .env.local을 프로세스 환경으로 로드한다. 값은 출력하지 않는다.
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
import { buildNaverNewsRequest, normalizeNaverNewsResponse } from "./naver-news-connector.js";
import {
  resolveNaverCredentials, createNaverNewsLiveTransport,
} from "./naver-news-live-transport.js";
import { loadSourceRegistry } from "../editorial-v2/economic-source-registry.js";

const keyword = ${JSON.stringify(keyword)};
const display = ${JSON.stringify(Number.isFinite(display) ? display : 10)};

const credentials = resolveNaverCredentials();
if (!credentials) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_credentials" }));
} else {
  const transport = createNaverNewsLiveTransport({ credentials });
  const request = buildNaverNewsRequest(keyword, { display });
  const outcome = await transport.executeAsync(request);

  if (!outcome.ok) {
    process.stdout.write(JSON.stringify({ status: "FAILED", reason: outcome.reason }));
  } else {
    const registry = loadSourceRegistry();
    const normalized = normalizeNaverNewsResponse(outcome.response, registry, keyword);
    const first = outcome.response.items[0];
    process.stdout.write(JSON.stringify({
      status: "OK",
      keyword,
      totalReported: outcome.response.total,
      rawItemCount: outcome.response.items.length,
      rawTopLevelKeys: Object.keys(outcome.response).sort(),
      rawItemKeys: first ? Object.keys(first).sort() : [],
      samplePubDate: first ? first.pubDate : null,
      sampleTitleRaw: first ? first.title : null,
      sampleOriginalLink: first ? first.originallink : null,
      evidenceCount: normalized.items.length,
      untieredCount: normalized.untieredItems.length,
      droppedReasons: normalized.dropped.map((d) => d.reason),
      tiers: normalized.items.map((i) => i.publisherTier),
      publishers: normalized.items.map((i) => i.publisherName),
      untieredHosts: normalized.untieredItems.map((i) => i.canonicalUrl.split("/")[0]),
      samplePublishedAt: normalized.items[0] ? normalized.items[0].publishedAt : null,
      sampleTitleClean: normalized.items[0] ? normalized.items[0].title : null,
      newestFirst: normalized.items.every((item, index, arr) =>
        index === 0 || arr[index - 1].publishedAt >= item.publishedAt),
    }));
  }
}
`;

const tmp = mkdtempSync(path.join(tmpdir(), "naverlive-"));
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

  const registryJs = found.find(([, n]) => n === "economic-source-registry.js")?.[0];
  if (registryJs) {
    const payload = readFileSync(
      path.join(ROOT, "lib/editorial-v2/economic-source-registry-data.json"),
      "utf8",
    );
    writeFileSync(
      path.join(path.dirname(registryJs), "economic-source-registry-data.js"),
      `export default ${payload};\n`,
      "utf8",
    );
  }

  for (const [full, name] of found) {
    if (!name.endsWith(".js") && !name.endsWith(".mjs")) continue;
    const patched = readFileSync(full, "utf8")
      .replace(
        /(["'])((?:\.\.?\/)[\w\-/]*[\w-]+-data)\.json\1(\s*with\s*\{[^}]*\})?/g,
        "$1$2.js$1",
      )
      .replace(
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
  console.log("=== L2-3 naver live check ===\n");
  console.log(`  ERROR  ${out.slice(0, 1500) || error.message}`);
  process.exit(1);
} finally {
  rmSync(probeSrc, { force: true });
  rmSync(tmp, { recursive: true, force: true });
}

console.log("=== L2-3 naver live check ===\n");

if (result.status === "BLOCKED") {
  console.log("  BLOCKED  NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 를 찾을 수 없음");
  console.log("           fixture로 대체하지 않고 종료합니다.");
  process.exit(2);
}

if (result.status === "FAILED") {
  console.log(`  FAILED   ${result.reason}`);
  process.exit(1);
}

console.log(`  keyword           : ${result.keyword}`);
console.log(`  total reported    : ${result.totalReported}`);
console.log(`  raw items         : ${result.rawItemCount}`);
console.log(`  top-level keys    : ${result.rawTopLevelKeys.join(", ")}`);
console.log(`  item keys         : ${result.rawItemKeys.join(", ")}`);
console.log(`  sample pubDate    : ${result.samplePubDate}`);
console.log(`  sample title(raw) : ${result.sampleTitleRaw}`);
console.log("");
console.log(`  evidence items    : ${result.evidenceCount}`);
console.log(`  untiered (T3)     : ${result.untieredCount}`);
console.log(`  dropped           : ${JSON.stringify(result.droppedReasons)}`);
console.log(`  tiers             : ${JSON.stringify(result.tiers)}`);
console.log(`  publishers        : ${JSON.stringify(result.publishers)}`);
console.log(`  T3 hosts          : ${JSON.stringify(result.untieredHosts)}`);
console.log(`  sample ISO date   : ${result.samplePublishedAt}`);
console.log(`  sample title      : ${result.sampleTitleClean}`);
console.log(`  newest-first      : ${result.newestFirst}`);

const expectedItemKeys = ["description", "link", "originallink", "pubDate", "title"];
const keysMatch =
  JSON.stringify(result.rawItemKeys) === JSON.stringify(expectedItemKeys);
console.log("");
console.log(`  RESULT  item field names ${keysMatch ? "MATCH" : "DIFFER FROM"} L2-2 assumptions`);
if (!keysMatch) {
  console.log(`          expected: ${expectedItemKeys.join(", ")}`);
  console.log(`          actual  : ${result.rawItemKeys.join(", ")}`);
}
process.exit(keysMatch ? 0 : 1);
