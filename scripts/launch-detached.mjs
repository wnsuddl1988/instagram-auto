#!/usr/bin/env node
/** 오래 걸리는 작업을 도구 시간 제한과 무관하게 돌리는 분리 실행기. 사용: node scripts/launch-detached.mjs <로그파일> <스크립트> [인자...] */
import fs from "node:fs";
import { spawn } from "node:child_process";
const [logFile, script, ...rest] = process.argv.slice(2);
const out = fs.openSync(logFile, "a");
const child = spawn(process.execPath, [script, ...rest], { detached: true, stdio: ["ignore", out, out], windowsHide: true });
child.unref();
console.log(`분리 실행 pid ${child.pid} → ${logFile}`);
