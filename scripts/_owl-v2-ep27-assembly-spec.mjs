/**
 * 통합 50편(부엉 표시26, 파일 ep27) — 개인투자용 국채 10월 청약(10/8~15) 마감 전 확인할 것. D형. 배포 10/13(화) 이내 필수(마감 10/15, 최후 게시 10/14). 투자 권유가 아니라 제도 안내.
 *
 * 대본 v8(2026-10-11): 17씬·약 565자(검사기 반드시 수정 0). v7→v8: 9번 씬 "이자엔 14%만 떼는 분리과세" → "이자엔 지방세까지 15.4%만 떼는 분리과세"(소득세 14%+지방소득세 1.4%, 실제 부담은 15.4%) + 카드 "이자 14% 분리과세" → "이자 15.4% 분리과세"(이미지·Veo 9번 클립 재생성 필요). 1차 18씬 660자는 TTS 139.6초라 폐기하고 줄임 → TTS v3 124.28초(최대 씬 8.61초, output-v3, 16번 씬 클립 여유 0.75초). 새 독자 읽기 점검은 줄이기 전 v5 기준 통과.
 *
 * 핵심 팩트(재경부 2026-09-30 발표): 10월 발행 2,300억, 청약 10/8~10/15 영업일 9~16시, 10년물 표면 4.510%+가산 0.28%p(9월 0.35%p), 세전 만기 수익률 약 59.7%, 분리과세 소득세 14%+지방소득세 1.4%=15.4%(만기 5년 이상, 매입액 2억, 재경부 Q&A 2024·미래에셋 2026·2023 개정 보도), 중도환매 1년 후·표면금리만, 퇴직연금(DC·IRP) 10·20년물만·과세 이연(한경 9/8).
 *
 * 미확인: 2026 분리과세 조건 공식 원문, 연 매입한도(2024 1억 vs 2026 증권사 2억, 연간 vs 누적) → 대본은 "매입액 2억 원까지"로만. 게시 전 재경부 안내 재확인.
 * 통합 번호 50편 (최우선 규칙 33, _ai/episode-numbering-unified.md). 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const OWL_EP27_ASSEMBLY_SPEC = Object.freeze({
  "specVersion": "owl_assembly_spec_v1",
  "scriptStructureVersion": "owl_script_structure_v2",
  "episode": 27,
  "displayEpisode": 26,
  "scriptType": "D_what_to_do",
  "geumbaksaHandoffTerm": null,
  "sourceCandidate": "candidate-owl-ep27-personal-bond-oct-subscription-2026-10-09",
  "title": "개인투자용 국채, 15일 마감 전에 볼 3가지",
  "channelName": "경제번역소",
  "characterDisplayName": "부엉박사",
  "headerTitle": [
    "개인투자용 국채",
    "15일 마감 전에",
    "볼 3가지"
  ],
  "hookType": "T3",
  "openingMotion": "impact",
  "imageCharacter": "owl3dv5",
  "imagePrefix": "owl_ep27",
  "sceneBackgrounds": {
    "A": {
      "label": "묘목 온실 라운지(도입·개념·정리·마무리)",
      "image": "밝은 유리 온실 라운지. 부엉박사 뒤로 크기가 점점 커지는 어린나무 모형 여러 그루(작은 묘목부터 큰 나무까지, 글자·숫자 없음)가 둥근 화단에 줄지어 서 있고, 양옆 큼직한 화분, 바닥은 따뜻한 연갈색 광택 바닥. 큰 빈 벽면 없이 나무 모형과 화단, 식물로 채운다. 연노랑·연초록 조명, 저폴리곤 단순화. 글자·숫자·눈금·간판·화면 없음.",
      "videoStyle": "bright glass greenhouse lounge with young tree models growing larger in a row",
      "videoStatics": "the plain young tree models growing from small to large in the round flower beds, the large potted plants, and the warm light brown glossy floor"
    },
    "B": {
      "label": "큰 병 전시관(발표·금리·가산금리)",
      "image": "밝고 깨끗한 전시관. 부엉박사 뒤로 글자 없는 큼직한 단색 유리병 조형물 여러 개와 둥근 동전 모양 단색 원판(숫자·문양 없음) 더미가 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 연한 크림색 광택 바닥. 큰 빈 벽면 없이 병 조형물과 원판, 식물로 채운다. 따뜻한 햇살 조명, 저폴리곤 단순화. 글자·숫자·로고·간판·화면 없음.",
      "videoStyle": "bright clean gallery with large plain glass jar sculptures and plain round coin-shaped discs",
      "videoStatics": "the large plain glass jar sculptures, the plain round coin-shaped discs without any marks, the large potted plants, and the light cream glossy floor"
    },
    "C": {
      "label": "자물쇠 정원(금액·세금·묶임·계좌·주의)",
      "image": "밝은 정원 전시관. 부엉박사 뒤로 큼직한 단색 자물쇠 조형물 여러 개와 열쇠 모양 조형물이 둥근 화단 사이에 놓여 있고(글자·숫자 없음), 양옆 큼직한 화분, 바닥은 연한 민트색 광택 바닥. 큰 빈 벽면 없이 자물쇠 조형물과 화단, 식물로 채운다. 은은한 연민트·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright garden gallery with large plain padlock and key sculptures among round flower beds",
      "videoStatics": "the large plain padlock sculptures, the plain key-shaped sculptures, the round flower beds, the large potted plants, and the glossy light mint floor"
    }
  },
  "scenesTimeline": "s1 훅 / s2 오프닝 / s3 개념 / s4 상황(재경부 10월분) / s5 10년물 연 4.79% / s6 가산금리 0.35→0.28 / s7 핵심질문 / s8 첫째 금액 / s9 첫째 세금 / s10 둘째 묶임 / s11 둘째 중도환매 / s12 셋째 어디서 / s13 셋째 퇴직연금 / s14 주의 / s15 정리 / s16 확인 두 가지 / s17 저장+댓글",
  "instagramCaptionHook": "목돈 묵혀둘 사람이라면, 개인투자용 국채 가산금리가 달라졌는데 청약이 15일에 끝난다는 걸 알아야 해",
  "instagramCaptionPoints": [
    "재정경제부가 9월 30일 10월분 계획을 발표했어, 총 2,300억 원이고 청약은 8일부터 15일까지야",
    "10년물은 기본 금리 4.51%에 가산금리 0.28%포인트가 붙어 연 4.79%이고, 지난달 가산금리 0.35%포인트보다 줄었어",
    "1,000만 원을 만기까지 두면 복리로 세전 약 1,600만 원이 되고, 이자에는 지방소득세 포함 15.4% 분리과세가 붙어 매입액 2억 원까지 적용돼",
    "중도환매는 1년 뒤부터 되는데 가산금리와 복리, 분리과세가 빠져, 곧 쓸 돈은 넣으면 안 돼",
    "증권사 전용계좌는 분리과세, 퇴직연금 계좌는 과세를 미뤄주고 퇴직연금 계좌는 가장 긴 두 만기만 살 수 있어",
    "👉 오래 안 쓸 돈인지, 청약할 전용계좌나 퇴직연금 계좌가 있는지 먼저 확인해봐",
    "💬 10년 넘게 묶어둘 수 있는 돈이 있어? 댓글로 알려줘",
    "※ 제도 안내이고 투자 권유가 아니야, 세제·한도는 판매 금융기관 공지를 꼭 다시 확인해"
  ],
  "instagramPriorityTags": [
    "개인투자용국채",
    "국채",
    "분리과세",
    "퇴직연금",
    "가산금리",
    "복리",
    "재정경제부",
    "목돈",
    "재테크",
    "노후준비",
    "경제뉴스",
    "부엉박사"
  ],
  "emphasisTerms": [
    "개인투자용 국채",
    "가산금리",
    "분리과세",
    "부엉박사"
  ],
  "captionBoundaryExceptions": [
    {
      "left": "2,300억",
      "right": "원이야",
      "reason": "s4 '총 2,300억 / 원이야' — 한 줄 폭(760px)에 '총 2,300억 원이야'가 안 들어가 조립기 자동 분할이 이 경계를 선택. 대본 변경은 TTS 재생성(유료)이 필요해 승인(2026-10-11)"
    }
  ],
  "captionWidthExceptions": [
    {
      "line": "0.35%포인트였는데",
      "reason": "'0.35%포인트였는데' 한 어절 840px(한도 760 대비 +80px, 휴대폰 안전폭 864 이내), s6 — 대본 문구 변경은 TTS 재생성(유료·길이 변동)이 필요해 승인(2026-10-11)"
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
      "video": "owl_v2_ep27_s1_hook_motion.mp4",
      "narration": "목돈 묵혀둘 사람, 개인투자용 국채 가산금리가 달라졌는데 청약이 15일에 끝난다는 거 알고 있었어?",
      "imageBrief": "부엉이가 놀라고 궁금한 표정으로 '가산금리 달라진'와 '국채 15일 마감'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep27_s2_opening_motion.mp4",
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
      "video": "owl_v2_ep27_s3_concept_motion.mp4",
      "narration": "개인투자용 국채는 정부가 개인에게 직접 파는 국채야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '개인투자용 국채'와 '정부가 파는 국채'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s4_situation_plan",
      "role": "fact",
      "video": "owl_v2_ep27_s4_situation_plan_motion.mp4",
      "narration": "재정경제부가 9월 30일 10월분 계획을 발표했어. 총 2,300억 원이야.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '재경부 10월분'와 '총 2,300억 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "key": "s5_situation_rate",
      "role": "fact",
      "video": "owl_v2_ep27_s5_situation_rate_motion.mp4",
      "narration": "10년물은 기본 금리에 정부가 얹는 가산금리 0.28%포인트가 붙어 연 4.79%야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '10년물 연 4.79%'와 '기본+가산 0.28%p'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s6_situation_change",
      "role": "fact",
      "video": "owl_v2_ep27_s6_situation_change_motion.mp4",
      "narration": "원래 지난달 가산금리는 0.35%포인트였는데, 이번엔 줄었어.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '가산금리'와 '0.35%p → 0.28%p'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s7_core_q",
      "role": "core_question",
      "video": "owl_v2_ep27_s7_core_q_motion.mp4",
      "narration": "그럼 나는 어떻게 해야 할까? 답부터 말하면, 오래 안 쓸 돈인지부터 보고 청약할지 정하는 거야.",
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
      "scene": 8,
      "key": "s8_point1_amount",
      "role": "evidence",
      "video": "owl_v2_ep27_s8_point1_amount_motion.mp4",
      "narration": "첫째, 얼마가 되는지 봐. 쉽게 풀면, 1,000만 원을 만기까지 두면 복리로 세전 약 1,600만 원이 돼.",
      "imageBrief": "부엉이가 또렷하고 반가운 표정으로 '1,000만 원이'와 '약 1,600만 원'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "scene": 9,
      "key": "s9_point1_tax",
      "role": "evidence",
      "video": "owl_v2_ep27_s9_point1_tax_motion.mp4",
      "narration": "이자엔 지방세까지 15.4%만 떼는 분리과세가 붙고, 매입액 2억 원까지 적용되는 거야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '이자 15.4% 분리과세'와 '매입액 2억까지'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s10_point2_lock",
      "role": "evidence",
      "video": "owl_v2_ep27_s10_point2_lock_motion.mp4",
      "narration": "둘째, 얼마나 묶이는지 봐. 쉽게 풀면, 오래 못 꺼내는 정기예금인데 중간에 깨면 혜택이 사라지는 거야.",
      "imageBrief": "부엉이가 신중하고 단호한 표정으로 '오래 못 꺼내는'와 '정기예금 같은 돈'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "careful and firm, eyebrows slightly furrowed, as if warning the viewer; only the face and body move while the wings holding the card stay still.",
        "mood": "firmly cautioning the viewer"
      }
    },
    {
      "scene": 11,
      "key": "s11_point2_early",
      "role": "evidence",
      "video": "owl_v2_ep27_s11_point2_early_motion.mp4",
      "narration": "중도환매는 1년 뒤부터 되는데, 가산금리와 복리, 분리과세가 빠져.",
      "imageBrief": "부엉이가 신중하고 단호한 표정으로 '중도환매 1년 뒤'와 '혜택은 빠진다'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "careful and firm, eyebrows slightly furrowed, as if warning the viewer; only the face and body move while the wings holding the card stay still.",
        "mood": "firmly cautioning the viewer"
      }
    },
    {
      "scene": 12,
      "key": "s12_point3_where",
      "role": "evidence",
      "video": "owl_v2_ep27_s12_point3_where_motion.mp4",
      "narration": "셋째, 어디서 사는지 봐. 쉽게 풀면, 증권사 전용계좌는 분리과세, 퇴직연금 계좌는 과세를 미뤄줘.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '증권사 전용계좌'와 '퇴직연금 계좌'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s13_point3_limit",
      "role": "evidence",
      "video": "owl_v2_ep27_s13_point3_limit_motion.mp4",
      "narration": "퇴직연금 계좌는 가장 긴 두 만기만 살 수 있어.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '퇴직연금 계좌는'와 '긴 두 만기만'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep27_s14_caution_motion.mp4",
      "narration": "그렇다고 곧 쓸 돈까지 넣으면 안 돼. 중간에 빼는 순간 혜택이 사라지거든.",
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
      "video": "owl_v2_ep27_s15_summary_motion.mp4",
      "narration": "콕 집어 정리하면, 이건 원리금을 보장받는 대신 오래 묶이는 상품이야. 지금 먼저 확인할 건 두 가지야.",
      "imageBrief": "부엉이가 확신에 찬 표정으로 '원리금 보장,'와 '대신 오래 묶인다'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep27_s16_check_two_motion.mp4",
      "narration": "하나는 오래 안 쓸 돈인지, 다른 하나는 청약할 전용계좌나 퇴직연금 계좌가 있는지 보는 거지.",
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
      "video": "owl_v2_ep27_s17_save_motion.mp4",
      "narration": "이 두 가지는 저장해 두고, 청약하기 전에 판매 금융기관 공지를 다시 확인해. 궁금한 제도는 댓글로 남겨줘.",
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
export function findOWLEP27Scene(key) {
  return OWL_EP27_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
