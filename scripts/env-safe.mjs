/**
 * env-safe.mjs
 * 안전한 .env.local 관리 도구 — API 키 값은 절대 출력하지 않음.
 *
 * Usage:
 *   node scripts/env-safe.mjs check
 *   node scripts/env-safe.mjs flags
 *   node scripts/env-safe.mjs set-flag KEY true|false
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, "..", ".env.local");

// 존재 여부만 확인할 API 키 목록 (값 출력 금지)
const API_KEY_CHECKLIST = [
  "OPENAI_API_KEY",
  "PEXELS_API_KEY",
  "ELEVENLABS_API_KEY",
  "PIXABAY_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "ANTHROPIC_API_KEY",
  "PERPLEXITY_API_KEY",
];

// 값 출력 허용된 boolean 플래그 allowlist (API 키/secret 포함 불가)
const FLAG_ALLOWLIST = [
  "PAID_API_ENABLED",
  "ALLOW_OPENAI_GENERATE",
  "ALLOW_OPENAI_TTS",
  "ALLOW_ELEVENLABS",
  "ALLOW_IMAGEN",
  "ALLOW_CLAUDE_REWRITE",
  "ALLOW_PERPLEXITY",
  "ALLOW_PIXABAY",
];

// 보안: 값을 출력해서는 안 되는 패턴
const SECRET_PATTERNS = [
  /_API_KEY$/i,
  /_SECRET$/i,
  /_TOKEN$/i,
  /CLIENT_SECRET/i,
  /CLIENT_ID/i,
  /PASSWORD/i,
  /PRIVATE_KEY/i,
];

function isSecretKey(key) {
  return SECRET_PATTERNS.some((p) => p.test(key));
}

function parseEnv(content) {
  const map = new Map();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    map.set(key, val);
  }
  return map;
}

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error("ERROR: .env.local not found at", ENV_PATH);
    process.exit(1);
  }
  return parseEnv(readFileSync(ENV_PATH, "utf8"));
}

// --- command: check ---
function cmdCheck() {
  const env = loadEnv();
  console.log("=== API Key Existence Check ===");
  for (const key of API_KEY_CHECKLIST) {
    const val = env.get(key);
    const status = val !== undefined && val !== "" ? "present" : "missing";
    console.log(`  ${key}=${status}`);
  }
}

// --- command: flags ---
function cmdFlags() {
  const env = loadEnv();
  console.log("=== Boolean Flag Status ===");
  for (const key of FLAG_ALLOWLIST) {
    const val = env.get(key);
    const display = val !== undefined ? val : "missing";
    console.log(`  ${key}=${display}`);
  }
}

// --- command: set-flag ---
function cmdSetFlag(key, value) {
  if (!key || !value) {
    console.error("Usage: env-safe.mjs set-flag KEY true|false");
    process.exit(1);
  }

  // 보안: allowlist 외 키 수정 금지
  if (!FLAG_ALLOWLIST.includes(key)) {
    console.error(`BLOCKED: "${key}" is not in the flag allowlist.`);
    console.error("Allowed flags:", FLAG_ALLOWLIST.join(", "));
    process.exit(1);
  }

  // 보안: secret 패턴 이중 차단
  if (isSecretKey(key)) {
    console.error(`BLOCKED: "${key}" looks like a secret key. Use allowlist flags only.`);
    process.exit(1);
  }

  // 값 검증: true/false만 허용
  if (value !== "true" && value !== "false") {
    console.error(`BLOCKED: value must be "true" or "false", got "${value}"`);
    process.exit(1);
  }

  const raw = readFileSync(ENV_PATH, "utf8");
  const lines = raw.split("\n");
  const pattern = new RegExp(`^\\s*${key}\\s*=`);
  let found = false;

  const updated = lines.map((line) => {
    if (pattern.test(line)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    // 없으면 끝에 추가
    updated.push(`${key}=${value}`);
  }

  writeFileSync(ENV_PATH, updated.join("\n"), "utf8");
  console.log(`UPDATED ${key}=${value}`);
}

// --- placeholder 추가 command (내부용) ---
function cmdAddPlaceholders() {
  const PLACEHOLDERS = [
    "",
    "# ===== Candidate API Providers =====",
    "",
    "# Pixabay fallback image search",
    "PIXABAY_API_KEY=",
    "",
    "# Claude / Anthropic script rewrite",
    "ANTHROPIC_API_KEY=",
    "ALLOW_CLAUDE_REWRITE=false",
    "",
    "# Perplexity news research",
    "PERPLEXITY_API_KEY=",
    "ALLOW_PERPLEXITY=false",
    "",
    "# Pixabay flag",
    "ALLOW_PIXABAY=false",
  ];

  const raw = readFileSync(ENV_PATH, "utf8");
  const env = parseEnv(raw);
  const added = [];
  const skipped = [];

  let append = "";
  for (const line of PLACEHOLDERS) {
    if (line.startsWith("#") || line === "") {
      append += line + "\n";
      continue;
    }
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    if (env.has(key)) {
      skipped.push(key);
    } else {
      append += line + "\n";
      added.push(key);
    }
  }

  writeFileSync(ENV_PATH, raw.trimEnd() + "\n" + append, "utf8");
  console.log("Added keys:", added.join(", ") || "(none)");
  console.log("Skipped (already exist):", skipped.join(", ") || "(none)");
}

// --- main ---
const [, , command, ...args] = process.argv;

switch (command) {
  case "check":
    cmdCheck();
    break;
  case "flags":
    cmdFlags();
    break;
  case "set-flag":
    cmdSetFlag(args[0], args[1]);
    break;
  case "add-placeholders":
    cmdAddPlaceholders();
    break;
  case "run-with-env": {
    // .env.local 환경변수를 주입해 스크립트 실행. API 키 값 콘솔 출력 없음.
    const scriptToRun = args[0];
    if (!scriptToRun) {
      console.error("Usage: env-safe.mjs run-with-env <script.mjs>");
      process.exit(1);
    }
    const envMap = loadEnv();
    const injectedEnv = { ...process.env };
    for (const [k, v] of envMap) { injectedEnv[k] = v; }
    // 존재 여부만 로그 (값 출력 금지)
    for (const key of API_KEY_CHECKLIST) {
      console.log(`[env] ${key}: ${injectedEnv[key] ? "present" : "missing"}`);
    }
    for (const key of FLAG_ALLOWLIST) {
      if (injectedEnv[key] !== undefined) console.log(`[env] ${key}=${injectedEnv[key]}`);
    }
    const runResult = spawnSync("node", [scriptToRun], {
      env: injectedEnv,
      stdio: "inherit",
      cwd: join(__dirname, ".."),
      timeout: 360000,
    });
    process.exit(runResult.status ?? 1);
  }
  default:
    console.error(`Unknown command: "${command}"`);
    console.error("Available: check | flags | set-flag KEY true|false | add-placeholders | run-with-env <script>");
    process.exit(1);
}
