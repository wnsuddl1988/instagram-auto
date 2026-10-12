/**
 * 스토리형 4편 — 대우그룹 재연 장면 스펙 (2026-10-07).
 *
 * 기준: `_ai/story-format-structure-v1.md` + 대우 v4 대본 `C:/tmp/story-ep4-daewoo/daewoo-scenes-v1.json`(16장면 580자, Owner 확정 2026-10-07 "이대로 진행하자").
 * 설계 `C:/tmp/story-ep4-daewoo/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep4-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed.json`(92.5초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형):
 *  - 화면에 글자·숫자·로고를 넣지 않는다(숫자는 자막이 맡는다). 시황판·장부·어음·달력도 무늬만, 숫자 없음.
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - 인물이 나오는 장면은 얼굴·머리를 세로 45% 아래에(FACE_SAFE), 위 40%는 배경만(영상 위 제목이 얼굴을 덮은 1편 교훈).
 *  - 실존 인물을 닮게 그리지 않는다: 회장은 얼굴 없이 손·소품만, 나머지는 "50대 한국 남성 임원" 같은 일반적인 인물. 이름·닮음 지시 없음. 실제 회사·은행 로고·간판 없음.
 *  - 1990년대 배경(CRT 모니터·유선 전화·두꺼운 서류철·형광등), 폴란드·빈 장면은 유럽식 실내.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep4-assembly-spec.mjs --scene-spec-export STORY_EP4_SEMI_SPEC --out-dir C:/tmp/story-ep4-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep4-assembly-spec.mjs --scene-spec-export STORY_EP4_END_SPEC --out-dir C:/tmp/story-ep4-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고는 하나도 넣지 마(간판·서류·장부·시황판·달력·어음·모니터 모두 무늬만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 얼굴과 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·얼굴·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해. 인물은 가슴 위가 아니라 허리 위까지 아래쪽 절반에 넉넉히 담아.";

const KOREAN_EXEC = "50대 한국 남성 임원(짧은 검은 머리, 짙은 남색 양복, 밝은 셔츠에 어두운 넥타이)";
const EURO_EXEC = "60대 유럽 남성 공장 사장(희끗한 머리, 짙은 회색 양복, 얇은 금속테 안경)";

export const STORY_EP4_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 4,
  displayEpisode: 4,
  sourceCandidate: "story-ep4-daewoo-breakup-1999",
  title: "대우 — 세계를 사들이던 그룹의 장부",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep4",
  storyStyleOnlyIdentity:
    "1990년대를 배경으로 한 재연 장면 시리즈의 첫 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    `한국인 임원이 장면 설명에 나오면 ${KOREAN_EXEC}의 일반적인 모습으로 그려. ` +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "빈 호텔 회의실(1번)",
      image: "오스트리아 빈의 고풍스러운 호텔 회의실. 높은 천장에 샹들리에, 큰 창밖으로 오래된 석조 건물 지붕, 둥근 원목 탁자와 가죽 의자, 탁자 위에 글자 없는 작은 자동차 모형 하나, 바닥은 짙은 붉은 카펫.",
      videoStyle: "elegant old Vienna hotel meeting room with a chandelier and a view of old stone rooftops",
      videoStatics: "the chandelier, the large window with the old stone rooftops, the round wooden table, the leather chairs, the plain small car model, and the dark red carpet",
    },
    B: {
      label: "수출 항구 선적장(2번)",
      image: "맑은 날 1990년대 한국 항구의 컨테이너 선적장. 단색 컨테이너가 높이 쌓여 있고 대형 크레인이 컨테이너를 배에 싣고 있으며, 안전모 쓴 작업자들이 아주 작게 보이고, 바다와 푸른 하늘. 글자·로고 없음.",
      videoStyle: "bright clear-day 1990s Korean container port with cranes loading plain unmarked containers onto a ship",
      videoStatics: "the stacked plain unmarked containers, the tall cranes, the ship, the tiny workers, the sea, and the blue sky",
    },
    C: {
      label: "자금 담당 사무실(3번)",
      image: "1990년대 한국 대기업 자금 담당 사무실. 책상마다 종이 서류더미와 베이지색 유선 전화, 벽에 숫자 없는 격자무늬 달력 하나, 형광등 조명, 창밖으로 서울 도심 빌딩, 바닥은 회색 타일.",
      videoStyle: "1990s Korean corporate treasury office under fluorescent lights",
      videoStatics: "the desks with the paper stacks and beige telephones, the plain gridded calendar on the wall, the fluorescent lights, the window with the Seoul skyline, and the gray tile floor",
    },
    D: {
      label: "기자회견장(4번)",
      image: "1990년대 한국 대기업 기자회견장. 연단 뒤에 단색 남색 배경 막(글자·로고 없음), 연단 앞에 마이크 여러 개, 객석에 기자들이 수첩을 들고 앉아 있고 카메라 플래시가 터진다.",
      videoStyle: "1990s Korean corporate press conference hall with a plain navy backdrop and flashing cameras",
      videoStatics: "the plain navy backdrop, the podium with several microphones, the rows of seated reporters with notebooks, and the camera flashes",
    },
    E: {
      label: "회장 집무실 책상(5번)",
      image: "1990년대 한국 대기업 회장 집무실. 큰 원목 책상 위에 두꺼운 서류 더미와 도장 받침, 만년필, 책상 스탠드, 뒤로 큰 창 밖에 서울 시가지의 저녁 불빛, 벽 한쪽에 원목 책장.",
      videoStyle: "dim 1990s Korean chairman's office at dusk with a city view",
      videoStatics: "the large wooden desk with the thick paper stack, the seal pad, the fountain pen, the desk lamp, the big window with the evening city lights, and the wooden bookshelf",
    },
    F: {
      label: "은행 회의실(6번)",
      image: "1990년대 한국 은행 본점 회의실. 긴 원목 탁자에 두꺼운 서류철이 놓여 있고, 양복 입은 은행 간부들이 둘러앉아 있으며, 천장에 형광등, 벽에 글자 없는 단색 액자 하나, 바닥은 회색 카펫.",
      videoStyle: "1990s Korean bank headquarters meeting room with a long wooden table and thick binders",
      videoStatics: "the long wooden table, the thick binders, the seated bank executives, the ceiling fluorescent lights, the plain frame on the wall, and the gray carpet",
    },
    G: {
      label: "증권사 객장(7번)",
      image: "1990년대 한국 증권사 객장. 벽 전체의 큰 시황판 화면에는 숫자 없이 가파르게 떨어지는 빨간 선 그래프만 보이고, 의자에 앉은 투자자들이 올려다보며 놀라 있으며, 형광등과 베이지색 CRT 단말기들.",
      videoStyle: "1990s Korean securities brokerage floor with a huge board showing a plain steeply falling red line",
      videoStatics: "the huge board with the plain falling red line, the rows of chairs, the beige CRT terminals, and the fluorescent lights",
    },
    H: {
      label: "투신사 창구(8번)",
      image: "1990년대 한국 금융회사 창구. 유리 칸막이 너머에 창구 직원, 앞쪽 상담 의자에 중년 부부가 통장을 두 손으로 쥐고 앉아 있고, 형광등과 번호표 기계(숫자 없음), 바닥은 연한 회색 타일.",
      videoStyle: "1990s Korean financial company service counter behind a glass partition",
      videoStatics: "the glass partition with the clerk behind it, the consultation chairs, the plain ticket machine, the fluorescent lights, and the light gray tile floor",
    },
    I: {
      label: "작은 부품 공장 사무실(9번)",
      image: "1990년대 한국 작은 부품 공장의 사무실. 낡은 철제 책상 위에 종이 어음 몇 장과 전화기, 유리창 너머로 멈춰 선 기계들이 보이고, 형광등 한 줄, 먼지 낀 선반에 부품 상자들.",
      videoStyle: "1990s small Korean parts factory office with a view through glass of idle machines",
      videoStatics: "the old steel desk with the plain paper notes and the telephone, the glass window with the idle machines, the single fluorescent light, and the dusty shelf with the plain parts boxes",
    },
    J: {
      label: "채권단 대형 회의장(10번)",
      image: "1990년대 한국 은행연합회 같은 대형 회의장. 긴 탁자가 ㄷ자로 놓이고 양복 입은 수십 명의 금융기관 관계자가 앉아 있으며, 앞쪽 연단에 의장 한 명, 천장 조명과 글자 없는 단색 배경 막.",
      videoStyle: "large 1990s Korean banking association hall with dozens of suited officials seated at a U-shaped table",
      videoStatics: "the U-shaped table, the dozens of seated suited officials, the podium at the front, the ceiling lights, and the plain backdrop",
    },
    K: {
      label: "회계 조사 사무실(11·12번)",
      image: "밤의 사무실. 책상 위에 두꺼운 장부와 계산기, 책상 스탠드 불빛, 회계사 복장의 사람들이 서류를 펼쳐 놓고 대조하고, 창밖은 어두운 도시 야경, 형광등 한 줄만 켜져 있다.",
      videoStyle: "night office with thick ledgers and calculators under a desk lamp and a single fluorescent light",
      videoStatics: "the desk with the thick ledgers and the calculator, the desk lamp, the dark city night view through the window, and the single fluorescent light",
    },
    L: {
      label: "은행 대출 창구(13번)",
      image: "1990년대 한국 은행 대출 창구. 창구 안쪽의 은행 직원이 두꺼운 장부를 펼쳐 읽고 있고, 창구 앞쪽에 서류 가방을 든 손님의 뒷모습, 형광등, 유리 칸막이, 바닥은 연한 회색 타일.",
      videoStyle: "1990s Korean bank loan counter with the clerk reading a thick ledger",
      videoStatics: "the loan counter with the glass partition, the thick ledger, the fluorescent lights, and the light gray tile floor",
    },
    M: {
      label: "매각 계약 서명 회의실(14번)",
      image: "2002년 서울의 현대적인 회의실. 둥근 원목 탁자 위에 계약서와 만년필, 큰 창밖에 서울 시가지, 탁자 맞은편에 양복 입은 외국인 임원과 한국인 임원이 서명하는 순간이며 카메라 플래시가 터진다.",
      videoStyle: "modern 2002 Seoul meeting room with a signing ceremony and camera flashes",
      videoStatics: "the round wooden table with the contract and the fountain pen, the large window with the Seoul skyline, and the camera flashes",
    },
    N: {
      label: "탁상 장부(15번)",
      image: "따뜻한 조명의 원목 탁자 위. 가운데에 낡고 두꺼운 가죽 장부 한 권이 놓여 있고(표지에 글자 없음, 한쪽 모서리가 갈라져 있음), 그 위에 금색 도장 하나와 작은 놋쇠 열쇠가 놓여 있다. 사람 없음. 뒤는 부드럽게 어두운 배경.",
      videoStyle: "warm-lit wooden tabletop with an old thick leather ledger with a cracked corner, a gold seal and a small brass key",
      videoStatics: "the old thick leather ledger with its cracked corner and plain cover, the gold seal, the small brass key, and the wooden table",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep4_s1_hook_motion.mp4",
      narration: "대우는 폴란드 자동차 공장을 GM과 겨뤄 인수했고, 합의는 빈에서 15분 만에 끝났다고 해. 그런데 그 몸집은 빌린 돈 위에 서 있었지.",
      imageBrief: `빈 호텔 회의실 둥근 탁자를 사이에 두고 ${KOREAN_EXEC}과 ${EURO_EXEC}이 서서 악수한다. 탁자 위에 글자 없는 작은 자동차 모형 하나가 놓여 있다. 두 사람 모두 만족한 표정이다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the handshake stays firm between the two men for the whole clip; the plain small car model stays on the table with no logos or text; the chandelier, the window and the leather chairs stay fixed; nobody else enters.",
      motion: motion("the two men shake hands firmly and nod with satisfied smiles, the chandelier light glints softly, the car model and the room stay completely still", "ambitious deal"),
    },
    {
      scene: 2, key: "s2_scale", role: "evidence", video: "story_ep4_s2_scale_motion.mp4",
      narration: "한국 수출의 14%가 대우 이름으로 나갔고, 30만 명이 넘는 사람이 대우 이름으로 일했어.",
      imageBrief: "맑은 날 1990년대 한국 항구의 컨테이너 선적장 전경(넓은 구도). 단색 컨테이너가 높이 쌓여 있고 대형 크레인이 컨테이너를 배에 싣고 있으며, 안전모 쓴 작업자들이 아주 작게 많이 보인다. " + NO_TEXT,
      shot: "wide", bg: "B",
      lock: "the stacked plain containers and the ship keep plain surfaces with no logos or text; the cranes stay in the same arrangement; the workers stay tiny and few; no readable signs ever appear.",
      motion: motion("a crane arm slowly lowers a plain container onto the ship while the tiny workers move below, a light sea breeze stirs, the stacked containers and the sky stay completely still", "a giant at work"),
    },
    {
      scene: 3, key: "s3_debt", role: "evidence", video: "story_ep4_s3_debt_motion.mp4",
      narration: "부채비율은 400%가 넘었고, 석 달짜리 어음도 하루, 열흘 단위로 막아 가며 버텼지.",
      imageBrief: `자금 담당 사무실 책상 앞에서 ${KOREAN_EXEC} 한 명이 종이 어음 몇 장을 두 손으로 쥐고 전화기를 어깨에 낀 채 초조한 표정으로 서류를 넘긴다. 책상 위에 종이 서류더미와 베이지색 전화기가 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "C",
      lock: "the paper notes in his hands keep plain faint lines with no text or numbers; the desk stack, the telephone and the wall calendar (plain grid, no numbers) stay fixed; he keeps holding the notes with both hands; nobody else enters.",
      motion: motion("the man flips through the paper notes with a worried face and shifts the telephone on his shoulder, the fluorescent light flickers faintly, the desks and the calendar stay still", "walking a tightrope"),
    },
    {
      scene: 4, key: "s4_plan", role: "evidence", video: "story_ep4_s4_plan_motion.mp4",
      narration: "빚을 줄이려고, 1998년 12월 대우는 계열사를 41개에서 10개로 줄이겠다고 발표했어.",
      imageBrief: `기자회견장 연단에 ${KOREAN_EXEC} 한 명이 서서 종이를 두 손으로 쥐고 발표하고, 객석의 기자들이 수첩에 받아 적으며 카메라 플래시가 터진다. 연단 뒤 배경 막은 글자 없는 단색 남색이다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "D",
      lock: "the navy backdrop stays plain with no logos or text; the paper in his hands stays plain; the podium microphones and the rows of reporters stay in the same positions; nobody new enters.",
      motion: motion("the man reads from the paper with a serious face while the reporters write and the camera flashes pop softly, the backdrop and the podium stay completely still", "formal announcement"),
    },
    {
      scene: 5, key: "s5_collateral", role: "evidence", video: "story_ep4_s5_collateral_motion.mp4",
      narration: "1999년 7월 19일, 대우를 일군 회장은 전재산을 포함해 10조 원이 넘는 자산을 담보로 내놓았어. 믿어 달라는 뜻이었지.",
      imageBrief: "회장 집무실 큰 원목 책상 위에서 짙은 회색 양복 소매의 두 손이 도장을 두 손으로 감싸 쥐고 두꺼운 서류 위에 내려놓기 직전 멈춰 있다. 얼굴은 그리지 마(손과 소품만). 서류에는 글자 없이 빈 칸 무늬만. " + NO_TEXT,
      shot: "close", bg: "E",
      lock: "no face, head or body ever appears — only the two hands and the dark gray suit sleeves; the seal stays gripped in both hands and the mark it leaves stays a plain red circle with no text; the fountain pen, the lamp and the city lights stay fixed.",
      motion: motion("the two hands hold the seal steady over the papers, then press it down slowly and lift it to leave a plain red mark, the lamp light flickers faintly", "heavy decision"),
    },
    {
      scene: 6, key: "s6_loan", role: "evidence", video: "story_ep4_s6_loan_motion.mp4",
      narration: "금융권은 4조 원을 더 빌려주기로 했지.",
      imageBrief: "은행 본점 회의실 긴 원목 탁자에 양복 입은 은행 간부 다섯 명이 둘러앉아 두꺼운 서류철을 펼쳐 보고, 한 명이 고개를 끄덕이며 다른 한 명과 서류를 가리킨다. 서류에는 글자·숫자 없이 무늬만. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "F",
      lock: "the thick binders keep plain pages with no text or numbers; the long table and the plain wall frame stay fixed; the five officials keep the same seats and nobody new enters.",
      motion: motion("the officials turn the pages and nod to each other, one points at a page and another leans in to look, the room stays completely still", "a cautious agreement"),
    },
    {
      scene: 7, key: "s7_market", role: "core_question", video: "story_ep4_s7_market_motion.mp4",
      narration: "그런데 시장은 다른 답을 냈어. 다음 날 종합주가지수 1,000선이 무너졌지.",
      imageBrief: "증권사 객장. 벽 전체의 큰 시황판 화면에는 숫자 없이 가파르게 곤두박질치는 빨간 선 그래프만 보이고, 의자에 앉은 중년 투자자 서너 명이 올려다보며 놀라 입을 가린다. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "G",
      lock: "the huge board keeps only the plain red falling line with no axes, numbers or text; the rows of chairs and the beige terminals stay fixed; the investors keep the same seats and nobody new enters.",
      motion: motion("the investors stare up at the board in shock and one raises a hand to cover his mouth, the red line on the board stays plain, the fluorescent light flickers faintly", "market shock"),
    },
    {
      scene: 8, key: "s8_fund", role: "evidence", video: "story_ep4_s8_fund_motion.mp4",
      narration: "8월 12일, 대우 채권이 담긴 펀드에서는 돈을 마음대로 뺄 수 없게 됐어. 11월 10일 전에는 그 부분의 절반만 돌려받을 수 있었지.",
      imageBrief: "금융회사 창구 앞 상담 의자에 중년 부부가 통장을 두 손으로 쥐고 앉아 있고, 유리 칸막이 너머 창구 직원이 난처한 표정으로 한 손바닥을 펴 보이며 고개를 젓는다. 부부는 걱정스러운 표정으로 서로를 바라본다. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "H",
      lock: "the passbook stays gripped in both of the couple's hands with a plain cover and no text; the glass partition and the plain ticket machine stay fixed; nobody else enters.",
      motion: motion("the clerk shakes his head and spreads one palm apologetically while the couple exchange worried looks, the counter and the lights stay completely still", "money held back"),
    },
    {
      scene: 9, key: "s9_suppliers", role: "evidence", video: "story_ep4_s9_suppliers_motion.mp4",
      narration: "8월 중순에는 대우에 납품하던 업체들이 어음을 현금으로 바꾸지 못해, 줄줄이 부도 위기에 몰렸어.",
      imageBrief: "작은 부품 공장 사무실의 낡은 철제 책상 앞에 50대 한국 남성 사장이 앉아 종이 어음을 두 손으로 쥐고 깊이 한숨을 쉰다. 유리창 너머로 멈춰 선 기계들이 보인다. 어음에는 글자·숫자 없이 줄무늬만. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "I",
      lock: "the paper notes keep plain faint lines with no text or numbers; the idle machines behind the glass stay still; the telephone and the dusty shelf stay fixed; nobody else enters.",
      motion: motion("the owner exhales a heavy sigh while holding the notes with both hands and lowers his head slightly, the machines behind the glass stay completely still", "supplier in crisis"),
    },
    {
      scene: 10, key: "s10_workout", role: "evidence", video: "story_ep4_s10_workout_motion.mp4",
      narration: "7월 19일부터 38일 뒤인 8월 26일, 대우 계열사 12개가 워크아웃에 들어갔어.",
      imageBrief: "대형 회의장. ㄷ자 탁자에 양복 입은 수십 명의 금융기관 관계자가 앉아 있고, 앞쪽 연단의 의장이 선언하듯 한 손을 들며, 객석에서 여러 명이 천천히 손을 든다. 배경 막은 글자 없는 단색. " + NO_TEXT,
      shot: "wide", bg: "J",
      lock: "the U-shaped table and the plain backdrop stay fixed with no text or logos; the number and seats of the officials stay the same and nobody new enters; only a few hands rise slowly.",
      motion: motion("the chairperson raises one hand and several officials at the table slowly raise their hands in turn, the hall and the backdrop stay completely still", "the decision is made"),
    },
    {
      scene: 11, key: "s11_ledger_open", role: "core_question", video: "story_ep4_s11_ledger_open_motion.mp4",
      narration: "그리고 13개월 뒤, 금융당국이 12개 기업의 장부를 열어 봤어.",
      imageBrief: "밤의 사무실 책상 위에 두꺼운 장부가 펼쳐져 있고, 정장 입은 사람 세 명이 책상 맞은편에서 장부 쪽으로 고개를 깊이 숙이고 있어 정수리와 어깨만 보이고 얼굴은 전혀 보이지 않는다(머리카락과 정수리 뒷면 위주, 이마·눈·코·입이 화면에 나오지 않음). 책상 스탠드 불빛 아래 한 사람의 손이 계산기를 누르고 다른 손은 장부의 줄을 펜으로 짚는다. 장부에는 글자·숫자 없이 줄과 칸만. " + NO_TEXT,
      shot: "medium", bg: "K",
      lock: "the three people stay bent over the desk so only the tops of their heads and their shoulders are seen and no face is ever shown; the open ledger keeps only plain ruled lines and boxes; the calculator and the desk lamp stay fixed; nobody new enters.",
      motion: motion("the three office workers stay bent over the open ledger, one hand taps the calculator and another hand turns a page slowly, the desk lamp light stays steady", "quiet, careful office work at night"),
    },
    {
      scene: 12, key: "s12_fraud", role: "evidence", video: "story_ep4_s12_fraud_motion.mp4",
      narration: "분식회계가 22조 9천억 원이었지.",
      imageBrief: "책상 스탠드 불빛 아래 펼쳐진 두꺼운 장부 위로 정장 소매의 한 손이 돋보기를 들고 한 줄을 가리킨다. 장부 한쪽에 지우개 가루 같은 가는 줄무늬가 번져 있고 반대쪽 페이지는 비어 있다. 얼굴은 그리지 마(손과 소품만). " + NO_TEXT,
      shot: "close", bg: "K",
      lock: "no face or body appears — only the one hand, the magnifier and the suit sleeve; the ledger keeps only plain ruled lines with no text or numbers; the desk lamp stays fixed.",
      motion: motion("the magnifier moves slowly along one ruled line and stops, the faint smudge on the page stays plain, the lamp light stays steady", "something is wrong"),
    },
    {
      scene: 13, key: "s13_bank_ledger", role: "evidence", video: "story_ep4_s13_bank_ledger_motion.mp4",
      narration: "은행은 장부를 보고 돈을 빌려주는데, 그 장부가 이만큼 틀려 있었던 거야.",
      imageBrief: `은행 대출 창구 안쪽에서 ${KOREAN_EXEC} 은행 직원이 두꺼운 장부를 펼쳐 읽으며 고개를 끄덕이고, 창구 앞쪽에 서류 가방을 든 손님의 뒷모습이 보인다. 장부와 서류에는 글자·숫자 없이 무늬만. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "L",
      lock: "the thick ledger keeps only plain ruled lines with no text or numbers; the glass partition and the light floor stay fixed; the customer stays seen from behind and nobody else enters.",
      motion: motion("the clerk reads the ledger and nods slowly, then lifts a plain stamp toward a paper, the customer stays still with the briefcase, the counter stays completely still", "trust in a ledger"),
    },
    {
      scene: 14, key: "s14_gm_irony", role: "evidence", video: "story_ep4_s14_gm_irony_motion.mp4",
      narration: "폴란드에서 GM을 이기고 공장을 사들였던 대우는, 2002년 대우자동차를 그 GM에 넘겼어.",
      imageBrief: `서울 회의실의 둥근 원목 탁자 위 계약서에 ${KOREAN_EXEC}이 만년필로 서명하고, 맞은편에 서 있는 외국인 임원이 굳은 표정으로 지켜본다. 큰 창밖에 서울 시가지, 카메라 플래시가 터진다. 계약서에는 글자 없이 줄무늬만. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "M",
      lock: "the contract keeps only plain faint lines with no text or numbers; the fountain pen stays in the man's hand during the signing; the round table and the window stay fixed; nobody else enters.",
      motion: motion("the Korean executive finishes his signature and sets down the pen while the foreign executive watches with a stiff face, the camera flashes pop softly, the room stays still", "irony of the deal"),
    },
    {
      scene: 15, key: "s15_notone", role: "evidence", video: "story_ep4_s15_ledger_trust_motion.mp4",
      narration: "은행이 믿은 건 돈이 아니라 장부였어. 그 장부가 틀렸다는 게 드러나자 믿음이 끊겼지.",
      imageBrief: "따뜻한 조명의 원목 탁자 위. 가운데에 낡고 두꺼운 가죽 장부 한 권이 놓여 있고(표지에 글자 없음, 한쪽 모서리가 갈라져 있음), 그 위에 금색 도장 하나와 작은 놋쇠 열쇠가 놓여 있다. 사람 없음. " + NO_TEXT,
      shot: "close", bg: "N",
      lock: "the ledger, the gold seal and the small brass key stay in the same arrangement for the whole clip; the cracked corner stays as it is and the cover keeps no text; no people or hands ever appear; only the warm light shifts.",
      motion: motion("the warm light slowly dims across the old ledger and a soft shadow drifts over the wood, the ledger, the seal and the key stay completely still", "trust broken"),
    },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성(참조 이미지 첨부·부엉박사 프레임 규칙은 owl3dv5 경로가 처리) ──
export const STORY_EP4_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 4,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep4",
  sceneBackgrounds: Object.freeze({
    O: {
      label: "은행 로비(16번 부엉박사)",
      image: "밝은 은행 본점 로비. 부엉박사 뒤로 대리석 기둥과 높은 천장, 한쪽에 글자 없는 대출 상담 창구와 유리 칸막이, 탁자 위에 서류철 한 권(글자 없음). 바닥은 매끈한 연한 회색 석재, 따뜻한 오후 햇빛.",
      videoStyle: "bright bank headquarters lobby with marble columns and a plain loan consultation counter",
      videoStatics: "the marble columns, the high ceiling, the plain loan counter with the glass partition, the plain binder on the table, the smooth light gray stone floor, and the warm afternoon light",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close2", role: "save", video: "story_ep4_s16_close2_motion.mp4",
      narration: "은행이 네 대출에서 소득 서류부터 보자는 것도, 믿을 증거 없이는 빌려줄 수 없어서야. 다음 편은 팔로우해 두면 바로 볼 수 있어.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 기둥·조명·천장 같은 배경만 보이게 해.",
      shot: "medium", bg: "O",
      lock: "the plain binder on the table keeps no text; the marble columns and the loan counter stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 3편 STORY_EP3_ASSEMBLE_SPEC과 같은 구성(2026-10-10) ──
// 제목(★임시안 — Owner 확정 필요, 영상 속 제목·커버 문구 동일): "은행이 믿은 건 / 돈이 아니라 / 장부였다" — 전달 메시지(15번)를 그대로 제목으로.
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep4-assembly-spec.mjs --spec-export STORY_EP4_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep4-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep4-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.tempo1.2-gap0.25-pre.audio-fixed.json --tts-script C:/tmp/money-shorts-os/story-ep4-tts/story-ep4-tts-script.json --out-dir C:/tmp/story-ep4-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP4_FULL_SPEC = Object.freeze({
  ...STORY_EP4_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP4_SEMI_SPEC.sceneBackgrounds, ...STORY_EP4_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP4_SEMI_SPEC.scenes, ...STORY_EP4_END_SPEC.scenes]),
});

export const STORY_EP4_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP4_FULL_SPEC,
  headerTitle: Object.freeze(["은행이 믿은 건", "돈이 아니라", "장부였다"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["대우", "장부", "담보", "부채비율", "워크아웃", "분식회계", "GM"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+(?:억|만|조)", "[0-9,.]+%", "[0-9]+개"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  // 자막 경계 예외(2026-10-10): '분식회계가 22조 9천억 원이었지'(1,484px)는 어느 자리로 나눠도 숫자 덩어리 안이다. 폭에 맞는 2줄 해는
  // "분식회계가 22조 / 9천억 원이었지"(755px·699px) 하나뿐이라 숫자 연쇄 '22조|9천억'에서 나눈다(s12). 대사 변경은 TTS 전체 재생성(유료·전 장면 음성 변동)이 필요해 회피.
  captionBoundaryExceptions: Object.freeze([
    { left: "7월", right: "19일,", reason: "'1999년 7월 19일, 대우를' 날짜 덩어리가 한 줄(760px)에 안 들어가고 가를 자리가 모두 금지 경계라 '1999년 7월 / 19일,'로 갈림(s5), TTS 재생성 회피(2026-10-10)" },
    { left: "22조", right: "9천억", reason: "'분식회계가 22조 9천억 원이었지'가 숫자 덩어리 안에서만 폭(760)에 맞게 나뉨: '분식회계가 22조 / 9천억 원이었지'(755·699px)(s12), TTS 재생성 회피(2026-10-10)" },
  ]),
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP4_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
