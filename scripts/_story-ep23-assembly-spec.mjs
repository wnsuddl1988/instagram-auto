/**
 * 스토리형 23편 — 유일한의 유언 — 아들에게는 '자립해서 살아라', 주식은 신탁기금으로 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep23-yuhan/scenes-v1.json`. 설계 `C:/tmp/story-ep23-yuhan/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep23-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep23-assembly-spec.mjs --scene-spec-export STORY_EP23_SEMI_SPEC --out-dir C:/tmp/story-ep23-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep23-assembly-spec.mjs --scene-spec-export STORY_EP23_END_SPEC --out-dir C:/tmp/story-ep23-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP23_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 23,
  displayEpisode: 23,
  sourceCandidate: "story-ep23-yuhan-will-1971",
  title: "유일한의 유언 — 아들에게는 '자립해서 살아라', 주식은 신탁기금으로",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep23",
  storyStyleOnlyIdentity:
    "1960~70년대 한국 제약 회사 본사와 주주총회장, 서재와 학교 뒷동산을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(창업주·가족·직원)을 닮게 그리지 않고, 실제 회사 로고와 상표를 흉내 내지 않아(건물과 서류는 글자 없는 색 덩어리). 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "서재 책상 위 접힌 유언장과 빈 의자(1번)", image: "오래된 서재 책상 위에 접힌 종이 한 장과 만년필이 놓여 있고 맞은편 의자는 비어 있다. 사람 없음. 글자·숫자 없음. 따뜻한 스탠드 빛.", videoStyle: "an old study desk with one folded sheet of paper and a fountain pen and an empty chair opposite, no people, no text, warm desk lamp light", videoStatics: "the desk, the paper, the pen, the chair, and the lamp light" },
    B: { label: "1970년대 제약 회사 본사 현관과 빈 액자(2번)", image: "1970년대 풍의 회사 본사 건물 현관 앞에 빈 액자 하나가 벽에 걸려 있다. 사람 없음. 글자·로고 없음. 차분한 낮빛.", videoStyle: "the entrance of a 1970s-style company headquarters with one empty picture frame on the wall, no people, no text or logos, calm daylight", videoStatics: "the entrance, the frame, and the daylight" },
    C: { label: "닫힌 문 앞에 선 두 사람의 뒷모습(3번)", image: "회사 건물의 닫힌 큰 문 앞에 두 사람이 뒷모습으로 나란히 서 있다(얼굴 안 보임). 글자 없음. 낮은 조명.", videoStyle: "two people seen from behind standing side by side in front of the closed large door of a company building, no text, low lighting", videoStatics: "the door, the building wall, and the lighting" },
    D: { label: "숫자 없는 큰 전광판 앞에서 주식 증서를 든 직원들(4번)", image: "숫자와 글자가 없는 큰 전광판 무늬 앞에서 직원들이 뒷모습으로 주식 증서를 들고 서 있다(얼굴 안 보임). 글자·숫자 없음. 밝은 조명.", videoStyle: "employees seen from behind holding share certificates in front of a large blank electronic board with no numerals or text, bright lighting", videoStatics: "the board, the floor, and the lighting" },
    E: { label: "회사 건물 모형을 여러 사람이 나눠 든 손(5번)", image: "탁자 위 작은 회사 건물 모형의 조각들을 여러 사람의 손이 하나씩 나눠 들고 있다. 손만 보임. 글자·숫자 없음. 환한 조명.", videoStyle: "close view of several hands each holding a piece of a small company building model on a table, hands only, no text or numerals, bright lighting", videoStatics: "the table, the model pieces, and the lighting" },
    F: { label: "주주총회 단상에서 명패를 새 경영인에게 건네는 장면(6번)", image: "주주총회 단상에서 한 노신사가 뒷모습으로 글자 없는 사장 명패를 다른 사람에게 건넨다(두 사람 모두 얼굴 안 보임). 글자 없음. 밝은 조명.", videoStyle: "on a shareholders' meeting stage, an elderly man seen from behind handing a plain nameplate without text to another person also seen from behind, bright lighting", videoStatics: "the stage, the nameplate, and the lighting" },
    G: { label: "회의실 문 앞에서 서류 가방을 들고 돌아서는 사람(7번)", image: "회의실 문 앞에서 서류 가방을 든 젊은 사람이 뒷모습으로 천천히 돌아선다(얼굴 안 보임). 글자 없음. 낮은 조명.", videoStyle: "a young person seen from behind carrying a briefcase turning away from a meeting-room door, no text, low lighting", videoStatics: "the door, the corridor, and the lighting" },
    H: { label: "사무실 한쪽 가족사진 액자와 빈 책상(8번)", image: "사무실 책상 위에 얼굴 없는 흐린 실루엣만 있는 가족사진 액자가 세워져 있고 책상 의자는 비어 있다. 사람 없음. 글자 없음.", videoStyle: "close view of a desk with a family photo frame showing only blurred silhouettes without faces and an empty chair, no people, no text", videoStatics: "the desk, the frame, the chair, and the lighting" },
    I: { label: "유언장 위에 놓인 작은 학사모와 땅 문서(9번)", image: "탁자 위 종이 위에 작은 학사모 소품과 접힌 땅 문서 한 장이 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 따뜻한 빛.", videoStyle: "close view of a small graduation cap prop and a folded land document side by side on a sheet of paper on a table, no people, no text or numerals, warm light", videoStatics: "the table, the paper, the cap, the document, and the light" },
    J: { label: "학생들이 거니는 푸른 학교 뒷동산과 벤치(10번)", image: "푸른 학교 뒷동산 벤치 주변을 학생들이 멀리 작은 모습의 뒷모습으로 거닌다(얼굴 안 보임). 글자 없음. 맑은 낮.", videoStyle: "students seen far away from behind strolling around benches on a green school hill, no text, clear daytime", videoStatics: "the hill, the benches, and the trees" },
    K: { label: "금고 문 앞에 놓인 주식 증서 다발(11번)", image: "열린 금고 문 앞에 묶인 주식 증서 다발이 놓여 있다. 사람 없음. 글자·숫자 없음. 낮은 조명.", videoStyle: "close view of a bundle of share certificates in front of an open safe door, no people, no text or numerals, low lighting", videoStatics: "the safe, the bundle, and the lighting" },
    L: { label: "신탁기금 서류함에 증서 다발을 넣는 손(12번)", image: "서류함 서랍에 한 손이 묶인 주식 증서 다발을 넣는다. 손만 보임. 글자·숫자 없음. 따뜻한 조명.", videoStyle: "close view of one hand placing a bundle of share certificates into a file cabinet drawer, hand only, no text or numerals, warm lighting", videoStatics: "the cabinet, the drawer, and the lighting" },
    M: { label: "장학증서를 받는 학생과 복지 현장의 손길(13번)", image: "강당에서 한 학생이 뒷모습으로 글자 없는 장학증서를 두 손으로 받고, 옆에서 다른 손이 도시락을 건넨다(얼굴 안 보임). 글자 없음.", videoStyle: "in a hall, a student seen from behind receiving a plain scholarship certificate with both hands while another hand passes a lunch box, no text", videoStatics: "the hall and the lighting" },
    N: { label: "글자 없는 석조 입구 앞 작은 꽃 한 송이(14번)", image: "글자 없는 석조 건물 입구 계단 위에 작은 꽃 한 송이가 놓여 있다. 사람 없음. 글자 없음. 부드러운 빛.", videoStyle: "close view of a single small flower on the steps of a plain stone building entrance, no people, no text, soft light", videoStatics: "the steps, the flower, and the soft light" },
    O: { label: "책상 위 회사 건물 모형 옆 주식 증서와 월급 봉투(15번)", image: "책상 위에 작은 회사 건물 모형과 그 옆에 주식 증서 한 장과 월급 봉투가 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명.", videoStyle: "a desk with a small company building model and beside it a share certificate and a pay envelope side by side, no people, no text or numerals, bright lighting", videoStatics: "the desk, the model, the certificate, the envelope, and the lighting" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep23_s1_hook_motion.mp4",
      narration: "아들에게 남긴 유언이 '대학까지 졸업시켰으니 자립해서 살아가거라' 한 줄뿐인 창업주가 있었어.",
      imageBrief: "오래된 서재 책상 위에 접힌 종이 한 장과 만년필이 놓여 있고 맞은편 의자는 비어 있다. 사람 없음. 글자·숫자 없음. 따뜻한 스탠드 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "A",
      lock: "no people appear; the paper keeps no text; the chair stays empty.",
      motion: motion("the lamp light flickers gently over the folded paper, the desk and the chair stay completely still", "a short will") },
    { scene: 2, key: "s2_who", role: "evidence", video: "story_ep23_s2_who_motion.mp4",
      narration: "유한양행을 세운 유일한이야. 그는 1971년에 세상을 떠났지.",
      imageBrief: "1970년대 풍의 회사 본사 건물 현관 앞에 빈 액자 하나가 벽에 걸려 있다. 사람 없음. 글자·로고 없음. 차분한 낮빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "B",
      lock: "no people appear; the building keeps no text or logos; the frame stays empty.",
      motion: motion("a soft shadow of passing clouds crosses the entrance, the building and the frame stay completely still", "the founder's company") },
    { scene: 3, key: "s3_whyq", role: "core_question", video: "story_ep23_s3_whyq_motion.mp4",
      narration: "회사를 일군 사람이, 왜 그 회사를 아들에게 남기지 않았을까?",
      imageBrief: "회사 건물의 닫힌 큰 문 앞에 두 사람이 뒷모습으로 나란히 서 있다(얼굴 안 보임). 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "C",
      lock: "the people stay seen from behind with no face ever shown; the door keeps no text or logos; nobody else enters.",
      motion: motion("one person lowers his head slightly while the other looks at the door, the door and the wall stay completely still", "why not hand it down") },
    { scene: 4, key: "s4_listing", role: "evidence", video: "story_ep23_s4_listing_motion.mp4",
      narration: "아들을 뺀 건 유언이 처음이 아니었어. 1962년, 유한양행은 제약업계 처음으로 주식을 증권시장에 상장했지.",
      imageBrief: "숫자와 글자가 없는 큰 전광판 무늬 앞에서 직원들이 뒷모습으로 주식 증서를 들고 서 있다(얼굴 안 보임). 글자·숫자 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "D",
      lock: "the people stay seen from behind with no face ever shown; the certificates and the board keep no text or numerals; nobody else enters.",
      motion: motion("the employees raise the certificates slightly and lower them, the board and the floor stay completely still", "going public") },
    { scene: 5, key: "s5_split", role: "evidence", video: "story_ep23_s5_split_motion.mp4",
      narration: "주식을 나누면 회사는 한 집안의 것이 아니게 돼. 그는 돈을 대는 일과 경영을 나누는 쪽을 택했어.",
      imageBrief: "탁자 위 작은 회사 건물 모형의 조각들을 여러 사람의 손이 하나씩 나눠 들고 있다. 손만 보임. 글자·숫자 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "E",
      lock: "no face or body appears — only the hands; the model keeps no text or numerals; the table stays fixed.",
      motion: motion("the hands each lift a piece slightly and hold it, the table stays completely still", "ownership shared") },
    { scene: 6, key: "s6_retire", role: "evidence", video: "story_ep23_s6_retire_motion.mp4",
      narration: "1969년에는 부사장이던 아들을 비롯한 친인척을 경영에서 물러나게 하고, 사장 자리는 전문 경영인에게 맡겼지.",
      imageBrief: "주주총회 단상에서 한 노신사가 뒷모습으로 글자 없는 사장 명패를 다른 사람에게 건넨다(두 사람 모두 얼굴 안 보임). 글자 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "F",
      lock: "the people stay seen from behind with no face ever shown; the nameplate keeps no text; nobody else enters.",
      motion: motion("the nameplate passes from one hand to the other, the stage and the background stay completely still", "handing over management") },
    { scene: 7, key: "s7_whyson", role: "core_question", video: "story_ep23_s7_whyson_motion.mp4",
      narration: "왜 아들까지 경영에서 물러나게 했을까?",
      imageBrief: "회의실 문 앞에서 서류 가방을 든 젊은 사람이 뒷모습으로 천천히 돌아선다(얼굴 안 보임). 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "G",
      lock: "the people stay seen from behind with no face ever shown; the door keeps no text or numerals; nobody else enters.",
      motion: motion("the person turns slowly away from the door and walks one step, the corridor and the door stay completely still", "why even him") },
    { scene: 8, key: "s8_relatives", role: "evidence", video: "story_ep23_s8_relatives_motion.mp4",
      narration: "친척이 회사에 있으면 회사 발전에 지장을 받는다는 게 그의 생각이었다고 해.",
      imageBrief: "사무실 책상 위에 얼굴 없는 흐린 실루엣만 있는 가족사진 액자가 세워져 있고 책상 의자는 비어 있다. 사람 없음. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no people appear; the frame shows no faces or text; the chair stays empty.",
      motion: motion("a soft light slowly slides across the frame, the desk and the chair stay completely still", "family and work apart") },
    { scene: 9, key: "s9_will", role: "evidence", video: "story_ep23_s9_will_motion.mp4",
      narration: "유언장에는 손녀의 학자금 1만 달러와, 딸에게 맡긴 땅 5,000평이 적혀 있었어.",
      imageBrief: "탁자 위 종이 위에 작은 학사모 소품과 접힌 땅 문서 한 장이 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 따뜻한 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "I",
      lock: "no people appear; the papers keep no text or numerals; the table stays fixed.",
      motion: motion("a soft warm light settles over the cap and the document, the table stays completely still", "what was left") },
    { scene: 10, key: "s10_garden", role: "evidence", video: "story_ep23_s10_garden_motion.mp4",
      narration: "딸에게 간 땅도 개인 재산이 아니라, 학생들이 자유롭게 쓰는 유한동산이 됐지.",
      imageBrief: "푸른 학교 뒷동산 벤치 주변을 학생들이 멀리 작은 모습의 뒷모습으로 거닌다(얼굴 안 보임). 글자 없음. 맑은 낮. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "wide", bg: "J",
      lock: "the people stay seen from behind with no face ever shown; nothing carries text; nobody else enters.",
      motion: motion("the students stroll slowly along the path, the hill and the benches stay completely still", "land for students") },
    { scene: 11, key: "s11_stockq", role: "core_question", video: "story_ep23_s11_stockq_motion.mp4",
      narration: "그럼 회사 주식은 누구 몫이 됐을까?",
      imageBrief: "열린 금고 문 앞에 묶인 주식 증서 다발이 놓여 있다. 사람 없음. 글자·숫자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "K",
      lock: "no people appear; the certificates keep no text or numerals; the safe stays fixed.",
      motion: motion("a soft light slowly brightens on the bundle, the safe stays completely still", "whose share") },
    { scene: 12, key: "s12_donate", role: "evidence", video: "story_ep23_s12_donate_motion.mp4",
      narration: "유일한은 자기 몫의 주식 14만 941주를 전부 신탁기금에 기증했어.",
      imageBrief: "서류함 서랍에 한 손이 묶인 주식 증서 다발을 넣는다. 손만 보임. 글자·숫자 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no face or body appears — only the hand; the certificates keep no text or numerals; the cabinet stays fixed.",
      motion: motion("the hand slides the bundle in and withdraws, the cabinet stays completely still", "given away") },
    { scene: 13, key: "s13_foundation", role: "evidence", video: "story_ep23_s13_foundation_motion.mp4",
      narration: "이 기금은 훗날 유한재단이 되어 장학과 복지 사업을 맡았지.",
      imageBrief: "강당에서 한 학생이 뒷모습으로 글자 없는 장학증서를 두 손으로 받고, 옆에서 다른 손이 도시락을 건넨다(얼굴 안 보임). 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "M",
      lock: "the people stay seen from behind with no face ever shown; the certificate keeps no text; nobody else enters.",
      motion: motion("the student bows slightly and holds the certificate, the hall stays completely still", "help carried on") },
    { scene: 14, key: "s14_daughter", role: "evidence", video: "story_ep23_s14_daughter_motion.mp4",
      narration: "딸도 세상을 떠나기 전, 200억 원쯤 되는 전 재산을 이 재단에 기증했어.",
      imageBrief: "글자 없는 석조 건물 입구 계단 위에 작은 꽃 한 송이가 놓여 있다. 사람 없음. 글자 없음. 부드러운 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "N",
      lock: "no people appear; the building keeps no text; the steps stay fixed.",
      motion: motion("a gentle breeze moves the petals slightly, the steps stay completely still", "continuing the will") },
    { scene: 15, key: "s15_money", role: "evidence", video: "story_ep23_s15_money_motion.mp4",
      narration: "회사가 번 돈의 일부는, 그 회사의 주식을 쥔 사람 몫으로 돌아가.",
      imageBrief: "책상 위에 작은 회사 건물 모형과 그 옆에 주식 증서 한 장과 월급 봉투가 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "O",
      lock: "no people appear; the paper items keep no text or numerals; the desk stays fixed.",
      motion: motion("a gentle light slides over the model and the papers, the desk stays completely still", "where the earnings go") },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP23_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 23,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep23",
  sceneBackgrounds: Object.freeze({
    P: { label: "회사 앞 광장(16번 부엉박사)", image: "밝은 오후 한국 회사 건물 앞 광장. 부엉박사 뒤로 글자 없는 회사 건물과 열린 현관, 바닥에 놓인 서류 상자 두 개(글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 빛.", videoStyle: "bright afternoon on the plaza in front of a Korean company building with a plain facade, an open entrance, and two plain document boxes on the ground, smooth light gray pavement", videoStatics: "the building, the open entrance, the two boxes, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep23_s16_close_motion.mp4",
      narration: "내가 일하는 회사의 주인이 누구인지 알아 두는 것도 내 돈 공부야. 유한양행의 다음 이야기가 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the building and the boxes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep23-assembly-spec.mjs --spec-export STORY_EP23_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep23-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep23-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep23-tts/story-ep23-tts-script.json --out-dir C:/tmp/story-ep23-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP23_FULL_SPEC = Object.freeze({
  ...STORY_EP23_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP23_SEMI_SPEC.sceneBackgrounds, ...STORY_EP23_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP23_SEMI_SPEC.scenes, ...STORY_EP23_END_SPEC.scenes]),
});

export const STORY_EP23_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP23_FULL_SPEC,
  headerTitle: Object.freeze(["아들에겐 자립,","주식은 사회로","유일한의 유언"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["유언","주식","1969","14만 941주","200억"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP23_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
