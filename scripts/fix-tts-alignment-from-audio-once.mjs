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
let al = alDoc.alignment;
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

// 1b) 끝 글자 붕괴 보정(2026-10-14, 부엉 52편 재녹음): eleven_v3 alignment의 마지막 몇 글자가 길이 0으로 한 점에 몰리는 때가 있다
// ("궁금한 제도는 댓글로 남겨줘." 중 "댓글로 남겨줘."가 전부 111.30초, 실제 음성은 112.16초까지) → 자막이 소리 끝나기 전에 사라진다.
// 뒤에서부터 길이 0인 글자가 3개 이상 이어지고, 오디오의 마지막 발화 끝이 마지막 정상 글자 끝보다 0.3초 이상 뒤면
// 그 글자들을 [마지막 정상 글자 끝, 실제 발화 끝]에 고르게 편다. 장면 이동 보정(아래)과 별개로 항상 먼저 본다.
let tailFix = null;
{
  const ch = al.characters;
  const st = al.character_start_times_seconds;
  const en = al.character_end_times_seconds;
  let k = ch.length;
  while (k > 0 && en[k - 1] - st[k - 1] < 0.005) k -= 1;
  const run = ch.length - k;
  const T0 = k > 0 ? en[k - 1] : 0;
  const real = speech.length ? Math.min(speech[speech.length - 1][1], total) : null;
  if (run >= 3 && real != null && real - T0 >= 0.3) {
    const D = real - T0;
    const st2 = st.slice();
    const en2 = en.slice();
    for (let i = k; i < ch.length; i += 1) {
      st2[i] = +(T0 + ((i - k) / run) * D).toFixed(3);
      en2[i] = +(T0 + ((i - k + 1) / run) * D).toFixed(3);
    }
    al = { ...al, character_start_times_seconds: st2, character_end_times_seconds: en2 };
    tailFix = { chars: run, from: +T0.toFixed(2), to: +real.toFixed(2), text: ch.slice(k).join("").trim() };
    console.log(`끝 글자 붕괴 보정: "${tailFix.text}" ${run}글자가 ${tailFix.from}초에 몰려 있음 → 실제 발화 끝 ${tailFix.to}초까지 펴서 배치`);
  } else if (run >= 3) {
    console.warn(`⚠ 끝 글자 ${run}개가 길이 0이지만 오디오 발화 끝(${real?.toFixed?.(2)})과 차이가 0.3초 미만 — 보정 안 함`);
  }
}

// 1c) 태그가 첫 어절 발화를 먹는 경우(2026-10-14, 부엉 55편 재녹음): 장면 앞 연출 태그("[clearly]")에 alignment가 0.4초를 주고
// 첫 어절("셋째,")은 그 뒤로 미뤘는데, 실제 소리는 태그 시각(78.99~79.41초)에 났다 → 자막이 소리보다 늦게 떠 QA "음성이 끝나기 전에
// 자막이 사라지는 발화". 장면 전체 이동량은 -0.06초라 아래 ②에서 안 잡힌다. 태그 시작~첫 어절 시작 사이(0.25초 이상)에서
// 0.2초 이상 이어지는 발화가 시작되면, 태그 글자를 [태그 시작, 발화 시작]에 몰고 첫 어절을 [발화 시작, 원래 끝]에 고르게 편다.
const tagFixes = [];
{
  const ch = al.characters;
  const st = al.character_start_times_seconds.slice();
  const en = al.character_end_times_seconds.slice();
  for (let i = 0; i < ch.length; i += 1) {
    if (ch[i] !== "[") continue;
    let j = i;
    while (j < ch.length && ch[j] !== "]") j += 1;
    if (j >= ch.length) break;
    let w0 = j + 1;
    while (w0 < ch.length && /\s/.test(ch[w0])) w0 += 1;
    if (w0 >= ch.length || ch[w0] === "[") { i = j; continue; }
    let w1 = w0;
    while (w1 + 1 < ch.length && !/\s/.test(ch[w1 + 1]) && ch[w1 + 1] !== "[") w1 += 1;
    const tagS = st[i], wS = st[w0], E = en[w1];
    const a = wS - tagS >= 0.25 ? speech.find(([s, e]) => s >= tagS - 0.05 && s <= wS - 0.2 && e - s >= 0.2) : null;
    if (a && a[0] < E - 0.1) {
      const R = a[0];
      for (let t = i; t < w0; t += 1) { st[t] = +(tagS + ((t - i) / (w0 - i)) * (R - tagS)).toFixed(3); en[t] = +(tagS + ((t - i + 1) / (w0 - i)) * (R - tagS)).toFixed(3); }
      const n = w1 - w0 + 1;
      for (let t = w0; t <= w1; t += 1) { st[t] = +(R + ((t - w0) / n) * (E - R)).toFixed(3); en[t] = +(R + ((t - w0 + 1) / n) * (E - R)).toFixed(3); }
      tagFixes.push({ origS: wS, to: +R.toFixed(3), text: ch.slice(w0, w1 + 1).join("") });
      console.log(`태그 뒤 첫 어절 보정: "${tagFixes.at(-1).text}" ${wS.toFixed(2)}초 → 실제 발화 시작 ${R.toFixed(2)}초 (태그 ${ch.slice(i, j + 1).join("")})`);
    }
    i = j;
  }
  if (tagFixes.length) al = { ...al, character_start_times_seconds: st, character_end_times_seconds: en };
}

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

if (fixedCount === 0 && !tailFix && !tagFixes.length) { console.log("보정할 씬 없음 — 원본 정렬 그대로 사용."); process.exit(0); }

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
if (tailFix) { // 마지막 씬의 발화 끝도 실제 값으로(요약에 붕괴된 값이 들어 있을 수 있다)
  const li = sc2.length - 1;
  sc2[li] = { ...sc2[li], spokenEndSec: tailFix.to, _origSpokenEndSec: sc2[li]._origSpokenEndSec ?? sum.scenes[li].spokenEndSec };
}
// 태그 보정으로 첫 어절이 당겨진 씬(이동 보정 안 한 씬)은 시작도 실제 발화 시작으로 — 화면 컷이 소리보다 늦지 않게
let firstTagIdx = Infinity;
for (const tf of tagFixes) {
  const idx = sum.scenes.findIndex((s) => Math.abs(s.startSec - tf.origS) < 0.03);
  if (idx < 0 || Math.abs(scenesInfo[idx].shift) >= THRESHOLD) continue;
  sc2[idx] = { ...sc2[idx], startSec: tf.to, spokenStartSec: tf.to, _origStartSec: sum.scenes[idx].startSec };
  firstTagIdx = Math.min(firstTagIdx, idx);
}
// endSec = 다음 씬 startSec(마지막은 타임라인 끝)
const endFrom = Math.min(firstFixedIdx >= 0 ? firstFixedIdx : Infinity, firstTagIdx, tailFix ? sc2.length - 1 : Infinity);
for (let i = Number.isFinite(endFrom) ? endFrom - 1 : sc2.length; i < sc2.length; i += 1) {
  if (i < 0) continue;
  sc2[i] = { ...sc2[i], endSec: +(i + 1 < sc2.length ? sc2[i + 1].startSec : Math.max(total, sc2[i].spokenEndSec)).toFixed(3) };
}
const sumOut = path.join(path.dirname(SUMMARY), path.basename(SUMMARY).replace(/\.json$/, ".audio-fixed.json"));
fs.writeFileSync(sumOut, JSON.stringify({ ...sum, alignmentPath: alOut, scenes: sc2, audioFixedFrom: path.basename(SUMMARY), audioFixedAt: new Date().toISOString() }, null, 2));
console.log(`\n보정 씬 ${fixedCount}개${tailFix ? " + 끝 글자 붕괴 보정" : ""}${tagFixes.length ? ` + 태그 뒤 첫 어절 ${tagFixes.length}곳` : ""}\n  alignment → ${alOut}\n  summary   → ${sumOut}`);
console.log("씬 시작·발화끝 변화:");
sc2.forEach((s, i) => { if (fixedCount > 0 ? i >= firstFixedIdx - 1 : i === sc2.length - 1) console.log(`  s${s.sceneNumber}: start ${sum.scenes[i].startSec} → ${s.startSec}, spokenEnd ${sum.scenes[i].spokenEndSec} → ${s.spokenEndSec}, end ${sum.scenes[i].endSec} → ${s.endSec}`); });
