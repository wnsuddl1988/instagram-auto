/**
 * 스토리형 1편(기준 편) — 금 모으기 재연 장면 스펙 (2026-10-07).
 *
 * 기준: `_ai/story-format-structure-v1.md`(대본 방식 v3 확정) — B 방식(재연 장면 중심, 같은 3D 화풍 주인공 시민 1명, 부엉박사는 18번 장면만).
 * 대본: `C:/tmp/story-ep1-gold/gold-scenes-final.json` 18장면 543자(검사기 반드시 수정 0, 새 독자 점검 2회). 팩트표 `_ai/story-ep1-gold-script-draft.md`.
 * TTS: `C:/tmp/money-shorts-os/story-ep1-tts/output-v1/tempo-1.15-gap0.35/…summary…json`(89.78초). 배경음 `C:/tmp/money-shorts-os/story-ep1-bgm/output-v1/story-ep1-gold.bgm.mp3`.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형):
 *  - 화면에 글자·숫자·로고를 넣지 않는다(숫자는 자막이 맡는다). 예외 = 11번 달력의 큰 '8월'·'23'.
 *  - 소품은 두 손으로 감싸 쥐거나 바닥·탁자에 거치. 빈 면(민무늬 큰 면) 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - 실존 인물 얼굴은 그리지 않는다: 6번 추기경 장면은 사제복 소매의 손만(얼굴 없음).
 *  - 주인공 시민 1명(30대 후반 여성, 짧은 파마머리·크림색 가디건·갈색 치마·붉은 천 주머니)이 1·5·17번에 나오고, 군중은 1번만.
 *
 * 이미지 생성: ① 1~17번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character story3d --scene-spec ./_story-ep1-assembly-spec.mjs --scene-spec-export STORY_EP1_ASSEMBLY_SPEC --out-dir C:/tmp/story-ep1-images`
 *            ② 18번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep1-assembly-spec.mjs --scene-spec-export STORY_EP1_END_SPEC --out-dir C:/tmp/story-ep1-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고는 하나도 넣지 마(간판·포장·표면 모두 무늬만).";

const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP1_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 1,
  displayEpisode: 1,
  sourceCandidate: "story-ep1-gold-collection-1998",
  title: "금 모으기 — 장롱 속 금을 들고 줄을 선 나라",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "story3d",
  imagePrefix: "story_ep1",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "은행 지점 앞 인도(1번)",
      image:
        "1998년 겨울 아침의 은행 지점 앞 인도. 둥근 모서리의 아담한 3층 은행 건물, 큰 유리문과 작은 둥근 노란 심벌(글자 없음), 건물 앞 화단의 둥근 상록수, 인도 바닥은 연한 회갈색 보도블록. 하늘은 맑고 차가운 연한 하늘색.",
      videoStyle: "cold bright winter morning bank sidewalk",
      videoStatics: "the rounded bank building, the large glass doors, the plain round yellow emblem, the round evergreen shrubs, and the light gray paving stones",
    },
    B: {
      label: "은행 로비 창구(5·6·17번)",
      image:
        "따뜻한 햇살이 드는 1998년 은행 지점 로비. 긴 원목 창구 카운터(윗면에 붉은 천이 깔려 있음), 창구 뒤 유리 칸막이, 둥근 대기 의자 두세 개, 둥근 화분 식물, 바닥은 매끈한 연한 베이지 타일. 벽에는 글자 없는 둥근 벽시계.",
      videoStyle: "warm sunlit 1998 bank lobby with a long wooden teller counter",
      videoStatics: "the long wooden counter with its red cloth, the glass partition, the round waiting chairs, the round potted plants, the plain round wall clock, and the light beige tile floor",
    },
    C: {
      label: "국가 금고방(2·9·14·15번)",
      image:
        "천장이 높은 둥근 국가 금고방. 한쪽에 거대한 둥근 금고 문이 활짝 열려 있고(두꺼운 회색 금속 테두리, 글자 없음), 벽을 따라 둥근 금속 서랍 선반이 줄지어 있으며, 방 한가운데 낮은 원목 탁자 하나, 바닥은 매끈한 짙은 회색 석재. 차갑고 고요한 조명.",
      videoStyle: "cool quiet national vault room",
      videoStatics: "the huge open round vault door, the rows of round metal drawer shelves, the low wooden table, and the smooth dark gray stone floor",
    },
    D: {
      label: "국제 회의실(3·12번)",
      image:
        "밝은 국제기구 회의실. 긴 원목 회의 탁자, 양쪽에 높은 등받이 의자, 뒤쪽으로 둥근 아치 창문 두 개와 연한 커튼, 바닥은 짙은 갈색 카펫. 벽에는 깃발·글자 없이 둥근 액자 하나만.",
      videoStyle: "bright formal international meeting room",
      videoStatics: "the long wooden meeting table, the high-backed chairs, the two round arched windows with light curtains, and the dark brown carpet",
    },
    E: {
      label: "비 오는 저녁 거리(4번)",
      image:
        "비 내리는 흐린 저녁의 상점가 거리. 양쪽 가게는 둥근 모서리의 낮은 건물이고 모두 가로 홈이 파인 회색 셔터가 내려져 있으며(셔터에 낙서·글자 없음), 길가에 둥근 가로등, 바닥은 비에 젖은 짙은 회색 아스팔트와 연석 계단. 하늘은 짙은 회색.",
      videoStyle: "gloomy rainy evening shopping street with closed shutters",
      videoStatics: "the low rounded shop buildings, the closed gray ribbed shutters, the round street lamps, and the wet dark asphalt and curb steps",
    },
    F: {
      label: "금 계량 창고(7·16번)",
      image:
        "넓고 따뜻한 조명의 금 계량 창고. 중앙에 아주 큰 양팔 저울(접시 두 개, 눈금판 없음)이 서 있고, 벽을 따라 나무 상자 선반이 쌓여 있으며, 뒤쪽 큰 둥근 창문 밖으로 거리가 보인다. 바닥은 매끈한 연한 갈색 나무판.",
      videoStyle: "warm lit gold weighing warehouse with a giant balance scale",
      videoStatics: "the giant two-pan balance scale and its frame, the stacked wooden crate shelves, the large round window, and the smooth light brown wooden floor",
    },
    G: {
      label: "공항 화물 계류장(8번)",
      image:
        "해 질 녘 공항 화물 계류장. 몸통에 글자·로고가 없는 흰색 대형 화물기가 화물칸 문을 열고 서 있고, 지게차 한 대와 나무 상자 팔레트, 바닥은 매끈한 회색 콘크리트, 하늘은 주황빛 노을.",
      videoStyle: "warm sunset airport cargo apron",
      videoStatics: "the plain white cargo plane with its open cargo door, the forklift, the stacked wooden pallets, the smooth gray concrete apron, and the orange sunset sky",
    },
    H: {
      label: "수출 항구(10번)",
      image:
        "맑은 날의 수출 항구. 부두에 대형 컨테이너선이 서 있고, 노란 크레인 두 대가 단색(빨강·파랑·초록·노랑) 컨테이너를 싣고 있으며(컨테이너에 글자·로고 없음), 뒤로 공장 굴뚝에서 하얀 연기가 오르고, 바닥은 매끈한 회색 부두.",
      videoStyle: "bright clear-day export harbor",
      videoStatics: "the large container ship, the two yellow cranes, the plain single-colored containers, the factory chimneys in the background, and the smooth gray quay",
    },
    I: {
      label: "아침 햇살 벽 달력(11번)",
      image:
        "아침 햇살이 비스듬히 드는 연한 아이보리색 벽. 벽 한가운데에 종이 한 장짜리 벽걸이 달력이 걸려 있다. 벽 아래쪽에는 둥근 나무 서랍장 윗면과 작은 둥근 화분이 보인다.",
      videoStyle: "soft morning sunlight on an ivory wall",
      videoStatics: "the ivory wall, the hanging single-page wall calendar, the round wooden chest top, and the small round potted plant",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1,
      key: "s1_hook",
      role: "hook",
      video: "story_ep1_s1_hook_motion.mp4",
      narration: "나라 빚을 갚겠다고, 국민이 장롱 속 금을 들고 은행 앞에 줄을 선 나라가 있어. 1998년의 한국이야.",
      imageBrief:
        "은행 앞 인도에 평범한 시민들(주부·아저씨·할머니·청년)이 끝이 안 보이게 길게 한 줄로 서 있고, 모두 작은 천 주머니나 손수건 보따리를 두 손으로 가슴에 감싸 안고 있다. 맨 앞에는 주인공 여성이 붉은 천 주머니를 두 손으로 가슴에 안고 은행 유리문 쪽을 향해 서서 얼굴이 보이게 살짝 돌아본 3/4 옆모습으로 조용히 결연한 표정을 짓는다. " + NO_TEXT,
      shot: "wide",
      bg: "A",
      lock: "the plain round yellow emblem on the bank wall stays plain forever — no letters, numbers or marks ever appear on it; the people in the far distance of the line stay small and simple, with no new faces or signs appearing.",
      motion: motion(
        "the long line of citizens shuffles slowly one small step forward, breath visible in the cold air, the front woman tightens her hold on the red pouch and glances toward the glass doors",
        "quiet determination in a long line",
      ),
    },
    {
      scene: 2,
      key: "s2_crisis",
      role: "fact",
      video: "story_ep1_s2_crisis_motion.mp4",
      narration: "1997년 12월, 나라가 당장 쓸 수 있는 달러는 39억 달러뿐이었어. 해외에 갚을 빚에 비하면 턱없이 모자랐지.",
      imageBrief:
        "열린 둥근 금고 문과 줄지은 금속 서랍 선반은 거의 비어 있고, 방 한가운데 낮은 원목 탁자 위에 초록색 지폐 다발(숫자·글자 없는 단순한 초록 직사각 다발) 서너 개만 작게 놓여 있다. 정장 입은 중년 남자 관리 한 명이 방 안쪽에서 뒷모습으로 서서 그 광경을 내려다본다. " + NO_TEXT,
      shot: "wide",
      bg: "C",
      motion: motion(
        "the lone official in a suit stands still looking down, one hand slowly rubs the back of his neck, the dust in the cold light drifts slowly, the few green bundles on the table stay put",
        "tense emptiness",
      ),
    },
    {
      scene: 3,
      key: "s3_imf",
      role: "fact",
      video: "story_ep1_s3_imf_motion.mp4",
      narration: "결국 IMF라는 국제기구에서 195억 달러를 빌렸어. 하지만 이 돈 역시 달러로 갚아야 하는 빚이었지.",
      imageBrief:
        "긴 회의 탁자 양쪽에 정장 입은 한국 관리 한 명과 외국인 관리 한 명이 마주 앉아 있다. 탁자 한가운데에는 초록색 지폐 다발(숫자·글자 없음)이 높이 쌓여 있고, 그 더미를 굵은 갈색 가죽 벨트가 단단히 묶고 있다. 한국 관리는 무거운 표정으로 그 더미를 바라본다. 악수는 하지 않는다. " + NO_TEXT,
      shot: "medium",
      bg: "D",
      lock: "the large round gold plaque on the back wall stays completely blank — no text, numbers or marks ever appear on it; the small flags outside the windows keep their exact colors and patterns; the leather belt stays buckled around the stack of green bundles.",
      motion: motion(
        "the Korean official slowly lowers his gaze to the strapped stack and exhales, the foreign official folds his hands calmly, the strapped stack and the table stay completely still",
        "heavy weight of a loan",
      ),
    },
    {
      scene: 4,
      key: "s4_turn",
      role: "core_question",
      video: "story_ep1_s4_turn_motion.mp4",
      narration: "다들 이 나라는 끝났다고 생각했지. 그런데 아무도 예상 못 한 일이 벌어져.",
      imageBrief:
        "비 내리는 흐린 저녁 거리. 정장 입은 중년 남자가 서류가방을 두 무릎에 올려 두 손으로 감싸 쥔 채 길가 연석 계단에 앉아 고개를 숙이고 있다. 그 옆으로 우산을 쓴 행인 두 사람이 어깨를 늘어뜨리고 천천히 지나간다. " + NO_TEXT,
      shot: "medium",
      bg: "E",
      lock: "the wet street reflections and the closed gray shutters stay consistent frame to frame; the seated man keeps holding his briefcase with both hands for the whole clip and never lets go of it.",
      motion: motion(
        "rain falls steadily, the two passersby under umbrellas walk slowly past the seated man who keeps his head bowed and holds his briefcase, then at the very end he lifts his head slightly as if hearing something",
        "gloomy resignation with a faint turn",
      ),
    },
    {
      scene: 5,
      key: "s5_people",
      role: "evidence",
      video: "story_ep1_s5_people_motion.mp4",
      narration: "사람들이 아이 돌반지, 결혼반지, 부모님께 드렸던 금거북이까지 꺼내 들고 은행으로 향한 거야.",
      imageBrief:
        "은행 창구 카운터의 붉은 천 위에 금 돌반지(아주 작은 아기 반지), 금 결혼반지 두 개, 손바닥만 한 금거북이 조각상이 가지런히 놓여 있다. 오른쪽에서 크림색 가디건 소매의 두 손이 열린 붉은 천 주머니를 붉은 천 옆에 내려놓고 두 손을 천 위 양옆에 가볍게 얹은 채 정지해 있다. 얼굴은 그리지 마(손과 소품만). " + NO_TEXT,
      shot: "close",
      bg: "B",
      lock: "the large round gold plaque on the wall stays completely blank — no text or marks ever appear on it; the three gold rings, the golden turtle and the red pouch stay exactly where they are; both hands stay resting flat on the cloth and never move or change shape.",
      motion: motion(
        "warm light makes the gold rings and the small golden turtle glint softly, the two hands resting on the cloth stay still, only a gentle shimmer moves across the gold",
        "tender sacrifice",
      ),
    },
    {
      scene: 6,
      key: "s6_cardinal",
      role: "evidence",
      video: "story_ep1_s6_cardinal_motion.mp4",
      narration: "김수환 추기경은 추기경이 될 때 받은 금 십자가까지 내놨어.",
      imageBrief:
        "검은 사제복 소매(붉은 단이 달린 소맷부리)의 두 손이 손바닥만 한 반짝이는 금 십자가(글자·각인 없음)를 두 손으로 감싸 쥐고, 은행 창구의 붉은 천 위로 막 내려놓으려는 정지된 순간. 얼굴과 상체는 화면 밖이라 그리지 마(손과 소맷부리와 십자가만). " + NO_TEXT,
      shot: "close",
      bg: "B",
      lock: "the large round gold plaque on the wall stays completely blank — no text or marks ever appear on it; the golden cross stays exactly where it is, resting on the red cloth under the two hands; the hands and fingers stay completely still and never change shape or grip; no face, head or body ever appears.",
      motion: motion(
        "the two hands in black cassock sleeves and the golden cross stay completely still exactly as in the image; only warm light shimmers slowly along the cross and the soft sunlight shifts a little across the red cloth",
        "solemn quiet offering",
      ),
    },
    {
      scene: 7,
      key: "s7_numbers",
      role: "evidence",
      video: "story_ep1_s7_numbers_motion.mp4",
      narration: "첫 달에만 165톤이 모였고, 석 달 동안 351만 명이 모은 금은 모두 227톤이었어.",
      imageBrief:
        "큰 양팔 저울의 한쪽 접시에 금반지·금붙이·작은 금괴가 산처럼 수북이 쌓여 있고, 다른 접시에는 큼직한 쇳덩이 추들이 올라 있어 저울이 균형을 맞추려 흔들린다. 앞치마 입은 직원 두 명이 나무 상자에서 금붙이를 더 쏟아 붓고, 뒤쪽 큰 둥근 창문 밖으로 은행 앞에 선 줄이 끝없이 이어진 게 작게 보인다. " + NO_TEXT,
      shot: "medium",
      bg: "F",
      lock: "the two workers keep their wooden boxes tilted exactly where they are, held steadily in their gloved hands, for the whole clip; the pile of gold on the scale pan keeps its shape; the tiny people in the window stay small and simple.",
      motion: motion(
        "a few more gold pieces keep sliding out of the tilted boxes onto the pile, the two workers only nod their heads slightly, the heavy balance scale sways very slightly and settles, small glints twinkle on the gold, the line of tiny people outside the window creeps forward slowly",
        "overwhelming volume of gold",
      ),
    },
    {
      scene: 8,
      key: "s8_sold",
      role: "evidence",
      video: "story_ep1_s8_sold_motion.mp4",
      narration: "낸 사람들은 대부분 금값을 원화로 받았고, 나라는 그 금을 해외에 팔아 약 22억 달러를 마련했어.",
      imageBrief:
        "해 질 녘 공항 계류장에서 지게차가 금괴가 가득 담긴 나무 상자 팔레트를 대형 화물기의 열린 화물칸으로 싣고 있다. 맨 앞 상자 하나는 뚜껑이 열려 매끈한 금괴(글자·각인 없음)가 반짝인다. 작업복 입은 직원 두 명이 옆에서 지켜본다. " + NO_TEXT,
      shot: "wide",
      bg: "G",
      lock: "the white airplane fuselage and tail stay plain white forever — no airline name, logo, letters, numbers or markings ever appear on them; the crates on the pallet stay stacked and keep their shape.",
      motion: motion(
        "the forklift advances very slowly a short distance toward the open cargo hold carrying the pallet of gold crates, the ground worker keeps his gloved hands raised in a guiding signal, warm sunset light glints on the gold bars",
        "valuable cargo leaving the country",
      ),
    },
    {
      scene: 9,
      key: "s9_share",
      role: "evidence",
      video: "story_ep1_s9_share_motion.mp4",
      narration: "빌린 돈의 10분의 1 남짓이었지만, 달러가 바닥난 나라엔 결코 작은 돈이 아니었지.",
      imageBrief:
        "금고방 한가운데 낮은 원목 탁자 위에 초록색 지폐 다발(숫자·글자 없음) 작은 한 더미가 놓여 있고, 바로 옆에는 같은 초록 지폐 다발이 천장 가까이까지 쌓인 키 큰 탑이 서 있어 작은 더미가 탑 높이의 약 10분의 1로 보인다. 정장 입은 중년 남자 관리가 작은 더미를 두 손으로 소중히 감싸 쥐듯 내려다본다. " + NO_TEXT,
      shot: "medium",
      bg: "C",
      lock: "the tall tower of green bundles beside the table stays perfectly still and keeps every band and edge exactly as in the image; the small stack under the official's hands keeps its shape; no numbers or text appear on any bundle.",
      motion: motion(
        "the official gently rests both hands near the small stack and nods slowly, the towering stack beside it stays perfectly still, soft dust drifts in the light",
        "small but precious relief",
      ),
    },
    {
      scene: 10,
      key: "s10_rest",
      role: "evidence",
      video: "story_ep1_s10_rest_motion.mp4",
      narration: "나머지는 3년 넘게, 수입을 확 줄이고 수출로 달러를 벌어 갚아 나갔어.",
      imageBrief:
        "맑은 날 수출 항구. 대형 컨테이너선이 부두에 서 있고 노란 크레인 두 대가 단색 컨테이너를 쉬지 않고 배에 싣는다. 부두에서 작업모를 쓴 노동자들이 분주히 움직이고, 뒤로 공장 굴뚝에서 하얀 연기가 오른다. " + NO_TEXT,
      shot: "wide",
      bg: "H",
      lock: "the dark ship hull and all containers stay plain — no ship name, letters, numbers, logos or markings ever appear on them; the number and positions of the people and the forklift stay the same, and nobody new appears.",
      motion: motion(
        "the two cranes lower the hanging containers slowly and steadily, white smoke rises from the chimneys, the workers and the forklift stay almost still",
        "steady determined effort",
      ),
    },
    {
      scene: 11,
      key: "s11_date",
      role: "evidence",
      video: "story_ep1_s11_date_motion.mp4",
      narration: "그리고 2001년 8월 23일.",
      imageBrief:
        "아침 햇살이 드는 아이보리색 벽에 종이 한 장짜리 벽걸이 달력이 걸려 있다. 달력 위쪽에 큰 글씨로 '8월', 한가운데에 아주 큰 숫자 '23'과 그 숫자를 둘러싼 붉은 동그라미 하나만 있고 다른 칸이나 작은 글씨는 그리지 마. 달력은 벽에 반듯하게 걸려 움직이지 않는다.",
      shot: "close",
      bg: "I",
      lock: "the calendar text '8월' and '23' with the red circle keeps its exact shapes and stays sharp, dark and fully readable in every frame including the last; the framed picture on the right and the books never change.",
      motion: motion(
        "morning sunlight slowly brightens on the wall and the calendar, only the sunbeam and faint dust specks move, the calendar itself hangs perfectly still and its text stays sharp",
        "a decisive date arrives",
      ),
    },
    {
      scene: 12,
      key: "s12_repaid",
      role: "evidence",
      video: "story_ep1_s12_repaid_motion.mp4",
      narration: "한국은 그 195억 달러를 예정보다 3년이나 빨리 전부 갚아 버려.",
      imageBrief:
        "밝은 회의실에서 정장 입은 한국 관리와 외국인 관리가 탁자를 사이에 두고 서서 서로를 향해 가볍게 고개를 숙여 인사하며 두 손은 몸 앞에 모은다. 탁자 위에는 짙은 남색 표지의 두꺼운 서류철 하나가 놓여 있고, 그 표지 한쪽에 작은 정사각형 붉은 도장 자국(글자 없는 단순한 사각 무늬 하나)이 찍혀 있다. 흰 바탕에 붉은 원 모양은 절대 그리지 마(특정 국가의 국기처럼 보이면 안 돼). 창밖은 맑은 하늘. " + NO_TEXT,
      styleOnly: true, // 재생성(2026-10-07): 1차 이미지의 서류철이 흰 바탕+붉은 원이라 일본 국기처럼 보여 반려. 주인공이 안 나오는 장면이라 화풍만 지정.
      shot: "medium",
      bg: "D",
      lock: "the round framed landscape painting on the back wall stays exactly as in the image and never gains text or marks; the folder on the table keeps its dark navy cover with one small square red stamp mark and never gains a white cover, a red circle or any text; the folder stays completely still on the table; the skyline outside the windows stays fixed.",
      motion: motion(
        "the two officials bow slightly toward each other and straighten up with relieved smiles, the stamped folder on the table stays completely still, sunlight brightens the room",
        "relief and closure",
      ),
    },
    {
      scene: 13,
      key: "s13_first",
      role: "evidence",
      video: "story_ep1_s13_first_motion.mp4",
      narration: "IMF 돈을 빌린 아시아 나라 가운데, 가장 먼저 다 갚은 게 한국이었어.",
      // 2026-10-07 교체(Owner "달리기 장면 너무 뜬금없다, 흐름에 안 맞다"): 육상 경기장 은유 → s3·s12와 같은 회의실에서 "빚 더미를 아직 앞에 둔 아시아 관리들 vs 먼저 다 갚은 한국 관리".
      imageBrief:
        "3번·12번과 같은 밝은 국제기구 회의실의 긴 원목 탁자. 탁자 왼쪽에 정장 입은 아시아 나라 관리 두 명, 오른쪽에 두 명이 앉아 있고(서로 다른 얼굴·헤어스타일·넥타이 색), 네 명 각자 앞 탁자 위에는 3번처럼 굵은 갈색 가죽 벨트로 단단히 묶인 초록색 지폐 다발 더미가 하나씩 놓여 있으며(숫자·글자 없음) 모두 무거운 표정으로 자기 더미를 내려다본다. 화면 앞쪽(카메라 가까운 쪽) 탁자 끝에는 한국 관리 한 명이 있는데, 그의 앞에는 지폐 더미가 없고 닫힌 짙은 남색 서류철 하나만 놓여 있으며, 그가 서류철을 한 손으로 쥐고 가볍게 일어서며 옅게 미소 짓는다. 국기·명패·이름표·글자는 그리지 마. " + NO_TEXT,
      styleOnly: true, // 새 대화에서 단독 생성되므로 주인공 여성이 끼어들지 않게 화풍만 지정
      shot: "medium",
      bg: "D",
      lock: "the four belted stacks of green bundles in front of the four seated officials stay completely still on the table with their leather belts and buckles in place, and no numbers or text appear on any bundle; the closed navy folder stays in the standing Korean official's hand; the round framed painting on the back wall and the skyline outside the windows stay fixed; no flags, name plates or text appear anywhere.",
      motion: motion(
        "the Korean official is already standing and holds the closed navy folder steadily in one hand; he only turns his head slightly and gives a faint relieved smile with a slow breath, the four seated officials look down at their stacks with heavy expressions and lower their heads slightly, the stacks and the folder stay completely still",
        "the first to finish repaying while the others still carry their debt",
      ),
    },
    {
      scene: 14,
      key: "s14_more",
      role: "core_question",
      video: "story_ep1_s14_more_motion.mp4",
      narration: "그런데 더 놀라운 건 그다음이야.",
      imageBrief:
        "조명이 꺼져 어두운 금고방. 방 한가운데 낮은 탁자 위에 쌓인 금괴 더미에서만 따뜻한 금빛이 은은히 새어 나와 주변 벽과 선반을 비추고, 둥근 금고 문은 열려 있다. 사람은 없다. 금괴에는 글자·숫자·각인이 없다. " + NO_TEXT,
      shot: "medium",
      bg: "C",
      motion: motion(
        "the warm golden glow from the gold pile slowly pulses brighter, soft light creeps across the walls and shelves, dust motes float, nothing else moves",
        "mysterious anticipation",
      ),
    },
    {
      scene: 15,
      key: "s15_value",
      role: "evidence",
      video: "story_ep1_s15_value_motion.mp4",
      narration: "그때 모은 금 227톤, 지금 금값으로 치면 약 300억 달러야.",
      imageBrief:
        "같은 금고방에 이번에는 방 한가운데와 선반 위에 금괴가 피라미드처럼 높이 쌓여 환하게 빛난다. 금괴 표면은 매끈하고 글자·숫자·각인이 없다. 사람은 없다. 금고 문은 열려 있고 방 전체가 따뜻한 금빛 조명으로 가득하다. " + NO_TEXT,
      shot: "medium",
      bg: "C",
      lock: "all the gold bar stacks on the shelves and the pyramid on the table keep their exact shapes and positions and never flicker or rearrange; no numbers, letters or marks appear on any gold bar.",
      motion: motion(
        "one soft sweep of golden light passes slowly across the pyramid and the shelves making the gold glitter a little, a few small sparkles twinkle on the gold surfaces, everything else stays perfectly still",
        "awe at the value of the gold",
      ),
    },
    {
      scene: 16,
      key: "s16_compare",
      role: "evidence",
      video: "story_ep1_s16_compare_motion.mp4",
      narration: "나라가 IMF에서 빌린 195억 달러보다도 큰돈이지.",
      imageBrief:
        "큰 양팔 저울의 한쪽 접시에 금괴 더미가 올라 아래로 크게 기울어 있고, 반대쪽 접시에는 초록색 지폐 다발(숫자·글자 없음) 더미가 올라 위로 들려 있다. 사람은 없다. 금괴와 지폐에는 글자·숫자·각인이 없다. " + NO_TEXT,
      shot: "medium",
      bg: "F",
      lock: "the gold pan stays lower and the cash pan stays higher for the entire clip — the scale never tips the other way; the thin hanging cords stay straight and never bend or tangle; no numbers or text appear on any bundle or gold bar.",
      motion: motion(
        "the balance scale sways very slightly and settles with the gold pan low and the cash pan high, light glints on the gold, nothing else moves",
        "the gold outweighs the debt",
      ),
    },
    {
      scene: 17,
      key: "s17_meaning",
      role: "evidence",
      video: "story_ep1_s17_meaning_motion.mp4",
      narration: "값은 받았어도, 그 귀한 걸 나라가 제일 어려울 때 판 거야.",
      imageBrief:
        "따뜻한 오후 햇살의 은행 창구. 주인공 여성이 붉은 천 주머니를 두 손으로 감싸 쥐고 창구 직원에게 건네려는 순간, 조용히 결연한 얼굴로 직원을 바라본다(얼굴이 보이는 3/4 정면). 창구 직원은 미소를 띠고 두 손을 내밀어 받으려 한다. " + NO_TEXT,
      shot: "medium",
      bg: "B",
      lock: "the large round gold plaque on the wall stays completely blank — no text or marks ever appear on it; the red pouch stays held between the woman's hands and the teller's hands exactly as in the image, with no passing, pulling or letting go; the hands never change shape or the number of fingers.",
      motion: motion(
        "the woman and the teller stay in the exact pose of the image, only blinking slowly and breathing gently, their faces soften slightly, warm afternoon light flickers softly across the counter",
        "quiet resolve and gratitude",
      ),
    },
  ]),
});

// ── 18번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성(참조 이미지 첨부·부엉박사 프레임 규칙은 owl3dv5 경로가 처리) ──
export const STORY_EP1_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 1,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep1",
  sceneBackgrounds: Object.freeze({
    B2: {
      label: "은행 로비 창구(18번 부엉박사)",
      image:
        "따뜻한 햇살이 드는 은행 지점 로비. 부엉박사 뒤로 긴 원목 창구 카운터(윗면 붉은 천 위에 붉은 천 주머니 하나가 놓여 있음), 둥근 대기 의자 두세 개, 둥근 화분 식물이 넓게 펼쳐지고, 바닥은 매끈한 연한 베이지 타일. 글자·로고 없는 둥근 벽시계 하나.",
      videoStyle: "warm sunlit bank lobby with a long wooden teller counter",
      videoStatics: "the long wooden counter with its red cloth and the single red pouch, the round waiting chairs, the round potted plants, the plain round wall clock, and the light beige tile floor",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 18,
      key: "s18_question",
      role: "save",
      video: "story_ep1_s18_question_motion.mp4",
      narration: "만약 지금 이런 위기가 또 온다면, 너라면 가장 아끼는 걸 들고 줄을 설 수 있을까? 댓글로 알려 줘.",
      imageBrief:
        "부엉이가 정면을 보며 한쪽 날개를 턱 아래에 대고 고개를 살짝 갸웃하는 사려 깊은 표정으로 시청자에게 묻는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음.",
      shot: "medium",
      bg: "B2",
      lock: "the hands and numerals of the wall clock stay exactly as in the image and never move or change; the red pouch stays resting on the counter; the sunglasses stay on top of the head.",
      speaks: true,
      motion: motion(
        "the character tilts its head slightly while one wing rests under the chin in a thoughtful pose, blinks slowly, then gives a gentle questioning look to the viewer; no props are held",
        "thoughtful question to the viewer",
      ),
    },
  ]),
});

// ── 화풍 비교 시험(2026-10-07 Owner "너무 만화같지는 않을까" → "비교해보자"): 같은 장면 설명 중 s1·s2·s7만 실사 스틸컷 화풍으로 ──
// 생성: `… --character storyreal --scene-spec ./_story-ep1-assembly-spec.mjs --scene-spec-export STORY_EP1_REAL_TEST_SPEC --out-dir C:/tmp/story-ep1-real-test`
export const STORY_EP1_REAL_TEST_SPEC = Object.freeze({
  ...STORY_EP1_ASSEMBLY_SPEC,
  imageCharacter: "storyreal",
  imagePrefix: "story_ep1_real",
  scenes: Object.freeze(STORY_EP1_ASSEMBLY_SPEC.scenes.filter((s) => [1, 2, 7].includes(s.scene))),
});

// ── 실사풍 1~17번 전체(2026-10-07 Owner "AI 채널이라 표시 문제 없고, 실사 먼저 → 2편은 만화풍으로 비교") ──
// 생성: `… --character storyreal --scene-spec ./_story-ep1-assembly-spec.mjs --scene-spec-export STORY_EP1_REAL_SPEC --out-dir C:/tmp/story-ep1-images-real`
// (같은 장면 설명·같은 영상 고정 지시를 쓰고 화풍만 실사 스틸컷으로. 주인공 1·5·17번은 한 대화 안에서 이어 만들어 일관성 유지)
export const STORY_EP1_REAL_SPEC = Object.freeze({
  ...STORY_EP1_ASSEMBLY_SPEC,
  imageCharacter: "storyreal",
  imagePrefix: "story_ep1_real",
});

// ── 반사실 3D 시험(2026-10-07 화풍 조사 후 Owner "만들어봐") — s1·s2·s7만, 내부 비교용 ──
// 생성: `… --character storysemi --scene-spec ./_story-ep1-assembly-spec.mjs --scene-spec-export STORY_EP1_SEMI_TEST_SPEC --out-dir C:/tmp/story-ep1-semi-test`
export const STORY_EP1_SEMI_TEST_SPEC = Object.freeze({
  ...STORY_EP1_ASSEMBLY_SPEC,
  imageCharacter: "storysemi",
  imagePrefix: "story_ep1_semi",
  scenes: Object.freeze(STORY_EP1_ASSEMBLY_SPEC.scenes.filter((s) => [1, 2, 7].includes(s.scene))),
});

// ── ★확정 화풍(2026-10-07 Owner "진행해"): 스토리형 = 반사실 3D. 1~17번 본 제작 ──
// 생성: `… --character storysemi --scene-spec ./_story-ep1-assembly-spec.mjs --scene-spec-export STORY_EP1_SEMI_SPEC --out-dir C:/tmp/story-ep1-images-semi`
// 18번은 만화 부엉박사 진행자 컷(`STORY_EP1_END_SPEC`, C:/tmp/story-ep1-images/story_ep1_s18.png)을 그대로 쓴다.
// 영상 고정 지시(lock)는 반사실 3D 이미지 기준으로 다시 썼다(2026-10-07 이미지 점검): 벽 원판은 시계·산수화로 바뀌었고, 13번은 재생성.
const SEMI_LOCKS = {
  13: "the four belted stacks of green bundles in front of the four seated officials stay completely still on the table with their leather belts and buckles in place, and no numbers or text appear on any bundle; the closed navy folder stays held steadily in the standing Korean official's one hand at the same height for the whole clip and never changes shape; his fingers never change; the round framed landscape painting on the back wall and the skyline outside the windows stay fixed; no flags, name plates or text appear anywhere.",
  1: "the plain gold disc on the bank facade stays plain forever — no letters, numbers or marks ever appear on it; the long line of people stretching into the distance stays small and simple with no new faces, signs or banners appearing; the woman keeps holding the red pouch against her chest with both hands for the whole clip.",
  2: "the huge round vault door with its spokes and bolts stays completely fixed and never turns or changes; the shelves stay empty; only the few green bundles on the table stay on the table unchanged; the man stays standing with his back to the camera.",
  3: "the round framed mountain painting on the back wall stays exactly as in the image and never gains text or marks; the city skyline and tower outside the windows stay fixed; the leather belt and buckle stay on the stack of green bundles, which stays completely still on the table.",
  4: "the utility pole, thin wires and street lamps stay fixed and never bend or flicker; the wet street reflections and the closed gray shutters stay consistent frame to frame; the seated man keeps holding his briefcase with both hands for the whole clip and never lets go of it.",
  5: "the round wall clock on the wall keeps its hands and plain face exactly as in the image and never gains numbers or text; the three gold rings, the golden turtle and the red pouch stay exactly where they are; both hands stay resting flat on the red cloth and never move or change shape.",
  6: "the round wall clock keeps its hands exactly as in the image and never gains text; the golden cross stays held exactly where it is by the two hands; the hands and fingers stay completely still and never change shape or grip; no face, head or body ever appears.",
  7: "the two workers keep their wooden boxes tilted exactly where they are, held steadily in their gloved hands, for the whole clip; the pile of gold on the scale pan keeps its shape; the thin hanging chains stay straight and never bend or tangle; the tiny people seen through the round window stay small and simple.",
  8: "the white airplane fuselage and tail stay plain white forever — no airline name, logo, letters, numbers or markings ever appear on them; the crates on the pallet stay stacked and keep their shape; the two workers on the ground stay standing.",
  9: "the tall tower of green bundles beside the table stays perfectly still and keeps every band and edge exactly as in the image; the vault door spokes and bolts stay fixed; the small stack under the man's hands keeps its shape; no numbers or text appear on any bundle.",
  10: "the dark ship hull and all containers stay plain — no ship name, letters, numbers, logos or markings ever appear on them; all cables, crane wires and mooring ropes stay still; the number and positions of the workers and forklifts stay the same and nobody new appears.",
  11: "the calendar text '8월' and '23' with the red circle keeps its exact shapes and stays sharp, dark and fully readable in every frame including the last; the framed picture on the right, the porcelain items and the plant never change.",
  12: "the round framed mountain painting stays exactly as in the image and never gains text or marks; the folder on the table keeps its dark navy cover with one small square red stamp mark and never gains a white cover, a red circle or any text; the folder stays completely still; the skyline outside the windows stays fixed; both men stay in their bowing pose.",
  14: "the huge round vault door spokes and bolts stay completely fixed; the gold bars on the table keep their exact positions; only the warm golden glow slowly brightens; no text appears anywhere.",
  15: "all the gold bar stacks on the shelves, on the floor and on the table keep their exact shapes and positions and never flicker or rearrange; the vault door stays fixed; no numbers, letters or marks appear on any gold bar.",
  16: "the gold pan stays lower and the cash pan stays higher for the entire clip — the scale never tips the other way; the thin hanging chains stay straight and never bend or tangle; no numbers or text appear on any bundle or gold bar; the view through the round window stays fixed.",
  17: "the round wall clock keeps its hands exactly as in the image and never gains text; the red pouch stays held between the woman's hands and the teller's open hands exactly as in the image, with no passing, pulling or letting go; the hands never change shape or the number of fingers; the teller stays seen mostly from behind and never turns toward the camera.",
};
export const STORY_EP1_SEMI_SPEC = Object.freeze({
  ...STORY_EP1_ASSEMBLY_SPEC,
  imageCharacter: "storysemi",
  imagePrefix: "story_ep1",
  scenes: Object.freeze(STORY_EP1_ASSEMBLY_SPEC.scenes.map((s) => Object.freeze({ ...s, lock: SEMI_LOCKS[s.scene] ?? s.lock }))),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 제목 띠 없음·하단 띠 없음·"AI 재연" 위쪽 표시·오프닝/CTA 없음 ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep1-assembly-spec.mjs --spec-export STORY_EP1_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep1-clips --audio-summary <tempo 요약> --tts-script <tts 스크립트> --out-dir C:/tmp/story-ep1-assembled
export const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

// ── 조립용 전체 스펙(1~17 반사실 3D + 18 부엉박사) — 조립기는 장면 18개를 한 스펙에서 받는다(2026-10-07 Owner 클립 18개 검수 통과 후) ──
export const STORY_EP1_FULL_SPEC = Object.freeze({
  ...STORY_EP1_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP1_SEMI_SPEC.sceneBackgrounds, ...STORY_EP1_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP1_SEMI_SPEC.scenes, ...STORY_EP1_END_SPEC.scenes]),
});

export const STORY_EP1_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP1_FULL_SPEC,
  // 위쪽 제목(2026-10-07 Owner "화면 상단에 원래 쇼츠에서 했던 것처럼 제목 적어놔"): 설명형과 같은 방식(어두운 층 + 흰 글자, 마지막 줄 노랑). 제목은 게시 제목 그대로 줄만 나눈다.
  headerTitle: Object.freeze(["금 모으기,", "장롱 속 금을 들고", "줄을 선 나라"]),
  videoShiftDownPx: 230,    // 영상을 통째로 12% 아래로 내려 위쪽에 제목 자리를 만든다(흐린 띠 없음, 아래 12% 잘림) — 제목이 인물 얼굴을 안 덮게(Owner 2026-10-07)
  videoShiftFadePx: 260,    // 내려온 영상 위 가장자리를 남색으로 서서히 이어 붙임
  headerTopY: 345,         // 인스타 피드 4:5·그리드 3:4 크롭에 첫 줄이 안 잘리게 세로 ≈18%에서 시작(Owner 2026-10-07)
  headerScrimHeight: 780,   // 내린 제목(3줄 ≈ 345~705) 뒤 어두운 층도 같이 내림
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  // "AI 재연" 위쪽 표시는 뺀다(Owner 2026-10-07 "거슬린다") — AI 표시는 화면 글자 대신 플랫폼의 AI 콘텐츠 표시(유튜브 변경·합성 콘텐츠, 인스타 AI 라벨)로 한다.
  footerChannelBar: false,
  captionLayout: "v2",
  // 자막 강조(2026-10-07 "자막이 너무 심심하다"): 노랑=숫자(단위 달러·톤·명·억·만·분의·배 추가), 청록=핵심어(첫 항목은 대표 주제어), 빨강=위험 단어, 강조 단어는 커졌다가 제 크기로.
  emphasisTerms: Object.freeze(["IMF", "달러", "장롱", "돌반지", "결혼반지", "금거북이", "추기경", "원화"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+(?:억|만|조)", "[0-9,.]+(?:톤|명|배)", "[0-9]+분의"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  // 자막 경계 예외(2026-10-07): 자동 분할이 숫자와 단위("39억|달러뿐이었어", "195억|달러보다도")를 가른 2곳. 대사를 바꾸려면 TTS 재생성(유료·길이 ±10% 변동)이 필요해 사유와 함께 승인.
  captionBoundaryExceptions: Object.freeze([
    { left: "39억", right: "달러뿐이었어", reason: "자동 분할이 숫자 '39억'을 단독 블록으로 강조하며 '달러뿐이었어'와 가름(s2), TTS 재생성 회피(2026-10-07)" },
    { left: "195억", right: "달러보다도", reason: "자동 분할이 숫자 '195억'과 단위 '달러보다도'를 가름(s3), TTS 재생성 회피(2026-10-07)" },
  ]),
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP1_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
