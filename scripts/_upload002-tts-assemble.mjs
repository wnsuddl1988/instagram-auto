/**
 * upload_002_copier — TTS 오디오 조립 스크립트
 *
 * [호출 계약]
 * - Jun/Hyun TTS 1회 (jun_tts_raw.mp3)
 * - Boss/Theo TTS 1회 (boss_tts_raw.mp3)
 * - 재호출 0회 — 타이밍은 로컬 오프셋으로만 조정
 *
 * [실행 조건]
 * - ALLOW_ELEVENLABS=true 환경변수 필수 (TTS 호출 전용, 이 스크립트는 조립만)
 * - TTS 파일이 없으면 즉시 중단 (외부 호출 없음)
 *
 * [조립 방식]
 * 1. 36.5s 무음 베이스 WAV 생성
 * 2. jun_tts_raw.mp3 → silencedetect로 7문장 경계 탐지 → 7개 구간 분리
 * 3. 각 구간을 화면 행동 시점 오프셋에 배치
 * 4. boss_tts_raw.mp3 → S5 손 등장 시점에 배치
 * 5. amix(inputs=9): base + jun×7 + boss×1
 * 6. 영상과 합성 → final_v1.mp4
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ── 경로 설정 ───────────────────────────────────────────────────────────────
const BASE = 'output/v2/3d_sitcom_prod_v1/upload_002_copier';
const AUDIO_DIR = path.join(BASE, 'audio');
const SILENT_MP4 = path.join(BASE, 'silent/upload_002_copier_silent_v1.mp4');

const JUN_RAW = path.join(AUDIO_DIR, 'jun_tts_raw.mp3');
const BOSS_RAW = path.join(AUDIO_DIR, 'boss_tts_raw.mp3');
const BASE_WAV = path.join(AUDIO_DIR, 'base_silence_36s5.wav');
const MIXED_AAC = path.join(AUDIO_DIR, 'mixed_audio.aac');
const FINAL_MP4 = path.join(BASE, 'final/upload_002_copier_final_v1.mp4');

// ── 상수 ────────────────────────────────────────────────────────────────────
const TOTAL_DURATION_S = 36.5;
const JUN_SENTENCE_COUNT = 7;

/**
 * Jun 7문장 배치 계획 (초 단위)
 * 실제 TTS 생성 후 각 문장 길이를 측정해 겹침 여부 확인 필수
 *
 * 씬 타임라인:
 *   S1: 0.0 ~ 7.5
 *   S2: 7.5 ~ 16.0
 *   S3: 16.0 ~ 25.0
 *   S4: 25.0 ~ 32.0
 *   S5: 32.0 ~ 36.5
 */
const JUN_OFFSETS_S = [
  1.5,   // J1: "한 장만. 진짜 딱 한 장만."         — S1 버튼 직후
  9.5,   // J2: "화 안 낼게. 우리 오늘 좋게 끝내자." — S2 조각 응시 (S2+2.0s)
  18.5,  // J3: "그래. 그렇지."                      — S3 첫 장 직후 (S3+2.5s)
  21.5,  // J4: "근데 왜 계속 나오지?"               — S3 2장 시작 (S3+5.5s)
  26.0,  // J5: "한 장이라고."                       — S4 첫 버튼 (S4+1.0s)
  28.8,  // J6: "우리 좋게 끝내기로 했잖아."         — S4 탈력 시점 (S4+3.8s)
  34.5,  // J7: "제 열정 말고, 용지가요."            — Boss 직후 (S5+2.5s)
];

// Boss 오프셋: S5(32.0s) + 1.0s = 33.0s (손 집는 행동과 동기화)
const BOSS_OFFSET_S = 33.0;

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function run(cmd, label) {
  console.log(`\n[RUN] ${label}`);
  const result = spawnSync(cmd, { shell: true, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`[FAIL] ${label}`);
    console.error(result.stderr);
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

// ── Step 0: TTS 파일 존재 확인 ───────────────────────────────────────────────
console.log('=== upload_002_copier TTS 오디오 조립 ===');
console.log('[GATE] TTS 파일 존재 확인...');

if (!fs.existsSync(JUN_RAW) || !fs.existsSync(BOSS_RAW)) {
  console.log('[ABORT] TTS 파일 없음 — ElevenLabs 미호출 상태');
  console.log(`  Jun:  ${fs.existsSync(JUN_RAW) ? 'OK' : 'MISSING'} → ${JUN_RAW}`);
  console.log(`  Boss: ${fs.existsSync(BOSS_RAW) ? 'OK' : 'MISSING'} → ${BOSS_RAW}`);
  console.log('[INFO] ALLOW_ELEVENLABS=true 승인 후 TTS 생성 스크립트를 먼저 실행하세요.');
  process.exit(0);
}

console.log('[OK] Jun TTS:', JUN_RAW);
console.log('[OK] Boss TTS:', BOSS_RAW);

// ── Step 1: 출력 디렉토리 생성 ───────────────────────────────────────────────
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(path.join(BASE, 'final'), { recursive: true });

// ── Step 2: Jun TTS 길이 측정 ────────────────────────────────────────────────
console.log('\n[Step 2] Jun TTS 길이 측정...');
const junDuration = ffprobe(JUN_RAW);
const bossDuration = ffprobe(BOSS_RAW);
console.log(`  Jun 원본 길이: ${junDuration.toFixed(3)}s`);
console.log(`  Boss 길이: ${bossDuration.toFixed(3)}s`);

// ── Step 3: Jun 문장 경계 탐지 (silencedetect) ───────────────────────────────
console.log('\n[Step 3] Jun 문장 경계 탐지...');

const silenceOut = spawnSync(
  `ffmpeg -i "${JUN_RAW}" -af silencedetect=noise=-35dB:d=0.25 -f null - 2>&1`,
  { shell: true, encoding: 'utf8' }
);
const silenceLog = silenceOut.stdout + silenceOut.stderr;

// silence_start / silence_end 파싱
const silenceStarts = [...silenceLog.matchAll(/silence_start: ([\d.]+)/g)].map(m => parseFloat(m[1]));
const silenceEnds = [...silenceLog.matchAll(/silence_end: ([\d.]+)/g)].map(m => parseFloat(m[1]));

console.log(`  silence_start 감지: ${silenceStarts.length}개 → ${silenceStarts.map(v=>v.toFixed(3)).join(', ')}`);
console.log(`  silence_end 감지: ${silenceEnds.length}개 → ${silenceEnds.map(v=>v.toFixed(3)).join(', ')}`);

// 발화 구간 계산: 각 silence_end → 다음 silence_start 사이가 발화 구간
// 첫 번째: 0 → 첫 silence_start
// 마지막: 마지막 silence_end → 파일 끝
const segments = [];
let prevEnd = 0;

for (let i = 0; i < silenceStarts.length; i++) {
  const segStart = prevEnd;
  const segEnd = silenceStarts[i];
  if (segEnd - segStart > 0.05) {
    segments.push({ start: segStart, end: segEnd, dur: segEnd - segStart });
  }
  prevEnd = (silenceEnds[i] !== undefined) ? silenceEnds[i] : silenceStarts[i] + 0.1;
}
// 마지막 구간
if (junDuration - prevEnd > 0.05) {
  segments.push({ start: prevEnd, end: junDuration, dur: junDuration - prevEnd });
}

console.log(`  발화 구간 감지: ${segments.length}개`);
segments.forEach((s, i) => {
  console.log(`    J${i+1}: ${s.start.toFixed(3)}s ~ ${s.end.toFixed(3)}s (${s.dur.toFixed(3)}s)`);
});

// ── Step 4: 문장 수 검증 ─────────────────────────────────────────────────────
console.log('\n[Step 4] 문장 수 검증...');
if (segments.length !== JUN_SENTENCE_COUNT) {
  console.error(`[ABORT] Jun 발화 구간 ${segments.length}개 감지 — 정확히 ${JUN_SENTENCE_COUNT}개 필요`);
  console.error('[INFO] silencedetect 임계값(-35dB) 조정이 필요하거나 TTS 재구성이 필요합니다.');
  console.error('[INFO] 재호출 없이 임계값만 조정 후 재실행하세요.');
  process.exit(1);
}
console.log(`[OK] 정확히 ${JUN_SENTENCE_COUNT}개 발화 구간 확인`);

// ── Step 5: 배치 계획 검증 (겹침 + 영상 종료 전 여운 확인) ──────────────────
console.log('\n[Step 5] 배치 계획 검증...');

let prevFinalEnd = 0;
let validationFail = false;

for (let i = 0; i < JUN_SENTENCE_COUNT; i++) {
  const offset = JUN_OFFSETS_S[i];
  const dur = segments[i].dur;
  const end = offset + dur;

  // S5 내 J7 확인: Boss 먼저 시작 후 J7 시작
  if (i === 6) { // J7
    const bossEnd = BOSS_OFFSET_S + bossDuration;
    if (offset < bossEnd) {
      console.error(`[WARN] J7 시작(${offset}s)이 Boss 종료(${bossEnd.toFixed(3)}s) 전 — 겹침 가능`);
      console.log(`[INFO] J7 오프셋을 ${(bossEnd + 0.3).toFixed(1)}s 이후로 조정 권장`);
      // 자동 조정 (재호출 없이 로컬만)
      JUN_OFFSETS_S[6] = bossEnd + 0.3;
      console.log(`[AUTO-ADJUST] J7 오프셋 → ${JUN_OFFSETS_S[6].toFixed(1)}s`);
    }
  }

  const adjustedOffset = JUN_OFFSETS_S[i];
  const adjustedEnd = adjustedOffset + dur;

  // 영상 종료 전 여운
  if (i === 6 && adjustedEnd > TOTAL_DURATION_S - 0.3) {
    console.error(`[FAIL] J7 종료(${adjustedEnd.toFixed(3)}s) — 여운 0.3s 확보 불가 (영상 ${TOTAL_DURATION_S}s)`);
    validationFail = true;
  }

  // 이전 발화와 겹침
  if (adjustedOffset < prevFinalEnd) {
    console.error(`[FAIL] J${i+1} 시작(${adjustedOffset}s) < J${i} 종료(${prevFinalEnd.toFixed(3)}s) — 겹침`);
    validationFail = true;
  }

  console.log(`  J${i+1}: offset=${adjustedOffset}s, dur=${dur.toFixed(3)}s, end=${adjustedEnd.toFixed(3)}s ${adjustedEnd <= TOTAL_DURATION_S ? '✅' : '⚠️ 영상 초과'}`);
  prevFinalEnd = adjustedEnd;
}

// Boss 검증
const bossEnd = BOSS_OFFSET_S + bossDuration;
console.log(`  Boss: offset=${BOSS_OFFSET_S}s, dur=${bossDuration.toFixed(3)}s, end=${bossEnd.toFixed(3)}s ${bossEnd <= TOTAL_DURATION_S ? '✅' : '⚠️ 영상 초과'}`);

if (bossEnd > TOTAL_DURATION_S) {
  console.error('[FAIL] Boss 대사가 영상 길이를 초과');
  validationFail = true;
}

const lastEnd = Math.max(prevFinalEnd, bossEnd);
const tail = TOTAL_DURATION_S - lastEnd;
console.log(`\n  마지막 발화 종료: ${lastEnd.toFixed(3)}s`);
console.log(`  여운(tail): ${tail.toFixed(3)}s ${tail >= 0.3 ? '✅' : '⚠️ 0.3s 미만'}`);

if (tail < 0.3) {
  console.error('[FAIL] 여운 0.3s 미확보');
  validationFail = true;
}

if (validationFail) {
  console.error('\n[ABORT] 배치 계획 검증 실패 — 오프셋 조정 후 재실행');
  process.exit(1);
}
console.log('\n[OK] 배치 계획 검증 PASS');

// ── Step 6: Jun 문장 구간 분리 ───────────────────────────────────────────────
console.log('\n[Step 6] Jun 문장 구간 분리...');
const junSegFiles = [];

for (let i = 0; i < segments.length; i++) {
  const seg = segments[i];
  const outFile = path.join(AUDIO_DIR, `jun_seg_${i+1}.wav`);
  run(
    `ffmpeg -y -i "${JUN_RAW}" -ss ${seg.start.toFixed(3)} -to ${seg.end.toFixed(3)} -c:a pcm_s16le "${outFile}"`,
    `Jun J${i+1} 분리 (${seg.start.toFixed(3)}~${seg.end.toFixed(3)}s)`
  );
  junSegFiles.push(outFile);
}
console.log(`[OK] ${junSegFiles.length}개 구간 분리 완료`);

// ── Step 7: 36.5초 무음 베이스 WAV 생성 ─────────────────────────────────────
console.log('\n[Step 7] 무음 베이스 WAV 생성...');
run(
  `ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${TOTAL_DURATION_S} -c:a pcm_s16le "${BASE_WAV}"`,
  `${TOTAL_DURATION_S}s 무음 베이스 WAV`
);

// ── Step 8: amix 조합 ────────────────────────────────────────────────────────
console.log('\n[Step 8] amix 오디오 조합...');

// 입력: [0]=base, [1~7]=jun 7개, [8]=boss
const inputs = [`-i "${BASE_WAV}"`];
junSegFiles.forEach(f => inputs.push(`-i "${f}"`));
inputs.push(`-i "${BOSS_RAW}"`);

const filterParts = [];

// Jun 7개 adelay
for (let i = 0; i < JUN_SENTENCE_COUNT; i++) {
  const ms = Math.round(JUN_OFFSETS_S[i] * 1000);
  filterParts.push(`[${i+1}:a]adelay=${ms}|${ms}[j${i+1}]`);
}

// Boss adelay
const bossMs = Math.round(BOSS_OFFSET_S * 1000);
filterParts.push(`[8:a]adelay=${bossMs}|${bossMs}[boss]`);

// amix: base + j1~j7 + boss = 9 inputs, duration=first (base가 36.5s 고정)
const mixInputs = ['[0:a]', ...Array.from({length: 7}, (_, i) => `[j${i+1}]`), '[boss]'].join('');
filterParts.push(`${mixInputs}amix=inputs=9:duration=first:normalize=0[aout]`);

const filterComplex = filterParts.join('; ');

run(
  `ffmpeg -y ${inputs.join(' ')} -filter_complex "${filterComplex}" -map [aout] -ar 44100 -ac 2 -c:a aac -b:a 192k "${MIXED_AAC}"`,
  'amix 오디오 조합'
);

// ── Step 9: 영상 + 오디오 합성 ───────────────────────────────────────────────
console.log('\n[Step 9] 영상+오디오 합성...');
run(
  `ffmpeg -y -i "${SILENT_MP4}" -i "${MIXED_AAC}" -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_MP4}"`,
  '최종 영상 합성'
);

// ── Step 10: 최종 QA ──────────────────────────────────────────────────────────
console.log('\n[Step 10] 최종 QA...');

const finalDur = ffprobe(FINAL_MP4, 'v');
const audioDur = ffprobe(FINAL_MP4, 'a');
console.log(`  영상 길이: ${finalDur.toFixed(3)}s (기준: ${TOTAL_DURATION_S}s)`);
console.log(`  오디오 길이: ${audioDur.toFixed(3)}s`);

// loudness 측정
const loudnessOut = spawnSync(
  `ffmpeg -i "${FINAL_MP4}" -filter_complex ebur128=peak=true -f null - 2>&1`,
  { shell: true, encoding: 'utf8' }
);
const loudnessLog = loudnessOut.stdout + loudnessOut.stderr;
const lufsMatch = loudnessLog.match(/I:\s+([-\d.]+)\s+LUFS/);
const peakMatch = loudnessLog.match(/Peak:\s+([-\d.]+)\s+dBFS/);
const lufs = lufsMatch ? parseFloat(lufsMatch[1]) : null;
const peak = peakMatch ? parseFloat(peakMatch[1]) : null;

console.log(`  Loudness: ${lufs !== null ? lufs.toFixed(1)+' LUFS' : '측정 불가'} (목표: -14 ±2)`);
console.log(`  Peak: ${peak !== null ? peak.toFixed(1)+' dBFS' : '측정 불가'} (기준: ≤ -3)`);

const sizeKB = Math.round(fs.statSync(FINAL_MP4).size / 1024);
console.log(`  파일 크기: ${sizeKB}KB`);

// QA 판정
const durationOk = Math.abs(finalDur - TOTAL_DURATION_S) < 0.5;
const loudnessOk = lufs !== null ? (lufs >= -16 && lufs <= -12) : true;
const peakOk = peak !== null ? peak <= -3 : true;

console.log('\n=== QA 결과 ===');
console.log(`  영상 길이: ${durationOk ? '✅' : '⚠️'} ${finalDur.toFixed(3)}s`);
console.log(`  Loudness:  ${loudnessOk ? '✅' : '⚠️'} ${lufs !== null ? lufs.toFixed(1)+' LUFS' : 'N/A'}`);
console.log(`  Peak:      ${peakOk ? '✅' : '⚠️'} ${peak !== null ? peak.toFixed(1)+' dBFS' : 'N/A'}`);

if (!durationOk || !loudnessOk || !peakOk) {
  console.error('\n[WARN] 일부 QA 기준 미충족 — 수동 확인 필요');
} else {
  console.log('\n[PASS] 최종 QA 통과');
}

console.log(`\n[완료] 최종 영상: ${FINAL_MP4}`);
console.log('[INFO] 원본 TTS 파일은 보존됨:');
console.log(`  Jun: ${JUN_RAW}`);
console.log(`  Boss: ${BOSS_RAW}`);
