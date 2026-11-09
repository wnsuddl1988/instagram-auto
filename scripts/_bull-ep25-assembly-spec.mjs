/**
 * 통합 51편(황소 25편) — 10월 금리 발표 3개(워시 IMF 대담 16일·한은 금통위 22일·FOMC 29일 새벽): 결과보다 말투. 레인 event_countdown · 유형 schedule · 영역 macro(반도체 아님, 최근 5편 반도체 4/5 경고는 표시만). 최후 게시 10/15(대담 한국 시간 10/16 12:30경), 배포 10/14(수) 권장.
 *
 * 대본 v4: 16씬·585자(검사기 반드시 수정 0, 새 독자 읽기 점검 통과). TTS 119.48초(최대 씬 8.40초) + CTA 8.3초.
 *
 * 핵심 팩트: 연준 일정 페이지 워시 IMF 대담 미국 동부 10/15 23:30, 한은 금통위 10/22(프로젝트 캘린더 [확정]·bok.or.kr), FOMC 10/27~28·10월은 SEP(점도표) 없음(연준 캘린더), 9/16 3.75~4.00% 12-0(연준 결정문), 한은 3.00%·우리금융경영연구소 '매파적 동결' 전망(국민일보 10/9), 9월 의사록 대부분의 위원이 추가 인상 적절 가능 평가(연준 의사록).
 *
 * 미사용: PCE 수치(출처별 상이). 게시일이 바뀌면 훅 '이틀 뒤' 수정. 결과 시각 '한국 시간 29일 새벽 3시'는 성명 14:00 EDT 환산.
 * 통합 번호 51편 (최우선 규칙 33, _ai/episode-numbering-unified.md). 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const BULL_EP25_ASSEMBLY_SPEC = Object.freeze({
  "specVersion": "bull_assembly_spec_v1",
  "scriptStructureVersion": "bull_script_structure_v3",
  "endingStructureVersion": "bull_ending_5beat_2026_09_29",
  "episode": 25,
  "sourceCandidate": "candidate-bull-ep25-oct-rate-calendar-3-events-2026-10-09",
  "title": "이번 달 금리 발표 3개, 결과보다 말투를 읽어라",
  "channelName": "경제번역소",
  "characterDisplayName": "황소특보",
  "headerTitle": [
    "이번 달 금리 발표",
    "3개, 결과보다",
    "말투를 읽어라"
  ],
  "hookType": "T3",
  "openingMotion": "pushin",
  "imageCharacter": "bull3dv1",
  "imagePrefix": "bull_ep25",
  "sceneBackgrounds": {
    "A": {
      "label": "종 전시 홀(도입·핵심질문·정리·마무리)",
      "image": "밝은 전시 홀. 황소특보 뒤로 높이가 다른 큼직한 단색 종 조형물 세 개가 나란히 서 있고(글자·숫자·문양 없음), 양옆에 큼직한 화분, 매끈한 연한 베이지 광택 바닥. 큰 빈 벽면 없이 종 조형물과 식물로 채우고 사람은 없음. 화이트와 연한 금색 조명, 저폴리곤 단순화. 글자·숫자·눈금·로고·화면 없음.",
      "videoStyle": "bright exhibition hall with three large plain bell sculptures without any marks or text",
      "videoStatics": "the three large plain bell sculptures, the large potted plants, and the glossy light beige floor"
    },
    "B": {
      "label": "확성기 무대 홀(현재 금리·세 일정)",
      "image": "밝은 무대 홀. 황소특보 뒤로 낮은 단색 둥근 무대와 큼직한 확성기 모양 조형물 여러 개(글자·숫자 없음)가 놓여 있고, 양옆에 큼직한 화분, 바닥은 따뜻한 연회색 광택 바닥. 큰 빈 벽면 없이 무대와 확성기 조형물, 식물로 채우고 사람은 없음. 따뜻한 햇살 조명에 골드 포인트, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      "videoStyle": "bright stage hall with a low plain round stage and large plain megaphone-shaped sculptures",
      "videoStatics": "the low plain round stage, the large plain megaphone-shaped sculptures without any text, the large potted plants, and the warm light gray glossy floor"
    },
    "C": {
      "label": "바람개비 정원(말투·의사록·점도표)",
      "image": "밝은 정원 라운지. 황소특보 뒤로 큼직한 단색 바람개비 조형물 여러 개와 글자 없는 단색 풍향계 기둥이 둥근 화단 사이에 서 있고, 양옆에 큼직한 화분, 바닥은 연한 하늘색 광택 바닥. 큰 빈 벽면 없이 바람개비 조형물과 화단, 식물로 채우고 사람은 없음. 시원한 연하늘과 크림 조명, 저폴리곤 단순화. 글자·숫자·간판·로고·화면 없음.",
      "videoStyle": "bright garden lounge with large plain pinwheel sculptures and plain weather-vane pillars",
      "videoStatics": "the large plain pinwheel sculptures, the plain weather-vane pillars without any text, the round flower beds, the large potted plants, and the glossy light sky-blue floor"
    }
  },
  "scenesTimeline": "s1 훅 / s2 오프닝(압축형) / s3 현재 금리 / s4 워시 IMF 대담 / s5 금통위 / s6 FOMC / s7 핵심질문 / s8 근거1 매파적 동결 / s9 근거1 이유 / s10 근거2 의사록 / s11 점도표 없음 / s12 균형 / s13 통찰 / s14 체크 / s15 프레임 / s16 예고+댓글",
  "instagramCaptionHook": "이번 달 금리 발표가 세 번 몰렸는데, 첫 번째가 이틀 뒤라는 거 놓친 건 아니지?",
  "instagramCaptionPoints": [
    "한국은행 기준금리는 3.00%이고 미국 연준은 9월에 올려 3.75~4.00%야",
    "첫 번째는 한국 시간 16일 낮 12시 30분쯤 워시 연준 의장의 IMF 대담, 두 번째는 22일 한국은행 금융통화위원회, 세 번째는 27~28일 미국 FOMC로 결과는 한국 시간 29일 새벽 3시쯤 나와",
    "우리금융경영연구소는 22일 금통위를 3.00% 동결을 유지하되 추가 인상 여지를 남기는 '매파적 동결'로 예상해, 한은이 7월과 8월에 두 번 올린 효과를 지켜본다는 뜻이야",
    "연준 9월 회의 의사록에서 대부분의 위원이 추가 인상이 적절할 수 있다고 평가했고, 10월 FOMC는 점도표가 나오지 않아 의장 발언과 기자회견 문구가 신호가 돼",
    "👉 한은 문구에 추가 인상 여지가 있는지, FOMC 기자회견에서 인상 가능성을 어떻게 말하는지 확인해봐",
    "💬 이번 달 금리 이벤트 중 가장 신경 쓰이는 건 뭐야? 댓글로 알려줘",
    "※ 일정은 바뀔 수 있고 특정 종목 추천이나 투자 권유가 아니야, 발언 내용은 아직 알 수 없어"
  ],
  "instagramPriorityTags": [
    "금리",
    "FOMC",
    "한국은행",
    "금통위",
    "연준",
    "워시",
    "매파적동결",
    "점도표",
    "IMF",
    "주식공부",
    "경제뉴스",
    "황소특보"
  ],
  "emphasisTerms": [
    "금리",
    "말투",
    "매파적 동결",
    "황소특보"
  ],
  "captionBoundaryExceptions": [],
  "captionWidthExceptions": [
    {
      "line": "금융통화위원회야",
      "reason": "'금융통화위원회야' 한 어절 8음절 768px(한도 760 대비 +8px, 휴대폰 안전폭 864 이내), s5 — 대본 문구 변경은 TTS 재생성(유료·길이 변동)이 필요해 승인(2026-10-11). '우리금융경영연구소는'(960px)은 안전폭을 넘어 표시용 띄어쓰기('우리금융 경영연구소는', TTS 스크립트 captionDisplayText)로 해결"
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
      "video": "bull_ep25_s1_motion.mp4",
      "narration": "다들, 이번 달 금리 발표 세 개가 몰렸는데, 첫 번째가 이틀 뒤인 거 놓친 건 아니지?",
      "imageBrief": "황소가 놀라고 궁금한 표정으로 '금리 발표 3개'와 '첫째가 이틀 뒤'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "A",
      "motion": {
        "type": "card2",
        "action": "the character's expression is wide-eyed and curious, eyebrows raised, as if revealing a surprising turn; only the face and body move while the hands holding the card stay still.",
        "mood": "posing a surprising question to the viewer"
      }
    },
    {
      "scene": 2,
      "key": "s2_opening",
      "role": "opening",
      "video": "bull_ep25_s2_motion.mp4",
      "narration": "안녕, 투자 소식 정리해주는 황소특보야. 핵심만 짚어줄게.",
      "imageBrief": "황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음.",
      "overlays": [],
      "shot": "wide",
      "bg": "A",
      "motion": {
        "type": "open",
        "action": "the character keeps one hand raised with the index finger pointing upward in a confident, friendly gesture while the other hand rests on its hip, smiling brightly and warmly at the viewer.",
        "mood": "warmly greeting the viewer"
      },
      "riskDisclosure": true
    },
    {
      "scene": 3,
      "key": "s3_situation_numbers",
      "role": "background",
      "video": "bull_ep25_s3_motion.mp4",
      "narration": "숫자부터 보자. 한국은행 기준금리는 3.00%, 미국 연준은 9월에 올려 3.75~4.00%야.",
      "imageBrief": "황소가 진지하고 또렷한 표정으로 '한은 3.00%'와 '연준 3.75~4.00%'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "the character's expression is serious and clear with slight nods, as if reporting these facts; only the face and body move while the hands holding the card stay still.",
        "mood": "seriously reporting the facts"
      }
    },
    {
      "scene": 4,
      "key": "s4_event1_warsh",
      "role": "background",
      "video": "bull_ep25_s4_motion.mp4",
      "narration": "첫 번째는 한국 시간 16일 낮 12시 30분쯤, 워시 연준 의장의 IMF 대담이야. 금리 단서가 나올 수 있어.",
      "imageBrief": "황소가 또렷하고 친근한 표정으로 '① 워시 IMF 대담'와 '16일 낮 12:30경'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 5,
      "key": "s5_event2_bok",
      "role": "background",
      "video": "bull_ep25_s5_motion.mp4",
      "narration": "두 번째는 22일 한국은행 금융통화위원회야. 우리금융경영연구소는 '매파적 동결'을 예상해.",
      "imageBrief": "황소가 또렷하고 친근한 표정으로 '② 한은 금통위'와 '22일'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 6,
      "key": "s6_event3_fomc",
      "role": "background",
      "video": "bull_ep25_s6_motion.mp4",
      "narration": "세 번째는 미국 FOMC로, 27일부터 이틀 회의하고 결과는 한국 시간 29일 새벽 3시에 나와.",
      "imageBrief": "황소가 또렷하고 친근한 표정으로 '③ 미국 FOMC'와 '29일 새벽 3시'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 7,
      "key": "s7_core_q",
      "role": "twist",
      "video": "bull_ep25_s7_motion.mp4",
      "narration": "그럼 금리를 안 올리면 마음 놓아도 될까? 한마디로 올리느냐보다 뭐라고 말하느냐를 봐야 해.",
      "imageBrief": "황소가 확신에 찬 표정으로 '안 올려도'와 '말투를 봐야'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "A",
      "motion": {
        "type": "card2",
        "action": "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.",
        "mood": "confidently delivering the key point"
      }
    },
    {
      "scene": 8,
      "key": "s8_evidence1_concept",
      "role": "evidence",
      "video": "bull_ep25_s8_motion.mp4",
      "narration": "첫째, 매파적 동결부터 알아야 해. 쉽게 풀면, 이번엔 안 올리지만 필요하면 더 올릴 수 있다고 말하는 동결이야.",
      "imageBrief": "황소가 또렷하고 친근한 표정으로 '매파적 동결'와 '올릴 여지는 남김'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 9,
      "key": "s9_evidence1_reason",
      "role": "evidence",
      "video": "bull_ep25_s9_motion.mp4",
      "narration": "이유는 한은이 7월과 8월에 두 번 올린 효과를 지켜봐야 해서래.",
      "imageBrief": "황소가 진지하고 또렷한 표정으로 '한은 7·8월'와 '두 번 인상 관찰'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "the character's expression is serious and clear with slight nods, as if reporting these facts; only the face and body move while the hands holding the card stay still.",
        "mood": "seriously reporting the facts"
      }
    },
    {
      "scene": 10,
      "key": "s10_evidence2_us",
      "role": "evidence",
      "video": "bull_ep25_s10_motion.mp4",
      "narration": "둘째, 미국 쪽 변수야. 9월 회의 의사록에서 대부분의 위원이 추가 인상이 적절할 수 있다고 봤어.",
      "imageBrief": "황소가 진지하고 또렷한 표정으로 '9월 의사록'와 '추가 인상 가능성'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "the character's expression is serious and clear with slight nods, as if reporting these facts; only the face and body move while the hands holding the card stay still.",
        "mood": "seriously reporting the facts"
      }
    },
    {
      "scene": 11,
      "key": "s11_evidence2_dotplot",
      "role": "evidence",
      "video": "bull_ep25_s11_motion.mp4",
      "narration": "그런데 10월 FOMC는 점도표가 없는 회의야. 그래서 의장 발언과 기자회견 문구가 인상 신호가 돼.",
      "imageBrief": "황소가 또렷하고 친근한 표정으로 '10월 FOMC'와 '점도표 없음'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 12,
      "key": "s12_balance",
      "role": "counterpoint",
      "video": "bull_ep25_s12_motion.mp4",
      "narration": "물론 조심할 것도 있어. 일정은 바뀔 수 있고, 워시 의장이 무슨 말을 할지는 아직 몰라.",
      "imageBrief": "황소가 신중하고 걱정스러운 표정으로 한 손을 턱 근처에 대고 다른 손은 허리에 얹은 포즈, 소품 없음.",
      "overlays": [],
      "shot": "close",
      "bg": "A",
      "motion": {
        "type": "open",
        "action": "the character rests one hand near its chin with a careful, thoughtful expression and slight head tilts while the other hand rests on its hip.",
        "mood": "carefully noting a counter-signal"
      }
    },
    {
      "scene": 13,
      "key": "s13_insight",
      "role": "insight",
      "video": "bull_ep25_s13_motion.mp4",
      "narration": "한 줄로 정리하면, 이번 달 금리는 결과보다 말투를 읽는 달이야. 말이 강해지면 외국인 자금이 먼저 반응할 수 있어.",
      "imageBrief": "황소가 확신에 찬 표정으로 '이번 달 금리는'와 '결과보다 말투'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "A",
      "motion": {
        "type": "card2",
        "action": "the character's expression is confident and knowing with slight nods; only the face and body move while the hands holding the card stay still.",
        "mood": "confidently delivering the key point"
      }
    },
    {
      "scene": 14,
      "key": "s14_check",
      "role": "action",
      "video": "bull_ep25_s14_motion.mp4",
      "narration": "확인할 건 두 가지, 한은 문구에 추가 인상 여지가 있는지랑 FOMC 기자회견의 인상 언급이야.",
      "imageBrief": "황소가 또렷하고 친근한 표정으로 '① 한은 문구'와 '② FOMC 인상 언급'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
      "overlays": [],
      "shot": "medium",
      "bg": "A",
      "motion": {
        "type": "card2",
        "action": "the character's expression is clear and friendly with slight nods, as if explaining this point; only the face and body move while the hands holding the card stay still.",
        "mood": "clearly explaining this point"
      }
    },
    {
      "scene": 15,
      "key": "s15_frame",
      "role": "frame",
      "video": "bull_ep25_s15_motion.mp4",
      "narration": "결과만 쫓지 말고 말투를 읽어야 다음 신호가 읽혀. 이것만은 챙겨가.",
      "imageBrief": "황소가 따뜻하고 차분한 미소로 '결과만 쫓지 말고'와 '말투를 읽어라'가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
      "overlays": [],
      "shot": "medium",
      "bg": "A",
      "motion": {
        "type": "card2",
        "action": "the character's expression is warm and calm with a gentle smile; only the face and body move while the hands holding the card stay still.",
        "mood": "warmly reassuring the viewer"
      }
    },
    {
      "scene": 16,
      "key": "s16_cta",
      "role": "save",
      "video": "bull_ep25_s16_motion.mp4",
      "narration": "대담 내용이 나오면 황소특보가 제일 먼저 들고 올게. 짚어줬으면 하는 이슈는 댓글로 남겨줘.",
      "imageBrief": "황소가 밝은 미소로 한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손.",
      "overlays": [],
      "shot": "wide",
      "bg": "A",
      "motion": {
        "type": "open",
        "action": "the character smiles brightly and waves one hand lightly in a friendly goodbye while the other hand hangs naturally relaxed.",
        "mood": "warmly saying goodbye and inviting comments"
      },
      "riskDisclosure": true
    }
  ]
});

/** 장면 키로 스펙을 찾는다. */
export function findBULLEP25Scene(key) {
  return BULL_EP25_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
