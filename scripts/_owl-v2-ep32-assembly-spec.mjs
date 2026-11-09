/**
 * 통합 55편(부엉 표시31, 파일 ep32) — 병원비 환급금, 95만 명은 직접 신청해야 받아요. 레인 deadline_benefit / other. 훅 T5.
 * 대본: _ai/owl-batch-1015/scenes-C-nhis-refund.json (검사기 반드시 수정 0). 출처: 보건복지부 보도자료 8/31(상한제 226만 2,605명)·건보공단 발표 보도(SBS Biz·뉴스핌·라포르시안 10/6, 건보료 환급금 집중 지급)·매일신문 10/10·한국경제 8/3(3,617억)·뉴시스 3/25(앱 건강보험25시로 개편), 국민건강보험법(소멸시효 3년).
 * 생성: scripts/build-owl-batch-1015.mjs (연출 정의 scripts/_owl-batch-1015-defs.mjs). 통합 번호는 최우선 규칙 33(_ai/episode-numbering-unified.md).
 * 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const OWL_EP32_ASSEMBLY_SPEC = Object.freeze({
  "specVersion": "owl_assembly_spec_v1",
  "scriptStructureVersion": "owl_script_structure_v2",
  "episode": 32,
  "displayEpisode": 31,
  "scriptType": "D_what_to_do",
  "geumbaksaHandoffTerm": null,
  "sourceCandidate": "candidate-owl-ep32-nhis-refund-focused-payment-2026-10-13",
  "title": "병원비 환급금, 95만 명은 직접 신청해야 받아요",
  "channelName": "경제번역소",
  "characterDisplayName": "부엉박사",
  "headerTitle": [
    "병원비 환급금,",
    "95만 명은 직접",
    "신청해야 받아요"
  ],
  "hookType": "T5",
  "openingMotion": "none",
  "imageCharacter": "owl3dv5",
  "imagePrefix": "owl_ep32",
  "sceneBackgrounds": {
    "A": {
      "label": "병원 로비 라운지(도입·정리·마무리)",
      "image": "밝고 깨끗한 로비 라운지. 부엉박사 뒤로 큼직한 단색 십자 조형물과 둥근 소파 조형물(글자·숫자 없음)이 넓게 놓여 있고, 양옆 큼직한 화분, 바닥은 연한 하늘색 광택 바닥. 큰 빈 벽면 없이 십자·소파 조형물과 식물로 채운다. 은은한 연하늘·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright clean lobby lounge with large plain cross-shaped sculptures and round sofa sculptures",
      "videoStatics": "the large plain cross-shaped sculptures, the round sofa sculptures without any marks, the large potted plants, and the light sky-blue glossy floor"
    },
    "B": {
      "label": "환급 창구 전시관(발표·숫자·제도)",
      "image": "밝고 깨끗한 창구 전시관. 부엉박사 뒤로 큼직한 단색 창구 조형물과 둥근 번호표 기계 모양 조형물(글자·숫자 없음)이 넓게 이어지고, 양옆 큼직한 화분, 바닥은 연한 크림색 광택 바닥. 큰 빈 벽면 없이 창구·번호표 조형물과 식물로 채운다. 따뜻한 햇살 조명, 저폴리곤 단순화. 글자·숫자·라벨·간판·화면 없음.",
      "videoStyle": "bright clean counter gallery with large plain service-window sculptures and round ticket-machine-shaped sculptures",
      "videoStatics": "the large plain service-window sculptures with no labels, the round ticket-machine-shaped sculptures, the large potted plants, and the light cream glossy floor"
    },
    "C": {
      "label": "스마트폰 조회 홀(조회·신청·주의)",
      "image": "밝은 조회 홀. 부엉박사 뒤로 큼직한 단색 스마트폰 모양 조형물과 둥근 돋보기 모양 기둥(화면에 글자·숫자·아이콘 없음)이 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 연한 민트색 광택 바닥. 큰 빈 벽면 없이 폰·돋보기 조형물과 식물로 채운다. 은은한 연민트·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright lookup hall with large plain smartphone-shaped sculptures and round magnifier-shaped pillars",
      "videoStatics": "the large plain smartphone-shaped sculptures with blank screens, the round magnifier-shaped pillars, the large potted plants, and the glossy light mint floor"
    }
  },
  "scenesTimeline": "s1 hook / s2 opening / s3 concept / s4 focus / s5 target / s6 split / s7 unclaimed / s8 auto / s9 core_q / s10 point1 / s11 point2 / s12 point3 / s13 caution / s14 phishing / s15 summary / s16 check_two / s17 save",
  "instagramCaptionHook": "병원비 환급금, 신청해야 받는 사람이 95만 명이래, 계좌 등록을 안 했다면 직접 조회해 봐",
  "instagramCaptionPoints": [
    "본인부담상한제는 1년 동안 낸 병원비가 소득별 상한액을 넘으면 넘은 만큼 돌려주는 제도야",
    "2025년 진료분 환급 대상자는 226만 2,605명, 한 명당 평균 136만 원이고, 131만 명은 계좌를 등록해 자동 지급, 나머지는 직접 신청해야 해",
    "2021년부터 올해 6월까지 신청하지 않아 못 받은 상한제 환급금이 3,617억 원이야",
    "공단은 11월 말까지 이중·착오로 더 낸 건강보험료 환급금도 집중 지급하고 있어",
    "건강보험 누리집이나 건강보험25시 앱에서 본인 인증 후 환급금을 조회하고 계좌번호를 입력해 신청해, 지급 동의 계좌를 등록하면 다음 해부터 자동으로 들어와",
    "환급받을 권리는 3년이 지나면 사라져",
    "👉 고객센터는 1577-1000이야, 공단 안내 문자에는 인터넷 주소가 들어가지 않으니 링크가 달린 환급 문자는 누르지 마",
    "💬 환급금 조회해본 적 있어? 댓글로 알려줘"
  ],
  "instagramPriorityTags": [
    "건강보험",
    "환급금",
    "본인부담상한제",
    "건보료",
    "건강보험공단",
    "병원비",
    "경제뉴스",
    "부엉박사"
  ],
  "emphasisTerms": [
    "95만",
    "11월 말",
    "환급금",
    "부엉박사"
  ],
  "captionBoundaryExceptions": [],
  "captionWidthExceptions": [],
  "captionDwellExceptions": [],
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
      "video": "owl_v2_ep32_s1_hook_motion.mp4",
      "narration": "병원비 환급금, 신청 안 하면 못 받는 사람이 95만 명이래.",
      "imageBrief": "부엉이가 놀라고 궁금한 표정으로 '병원비 환급금'와 '직접 신청 95만 명'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep32_s2_opening_motion.mp4",
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
      "video": "owl_v2_ep32_s3_concept_motion.mp4",
      "narration": "본인부담 상한제는 병원비를 소득별 상한선보다 많이 냈을 때 넘은 만큼 돌려주는 제도야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '본인부담상한제'와 '넘은 만큼 환급'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s4_focus",
      "role": "fact",
      "video": "owl_v2_ep32_s4_focus_motion.mp4",
      "narration": "국민건강보험 공단은 11월 말까지, 더 낸 보험료를 돌려주는 환급금도 집중 지급한다고 밝혔어.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '공단 집중 지급'와 '11월 말까지'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "key": "s5_target",
      "role": "fact",
      "video": "owl_v2_ep32_s5_target_motion.mp4",
      "narration": "2025년 진료분 환급 대상자는 226만 2,605명 규모고, 한 명당 평균 136만 원이야.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '2025년 진료분'와 '226만 2,605명'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s6_split",
      "role": "fact",
      "video": "owl_v2_ep32_s6_split_motion.mp4",
      "narration": "이 중 131만 명은 계좌를 등록해 자동으로 받고, 나머지는 직접 신청해야 해.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '자동 지급 131만'와 '직접 신청 95만'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s7_unclaimed",
      "role": "fact",
      "video": "owl_v2_ep32_s7_unclaimed_motion.mp4",
      "narration": "2021년부터 올해 6월까지 신청하지 않아 못 받은 환급금이 3,617억 원이야.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '못 받은 환급금'와 '3,617억 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s8_auto",
      "role": "fact",
      "video": "owl_v2_ep32_s8_auto_motion.mp4",
      "narration": "원래는 신청해야 받는 돈인데, 계좌를 미리 등록하면 이제는 다음 해부터 자동으로 들어와.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '계좌 등록하면'와 '다음 해 자동 입금'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "scene": 9,
      "key": "s9_core_q",
      "role": "core_question",
      "video": "owl_v2_ep32_s9_core_q_motion.mp4",
      "narration": "그럼 나는 어떻게 해야 할까? 답부터 말하면, 공단 누리집이나 앱에서 내 환급금부터 조회하는 거야.",
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
      "video": "owl_v2_ep32_s10_point1_motion.mp4",
      "narration": "첫째, 조회부터 해. 쉽게 풀면, 공단 누리집이나 건강보험25시 앱에서 인증하고 환급금을 조회하면 돼.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '첫째 조회'와 '누리집·앱'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep32_s11_point2_motion.mp4",
      "narration": "둘째, 신청이야. 쉽게 풀면, 조회에서 환급금이 보이면 계좌번호를 입력해 신청하는 거지.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '둘째 신청'와 '계좌번호 입력'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "key": "s12_point3",
      "role": "evidence",
      "video": "owl_v2_ep32_s12_point3_motion.mp4",
      "narration": "셋째, 자동 지급이야. 쉽게 풀면, 지급 동의 계좌를 등록해 두면 다음 해부터 따로 신청할 필요가 없어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '셋째 자동 지급'와 '지급 동의 계좌'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s13_caution",
      "role": "condition",
      "video": "owl_v2_ep32_s13_caution_motion.mp4",
      "narration": "그렇다고 미루면 안 돼. 3년이 지나면 환급받을 권리가 전액 사라지거든.",
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
      "scene": 14,
      "key": "s14_phishing",
      "role": "condition",
      "video": "owl_v2_ep32_s14_phishing_motion.mp4",
      "narration": "공단 안내 문자에는 인터넷 주소가 들어가지 않아. 링크가 달린 환급 문자는 누르지 마.",
      "imageBrief": "부엉이가 신중하고 단호한 표정으로 '문자에 링크?'와 '누르지 마세요'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "serious and careful with slight nods, as if warning about this point; only the face and body move while the wings holding the card stay still.",
        "mood": "seriously cautioning about this point"
      }
    },
    {
      "scene": 15,
      "key": "s15_summary",
      "role": "action",
      "video": "owl_v2_ep32_s15_summary_motion.mp4",
      "narration": "콕 집어 정리하면, 환급금은 조회하고 신청해야 내 손에 들어와. 지금 먼저 확인할 건 두 가지야.",
      "imageBrief": "부엉이가 확신에 찬 표정으로 '조회하고 신청해야'와 '내 손에 들어와요'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep32_s16_check_two_motion.mp4",
      "narration": "하나는 공단 누리집이나 앱에서 내 환급금을 조회하는 거고, 다른 하나는 지급 동의 계좌를 등록하는 거야.",
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
      "video": "owl_v2_ep32_s17_save_motion.mp4",
      "narration": "이 두 가지는 저장해 두고, 11월 말 전에 확인해. 궁금한 제도는 댓글로 남겨줘.",
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
export function findOWLEP32Scene(key) {
  return OWL_EP32_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
