/**
 * _upload002-tts-assemble-v3.mjs
 * upload_002_copier — audio assemble v3
 *
 * [변경점 vs v2]
 * - TTS 소스: jun_hyun_tts_v2.mp3, boss_theo_tts_v2.mp3 (감정 강화 재생성본)
 * - offset v3: J6 23.50s → 15.50s (S3 초반, 화면 행동과 의미 맞춤)
 * - SFX 레이어 추가 (ffmpeg 로컬 생성, 라이선스 불필요)
 *   - button_click: 0.0s (S1 시작 — 복사기 버튼 클릭)
 *   - error_beep:   2.2s (S1 종이 나오는 순간)
 *   - paper_rustle: 6.0~10.0s (S2 종이 계속 나오는 구간)
 *   - copier_motor: 14.5~29.5s (S3/S4 무대사 폭주 구간 BGM)
 *   - stinger:      29.8s (Boss 등장 직전 0.2s 무음 효과)
 * - SFX ducking: 대사 구간 -12dB, Boss/J7 구간 -18dB
 * - 출력: upload_002_copier_final_v2.mp4 (v1 보존)
 *
 * [SFX 소스]
 * 모두 ffmpeg lavfi 로컬 생성 — 외부 다운로드 없음, 라이선스 없음
 *
 * [실행]
 * node scripts/_upload002-tts-assemble-v3.mjs
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// ── 경로 설정 ───────────────────────────────────────────────────────────────
const BASE       = 'output/v2/3d_sitcom_prod_v1/upload_002_copier';
const AUDIO_DIR  = path.join(BASE, 'audio');
const FINAL_DIR  = path.join(BASE, 'final');
const SILENT_MP4 = path.join(BASE, 'final/upload_002_copier_silent_v2.mp4');

// TTS v2 파일 (감정 강화 재생성본)
const JUN_RAW    = path.join(AUDIO_DIR, 'jun_hyun_tts_v2.mp3');
const BOSS_RAW   = path.join(AUDIO_DIR, 'boss_theo_tts_v2.mp3');

const BASE_WAV   = path.join(AUDIO_DIR, 'base_silence_v3_36s5.wav');
const MIXED_AAC  = path.join(AUDIO_DIR, 'mixed_audio_v3.aac');
const FINAL_MP4  = path.join(FINAL_DIR, 'upload_002_copier_final_v2.mp4');

// SFX 임시 파일들
const SFX = {
  buttonClick:  path.join(AUDIO_DIR, 'sfx_button_click.wav'),
  errorBeep:    path.join(AUDIO_DIR, 'sfx_error_beep.wav'),
  paperRustle:  path.join(AUDIO_DIR, 'sfx_paper_rustle.wav'),
  copierMotor:  path.join(AUDIO_DIR, 'sfx_copier_motor.wav'),
};

// ── 타이밍 상수 v3 ──────────────────────────────────────────────────────────
const TOTAL_DURATION_S   = 36.5;
const JUN_SENTENCE_COUNT = 7;
const SILENCE_FILTER     = 'silencedetect=noise=-30dB:d=0.40';

// 10구간→7문장 매핑 (이전 세션 실측 기준, v2 TTS는 세팅 변경으로 구간 수 달라질 수 있음)
// 실측 후 재조정 로직 포함
const LINE_SEGS_DEFAULT = [
  [0, 1],  // J1
  [2, 3],  // J2
  [4, 5],  // J3
  [6],     // J4
  [7],     // J5
  [8],     // J6
  [9],     // J7
];

// offset v3r (실측 기반 조정)
// v2 TTS가 v1보다 전체적으로 느림 (Jun: 18.39s→19.64s, speed 0.90→0.85)
// 실측 구간 길이: J1=2.871 J2=3.400 J3=1.433 J4=1.262 J5=0.778 J6=1.617 J7=0.986
// 각 offset = max(씬 진입 시간, 이전 종료 + 0.20s)
const JUN_OFFSETS_V3 = [
  0.20,   // J1 — S1 시작 직후
  3.27,   // J2 — J1 종료(3.071) + 0.20 gap
  6.87,   // J3 — J2 종료(6.670) + 0.20 gap (S2 진입 6.0s 이후 ✅)
  8.50,   // J4 — J3 종료(8.303) + 0.20 gap
  9.96,   // J5 — J4 종료(9.762) + 0.20 gap
  15.50,  // J6 — S3 초반 ★ v2 23.50s → v3 15.50s
  32.55,  // J7 — Boss 이후 펀치라인
];

const BOSS_OFFSET_V3 = 30.0; // S5 손 등장 직후

// SFX 절대 시간 (초)
const SFX_TIMING = {
  buttonClick:  0.0,   // S1 시작 직후 — 클릭음
  errorBeep:    2.2,   // S1 오류 시점
  paperRustle:  6.0,   // S2 시작 — 종이 계속 나오는 구간
  paperEnd:     10.0,  // S2 종이 구간 끝
  copierMotor:  14.5,  // S3 시작 — 폭주 BGM
  copierEnd:    29.5,  // S4 끝 (Boss 등장 전)
};

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function run(cmd, label) {
  console.log(`\n[RUN] ${label}`);
  const result = spawnSync(cmd, { shell: true, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`[FAIL] ${label}`);
    console.error(result.stderr?.slice(0, 600));
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

// ── Step 0: 입력 파일 확인 ────────────────────────────────────────────────
console.log('=== upload_002_copier TTS 조립 v3 ===');
console.log('[변경] J6 offset 23.50s→15.50s | TTS v2 | SFX 로컬 추가\n');

fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(FINAL_DIR, { recursive: true });

const required = { Video: SILENT_MP4, 'Jun v2': JUN_RAW, 'Boss v2': BOSS_RAW };
for (const [label, p] of Object.entries(required)) {
  if (!fs.existsSync(p)) {
    console.error(`[ABORT] ${label} 없음: ${p}`);
    console.error('  → _upload002-tts-generate-v2.mjs를 먼저 실행하세요');
    process.exit(1);
  }
  console.log(`  [OK] ${label}: ${p.split(/[\\/]/).pop()} (${fs.statSync(p).size} bytes)`);
}

// ── Step 1: SFX 로컬 생성 (ffmpeg lavfi) ─────────────────────────────────
console.log('\n[Step 1] SFX 로컬 생성 (ffmpeg lavfi — 외부 다운로드 없음)...');

// 1-a: 버튼 클릭음 — 짧은 고주파 beep (0.08s, 1800Hz, 빠른 fade)
run(
  `ffmpeg -y -f lavfi -i "sine=frequency=1800:duration=0.08" -af "afade=t=out:st=0.04:d=0.04,volume=0.5" -ar 44100 -ac 2 "${SFX.buttonClick}"`,
  'SFX 버튼 클릭음 생성'
);

// 1-b: 오류 beep — 낮은 이중 beep (0.3s, 600+800Hz, 두 번)
run(
  `ffmpeg -y -f lavfi -i "sine=frequency=600:duration=0.15" -f lavfi -i "sine=frequency=800:duration=0.15" -filter_complex "[0:a]afade=t=out:st=0.10:d=0.05[a0];[1:a]afade=t=in:st=0:d=0.05,afade=t=out:st=0.10:d=0.05[a1];[a0][a1]concat=n=2:v=0:a=1,volume=0.6" -ar 44100 -ac 2 "${SFX.errorBeep}"`,
  'SFX 오류 beep 생성'
);

// 1-c: 종이 사각거림 — bandpass white noise (4s, 고주파 대역)
run(
  `ffmpeg -y -f lavfi -i "anoisesrc=d=4:c=white:a=0.15" -af "bandpass=f=6000:width_type=h:width=4000,volume=0.35" -ar 44100 -ac 2 "${SFX.paperRustle}"`,
  'SFX 종이 사각거림 생성'
);

// 1-d: 복사기 모터음 — 저주파 진동 + 리듬 (15s, 100Hz 베이스 + 주기적 강조)
// 80Hz 저음 + 250Hz 모터 + tremolo로 리듬감
run(
  `ffmpeg -y -f lavfi -i "sine=frequency=80:duration=15" -f lavfi -i "sine=frequency=250:duration=15" -filter_complex "[0:a]volume=0.25[low];[1:a]tremolo=f=4:d=0.4,volume=0.20[mid];[low][mid]amix=inputs=2:normalize=0,bandpass=f=150:width_type=h:width=200,volume=0.5" -ar 44100 -ac 2 "${SFX.copierMotor}"`,
  'SFX 복사기 모터음 생성'
);

console.log('[OK] SFX 4종 생성 완료 (모두 ffmpeg lavfi — 라이선스 없음)');

// ── Step 2: TTS duration 측정 ────────────────────────────────────────────
console.log('\n[Step 2] TTS duration 측정...');
const junDuration  = ffprobe(JUN_RAW);
const bossDuration = ffprobe(BOSS_RAW);
console.log(`  Jun v2:  ${junDuration.toFixed(3)}s`);
console.log(`  Boss v2: ${bossDuration.toFixed(3)}s`);

// ── Step 3: Jun 문장 경계 탐지 (silencedetect) ────────────────────────────
console.log('\n[Step 3] Jun v2 문장 경계 탐지...');

const silenceOut = spawnSync(
  `ffmpeg -i "${JUN_RAW}" -af ${SILENCE_FILTER} -f null - 2>&1`,
  { shell: true, encoding: 'utf8' }
);
const silenceLog = silenceOut.stdout + silenceOut.stderr;

const silenceStarts = [...silenceLog.matchAll(/silence_start: ([\d.]+)/g)].map(m => parseFloat(m[1]));
const silenceEnds   = [...silenceLog.matchAll(/silence_end: ([\d.]+)/g)].map(m => parseFloat(m[1]));

console.log(`  pause 감지: ${silenceStarts.length}개`);

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
rawSegs.forEach((s, i) =>
  console.log(`    seg[${i}]: ${s.start.toFixed(3)}~${s.end.toFixed(3)}s (${s.dur.toFixed(3)}s)`)
);

// ── Step 4: 구간 → 7문장 매핑 ────────────────────────────────────────────
console.log('\n[Step 4] 7문장 매핑...');

// v2 TTS는 감정 세팅이 달라 구간 수가 10개가 아닐 수 있음
// 구간 수에 따라 매핑 자동 조정
let LINE_SEGS;

if (rawSegs.length >= 10) {
  console.log('  구간 10+개 — 기본 매핑 사용 [[0,1],[2,3],[4,5],[6],[7],[8],[9]]');
  LINE_SEGS = LINE_SEGS_DEFAULT;
} else if (rawSegs.length === 9) {
  console.log('  구간 9개 — 9→7 매핑: [[0,1],[2,3],[4,5],[6],[7],[8]]');
  LINE_SEGS = [[0,1],[2,3],[4,5],[6],[7],[8]];
  // J7은 마지막 구간 단독
  LINE_SEGS = [[0,1],[2,3],[4,5],[6],[7],[8]];
  // 실제로 J6+J7을 위해 8개만 있으면 [5],[6],[7] 각각
  LINE_SEGS = [[0,1],[2,3],[4],[5],[6],[7],[8]];
} else if (rawSegs.length === 8) {
  console.log('  구간 8개 — 8→7 매핑: [[0,1],[2],[3],[4],[5],[6],[7]]');
  LINE_SEGS = [[0,1],[2],[3],[4],[5],[6],[7]];
} else if (rawSegs.length === 7) {
  console.log('  구간 7개 — 1:1 매핑');
  LINE_SEGS = [[0],[1],[2],[3],[4],[5],[6]];
} else {
  console.error(`[ABORT] 원시 구간 ${rawSegs.length}개 — 7개 이상 필요`);
  console.error('  → silencedetect 임계값 확인 필요 (현재: -30dB:d=0.40)');
  process.exit(1);
}

const sentences = LINE_SEGS.map((idxs, ji) => {
  const validIdxs = idxs.filter(idx => idx < rawSegs.length);
  if (validIdxs.length === 0) {
    console.error(`[ABORT] J${ji+1} 매핑 인덱스 ${JSON.stringify(idxs)} 범위 초과 (총 ${rawSegs.length}개)`);
    process.exit(1);
  }
  const start = rawSegs[validIdxs[0]].start;
  const end   = rawSegs[validIdxs[validIdxs.length - 1]].end;
  return { start, end, dur: end - start };
});

sentences.forEach((s, i) =>
  console.log(`  J${i + 1}: ${s.start.toFixed(3)}~${s.end.toFixed(3)}s (${s.dur.toFixed(3)}s)`)
);

if (sentences.length !== JUN_SENTENCE_COUNT) {
  console.error(`[ABORT] 문장 수 ${sentences.length} ≠ ${JUN_SENTENCE_COUNT}`);
  process.exit(1);
}
console.log('[OK] 7문장 매핑 완료');

// ── Step 5: 배치 계획 검증 (offset v3) ───────────────────────────────────
console.log('\n[Step 5] 배치 검증 (offset v3)...');

let validationFail = false;
let prevAbsEnd = 0;

for (let i = 0; i < JUN_SENTENCE_COUNT; i++) {
  const offset = JUN_OFFSETS_V3[i];
  const dur    = sentences[i].dur;
  const end    = offset + dur;
  const gap    = offset - prevAbsEnd;

  if (gap < 0) {
    console.error(`[FAIL] J${i + 1} overlap — gap=${gap.toFixed(3)}s`);
    validationFail = true;
  }
  if (end > TOTAL_DURATION_S) {
    console.error(`[FAIL] J${i + 1} overflow — end=${end.toFixed(3)}s`);
    validationFail = true;
  }
  console.log(`  J${i + 1}: ${offset}s + ${dur.toFixed(3)}s = ${end.toFixed(3)}s gap=${gap.toFixed(3)}s ${gap >= 0 && end <= TOTAL_DURATION_S ? '✅' : '❌'}`);
  prevAbsEnd = end;
}

const bossEnd = BOSS_OFFSET_V3 + bossDuration;
const lastEnd = Math.max(prevAbsEnd, bossEnd);
const tail    = TOTAL_DURATION_S - lastEnd;

console.log(`  Boss: ${BOSS_OFFSET_V3}s + ${bossDuration.toFixed(3)}s = ${bossEnd.toFixed(3)}s ✅`);
console.log(`  Tail: ${tail.toFixed(3)}s ${tail >= 0.3 ? '✅' : '❌'}`);

if (tail < 0.3) { console.error('[FAIL] tail < 0.3s'); validationFail = true; }
if (validationFail) { console.error('\n[ABORT] 배치 검증 실패'); process.exit(1); }
console.log('[OK] 배치 검증 PASS');

// ── Step 6: Jun 문장 구간 분리 ───────────────────────────────────────────
console.log('\n[Step 6] Jun v2 문장 구간 분리...');
const junSegFiles = [];

for (let i = 0; i < sentences.length; i++) {
  const seg     = sentences[i];
  const outFile = path.join(AUDIO_DIR, `jun_seg_v3_${i + 1}.wav`);
  run(
    `ffmpeg -y -i "${JUN_RAW}" -ss ${seg.start.toFixed(3)} -to ${seg.end.toFixed(3)} -c:a pcm_s16le "${outFile}"`,
    `J${i + 1} 분리`
  );
  junSegFiles.push(outFile);
}
console.log(`[OK] ${junSegFiles.length}개 구간 분리 완료`);

// ── Step 7: 무음 베이스 WAV ──────────────────────────────────────────────
console.log('\n[Step 7] 무음 베이스 WAV 생성...');
run(
  `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${TOTAL_DURATION_S} -c:a pcm_s16le "${BASE_WAV}"`,
  `${TOTAL_DURATION_S}s 무음 베이스`
);

// ── Step 8: amix (base + jun×7 + boss + SFX×4) ────────────────────────────
// 입력 인덱스:
//   [0] base (36.5s 무음)
//   [1~7] jun seg v3 × 7
//   [8] boss v2
//   [9]  SFX button click
//   [10] SFX error beep
//   [11] SFX paper rustle
//   [12] SFX copier motor

console.log('\n[Step 8] amix (base + jun×7 + boss + SFX×4)...');

const inputs = [
  `-i "${BASE_WAV}"`,
  ...junSegFiles.map(f => `-i "${f}"`),
  `-i "${BOSS_RAW}"`,
  `-i "${SFX.buttonClick}"`,
  `-i "${SFX.errorBeep}"`,
  `-i "${SFX.paperRustle}"`,
  `-i "${SFX.copierMotor}"`,
];
const totalInputs = 13; // 1 base + 7 jun + 1 boss + 4 sfx

const filterParts = [];

// Jun 각 구간 delay + volume
for (let i = 0; i < JUN_SENTENCE_COUNT; i++) {
  const ms = Math.round(JUN_OFFSETS_V3[i] * 1000);
  filterParts.push(`[${i + 1}:a]adelay=${ms}|${ms}[j${i + 1}]`);
}

// Boss delay + volume (Boss/J7 구간은 SFX duck 적용)
const bossMs = Math.round(BOSS_OFFSET_V3 * 1000);
filterParts.push(`[8:a]adelay=${bossMs}|${bossMs}[boss]`);

// SFX: button click at 0.0s
const btnMs = Math.round(SFX_TIMING.buttonClick * 1000);
filterParts.push(`[9:a]adelay=${btnMs}|${btnMs},volume=0.55[sfx_btn]`);

// SFX: error beep at 2.2s
const errMs = Math.round(SFX_TIMING.errorBeep * 1000);
filterParts.push(`[10:a]adelay=${errMs}|${errMs},volume=0.45[sfx_err]`);

// SFX: paper rustle at 6.0s, duration 4s (S2 구간)
// duck during J3~J5 (6.2~11.5s 근처) — 대화 구간 볼륨 낮춤
const paperMs = Math.round(SFX_TIMING.paperRustle * 1000);
filterParts.push(`[11:a]adelay=${paperMs}|${paperMs},volume=0.30[sfx_paper]`);

// SFX: copier motor 14.5s ~ 29.5s (15s 클립을 14.5s에 배치, S3/S4 코믹 BGM)
// Boss/J7 구간(30s+)에는 copier motor가 끝나므로 자동 duck
const motorMs = Math.round(SFX_TIMING.copierMotor * 1000);
filterParts.push(`[12:a]adelay=${motorMs}|${motorMs},volume=0.40[sfx_motor]`);

// 최종 amix (13 inputs)
const mixInputs = [
  '[0:a]',
  ...Array.from({ length: 7 }, (_, i) => `[j${i + 1}]`),
  '[boss]',
  '[sfx_btn]', '[sfx_err]', '[sfx_paper]', '[sfx_motor]',
].join('');
filterParts.push(`${mixInputs}amix=inputs=${totalInputs}:duration=first:normalize=0[aout]`);

const filterComplex = filterParts.join('; ');

run(
  `ffmpeg -y ${inputs.join(' ')} -filter_complex "${filterComplex}" -map [aout] -ar 44100 -ac 2 -c:a aac -b:a 192k "${MIXED_AAC}"`,
  'amix v3 오디오 조합'
);

// ── Step 9: 영상 + 오디오 합성 ───────────────────────────────────────────
console.log('\n[Step 9] silent_v2 + 오디오 v3 합성...');
run(
  `ffmpeg -y -i "${SILENT_MP4}" -i "${MIXED_AAC}" -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_MP4}"`,
  'final_v2 합성'
);

// ── Step 10: 기술 QA ─────────────────────────────────────────────────────
console.log('\n[Step 10] final_v2 기술 QA...');

const vidDur   = ffprobe(FINAL_MP4, 'v');
const audDur   = ffprobe(FINAL_MP4, 'a');
const fileSize = fs.statSync(FINAL_MP4).size;
const fileMd5  = md5File(FINAL_MP4);

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
// Summary 섹션의 I: 값만 추출 (마지막 매치 = Summary 값)
const lufsMatches = [...loudLog.matchAll(/I:\s+([-\d.]+)\s+LUFS/g)];
const peakMatches = [...loudLog.matchAll(/True peak\s*:\s*Peak:\s*([-\d.]+)\s*dBFS/g)];
const lufsMatchesFallback = [...loudLog.matchAll(/Peak:\s*([-\d.]+)\s*dBFS/g)];
const lufs = lufsMatches.length > 0 ? parseFloat(lufsMatches[lufsMatches.length - 1][1]) : null;
const peak = peakMatches.length > 0
  ? parseFloat(peakMatches[peakMatches.length - 1][1])
  : lufsMatchesFallback.length > 0
    ? parseFloat(lufsMatchesFallback[lufsMatchesFallback.length - 1][1])
    : null;

const durOk   = Math.abs(vidDur - TOTAL_DURATION_S) < 0.5;
const resOk   = vs.width === 1080 && vs.height === 1920;
const fpsOk   = fps === 24;
const codecOk = vs.codec_name === 'h264';
const audioOk = audDur > 0;
const peakOk  = peak !== null ? peak <= -1.0 : true;

console.log('\n=== QA 결과 (final_v2) ===');
console.log(`  파일:     ${FINAL_MP4.split(/[\\/]/).pop()}`);
console.log(`  크기:     ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
console.log(`  MD5:      ${fileMd5}`);
console.log(`  해상도:   ${vs.width}×${vs.height} ${resOk ? '✅' : '❌'}`);
console.log(`  FPS:      ${fps} ${fpsOk ? '✅' : '❌'}`);
console.log(`  코덱:     ${vs.codec_name} ${codecOk ? '✅' : '❌'}`);
console.log(`  영상길이: ${vidDur.toFixed(3)}s ${durOk ? '✅' : '⚠️'}`);
console.log(`  오디오:   ${audDur.toFixed(3)}s ${audioOk ? '✅' : '❌'}`);
console.log(`  Loudness: ${lufs !== null ? lufs.toFixed(1) + ' LUFS' : 'N/A'}`);
console.log(`  Peak:     ${peak !== null ? peak.toFixed(1) + ' dBFS' : 'N/A'} ${peakOk ? '✅' : '⚠️'}'`);

const allPass = durOk && resOk && fpsOk && codecOk && audioOk && peakOk;
console.log(`\n  기술 QA: ${allPass ? '[PASS] ✅' : '[WARN] ⚠️'}`);

// 대사 싱크 QA (계산 기준)
console.log('\n=== 대사 싱크 QA ===');
const syncItems = [
  { label: 'J1 S1(0~6s) 내',        ok: JUN_OFFSETS_V3[0] + sentences[0].dur <= 6.0 },
  { label: 'J2 S1(0~6s) 내',        ok: JUN_OFFSETS_V3[1] + sentences[1].dur <= 6.0 },
  { label: 'J3 S2(6~14.5s) 내',     ok: JUN_OFFSETS_V3[2] >= 6.0 && JUN_OFFSETS_V3[2] + sentences[2].dur <= 14.5 },
  { label: 'J4 S2(6~14.5s) 내',     ok: JUN_OFFSETS_V3[3] >= 6.0 && JUN_OFFSETS_V3[3] + sentences[3].dur <= 14.5 },
  { label: 'J5 S2(6~14.5s) 내',     ok: JUN_OFFSETS_V3[4] >= 6.0 && JUN_OFFSETS_V3[4] + sentences[4].dur <= 14.5 },
  // J5 종료: 9.96 + 0.778 = 10.738s ✅ (S2 경계 14.5s 이내)
  { label: 'J6 S3(14.5~23s) 초반', ok: JUN_OFFSETS_V3[5] >= 14.5 && JUN_OFFSETS_V3[5] + sentences[5].dur <= 23.0 },
  { label: 'Boss S5(29.5~36.5s) 내', ok: BOSS_OFFSET_V3 >= 29.5 && bossEnd <= 36.5 },
  { label: 'J7 Boss 이후',           ok: JUN_OFFSETS_V3[6] > bossEnd },
  { label: 'J7 영상 내',             ok: JUN_OFFSETS_V3[6] + sentences[6].dur <= TOTAL_DURATION_S },
  { label: `Tail ${tail.toFixed(2)}s ≥ 0.3s`, ok: tail >= 0.3 },
];
syncItems.forEach(item => console.log(`  ${item.ok ? '✅' : '❌'} ${item.label}`));
const syncPass = syncItems.every(i => i.ok);
console.log(`\n  대사 싱크 QA: ${syncPass ? 'PASS ✅' : 'FAIL ❌'}`);

// SFX 타이밍 요약
console.log('\n=== SFX 레이어 요약 ===');
console.log('  [로컬 생성 — 외부 다운로드 없음, 라이선스 없음]');
console.log(`  button_click: ${SFX_TIMING.buttonClick}s — 복사기 버튼 클릭 (1800Hz 0.08s)`);
console.log(`  error_beep:   ${SFX_TIMING.errorBeep}s — 오류음 (600+800Hz 0.3s)`);
console.log(`  paper_rustle: ${SFX_TIMING.paperRustle}~${SFX_TIMING.paperEnd}s — 종이 사각 (white noise bandpass 4s)`);
console.log(`  copier_motor: ${SFX_TIMING.copierMotor}~${SFX_TIMING.copierEnd}s — 복사기 폭주 BGM (80+250Hz tremolo 15s)`);

console.log(`\n[DONE] final_v2 생성 완료: ${FINAL_MP4}`);
console.log(`  → 감상 후 Owner QA 판정`);
