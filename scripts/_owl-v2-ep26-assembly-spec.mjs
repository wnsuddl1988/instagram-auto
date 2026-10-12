/**
 * 통합 49편(부엉 표시25, 파일 ep26) — 연말까지 금리가 바뀌는 주담대 165조: 내 대출 금리 재산정 확인법. D형(어떻게 해야 하나). 배포 10/12(월, Owner 지시 시) — Owner 지시(10/11)로 황소 24편과 순서 교체(통합 48↔49).
 *
 * 대본 v8: 17씬·612자(검사기 반드시 수정 0). v7→v8: 5번 씬 "앞으로 5년 중 가장 큰 규모래" 삭제 — 같은 기사의 전망표에 2029년 151.6~170.7조·2030년 162.7~169.9조가 있어 165조를 넘는 분기가 있기 때문(기사 내부 모순). 새 문구 "내년과 내후년 어느 분기 전망보다도 커"(2027년 최대 154.4조·2028년 최대 145조로 사실). 5번 씬 카드 "5년 중 최대" → "내년·내후년보다 큼"(이미지·Veo 클립 재생성 필요). TTS v2 126.2초(최대 씬 9.36초, 13번 씬 클립 여유 0.65초). 담당 부엉박사(시민 입장) · 레인 indicator · 영역 loans_credit · 제목 모양 question.
 *
 * 핵심 팩트(머니투데이 2026-10-07 17:56 원문): 정책모기지 제외 19개 은행 주담대 중 4분기 금리 변동 예정 잔액 165조(3분기 143.9조, +21.1조), 은행 주담대 평균 2021년 2분기 2.70% → 올해 2분기 4.26%(한국은행), 가정(전부 5년 주기·30년 원리금균등) 연 이자 부담 1조 7,212억 증가(한창민 의원실), 신규 주담대 2분기 고정 2.83%·변동 4.10%. 기사의 "향후 5년 분기별 최대"는 같은 기사 전망표와 모순이라 쓰지 않음.
 *
 * 1억 원당 월 상환액 +8.7만 원·3억 원 약 26만 원은 2.70→4.26%·30년 원리금균등 계산(기사 월 1,434억과 일치 검증). 제목의 '7%'는 기사 본문에 없어 쓰지 않음.
 * 통합 번호 49편 (최우선 규칙 33, _ai/episode-numbering-unified.md). 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const OWL_EP26_ASSEMBLY_SPEC = Object.freeze({
  "specVersion": "owl_assembly_spec_v1",
  "scriptStructureVersion": "owl_script_structure_v2",
  "episode": 26,
  "displayEpisode": 25,
  "scriptType": "D_what_to_do",
  "geumbaksaHandoffTerm": null,
  "sourceCandidate": "candidate-owl-ep26-mortgage-rate-reset-165t-2026-10-09",
  "title": "금리가 바뀌는 주담대 165조, 내 대출은?",
  "channelName": "경제번역소",
  "characterDisplayName": "부엉박사",
  "headerTitle": [
    "금리 바뀌는 주담대",
    "165조,",
    "내 대출은?"
  ],
  "hookType": "T3",
  "openingMotion": "impact",
  "imageCharacter": "owl3dv5",
  "imagePrefix": "owl_ep26",
  "sceneBackgrounds": {
    "A": {
      "label": "집 모형 전시 라운지(도입·개념·정리·마무리)",
      "image": "밝은 집 모형 전시 라운지. 부엉박사 뒤로 둥근 지붕의 작은 집 모형 여러 개(창문과 문만 있고 글자·숫자 없음)와 큼직한 열쇠 모양 조형물이 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 따뜻한 연베이지 광택 바닥. 큰 빈 벽면 없이 집 모형과 열쇠 조형물, 식물로 채운다. 연노랑·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright model house exhibition lounge",
      "videoStatics": "the small plain model houses without any letters, the large plain key-shaped sculpture, the large potted plants, and the warm light beige glossy floor"
    },
    "B": {
      "label": "둥근 다리 광장(자료·금리 변화)",
      "image": "밝은 야외 광장. 부엉박사 뒤로 높이가 서로 다른 단색 둥근 단상 여러 개와 완만하게 이어진 둥근 다리 조형물(글자·눈금 없음)이 넓게 펼쳐지고, 양옆 둥근 화분, 바닥은 연회색 돌바닥과 둥근 꽃밭. 큰 빈 벽면 없이 단상과 다리 조형물, 꽃밭으로 채운다. 은은한 연하늘·연노랑 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright outdoor plaza with plain round podiums and a round bridge sculpture",
      "videoStatics": "the plain round podiums of different heights, the round bridge sculpture without any marks, the round potted plants, and the light gray stone floor with round flower beds"
    },
    "C": {
      "label": "갈림길 정원 전시관(내 대출 확인·계산·고정금리·주의)",
      "image": "밝은 정원 전시관. 부엉박사 뒤로 두 갈래로 갈라지는 둥근 길 모양의 화단 조형물과 글자 없는 단색 이정표 기둥 두세 개가 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 매끈한 연한 민트색 광택 바닥. 큰 빈 벽면 없이 화단 조형물과 기둥, 식물로 채운다. 은은한 연민트·크림 조명, 저폴리곤 단순화. 글자·숫자·화살표·간판·화면 없음.",
      "videoStyle": "bright garden gallery with a plain forked-path flower bed sculpture",
      "videoStatics": "the forked-path flower bed sculpture, the plain signpost-like pillars without any text, the large potted plants, and the glossy light mint floor"
    }
  },
  "scenesTimeline": "s1 훅 / s2 오프닝 / s3 개념(금리 리셋) / s4 상황(금감원 자료) / s5 상황(21조 증가) / s6 2.70% / s7 4.26% / s8 핵심질문 / s9 첫째 내 대출 확인 / s10 둘째 계산 / s11 3억 예시 / s12 전체 규모 / s13 셋째 고정금리 / s14 주의 / s15 정리 / s16 확인 두 가지 / s17 저장+댓글",
  "instagramCaptionHook": "싼 금리로 집 산 사람이라면, 연말까지 금리가 바뀌는 주담대가 165조 원이라는 걸 알아야 해",
  "instagramCaptionPoints": [
    "금융감독원 자료로 보면 정책모기지를 뺀 은행 주담대 중 올해 4분기에 금리가 바뀌는 잔액이 165조 원이고, 3분기보다 21조 원 늘어 앞으로 5년 중 가장 큰 규모야",
    "은행 주담대 평균 금리는 2021년 2분기 2.70%에서 올해 2분기 한국은행 기준 4.26%로 올랐어",
    "금리가 1.56%포인트 뛰면 1억 원당 월 상환액이 약 8만 7천 원, 30년 원리금균등 3억 원이면 매달 26만 원쯤 늘어나",
    "전부 5년마다 금리가 바뀐다고 가정하면 한창민 의원실은 연 이자 부담이 1조 7천억 원 늘어난다고 계산했어",
    "올해 2분기 새로 받은 대출 평균은 고정형 2.83%, 변동형 4.10%였어",
    "👉 내 대출의 금리 재산정 날짜와 기준 금리를 먼저 확인하고, 월 상환액이 얼마나 늘지 계산해봐",
    "💬 내 대출은 금리가 언제 바뀌는지 알고 있었어? 댓글로 알려줘",
    "※ 개인별 금리·상환액은 대출 조건에 따라 달라, 평균 금리 기준 예시이고 투자·대출 권유가 아니야"
  ],
  "instagramPriorityTags": [
    "주담대",
    "금리리셋",
    "혼합형금리",
    "변동금리",
    "고정금리",
    "대출이자",
    "주택담보대출",
    "한국은행",
    "금융감독원",
    "내집마련",
    "경제뉴스",
    "부엉박사"
  ],
  "emphasisTerms": [
    "주담대",
    "165조",
    "금리",
    "부엉박사"
  ],
  "captionBoundaryExceptions": [
    {
      "left": "원이라는",
      "right": "거",
      "reason": "s1 '…165조 원이라는 / 거 알고 있었어?' — 한 줄 폭(760px)에 '165조 원이라는 거'가 안 들어가 조립기 자동 분할이 이 경계를 선택, 대안 분할은 짧은 블록(<0.6초)이 생김. 대본 변경은 TTS 재생성(유료)이 필요해 승인(2026-10-11)"
    }
  ],
  "captionWidthExceptions": [
    {
      "line": "중도상환수수료랑",
      "reason": "'중도상환수수료랑' 한 어절 8음절 768px(한도 760 대비 +8px, 휴대폰 안전폭 864 이내), s14 — 대본 문구 변경은 TTS 재생성(유료·길이 변동)이 필요해 승인(2026-10-11)"
    }
  ],
  "captionGapBridgeSec": 0.3,
  "render": {
    "width": 1080,
    "height": 1920,
    "fps": 24,
    "videoCodec": "libx264",
    "crf": 18,
    "pixFmt": "yuv420p",
    "audioCodec": "aac",
    "audioBitrate": "192k",
    "audioSampleRate": 48000,
    "audioChannels": 1
  },
  "scenes": [
    {
      "scene": 1,
      "key": "s1_hook",
      "role": "hook",
      "video": "owl_v2_ep26_s1_hook_motion.mp4",
      "narration": "싼 금리로 집 산 사람, 연말까지 금리가 바뀌는 주담대가 165조 원이라는 거 알고 있었어?",
      "imageBrief": "부엉이가 놀라고 궁금한 표정으로 '금리 바뀌는'와 '주담대 165조'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
      "overlays": [],
      "shot": "medium",
      "bg": "A",
      "motion": {
        "type": "card2",
        "action": "wide-eyed and curious, eyebrows raised, as if revealing a surprising turn; only the face and body move while the wings holding the card stay still.",
        "mood": "posing a surprising question to the viewer"
      }
    },
    {
      "scene": 2,
      "key": "s2_opening",
      "role": "opening",
      "video": "owl_v2_ep26_s2_opening_motion.mp4",
      "narration": "안녕, 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야.",
      "imageBrief": "부엉이가 정면을 보며 한쪽 날개를 살짝 들어 인사하고 다른 날개는 자연스럽게 내린 채 담담하게 미소 짓는 포즈, 소품 없음.",
      "overlays": [],
      "shot": "wide",
      "bg": "A",
      "motion": {
        "type": "open",
        "action": "the character raises one wing slightly in a friendly greeting while the other wing hangs naturally, smiling calmly and warmly at the viewer; no props are held.",
        "mood": "warmly greeting the viewer"
      }
    },
    {
      "scene": 3,
      "key": "s3_concept",
      "role": "fact",
      "video": "owl_v2_ep26_s3_concept_motion.mp4",
      "narration": "금리 리셋은 고정금리 기간이 끝나고, 시장금리에 맞춰 금리가 새로 정해지는 걸 말해.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '금리 리셋이란'와 '고정 끝, 새 금리'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "A",
      "motion": {
        "type": "card2",
        "action": "clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 4,
      "key": "s4_situation_source",
      "role": "fact",
      "video": "owl_v2_ep26_s4_situation_source_motion.mp4",
      "narration": "금융감독원 자료로 보면, 정부 정책대출을 뺀 은행 주담대 중 4분기에 금리가 바뀌는 잔액이 바로 그 숫자야.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '금감원 자료'와 '4분기 금리 변경'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.",
        "mood": "seriously reporting the facts"
      }
    },
    {
      "scene": 5,
      "key": "s5_situation_size",
      "role": "fact",
      "video": "owl_v2_ep26_s5_situation_size_motion.mp4",
      "narration": "3분기보다 21조 원 늘었고, 내년과 내후년 어느 분기 전망보다도 커.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '3분기보다 +21조'와 '내년·내후년보다 큼'이 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.",
        "mood": "seriously reporting the facts"
      }
    },
    {
      "scene": 6,
      "key": "s6_situation_before",
      "role": "fact",
      "video": "owl_v2_ep26_s6_situation_before_motion.mp4",
      "narration": "은행 주담대 평균 금리는 2021년 2분기에 2.70%였어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '2021년 2분기'와 '평균 2.70%'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 7,
      "key": "s7_situation_now",
      "role": "fact",
      "video": "owl_v2_ep26_s7_situation_now_motion.mp4",
      "narration": "한국은행 기준 올해 같은 분기엔 4.26%로 올랐지.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '올해 2분기'와 '평균 4.26%'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.",
        "mood": "seriously reporting the facts"
      }
    },
    {
      "scene": 8,
      "key": "s8_core_q",
      "role": "core_question",
      "video": "owl_v2_ep26_s8_core_q_motion.mp4",
      "narration": "그럼 나는 어떻게 해야 할까? 답부터 말하면, 내 금리가 언제 어떻게 바뀌는지부터 확인하는 거야.",
      "imageBrief": "부엉이가 갸웃하다 확신에 찬 표정으로 한쪽 날개를 들어 손짓하며 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      "overlays": [],
      "shot": "wide",
      "bg": "B",
      "motion": {
        "type": "open",
        "action": "the character's expression starts curious with a slight head tilt and turns confident while one wing lifts in an explaining gesture and the other hangs naturally; no props are held.",
        "mood": "confidently giving the key answer"
      }
    },
    {
      "scene": 9,
      "key": "s9_point1_check",
      "role": "evidence",
      "video": "owl_v2_ep26_s9_point1_check_motion.mp4",
      "narration": "첫째, 내 대출 조건을 봐. 쉽게 풀면, 약정서나 은행 앱에서 금리 재산정 날짜와 기준 금리를 찾으면 돼.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '첫째 내 대출'와 '재산정 날짜 확인'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 10,
      "key": "s10_point2_calc",
      "role": "evidence",
      "video": "owl_v2_ep26_s10_point2_calc_motion.mp4",
      "narration": "둘째, 계산해 봐. 쉽게 풀면, 금리가 1.56%포인트 뛰면 1억 원당 월 상환액이 약 8만 7천 원 늘어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '금리 +1.56%p'와 '1억당 월 +8.7만'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 11,
      "key": "s11_point2_example",
      "role": "evidence",
      "video": "owl_v2_ep26_s11_point2_example_motion.mp4",
      "narration": "30년 동안 원금과 이자를 나눠 갚는 3억 원이라면, 매달 26만 원쯤 더 내는 셈이야.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '3억 · 30년이면'와 '월 약 26만 원 ↑'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.",
        "mood": "seriously reporting the facts"
      }
    },
    {
      "scene": 12,
      "key": "s12_point2_scale",
      "role": "evidence",
      "video": "owl_v2_ep26_s12_point2_scale_motion.mp4",
      "narration": "전부 5년마다 금리가 바뀐다고 가정하면, 한창민 의원실은 연 이자 부담이 1조 7천억 원 늘어난다고 계산했어.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '전부 5년 주기면'와 '연 1.7조 증가'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "serious and clear with slight nods, as if reporting these facts; only the face and body move while the wings holding the card stay still.",
        "mood": "seriously reporting the facts"
      }
    },
    {
      "scene": 13,
      "key": "s13_point3_fixed",
      "role": "evidence",
      "video": "owl_v2_ep26_s13_point3_fixed_motion.mp4",
      "narration": "셋째, 고정금리를 물어봐. 쉽게 풀면, 새로 받는 대출 평균은 고정형 2.83%, 변동형 4.10%였어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '고정형 2.83%'와 '변동형 4.10%'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "clear and friendly with slight nods, as if explaining this point; only the face and body move while the wings holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 14,
      "key": "s14_caution",
      "role": "condition",
      "video": "owl_v2_ep26_s14_caution_motion.mp4",
      "narration": "그렇다고 무작정 갈아타면 안 돼. 갈아탈 땐 중도상환수수료랑 새 금리를 같이 따져야 하거든.",
      "imageBrief": "부엉이가 신중하고 단호한 표정으로 한쪽 날개를 들어 잠깐 멈추라는 듯 손짓하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      "overlays": [],
      "shot": "wide",
      "bg": "C",
      "motion": {
        "type": "open",
        "action": "the character's expression is careful and firm, eyebrows slightly furrowed, while one wing lifts in a hold-on gesture as if warning the viewer and the other hangs naturally; no props are held.",
        "mood": "firmly cautioning the viewer"
      }
    },
    {
      "scene": 15,
      "key": "s15_summary",
      "role": "action",
      "video": "owl_v2_ep26_s15_summary_motion.mp4",
      "narration": "콕 집어 정리하면, 금리 리셋은 남 얘기가 아니라 내 대출의 날짜 문제야. 지금 먼저 확인할 건 두 가지야.",
      "imageBrief": "부엉이가 확신에 찬 표정으로 '금리 리셋은'와 '내 대출의 날짜'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "A",
      "motion": {
        "type": "card2",
        "action": "confident and knowing with slight nods; only the face and body move while the wings holding the card stay still.",
        "mood": "confidently delivering the key point"
      }
    },
    {
      "scene": 16,
      "key": "s16_check_two",
      "role": "action",
      "video": "owl_v2_ep26_s16_check_two_motion.mp4",
      "narration": "하나는 내 금리가 바뀌는 날짜와 기준 금리, 다른 하나는 월 상환액이 얼마나 늘지 계산해 보는 거지.",
      "imageBrief": "부엉이가 한쪽 날개를 들어 두 가지를 하나씩 짚어 가듯 또렷하고 친근하게 설명하는 자세, 다른 날개는 자연스럽게 내림, 소품 없음.",
      "overlays": [],
      "shot": "wide",
      "bg": "A",
      "motion": {
        "type": "open",
        "action": "the character lifts one wing and ticks off two points one after the other with a clear, friendly explanatory expression while the other wing hangs naturally; no props are held.",
        "mood": "clearly pointing out the two things to check"
      }
    },
    {
      "scene": 17,
      "key": "s17_save",
      "role": "save",
      "video": "owl_v2_ep26_s17_save_motion.mp4",
      "narration": "이 두 가지는 저장해 두고, 은행 안내를 받으면 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
      "imageBrief": "부엉이가 밝은 미소로 한쪽 날개를 가볍게 흔들고 다른 날개는 자연스럽게 내린 마무리 포즈, 소품 없이 빈 날개.",
      "overlays": [],
      "shot": "wide",
      "bg": "A",
      "motion": {
        "type": "open",
        "action": "the character smiles brightly and waves one wing lightly in a friendly goodbye while the other wing hangs naturally relaxed; no props are held.",
        "mood": "warmly saying goodbye and inviting comments"
      }
    }
  ]
});

/** 장면 키로 스펙을 찾는다. */
export function findOWLEP26Scene(key) {
  return OWL_EP26_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
