/**
 * 스토리형 3편 — 현대 조선소 500원 지폐 일화 재연 장면 스펙 (2026-10-07).
 *
 * 기준: `_ai/story-format-structure-v1.md` + 현대 v2 대본 `C:/tmp/story-ep3-hyundai/hyundai-scenes-v1.json`(16장면 676자, Owner 확정 2026-10-07).
 * 설계 `C:/tmp/story-ep3-hyundai/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep3-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed.json`(106.85초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형):
 *  - 화면에 글자·숫자·로고를 넣지 않는다(숫자는 자막이 맡는다). 지폐·지도·설계도·깃발도 무늬만.
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - 인물이 나오는 장면은 얼굴·머리를 세로 45% 아래에(FACE_SAFE), 위 40%는 배경만(영상 위 제목이 얼굴을 덮은 1편 교훈).
 *  - 실존 인물을 닮게 그리지 않는다: 주인공은 "50대 한국 남성 사업가", 롱바텀은 "70대 영국 남성 회장" 같은 일반적인 인물로, 이름·닮음 지시 없음.
 *  - 1970년대 배경(두꺼운 원목 가구·타자기·유선 전화·황동 스탠드), 실제 회사·은행·정부 로고·이름은 화면에 쓰지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep3-assembly-spec.mjs --scene-spec-export STORY_EP3_SEMI_SPEC --out-dir C:/tmp/story-ep3-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep3-assembly-spec.mjs --scene-spec-export STORY_EP3_END_SPEC --out-dir C:/tmp/story-ep3-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고는 하나도 넣지 마(간판·서류·지폐·지도·깃발·포장 모두 무늬만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 얼굴과 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·얼굴·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해. 인물은 가슴 위가 아니라 허리 위까지 아래쪽 절반에 넉넉히 담아.";

const JUNG = "50대 중반 한국 남성 사업가(짧은 검은 머리를 뒤로 빗어 넘김, 단단한 체격, 짙은 남색 양복에 어두운 넥타이)";
const BANKER = "60대 영국 남성 은행가(회색 머리, 짙은 회색 줄무늬 양복, 조끼)";
const LONGBOTTOM = "70대 영국 남성 회장(하얀 머리, 금테 안경, 갈색 트위드 재킷에 체크무늬 셔츠)";

export const STORY_EP3_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 3,
  displayEpisode: 3,
  sourceCandidate: "story-ep3-hyundai-500won-1971",
  title: "정주영 500원 지폐 — 모래밭 사진으로 은행을 움직인 조선소",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep3",
  storyStyleOnlyIdentity:
    "1970년대를 배경으로 한 재연 장면 시리즈의 첫 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    `한국인 사업가가 장면 설명에 나오면 앞에서 만든 그 인물(${JUNG})과 얼굴·머리·옷이 똑같아야 해(처음 나오는 장면은 이 설명대로 그려). ` +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "1971년 런던 은행 회의실(1·2·3번)",
      image: "1971년 영국 은행의 어두운 원목 패널 회의실. 긴 마호가니 회의 탁자, 가죽 의자들, 한쪽 큰 창밖에 흐린 회색 하늘과 오래된 석조 건물, 탁자 위 황동 스탠드 하나, 바닥은 짙은 녹색 카펫.",
      videoStyle: "dark wood-paneled 1971 British bank meeting room with a grey London view",
      videoStatics: "the long mahogany table, the leather chairs, the large window with the grey sky and old stone buildings, the brass lamp, and the dark green carpet",
    },
    B: {
      label: "영국 선박 컨설팅 회장 사무실(4·5·6번)",
      image: "1970년대 영국 선박 컨설팅 회사 회장 사무실. 큰 원목 책상과 녹색 가죽 의자, 벽 선반에 글자 없는 작은 배 모형들이 줄지어 있고, 창밖으로 강과 부두 크레인이 보이며, 책상 위에 타자기와 황동 스탠드, 바닥은 짙은 갈색 카펫.",
      videoStyle: "warm 1970s British ship-consultancy chairman's office with ship models on the shelves",
      videoStatics: "the large wooden desk, the green leather chair, the shelf of plain ship models, the window with the river and dock cranes, the typewriter, the brass lamp, and the dark brown carpet",
    },
    C: {
      label: "영국 정부 보증 기관 사무실(7번)",
      image: "1970년대 영국 정부 기관의 높은 천장 사무실. 큰 원목 책상 위에 녹색 갓 스탠드와 도장 받침대, 뒤쪽에 철제 서류 캐비닛들, 무거운 커튼이 걸린 키 큰 창, 바닥은 짙은 회색 카펫.",
      videoStyle: "high-ceilinged 1970s British government office with filing cabinets",
      videoStatics: "the large wooden desk with the green lamp and the stamp pad, the steel filing cabinets, the tall window with heavy curtains, and the dark gray carpet",
    },
    D: {
      label: "선주 사무실(8·9번)",
      image: "1970년대 선주 회사 사무실. 둥근 원목 탁자 위에 글자 없는 유조선 모형 두 척이 놓여 있고, 벽 선반에 작은 배 모형들, 큰 창밖에 바다와 항구, 바닥은 밝은 베이지 카펫, 따뜻한 오후 햇빛.",
      videoStyle: "warm 1970s shipowner's office with tanker models on a round table and a harbor view",
      videoStatics: "the round wooden table with the two plain tanker models, the shelf of small ship models, the large window with the sea and harbor, and the light beige carpet",
    },
    E: {
      label: "울산 모래밭 기공식(10번)",
      image: "맑은 날 울산 바닷가의 넓은 모래밭. 모래 위에 삽 다섯 자루가 일렬로 꽂힐 자리가 있고, 뒤로 푸른 바다와 낮은 산, 글자 없는 흰 천막 하나와 무늬 없는 단색 짙은 남색 삼각 페넌트(줄무늬·십자·별 없음, 실제 나라 국기와 닮지 않게) 여러 개.",
      videoStyle: "bright clear-day Ulsan sandy shoreline groundbreaking site with the blue sea behind",
      videoStatics: "the wide sandy field, the blue sea and low hills behind, the plain white tent, and the small plain flags",
    },
    F: {
      label: "건설 중인 조선소(11번)",
      image: "건설 중인 대형 조선소 전경. 왼쪽에는 철골 비계와 크레인이 서 있고 맨땅이 남아 있으며, 가운데에 막 완성된 도크 일부 위에 유조선 선체 블록이 첫 줄로 놓여 있고, 푸른 하늘과 바다. 작업자는 아주 작게 보인다.",
      videoStyle: "wide view of a half-built giant shipyard with cranes and the first hull blocks on a finished part of the dock",
      videoStatics: "the steel scaffolding and cranes, the bare ground, the finished part of the dock with the first tanker hull blocks, the blue sky and sea",
    },
    G: {
      label: "도크 위 선체 용접(12번)",
      image: "도크 위에 세워지는 거대한 철판 선체 안쪽. 용접 마스크를 쓴 작업자 두 명이 철판을 용접하며 주황색 불꽃이 튀고, 뒤로 아직 덜 지어진 도크 가장자리와 크레인이 보이며, 연기와 먼지가 햇빛에 비친다.",
      videoStyle: "inside a rising steel tanker hull on a half-finished dock with welding sparks",
      videoStatics: "the giant steel hull plates, the unfinished dock edge, the cranes behind, and the sunlit dust",
    },
    H: {
      label: "1974년 준공식(13번)",
      image: "맑은 날 거대한 유조선 선체가 놓인 조선소 도크 앞 준공식. 앞쪽에 붉은 테이프가 가로로 걸려 있고, 정장 입은 관계자들이 줄지어 서 있으며, 뒤로 선체가 하늘을 가릴 만큼 크다. 글자 없는 무늬 없는 단색 짙은 남색 삼각 페넌트(줄무늬·십자·별 없음, 실제 나라 국기와 닮지 않게)들이 바람에 흔들린다.",
      videoStyle: "bright clear-day shipyard completion ceremony in front of a giant tanker hull",
      videoStatics: "the giant tanker hull behind, the red ribbon across the front, the row of officials in suits, and the plain flags",
    },
    I: {
      label: "현대 조선소 전경(14번)",
      image: "황금빛 석양의 대형 조선소 전경. 도크마다 거대한 컨테이너선과 유조선이 줄지어 있고 높은 겐트리 크레인들이 늘어서 있으며, 바다 위 하늘이 주황빛이다. 사람은 없고 글자·로고도 없다.",
      videoStyle: "golden-hour aerial view of a huge modern shipyard with rows of giant ships and gantry cranes",
      videoStatics: "the rows of giant ships in the docks, the tall gantry cranes, the sea, and the orange sky",
    },
    J: {
      label: "원목 탁자 위 소품(15번)",
      image: "따뜻한 조명의 원목 탁자 위. 가운데에 낡은 갈색 지폐 한 장(글자 없이 등껍질처럼 둥글게 덮인 지붕에 뾰족한 쇠못이 돋고 앞에 용머리가 달린 돛 없는 한국 거북선 그림만), 왼쪽에 봉투 한 장(글자 없음), 오른쪽에 글자 없는 작은 유조선 모형 하나, 앞쪽에 흰 안전모 하나가 가지런히 놓여 있다. 사람 없음. 뒤는 부드럽게 어두운 배경.",
      videoStyle: "warm-lit wooden tabletop still life with an old banknote, an envelope, a tanker model and a white hard hat",
      videoStatics: "the old banknote with the plain turtle-ship pattern, the plain envelope, the plain tanker model, the white hard hat, and the wooden table",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep3_s1_hook_motion.mp4",
      narration: "현대를 만든 정주영은 조선소를 지을 돈을 구하러 영국에 갔어. 가진 건 모래밭 사진과 도면뿐인데, 지갑에서 500원짜리 지폐를 꺼냈지.",
      imageBrief: `영국 은행 회의실 긴 탁자 앞에 ${JUNG}이 서서 낡은 갈색 지폐 한 장을 두 손으로 가슴 앞에 펴 들고 있다(지폐에는 글자 없이 등껍질처럼 둥글게 덮인 지붕에 뾰족한 쇠못이 돋고 앞에 용머리가 달린 돛 없는 한국 거북선 그림만). 탁자 위에는 모래밭을 찍은 낡은 흑백 사진 한 장과 말아 놓은 도면 한 통이 놓여 있다. 표정은 침착하고 단호하다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the banknote stays held in both hands with only its plain turtle-ship pattern and never gains text or numbers; the black-and-white photo and the rolled blueprint stay lying on the table at the same spot; his short slicked-back black hair and dark navy suit never change; nobody else appears.",
      motion: motion("the man slowly breathes and lifts the banknote a little higher with both hands while looking straight ahead, the table props stay completely still, the window light stays steady", "quiet determination"),
    },
    {
      scene: 2, key: "s2_ask", role: "evidence", video: "story_ep3_s2_ask_motion.mp4",
      narration: "1971년, 영국 은행에 요청한 돈은 4,300만 달러였어. 그해 한국이 한 해 수출로 번 돈의 4%쯤이었지.",
      imageBrief: `은행 회의실 탁자 한쪽에 ${JUNG}이 두꺼운 서류철을 두 손으로 탁자 건너편으로 내밀고, 맞은편에서 ${BANKER}이 두 손으로 그 서류철을 받는 순간이다. 탁자 위에는 황동 스탠드가 켜져 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the thick folder stays held by both men's hands between them and its cover stays plain with no text; the brass lamp, the window and the leather chairs stay fixed; both men keep the same clothes and nobody else enters.",
      motion: motion("the Korean man slowly pushes the folder forward with both hands and the banker takes it with both hands and gives a small serious nod, the lamp light and the window stay steady", "a big request"),
    },
    {
      scene: 3, key: "s3_refuse", role: "evidence", video: "story_ep3_s3_refuse_motion.mp4",
      narration: "그런데 은행은 거절했어. 은행은 돈을 갚을 수 있는지를 보는데, 현대는 조선 능력도 기술도 부족해 보였거든.",
      imageBrief: `은행 회의실. ${BANKER}이 두 손으로 서류철을 탁자 건너편으로 되밀어 돌려주며 고개를 가로젓는다. 맞은편에 ${JUNG}이 앉아 굳은 표정으로 서류철을 내려다본다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the folder stays plain with no text and slides only slightly across the table; the banker shakes his head slowly and keeps his hands on the folder; the lamp, window and chairs stay fixed; nobody else enters.",
      motion: motion("the banker slowly shakes his head and pushes the folder back across the table with both hands, the Korean man looks down at it with a tight jaw, the room stays completely still", "firm refusal"),
    },
    {
      scene: 4, key: "s4_longbottom", role: "evidence", video: "story_ep3_s4_longbottom_motion.mp4",
      narration: "그래서 은행에 영향력이 큰 사람을 찾아갔어. 영국 선박 컨설팅 회사의 롱바텀 회장이었지. 그도 처음엔 고개를 저었어.",
      imageBrief: `회장 사무실 큰 원목 책상 뒤에 ${LONGBOTTOM}이 앉아 고개를 가로저으며 손바닥을 펴 보이고, 책상 앞 의자에 ${JUNG}이 앉아 서류철을 무릎 위에 두 손으로 얹고 설득하는 표정으로 이야기한다. 뒤 선반에 글자 없는 배 모형들이 보인다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "B",
      lock: "the ship models on the shelf stay fixed with no text; the folder stays on the Korean man's knees under both hands; the old chairman keeps his white hair, gold glasses and brown tweed jacket; nobody else enters.",
      motion: motion("the old chairman slowly shakes his head and spreads one hand palm up in doubt while the Korean man speaks earnestly with the folder on his knees, the ship models and the window stay still", "polite doubt"),
    },
    {
      scene: 5, key: "s5_banknote", role: "evidence", video: "story_ep3_s5_banknote_motion.mp4",
      narration: "그때 정주영이 지폐 속 거북선을 가리켰어. 한국은 영국보다 먼저 철갑선을 만든 나라라고 했다고 전해져.",
      imageBrief: `회장 사무실 책상 위에 낡은 갈색 지폐 한 장이 놓여 있고, ${JUNG}의 한 손 검지가 지폐 속 작은 거북선 무늬를 가리킨다. 맞은편에서 ${LONGBOTTOM}의 두 손이 책상 위에서 깍지 낀 채 지폐를 내려다본다. 두 사람 다 얼굴은 그리지 마(손과 소품만). 지폐에는 글자·숫자 없이 등껍질처럼 둥글게 덮인 지붕에 뾰족한 쇠못이 돋고 앞에 용머리가 달린 돛 없는 한국 거북선 그림만(둥근 장식 무늬 포함). ` + NO_TEXT,
      shot: "close", bg: "B",
      lock: "no face or head ever appears — only the pointing finger, the clasped hands and the sleeves; the banknote lies on the desk and keeps only its plain turtle-ship picture with no text or numbers; the typewriter and brass lamp stay fixed.",
      motion: motion("the finger taps once beside the turtle-ship picture on the banknote and holds there, the old clasped hands tighten slightly, the lamp light flickers faintly", "a quiet appeal"),
    },
    {
      scene: 6, key: "s6_letter", role: "evidence", video: "story_ep3_s6_letter_motion.mp4",
      narration: "롱바텀은 현대건설을 둘러본 뒤 추천서를 써서 영국 은행에 건넸어.",
      imageBrief: `회장 사무실 책상 앞에 ${LONGBOTTOM}이 앉아 만년필로 편지지에 서명을 마치고, 그 옆에 봉투가 놓여 있다. 편지지에는 읽을 수 있는 글자 없이 가는 줄무늬만 있다. 표정은 차분하고 확신에 차 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "B",
      lock: "the letter paper keeps only plain faint lines and a scribble signature with no readable text; the envelope stays beside it; his white hair, gold glasses and brown tweed jacket never change; the ship models and the window stay fixed.",
      motion: motion("the old chairman finishes the signature, lifts the pen and gives a small satisfied nod, then slides the letter toward the envelope with one hand, the room stays still", "confident endorsement"),
    },
    {
      scene: 7, key: "s7_guarantee", role: "evidence", video: "story_ep3_s7_guarantee_motion.mp4",
      narration: "은행은 차관을 주기로 했지만, 영국 정부의 보증 기관이 한 번 더 막았어. 못 갚으면 정부가 대신 물어 줘야 하니까, 배를 사 줄 선주가 있다는 증명을 가져오라고 했지.",
      imageBrief: `정부 기관 사무실 큰 책상 뒤에 50대 영국 남성 공무원(짙은 감색 양복, 안경)이 앉아 큰 도장을 두 손으로 쥐고 빈 서류 위에서 멈춘 채 고개를 가로젓는다. 맞은편에 ${JUNG}이 앉아 진지하게 듣는다. 서류에는 글자 없이 빈 칸 무늬만. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "C",
      lock: "the stamp stays gripped in both hands hovering above the blank form and never presses down; the form shows only plain empty boxes with no text; the green lamp, the stamp pad and the filing cabinets stay fixed; nobody else enters.",
      motion: motion("the official slowly shakes his head while holding the stamp above the blank form, the Korean man listens with a serious nod, the green lamp light stays steady", "bureaucratic caution"),
    },
    {
      scene: 8, key: "s8_question", role: "core_question", video: "story_ep3_s8_question_motion.mp4",
      narration: "조선소도 없는 회사에 누가 배를 주문할까? 선주들의 반응은 차가웠어.",
      imageBrief: `선주 사무실 둥근 탁자 둘레에 나이 든 유럽 남성 선주 세 명이 팔짱을 끼고 앉아 있다. 탁자 한가운데에 모래밭을 찍은 낡은 흑백 사진 한 장이 놓여 있고, 한 명은 고개를 저으며 한 손을 내저어 사진을 밀어낸다. 탁자 위 유조선 모형은 그대로다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "D",
      lock: "the black-and-white sand-field photo stays lying on the table with no text; the two tanker models stay in place; the three shipowners keep their dark suits and nobody else enters; no logos on anything.",
      motion: motion("the three shipowners shake their heads and fold their arms, one waves a hand dismissively over the photo, the tanker models and the harbor window stay completely still", "cold reception"),
    },
    {
      scene: 9, key: "s9_order", role: "evidence", video: "story_ep3_s9_order_motion.mp4",
      narration: "롱바텀이 소개해 준 길로 그리스 선주 리바노스를 만나, 1971년 10월 유조선 두 척을 주문받았어. 그러자 보증 기관의 승인도 떨어졌지.",
      imageBrief: `선주 사무실 둥근 탁자를 사이에 두고 ${JUNG}과 60대 그리스 남성 선주(은빛 물결 머리, 짙은 정장, 호탕한 미소)가 서서 악수한다. 탁자 위에 글자 없는 유조선 모형 두 척이 나란히 놓여 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "D",
      lock: "the two tanker models stay side by side on the table with no text; the handshake stays firm between the two men for the whole clip; the shelf of ship models and the harbor window stay fixed; nobody else enters.",
      motion: motion("the two men shake hands firmly and the Greek shipowner laughs warmly while the Korean man gives a relieved smile, the tanker models and the window stay still", "a deal at last"),
    },
    {
      scene: 10, key: "s10_groundbreaking", role: "evidence", video: "story_ep3_s10_groundbreaking_motion.mp4",
      narration: "1972년 3월 23일, 울산 모래밭에서 조선소 기공식이 열렸어.",
      imageBrief: "맑은 날 울산 바닷가 모래밭 기공식. 흰 안전모를 쓴 정장 차림 관계자 다섯 명이 일렬로 서서 삽을 두 손으로 쥐고 모래에 꽂는 순간이다. 뒤로 푸른 바다와 낮은 산, 글자 없는 흰 천막과 무늬 없는 단색 짙은 남색 삼각 페넌트(줄무늬·십자·별 없음, 실제 나라 국기와 닮지 않게)들. " + NO_TEXT,
      shot: "wide", bg: "E",
      lock: "the five shovels stay held with both hands in the same line; the plain white tent and the small flags show no text or logos; the sea and hills behind stay fixed; no extra people enter.",
      motion: motion("the five officials in white helmets push their shovels into the sand in unison and lift a little sand, a sea breeze stirs the small flags and their jackets, the tent and hills stay completely still", "decisive groundbreaking"),
    },
    {
      scene: 11, key: "s11_twist", role: "core_question", video: "story_ep3_s11_twist_motion.mp4",
      narration: "보통은 조선소를 다 지은 뒤에 배를 만들지. 그런데 정주영은 조선소를 짓는 동안에도 배를 같이 지었어.",
      imageBrief: "건설 중인 대형 조선소 전경(넓은 구도). 왼쪽은 철골 비계와 크레인이 서 있고 맨땅이 남아 있으며, 가운데에 막 완성된 도크 일부 위에 유조선 선체 철판 블록들이 첫 줄로 놓여 있다. 작업자들은 아주 작게 보이고 푸른 하늘과 바다가 뒤에 있다. " + NO_TEXT,
      shot: "wide", bg: "F",
      lock: "the cranes and scaffolding stay still; the hull blocks stay in the same first row on the finished part of the dock; no company names, logos or text appear anywhere; the workers stay tiny and few.",
      motion: motion("a crane arm slowly swings a steel hull block down toward the row on the dock while the tiny workers move below, dust drifts in the sunlight, the scaffolding and the sea stay still", "building two things at once"),
    },
    {
      scene: 12, key: "s12_method", role: "evidence", video: "story_ep3_s12_method_motion.mp4",
      narration: "배를 짓는 자리인 도크가 일부만 완성돼도, 그 위에서 바로 만들기 시작했거든. 그렇게 조선소와 유조선 두 척을 2년 3개월 만에 해냈어.",
      imageBrief: "도크 위에 세워지는 거대한 철판 선체의 안쪽. 용접 마스크를 쓴 작업자 두 명이 철판을 용접하며 주황색 불꽃이 튄다. 뒤로 아직 덜 지어진 도크 가장자리와 크레인이 보이고 먼지가 햇빛에 비친다. 작업자 얼굴은 마스크에 가려 보이지 않는다. " + NO_TEXT,
      shot: "medium", bg: "G",
      lock: "both welders keep their masks on for the whole clip so no face is visible; the steel plates keep plain surfaces with no text or marks; the unfinished dock edge and the cranes behind stay fixed; no extra workers enter.",
      motion: motion("the two welders hold their torches against the steel plate and orange sparks fly in a steady shower, the dust glints in the sunlight, the plates and the cranes behind stay still", "relentless work"),
    },
    {
      scene: 13, key: "s13_completion", role: "evidence", video: "story_ep3_s13_completion_motion.mp4",
      narration: "1974년 6월 28일, 조선소 준공식이 열렸어.",
      imageBrief: "맑은 날 거대한 유조선 선체가 놓인 도크 앞 준공식. 앞쪽에 붉은 테이프가 가로로 걸려 있고, 정장 입은 관계자 한 명이 큰 가위를 두 손으로 쥐고 테이프를 자르려는 순간이며 그 뒤로 관계자들이 줄지어 서 있다. 뒤로 선체가 하늘을 가릴 만큼 크다. 무늬 없는 단색 짙은 남색 삼각 페넌트(줄무늬·십자·별 없음, 실제 나라 국기와 닮지 않게)들. " + NO_TEXT,
      shot: "wide", bg: "H",
      lock: "the giant hull behind stays fixed with no text or logos; the scissors stay gripped in both hands at the red ribbon; the plain flags show no text; no extra people enter.",
      motion: motion("the official cuts the red ribbon with both hands and the officials behind him applaud, the flags flutter in the breeze, the giant hull behind stays completely still", "proud completion"),
    },
    {
      scene: 14, key: "s14_number1", role: "evidence", video: "story_ep3_s14_number1_motion.mp4",
      narration: "25년 뒤인 1999년, 한국은 세계 배 시장에서 수주량, 곧 주문받은 양으로 일본을 제치고 1위에 올랐어.",
      imageBrief: "황금빛 석양의 대형 조선소 전경(높은 곳에서 본 구도). 도크마다 거대한 컨테이너선과 유조선이 줄지어 있고 높은 겐트리 크레인들이 늘어서 있으며, 바다 위 하늘이 주황빛이다. 사람 없음. " + NO_TEXT,
      shot: "wide", bg: "I",
      lock: "the rows of giant ships and the gantry cranes stay in the same arrangement for the whole clip; no people, flags, logos or text ever appear; only the light and the sea shimmer move.",
      motion: motion("the golden light slowly shifts across the rows of giant ships and the sea shimmers, a few birds cross the orange sky, the ships and the cranes stay completely still", "grand achievement"),
    },
    {
      scene: 15, key: "s15_notone", role: "evidence", video: "story_ep3_s15_notone_motion.mp4",
      narration: "지폐 한 장이 다 해낸 건 아니야. 추천서를 쓴 사람, 배를 주문한 선주, 배를 지은 사람들이 만든 이야기였어.",
      imageBrief: "따뜻한 조명의 원목 탁자 위. 가운데에 낡은 갈색 지폐 한 장(글자 없이 등껍질처럼 둥글게 덮인 지붕에 뾰족한 쇠못이 돋고 앞에 용머리가 달린 돛 없는 한국 거북선 그림만), 왼쪽에 봉투 한 장(글자 없음), 오른쪽에 글자 없는 작은 유조선 모형 하나, 앞쪽에 흰 안전모 하나가 가지런히 놓여 있다. 사람 없음. " + NO_TEXT,
      shot: "close", bg: "J",
      lock: "the four objects stay in the same arrangement on the table for the whole clip; the banknote keeps only its plain turtle-ship pattern and the envelope stays plain with no text; no people or hands ever appear; only the warm light shifts.",
      motion: motion("the warm light slowly brightens across the four objects on the table and a soft shadow drifts over the wood, the banknote, envelope, tanker model and hard hat stay completely still", "everyone together"),
    },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성(참조 이미지 첨부·부엉박사 프레임 규칙은 owl3dv5 경로가 처리) ──
export const STORY_EP3_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 3,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep3",
  sceneBackgrounds: Object.freeze({
    M: {
      label: "조선소 사무동 로비(16번 부엉박사)",
      image: "밝은 조선소 사무동 로비. 부엉박사 뒤로 큰 유리벽 너머에 도크 위 대형 유조선 선체와 크레인의 흐릿하지 않은 실루엣이 보이고, 한쪽에 글자 없는 유조선 모형이 유리 진열대 위에 놓여 있다. 바닥은 매끈한 연한 회색 석재, 따뜻한 오후 햇빛.",
      videoStyle: "bright shipyard office lobby with a glass wall onto a dock with a giant tanker hull",
      videoStatics: "the large glass wall with the tanker hull and crane silhouettes, the plain tanker model on the glass display, the smooth light gray stone floor, and the warm afternoon light",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep3_s16_close_motion.mp4",
      narration: "추천서는 믿음이었고, 주문서는 증거였어. 돈은 그 둘이 함께 있을 때 움직였지. 다음 이야기도 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 유리벽·조명·천장 같은 배경만 보이게 해.",
      shot: "medium", bg: "M",
      lock: "the tanker model on the display keeps its plain shape with no text; the glass wall and the dock silhouettes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 2편 STORY_EP2_ASSEMBLE_SPEC과 같은 구성(2026-10-07) ──
// 제목(Owner 확정 2026-10-07): "500원 지폐로 조선소를? 반만 맞아" — 영상 속 제목·커버 문구 동일, 인물·회사명은 설명란에만.
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep3-assembly-spec.mjs --spec-export STORY_EP3_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep3-clips --audio-summary <audio-fixed.capfix 요약> --tts-script <capfix tts 스크립트> --out-dir C:/tmp/story-ep3-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP3_FULL_SPEC = Object.freeze({
  ...STORY_EP3_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP3_SEMI_SPEC.sceneBackgrounds, ...STORY_EP3_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP3_SEMI_SPEC.scenes, ...STORY_EP3_END_SPEC.scenes]),
});

export const STORY_EP3_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP3_FULL_SPEC,
  headerTitle: Object.freeze(["500원 지폐로", "조선소를?", "반만 맞아"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["지폐", "거북선", "추천서", "주문서", "보증", "조선소", "1위"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+(?:억|만|조)", "[0-9,.]+%", "[0-9]+원짜리"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  // 자막 경계 예외(2026-10-07): 강조 숫자가 커지는 폭 때문에 한 줄에 안 들어가 자동 분할이 갈라 놓은 3곳. 대사를 바꾸려면 TTS 재생성(유료)이 필요해 사유와 함께 승인.
  captionBoundaryExceptions: Object.freeze([
    { left: "4,300만", right: "달러였어", reason: "'4,300만 달러였어'가 강조 확대 폭 때문에 한 줄에 안 들어가 숫자|단위에서 갈림(s2), TTS 재생성 회피(2026-10-07)" },
    { left: "1972년", right: "3월", reason: "'1972년 3월 23일' 날짜가 한 줄 폭을 넘어 연도|월에서 갈림(s10), TTS 재생성 회피(2026-10-07)" },
    { left: "1974년", right: "6월", reason: "'1974년 6월 28일' 날짜가 한 줄 폭을 넘어 연도|월에서 갈림(s13), TTS 재생성 회피(2026-10-07)" },
  ]),
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP3_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
