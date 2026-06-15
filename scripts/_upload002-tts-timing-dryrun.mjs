/**
 * upload_002_copier — TTS 타이밍 더미 검증 (외부 호출 0회)
 *
 * 실제 TTS 없이 한국어 평균 발화 속도로 각 문장 길이를 추정하여
 * 배치 계획이 유효한지 사전 검증한다.
 *
 * 실행: node scripts/_upload002-tts-timing-dryrun.mjs
 */

// ── 타임라인 상수 ─────────────────────────────────────────────────────────────
const TOTAL_S = 36.5;
const SCENES = [
  { id: 'S1', start: 0.0,  end: 7.5  },
  { id: 'S2', start: 7.5,  end: 16.0 },
  { id: 'S3', start: 16.0, end: 25.0 },
  { id: 'S4', start: 25.0, end: 32.0 },
  { id: 'S5', start: 32.0, end: 36.5 },
];

// ── Jun 7문장 (한국어 발화 길이 추정: ~3.5자/초 ElevenLabs Hyun 기준) ────────
// ElevenLabs Korean TTS 실측 기준: 평균 ~3.0~4.0자/초, 여기선 보수적으로 3.5자/초
const CHARS_PER_SEC = 3.5;

const JUN_LINES = [
  { id: 'J1', text: '한 장만. 진짜 딱 한 장만.',          scene: 'S1', hint: '버튼 직후' },
  { id: 'J2', text: '화 안 낼게. 우리 오늘 좋게 끝내자.', scene: 'S2', hint: '조각 응시 후' },
  { id: 'J3', text: '그래. 그렇지.',                       scene: 'S3', hint: '첫 장 직후' },
  { id: 'J4', text: '근데 왜 계속 나오지?',                scene: 'S3', hint: '2장 시작 시' },
  { id: 'J5', text: '한 장이라고.',                        scene: 'S4', hint: '첫 버튼 누르며' },
  { id: 'J6', text: '우리 좋게 끝내기로 했잖아.',          scene: 'S4', hint: '탈력 시점' },
  { id: 'J7', text: '제 열정 말고, 용지가요.',             scene: 'S5', hint: 'Boss 직후' },
];

const BOSS_LINE = { id: 'Boss', text: '준 씨, 열정이 넘치네요.', scene: 'S5', hint: '손 집는 직후' };

// 한국어 글자 수 계산 (공백·구두점 제외)
function korChars(text) {
  return text.replace(/[^가-힣a-zA-Z0-9]/g, '').length;
}

// 추정 발화 길이 (초) — 구두점 포즈 0.15s/개 추가
function estDur(text) {
  const chars = korChars(text);
  const pauses = (text.match(/[.?!,]/g) || []).length;
  return chars / CHARS_PER_SEC + pauses * 0.15;
}

// ── 배치 계획 ────────────────────────────────────────────────────────────────
// 오프셋 (초)
const JUN_OFFSETS = [1.5, 9.5, 18.5, 21.5, 26.0, 28.8, null]; // J7은 Boss 길이 후 동적 결정
const BOSS_OFFSET = 33.0;

console.log('=== upload_002_copier TTS 타이밍 더미 검증 ===\n');
console.log(`영상 길이: ${TOTAL_S}s`);
console.log(`발화 속도 추정: ${CHARS_PER_SEC}자/초 (ElevenLabs Korean 보수 기준)\n`);

// Boss 먼저 계산
const bossDur = estDur(BOSS_LINE.text);
const bossEnd = BOSS_OFFSET + bossDur;
console.log(`[Boss] "${BOSS_LINE.text}"`);
console.log(`  추정 길이: ${bossDur.toFixed(2)}s`);
console.log(`  offset: ${BOSS_OFFSET}s → end: ${bossEnd.toFixed(2)}s`);
const bossScene = SCENES.find(s => BOSS_OFFSET >= s.start && BOSS_OFFSET < s.end);
console.log(`  씬: ${bossScene?.id} (${bossScene?.start}~${bossScene?.end}s)`);
const bossEndOk = bossEnd <= TOTAL_S - 0.3;
console.log(`  영상 내 여운: ${(TOTAL_S - bossEnd).toFixed(2)}s ${bossEndOk ? '✅' : '⚠️'}\n`);

// J7 오프셋 동적 결정
JUN_OFFSETS[6] = bossEnd + 0.3;

// Jun 7문장
console.log('--- Jun 7문장 배치 ---');
let fail = false;
let prevEnd = 0;

for (let i = 0; i < JUN_LINES.length; i++) {
  const line = JUN_LINES[i];
  const offset = JUN_OFFSETS[i];
  const dur = estDur(line.text);
  const end = offset + dur;
  const scene = SCENES.find(s => offset >= s.start && offset < s.end);
  const chars = korChars(line.text);

  const overlapOk = offset >= prevEnd;
  const inSceneOk = scene?.id === line.scene;
  const withinOk = end <= TOTAL_S;

  const flags = [
    overlapOk ? '✅no-overlap' : `❌overlap(prev_end=${prevEnd.toFixed(2)})`,
    inSceneOk ? `✅${scene?.id}` : `⚠️씬불일치(in ${scene?.id}, expect ${line.scene})`,
    withinOk ? '✅within' : '❌over36.5s',
  ].join(' ');

  console.log(`[${line.id}] "${line.text}"`);
  console.log(`  글자수: ${chars}, 추정: ${dur.toFixed(2)}s`);
  console.log(`  offset: ${offset.toFixed(1)}s → end: ${end.toFixed(2)}s | ${flags}`);
  console.log(`  힌트: ${line.hint}`);
  if (i < JUN_LINES.length - 1) console.log('');

  if (!overlapOk || !withinOk) fail = true;
  prevEnd = end;
}

// S5 내 Boss→J7 순서 확인
console.log('\n--- S5 시퀀스 확인 ---');
const j7Offset = JUN_OFFSETS[6];
const j7Dur = estDur(JUN_LINES[6].text);
const j7End = j7Offset + j7Dur;
const tail = TOTAL_S - Math.max(j7End, bossEnd);

console.log(`  Boss:  ${BOSS_OFFSET}s ~ ${bossEnd.toFixed(2)}s`);
console.log(`  J7:    ${j7Offset.toFixed(2)}s ~ ${j7End.toFixed(2)}s`);
console.log(`  여운:  ${tail.toFixed(2)}s ${tail >= 0.3 ? '✅' : '❌0.3s 미확보'}`);
console.log(`  Boss→J7 순서: ${BOSS_OFFSET < j7Offset ? '✅' : '❌역전'}`);

if (tail < 0.3 || BOSS_OFFSET >= j7Offset) fail = true;

// 총 발화 글자 수 / 크레딧
const junTotalChars = JUN_LINES.reduce((s, l) => s + korChars(l.text), 0);
const bossChars = korChars(BOSS_LINE.text);
console.log('\n--- ElevenLabs 크레딧 추정 ---');
console.log(`  Jun 총 글자: ${junTotalChars}자 (~${junTotalChars} Characters)`);
console.log(`  Boss 글자: ${bossChars}자 (~${bossChars} Characters)`);
console.log(`  합계: ~${junTotalChars + bossChars} Characters`);
console.log('  비용: 구독 쿼터 내 ($0)');

// 최종 판정
console.log('\n=== 더미 검증 결과 ===');
if (fail) {
  console.log('[FAIL] 일부 항목 검증 실패 — 오프셋 조정 필요');
  process.exit(1);
} else {
  console.log('[PASS] 모든 배치 계획 유효');
  console.log('[NEXT] ALLOW_ELEVENLABS=true 승인 후 TTS 생성 스크립트 실행');
  console.log('       → scripts/_upload002-tts-generate.mjs  (ElevenLabs 2회 호출)');
  console.log('       → scripts/_upload002-tts-assemble.mjs  (오디오 조립, 외부 호출 없음)');
}
