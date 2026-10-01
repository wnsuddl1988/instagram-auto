#!/usr/bin/env node
/**
 * TTS 글자별 정렬(alignment)을 실제 오디오 발화 구간에 맞춰 보정한다 (2026-10-02, 황소 12편 사고).
 *
 * 사고: eleven_v3 "연속 생성"(한 번의 긴 호출)의 alignment가 중간(12편은 s12→s13 경계, 약 88.7초)부터 실제 오디오보다
 * 약 0.6~0.9초 앞섰다. 조립기는 alignment로 자막 시각을, 요약의 씬 시작·끝으로 화면 컷을 계산하므로 s13~s16에서
 * 자막이 소리보다 먼저 나왔다가 소리가 끝나기 전에 사라졌다(Owner 검수 지적). 오디오 파일 자체는 정상이다.
 *
 * 방법: 오디오를 무음 감지(silencedetect)해 실제 발화 구간을 얻고,
 *  ① 씬마다 alignment 어절 구간을 이동시켜 발화 구간과 가장 많이 겹치는 이동량(교차상관)을 구한다.
 *  ② 이동량 절댓값이 THRESHOLD(기본 0.2초) 이상인 씬만 보정한다(정상 씬은 그대로 둔다).
 *  ③ 보정 씬은 "발화 구간 수 = 세그먼트 수"면 세그먼트마다, 아니면 씬 전체를 시작→시작·끝→끝으로 선형 매핑한다.
 *  ④ 새 alignment 와 새 요약(씬 startSec·spoken*·endSec 이동)을 따로 저장한다(원본은 그대로).
 *
 * 사용:
 *   node scripts/fix-tts-alignment-from-audio-once.mjs --tts-summary <…/elevenlabs-scene-paced-tts-summary.json> \
 *     --tts-script <…/tts-script.json> [--threshold 0.2]
 * 결과: <요약 폴더>/…audio-fixed.alignment.json, …audio-fixed-summary.json (조립·CTA 결합에 이 둘을 쓴다).
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const SUMMARY = arg("--tts-summary");
const TTS_SCRIPT = arg("--tts-script");
const THRESHOLD = Number(arg("--threshold") ?? 0.3); // 교차상관 노이즈(±0.25초)보다 크게
if (!SUMMARY || !TTS_SCRIPT) { console.error("ABORT: --tts-summary --tts-script 필요"); process.exit(2); }

const sum = JSON.parse(fs.readFileSync(SUMMARY, "utf8"));
const script = JSON.parse(fs.readFileSync(TTS_SCRIPT, "utf8"));
const alDoc = JSON.parse(fs.readFileSync(sum.alignmentPath, "utf8"));
const al = alDoc.alignment;
const audioPath = sum.timelineAudioPath ?? sum.scenes[0].audioPath;
const total = sum.timelineDurationSec;

// 1) 실제 발화 구간
const r = spawnSync("ffmpeg", ["-hide_banner", "-i", audioPath, "-af", "silencedetect=noise=-38dB:d=0.08", "-vn", "-f", "null", "-"], { encoding: "utf8" });
const ss = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const se = [...r.stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
const speech = [];
let cur = 0;
for (let i = 0; i < ss.length; i += 1) { if (ss[i] > cur + 0.02) speech.push([cur, ss[i]]); cur = se[i] ?? total; }
if (cur < total) speech.push([cur, total]);

// 2) alignment 어절(태그 제외) — 글자 인덱스 포함
const words = [];
{
  let w = "", wi0 = null, inTag = false;
  for (let i = 0; i < al.characters.length; i += 1) {
    const c = al.characters[i];
    if (c === "[") inTag = true;
    if (!inTag) {
      if (/\s/.test(c)) { if (w) { words.push({ i0: wi0, i1: i - 1 }); w = ""; wi0 = null; } }
      else { if (wi0 === null) wi0 = i; w += c; }
    }
    if (c === "]") inTag = false;
  }
  if (w) words.push({ i0: wi0, i1: al.characters.length - 1 });
}
for (const x of words) { x.s = al.character_start_times_seconds[x.i0]; x.e = al.character_end_times_seconds[x.i1]; }

// 3) 씬별 어절·세그먼트 범위(스크립트의 performanceText 어절 수로 분배)
const wc = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;
let cursor = 0;
const scenesInfo = sum.scenes.map((sc) => {
  const ts = script.scenes.find((x) => x.sceneNumber === sc.sceneNumber);
  const segs = ts.speechDirection.segments.map((g) => wc(g.text));
  const total = segs.reduce((a, b) => a + b, 0);
  const ws = words.slice(cursor, cursor + total);
  cursor += total;
  let k = 0;
  const segRanges = segs.map((n) => { const part = ws.slice(k, k + n); k += n; return { s: part[0].s, e: part[part.length - 1].e }; });
  return { sc, ws, segRanges, A0: ws[0].s, A1: ws[ws.length - 1].e };
});
if (cursor !== words.length) console.warn(`⚠ 어절 수 불일치: 스크립트 ${cursor} vs alignment ${words.length}`);

const ov = (a, b) => Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
const mergeGap = (arr, gap) => { const out = []; for (const x of arr) { const l = out[out.length - 1]; if (l && x[0] - l[1] < gap) l[1] = x[1]; else out.push([...x]); } return out; };

// 4) 씬별 이동량 + 앵커
const report = [];
const anchors = []; // [alignmentTime, realTime]
let fixedCount = 0;
// 밀림은 연속적으로 변한다 — 이전 씬의 이동량에서 ±0.8초 안에서만 찾는다(2026-10-02 황소 14편 사고: 전체 범위를
// 찾으면 s15가 다음 씬(s16) 발화에 걸려 이동 1.48초·발화끝이 s16 안으로 들어가는 가짜 최대값이 나왔다. 실제는 약 +0.56초).
let prevShift = 0;
for (const info of scenesInfo) {
  let best = { sh: prevShift, sc: -1 };
  for (let sh = prevShift - 0.8; sh <= prevShift + 0.8 + 1e-9; sh += 0.02) {
    let sc = 0;
    for (const w of info.ws) for (const a of speech) sc += ov([w.s + sh, w.e + sh], a);
    // 앞 씬 이동량에서 멀수록 감점(0.4점/초) — 겹침 점수가 거의 평평한 씬(14편 s15: 0.56초 4.07 vs 1.36초 4.11)에서
    // 다음 씬 발화에 걸린 가짜 최대값 대신 연속적인 이동량을 고르게 한다. 진짜 밀림 점프(0.6초 안팎)는 겹침 차이가 이보다 크다.
    sc -= 0.4 * Math.abs(sh - prevShift);
    if (sc > best.sc + 1e-9) best = { sh, sc };
  }
  info.shift = best.sh;
  prevShift = best.sh;
  const apply = Math.abs(best.sh) >= THRESHOLD;
  if (!apply) {
    // 정상 씬은 "이동 0" 앵커로 고정한다 — 앞뒤 보정 씬의 선형 보간이 정상 씬 안으로 번지지 않게
    anchors.push([info.A0, info.A0], [info.A1, info.A1]);
    report.push({ scene: info.sc.sceneNumber, shift: +best.sh.toFixed(2), fixed: false });
    continue;
  }
  fixedCount += 1;
  // 보정 구간 후보: 이동한 씬 범위 ±0.4 안에 중점이 있는 발화 구간, 짧은 틈(<0.25s)은 합침
  const lo = info.A0 + best.sh - 0.4, hi = info.A1 + best.sh + 0.4;
  const ivs = mergeGap(speech.filter((a) => (a[0] + a[1]) / 2 >= lo && (a[0] + a[1]) / 2 <= hi && a[1] - a[0] > 0.12), 0.25);
  let mode;
  if (ivs.length === info.segRanges.length) {
    mode = "segment";
    info.segRanges.forEach((g, k) => { anchors.push([g.s, ivs[k][0]]); anchors.push([g.e, ivs[k][1]]); });
  } else if (ivs.length > 0) {
    mode = "scene";
    anchors.push([info.A0, ivs[0][0]]);
    anchors.push([info.A1, ivs[ivs.length - 1][1]]);
  } else {
    mode = "shift-only";
    anchors.push([info.A0, info.A0 + best.sh]);
    anchors.push([info.A1, info.A1 + best.sh]);
  }
  report.push({ scene: info.sc.sceneNumber, shift: +best.sh.toFixed(2), fixed: true, mode, intervals: ivs.length, segments: info.segRanges.length });
}
console.log("씬별 이동량·보정 여부:");
for (const x of report) console.log(`  s${x.scene}: 이동 ${x.shift}초 ${x.fixed ? `→ 보정(${x.mode}, 발화구간 ${x.intervals}/세그먼트 ${x.segments})` : "→ 정상(유지)"}`);

if (fixedCount === 0) { console.log("보정할 씬 없음 — 원본 정렬 그대로 사용."); process.exit(0); }

// 5) 구간 선형 매핑: 앵커 사이는 선형 보간, 첫 앵커 앞은 0 이동(원본 유지), 마지막 앵커 뒤는 마지막 이동량 유지
anchors.sort((a, b) => a[0] - b[0]);
const first = anchors[0];
// 모든 씬(정상 씬은 이동 0)이 앵커를 가지므로 씬 사이 간격만 앞뒤 앵커로 선형 보간된다.
const mapAll = (t) => {
  if (t <= first[0]) return t;
  for (let i = 0; i < anchors.length - 1; i += 1) {
    const [a0, r0] = anchors[i], [a1, r1] = anchors[i + 1];
    if (t >= a0 && t <= a1) return a1 === a0 ? r0 : r0 + ((t - a0) * (r1 - r0)) / (a1 - a0);
  }
  const last = anchors[anchors.length - 1];
  return t + (last[1] - last[0]);
};
const newStart = al.character_start_times_seconds.map(mapAll);
const newEnd = al.character_end_times_seconds.map(mapAll);
const fixedAl = { ...alDoc, alignment: { ...al, character_start_times_seconds: newStart.map((x) => +x.toFixed(3)), character_end_times_seconds: newEnd.map((x) => +x.toFixed(3)) } };
const dir = path.dirname(sum.alignmentPath);
const base = path.basename(sum.alignmentPath).replace(/\.alignment\.json$/, "");
const alOut = path.join(dir, `${base}.audio-fixed.alignment.json`);
fs.writeFileSync(alOut, JSON.stringify(fixedAl));

// 6) 요약: 보정이 시작된 씬부터 startSec/spoken*/endSec 이동
const firstFixedIdx = scenesInfo.findIndex((s) => Math.abs(s.shift) >= THRESHOLD);
const sc2 = sum.scenes.map((sc, idx) => {
  const info = scenesInfo[idx];
  if (idx < firstFixedIdx || Math.abs(info.shift) < THRESHOLD) return sc; // 정상 씬은 원본 그대로
  const A0 = mapAll(info.A0), A1 = mapAll(info.A1);
  return { ...sc, startSec: +A0.toFixed(3), spokenStartSec: +A0.toFixed(3), spokenEndSec: +A1.toFixed(3), _origStartSec: sc.startSec, _origSpokenEndSec: sc.spokenEndSec };
});
// endSec = 다음 씬 startSec(마지막은 타임라인 끝)
for (let i = firstFixedIdx - 1; i < sc2.length; i += 1) {
  if (i < 0) continue;
  sc2[i] = { ...sc2[i], endSec: +(i + 1 < sc2.length ? sc2[i + 1].startSec : Math.max(total, sc2[i].spokenEndSec)).toFixed(3) };
}
const sumOut = path.join(path.dirname(SUMMARY), path.basename(SUMMARY).replace(/\.json$/, ".audio-fixed.json"));
fs.writeFileSync(sumOut, JSON.stringify({ ...sum, alignmentPath: alOut, scenes: sc2, audioFixedFrom: path.basename(SUMMARY), audioFixedAt: new Date().toISOString() }, null, 2));
console.log(`\n보정 씬 ${fixedCount}개\n  alignment → ${alOut}\n  summary   → ${sumOut}`);
console.log("씬 시작·발화끝 변화:");
sc2.forEach((s, i) => { if (i >= firstFixedIdx - 1) console.log(`  s${s.sceneNumber}: start ${sum.scenes[i].startSec} → ${s.startSec}, spokenEnd ${sum.scenes[i].spokenEndSec} → ${s.spokenEndSec}, end ${sum.scenes[i].endSec} → ${s.endSec}`); });
