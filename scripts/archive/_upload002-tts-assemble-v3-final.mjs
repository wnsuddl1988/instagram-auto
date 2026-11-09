/**
 * _upload002-tts-assemble-v3-final.mjs
 * upload_002_copier — audio assemble v3-final
 *
 * [Contract v3 기준 offset — 실제 키프레임 근거]
 * J1=5.5s  kf_s1 버튼 연타 후 (0~7s S1)
 * J2=12.0s kf_s2 찢어진 조각 응시 후 (7~15s S2)
 * J3=18.5s S3 1장 출력 직후 (15~24s S3)
 * J4=21.5s S3 2번째 장 나올 때 (15~24s S3)
 * J5=24.5s kf_s4 버튼 첫 누름 직후 (24~31s S4)
 * J6=28.0s S4 버튼 무반응 확인 후 (24~31s S4)
 * Boss=31.5s kf_s5 손 등장 직후 ★ 수정 (33.0s→31.5s, timing preflight 결과)
 * J7=34.7s S5 준 고개 든 직후  ★ 수정 (35.3s→34.7s, timing preflight 결과)
 *
 * [timing preflight 근거 — ElevenLabs 호출 없이 사전 검증]
 * v2 TTS 실측: J7=0.986s, Boss=2.276s
 * v3 보수 추정 (×1.20): J7=1.183s, Boss=2.731s
 * Boss=31.5s → end=34.231s → J7≥34.481s → J7=34.7s → end=35.883s → tail=0.617s ✅
 * Boss=33.0s(구 offset) → end=35.731s → J7≥35.981s > 최대허용 35.017s ❌
 *
 * [TTS 소스]
 * jun_hyun_tts_v3.mp3, boss_theo_tts_v3.mp3
 * (_upload002-tts-generate-v3.mjs 실행 후 생성)
 *
 * [SFX — ffmpeg lavfi 로컬 생성, 외부 다운로드/라이선스 없음]
 * errorBeep:   3.0s (S1 오류등 점등 시점)
 * paperRustle: 7.0~11.0s (S2 종이 찢기/나오는 구간)
 * copierMotor: 15.0~31.0s (S3/S4 폭주 BGM — Contract v3 "15~31s BGM 필수")
 * comicSting:  35.0s (J7 대사 직전 0.3s 무음 후 코믹 스팅)
 *
 * [Stop-Loss]
 * - 재시도 없음. 실패 시 ABORT + 보고.
 *
 * [실행]
 * ALLOW_ASSEMBLE_V3=true node scripts/_upload002-tts-assemble-v3-final.mjs
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// ── Stop-Loss Gate ────────────────────────────────────────────────────────────
if (process.env.ALLOW_ASSEMBLE_V3 !== 'true') {
  console.error('[ABORT] ALLOW_ASSEMBLE_V3=true 없이 실행 불가');
  console.error('  실행: ALLOW_ASSEMBLE_V3=true node scripts/_upload002-tts-assemble-v3-final.mjs');
  process.exit(1);
}

// ── 경로 설정 ─────────────────────────────────────────────────────────────────
const BASE       = 'output/v2/3d_sitcom_prod_v1/upload_002_copier';
const AUDIO_DIR  = path.join(BASE, 'audio');
const FINAL_DIR  = path.join(BASE, 'final');
const SILENT_MP4 = path.join(BASE, 'final/upload_002_copier_silent_v2.mp4');

const JUN_RAW   = path.join(AUDIO_DIR, 'jun_hyun_tts_v3.mp3');
const BOSS_RAW  = path.join(AUDIO_DIR, 'boss_theo_tts_v3.mp3');
const BASE_WAV  = path.join(AUDIO_DIR, 'base_silence_v4_36s5.wav');
const MIXED_AAC = path.join(AUDIO_DIR, 'mixed_audio_v4.aac');
const FINAL_MP4 = path.join(FINAL_DIR, 'upload_002_copier_final_v3.mp4');

const SFX_DIR = AUDIO_DIR;

// ── Contract v3 타이밍 상수 ───────────────────────────────────────────────────
const TOTAL_DURATION_S   = 36.5;
const JUN_SENTENCE_COUNT = 7;
const SILENCE_FILTER     = 'silencedetect=noise=-30dB:d=0.35';

// Contract v3 offset (실제 키프레임 기반)
const JUN_OFFSETS_V3 = [
  5.5,   // J1 — S1 버튼 연타 후 (kf_s1)
  12.0,  // J2 — S2 찢어진 조각 응시 후 (kf_s2)
  18.5,  // J3 — S3 1장 출력 직후
  21.5,  // J4 — S3 2번째 장 출력 시작
  24.5,  // J5 — S4 버튼 첫 누름 (kf_s4)
  28.0,  // J6 — S4 버튼 무반응 확인 후
  34.4,  // J7 — S5 준 고개 든 직후 ★ 35.3→34.7→34.4 (tail 보정)
];

const BOSS_OFFSET_V3 = 31.5; // S5 손 등장 직후 ★ 33.0→31.5 (preflight 수정)

// SFX 타이밍 (Contract v3 기준)
const SFX_TIMING = {
  errorBeep:   3.0,   // S1 오류등 점등
  paperRustle: 7.0,   // S2 시작 — 종이 구간
  paperEnd:    11.0,
  copierMotor: 15.0,  // S3/S4 폭주 BGM 시작 (필수)
  copierEnd:   31.0,  // Boss 등장 전 끝
  comicSting:  34.1,  // J7(34.4s) 직전 0.3s ★ 34.4→34.1 (tail 보정)
};

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function run(cmd, label) {
  console.log(`\n[RUN] ${label}`);
  const result = spawnSync(cmd, { shell: true, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`[ABORT] ${label} 실패`);
    console.error(result.stderr?.slice(0, 600));
    console.error('재시도 금지 — 원인 분석 후 Codex 보고');
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

// ── Step 0: 입력 파일 확인 ────────────────────────────────────────────────────
console.log('=== upload_002_copier TTS assemble v3-final ===');
console.log('[Contract v3] 실제 키프레임 기반 offset 적용\n');

fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(FINAL_DIR, { recursive: true });

const required = { Video: SILENT_MP4, 'Jun v3': JUN_RAW, 'Boss v3': BOSS_RAW };
for (const [label, p] of Object.entries(required)) {
  if (!fs.existsSync(p)) {
    console.error(`[ABORT] ${label} 없음: ${p}`);
    if (p.includes('tts_v3')) {
      console.error('  → ALLOW_TTS_V3=true node scripts/_upload002-tts-generate-v3.mjs 먼저 실행');
    }
    process.exit(1);
  }
  console.log(`  [OK] ${label}: ${path.basename(p)} (${fs.statSync(p).size} bytes)`);
}

// ── Step 1: SFX 로컬 생성 (ffmpeg lavfi) ─────────────────────────────────────
console.log('\n[Step 1] SFX 로컬 생성 (ffmpeg lavfi)...');

const SFX = {
  errorBeep:   path.join(SFX_DIR, 'sfx_v3_error_beep.wav'),
  paperRustle: path.join(SFX_DIR, 'sfx_v3_paper_rustle.wav'),
  copierMotor: path.join(SFX_DIR, 'sfx_v3_copier_motor.wav'),
  comicSting:  path.join(SFX_DIR, 'sfx_v3_comic_sting.wav'),
};

// 오류 beep — 600+800Hz 이중 (0.3s)
run(
  `ffmpeg -y -f lavfi -i "sine=frequency=600:duration=0.15" -f lavfi -i "sine=frequency=800:duration=0.15" ` +
  `-filter_complex "[0:a]afade=t=out:st=0.10:d=0.05[a0];[1:a]afade=t=in:st=0:d=0.05,afade=t=out:st=0.10:d=0.05[a1];` +
  `[a0][a1]concat=n=2:v=0:a=1,volume=0.55" -ar 44100 -ac 2 "${SFX.errorBeep}"`,
  'SFX 오류 beep (600+800Hz)'
);

// 종이 사각 — bandpass white noise (4s)
run(
  `ffmpeg -y -f lavfi -i "anoisesrc=d=4:c=white:a=0.12" ` +
  `-af "bandpass=f=6000:width_type=h:width=4000,volume=0.30" -ar 44100 -ac 2 "${SFX.paperRustle}"`,
  'SFX 종이 사각 (white noise 4s)'
);

// 복사기 폭주 BGM — 16s (S3/S4 15~31s)
run(
  `ffmpeg -y -f lavfi -i "sine=frequency=80:duration=16" -f lavfi -i "sine=frequency=250:duration=16" ` +
  `-filter_complex "[0:a]volume=0.22[low];[1:a]tremolo=f=4:d=0.4,volume=0.18[mid];` +
  `[low][mid]amix=inputs=2:normalize=0,bandpass=f=150:width_type=h:width=200,volume=0.45" ` +
  `-ar 44100 -ac 2 "${SFX.copierMotor}"`,
  'SFX 복사기 폭주 BGM (16s)'
);

// 코믹 스팅 — 800Hz 단순 톤 + fade-out (0.4s)
run(
  `ffmpeg -y -f lavfi -i "sine=frequency=800:duration=0.4" ` +
  `-af "afade=t=out:st=0.25:d=0.15,volume=0.50" -ar 44100 -ac 2 "${SFX.comicSting}"`,
  'SFX 코믹 스팅 (800Hz 0.4s)'
);

console.log('[OK] SFX 4종 생성 완료 (ffmpeg lavfi — 외부 없음)');

// ── Step 2: TTS duration 측정 ─────────────────────────────────────────────────
console.log('\n[Step 2] TTS duration 측정...');
const junDuration  = ffprobe(JUN_RAW);
const bossDuration = ffprobe(BOSS_RAW);
console.log(`  Jun v3:  ${junDuration.toFixed(3)}s`);
console.log(`  Boss v3: ${bossDuration.toFixed(3)}s`);

// ── Step 3: Jun 문장 경계 탐지 ───────────────────────────────────────────────
console.log('\n[Step 3] Jun v3 문장 경계 탐지...');

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
  if (segEnd - prevEnd > 0.05) rawSegs.push({ start: prevEnd, end: segEnd, dur: segEnd - prevEnd });
  prevEnd = silenceEnds[i] ?? silenceStarts[i] + 0.1;
}
if (junDuration - prevEnd > 0.05) rawSegs.push({ start: prevEnd, end: junDuration, dur: junDuration - prevEnd });
console.log(`  원시 구간: ${rawSegs.length}개`);
rawSegs.forEach((s, i) => console.log(`    seg[${i}]: ${s.start.toFixed(3)}~${s.end.toFixed(3)}s (${s.dur.toFixed(3)}s)`));

// ── Step 4: 구간 → 7문장 매핑 ────────────────────────────────────────────────
console.log('\n[Step 4] 7문장 매핑...');

let LINE_SEGS;
if (rawSegs.length >= 10) {
  LINE_SEGS = [[0,1],[2,3],[4,5],[6],[7],[8],[9]];
  console.log('  구간 10+개 — 기본 매핑');
} else if (rawSegs.length === 9) {
  // seg[0]=J1, seg[1]=J2, seg[2+3]=J3, seg[4]=J4, seg[5]=J5, seg[6+7]=J6, seg[8]=J7
  LINE_SEGS = [[0],[1],[2,3],[4],[5],[6,7],[8]];
  console.log('  구간 9개 — 9→7 매핑 (J1/J2 분리, J3/J6 합산)');
} else if (rawSegs.length === 8) {
  LINE_SEGS = [[0,1],[2],[3],[4],[5],[6],[7]];
  console.log('  구간 8개 — 8→7 매핑');
} else if (rawSegs.length === 7) {
  LINE_SEGS = [[0],[1],[2],[3],[4],[5],[6]];
  console.log('  구간 7개 — 1:1 매핑');
} else {
  console.error(`[ABORT] 원시 구간 ${rawSegs.length}개 — 7개 이상 필요`);
  console.error('  silencedetect 임계값 재조정 필요');
  process.exit(1);
}

const sentences = LINE_SEGS.map((idxs, ji) => {
  const valid = idxs.filter(idx => idx < rawSegs.length);
  if (valid.length === 0) {
    console.error(`[ABORT] J${ji+1} 매핑 인덱스 범위 초과`);
    process.exit(1);
  }
  const start = rawSegs[valid[0]].start;
  const end   = rawSegs[valid[valid.length - 1]].end;
  return { start, end, dur: end - start };
});

sentences.forEach((s, i) => console.log(`  J${i+1}: ${s.start.toFixed(3)}~${s.end.toFixed(3)}s (${s.dur.toFixed(3)}s)`));
if (sentences.length !== JUN_SENTENCE_COUNT) {
  console.error(`[ABORT] 문장 수 ${sentences.length} ≠ 7`);
  process.exit(1);
}
console.log('[OK] 7문장 매핑 완료');

// ── Step 5: 배치 검증 (Contract v3 offset) ───────────────────────────────────
console.log('\n[Step 5] Contract v3 배치 검증...');

let validationFail = false;
let prevAbsEnd = 0;

for (let i = 0; i < JUN_SENTENCE_COUNT; i++) {
  const offset = JUN_OFFSETS_V3[i];
  const dur    = sentences[i].dur;
  const end    = offset + dur;
  const gap    = offset - prevAbsEnd;
  const ok     = gap >= 0 && end <= TOTAL_DURATION_S;
  if (!ok) validationFail = true;
  console.log(`  J${i+1}: ${offset}s + ${dur.toFixed(3)}s = ${end.toFixed(3)}s  gap=${gap.toFixed(3)}s ${ok ? '✅' : '❌'}`);
  prevAbsEnd = end;
}

const bossEnd = BOSS_OFFSET_V3 + bossDuration;
const lastEnd = Math.max(prevAbsEnd, bossEnd);
const tail    = TOTAL_DURATION_S - lastEnd;

const bossOk = BOSS_OFFSET_V3 >= 31.0 && bossEnd <= 36.5;
const tailOk = tail >= 0.3;

console.log(`  Boss: ${BOSS_OFFSET_V3}s + ${bossDuration.toFixed(3)}s = ${bossEnd.toFixed(3)}s ${bossOk ? '✅' : '❌'}`);
console.log(`  Tail: ${tail.toFixed(3)}s ${tailOk ? '✅' : '❌'}`);

if (!bossOk) { console.error('[FAIL] Boss offset/overflow'); validationFail = true; }
if (!tailOk) { console.error('[FAIL] tail < 0.3s'); validationFail = true; }
if (validationFail) {
  console.error('\n[ABORT] 배치 검증 실패 — offset 재조정 필요 (TTS 재호출 아님)');
  process.exit(1);
}
console.log('[OK] 배치 검증 PASS');

// ── Step 6: Jun 구간 분리 ────────────────────────────────────────────────────
console.log('\n[Step 6] Jun v3 구간 분리...');
const junSegFiles = [];
for (let i = 0; i < sentences.length; i++) {
  const seg     = sentences[i];
  const outFile = path.join(AUDIO_DIR, `jun_seg_v4_${i+1}.wav`);
  run(
    `ffmpeg -y -i "${JUN_RAW}" -ss ${seg.start.toFixed(3)} -to ${seg.end.toFixed(3)} -c:a pcm_s16le "${outFile}"`,
    `J${i+1} 분리`
  );
  junSegFiles.push(outFile);
}
console.log(`[OK] ${junSegFiles.length}개 분리 완료`);

// ── Step 7: 무음 베이스 WAV ───────────────────────────────────────────────────
console.log('\n[Step 7] 무음 베이스 WAV...');
run(
  `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${TOTAL_DURATION_S} -c:a pcm_s16le "${BASE_WAV}"`,
  `${TOTAL_DURATION_S}s 무음 베이스`
);

// ── Step 8: amix (base + jun×7 + boss + SFX×4) ───────────────────────────────
// 입력 인덱스:
//   [0]   base (36.5s 무음)
//   [1~7] jun seg v4 × 7
//   [8]   boss v3
//   [9]   sfx error beep
//   [10]  sfx paper rustle
//   [11]  sfx copier motor
//   [12]  sfx comic sting
console.log('\n[Step 8] amix (base + jun×7 + boss + SFX×4)...');

const inputs = [
  `-i "${BASE_WAV}"`,
  ...junSegFiles.map(f => `-i "${f}"`),
  `-i "${BOSS_RAW}"`,
  `-i "${SFX.errorBeep}"`,
  `-i "${SFX.paperRustle}"`,
  `-i "${SFX.copierMotor}"`,
  `-i "${SFX.comicSting}"`,
];
const totalInputs = 13;

const filterParts = [];

// Jun 각 구간 delay
for (let i = 0; i < JUN_SENTENCE_COUNT; i++) {
  const ms = Math.round(JUN_OFFSETS_V3[i] * 1000);
  filterParts.push(`[${i+1}:a]adelay=${ms}|${ms}[j${i+1}]`);
}

// Boss delay
const bossMs = Math.round(BOSS_OFFSET_V3 * 1000);
filterParts.push(`[8:a]adelay=${bossMs}|${bossMs}[boss]`);

// SFX: error beep at 3.0s
const errMs = Math.round(SFX_TIMING.errorBeep * 1000);
filterParts.push(`[9:a]adelay=${errMs}|${errMs},volume=0.45[sfx_err]`);

// SFX: paper rustle at 7.0s (4s clip)
const paperMs = Math.round(SFX_TIMING.paperRustle * 1000);
filterParts.push(`[10:a]adelay=${paperMs}|${paperMs},volume=0.28[sfx_paper]`);

// SFX: copier motor at 15.0s (16s clip — S3/S4 BGM 필수 구간)
const motorMs = Math.round(SFX_TIMING.copierMotor * 1000);
filterParts.push(`[11:a]adelay=${motorMs}|${motorMs},volume=0.42[sfx_motor]`);

// SFX: comic sting at 35.0s (J7 직전)
const stingMs = Math.round(SFX_TIMING.comicSting * 1000);
filterParts.push(`[12:a]adelay=${stingMs}|${stingMs},volume=0.55[sfx_sting]`);

// amix
const mixInputs = [
  '[0:a]',
  ...Array.from({ length: 7 }, (_, i) => `[j${i+1}]`),
  '[boss]', '[sfx_err]', '[sfx_paper]', '[sfx_motor]', '[sfx_sting]',
].join('');
filterParts.push(`${mixInputs}amix=inputs=${totalInputs}:duration=first:normalize=0[aout]`);

const filterComplex = filterParts.join('; ');

run(
  `ffmpeg -y ${inputs.join(' ')} -filter_complex "${filterComplex}" -map [aout] -ar 44100 -ac 2 -c:a aac -b:a 192k "${MIXED_AAC}"`,
  'amix v3-final 오디오 조합'
);

// ── Step 9: 영상 + 오디오 합성 ───────────────────────────────────────────────
console.log('\n[Step 9] silent_v2 + 오디오 v4 합성...');
run(
  `ffmpeg -y -i "${SILENT_MP4}" -i "${MIXED_AAC}" -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_MP4}"`,
  'final_v3 합성'
);

// ── Step 10: 기술 QA ─────────────────────────────────────────────────────────
console.log('\n[Step 10] final_v3 기술 QA...');

const vidDur   = ffprobe(FINAL_MP4, 'v');
const audDur   = ffprobe(FINAL_MP4, 'a');
const fileSize = fs.statSync(FINAL_MP4).size;
const fileMd5  = md5File(FINAL_MP4);

const probeOut = spawnSync(
  `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -of json "${FINAL_MP4}"`,
  { shell: true, encoding: 'utf8' }
);
const vs = (JSON.parse(probeOut.stdout || '{"streams":[{}]}')).streams[0] || {};
const [fpsNum, fpsDen] = (vs.r_frame_rate || '24/1').split('/').map(Number);
const fps = Math.round(fpsNum / fpsDen);

const loudOut = spawnSync(
  `ffmpeg -i "${FINAL_MP4}" -filter_complex ebur128=peak=true -f null - 2>&1`,
  { shell: true, encoding: 'utf8' }
);
const loudLog = loudOut.stdout + loudOut.stderr;
const lufsAll = [...loudLog.matchAll(/I:\s+([-\d.]+)\s+LUFS/g)];
const peakAll = [...loudLog.matchAll(/Peak:\s+([-\d.]+)\s+dBFS/g)];
const lufs    = lufsAll.length > 0 ? parseFloat(lufsAll[lufsAll.length-1][1]) : null;
const peak    = peakAll.length > 0 ? parseFloat(peakAll[peakAll.length-1][1]) : null;

const durOk   = Math.abs(vidDur - TOTAL_DURATION_S) < 0.5;
const resOk   = vs.width === 1080 && vs.height === 1920;
const fpsOk   = fps === 24;
const codecOk = vs.codec_name === 'h264';
const audioOk = audDur > 0;
const peakOk  = peak !== null ? peak <= -1.0 : true;

console.log('\n=== 기술 QA (final_v3) ===');
console.log(`  파일:     ${path.basename(FINAL_MP4)}`);
console.log(`  크기:     ${(fileSize/1024/1024).toFixed(2)} MB (${fileSize} bytes)`);
console.log(`  MD5:      ${fileMd5}`);
console.log(`  해상도:   ${vs.width}×${vs.height} ${resOk ? '✅' : '❌'}`);
console.log(`  FPS:      ${fps} ${fpsOk ? '✅' : '❌'}`);
console.log(`  코덱:     ${vs.codec_name} ${codecOk ? '✅' : '❌'}`);
console.log(`  영상길이: ${vidDur.toFixed(3)}s ${durOk ? '✅' : '⚠️'}`);
console.log(`  오디오:   ${audDur.toFixed(3)}s ${audioOk ? '✅' : '❌'}`);
console.log(`  Loudness: ${lufs !== null ? lufs.toFixed(1)+' LUFS' : 'N/A'}`);
console.log(`  Peak:     ${peak !== null ? peak.toFixed(1)+' dBFS' : 'N/A'} ${peakOk ? '✅' : '⚠️'}`);

const techPass = durOk && resOk && fpsOk && codecOk && audioOk && peakOk;
console.log(`\n  [${techPass ? 'technical_pass' : 'technical_warn'}] ${techPass ? '✅' : '⚠️'}`);

// ── Step 11: 대사 싱크 QA ─────────────────────────────────────────────────────
console.log('\n=== 대사 싱크 QA (Contract v3 기준) ===');
const syncChecks = [
  { label: 'J1 S1(0~7s) 내',          ok: JUN_OFFSETS_V3[0] >= 5.0 && JUN_OFFSETS_V3[0] + sentences[0].dur <= 7.5 },
  { label: 'J2 S2(7~15s) 내',         ok: JUN_OFFSETS_V3[1] >= 7.0 && JUN_OFFSETS_V3[1] + sentences[1].dur <= 15.5 },
  { label: 'J3 S3(15~24s) 내',        ok: JUN_OFFSETS_V3[2] >= 15.0 && JUN_OFFSETS_V3[2] + sentences[2].dur <= 24.0 },
  { label: 'J4 J3 이후',              ok: JUN_OFFSETS_V3[3] > JUN_OFFSETS_V3[2] + sentences[2].dur },
  { label: 'J5 S4(24~31s) 내',        ok: JUN_OFFSETS_V3[4] >= 24.0 && JUN_OFFSETS_V3[4] + sentences[4].dur <= 31.0 },
  { label: 'J6 J5 이후',              ok: JUN_OFFSETS_V3[5] > JUN_OFFSETS_V3[4] + sentences[4].dur },
  { label: 'Boss S5(31~36.5s) 내',    ok: BOSS_OFFSET_V3 >= 31.0 && bossEnd <= 36.5 },
  { label: 'J7 Boss 이후',            ok: JUN_OFFSETS_V3[6] > bossEnd },
  { label: 'J7 영상 내',              ok: JUN_OFFSETS_V3[6] + sentences[6].dur <= TOTAL_DURATION_S },
  { label: `Tail ${tail.toFixed(2)}s ≥ 0.3s`, ok: tail >= 0.3 },
];
syncChecks.forEach(c => console.log(`  ${c.ok ? '✅' : '❌'} ${c.label}`));
const syncPass = syncChecks.every(c => c.ok);
console.log(`\n  대사 싱크: ${syncPass ? '[event_contract_pass] ✅' : '[sync_fail] ❌'}`);

// ── SFX 확인 요약 ─────────────────────────────────────────────────────────────
console.log('\n=== SFX 레이어 요약 ===');
console.log(`  error_beep:   ${SFX_TIMING.errorBeep}s — S1 오류등 점등`);
console.log(`  paper_rustle: ${SFX_TIMING.paperRustle}~${SFX_TIMING.paperEnd}s — S2 종이 구간`);
console.log(`  copier_motor: ${SFX_TIMING.copierMotor}~${SFX_TIMING.copierEnd}s — S3/S4 폭주 BGM ★필수`);
console.log(`  comic_sting:  ${SFX_TIMING.comicSting}s — J7 직전 스팅`);

const motorCoverageOk = SFX_TIMING.copierMotor <= 15.5 && SFX_TIMING.copierEnd >= 30.0;
console.log(`  copier_motor 15~31s 커버: ${motorCoverageOk ? '✅' : '❌'}`);

// ── 최종 상태 판정 ────────────────────────────────────────────────────────────
console.log('\n=== 최종 QA 판정 ===');
if (!techPass) {
  console.error('[technical_warn] 기술 QA 일부 항목 확인 필요');
}
if (!syncPass) {
  console.error('[ABORT] 대사 싱크 FAIL — offset 조정 필요 (TTS 재호출 아님)');
  process.exit(1);
}
if (!motorCoverageOk) {
  console.error('[ABORT] copier_motor SFX 15~31s 미커버 — Contract v3 필수 조건');
  process.exit(1);
}

console.log(`\n  파일: ${FINAL_MP4}`);
console.log(`  MD5:  ${fileMd5}`);
console.log(`  크기: ${(fileSize/1024/1024).toFixed(2)} MB`);
console.log(`  길이: ${vidDur.toFixed(3)}s`);
console.log(`\n[DONE] final_v3 생성 완료`);
console.log('  → 내부 감정/싱크/SFX QA 후 Owner에게 노출 여부 판단');
console.log('  → 기술적으로 PASS여도 Owner QA 없이 quality_pass 금지');
