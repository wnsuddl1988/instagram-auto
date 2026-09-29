import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const forwardedArgs = process.argv.slice(2);

function requestedPort(args) {
  const index = args.findIndex((arg) => arg === "--port" || arg === "-p");
  const candidate = index >= 0 ? Number(args[index + 1]) : 3000;
  return Number.isInteger(candidate) && candidate > 0 && candidate <= 65535 ? candidate : 3000;
}

const port = requestedPort(forwardedArgs);
const url = `http://localhost:${port}/money-shorts`;
const edgeExecutable = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((candidate) => existsSync(candidate));

if (!existsSync(nextBin)) {
  console.error("Next.js 실행 파일을 찾지 못했습니다. 먼저 pnpm install 상태를 확인해 주세요.");
  process.exit(1);
}

const child = spawn(process.execPath, [nextBin, "dev", "--webpack", ...forwardedArgs], {
  cwd: projectRoot,
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
  windowsHide: false,
});

let edgeOpened = false;
function openEdgeOnce() {
  if (edgeOpened || process.env.AUTOSHORTS_DEV_NO_OPEN === "1") return;
  edgeOpened = true;
  if (!edgeExecutable) {
    console.error("Microsoft Edge 실행 파일을 찾지 못해 브라우저를 자동으로 열지 않았습니다.");
    return;
  }
  const opener = spawn(edgeExecutable, [url], {
    cwd: projectRoot,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  opener.unref();
  console.log(`\nEdge에서 자동으로 엽니다: ${url}`);
}

function forward(stream, target) {
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    target.write(text);
    if (/\bReady\b|✓\s+Ready/i.test(text)) openEdgeOnce();
  });
}

forward(child.stdout, process.stdout);
forward(child.stderr, process.stderr);

function stopChild(signal) {
  if (!child.killed) child.kill(signal);
}

process.on("SIGINT", () => stopChild("SIGINT"));
process.on("SIGTERM", () => stopChild("SIGTERM"));
child.on("exit", (code, signal) => process.exitCode = code ?? (signal ? 1 : 0));
