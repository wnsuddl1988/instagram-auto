// 대본 새 독자 읽기(cold-read) 점검용 파일 생성 — CURRENT_STANDARDS 규칙 29.
// 대본 전체(오프닝·마무리 포함)를 번호 붙은 문장 목록으로 써서, 맥락 없는 서브에이전트가 파일 하나만 읽게 한다.
// 사용: node scripts/make-cold-read-file-once.mjs --scenes <scenes.json> --out <출력.txt>
//       node scripts/make-cold-read-file-once.mjs --spec scripts/_bull-ep14-assembly-spec.mjs --out <출력.txt>
// 읽기 전용(대본 파일은 수정하지 않는다). 제목·소재명·성과 같은 힌트는 넣지 않는다.
import fs from "node:fs";
import path from "node:path";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const scenesPath = arg("scenes");
const specPath = arg("spec");
const outPath = arg("out");
if ((!scenesPath && !specPath) || !outPath) {
  console.error("사용: --scenes <json> 또는 --spec <_*-assembly-spec.mjs>, 그리고 --out <txt>");
  process.exit(2);
}

let lines;
if (scenesPath) {
  const data = JSON.parse(fs.readFileSync(scenesPath, "utf8"));
  const arr = Array.isArray(data) ? data : data.scenes;
  if (!Array.isArray(arr)) {
    console.error("scenes JSON은 문자열 배열이거나 { scenes: [...] } 여야 한다.");
    process.exit(2);
  }
  lines = arr.map((s) => (typeof s === "string" ? s : s.narration ?? s.text ?? s.line ?? "")).filter(Boolean);
} else {
  const src = fs.readFileSync(specPath, "utf8");
  lines = [...src.matchAll(/narration:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
}

if (lines.length === 0) {
  console.error("대본 문장을 하나도 찾지 못했다.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, lines.map((t, i) => `${i + 1}. ${t}`).join("\n") + "\n");
const chars = lines.join(" ").length;
console.log(`cold-read 파일 생성: ${outPath} (${lines.length}문장, ${chars}자)`);
