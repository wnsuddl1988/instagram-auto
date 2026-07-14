#!/usr/bin/env node
/** Read-only guard for range-capable Money Shorts final-video playback. */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const routePath = resolve(root, "app/api/money-shorts/operator/route.ts");
const wizardPath = resolve(root, "components/VideoCreationWizard.tsx");
const previewPath = resolve(root, "app/money-shorts/preview/page.tsx");
const route = existsSync(routePath) ? readFileSync(routePath, "utf8") : "";
const wizard = existsSync(wizardPath) ? readFileSync(wizardPath, "utf8") : "";
const preview = existsSync(previewPath) ? readFileSync(previewPath, "utf8") : "";

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${label}`);
  }
}

check("range-capable stream helper exists", /function videoStreamResponse\(bytes: Buffer, rangeHeader: string \| null\)/.test(route));
check("video stream advertises byte seeking", /"Accept-Ranges": "bytes"/.test(route) && /"Content-Range"/.test(route));
check("valid video ranges return partial content", /status:\s*206/.test(route) && route.includes("`bytes ${start}-${end}/${totalBytes}`"));
check("invalid video ranges fail closed", /status: 416/.test(route) && /bytes \*\/\$\{totalBytes\}/.test(route));
check("final video route passes the request range header", /videoStreamResponse\(bytes, request\.headers\.get\("range"\)\)/.test(route));
check("standalone preview page has one controlled video", /<video/.test(preview) && /controls/.test(preview) && /src=\{videoSrc\}/.test(preview) && /safeTopicId/.test(preview));
check("wizard offers the standalone preview link", /money-shorts\/preview\?topicId=/.test(wizard) && />\s*크게 보기\s*</.test(wizard));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
