#!/usr/bin/env node
/**
 * 음량 측정 (2026-09-30 품질 개선 — 편·캐릭터 사이 음량 균일성 점검).
 *
 * 통합 음량(LUFS), 최대 피크(dBTP)를 재고, 본편과 CTA 구간 음량 차이도 본다(--split-at 초).
 * 쇼츠·릴스 플랫폼은 대체로 -14 LUFS 안팎으로 재생 음량을 맞추므로, 편마다 음량이 들쭉날쭉하면
 * 어떤 편은 작게 들리고, 본편→CTA 전환에서 소리가 갑자기 커지거나 작아진다.
 *
 * 사용: node scripts/check-audio-loudness-once.mjs <영상1.mp4> [영상2.mp4 …] [--split-at 119.8]
 */

import { spawnSync } from "node:child_process";
import path from "node:path";

const argv = process.argv.slice(2);
const splitIndex = argv.indexOf("--split-at");
const splitAt = splitIndex >= 0 ? Number(argv[splitIndex + 1]) : null;
const files = argv.filter((a, i) => !a.startsWith("--") && !(splitIndex >= 0 && i === splitIndex + 1));
if (files.length === 0) {
  console.error("사용: node scripts/check-audio-loudness-once.mjs <영상.mp4> … [--split-at 초]");
  process.exit(2);
}

export function measureLoudness(file, { start = null, end = null } = {}) {
  const args = ["-hide_banner", "-nostats"];
  if (start !== null) args.push("-ss", String(start));
  if (end !== null) args.push("-to", String(end));
  args.push("-i", file, "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json", "-vn", "-f", "null", "-");
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  const text = `${r.stdout}\n${r.stderr}`;
  const json = text.slice(text.lastIndexOf("{"), text.lastIndexOf("}") + 1);
  try {
    const data = JSON.parse(json);
    return { lufs: Number(data.input_i), truePeak: Number(data.input_tp), lra: Number(data.input_lra) };
  } catch {
    return null;
  }
}

console.log("파일                                    통합 LUFS  피크 dBTP  판정");
for (const file of files) {
  const whole = measureLoudness(file);
  const name = path.basename(path.dirname(file)) + "/" + path.basename(file);
  if (!whole) {
    console.log(`${name.padEnd(40)} 측정 실패`);
    continue;
  }
  const verdict = whole.lufs < -17 ? "작음(-14 기준 3dB 이상 낮음)" : whole.lufs > -11 ? "큼" : "OK";
  console.log(`${name.padEnd(40)} ${whole.lufs.toFixed(1).padStart(8)}  ${whole.truePeak.toFixed(1).padStart(8)}  ${verdict}`);
  if (splitAt) {
    const main = measureLoudness(file, { end: splitAt });
    const cta = measureLoudness(file, { start: splitAt });
    if (main && cta) {
      const diff = cta.lufs - main.lufs;
      console.log(`   본편 ${main.lufs.toFixed(1)} / CTA ${cta.lufs.toFixed(1)} LUFS → 차이 ${diff >= 0 ? "+" : ""}${diff.toFixed(1)}dB ${Math.abs(diff) > 3 ? "⚠ 전환 때 음량이 튐" : "OK"}`);
    }
  }
}
