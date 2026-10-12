/**
 * 통합 52편(부엉 표시27, 파일 ep28) — 금융회사에 잠자는 휴면·장기미거래 금융자산 15.7조: 내 몫 조회법 3곳. D형. 배포 10/15(목). 레인 money_calc(3/5 경고, 표시만) · 영역 savings_deposit.
 *
 * 대본 v6: 17씬·564자(검사기 반드시 수정 0). 생성 전에 2027년 공개 씬을 빼고 일부 문장을 줄임(TTS 길이). TTS 121.32초(최대 씬 8.91초). 새 독자 읽기 점검은 줄이기 전 v5 기준 통과.
 *
 * 핵심 팩트(SBS Biz 2026-10-07, 금융위·금감원 9/28 발표): 2025년 말 기준 15.7조(휴면 1.5조·장기미거래 14.2조), 예·적금 7.8조·보험금 5.8조·증권 1.9조·신탁 약 1천억, 소멸시효 지나도 본인 확인 시 돌려받음, 조회처 어카운트인포·파인·서민금융진흥원 휴면예금 찾기, 부모님 명의는 부모님 본인 인증, 사칭 링크 주의.
 *
 * 미확인: 금융위 보도자료 원문, 각 조회처 기능 분담(SBS 요약 기준). 영상에서 뺀 것: 2027년부터 환급액·잔액 공개.
 * 통합 번호 52편 (최우선 규칙 33, _ai/episode-numbering-unified.md). 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const OWL_EP28_ASSEMBLY_SPEC = Object.freeze({
  "specVersion": "owl_assembly_spec_v1",
  "scriptStructureVersion": "owl_script_structure_v2",
  "episode": 28,
  "displayEpisode": 27,
  "scriptType": "D_what_to_do",
  "geumbaksaHandoffTerm": null,
  "sourceCandidate": "candidate-owl-ep28-sleeping-financial-assets-15-7t-2026-10-09",
  "title": "잠자는 돈 15.7조, 내 몫 찾는 법",
  "channelName": "경제번역소",
  "characterDisplayName": "부엉박사",
  "headerTitle": [
    "잠자는 돈 15.7조,",
    "내 몫",
    "찾는 법"
  ],
  "hookType": "T3",
  "openingMotion": "impact",
  "imageCharacter": "owl3dv5",
  "imagePrefix": "owl_ep28",
  "sceneBackgrounds": {
    "A": {
      "label": "달빛 정원 라운지(도입·개념·정리·마무리)",
      "image": "밝은 달빛 정원 라운지. 부엉박사 뒤로 큼직한 단색 초승달과 별 모양 조형물 여러 개, 둥근 쿠션 침상 두세 개(글자·숫자 없음)가 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 연한 남보라 광택 바닥. 큰 빈 벽면 없이 달·별 조형물과 쿠션 침상, 식물로 채운다. 은은한 연보라·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright moonlit garden lounge with plain crescent moon and star sculptures and round cushion beds",
      "videoStatics": "the large plain crescent moon and star sculptures, the round cushion beds, the large potted plants, and the glossy light indigo floor"
    },
    "B": {
      "label": "서랍장 전시관(자료·종류별·소멸시효)",
      "image": "밝고 깨끗한 전시관. 부엉박사 뒤로 큼직한 단색 서랍장 조형물 여러 개(손잡이만 있고 글자·숫자 없음)가 놓여 있고 서랍 몇 개는 살짝 열려 있으며, 양옆 큼직한 화분, 바닥은 연한 크림색 광택 바닥. 큰 빈 벽면 없이 서랍장 조형물과 식물로 채운다. 따뜻한 햇살 조명, 저폴리곤 단순화. 글자·숫자·라벨·간판·화면 없음.",
      "videoStyle": "bright clean gallery with large plain chest-of-drawers sculptures with a few drawers slightly open",
      "videoStatics": "the large plain chest-of-drawers sculptures with only handles and no labels, the large potted plants, and the light cream glossy floor"
    },
    "C": {
      "label": "돋보기 탐색 홀(조회 방법·가족·주의)",
      "image": "밝은 탐색 홀. 부엉박사 뒤로 큼직한 단색 돋보기 조형물 여러 개와 둥근 렌즈 모양 기둥(글자·숫자 없음)이 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 연한 민트색 광택 바닥. 큰 빈 벽면 없이 돋보기 조형물과 렌즈 기둥, 식물로 채운다. 은은한 연민트·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright search hall with large plain magnifying glass sculptures and round lens-shaped pillars",
      "videoStatics": "the large plain magnifying glass sculptures, the round lens-shaped pillars without any marks, the large potted plants, and the glossy light mint floor"
    }
  },
  "scenesTimeline": "s1 훅 / s2 오프닝 / s3 개념 / s4 휴면·장기미거래 / s5 발표(금융위·금감원) / s6 휴면 1.5조·장기미거래 14.2조 / s7 종류별 / s8 소멸시효 / s9 핵심질문 / s10 첫째 어카운트인포 / s11 둘째 파인 / s12 서금원 지급 신청 / s13 셋째 가족 / s14 주의(사칭) / s15 정리 / s16 확인 두 가지 / s17 저장+댓글",
  "instagramCaptionHook": "오래 안 쓴 통장이 있으면, 잠자는 돈 15조 7천억 원 중 내 몫을 돌려받을 수 있다는 걸 알아야 해",
  "instagramCaptionPoints": [
    "금융위원회와 금융감독원이 9월 28일 발표한 지난해 말 기준으로 휴면은 1조 5천억 원, 3년 넘게 거래가 없는 장기미거래는 14조 2천억 원이야",
    "종류별로는 예·적금이 7조 8천억 원으로 가장 많고 보험금이 5조 8천억 원이야",
    "소멸시효는 돈을 청구할 수 있는 기간이 끝났다는 뜻이고, 그래도 돈은 사라지지 않아서 본인 것으로 확인되면 돌려받을 수 있어",
    "금융결제원 어카운트인포는 은행·증권·보험 계좌를 한 번에 찾아주고, 금융감독원 금융소비자 포털 파인에서 휴면예금과 보험금을 조회할 수 있어, 서민금융진흥원 휴면예금 찾기에서는 지급 신청까지 돼",
    "부모님 명의 계좌도 조회되는데 부모님이 직접 본인 인증을 해야 해",
    "👉 어카운트인포로 내 계좌를 한 번에 훑고, 파인에서 휴면예금과 보험금을 확인해봐",
    "💬 잊고 있던 통장이나 보험금을 찾은 적 있어? 댓글로 알려줘",
    "※ 문자나 메신저로 온 링크는 누르지 말고 조회는 공식 사이트에서만 해, 비밀번호나 수수료를 요구하면 사칭이야"
  ],
  "instagramPriorityTags": [
    "휴면금융자산",
    "잠자는돈",
    "장기미거래",
    "어카운트인포",
    "파인",
    "휴면예금",
    "숨은보험금",
    "금융감독원",
    "금융위원회",
    "재테크",
    "경제뉴스",
    "부엉박사"
  ],
  "emphasisTerms": [
    "잠자는 돈",
    "15조 7천억",
    "휴면",
    "부엉박사"
  ],
  "captionBoundaryExceptions": [
    {
      "left": "2천억",
      "right": "원이야",
      "reason": "s6 '14조 2천억 / 원이야' — 한 줄 폭(760px)에 '14조 2천억 원이야'가 안 들어가 조립기 자동 분할이 이 경계를 선택. 대본 변경은 TTS 재생성(유료)이 필요해 승인(2026-10-11)"
    }
  ],
  "captionWidthExceptions": [
    {
      "line": "은행·증권·보험",
      "reason": "'은행·증권·보험' 한 어절 768px(한도 760 대비 +8px, 휴대폰 안전폭 864 이내), s10 — 대본 문구 변경은 TTS 재생성(유료·길이 변동)이 필요해 승인(2026-10-11)"
    }
  ],
  "captionDwellExceptions": [
    {
      "sceneNumber": 10,
      "maxDwellSec": 7.4,
      "reason": "s10 '쉽게 풀면, 금융결제원 어카운트인포는 은행·증권·보험 계좌를 한 번에 찾아주는 창구야' 한 문장(8어절)이 재분할 전 블록 체류 7.30초(한도 6.8 대비 +0.5초). 실제 화면 자막은 3개 이벤트로 나뉘어 각 2.5초 이하 — TTS 재생성 회피(2026-10-11)"
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
      "video": "owl_v2_ep28_s1_hook_motion.mp4",
      "narration": "오래 안 쓴 통장 있으면, 잠자는 돈 15조 7천억 원 중 내 몫을 돌려받을 수 있다는 거 알고 있었어?",
      "imageBrief": "부엉이가 놀라고 궁금한 표정으로 '잠자는 금융자산'와 '15.7조 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep28_s2_opening_motion.mp4",
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
      "video": "owl_v2_ep28_s3_concept_motion.mp4",
      "narration": "잠자는 금융자산은 오래 안 쓴 내 예금, 보험금, 증권이야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '잠자는 금융자산'와 '안 쓴 예금·보험금'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s4_concept_terms",
      "role": "fact",
      "video": "owl_v2_ep28_s4_concept_terms_motion.mp4",
      "narration": "소멸시효가 지난 건 휴면, 3년 넘게 거래가 없는 건 장기미거래라고 불러.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '휴면은 시효 지남'와 '장기미거래 3년 넘음'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "scene": 5,
      "key": "s5_situation_source",
      "role": "fact",
      "video": "owl_v2_ep28_s5_situation_source_motion.mp4",
      "narration": "금융위원회와 금융감독원이 9월 28일, 지난해 말 기준 자료를 발표했어.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '금융위·금감원'와 '9월 28일 발표'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "key": "s6_situation_split",
      "role": "fact",
      "video": "owl_v2_ep28_s6_situation_split_motion.mp4",
      "narration": "휴면은 1조 5천억 원, 장기미거래는 14조 2천억 원이야.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '휴면 1.5조'와 '장기미거래 14.2조'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "scene": 7,
      "key": "s7_situation_types",
      "role": "fact",
      "video": "owl_v2_ep28_s7_situation_types_motion.mp4",
      "narration": "종류별로는 예·적금이 7조 8천억 원으로 가장 많고, 보험금이 5조 8천억 원이야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '예·적금 7.8조'와 '보험금 5.8조'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "scene": 8,
      "key": "s8_situation_expiry",
      "role": "fact",
      "video": "owl_v2_ep28_s8_situation_expiry_motion.mp4",
      "narration": "소멸시효는 청구 기간이 끝났다는 뜻이야. 그래도 돈은 안 사라져서 본인 것이면 돌려받을 수 있어.",
      "imageBrief": "부엉이가 또렷하고 반가운 표정으로 '소멸시효 지나도'와 '돈은 안 사라진다'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "B",
      "motion": {
        "type": "card2",
        "action": "clear and pleasantly surprised with slight nods, as if revealing the amount; only the face and body move while the wings holding the card stay still.",
        "mood": "clearly revealing the amount"
      }
    },
    {
      "scene": 9,
      "key": "s9_core_q",
      "role": "core_question",
      "video": "owl_v2_ep28_s9_core_q_motion.mp4",
      "narration": "그럼 나는 어떻게 해야 할까? 답부터 말하면, 본인 인증으로 직접 조회하는 거야.",
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
      "scene": 10,
      "key": "s10_point1",
      "role": "evidence",
      "video": "owl_v2_ep28_s10_point1_motion.mp4",
      "narration": "첫째, 계좌부터 봐. 쉽게 풀면, 금융결제원 어카운트인포는 은행·증권·보험 계좌를 한 번에 찾아주는 창구야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '첫째 어카운트인포'와 '계좌 한 번에 조회'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s11_point2",
      "role": "evidence",
      "video": "owl_v2_ep28_s11_point2_motion.mp4",
      "narration": "둘째, 휴면예금과 보험금을 봐. 쉽게 풀면, 금융감독원 금융소비자 포털 파인에서 조회할 수 있어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '둘째 파인'와 '휴면예금·보험금'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "scene": 12,
      "key": "s12_point2_apply",
      "role": "evidence",
      "video": "owl_v2_ep28_s12_point2_apply_motion.mp4",
      "narration": "서민금융진흥원 휴면예금 찾기에서는 지급 신청까지 돼.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '휴면예금 찾기'와 '지급 신청까지'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "scene": 13,
      "key": "s13_point3",
      "role": "evidence",
      "video": "owl_v2_ep28_s13_point3_motion.mp4",
      "narration": "셋째, 가족 것도 봐. 쉽게 풀면, 부모님 명의 계좌도 조회되는데 부모님이 직접 본인 인증을 해야 해.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '셋째 가족도'와 '부모님이 직접 인증'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep28_s14_caution_motion.mp4",
      "narration": "그렇다고 문자나 메신저로 온 링크를 누르면 안 돼. 비밀번호나 수수료를 요구하면 사칭이거든.",
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
      "video": "owl_v2_ep28_s15_summary_motion.mp4",
      "narration": "콕 집어 정리하면, 잠자는 돈은 사라진 게 아니라 내가 아직 안 찾은 돈이야. 지금 먼저 확인할 건 두 가지야.",
      "imageBrief": "부엉이가 확신에 찬 표정으로 '잠자는 돈은'와 '내가 안 찾은 돈'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep28_s16_check_two_motion.mp4",
      "narration": "하나는 어카운트인포로 내 계좌를 한 번에 훑는 거, 다른 하나는 파인에서 휴면예금과 보험금을 보는 거지.",
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
      "video": "owl_v2_ep28_s17_save_motion.mp4",
      "narration": "이 두 가지는 저장해 두고, 조회는 공식 사이트에서만 해. 궁금한 제도는 댓글로 남겨줘.",
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
export function findOWLEP28Scene(key) {
  return OWL_EP28_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
