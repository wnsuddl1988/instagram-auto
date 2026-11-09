/**
 * 통합 54편(부엉 표시30, 파일 ep31) — 연금계좌, 연말 전에 넣으면 최대 148만 원. 레인 money_calc / tax. 훅 T3.
 * 대본: _ai/owl-batch-1015/scenes-E-pension-account.json (검사기 반드시 수정 0). 출처: 국세청 연금계좌 세액공제 한도·공제율 안내·소득세법 제59조의3, 한국경제·조세금융신문(2026 세제개편안).
 * 생성: scripts/build-owl-batch-1015.mjs (연출 정의 scripts/_owl-batch-1015-defs.mjs). 통합 번호는 최우선 규칙 33(_ai/episode-numbering-unified.md).
 * 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const OWL_EP31_ASSEMBLY_SPEC = Object.freeze({
  "specVersion": "owl_assembly_spec_v1",
  "scriptStructureVersion": "owl_script_structure_v2",
  "episode": 31,
  "displayEpisode": 30,
  "scriptType": "D_what_to_do",
  "geumbaksaHandoffTerm": null,
  "sourceCandidate": "candidate-owl-ep31-pension-account-credit-year-end-2026-10-13",
  "title": "연금계좌, 연말 전에 넣으면 최대 148만 원",
  "channelName": "경제번역소",
  "characterDisplayName": "부엉박사",
  "headerTitle": [
    "연금계좌,",
    "연말 전에 넣으면",
    "최대 148만 원"
  ],
  "hookType": "T3",
  "openingMotion": "none",
  "imageCharacter": "owl3dv5",
  "imagePrefix": "owl_ep31",
  "sceneBackgrounds": {
    "A": {
      "label": "황금 나무 정원 라운지(도입·정리·마무리)",
      "image": "밝은 정원 라운지. 부엉박사 뒤로 큼직한 단색 황금 나무 조형물과 둥근 화단 조형물(글자·숫자 없음)이 넓게 놓여 있고, 양옆 큼직한 화분, 바닥은 연한 연두색 광택 바닥. 큰 빈 벽면 없이 나무·화단 조형물과 식물로 채운다. 따뜻한 연두·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright garden lounge with large plain golden tree sculptures and round flower bed sculptures",
      "videoStatics": "the large plain golden tree sculptures, the round flower bed sculptures without any marks, the large potted plants, and the light lime-green glossy floor"
    },
    "B": {
      "label": "달력 전시관(한도·공제율·시기)",
      "image": "밝고 깨끗한 전시관. 부엉박사 뒤로 큼직한 단색 달력 모양 조형물과 둥근 시계 모양 기둥(날짜·숫자·글자 없음, 칸 선만 있음)이 넓게 이어지고, 양옆 큼직한 화분, 바닥은 연한 크림색 광택 바닥. 큰 빈 벽면 없이 달력·시계 조형물과 식물로 채운다. 은은한 햇살 조명, 저폴리곤 단순화. 글자·숫자·라벨·간판·화면 없음.",
      "videoStyle": "bright clean gallery with large plain calendar-shaped sculptures and round clock-shaped pillars with no numbers",
      "videoStatics": "the large plain calendar-shaped sculptures with no dates, the round clock-shaped pillars without any marks, the large potted plants, and the light cream glossy floor"
    },
    "C": {
      "label": "방패 점검 홀(확인·주의·정부안)",
      "image": "밝은 점검 홀. 부엉박사 뒤로 큼직한 단색 방패 조형물과 둥근 체크 표시 모양 기둥(글자·숫자 없음)이 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 연한 민트색 광택 바닥. 큰 빈 벽면 없이 방패·기둥 조형물과 식물로 채운다. 은은한 연민트·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright inspection hall with large plain shield sculptures and round check-mark-shaped pillars",
      "videoStatics": "the large plain shield sculptures, the round pillars without any marks, the large potted plants, and the glossy light mint floor"
    }
  },
  "scenesTimeline": "s1 hook / s2 opening / s3 concept / s4 limit / s5 rate / s6 local_tax / s7 where / s8 core_q / s9 point1 / s10 example / s11 point2 / s12 point3 / s13 caution / s14 youth_irp / s15 summary / s16 check_two / s17 save",
  "instagramCaptionHook": "연말정산 전에 연금저축·IRP에 돈을 넣으면 세금을 최대 148만 5천 원까지 돌려받을 수 있어(총급여 5,500만 원 이하·한도 900만 원 기준)",
  "instagramCaptionPoints": [
    "국세청 기준 연금저축은 연 600만 원, IRP를 합치면 연 900만 원까지 세액공제를 받아",
    "세액공제율은 총급여 5,500만 원 이하 15%, 초과 12%이고 지방소득세를 포함하면 16.5%와 13.2%야",
    "직장인은 연말정산, 개인사업자는 종합소득세 신고에서 돌려받아",
    "예를 들어 총급여 5,000만 원이면 900만 원을 채웠을 때 최대 148만 5천 원이야(낼 세금이 적으면 환급도 줄어)",
    "올해 공제는 12월 31일까지 넣은 돈만 인정되니 금융회사 마감 시간 전에 끝내야 해",
    "55세 전에 연금이 아닌 방식으로 빼면 공제받은 돈에 기타소득세가 붙어",
    "정부 세제개편안에는 34세 이하 청년 IRP 공제율을 올리는 내용이 있지만 국회 확정 전이야",
    "👉 올해 넣은 금액과 내 총급여 구간부터 확인해봐, 계산은 프로필 링크의 연금계좌 세액공제 계산기에서 해볼 수 있어",
    "💬 연금저축이나 IRP 채웠어? 댓글로 알려줘"
  ],
  "instagramPriorityTags": [
    "연말정산",
    "연금저축",
    "IRP",
    "세액공제",
    "연금계좌",
    "절세",
    "13월의월급",
    "경제뉴스",
    "부엉박사"
  ],
  "emphasisTerms": [
    "148만",
    "900만",
    "12월 31일",
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
      "video": "owl_v2_ep31_s1_hook_motion.mp4",
      "narration": "직장인, 연말정산 전에 연금 계좌에 돈 넣으면 최대 148만 원 넘게 돌려받아.",
      "imageBrief": "부엉이가 놀라고 궁금한 표정으로 '연말 전 연금계좌'와 '최대 148만 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep31_s2_opening_motion.mp4",
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
      "video": "owl_v2_ep31_s3_concept_motion.mp4",
      "narration": "연금계좌 세액공제는 연금저축과 IRP에 넣은 돈의 일부를 내 세금에서 빼 주는 제도야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '연금계좌'와 '세액공제'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "key": "s4_limit",
      "role": "fact",
      "video": "owl_v2_ep31_s4_limit_motion.mp4",
      "narration": "국세청 기준으로 연금저축은 연 600만 원, IRP를 합치면 연 900만 원까지 공제돼.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '연금저축 600만'와 '합산 900만 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "scene": 5,
      "key": "s5_rate",
      "role": "fact",
      "video": "owl_v2_ep31_s5_rate_motion.mp4",
      "narration": "세액공제율은 총급여 5,500만 원 이하면 15%, 넘으면 12%야.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '공제율 15%·12%'와 '총급여 5,500만'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s6_local_tax",
      "role": "fact",
      "video": "owl_v2_ep31_s6_local_tax_motion.mp4",
      "narration": "지방소득세까지 포함하면 실제로는 16.5%와 13.2%를 돌려받아.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '지방소득세 포함'와 '16.5%·13.2%'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s7_where",
      "role": "fact",
      "video": "owl_v2_ep31_s7_where_motion.mp4",
      "narration": "이 돈은 직장인은 연말정산, 개인사업자는 종합소득세 신고에서 돌려받는 거야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '연말정산 또는'와 '종합소득세 신고'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s8_core_q",
      "role": "core_question",
      "video": "owl_v2_ep31_s8_core_q_motion.mp4",
      "narration": "그럼 나는 어떻게 해야 할까? 답부터 말하면, 올해 한도를 얼마나 채웠는지 먼저 확인하는 거야.",
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
      "video": "owl_v2_ep31_s9_point1_motion.mp4",
      "narration": "첫째, 한도부터 봐. 쉽게 풀면, 올해 연금저축과 IRP에 넣은 돈을 더해서 빈자리를 보는 거지.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '첫째 한도'와 '넣은 돈 합산'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "key": "s10_example",
      "role": "evidence",
      "video": "owl_v2_ep31_s10_example_motion.mp4",
      "narration": "예를 들어 총급여가 5,000만 원일 때, 900만 원을 채우면 최대 148만 5천 원을 돌려받아.",
      "imageBrief": "부엉이가 또렷하고 반가운 표정으로 '총급여 5,000만'와 '최대 148만 5천 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "scene": 11,
      "key": "s11_point2",
      "role": "evidence",
      "video": "owl_v2_ep31_s11_point2_motion.mp4",
      "narration": "둘째, 시기야. 쉽게 풀면, 올해 공제는 12월 31일까지 넣은 돈만 인정돼.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '둘째 시기'와 '12월 31일까지'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep31_s12_point3_motion.mp4",
      "narration": "셋째, 내 세금이야. 쉽게 풀면, 낼 세금이 적으면 돌려받는 돈도 그만큼 줄어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '셋째 내 세금'와 '적으면 환급도 줄어'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep31_s13_caution_motion.mp4",
      "narration": "그렇다고 무작정 넣으면 안 돼. 55세 전에 연금이 아닌 방식으로 빼면 기타소득세가 붙거든.",
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
      "key": "s14_youth_irp",
      "role": "fact",
      "video": "owl_v2_ep31_s14_youth_irp_motion.mp4",
      "narration": "정부안에는 34세 이하 청년 IRP 공제율을 올리는 내용이 있지만, 아직 확정은 아니야.",
      "imageBrief": "부엉이가 신중하고 단호한 표정으로 '청년 IRP 확대'와 '정부안·미확정'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep31_s15_summary_motion.mp4",
      "narration": "콕 집어 정리하면, 연말 전에 한도와 내 세금을 같이 봐야 돌려받는 돈이 정해져. 지금 먼저 확인할 건 두 가지야.",
      "imageBrief": "부엉이가 확신에 찬 표정으로 '한도와 내 세금'와 '같이 확인'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep31_s16_check_two_motion.mp4",
      "narration": "하나는 올해 연금저축과 IRP에 넣은 금액이고, 다른 하나는 내 총급여 구간이지.",
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
      "video": "owl_v2_ep31_s17_save_motion.mp4",
      "narration": "이 두 가지는 저장해 두고, 납입은 금융회사 마감 시간 전에 끝내. 궁금한 제도는 댓글로 남겨줘.",
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
export function findOWLEP31Scene(key) {
  return OWL_EP31_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
