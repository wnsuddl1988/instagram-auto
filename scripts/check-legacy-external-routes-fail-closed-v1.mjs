#!/usr/bin/env node
/**
 * Verifies that the three retired legacy routes stop before request parsing,
 * environment access, network, database, process, or filesystem work.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HELPER = path.join(ROOT, "lib", "legacy-external-route-hard-block.ts");
const ROUTES = [
  { apiPath: "/api/auto", file: path.join(ROOT, "app", "api", "auto", "route.ts") },
  { apiPath: "/api/generate", file: path.join(ROOT, "app", "api", "generate", "route.ts") },
  { apiPath: "/api/render", file: path.join(ROOT, "app", "api", "render", "route.ts") },
];

let failures = 0;

function check(name, ok, detail = "") {
  if (ok) {
    console.log(`PASS  ${name}`);
    return;
  }
  failures += 1;
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

function normalizeCode(source) {
  return stripComments(source).replace(/\r\n/g, "\n").trim();
}

function expectedRouteCode(apiPath) {
  return `import { NextResponse } from "next/server";
import { evaluateLegacyExternalRouteHardBlock } from "@/lib/legacy-external-route-hard-block";

export function POST() {
  const blocked = evaluateLegacyExternalRouteHardBlock("${apiPath}");
  return NextResponse.json(blocked.body, {
    status: blocked.status,
    headers: { "Cache-Control": "no-store" },
  });
}`;
}

function hasExactRetiredRouteStructure(source, apiPath) {
  return normalizeCode(source) === expectedRouteCode(apiPath);
}

const forbiddenRuntimePatterns = [
  ["request body read", /\b(?:req|request)\s*\.\s*json\s*\(/],
  ["environment access", /process\.env/],
  ["network call", /\bfetch\s*\(/],
  ["OpenAI integration", /\bOpenAI\b|generateScript/],
  ["Pexels integration", /fetchCategoryImage|pexels/i],
  ["ElevenLabs integration", /elevenlabs/i],
  ["Supabase integration", /\bsupabase\b|saveGeneration|createClient/],
  ["filesystem access", /\bfs\.|node:fs|writeFile|unlink|mkdir|copyFile|readFile/],
  ["process execution", /child_process|\bexec(?:Async)?\s*\(|\bspawn\s*\(/],
  ["asset preparation", /ensureAssets/],
];

const helperSource = readFileSync(HELPER, "utf8");
const helperCode = stripComments(helperSource);

for (const route of ROUTES) {
  const source = readFileSync(route.file, "utf8");
  const code = stripComments(source);
  const imports = code.match(/^\s*import\s+.*$/gm) ?? [];

  check(
    `${route.apiPath} imports only NextResponse and the pure hard block`,
    imports.length === 2 &&
      imports.some(
        (line) => line.trim() === 'import { NextResponse } from "next/server";'
      ) &&
      imports.some((line) =>
        line.includes(
          'evaluateLegacyExternalRouteHardBlock } from "@/lib/legacy-external-route-hard-block"'
        )
      ),
    imports.join(" | ")
  );
  check(
    `${route.apiPath} POST accepts no request input`,
    /export\s+function\s+POST\s*\(\s*\)/.test(code)
  );
  check(`${route.apiPath} is synchronous`, !/\basync\b|\bawait\b/.test(code));
  check(
    `${route.apiPath} evaluates its exact retired route`,
    code.includes(`evaluateLegacyExternalRouteHardBlock("${route.apiPath}")`)
  );
  check(
    `${route.apiPath} has exactly the two-statement retired handler`,
    hasExactRetiredRouteStructure(source, route.apiPath)
  );

  for (const [label, pattern] of forbiddenRuntimePatterns) {
    check(`${route.apiPath} has no ${label}`, !pattern.test(code), String(pattern));
  }
}

const mutationBase = readFileSync(ROUTES[0].file, "utf8");
const earlySuccessMutation = mutationBase.replace(
  "export function POST() {",
  'export function POST() {\n  return NextResponse.json({ success: true });'
);
const globalNetworkMutation = mutationBase.replace(
  "export function POST() {",
  'export function POST() {\n  new WebSocket("wss://example.invalid");'
);
check(
  "structure guard rejects an early success mutation",
  !hasExactRetiredRouteStructure(earlySuccessMutation, ROUTES[0].apiPath)
);
check(
  "structure guard rejects an extra global network mutation",
  !hasExactRetiredRouteStructure(globalNetworkMutation, ROUTES[0].apiPath)
);

check(
  "pure hard block helper is dependency-free",
  !/^\s*import\s/m.test(helperCode) &&
    !/\brequire\s*\(|\bimport\s*\(/.test(helperCode)
);
for (const [label, pattern] of forbiddenRuntimePatterns) {
  check(`pure hard block helper has no ${label}`, !pattern.test(helperCode), String(pattern));
}
const routeListMatch = helperCode.match(
  /LEGACY_EXTERNAL_ROUTE_PATHS\s*=\s*\[([\s\S]*?)\]\s*as const/
);
const declaredRoutePaths = routeListMatch
  ? [...routeListMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
  : [];
check(
  "pure hard block helper declares only the three retired routes",
  JSON.stringify(declaredRoutePaths) ===
    JSON.stringify(["/api/auto", "/api/generate", "/api/render"]),
  JSON.stringify(declaredRoutePaths)
);
check(
  "pure hard block helper exposes no allow path",
  !/allowed:\s*true|success:\s*true|sideEffects:\s*true/.test(helperCode)
);

const originalFetch = globalThis.fetch;
let fetchCallCount = 0;
globalThis.fetch = async () => {
  fetchCallCount += 1;
  throw new Error("unexpected_network_call");
};

try {
  const helperModule = await import(new URL("../lib/legacy-external-route-hard-block.ts", import.meta.url).href);
  for (const route of ROUTES) {
    const first = helperModule.evaluateLegacyExternalRouteHardBlock(route.apiPath);
    const second = helperModule.evaluateLegacyExternalRouteHardBlock(route.apiPath);
    check(
      `${route.apiPath} pure runtime result remains fail-closed`,
      first.status === 410 &&
        first.body.success === false &&
        first.body.retired === true &&
        first.body.error === "LEGACY_EXTERNAL_ROUTE_RETIRED" &&
        first.body.route === route.apiPath &&
        first.body.sideEffects === false
    );
    check(
      `${route.apiPath} pure runtime result is deterministic`,
      JSON.stringify(first) === JSON.stringify(second)
    );
  }
} catch (error) {
  check("pure hard block runtime import and invocation", false, String(error));
} finally {
  globalThis.fetch = originalFetch;
}

check("runtime invoked no network call", fetchCallCount === 0, `count=${fetchCallCount}`);

console.log(failures === 0 ? "\nRESULT: ALL PASS" : `\nRESULT: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
