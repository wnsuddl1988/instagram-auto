/**
 * upload_002_copier — TTS 오디오 조립 스크립트 v2
 *
 * [호출 계약]
 * - Jun/Hyun TTS raw (jun_hyun_tts_raw.mp3) — 외부 재호출 0회
 * - Boss/Theo TTS raw (boss_theo_tts_raw.mp3) — 외부 재호출 0회
 * - 타이밍은 로컬 오프셋으로만 조정
 *
 * [v2 변경점]
 * - source video: silent_v2 (36.500s, 1080×1920)
 * - silencedetect: -30dB:d=0.40 (v1: -35dB:d=0.25)
 * - Jun 10구간→7문장 매핑: LINE_SEGS
 * - offset v2: [0.2, 2.63, 6.2, 8.67, 10.13, 23.5, 32.55]
 * - Boss offset: 30.0s
 *
 * [실행]
 * node scripts/_upload002-tts-assemble.mjs
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// ── 경로 설정 ───────────────────────────────────────────────────────────────
const BASE      = 'output/v2/3d_sitcom_prod_v1/upload_002_copier';
const AUDIO_DIR = path.join(BASE, 'audio');
const SILENT_MP4 = path.join(BASE, 'final/upload_002_copier_silent_v2.mp4');

const JUN_RAW   = path.join(AUDIO_DIR, 'jun_hyun_tts_raw.mp3');
const BOSS_RAW  = path.join(AUDIO_DIR, 'boss_theo_tts_raw.mp3');
const BASE_WAV  = path.join(AUDIO_DIR, 'base_silence_36s5.wav');
const MIXED_AAC = path.join(AUDIO_DIR, 'mixed_audio_v2.aac');
const FINAL_MP4 = path.join(BASE, 'final/upload_002_copier_final_v1.mp4');

// ── 상수 v2 ─────────────────────────────────────────────────────────────────
const TOTAL_DURATION_S  = 36.5;
const JUN_SENTENCE_COUNT = 7;
const SILENCE_FILTER    = 'silencedetect=noise=-30dB:d=0.40';

// 10구간→7문장 매핑 (silencedetect -30dB:d=0.40 결과 기준)
// 문장 내 마침표 포즈까지 감지되므로 구간을 합산해 문장 단위로 묶음
const LINE_SEGS = [
  [0, 1],  // J1: "한 장만. 진짜 딱 한 장만."
  [2, 3],  // J2: "화 안 낼게. 우리 오늘 좋게 끝내자."
  [4, 5],  // J3: "그래. 그렇지."
  [6],     // J4: "근데 왜 계속 나오지?"
  [7],     // J5: "한 장이라고."
  [8],     // J6: "우리 좋게 끝내기로 했잖아."
  [9],     // J7: "제 열정 말고, 용지가요."
];

// offset v2 (영상 절대 시간, 초)
const JUN_OFFSETS_S = [
  0.20,   // J1 — S1 시작 직후
  2.63,   // J2 — J1 종료 후 0.20s
  6.20,   // J3 — S2 진입 직후
  8.67,   // J4 — J3 종료 후 0.40s
  10.13,  // J5 — J4 종료 후 0.40s
  23.50,  // J6 — S4 초반 탈력 시점
  32.55,  // J7 — Boss 종료 후 0.60s (Boss end 31.950 + 0.60)
];

const BOSS_OFFSET_S = 30.0;  // S5 손 등장 직후

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function run(cmd, label) {
  console.log(`\n[RUN] ${label}`);
  const result = spawnSync(cmd, { shell: true, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`[FAIL] ${label}`);
    console.error(result.stderr?.slice(0, 500));
    process.exit(1);
  }
  return result.stdout.trim();
}

function ffprobe(file, stream = 'a') {
  const out = spawnSync(
    `ffprobe -v quiet -select_streams ${stream}:0 -show_entries stream=duration -of csv=p=0 "${file}"`,
    { shell: true, encoding: 'utf8' }
  );
  return parseFloat(out.stdout.trim()) || 0;
}

function md5File(file) {
  return createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

// ── Step 0: 입력 파일 존재 확인 ──────────────────────────────────────────────
console.log('=== upload_002_copier TTS 조립 v2 ===');
console.log('[GATE] 입력 파일 확인...');

const required = { Video: SILENT_MP4, 'Jun TTS': JUN_RAW, 'Boss TTS': BOSS_RAW };
for (const [label, p] of Object.entries(required)) {
  if (!fs.existsSync(p)) {
    console.error(`[ABORT] ${label} 없음: ${p}`);
    process.exit(1);
  }
  console.log(`  [OK] ${label}: ${p.split(/[\\/]/).pop()} (${fs.statSync(p).size} bytes)`);
}

// ── Step 1: 출력 디렉토리 생성 ───────────────────────────────────────────────
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(path.join(BASE, 'final'), { recursive: true });

// ── Step 2: duration 측정 ────────────────────────────────────────────────────
console.log('\n[Step 2] Duration 측정...');
const junDuration  = ffprobe(JUN_RAW);
const bossDuration = ffprobe(BOSS_RAW);
console.log(`  Jun:  ${junDuration.toFixed(3)}s`);
console.log(`  Boss: ${bossDuration.toFixed(3)}s`);

// ── Step 3: Jun 문장 경계 탐지 (silencedetect -30dB:d=0.40) ─────────────────
console.log('\n[Step 3] Jun 문장 경계 탐지...');

const silenceOut = spawnSync(
  `ffmpeg -i "${JUN_RAW}" -af ${SILENCE_FILTER} -f null - 2>&1`,
  { shell: true, encoding: 'utf8' }
);
const silenceLog = silenceOut.stdout + silenceOut.stderr;

const silenceStarts = [...silenceLog.matchAll(/silence_start: ([\d.]+)/g)].map(m => parseFloat(m[1]));
const silenceEnds   = [...silenceLog.matchAll(/silence_end: ([\d.]+)/g)].map(m => parseFloat(m[1]));

console.log(`  pause 감지: ${silenceStarts.length}개`);

// 전체 발화 구간 (10개) 추출
const rawSegs = [];
let prevEnd = 0;
for (let i = 0; i < silenceStarts.length; i++) {
  const segEnd = silenceStarts[i];
  if (segEnd - prevEnd > 0.05) {
    rawSegs.push({ start: prevEnd, end: segEnd, dur: segEnd - prevEnd });
  }
  prevEnd = silenceEnds[i] ?? silenceStarts[i] + 0.1;
}
if (junDuration - prevEnd > 0.05) {
  rawSegs.push({ start: prevEnd, end: junDuration, dur: junDuration - prevEnd });
}
console.log(`  원시 구간: ${rawSegs.length}개`);

// ── Step 4: 10구간 → 7문장 매핑 ─────────────────────────────────────────────
console.log('\n[Step 4] 7문장 매핑...');

if (rawSegs.length < 10) {
  console.error(`[ABORT] 원시 구간 ${rawSegs.length}개 — 10개 이상 필요 (임계값 확인)`);
  process.exit(1);
}

const sentences = LINE_SEGS.map((idxs, ji) => {
  const start = rawSegs[idxs[0]].start;
  const end   = rawSegs[idxs[idxs.length - 1]].end;
  return { start, end, dur: end - start };
});

sentences.forEach((s, i) =>
  console.log(`  J${i + 1}: ${s.start.toFixed(3)}s ~ ${s.end.toFixed(3)}s (${s.dur.toFixed(3)}s)`)
);

if (sentences.length !== JUN_SENTENCE_COUNT) {
  console.error(`[ABORT] 문장 수 ${sentences.length} ≠ ${JUN_SENTENCE_COUNT}`);
  process.exit(1);
}
console.log(`[OK] 7문장 매핑 완료`);

// ── Step 5: 배치 계획 검증 ───────────────────────────────────────────────────
console.log('\n[Step 5] 배치 계획 검증...');

let validationFail = false;
let prevAbsEnd = 0;

for (let i = 0; i < JUN_SENTENCE_COUNT; i++) {
  const offset = JUN_OFFSETS_S[i];
  const dur    = sentences[i].dur;
  const end    = offset + dur;
  const gap    = offset - prevAbsEnd;

  if (gap < 0) {
    console.error(`[FAIL] J${i + 1} overlap — gap=${gap.toFixed(3)}s`);
    validationFail = true;
  }
  if (end > TOTAL_DURATION_S) {
    console.error(`[FAIL] J${i + 1} overflow — end=${end.toFixed(3)}s > ${TOTAL_DURATION_S}s`);
    validationFail = true;
  }
  console.log(`  J${i + 1}: ${offset}s + ${dur.toFixed(3)}s = ${end.toFixed(3)}s gap=${gap.toFixed(3)}s ${gap >= 0 && end <= TOTAL_DURATION_S ? '✅' : '❌'}`);
  prevAbsEnd = end;
}

const bossEnd = BOSS_OFFSET_S + bossDuration;
const lastEnd = Math.max(prevAbsEnd, bossEnd);
const tail    = TOTAL_DURATION_S - lastEnd;

console.log(`  Boss: ${BOSS_OFFSET_S}s + ${bossDuration.toFixed(3)}s = ${bossEnd.toFixed(3)}s ✅`);
console.log(`  Tail: ${tail.toFixed(3)}s ${tail >= 0.3 ? '✅' : '❌'}`);

if (tail < 0.3) { console.error('[FAIL] tail < 0.3s'); validationFail = true; }
if (validationFail) { console.error('\n[ABORT] 배치 검증 실패'); process.exit(1); }
console.log('[OK] 배치 검증 PASS');

// ── Step 6: Jun 문장 구간 분리 (TTS 내 상대 시간 기준) ──────────────────────
console.log('\n[Step 6] Jun 문장 구간 분리...');
const junSegFiles = [];

for (let i = 0; i < sentences.length; i++) {
  const seg     = sentences[i];
  const outFile = path.join(AUDIO_DIR, `jun_seg_v2_${i + 1}.wav`);
  run(
    `ffmpeg -y -i "${JUN_RAW}" -ss ${seg.start.toFixed(3)} -to ${seg.end.toFixed(3)} -c:a pcm_s16le "${outFile}"`,
    `J${i + 1} 분리 (${seg.start.toFixed(3)}~${seg.end.toFixed(3)}s)`
  );
  junSegFiles.push(outFile);
}
console.log(`[OK] ${junSegFiles.length}개 구간 분리 완료`);

// ── Step 7: 36.5s 무음 베이스 WAV ────────────────────────────────────────────
console.log('\n[Step 7] 무음 베이스 WAV 생성...');
run(
  `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${TOTAL_DURATION_S} -c:a pcm_s16le "${BASE_WAV}"`,
  `${TOTAL_DURATION_S}s 무음 베이스`
);

// ── Step 8: amix (base + jun×7 + boss) ───────────────────────────────────────
console.log('\n[Step 8] amix 오디오 조합...');

// inputs: [0]=base, [1~7]=jun segs, [8]=boss
const inputs = [`-i "${BASE_WAV}"`];
junSegFiles.forEach(f => inputs.push(`-i "${f}"`));
inputs.push(`-i "${BOSS_RAW}"`);

const filterParts = [];

for (let i = 0; i < JUN_SENTENCE_COUNT; i++) {
  const ms = Math.round(JUN_OFFSETS_S[i] * 1000);
  filterParts.push(`[${i + 1}:a]adelay=${ms}|${ms}[j${i + 1}]`);
}

const bossMs = Math.round(BOSS_OFFSET_S * 1000);
filterParts.push(`[8:a]adelay=${bossMs}|${bossMs}[boss]`);

const mixInputs = ['[0:a]', ...Array.from({ length: 7 }, (_, i) => `[j${i + 1}]`), '[boss]'].join('');
filterParts.push(`${mixInputs}amix=inputs=9:duration=first:normalize=0[aout]`);

const filterComplex = filterParts.join('; ');

run(
  `ffmpeg -y ${inputs.join(' ')} -filter_complex "${filterComplex}" -map [aout] -ar 44100 -ac 2 -c:a aac -b:a 192k "${MIXED_AAC}"`,
  'amix 오디오 조합'
);

// ── Step 9: 영상 + 오디오 합성 ───────────────────────────────────────────────
console.log('\n[Step 9] silent_v2 + 오디오 합성...');
run(
  `ffmpeg -y -i "${SILENT_MP4}" -i "${MIXED_AAC}" -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_MP4}"`,
  'final_v1 합성'
);

// ── Step 10: QA ──────────────────────────────────────────────────────────────
console.log('\n[Step 10] final_v1 QA...');

const vidDur   = ffprobe(FINAL_MP4, 'v');
const audDur   = ffprobe(FINAL_MP4, 'a');
const fileSize = fs.statSync(FINAL_MP4).size;
const fileMd5  = md5File(FINAL_MP4);

// ffprobe 상세 (해상도/fps/코덱)
const probeOut = spawnSync(
  `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -of json "${FINAL_MP4}"`,
  { shell: true, encoding: 'utf8' }
);
const probeJson = JSON.parse(probeOut.stdout || '{"streams":[{}]}');
const vs = probeJson.streams[0] || {};
const [fpsNum, fpsDen] = (vs.r_frame_rate || '24/1').split('/').map(Number);
const fps = Math.round(fpsNum / fpsDen);

// loudness
const loudOut = spawnSync(
  `ffmpeg -i "${FINAL_MP4}" -filter_complex ebur128=peak=true -f null - 2>&1`,
  { shell: true, encoding: 'utf8' }
);
const loudLog   = loudOut.stdout + loudOut.stderr;
const lufsMatch = loudLog.match(/I:\s+([-\d.]+)\s+LUFS/);
const peakMatch = loudLog.match(/Peak:\s+([-\d.]+)\s+dBFS/);
const lufs      = lufsMatch ? parseFloat(lufsMatch[1]) : null;
const peak      = peakMatch ? parseFloat(peakMatch[1]) : null;

// QA 판정
const durOk     = Math.abs(vidDur - TOTAL_DURATION_S) < 0.5;
const resOk     = vs.width === 1080 && vs.height === 1920;
const fpsOk     = fps === 24;
const codecOk   = vs.codec_name === 'h264';
const audioOk   = audDur > 0;
const loudOk    = lufs !== null ? (lufs >= -18 && lufs <= -10) : true;
const peakOk    = peak !== null ? peak <= -1 : true;

console.log('\n=== QA 결과 ===');
console.log(`  파일:     ${FINAL_MP4.split(/[\\/]/).pop()}`);
console.log(`  크기:     ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  MD5:      ${fileMd5}`);
console.log(`  해상도:   ${vs.width}×${vs.height} ${resOk ? '✅' : '❌'}`);
console.log(`  FPS:      ${fps} ${fpsOk ? '✅' : '❌'}`);
console.log(`  코덱:     ${vs.codec_name} ${codecOk ? '✅' : '❌'}`);
console.log(`  영상길이: ${vidDur.toFixed(3)}s ${durOk ? '✅' : '⚠️'}`);
console.log(`  오디오:   ${audDur.toFixed(3)}s ${audioOk ? '✅' : '❌'}`);
console.log(`  Loudness: ${lufs !== null ? lufs.toFixed(1) + ' LUFS' : 'N/A'} ${loudOk ? '✅' : '⚠️'}`);
console.log(`  Peak:     ${peak !== null ? peak.toFixed(1) + ' dBFS' : 'N/A'} ${peakOk ? '✅' : '⚠️'}`);

const allPass = durOk && resOk && fpsOk && codecOk && audioOk && peakOk;
console.log(`\n  [${allPass ? 'PASS' : 'WARN'}] 기술 QA ${allPass ? '✅' : '⚠️ 일부 확인 필요'}`);

// 대사 싱크 QA 보고
console.log('\n=== 대사 싱크 QA (계산 기준) ===');
const syncItems = [
  { label: 'J1 S1(0~6s) 내', ok: JUN_OFFSETS_S[0] + sentences[0].dur <= 6.0 },
  { label: 'J2 S1(0~6s) 내', ok: JUN_OFFSETS_S[1] + sentences[1].dur <= 6.0 },
  { label: 'J3 S2(6~14.5s) 내', ok: JUN_OFFSETS_S[2] >= 6.0 && JUN_OFFSETS_S[2] + sentences[2].dur <= 14.5 },
  { label: 'J4 S2(6~14.5s) 내', ok: JUN_OFFSETS_S[3] >= 6.0 && JUN_OFFSETS_S[3] + sentences[3].dur <= 14.5 },
  { label: 'J5 S2(6~14.5s) 내', ok: JUN_OFFSETS_S[4] >= 6.0 && JUN_OFFSETS_S[4] + sentences[4].dur <= 14.5 },
  { label: 'J6 S4(23~29.5s) 내', ok: JUN_OFFSETS_S[5] >= 23.0 && JUN_OFFSETS_S[5] + sentences[5].dur <= 29.5 },
  { label: 'Boss S5(29.5~36.5s) 내', ok: BOSS_OFFSET_S >= 29.5 && bossEnd <= 36.5 },
  { label: 'J7 Boss 이후', ok: JUN_OFFSETS_S[6] > bossEnd },
  { label: 'J7 영상 내', ok: JUN_OFFSETS_S[6] + sentences[6].dur <= TOTAL_DURATION_S },
  { label: `Tail ${tail.toFixed(2)}s ≥ 0.3s`, ok: tail >= 0.3 },
];

syncItems.forEach(item => console.log(`  ${item.ok ? '✅' : '❌'} ${item.label}`));
const syncPass = syncItems.every(i => i.ok);
console.log(`\n  대사 싱크 QA: ${syncPass ? 'PASS ✅' : 'FAIL ❌'}`);

console.log(`\n[DONE] final_v1 생성 완료: ${FINAL_MP4}`);
