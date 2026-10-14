/**
 * 통합 56편(부엉 표시32, 파일 ep33) — 경찰 경고 문자, 링크 누르기 전에 이것부터. 레인 fraud_prevention / other. 훅 T2.
 * 대본: _ai/owl-batch-1015/scenes-B-smishing.json (검사기 반드시 수정 0). 출처: 경찰청 발표 보도(파이낸셜뉴스·뉴시스·디지털타임스 등 10/13), 금융당국 10/6 소비자경보.
 * 생성: scripts/build-owl-batch-1015.mjs (연출 정의 scripts/_owl-batch-1015-defs.mjs). 통합 번호는 최우선 규칙 33(_ai/episode-numbering-unified.md).
 * 연출 필드는 규칙 14(배경 2~3구역)·15(품질 체계 v2)·17(훅)·26~30. 배경·카드에 글자는 카드 문구만(배경 글자 없음).
 */

export const OWL_EP33_ASSEMBLY_SPEC = Object.freeze({
  "specVersion": "owl_assembly_spec_v1",
  "scriptStructureVersion": "owl_script_structure_v2",
  "episode": 33,
  "displayEpisode": 32,
  "scriptType": "D_what_to_do",
  "geumbaksaHandoffTerm": null,
  "sourceCandidate": "candidate-owl-ep33-police-smishing-alert-4800m-2026-10-13",
  "title": "경찰 경고 문자, 링크 누르기 전에 이것부터",
  "channelName": "경제번역소",
  "characterDisplayName": "부엉박사",
  "headerTitle": [
    "경찰 경고 문자,",
    "링크 누르기 전에",
    "이것부터"
  ],
  "hookType": "T2",
  "openingMotion": "none",
  "imageCharacter": "owl3dv5",
  "imagePrefix": "owl_ep33",
  "sceneBackgrounds": {
    "A": {
      "label": "경보 라운지(도입·정리·마무리)",
      "image": "밝은 경보 라운지. 부엉박사 뒤로 큼직한 단색 종 모양 조형물과 둥근 경광등 모양 조형물(글자·숫자 없음)이 넓게 놓여 있고, 양옆 큼직한 화분, 바닥은 연한 남색 광택 바닥. 큰 빈 벽면 없이 종·경광등 조형물과 식물로 채운다. 은은한 연남색·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright alert lounge with large plain bell sculptures and round beacon-light-shaped sculptures",
      "videoStatics": "the large plain bell sculptures, the round beacon-light-shaped sculptures without any marks, the large potted plants, and the light navy glossy floor"
    },
    "B": {
      "label": "자물쇠 전시관(상황·배경·발송)",
      "image": "밝고 깨끗한 전시관. 부엉박사 뒤로 큼직한 단색 자물쇠 조형물과 둥근 열쇠 모양 기둥(글자·숫자 없음)이 넓게 이어지고, 양옆 큼직한 화분, 바닥은 연한 크림색 광택 바닥. 큰 빈 벽면 없이 자물쇠·열쇠 조형물과 식물로 채운다. 따뜻한 햇살 조명, 저폴리곤 단순화. 글자·숫자·라벨·간판·화면 없음.",
      "videoStyle": "bright clean gallery with large plain padlock sculptures and round key-shaped pillars",
      "videoStatics": "the large plain padlock sculptures with no marks, the round key-shaped pillars, the large potted plants, and the light cream glossy floor"
    },
    "C": {
      "label": "방패 방어 홀(대처법·주의)",
      "image": "밝은 방어 홀. 부엉박사 뒤로 큼직한 단색 방패 조형물과 둥근 체크 표시 모양 기둥(글자·숫자 없음)이 넓게 펼쳐지고, 양옆 큼직한 화분, 바닥은 연한 민트색 광택 바닥. 큰 빈 벽면 없이 방패·기둥 조형물과 식물로 채운다. 은은한 연민트·크림 조명, 저폴리곤 단순화. 글자·숫자·간판·화면 없음.",
      "videoStyle": "bright defense hall with large plain shield sculptures and round check-mark-shaped pillars",
      "videoStatics": "the large plain shield sculptures, the round pillars without any marks, the large potted plants, and the glossy light mint floor"
    }
  },
  "scenesTimeline": "s1 hook / s2 opening / s3 concept / s4 police / s5 purpose / s6 agency / s7 timing / s8 core_q / s9 point1 / s10 point2 / s11 point3 / s12 caution / s13 report / s14 summary / s15 check_two / s16 save",
  "instagramCaptionHook": "금융권 해킹 뒤 내 통장이 위험해질 수 있다고 경찰이 4,800만 명에게 경고 문자를 보낸대, 링크는 누르지 말고 직접 찾은 경로로 확인해",
  "instagramCaptionPoints": [
    "경찰청 전기통신금융사기 통합대응단이 이달 셋째 주부터 통신 3사 가입자 약 4,800만 명에게 경고 문자를 순차로 보낸다고 밝혔어",
    "금융권 해킹 사고를 악용한 보이스피싱과 스미싱 2차 피해를 막으려는 거고, 금융당국도 10월 6일 소비자경보를 주의로 발령했어",
    "발송일은 통신사와 협의 중이라 문자가 오는 날은 사람마다 다를 수 있어",
    "출처가 불분명한 인터넷 주소는 누르지도 앱을 설치하지도 마",
    "개인정보를 달라거나 송금을 시키면 일단 의심해",
    "금리·대출 한도를 조정해 준다거나 유출 보상을 해 준다며 접근하는 수법이 많아",
    "👉 의심스러우면 해당 금융기관 고객센터에 묻고, 범죄가 의심되면 112나 통합대응단 상담전화 1394로 연락해",
    "💬 가족에게도 알려줬어? 댓글로 알려줘",
    "※ 문자 속 번호나 링크로 바로 확인하지 말고 내가 직접 찾은 고객센터로 확인해"
  ],
  "instagramPriorityTags": [
    "보이스피싱",
    "스미싱",
    "금융사기",
    "경찰청",
    "금융권해킹",
    "개인정보유출",
    "경제뉴스",
    "부엉박사"
  ],
  "emphasisTerms": [
    "경고 문자",
    "4,800만",
    "링크",
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
      "video": "owl_v2_ep33_s1_hook_motion.mp4",
      "narration": "금융권 해킹 뒤 내 통장이 위험해질 수 있다고, 경찰이 경고 문자를 보내.",
      "imageBrief": "부엉이가 놀라고 궁금한 표정으로 '금융권 해킹 뒤'와 '경찰 경고 문자'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep33_s2_opening_motion.mp4",
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
      "video": "owl_v2_ep33_s3_concept_motion.mp4",
      "narration": "스미싱은 문자 속 링크를 눌러 앱을 깔게 하거나 정보를 빼 가는 사기야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '스미싱'와 '링크 눌러 정보 탈취'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s4_police",
      "role": "fact",
      "video": "owl_v2_ep33_s4_police_motion.mp4",
      "narration": "경찰청이 이달 3주 차부터 경고 문자를 보낸다고 밝혔어. 대상은 가입자 약 4,800만 명 규모야.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '경찰청'와 '4,800만 명 발송'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s5_purpose",
      "role": "fact",
      "video": "owl_v2_ep33_s5_purpose_motion.mp4",
      "narration": "금융권 해킹 사고를 악용한 보이스피싱과 스미싱 피해를 막으려는 거야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '해킹 악용 사기'와 '2차 피해 예방'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s6_agency",
      "role": "fact",
      "video": "owl_v2_ep33_s6_agency_motion.mp4",
      "narration": "금융당국도 지난 6일 소비자경보를 주의로 올리고 금융회사에 한 달간 특별대응기간을 운영하게 했어.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '금융당국 소비자경보'와 '주의 단계'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "key": "s7_timing",
      "role": "fact",
      "video": "owl_v2_ep33_s7_timing_motion.mp4",
      "narration": "발송일은 통신사와 협의 중이라서 문자가 오는 날은 사람마다 다를 수 있어.",
      "imageBrief": "부엉이가 진지하고 또렷한 표정으로 '발송일은'와 '통신사와 협의 중'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep33_s8_core_q_motion.mp4",
      "narration": "그럼 나는 어떻게 해야 할까? 답부터 말하면, 문자 속 링크는 누르지 않고 직접 찾은 경로로 확인하는 거야.",
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
      "video": "owl_v2_ep33_s9_point1_motion.mp4",
      "narration": "첫째, 링크를 조심해. 쉽게 풀면, 출처가 불분명한 인터넷 주소는 누르지도, 앱을 설치하지도 않는 거지.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '첫째 링크'와 '누르지도 설치도 X'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep33_s10_point2_motion.mp4",
      "narration": "둘째, 정보 요구를 의심해. 쉽게 풀면, 개인정보를 달라거나 송금을 시키면 일단 의심하는 거야.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '둘째 정보 요구'와 '일단 의심하기'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만.",
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
      "video": "owl_v2_ep33_s11_point3_motion.mp4",
      "narration": "셋째, 사칭 수법을 알아 둬. 쉽게 풀면, 금리나 대출 한도를 조정해 준다거나 유출 보상을 해 준다며 접근해.",
      "imageBrief": "부엉이가 또렷하고 친근한 표정으로 '셋째 사칭 수법'와 '금리·대출 조정'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
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
      "key": "s12_caution",
      "role": "condition",
      "video": "owl_v2_ep33_s12_caution_motion.mp4",
      "narration": "그렇다고 문자 속 번호나 링크로 바로 확인하면 안 돼. 확인은 내가 직접 찾은 고객센터로 해야 하거든.",
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
      "scene": 13,
      "key": "s13_report",
      "role": "action",
      "video": "owl_v2_ep33_s13_report_motion.mp4",
      "narration": "의심스러우면 해당 금융기관 고객센터에 묻고, 범죄가 의심되면 112나 통합대응단에 연락해.",
      "imageBrief": "부엉이가 확신에 찬 표정으로 '의심되면'와 '고객센터·112'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄(둘째 줄이 길어도 카드 밖으로 넘치지 않게), 카드에 그림·화살표 없이 글자만.",
      "overlays": [],
      "shot": "medium",
      "bg": "C",
      "motion": {
        "type": "card2",
        "action": "confident and knowing with slight nods; only the face and body move while the wings holding the card stay still.",
        "mood": "confidently delivering the key point"
      }
    },
    {
      "scene": 14,
      "key": "s14_summary",
      "role": "action",
      "video": "owl_v2_ep33_s14_summary_motion.mp4",
      "narration": "콕 집어 정리하면, 경고 문자가 와도 링크 대신 내가 직접 찾은 경로로 확인해야 해. 지금 먼저 확인할 건 두 가지야.",
      "imageBrief": "부엉이가 확신에 찬 표정으로 '직접 찾은 경로로'와 '확인하세요'가 두 줄로 크게 적힌 카드를 두 날개로 감싸 쥐고 보여주는 자세. 구도(반드시): 카드는 납작한 가로형 — 높이는 이미지 세로의 15% 이하, 폭은 가로의 55% 이하. 턱 바로 아래 가슴 윗부분에 붙여 들고 카드 전체가 세로 42~60% 안에 들어오게(카드가 배꼽·허리 높이로 내려가면 실패). 카드 글자는 굵고 크게 두 줄, 카드에 그림·화살표 없이 글자만. 카드 글자를 카드 안에 최대한 크게(카드 높이의 70% 이상 채우게) 쓰고, 카드는 턱 바로 아래 가슴 윗부분으로 더 높이 들어 올릴 것(카드 아래 끝이 세로 58%를 넘지 않게).",
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
      "video": "owl_v2_ep33_s15_check_two_motion.mp4",
      "narration": "하나는 출처를 모르는 링크와 앱 설치를 막는 거고, 다른 하나는 의심되면 공식 고객센터에 묻는 거야.",
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
      "video": "owl_v2_ep33_s16_save_motion.mp4",
      "narration": "이 두 가지는 저장해 두고, 가족에게도 알려 줘. 궁금한 제도는 댓글로 남겨줘.",
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
export function findOWLEP33Scene(key) {
  return OWL_EP33_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
