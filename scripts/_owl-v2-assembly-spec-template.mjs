/**
 * 부엉박사 조립 스펙 템플릿 — 씬 구조 v2(새 11편부터 영구 기준).
 *
 * 사용법: 이 파일을 `_owl-v2-ep{N}-assembly-spec.mjs`로 복사한 뒤 TODO를 전부
 * 채운다(N = 새 표시 번호). v2 첫 편 이후는 직전 편 스펙을 복사한다. 옛 v1
 * 재고를 다시 만드는 편은 v1 이미지·영상을 재사용할 수 있다(CURRENT_STANDARDS
 * §7 표 — v1 영상은 8초라 재사용 씬은 발화 7초 이내). 이 템플릿 자체로는 조립하지
 * 않는다(나레이션이 TODO라 TTS·조립 입력이 될 수 없다).
 *
 * 기준: _ai/CURRENT_STANDARDS.md §1 "씬 구조 v2"(2026-09-26 Owner 확정).
 * 근거: _ai/benchmark-moneyhunter-policy-shorts-analysis-2026-09-26.md
 * (경제사냥꾼 정책·제도·거시형 79개 자막 원문 분석).
 *
 * v2 요점:
 * - 전체 115~130초 = 본편 약 100~115초 + 고정 CTA 15초. 11~13씬, 씬당 순수
 *   발화(rawAudioDurationSec) 9.5초 이내. 대본은 숫자를 한글로 읽은 기준 약
 *   560~640자(추정치, 새 11편 TTS 실측 후 보정). TTS baseSpeed 1.0 시험.
 * - 부엉박사 몫은 "나한테 뭐가 달라지나"(C형, 제도 변경형) 또는 "나는
 *   어떻게 해야 하나"(D형, 대처법형). 원인 분석형(A형)은 황소특보 몫.
 * - 훅 0초부터: 대상 호명 → "알고 있었어?"형 질문 → 수치 1개 → 호기심/손해.
 *   오프닝은 훅 뒤 한 문장.
 * - 주제 제도는 s4에서 부엉박사가 한 줄로 정의한다. 이름만 나오는 보조 용어
 *   1개는 마지막 씬에서 금박사에게 넘긴다(같은 날 금박사 편 소재).
 * - 고유 문구: "답부터 말하면" / "쉽게 풀면" / "그렇다고 무작정 ~하면 안 돼" /
 *   "콕 집어 정리하면" / "지금 먼저 확인할 건 두 가지야". 경제사냥꾼·황소특보
 *   문구는 쓰지 않는다. 고정 CTA에 "팔로우"가 있으니 마지막 씬에서 팔로우를
 *   말하지 않는다.
 * - 대본 공통 원칙(§A-2): 흐름 먼저, 연속 씬 어미·동사 반복 금지, 같은 수치
 *   두 번 금지, 정부 제도명은 공식 사이트로 최신 운영 여부 확인. 숫자는
 *   자막에 아라비아 숫자로. 세그먼트 한 조각 7~8어절 이내.
 * - 이미지(§0-1): imageBrief는 처음부터 큰 글자 3줄(줄당 12자) 이내, 소품은
 *   감싸 쥐거나 바닥 거치, 빈 면 금지, 캐릭터 세로 45~50%. 이미지 생성은
 *   대본(숫자 포함) 최종 확정 뒤에만.
 * - 선택 씬(optional: true): 소재 정보량에 따라 뺄 수 있다(최소 11씬).
 *   빼면 scene 번호와 video 파일명을 다시 매긴다.
 *
 * 편별로 채울 것: 출처(기관 보도자료·공식 사이트 URL, 확인 날짜), 소재 선정
 * 경위, 배경 설계(재제작 편은 v1 배경 유지, 신규 편은 기존과 겹치지 않는 새
 * 공간), 금박사에게 넘길 보조 용어(재제작 편은 §7 표의 짝 금박사 편 용어).
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  scriptStructureVersion: "owl_script_structure_v2",
  episode: 0, // TODO: 새 표시 번호(= 파일 번호 _owl-v2-ep{N})
  v1SourceSpec: null, // 재제작 편만: 재사용 원본 v1 스펙 파일명(예: "_owl-ep17-assembly-spec.mjs")
  scriptType: "TODO", // "C_policy_change"(나한테 뭐가 달라지나) | "D_what_to_do"(어떻게 해야 하나)
  geumbaksaHandoffTerm: "TODO", // 마지막 씬에서 금박사에게 넘길 보조 용어(본편에서 이름만 나오고 설명 안 함)
  sourceCandidate: "TODO",
  title: "TODO",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["TODO 1줄", "TODO 2줄"],

  // 목표 타임라인(전체 약 121초 = 본편 약 106초 + CTA 15초 기준, TTS 1.0 —
  // 실측 후 재조정): s1~s2 훅 0~12 / s3 오프닝 12~16 / s4 개념 정의 16~24 /
  // s5~s6 상황 24~42 / s7 핵심 질문+즉답(약 30~35%) 42~50 / s8~s10 항목
  // 50~77 / s11 주의(약 70~75%) 77~86 / s12 정리+확인(끝나기 약 30초 전)
  // 86~96 / s13 연결 96~106 → 고정 CTA 106~121.
  scenesTimeline:
    "s1(0-6,hook_q) s2(6-12,hook_stakes) s3(12-16,opening) s4(16-24,definition) s5(24-33,situation) s6(33-42,before_after) s7(42-50,core_q_answer) s8(50-59,point1_who) s9(59-68,point2_how_much) s10(68-77,point3_when_how) s11(77-86,caution) s12(86-96,summary_check) s13(96-106,bridge)",

  instagramCaptionHook: "TODO: 후킹 문장 1개(장식 이모지 금지)",
  instagramCaptionPoints: [
    "TODO: 3~6개 압축 포인트(대본 나열 금지, 핵심 수치만)",
  ],
  instagramPriorityTags: [
    "TODO",
    "경제공부",
    "경제뉴스",
    "경제상식",
    "금융상식",
    "지식콘텐츠",
    "부엉박사",
  ],

  emphasisTerms: ["TODO", "부엉박사"],

  render: Object.freeze({
    width: 1080,
    height: 1920,
    fps: 24,
    videoCodec: "libx264",
    crf: 18,
    pixFmt: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    audioSampleRate: 48000,
    audioChannels: 1,
  }),

  scenes: Object.freeze([
    {
      scene: 1,
      key: "s1_hook_q",
      role: "hook",
      video: "owl_epN_s1_hook_q_motion.mp4",
      narration: "TODO: [대상] 있는 사람, [바뀐 것] 알고 있었어? + [숫자 1개]",
      imageBrief: "TODO: 새 배경 첫 컷. 훅 문구를 큰 글자 1~2줄 카드로 감싸 쥐거나 바닥 거치 보드로.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook_stakes",
      role: "hook",
      video: "owl_epN_s2_hook_stakes_motion.mp4",
      narration: "TODO: 대부분은 ~만 알아 / 모르면 ~ 놓칠 수 있어(호기심 또는 손해 회피)",
      imageBrief: "TODO",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_opening",
      role: "opening",
      video: "owl_epN_s3_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      imageBrief: "TODO: 정면 인사, 한쪽 날개를 살짝 드는 포즈(소품 없음).",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_definition",
      role: "one_line_definition",
      video: "owl_epN_s4_definition_motion.mp4",
      narration: "TODO: [제도]는 ~하는 거야.(주제 제도 한 줄 정의)",
      imageBrief: "TODO",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_situation",
      role: "fact",
      video: "owl_epN_s5_situation_motion.mp4",
      narration: "TODO: [기관]이 [날짜] ~ 발표했어 + 공식 수치",
      imageBrief: "TODO",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_before_after",
      role: "fact",
      optional: true,
      video: "owl_epN_s6_before_after_motion.mp4",
      narration: "TODO: 원래는 ~였는데, 이제는 ~야.(C형 기존 vs 변경 / D형은 현재 상황 수치)",
      imageBrief: "TODO: 바닥 거치 보드에 '기존 → 변경' 두 칸, 칸마다 큰 글자 1줄.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_core_q_answer",
      role: "core_question",
      video: "owl_epN_s7_core_q_answer_motion.mp4",
      narration: "TODO: 그럼 나한테는 뭐가 달라질까?(D형: 그럼 나는 어떻게 해야 할까?) 답부터 말하면, ~야.",
      imageBrief: "TODO",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_point1_who",
      role: "evidence",
      video: "owl_epN_s8_point1_who_motion.mp4",
      narration: "TODO: 첫째, [대상 — 누가 해당되는지]. 쉽게 풀면, ~",
      imageBrief: "TODO",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_point2_how_much",
      role: "evidence",
      video: "owl_epN_s9_point2_how_much_motion.mp4",
      narration: "TODO: 둘째, [금액·혜택]. 계산 예시 1개(예: 월 ~만 원이면 1년에 ~)",
      imageBrief: "TODO",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_point3_when_how",
      role: "evidence",
      optional: true,
      video: "owl_epN_s10_point3_when_how_motion.mp4",
      narration: "TODO: 셋째, [시점·방법 — 언제부터, 어떻게]",
      imageBrief: "TODO",
      overlays: [],
    },
    {
      scene: 11,
      key: "s11_caution",
      role: "condition",
      video: "owl_epN_s11_caution_motion.mp4",
      narration: "TODO: 그렇다고 무작정 ~하면 안 돼. ~하면 ~가 사라지거든.",
      imageBrief: "TODO",
      overlays: [],
    },
    {
      scene: 12,
      key: "s12_summary_check",
      role: "action",
      video: "owl_epN_s12_summary_check_motion.mp4",
      narration: "TODO: 콕 집어 정리하면, ~. 지금 먼저 확인할 건 두 가지야. ~, 그리고 ~.",
      imageBrief: "TODO: 바닥 거치 보드에 체크 2칸, 칸마다 큰 글자 1줄.",
      overlays: [],
    },
    {
      scene: 13,
      key: "s13_bridge",
      role: "save",
      video: "owl_epN_s13_bridge_motion.mp4",
      narration: "TODO: [경로]에서 바로 확인할 수 있어. [보조 용어]가 헷갈리면 금박사가 이어서 쉽게 풀어줄게. 궁금한 제도는 댓글로 남겨줘.",
      imageBrief: "TODO: 밝은 표정, 확인 경로 카드를 감싸 쥐는 마무리 포즈.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
