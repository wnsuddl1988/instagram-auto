/**
 * 스토리형 2편 — 삼성 반도체 도쿄 선언 재연 장면 스펙 (2026-10-07).
 *
 * 기준: `_ai/story-format-structure-v1.md` + 삼성 v6 대본 `C:/tmp/story-ep2-samsung/samsung-scenes-v6.json`(17장면 534자, Owner 확정).
 * 설계 `C:/tmp/story-ep2-samsung/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep2-tts/output-v1/tempo-1.15-gap0.35/…summary…json`(85.64초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~16번 재연 장면 + 17번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형):
 *  - 화면에 글자·숫자·로고를 넣지 않는다(숫자는 자막이 맡는다).
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - 실존 인물을 닮게 그리지 않는다: 회장은 "70대 한국 남성(은빛 짧은 머리·둥근 금속테 안경·짙은 회색 양복)"의 일반적인 인물로, 이름·사진 닮음 지시 없음.
 *  - 1980년대 배경(베이지색 PC·CRT 모니터·형광등), 인텔 등 실제 회사 로고·이름은 화면에 쓰지 않는다.
 *
 * 이미지 생성: ① 1~16번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep2-assembly-spec.mjs --scene-spec-export STORY_EP2_SEMI_SPEC --out-dir C:/tmp/story-ep2-images`
 *            ② 17번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep2-assembly-spec.mjs --scene-spec-export STORY_EP2_END_SPEC --out-dir C:/tmp/story-ep2-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고는 하나도 넣지 마(간판·서류·화면·포장 모두 무늬만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

// 얼굴 안전 구간(Owner 2026-10-07, 스토리 1편 교훈 — 영상 위 제목이 세로 18~37%에 계속 떠 있어 얼굴을 덮었다):
// 인물이 나오는 장면은 얼굴·머리를 세로 45% 아래에 두고, 위쪽 40%는 벽·창문·천장·조명·야경·하늘 같은 배경만 둔다(사람·얼굴·머리 없음).
const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 얼굴과 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·얼굴·머리가 하나도 없이 벽·창문·천장·조명·도시 야경·하늘 같은 배경만 보이게 해. 인물은 가슴 위가 아니라 허리 위까지 아래쪽 절반에 넉넉히 담아.";

const CHAIRMAN = "70대 한국 남성 회장(은빛 짧은 머리, 둥근 금속테 안경, 짙은 회색 양복에 어두운 넥타이)";

export const STORY_EP2_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 2,
  displayEpisode: 2,
  sourceCandidate: "story-ep2-samsung-tokyo-declaration-1983",
  title: "삼성 반도체 — 비웃음이 뒤집힌 선택",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep2",
  // 이미지 도구의 1편 전용 문구(1998년 한국·주인공 여성)를 2편용으로 바꾼다(probe-character-consistency-chatgpt-v1.mjs STORY_OVERRIDES).
  storyStyleOnlyIdentity:
    "1980년대를 배경으로 한 재연 장면 시리즈의 첫 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    `회장이 장면 설명에 나오면 앞에서 만든 그 인물(${CHAIRMAN})과 얼굴·머리·안경·옷이 똑같아야 해(처음 나오는 장면은 이 설명대로 그려). ` +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "1980년대 미국 반도체 회사 회의실(1번)",
      image: "1980년대 미국 회사의 밝은 회의실. 한쪽 벽 전체가 유리창이고 창밖으로 낮은 사무동 건물이 보인다. 긴 밝은 원목 회의 탁자, 베이지색 사무 의자들, 바닥은 회색 카펫, 벽에는 글자 없는 단색 추상 액자 하나.",
      videoStyle: "bright 1980s American corporate meeting room with a glass wall",
      videoStatics: "the glass wall and the low office buildings outside, the long light wooden table, the beige office chairs, the gray carpet, and the plain abstract picture frame",
    },
    B: {
      label: "도쿄 호텔 방 창가(2번)",
      image: "밤의 도쿄 호텔 방. 큰 창 밖으로 높은 빌딩들의 불빛이 반짝이는 야경(간판 글자 없는 불빛만), 창가에 작은 원형 탁자와 가죽 의자 하나, 바닥은 짙은 갈색 카펫, 따뜻한 스탠드 조명.",
      videoStyle: "warm lamp-lit Tokyo hotel room at night with a city skyline view",
      videoStatics: "the large window with the glittering city lights, the small round table, the leather chair, the dark brown carpet, and the warm floor lamp",
    },
    C: {
      label: "한국 대기업 회장 집무실(4·11·12번)",
      image: "1980년대 한국 대기업 회장 집무실. 큰 원목 책상 위에 서류 더미와 만년필 한 자루와 책상 스탠드 하나, 뒤로 큰 창 밖에 서울 시가지의 저녁 불빛(간판 글자 없음), 벽 한쪽에 원목 책장, 바닥은 짙은 갈색 카펫.",
      videoStyle: "dim 1980s Korean executive office at dusk with a city view",
      videoStatics: "the large wooden desk with its stacked papers and the single fountain pen, the desk lamp, the big window with the evening city lights, the wooden bookshelf, and the dark brown carpet",
    },
    D: {
      label: "한국 회의실(3번)",
      image: "1980년대 한국 회사 회의실. 긴 원목 회의 탁자, 탁자 양쪽에 낮은 등받이 의자, 천장에 형광등, 벽에는 글자 없는 단색 액자 하나, 바닥은 회색 타일.",
      videoStyle: "plain 1980s Korean meeting room under fluorescent lights",
      videoStatics: "the long wooden meeting table, the low-backed chairs, the ceiling fluorescent lights, the plain frame on the wall, and the gray tile floor",
    },
    E: {
      label: "연구실 설계 작업대(5·7번)",
      image: "1980년대 반도체 연구실. 넓은 작업대 위에 회로 무늬만 그려진 큰 설계도 종이가 펼쳐져 있고(글자·숫자 없음), 옆에 흰 천을 깐 쟁반, 벽에는 선반과 장비 상자들, 형광등 조명, 바닥은 매끈한 연한 회색 바닥재.",
      videoStyle: "bright 1980s semiconductor research lab with a blueprint workbench",
      videoStatics: "the wide workbench with the circuit-pattern blueprint, the white-cloth tray, the equipment shelves and boxes, the fluorescent lights, and the smooth light gray floor",
    },
    F: {
      label: "반도체 클린룸(6·8번)",
      image: "밝은 반도체 클린룸 앞 복도. 한쪽에 큰 유리창(안쪽에 하얀 방진복 인물 실루엣이 작게 보임), 앞쪽 작업대 위에 투명 웨이퍼 보관 트레이 하나, 벽과 바닥은 흰색과 연한 파란색 매끈한 재질, 푸른빛 도는 밝은 조명.",
      videoStyle: "bright bluish semiconductor cleanroom corridor",
      videoStatics: "the large glass window with the tiny cleanroom silhouettes, the workbench with the clear wafer tray, and the smooth white and light blue walls and floor",
    },
    G: {
      label: "1985년 사무실 시세 모니터(9번)",
      image: "1985년경의 사무실. 책상 위에 베이지색 CRT 모니터가 놓여 있고 화면에는 빨간 선 그래프가 오른쪽 아래로 급하게 떨어진다(축·숫자·글자 없음), 책상 옆에 서류함과 전화기, 뒤쪽 창고 쪽 유리문 너머로 쌓인 상자들이 보인다. 형광등 조명.",
      videoStyle: "flat fluorescent-lit 1985 office with a beige CRT monitor",
      videoStatics: "the beige CRT monitor with its plain red falling line graph, the filing cabinet, the telephone, the stacked boxes behind the glass door, and the fluorescent lights",
    },
    H: {
      label: "반도체 생산 라인(10번)",
      image: "흰색과 연한 파란색 반도체 생산 라인. 긴 컨베이어 벨트 위로 투명 칩 트레이들이 줄지어 나오고, 양옆에 장비 기계들, 바닥은 매끈한 연한 회색, 밝은 푸른빛 조명. 글자·라벨 없음.",
      videoStyle: "bright bluish semiconductor production line with a conveyor belt",
      videoStatics: "the long conveyor belt with the rows of clear chip trays, the machines on both sides, the smooth light gray floor, and the bright bluish lights",
    },
    I: {
      label: "공장 착공식 건설 현장(13번)",
      image: "맑은 날의 넓은 공장 부지 착공식. 흙바닥 위에 삽이 일렬로 꽂힐 자리가 있고, 뒤쪽에 굴착기 두 대와 철골 뼈대, 푸른 하늘. 현장에는 글자 없는 무늬 없는 흰 천막 하나.",
      videoStyle: "bright clear-day factory groundbreaking site",
      videoStatics: "the bare dirt ground, the two excavators, the steel frame skeleton, the plain white tent, and the clear blue sky",
    },
    J: {
      label: "1987년 미국 컴퓨터 매장(14번)",
      image: "1987년 미국 컴퓨터 매장 안. 진열대마다 베이지색 개인용 컴퓨터(CRT 모니터와 키보드)가 줄지어 놓여 있고 화면에는 단색 초록 빛 무늬만 있으며(글자 없음), 바닥은 밝은 회색 카펫, 천장은 밝은 조명.",
      videoStyle: "bright 1987 American computer store with rows of beige PCs",
      videoStatics: "the display tables with the rows of beige PCs and their plain green screens, the keyboards, the light gray carpet, and the bright ceiling lights",
    },
    K: {
      label: "임원 회의실 상승 그래프(15번)",
      image: "밝은 기업 임원 회의실. 뒤쪽 벽의 큰 화면에 초록색 막대그래프가 계단처럼 올라가는 모습(축·숫자·글자 없음), 긴 원목 탁자와 가죽 의자들, 바닥은 짙은 회색 카펫.",
      videoStyle: "bright executive meeting room with a rising green bar chart on a large screen",
      videoStatics: "the large wall screen with the plain rising green bars, the long wooden table, the leather chairs, and the dark gray carpet",
    },
    L: {
      label: "시상대(16번)",
      image: "어두운 무대 위 스포트라이트 아래 3단 시상대. 가장 높은 가운데 단 위에 큰 칩 하나(금색 핀)가 놓여 있고 양옆 낮은 단에 작은 칩이 각각 하나씩 놓여 있다. 바닥에서 은색 종이 조각들이 천천히 흩날린다. 사람 없음. 글자·숫자 없음.",
      videoStyle: "dark stage with a spotlight on a three-step podium and falling silver confetti",
      videoStatics: "the three-step podium, the large chip on the highest step and the two smaller chips on the lower steps, the dark stage, and the spotlight",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep2_s1_hook_motion.mp4",
      narration: "미국·일본에 10년 넘게 뒤처진 삼성이 반도체를 하겠다고 하자, 미국 인텔은 '과대망상증 환자의 일'이라며 비웃었어.",
      imageBrief: "유리벽 회의실의 긴 탁자에 정장 입은 미국인 임원 세 명이 앉아 있다. 가운데 임원이 글자 없는 반도체 웨이퍼 그림 한 장이 그려진 종이를 두 손으로 쥐고 고개를 젖혀 비웃듯 웃고, 양옆 임원은 팔짱을 끼고 어깨를 으쓱한다. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the paper in the center executive's two hands keeps only the plain round wafer picture and never gains text or marks; the glass wall, the buildings outside and the tabletop stay fixed; no logos, name plates or text appear anywhere.",
      motion: motion("the center executive laughs and slowly shakes his head while holding the paper with both hands, the two executives beside him shrug and chuckle with folded arms, the glass wall and table stay completely still", "mocking arrogance"),
    },
    {
      scene: 2, key: "s2_year", role: "evidence", video: "story_ep2_s2_year_motion.mp4",
      narration: "1983년 2월, 73세의 이병철 회장이 도쿄에서 반도체 사업 진출을 선언한 직후의 일이었지.",
      imageBrief: `밤의 도쿄 호텔 방 창가에 ${CHAIRMAN}이 두 손으로 얇은 서류철을 가슴 앞에 쥐고 서서 창밖 야경을 내려다본다. 옆모습이 보이고 표정은 조용히 결연하다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "B",
      lock: "the city lights outside the window stay fixed as plain glittering lights with no signs or letters; the folder stays held against his chest with both hands for the whole clip; his glasses, silver hair and dark gray suit never change.",
      motion: motion("the man slowly takes a breath while looking out at the night city, his shoulders rise and fall, the city lights twinkle softly, the folder stays held with both hands", "quiet resolve before a big declaration"),
    },
    {
      scene: 3, key: "s3_doubt1", role: "evidence", video: "story_ep2_s3_doubt1_motion.mp4",
      narration: "한국엔 자본도, 기술도, 시장도 없다는 3불가론까지 나왔어.",
      imageBrief: "회의 탁자 양쪽에 정장 입은 한국 남자 다섯 명이 앉아 팔짱을 끼거나 고개를 가로젓고 있다. 탁자 한가운데에 세 가지 소품이 나란히 놓여 있다: 입을 벌린 텅 빈 갈색 가죽 지갑, 글자 없이 회로 무늬만 있는 낡은 종이 설계도 한 장, 텅 빈 나무 장바구니. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "D",
      lock: "the three props stay exactly on the table: the empty open brown wallet stays empty, the old blueprint keeps only its plain circuit pattern with no text, the empty wooden basket stays empty; nobody picks up or moves any prop; no text appears on the wall frame.",
      motion: motion("the five men slowly shake their heads and fold their arms, one leans back with a doubtful sigh, the three props on the table stay completely still", "heavy doubt"),
    },
    {
      scene: 4, key: "s4_doubt2", role: "evidence", video: "story_ep2_s4_doubt2_motion.mp4",
      narration: "회장도 일이 잘못되면 삼성그룹 절반 이상이 날아갈 수 있다고 봤지. 그래도 뛰어들었어.",
      imageBrief: `회장 집무실 책상 앞에서 ${CHAIRMAN}의 두 손(짙은 회색 양복 소매)이 도장을 두 손으로 감싸 쥐고 빈 서류 위에 내려놓기 직전 멈춰 있다. 얼굴은 그리지 마(손과 소품만). 서류에는 글자 없이 빈 칸 모양 무늬만 있다. ` + NO_TEXT,
      shot: "close", bg: "C",
      lock: "no face, head or body ever appears — only the two hands and sleeves; the seal stays gripped in both hands and the stamp mark left on the paper stays a plain red circle with no text; the pen, lamp and city lights stay fixed.",
      motion: motion("the two hands hold the seal steady over the paper, then press it down slowly and lift it to leave a plain red mark, the lamp light flickers faintly", "heavy decision"),
    },
    {
      scene: 5, key: "s5_team", role: "evidence", video: "story_ep2_s5_team_motion.mp4",
      narration: "삼성은 마이크론에서 기술을 들여오고, 미국에서 일하던 한국인 엔지니어들을 불러 모았어.",
      imageBrief: "연구실 작업대 둘레에 한국인 연구원 네 명이 서서 회로 무늬만 그려진 큰 설계도를 내려다보며 손가락으로 가리키고 의논한다. 한 명의 발치에는 막 도착한 듯 낡은 여행용 가방 하나가 서 있다. 모두 흰 가운. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "E",
      lock: "the blueprint on the workbench keeps only its plain circuit pattern with no letters or numbers; the travel suitcase stays standing at the same spot; the four people keep the same positions around the table and nobody new enters.",
      motion: motion("the four researchers lean over the blueprint, point at it and nod to each other, one adjusts his glasses, the blueprint and the suitcase stay completely still", "focused teamwork"),
    },
    {
      scene: 6, key: "s6_first", role: "evidence", video: "story_ep2_s6_first_motion.mp4",
      narration: "1983년 말, 국내 최초로 메모리 반도체 개발에 성공했지. 세계에서 세 번째였어.",
      imageBrief: "반도체 클린룸 앞 복도에서 하얀 방진복·마스크·모자 차림 연구원 두 명이 얇은 투명 웨이퍼 한 장을 두 손으로 조심스럽게 조명에 비춰 보며 서로를 마주 본다. 눈빛에 기쁨이 보이고 한 명은 주먹을 가볍게 쥔다. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "F",
      lock: "the wafer in the researchers' gloved hands keeps its plain rainbow shimmer with no text or marks; the glass window and the wafer tray on the bench stay fixed; both researchers keep holding the wafer steadily with both hands until the very last frame.",
      motion: motion("the two researchers tilt the wafer in the light, glance at each other and nod happily, one gently clenches a fist of joy with the other hand still supporting the wafer, the bluish light shimmers softly", "quiet triumph"),
    },
    {
      scene: 7, key: "s7_gap", role: "evidence", video: "story_ep2_s7_gap_motion.mp4",
      narration: "10년 넘게 벌어졌던 기술 격차가 4년 정도로 줄었지. 이제 따라잡나 싶었어.",
      imageBrief: "연구실 작업대 위 흰 천 쟁반에 칩 세 개가 가지런히 놓여 있다. 왼쪽 두 개는 은색 금속 케이스, 오른쪽 한 개는 같은 크기의 금색 핀 칩. 흰 장갑 낀 한 손이 집게로 오른쪽 칩을 조금 옮겨 앞의 두 칩 바로 옆에 나란히 맞추는 순간이다. 얼굴은 그리지 마(손과 소품만). " + NO_TEXT,
      shot: "close", bg: "E",
      lock: "no face or body appears — only the gloved hand and tweezers; the two silver chips stay still; the gold-pin chip stays gripped in the tweezers or settled beside them, never changing size or shape; the blueprint behind stays plain with no text.",
      motion: motion("the gloved hand with tweezers slowly slides the gold-pin chip until it sits right beside the two silver chips and the hand pauses, the lab light shimmers faintly on the chips", "closing the gap"),
    },
    {
      scene: 8, key: "s8_momentum", role: "evidence", video: "story_ep2_s8_momentum_motion.mp4",
      narration: "1984년 10월에는 용량을 4배로 늘린 제품도 10개월 만에 개발했어.",
      imageBrief: "클린룸 앞 작업대 위에 작은 칩 하나와, 그 옆에 네 배 큰 칩 하나(표면에 작은 사각 셀 네 칸이 보임)가 놓여 있다. 하얀 방진복 장갑 낀 두 손이 큰 칩을 감싸 쥐고 조명에 비춰 보여 준다. 얼굴은 그리지 마(손과 소품만). " + NO_TEXT,
      shot: "close", bg: "F",
      lock: "no face appears — only the two gloved hands; the large chip stays held with both hands and keeps its four plain square cells without any text or numbers; the small chip stays on the bench at the same spot.",
      motion: motion("the two gloved hands slowly turn the large chip in the bluish light as if showing it, the four square cells glint softly, the small chip on the bench stays completely still", "proud progress"),
    },
    {
      scene: 9, key: "s9_crash", role: "core_question", video: "story_ep2_s9_crash_motion.mp4",
      narration: "그런데 1985년, 반도체 값이 몇 달 만에 7분의 1로 떨어졌어.",
      imageBrief: "1985년경 사무실 책상에 앉은 한국인 직원 한 명이 베이지색 CRT 모니터 화면의 빨간 선 그래프가 오른쪽 아래로 급하게 곤두박질치는 것을 보고 놀라 한 손으로 입을 가린다. 뒤쪽 유리문 너머로 쌓인 상자들이 보인다. 그래프에는 축·숫자·글자가 없다. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "G",
      lock: "the monitor screen keeps only the plain red falling line with no axes, numbers or text; the stacked boxes behind the glass door stay still with no labels; the man's hand stays covering his mouth for most of the clip and nobody new enters.",
      motion: motion("the man stares at the monitor in shock, one hand rises to cover his mouth, his chest rises sharply, the red line on the screen stays plain, the fluorescent light flickers faintly", "sudden shock"),
    },
    {
      scene: 10, key: "s10_loss", role: "evidence", video: "story_ep2_s10_loss_motion.mp4",
      narration: "하나 만들 때마다 손해를 보면서, 적자는 1987년까지 1159억 원으로 쌓였지.",
      imageBrief: "반도체 생산 라인의 컨베이어 벨트 위로 투명 칩 트레이가 줄지어 계속 나오고, 정장 입은 한국인 관리자 한 명이 클립보드를 두 손으로 가슴에 안고 어두운 얼굴로 그것을 지켜보며 한숨을 쉰다. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "H",
      lock: "the clipboard stays held against the manager's chest with both hands for the whole clip and its paper stays plain with no text; the chip trays on the conveyor keep their shape and have no labels; nobody new enters.",
      motion: motion("the chip trays keep gliding along the conveyor, the manager watches with a dark expression and slowly exhales a heavy sigh while holding the clipboard to his chest", "mounting loss"),
    },
    {
      scene: 11, key: "s11_mock", role: "core_question", video: "story_ep2_s11_mock_motion.mp4",
      narration: "비웃던 말이 맞는 것처럼 보였어. 여기서 멈춰야 했을까.",
      imageBrief: `어두운 저녁 회장 집무실. ${CHAIRMAN}이 책상 앞 의자에 홀로 앉아 서류 더미 위에 두 손을 깍지 끼고 창밖 서울 야경을 바라본다. 책상 스탠드 하나만 켜져 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "C",
      lock: "the stack of papers on the desk stays plain with no text; the single fountain pen stays lying where it is; the city lights outside the window stay fixed; his glasses, silver hair and dark gray suit never change and nobody else enters.",
      motion: motion("the man sits still with clasped hands, slowly exhales and lowers his gaze a little, the desk lamp glows steadily and the city lights twinkle softly outside", "lonely doubt"),
    },
    {
      scene: 12, key: "s12_date", role: "evidence", video: "story_ep2_s12_date_motion.mp4",
      narration: "1987년 8월 6일, 이병철 회장이 결정을 내렸어.",
      imageBrief: `${CHAIRMAN}의 얼굴 클로즈업. 책상 앞에서 천천히 고개를 들어 정면을 바라보는 결의에 찬 눈빛. 뒤로 흐릿하지 않게 집무실 책장과 창밖 불빛이 보이고, 책상 위에는 만년필 한 자루가 놓여 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "close", bg: "C",
      lock: "his glasses, silver hair and dark gray suit never change; the fountain pen on the desk stays where it is; the bookshelf and city lights behind stay fixed; nothing is written on the paper or the wall.",
      motion: motion("the man slowly lifts his head and meets the camera with a firm determined gaze, a small steady breath, his eyes narrow slightly with resolve", "firm decision"),
    },
    {
      scene: 13, key: "s13_decision", role: "evidence", video: "story_ep2_s13_decision_motion.mp4",
      narration: "적자 속에서도 3억 4000만 달러를 투자해, 새 공장을 내일 착공하라고 했지.",
      imageBrief: "맑은 날 공장 부지 착공식. 흰 안전모를 쓴 정장 차림 관계자 다섯 명이 일렬로 서서 삽을 두 손으로 쥐고 흙에 꽂는 순간이다. 뒤로 굴착기 두 대와 철골 뼈대, 푸른 하늘. " + NO_TEXT,
      shot: "wide", bg: "I",
      lock: "the two excavators and the steel frame behind stay still with no company names, logos or text; the five shovels stay held with both hands in the same line; the plain white tent has no text; no extra people enter.",
      motion: motion("the five officials in white helmets push their shovels into the dirt in unison and lift a little soil, a light breeze stirs their jackets, the excavators and frame behind stay completely still", "decisive groundbreaking"),
    },
    {
      scene: 14, key: "s14_luck", role: "evidence", video: "story_ep2_s14_luck_motion.mp4",
      narration: "그해 말 미국 PC 시장이 살아나면서 반도체 값이 다시 올랐어.",
      imageBrief: "1987년 미국 컴퓨터 매장 안. 진열대마다 베이지색 개인용 컴퓨터가 줄지어 있고, 손님 두 명이 한 컴퓨터 앞에서 화면을 보며 이야기하고 점원이 큰 상자 하나를 두 손으로 안아 건네준다. 화면에는 단색 초록 빛 무늬만 있다. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "J",
      lock: "all PC screens keep only the plain green glow with no text; the box held by the clerk keeps a plain surface with no logo or text; the rows of PCs on the display tables stay fixed; no extra customers enter.",
      motion: motion("the two customers talk and nod looking at the screen, the clerk holds out the big box with both arms and smiles, the shop lights glow steadily", "relief of a recovering market"),
    },
    {
      scene: 15, key: "s15_profit", role: "evidence", video: "story_ep2_s15_profit_motion.mp4",
      narration: "1988년, 도쿄 선언 5년 만에 삼성 반도체는 처음으로 흑자를 냈지.",
      imageBrief: "임원 회의실. 정장 입은 임원 다섯 명이 일어서서 서로 악수하고 박수를 친다. 뒤쪽 벽의 큰 화면에는 초록색 막대그래프가 계단처럼 올라가 있다(축·숫자·글자 없음). " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "K",
      lock: "the large screen keeps only the plain rising green bars with no axes, numbers or text; the long table and chairs stay fixed; the five executives keep the same positions and nobody new enters.",
      motion: motion("the five executives shake hands and applaud with relieved smiles, one pats another on the shoulder, the rising green bars on the screen stay plain and still", "relieved celebration"),
    },
    {
      scene: 16, key: "s16_number1", role: "evidence", video: "story_ep2_s16_number1_motion.mp4",
      narration: "그리고 1992년, 삼성은 메모리 반도체 D램 세계 1위가 됐어.",
      imageBrief: "어두운 무대 위 스포트라이트 아래 3단 시상대. 가장 높은 가운데 단 위에 큰 칩 하나(금색 핀)가 놓여 있고 양옆 낮은 단에 작은 칩이 각각 하나씩 놓여 있다. 은색 종이 조각들이 천천히 흩날린다. 사람 없음. " + NO_TEXT,
      shot: "wide", bg: "L",
      lock: "the large chip stays on the highest step and the two small chips stay on the lower steps in the same arrangement for the whole clip; the podium has no numbers or text; no people ever appear; only the silver confetti and the spotlight shimmer move.",
      motion: motion("silver confetti drifts slowly down through the spotlight, the light beam shimmers gently on the large chip, the podium and the three chips stay completely still", "triumph"),
    },
  ]),
});

// ── 17번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성(참조 이미지 첨부·부엉박사 프레임 규칙은 owl3dv5 경로가 처리) ──
export const STORY_EP2_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 2,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep2",
  sceneBackgrounds: Object.freeze({
    M: {
      label: "반도체 연구소 로비(17번 부엉박사)",
      image: "밝은 반도체 연구소 로비. 부엉박사 뒤로 큰 유리벽 너머 하얀 클린룸의 흐릿하지 않은 실루엣이 보이고, 한쪽에 글자 없는 둥근 웨이퍼 모양 조형물(무지개빛 격자 무늬만)이 서 있다. 바닥은 매끈한 연한 회색 석재, 푸른빛 도는 밝은 조명.",
      videoStyle: "bright bluish semiconductor research lobby with a glass wall onto a cleanroom",
      videoStatics: "the large glass wall with the cleanroom silhouettes, the plain round wafer sculpture with its rainbow grid pattern, the smooth light gray stone floor, and the bright bluish lights",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 17, key: "s17_close", role: "save", video: "story_ep2_s17_close_motion.mp4",
      narration: "공장을 더 지은 선택과 다시 오른 값이 겹쳐서, 비웃음이 뒤집힌 거야. 이런 이야기 더 보고 싶으면 팔로우 해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 유리벽·조명·천장 같은 배경만 보이게 해.",
      shot: "medium", bg: "M",
      lock: "the round wafer sculpture keeps its plain rainbow grid pattern with no text; the glass wall and cleanroom silhouettes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 1편 STORY_EP1_ASSEMBLE_SPEC과 같은 구성(2026-10-07) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep2-assembly-spec.mjs --spec-export STORY_EP2_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep2-clips --audio-summary <audio-fixed 요약> --tts-script <tts 스크립트> --out-dir C:/tmp/story-ep2-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP2_FULL_SPEC = Object.freeze({
  ...STORY_EP2_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP2_SEMI_SPEC.sceneBackgrounds, ...STORY_EP2_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP2_SEMI_SPEC.scenes, ...STORY_EP2_END_SPEC.scenes]),
});

export const STORY_EP2_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP2_FULL_SPEC,
  headerTitle: Object.freeze(["삼성 반도체,", "비웃음이 뒤집힌", "선택"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["반도체", "과대망상증", "3불가론", "적자", "흑자", "D램", "1위"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+(?:억|만|조)", "[0-9,.]+(?:배|개월)", "[0-9]+분의"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  // 자막 경계 예외(2026-10-07): 강조 숫자가 커지는 폭 때문에 한 줄에 안 들어가 자동 분할이 갈라 놓은 2곳. 대사를 바꾸려면 TTS 재생성(유료)이 필요해 사유와 함께 승인.
  captionBoundaryExceptions: Object.freeze([
    { left: "2월", right: "73세의", reason: "'1983년 2월, 73세의'는 원문에 쉼표(낭독 쉼 150ms)가 있는 자연 경계인데 자막에서 쉼표가 지워져 월|숫자 분할로 잡힘(s2, 2026-10-07)" },
    { left: "1984년", right: "10월에는", reason: "연도와 월이 한 줄(강조 확대 폭)에 안 들어가 연도|월에서 갈림(s8), TTS 재생성 회피(2026-10-07)" },
    { left: "4000만", right: "달러를", reason: "'3억 4000만 달러를'이 한 줄 폭을 넘어 숫자|단위에서 갈림(s13), TTS 재생성 회피(2026-10-07)" },
  ]),
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP2_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
