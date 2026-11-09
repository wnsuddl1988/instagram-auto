import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const report = JSON.parse(fs.readFileSync(path.join(root, "assets/editorial-v2/production-assets/pa5c-r2/segmented/rig-sprite-sheet-report.json"), "utf8"));
const hash = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
assert.equal(report.assetId, "RIG_SPRITE_SHEET_PRIMARY_V1");
assert.equal(report.components.length, 9);
for (const [gate, value] of Object.entries(report.qa)) assert.equal(value, true, `SOURCE_QA_FAILED:${gate}`);
for (const component of report.components) { assert.equal(hash(component.path), component.sha256); assert.equal(component.alpha.pass, true, `ALPHA_FAILED:${component.id}`); assert.ok(fs.statSync(component.path).size > 1000); }
assert.equal(report.externalRequests, 0); assert.equal(report.imageGenerationRequests, 0); assert.equal(report.ttsRequests, 0); assert.equal(report.videoProviderRequests, 0); assert.equal(report.request03Used, true);
console.log("PA5C_R2_RIG_SPRITE_SHEET_CHECK: PASS (31/31)");
