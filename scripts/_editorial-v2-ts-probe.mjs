// TS 모듈을 Node에서 실행하기 위한 공용 헬퍼.
//
// 이 repo에는 tsx/ts-node가 없으므로 tsc로 컴파일한 뒤 실행한다.
// 소스는 번들러(Next.js) 기준으로 작성되어 JSON import에 import attribute가
// 없으므로, 검증 실행용으로만 JSON을 JS 모듈로 감싸 치환한다.

import { execFileSync } from "node:child_process";
import {
  existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

function walk(dir, visit) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, visit);
    else visit(full, entry);
  }
}

function findFile(dir, name) {
  let found = null;
  walk(dir, (full, entry) => {
    if (!found && entry === name) found = full;
  });
  return found;
}

function listJsFiles(dir) {
  const files = [];
  walk(dir, (full, entry) => {
    if (entry.endsWith(".js") || entry.endsWith(".mjs")) files.push(full);
  });
  return files;
}

// [소스 디렉토리, JSON 파일명, 이 JSON을 import 하는 컴파일 산출물]
const JSON_DATA_FILES = [
  ["lib/editorial-v2", "editorial-cutline-data.json", "editorial-cutline.js"],
  ["lib/editorial-v2", "economic-source-registry-data.json", "economic-source-registry.js"],
];

/**
 * probeSource를 지정 디렉토리에 임시 .mts로 두고 컴파일·실행한 뒤
 * stdout의 JSON을 파싱해 반환한다.
 */
export function runTsProbe({ root, probeDir, probeSource, extraJsFiles = [] }) {
  const tmp = mkdtempSync(path.join(tmpdir(), "ev2probe-"));
  const probeName = `__probe_${process.pid}.mts`;
  const probeSrc = path.join(root, probeDir, probeName);

  try {
    writeFileSync(probeSrc, probeSource, "utf8");
    try {
      execFileSync(
        process.execPath,
        [
          path.join(root, "node_modules", "typescript", "bin", "tsc"),
          "--strict",
          "--target", "ES2022",
          "--module", "ESNext",
          "--moduleResolution", "bundler",
          "--resolveJsonModule",
          "--skipLibCheck",
          "--outDir", tmp,
          probeSrc,
        ],
        { cwd: root, stdio: "pipe" },
      );
    } catch (error) {
      const out = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
      throw new Error(`compile: ${out.slice(0, 1800)}`);
    } finally {
      rmSync(probeSrc, { force: true });
    }

    // tsc는 입력 파일들의 공통 루트에 맞춰 outDir 안 구조를 정하므로,
    // 컴파일 결과를 실제로 찾아서 위치를 확정한다.
    const compiledName = probeName.replace(/\.mts$/, ".mjs");
    const compiledPath = findFile(tmp, compiledName);
    if (!compiledPath) throw new Error(`compiled probe not found under ${tmp}`);
    const outDir = path.dirname(compiledPath);

    // 데이터 JSON을 이를 import 하는 모듈 옆에 JS 래퍼로 배치한다.
    for (const [srcDir, jsonFile, consumerJs] of JSON_DATA_FILES) {
      const consumer = findFile(tmp, consumerJs);
      const targetDir = consumer ? path.dirname(consumer) : outDir;
      const payload = readFileSync(path.join(root, srcDir, jsonFile), "utf8");
      writeFileSync(
        path.join(targetDir, jsonFile.replace(/\.json$/, ".js")),
        `export default ${payload};\n`,
        "utf8",
      );
    }

    // 컴파일 산출물의 상대 import를 Node ESM이 해석 가능한 형태로 고친다.
    // 소스는 번들러 기준(확장자 없음, JSON import attribute 없음)이므로
    // 검증 실행용으로만 .js를 붙이고 JSON을 JS 래퍼로 치환한다.
    for (const jsFile of listJsFiles(tmp)) {
      const patched = readFileSync(jsFile, "utf8")
        .replace(
          /(["'])((?:\.\.?\/)[\w\-/]*[\w-]+-data)\.json\1(\s*with\s*\{[^}]*\})?/g,
          "$1$2.js$1",
        )
        .replace(
          /(\bfrom\s*)(["'])((?:\.\.?\/)[\w\-/.]+)\2/g,
          (match, fromKeyword, quote, specifier) =>
            /\.(js|mjs|cjs|json)$/.test(specifier)
              ? match
              : `${fromKeyword}${quote}${specifier}.js${quote}`,
        );
      writeFileSync(jsFile, patched, "utf8");
    }

    const raw = execFileSync(process.execPath, [compiledPath], {
      cwd: root,
      stdio: "pipe",
      encoding: "utf8",
    });
    return JSON.parse(raw.trim());
  } catch (error) {
    const out = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    throw new Error(out.slice(0, 2000) || String(error.message));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function typecheck(root, files) {
  const tmp = mkdtempSync(path.join(tmpdir(), "ev2tsc-"));
  try {
    execFileSync(
      process.execPath,
      [
        path.join(root, "node_modules", "typescript", "bin", "tsc"),
        "--noEmit",
        "--strict",
        "--target", "ES2022",
        "--module", "ESNext",
        "--moduleResolution", "bundler",
        "--resolveJsonModule",
        "--skipLibCheck",
        "--outDir", tmp,
        ...files.map((file) => path.join(root, file)),
      ],
      { cwd: root, stdio: "pipe" },
    );
  } catch (error) {
    const out = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    throw new Error(out.slice(0, 2000) || "tsc failed with no output");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
