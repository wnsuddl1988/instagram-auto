/**
 * 황소특보 14편 조립 스펙 — 16장면. 씬 구조 v3 + 성공 공식/엔딩 5박자 일곱 번째 적용본(품질 체계 v2 네 번째 황소편). 9편(오픈AI×마이크론 D-1) 후속.
 *
 * 전달 메시지 한 줄: 좋은 실적이어도 주가는 숫자 자체보다 "이익률 우려"와 "수요 기대" 사이에서 흔들린다 — 우려와 기대를 나눠 읽어야 다음 신호(삼성전자 잠정실적)가 읽힌다.
 * 담당: 황소특보(투자자 입장, 규칙 22). 영역 반도체 · 레인 ① 원인 해설(+⑦ 한국 연결) · 유형 event+structure · 특보 근접도 상(9/30 현지 발표, 10/1 새벽 소식).
 *
 * ★ 소재 선정 경위(2026-10-02)★: 규칙 25 오케스트레이터 11단계 전부(`C:/tmp/bull-topic-scan-ep14/SCAN_CHECKLIST.md`) + 후보 42개 → Owner가 1+2번(증권사 리포트×수출) 결합을 골랐으나 "무슨 말인지 안 와닿는다"
 * 지적으로 폐기(`_ai/bull-ep14-research-export-script-draft.md` 보관) → Owner "3번 마이크론으로 교체해서 진행해". 9편 마지막 씬이 "결과가 나오면 다시 짚어줄게"를 약속했으므로 후속(중복이지만 새 전개 =
 * 확정 숫자 + 주가가 내렸다가 오른 이유 + 한국 반응)으로 Owner 승인 해석. 오프닝은 Owner "B안"(압축형, 2026-10-02) — "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게." (검사기 규칙도 같은 날 수정).
 * 6번 대미투자 2,000억 달러 발표는 15편 후보로 보관(산업통상부 공식 자료 확인 전, 매체별로 원전 확정 여부가 다름).
 *
 * ★ 핵심 팩트(2026-10-02 기사 원문 열람, 출처 표 `_ai/bull-ep14-micron-script-draft.md`)★
 * - 마이크론 2026 회계연도 4분기(6~8월), 현지 9/30 장 마감 후 발표: 매출 542억 2,900만 달러(전년 동기 4.8배·+379.3%), 다음 분기 매출 가이던스 600억~630억 달러(시장 예상 상회)(서울신문·파이낸셜뉴스·블록미디어).
 * - 다음 분기 매출총이익률 약 86.3%(86.25%), 직전 분기 87%, 시장 예상 86.7%. CFO "직원 보상 확대가 이익률 전망에 영향을 준 가장 큰 요인"(이데일리). CEO "2027·2028년 수요가 공급을 초과, 수급 올해보다 더 빠듯"(파이낸셜뉴스).
 * - 발표 직후 시간외: 처음 하락(-0.69%·약 -1%)에서 반등해 2% 상승(이데일리 "시간외 2%↑", 트레이딩키 "하락세에서 반등해 2% 상승"). 출처·시점마다 달라 훅은 "내렸다가 곧 2% 올랐어"로만 표현. 10/1 미국 정규장 종가는 미확인.
 * - 한국 10/1 마감: 코스피 +1.95%(6,971.35), 삼성전자 +2.79%(27만 6,000원)·SK하이닉스 +3.21%(183만 3,000원)(뉴스핌·비건뉴스·재경일보). KIS 스캔값(2.23%·2.93%)은 마감 전 값이라 쓰지 않음.
 * - 3분기 영업이익 컨센서스(에프앤가이드 10/1): 삼성전자 108조 6,786억·SK하이닉스 77조 2,214억, 둘 다 분기 최대 전망(파이낸셜뉴스·서울신문). 골드만삭스: 손익분기에 연 약 3,000억 달러 AI 매출 필요(서울신문 인용).
 * - 제외: 시간외 정확한 등락률(출처 불일치), 컨센서스 대비 EPS·매출 정확치(출처별 다름), 연간 영업이익 650조(기준일 혼재), 환율(길이 초과), 삼성전자 잠정실적 공시일 단정(10/7~8 미확정).
 * - 리스크 고지: 나레이션에 넣지 않고 오프닝(s2)·마지막(s16) 하단 자막바로만.
 *
 * TTS 실측: (생성 후 기입)
 */

// 카드(두 손으로 감싼 납작한 가로형) / 보드(긴 다리 이젤) 구도 문구 — 황소 13편 스펙과 동일(규칙 15, A-4 ④).
const CARD_LAYOUT =
  "구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.";
const BOARD_LAYOUT =
  "구도(반드시, 11편 사고 재발 방지 — 황소+보드 묶음 폭 ≤76%): 황소는 이미지 왼쪽(가로 10~36%)에 서고, 보드는 황소 바로 오른쪽에 붙여 작고 아담하게 세운다 — 보드 전체가 이미지 가로 40%~72% 사이에만 들어오고 폭은 28% 이하(황소 몸통 폭보다 좁게, 몸통 폭의 90% 이하 — 보드가 황소 몸통보다 넓으면 실패), 높이는 세로의 24% 이하로 황소 키보다 훨씬 낮게. 보드 오른쪽 끝은 절대 가로 76%를 넘지 않고, 보드 오른쪽 끝과 화면 오른쪽 가장자리 사이에 바닥과 배경이 넉넉히(가로 24% 이상) 보여야 하며 보드가 잘리거나 가장자리에 닿으면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).";
const WIDE_BOARD_NOTE =
  "(와이드 샷이어도 보드는 크게 — 보드 프레임 전체가 이미지 가로 45%~83% 사이에 들어와야 하고 오른쪽 끝은 절대 83%를 넘지 않는다. 황소는 이미지 왼쪽 15~42%에 서서 보드 쪽을 가리킨다. 보드 오른쪽에 배경 여백을 남길 것) ";
const card2 = (l1, l2, expression) => `황소가 ${expression} '${l1}'와 '${l2}'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${CARD_LAYOUT}`;
const board = (lines, pose, wide = false) =>
  `황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 ${lines.map((l) => `'${l}'`).join(", ")}가 ${lines.length === 2 ? "두" : "세"} 줄로 크게 적혀 있고, 황소가 ${pose}. ${wide ? WIDE_BOARD_NOTE : ""}${BOARD_LAYOUT}`;

// 좌우 반전 보드 구도(13편 s8에서 통한 방식): 황소 오른쪽, 보드 왼쪽. 오른쪽 배치가 반복해서 안전선을 넘을 때만 그 씬에 쓴다.
const FLIP_BOARD_LAYOUT =
  "구도(반드시, 이번 장면만 좌우를 뒤집는다): 황소는 이미지 오른쪽(가로 58~88%)에 서고, 보드는 황소 왼쪽에 세워 보드 전체가 이미지 가로 14%~54% 사이에만 들어온다. 보드 왼쪽 끝은 절대 가로 12% 밖으로 나가지 않고 보드 폭은 36% 이하, 황소 오른쪽 끝도 가로 90%를 넘지 않으며 황소와 보드 모두 화면 가장자리에 닿거나 잘리면 실패. 보드에는 지정한 굵은 큰 글자 줄만 넣고 그래프·표·작은 라벨은 넣지 않는다. 글자는 세로 28~58% 안. 보드는 이젤 위에 높게 올려 황소 어깨~머리 높이에 오게 한다(보드 윗변 세로 30% 근처, 아랫변 세로 55% 이내).";
const boardFlip = (lines, pose) =>
  `황소 옆 긴 다리 이젤(바닥에 고정) 위에 올려 세운 보드에 ${lines.map((l) => `'${l}'`).join(", ")}가 ${lines.length === 2 ? "두" : "세"} 줄로 크게 적혀 있고, 황소가 ${pose}. ${FLIP_BOARD_LAYOUT}`;

export const BULL_EP14_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "bull_assembly_spec_v1",
  scriptStructureVersion: "bull_script_structure_v3",
  endingStructureVersion: "bull_ending_5beat_2026_09_29",
  episode: 14,
  sourceCandidate: "candidate-bull-ep14-micron-earnings-reaction-2026-10-02",
  title: "마이크론 역대급 실적인데, 주가는 왜 내렸다가 올랐을까",
  channelName: "경제번역소",
  characterDisplayName: "황소특보",
  // 3줄, 줄별 실제 글자 108px(QA 게이트: 줄별 100px 이상·최대 3줄, 한 줄 약 8자 이내).
  headerTitle: ["마이크론 역대급", "실적인데 주가", "내렸다 올랐다"],

  // ── 이미지·영상 연출 필드(품질 체계 v2, 규칙 15) ──
  hookType: "T1",
  imageCharacter: "bull3dv1",
  imagePrefix: "bull_ep14",
  // 소재(AI 메모리 실적, 이익률, 한국 반도체 반응)에 맞는 공간 3곳. 직전 편들(13편 출국 라운지·저울 홀·마켓 홀, 12편 야경 라운지·자금 흐름 상황실·주차장 로비, 11편 조선소·상황실·항만)과 겹치지 않는다.
  // 배경에 글자·숫자·로고·화면·지도 없음.
  sceneBackgrounds: Object.freeze({
    A: {
      label: "AI 데이터센터 복도(도입·한국 전망·정리·마무리)",
      image:
        "깔끔하고 밝은 AI 데이터센터 복도. 황소특보 뒤로 양옆에 큼직한 서버 랙이 줄지어 서 있고(랙 문에는 작은 파란·청록 점 조명만 규칙적으로 빛나고 글자·숫자·로고·화면 없음), 천장에는 길게 이어진 흰색 조명 띠, 바닥은 매끈한 광택 바닥. 복도 끝은 환한 빛으로 이어지고 큰 빈 벽면 없이 랙과 조명으로 채운다. 차분한 블루·화이트 조명, 저폴리곤 단순화. 글자·숫자·표지판·모니터 없음.",
      videoStyle: "clean bright AI data center corridor with server racks",
      videoStatics: "the rows of large server racks with small blue and teal dot lights, the long white ceiling light strips, the corridor opening into bright light, and the glossy floor",
    },
    B: {
      label: "웨이퍼 클린룸 전시관(상황·이익률·근거)",
      image:
        "밝은 반도체 클린룸 전시관. 황소특보 뒤로 유리 선반들에 은빛으로 반짝이는 둥근 웨이퍼 모양 원판 수십 장이 가지런히 꽂혀 넓게 펼쳐지고(원판에는 글자·숫자·무늬 없음), 가운데 둥근 흰색 전시대, 양옆에 큼직한 둥근 조명, 바닥은 하얗고 매끈한 광택 바닥. 큰 빈 벽면 없이 유리 선반과 전시대로 채운다. 순백·은빛 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·로고·화면·마스크·방진복 입은 사람 없음.",
      videoStyle: "bright semiconductor cleanroom showcase with glass shelves of silver wafer discs",
      videoStatics: "the glass shelves lined with silver wafer discs, the round white display stand, the large round lights, and the white glossy floor",
    },
    C: {
      label: "아침 햇살 식물 라운지(둘째 근거·한국 반응)",
      image:
        "아침 햇살이 가득한 둥근 식물 라운지. 황소특보 뒤로 큼직한 식물 벽과 곡선형 원목 벤치가 넓게 펼쳐지고, 천장 스카이라이트로 부드러운 햇살이 쏟아지며, 양옆에 큼직한 화분과 둥근 덤불, 바닥은 따뜻한 원목 마루. 큰 빈 벽면 없이 식물과 벤치로 채운다. 따뜻한 골드·연두 조명, 저폴리곤 단순화. 글자·숫자·간판·화면·시계 없음.",
      videoStyle: "sunlit round plant lounge with curved wooden benches",
      videoStatics: "the large plant wall, the curved wooden benches, the skylight with soft sunlight, the large potted plants and round shrubs, and the warm wooden floor",
    },
  }),

  scenesTimeline:
    "s1 훅 / s2 오프닝(압축형) / s3 상황(매출 542억) / s4 상황(다음 분기 전망) / s5 핵심질문 / s6 근거1 이익률 우려 / s7 근거1 이유(성과급) / s8 근거2 수요 기대 / s9 한국 반응(코스피·삼성전자) / s10 SK하이닉스·분기 최대 전망 / s11 전망치 / s12 균형 / s13 통찰 / s14 체크 / s15 이득 각인 / s16 당부+예고+댓글",

  instagramCaptionHook: "마이크론이 역대급 실적을 냈는데, 주가는 발표 직후 내렸다가 곧 2% 올랐어",
  instagramCaptionPoints: [
    "마이크론이 9월 30일(현지) 낸 분기 매출은 542억 달러로 1년 전의 4.8배, 다음 분기 매출 전망은 600억~630억 달러로 시장 예상을 웃돌았어",
    "그런데 다음 분기 이익률(팔아서 남는 돈의 비율) 전망이 87%에서 86.3%로 낮아졌고 시장 기대는 86.7%였어, CFO는 직원 성과급 확대가 가장 큰 이유라고 밝혔어",
    "반면 CEO는 내년과 내후년에 메모리 수요가 공급을 넘고 수급이 올해보다 더 빠듯할 거라고 봤어",
    "한국에서도 코스피는 1.95%, 삼성전자는 2.8%, SK하이닉스는 3.2% 올랐고, 3분기 영업이익 전망은 삼성전자 약 108조 7천억 원, SK하이닉스 약 77조 2천억 원으로 둘 다 분기 최대로 전망돼",
    "골드만삭스는 AI 투자가 본전이 되려면 연 약 3천억 달러의 AI 매출이 필요하다고 봤어",
    "👉 삼성전자 잠정실적이 시장 전망을 넘는지, 이익률이 유지되는지 확인해봐",
    "※ 공개된 실적·전망 자료를 정리한 거고 종목 추천이나 투자 권유가 아니야, 전망치는 변동될 수 있어",
  ],
  instagramPriorityTags: [
    "마이크론",
    "삼성전자",
    "SK하이닉스",
    "반도체",
    "메모리반도체",
    "HBM",
    "AI반도체",
    "이익률",
    "실적발표",
    "주식공부",
    "주식투자",
    "경제뉴스",
    "황소특보",
  ],

  emphasisTerms: ["마이크론", "이익률", "삼성전자", "SK하이닉스", "황소특보"],

  // s11 "SK하이닉스 77조 2천억 원이야"는 "77조 2천억 원이야"가 792px로 자막 폭 한도(760px)를 넘어 한 줄에 못 들어가고,
  // "2천억 / 원"도 금지라 "77조 | 2천억"에서만 나뉜다. 대사를 바꾸려면 TTS 재생성이 필요해 이 한 곳만 예외로 승인(QA가 경고로 남김).
  captionBoundaryExceptions: Object.freeze([
    { left: "77조", right: "2천억", reason: "77조 2천억 원이야(792px)가 자막 폭 한도 760px를 넘어 숫자 사이 말고는 나눌 수 없음(s11, TTS 재생성 회피)" },
  ]),

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
      key: "s1_hook",
      role: "hook",
      video: "bull_ep14_s1_motion.mp4",
      narration: "다들, 마이크론이 역대급 실적을 내면 주가가 바로 뛸 줄 알았지? 발표 직후엔 내렸다가 곧 2% 올랐어.",
      imageBrief: card2("역대급 실적인데", "주가는?", "놀라고 궁금하다는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is wide-eyed and puzzled, eyebrows raised, as if asking the viewer why the stock did not jump; body and face move gently while the hands holding the card stay still.", mood: "posing an intriguing question to the viewer" },
    },
    {
      scene: 2,
      key: "s2_opening",
      role: "opening",
      video: "bull_ep14_s2_motion.mp4",
      narration: "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      imageBrief: "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.", mood: "warmly greeting the viewer" },
      riskDisclosure: true,
    },
    {
      scene: 3,
      key: "s3_situation_sales",
      role: "background",
      video: "bull_ep14_s3_motion.mp4",
      narration: "숫자부터 보자. 마이크론이 9월 30일 낸 분기 매출은 542억 달러로, 1년 전의 4.8배야.",
      // 보드 구도 3회 탈락(2026-10-02: 오른쪽 배치 2회 보드 끝 90%+, 좌우 반전 1회 글자 시작 10.2%) → 카드 구도로 전환(카드는 s1에서 통과).
      imageBrief: card2("542억 달러", "1년 전 4.8배", "또렷하고 밝게 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is bright and informative with slight nods; only the face and body move while the hands holding the card stay still.", mood: "calmly presenting the big figures" },
    },
    {
      scene: 4,
      key: "s4_situation_guide",
      role: "background",
      video: "bull_ep14_s4_motion.mp4",
      narration: "다음 분기 매출 전망도 600억에서 630억 달러로, 시장 예상을 웃돌았어.",
      imageBrief: board(["다음 분기 전망", "600억~630억"], "빈 손으로 보드를 가리키며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points to the board lines one after another from top to bottom without touching it, explaining with a bright, clear expression, while the other hand rests near its hip.", mood: "clearly explaining the strong guidance" },
    },
    {
      scene: 5,
      key: "s5_core_q",
      role: "twist",
      video: "bull_ep14_s5_motion.mp4",
      narration: "그럼 왜 주가가 내렸다가 올랐을까? 한마디로 이익률 우려와 수요 기대가 부딪혔기 때문이야.",
      imageBrief: card2("이익률 우려", "수요 기대", "갸웃하다 확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression starts curious with a slight head tilt and turns confident and knowing; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the key answer" },
    },
    {
      scene: 6,
      key: "s6_evidence_margin",
      role: "evidence",
      video: "bull_ep14_s6_motion.mp4",
      narration: "첫째는 우려야. 팔아서 남는 돈의 비율인 이익률이 87%에서 86.3%로 낮아진대.",
      imageBrief: board(["이익률 87%", "86.3%로 하락", "기대 86.7%"], "빈 손으로 보드를 가리키며 설명하는 자세"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "board", action: "the character's free hand points toward the board lines without touching it, with a clear, serious, informative expression, while the other hand rests near its hip.", mood: "clearly explaining the margin concern" },
    },
    {
      scene: 7,
      key: "s7_evidence_reason",
      role: "evidence",
      video: "bull_ep14_s7_motion.mp4",
      narration: "시장 기대는 86.7%였는데, 마이크론 CFO는 직원 성과급 확대가 가장 큰 이유라고 말했어.",
      imageBrief: card2("가장 큰 이유", "직원 성과급", "또렷하고 설명하는 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is clear and explanatory with slight nods; only the face and body move while the hands holding the card stay still.", mood: "clearly explaining the reason" },
    },
    {
      scene: 8,
      key: "s8_evidence_expect",
      role: "evidence",
      video: "bull_ep14_s8_motion.mp4",
      narration: "둘째는 기대야. 마이크론 CEO는 내년과 내후년엔 수요가 공급을 넘고 수급이 더 빠듯하다고 봤어.",
      // 보드 구도 2회 탈락(2026-10-02: 오른쪽 배치 글자 끝 92%, 좌우 반전 글자 시작 10.8%) → 카드 구도로 전환.
      imageBrief: card2("내년·내후년", "수요 > 공급", "밝고 희망찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "C",
      motion: { type: "card2", action: "the character's expression is bright, hopeful and informative with slight nods; only the face and body move while the hands holding the card stay still.", mood: "brightly explaining the demand outlook" },
    },
    {
      scene: 9,
      key: "s9_korea_reaction",
      role: "background",
      video: "bull_ep14_s9_motion.mp4",
      narration: "한국에서도 마이크론 훈풍에 코스피는 1.95%, 삼성전자는 2.8% 올랐어.",
      imageBrief: board(["코스피 1.95%", "삼성전자 2.8%"], "빈 손으로 보드를 가리키며 밝게 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "C",
      motion: { type: "board", action: "the character's free hand points to the board lines one after another from top to bottom without touching it, with a bright, upbeat expression, while the other hand rests near its hip.", mood: "brightly reporting the Korean market reaction" },
    },
    {
      scene: 10,
      key: "s10_korea_forecast",
      role: "insight",
      video: "bull_ep14_s10_motion.mp4",
      narration: "SK하이닉스는 3.2% 올랐고, 두 회사 3분기 영업이익은 모두 분기 최대로 전망돼.",
      imageBrief: card2("SK하이닉스 3.2%", "분기 최대 전망", "또렷하고 확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is bright and confident with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently showing the record forecast" },
    },
    {
      scene: 11,
      key: "s11_forecast_numbers",
      role: "insight",
      video: "bull_ep14_s11_motion.mp4",
      narration: "전망치는 삼성전자 108조 7천억 원, SK하이닉스 77조 2천억 원이야.",
      imageBrief: board(["3분기 영업이익", "삼성전자 108.7조", "SK하이닉스 77.2조"], "빈 손으로 보드를 가리키며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "board", action: "the character's free hand points to the board lines one after another from top to bottom without touching it, with a clear, engaged expression, while the other hand rests near its hip.", mood: "clearly laying out the forecast numbers" },
    },
    {
      scene: 12,
      key: "s12_balance",
      role: "counterpoint",
      video: "bull_ep14_s12_motion.mp4",
      narration: "물론 조심할 것도 있어. 골드만삭스는 AI 투자가 본전이 되려면 연 3천억 달러 매출이 필요하다고 봐.",
      imageBrief: "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      overlays: [],
      shot: "close",
      bg: "A",
      motion: { type: "open", action: "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip; no props are held.", mood: "carefully noting the caveats" },
    },
    {
      scene: 13,
      key: "s13_insight",
      role: "insight",
      video: "bull_ep14_s13_motion.mp4",
      narration: "한 줄로 정리하면, 좋은 실적이어도 주가는 숫자보다 이익률 우려와 수요 기대 사이에서 흔들려.",
      imageBrief: card2("좋은 실적도", "우려와 기대 사이", "확신에 찬 표정으로"),
      overlays: [],
      shot: "medium",
      bg: "A",
      motion: { type: "card2", action: "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.", mood: "confidently delivering the one-line summary" },
    },
    {
      scene: 14,
      key: "s14_check",
      role: "action",
      video: "bull_ep14_s14_motion.mp4",
      narration: "확인할 건 두 가지, 삼성전자 잠정실적이 시장 전망을 넘는지랑, 이익률이 유지되는지 보면 돼.",
      imageBrief: board(["① 전망 넘나?", "② 이익률 유지?"], "빈 손으로 손가락 두 개를 세워 보이며 설명하는 자세", true),
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "board", action: "the character's free hand keeps two fingers raised and gives small emphasizing motions, with a clear, helpful expression, while the other hand rests near its hip.", mood: "clearly listing two things to check" },
    },
    {
      scene: 15,
      key: "s15_frame",
      role: "frame",
      video: "bull_ep14_s15_motion.mp4",
      narration: "실적 숫자만 쫓지 말고 우려와 기대를 나눠 봐야, 다음 신호가 읽혀. 이것만은 챙겨가.",
      imageBrief: card2("우려와 기대를", "나눠 읽어", "따뜻하고 차분한 미소로"),
      overlays: [],
      shot: "medium",
      bg: "B",
      motion: { type: "card2", action: "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.", mood: "warmly reassuring the viewer" },
    },
    {
      scene: 16,
      key: "s16_cta",
      role: "save",
      video: "bull_ep14_s16_motion.mp4",
      narration: "삼성전자 잠정실적이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      imageBrief: "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      overlays: [],
      shot: "wide",
      bg: "A",
      motion: { type: "open", action: "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed.", mood: "warmly saying goodbye and inviting comments" },
      riskDisclosure: true,
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findBullEp14Scene(key) {
  return BULL_EP14_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
