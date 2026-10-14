/**
 * 통합 53편(부엉 표시29, 파일 ep30) — 양육비 선지급, 소득 기준이 사라져요. 레인 policy_countdown / other. 훅 T3.
 * 대본: _ai/owl-batch-1015/scenes-D-child-support.json (검사기 반드시 수정 0). 출처: 성평등가족부 발표 보도(뉴스핌·아시아경제·SBS Biz), 양육비이행관리원·성평등가족부 안내.
 * 생성: scripts/build-owl-batch-1015.mjs (연출 정의 scripts/_owl-batch-1015-defs.mjs). 통합 번호는 최우선 규칙 33(_ai/episode-numbering-unified.md).
 * 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const OWL_EP30_ASSEMBLY_SPEC = Object.freeze({
  "specVersion": "owl_assembly_spec_v1",
  "scriptStructureVersion": "owl_script_structure_v2",
  "episode": 30,
  "displayEpisode": 29,
  "scriptType": "C_what_changes",
  "geumbaksaHandoffTerm": null,
  "sourceCandidate": "candidate-owl-ep30-child-support-advance-income-cap-2026-10-13",
  "title": "양육비 선지급, 소득 기준이 사라져요",
  "channelName": "경제번역소",
  "characterDisplayName": "부엉박사",
  "headerTitle": [
    "양육비 선지급,",
    "소득 기준이",
    "사라져요"
  ],
  "hookType": "T3",
  "openingMotion": "none",
  "imageCharacter": "owl3dv5",
  "imagePrefix": "owl_ep30",
  "sceneBackgrounds": {
    "A": {
      "label": "따뜻한 가족 정원 홀(도입·정리·마무리)",
      "image": "밝고 따뜻한 정원 홀. 부엉박사 뒤로 큼직한 단색 하트 조형물과 둥근 요람 모양 조형물(글자·숫자 없음)이 넓게 놓여 있고, 양옆 큼직한 화분, 바닥은 연한 살구색 광택 바닥. 큰 빈 벽면 없이 하트·요람 조형물과 식물로 채운다. 따뜻한 연살구·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright warm garden hall with large plain heart sculptures and round cradle-shaped sculptures",
      "videoStatics": "the large plain heart sculptures, the round cradle-shaped sculptures without any marks, the large potted plants, and the light apricot glossy floor"
    },
    "B": {
      "label": "서류 접수 전시관(발표·기준·지급)",
      "image": "밝고 깨끗한 접수 전시관. 부엉박사 뒤로 큼직한 단색 서류함 조형물과 둥근 접수대 모양 조형물(글자·숫자 없음)이 넓게 이어지고, 양옆 큼직한 화분, 바닥은 연한 하늘색 광택 바닥. 큰 빈 벽면 없이 서류함·접수대 조형물과 식물로 채운다. 은은한 연하늘·크림 조명, 저폴리곤 단순화. 글자·숫자·라벨·간판·화면 없음.",
      "videoStyle": "bright clean reception gallery with large plain document cabinet sculptures and round counter-shaped sculptures",
      "videoStatics": "the large plain document cabinet sculptures with no labels, the round counter-shaped sculptures, the large potted plants, and the light sky-blue glossy floor"
    },
    "C": {
      "label": "신청 안내 홀(대상·조건·신청·주의)",
      "image": "밝은 안내 홀. 부엉박사 뒤로 큼직한 단색 이정표 조형물과 둥근 문 모양 조형물(글자·숫자·화살표 글자 없음)이 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 연한 민트색 광택 바닥. 큰 빈 벽면 없이 이정표·문 조형물과 식물로 채운다. 은은한 연민트·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright guidance hall with large plain signpost sculptures and round door-shaped sculptures",
      "videoStatics": "the large plain signpost sculptures with no text, the round door-shaped sculptures, the large potted plants, and the glossy light mint floor"
    }
  },
  "scenesTimeline": "s1 hook / s2 opening / s3 concept / s4 announce / s5 change / s6 amount / s7 apply_from / s8 core_q / s9 point1 / s10 point2 / s11 point3 / s12 example / s13 caution / s14 summary / s15 check_two / s16 save",
  "instagramCaptionHook": "양육비를 못 받는 한부모라면 10월 29일부터 소득 기준 없이 양육비 선지급을 신청할 수 있어",
  "instagramCaptionPoints": [
    "성평등가족부가 9월에 양육비 선지급 소득 기준을 없앤다고 발표했고, 법 시행일은 10월 29일이야",
    "원래는 가구 소득이 기준 중위소득 150% 이하여야 신청할 수 있었는데 이제는 소득과 관계없어",
    "지급액은 자녀 한 명당 월 최대 20만 원이고, 성년이 될 때까지 받을 수 있어, 통상 매월 25일에 지급돼",
    "소득 기준 폐지는 시행일 이후 결정되는 10월 선지급분부터 적용되고 이전 달로 소급되지 않아",
    "신청 직전 3개월 또는 연속 3회 받은 양육비의 월평균이 선지급금보다 적어야 하고, 양육비이행관리원에 법률 지원이나 채권 추심을 신청했거나 이행 절차를 밟았어야 해",
    "👉 신청은 양육비이행관리원 누리집(childsupport.or.kr)이나 우편, 문의는 1644-6621",
    "💬 궁금한 제도가 있으면 댓글로 남겨줘",
    "※ 선지급을 받으면 나중에 국가가 상대방에게 그 돈을 받아 내, 신청 전에 공식 안내로 다시 확인해"
  ],
  "instagramPriorityTags": [
    "양육비선지급",
    "양육비",
    "한부모",
    "한부모가족",
    "양육비이행관리원",
    "성평등가족부",
    "경제뉴스",
    "부엉박사"
  ],
  "emphasisTerms": [
    "소득 기준",
    "20만",
    "10월 29일",
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
      "video": "owl_v2_ep30_s1_hook_motion.mp4",
      "narration": "양육비 못 받는 한부모, 10월 29일부터 소득 기준 없이 국가가 먼저 줘.",
      "imageBrief": "부엉이가 놀라고 궁금한 표정으로 '한부모 양육비'와 '소득 기준 폐지'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep30_s2_opening_motion.mp4",
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
      "video": "owl_v2_ep30_s3_concept_motion.mp4",
      "narration": "양육비 선지급제는 못 받은 양육비를 국가가 먼저 지급해 주는 제도야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '양육비 선지급'와 '국가가 먼저 지급'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s4_announce",
      "role": "fact",
      "video": "owl_v2_ep30_s4_announce_motion.mp4",
      "narration": "성평등가족부가 9월에 선지급 소득 기준을 없앤다고 발표했어.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '성평등가족부'와 '9월 발표'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "key": "s5_change",
      "role": "fact",
      "video": "owl_v2_ep30_s5_change_motion.mp4",
      "narration": "원래는 가구 소득이 기준 중위소득 150% 이하여야 신청할 수 있었는데, 이제는 소득과 관계없어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '원래 중위소득'와 '150% 이하만'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "scene": 6,
      "key": "s6_amount",
      "role": "fact",
      "video": "owl_v2_ep30_s6_amount_motion.mp4",
      "narration": "지급액은 자녀 한 명당 월 최대 20만 원이고, 자녀가 성년이 될 때까지 받을 수 있어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '자녀 한 명당'와 '월 최대 20만 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s7_apply_from",
      "role": "fact",
      "video": "owl_v2_ep30_s7_apply_from_motion.mp4",
      "narration": "시행일 이후 결정되는 10월 선지급분부터 적용되고, 이전 달로 소급되지는 않아.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '10월 선지급분부터'와 '소급은 안 돼요'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep30_s8_core_q_motion.mp4",
      "narration": "그럼 나한테는 뭐가 달라질까? 답부터 말하면, 소득이 높아서 못 받던 사람도 신청할 수 있다는 거야.",
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
      "key": "s9_point1",
      "role": "evidence",
      "video": "owl_v2_ep30_s9_point1_motion.mp4",
      "narration": "첫째, 대상부터 봐. 쉽게 풀면, 양육비를 아예 못 받았거나 선지급금보다 적게 받은 경우가 해당돼.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '첫째 대상'와 '못 받거나 적게'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s10_point2",
      "role": "evidence",
      "video": "owl_v2_ep30_s10_point2_motion.mp4",
      "narration": "둘째, 조건이야. 쉽게 풀면, 양육비이행관리원에 법률 지원이나 채권 추심을 신청했거나 이행 절차를 밟았어야 해.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '둘째 조건'와 '이행관리원 신청'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s11_point3",
      "role": "evidence",
      "video": "owl_v2_ep30_s11_point3_motion.mp4",
      "narration": "셋째, 신청이야. 쉽게 풀면, 양육비이행관리원 누리집이나 우편으로 신청하면 돼.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '셋째 신청'와 '누리집 또는 우편'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s12_example",
      "role": "evidence",
      "video": "owl_v2_ep30_s12_example_motion.mp4",
      "narration": "자녀가 둘이면 한 달에 최대 40만 원을, 조사를 마친 뒤 통상 매월 25일에 받는 셈이지.",
      "imageBrief": "부엉이가 또렷하고 반가운 표정으로 '자녀가 둘이면'와 '월 최대 40만 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "clear and pleasantly surprised with slight nods, as if revealing the amount; only the face and body move while the wings holding the card stay still.",
        "mood": "clearly revealing the amount"
      }
    },
    {
      "scene": 13,
      "key": "s13_caution",
      "role": "condition",
      "video": "owl_v2_ep30_s13_caution_motion.mp4",
      "narration": "그렇다고 선지급을 받으면 끝나는 건 아니야. 나중에 국가가 상대방에게 그 돈을 받아 내거든.",
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
      "key": "s14_summary",
      "role": "action",
      "video": "owl_v2_ep30_s14_summary_motion.mp4",
      "narration": "콕 집어 정리하면, 이제는 소득과 상관없이 양육비를 못 받는 한부모가 신청할 수 있어. 먼저 확인할 건 두 가지야.",
      "imageBrief": "부엉이가 확신에 찬 표정으로 '소득과 상관없이'와 '신청할 수 있어요'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "scene": 15,
      "key": "s15_check_two",
      "role": "action",
      "video": "owl_v2_ep30_s15_check_two_motion.mp4",
      "narration": "하나는 못 받은 양육비 기록, 다른 하나는 이행관리원 지원 신청 이력이야.",
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
      "scene": 16,
      "key": "s16_save",
      "role": "save",
      "video": "owl_v2_ep30_s16_save_motion.mp4",
      "narration": "이 두 가지는 저장해 두고, 양육비이행관리원에서 확인해. 궁금한 제도는 댓글로 남겨줘.",
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
export function findOWLEP30Scene(key) {
  return OWL_EP30_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
