/**
 * 스토리형 8편 — LG전자 휴대폰 사업 철수 재연 장면 스펙 (2026-10-09).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep8-lg-exit/scenes-v6.json`(18장면 828자, Owner 확정 2026-10-09, 18번은 12.4초 → 구절 하나 뺌).
 * 설계 `C:/tmp/story-ep8-lg-exit/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep8-tts/output-v2/tempo-1.2-gap0.25-pre/…audio-fixed…json`(126.0초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~17번 재연 장면 + 18번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형, 7·9·10편과 동일):
 *  - 화면에 글자·숫자·로고·브랜드·회사 이름·제품 이름을 넣지 않는다(숫자는 자막이 맡는다). 휴대폰 화면·상자·서류·차트는 무늬와 색 덩어리만.
 *  - 실제 회사·제품의 색·로고·모양을 흉내 내지 않는다(중립 색, 이름 없는 둥근 직사각형 휴대폰). 실존 인물(사장·회장)을 닮게 그리지 않는다.
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - ★ 실존 인물 오인 방지: 얼굴이 크게 보이는 정면·근접 구도를 피하고 인물은 뒷모습·멀리 있는 작은 모습·손과 소품 위주.
 *  - 2000~2021년 한국 배경(사무실, 매장, 서비스센터, 회의실).
 *
 * 이미지 생성: ① 1~17번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep8-assembly-spec.mjs --scene-spec-export STORY_EP8_SEMI_SPEC --out-dir C:/tmp/story-ep8-images`
 *            ② 18번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep8-assembly-spec.mjs --scene-spec-export STORY_EP8_END_SPEC --out-dir C:/tmp/story-ep8-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름·제품 이름은 하나도 넣지 마(휴대폰 화면·상자·서류·차트·간판 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.";
const PHONE = "로고와 글자가 전혀 없는 둥근 직사각형 스마트폰(화면은 연한 색 무늬만)";

export const STORY_EP8_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 8,
  displayEpisode: 8,
  sourceCandidate: "story-ep8-lg-exit-2021",
  title: "LG전자 휴대폰 철수 — 쌓인 5조 원이 아니라 앞으로의 손실",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep8",
  storyStyleOnlyIdentity:
    "2000년대~2021년 한국을 배경으로 한 재연 장면 시리즈의 한 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "휴대폰 진열대를 끄는 뒷모습(1번)",
      image: `밤의 대형 휴대폰 매장. 진열대에 ${PHONE}이 여러 대 줄지어 놓여 있고, 양복 입은 한 사람이 뒷모습으로 서서 매장 불을 하나씩 끄고 있다(얼굴 안 보임). 바닥에 반사된 조명.`,
      videoStyle: "night phone showroom with rows of plain smartphones on display shelves and a suited person seen from behind switching off the lights one by one",
      videoStatics: "the display shelves with the plain smartphones, the polished floor, and the showroom walls",
    },
    B: {
      label: "스마트폰을 든 손(2번)",
      image: `어두운 탁자 위 근접 장면. 한 손이 ${PHONE} 한 대를 조심스럽게 집어 올려 들여다본다. 얼굴·몸 없음(손만). 부드러운 스탠드 조명.`,
      videoStyle: "dark table close view of one hand carefully lifting a plain smartphone under a soft lamp",
      videoStatics: "the dark table and the soft lamp light",
    },
    C: {
      label: "시상대 위 세 번째 휴대폰(3번)",
      image: `밝은 전시장 안의 3단 시상대. 세 번째 칸 위에 반짝이는 검은 슬라이드형 휴대폰 모형(글자 없음)이 올라가 있고, 첫째·둘째 칸에는 색만 다른 이름 없는 휴대폰 모형이 놓여 있다. 사람 없음. 부드러운 스포트라이트.`,
      videoStyle: "bright exhibition hall with a three-step podium holding plain phone models, a glossy black phone model on the third step under a soft spotlight",
      videoStatics: "the three-step podium, the plain phone models on the first and second steps, and the soft spotlight",
    },
    D: {
      label: "터치스크린 폰에 밀리는 버튼 폰(4번)",
      image: `매장 탁자 위. 버튼 달린 구식 폴더폰 여러 대가 한쪽으로 밀려나 있고, 가운데에 매끈한 터치스크린 스마트폰 한 대가 놓여 있다. 한 손이 폴더폰 하나를 옆으로 밀어내고 있다. 글자·로고 없음. 얼굴 없음(손만).`,
      videoStyle: "store table with old flip phones pushed to the side and one sleek touchscreen smartphone in the center, a hand sliding one flip phone away",
      videoStatics: "the store table, the pile of old flip phones, and the sleek smartphone in the center",
    },
    E: {
      label: "고급 진열대와 보급형 더미 사이의 좁은 길(5번)",
      image: `넓은 매장 안쪽 장면. 왼쪽에는 번쩍이는 고급 진열대에 두 가지 휴대폰 모형만 가득 놓여 있고, 오른쪽 바닥에는 보급형 휴대폰 상자 더미가 빽빽하게 쌓여 있다. 가운데 좁은 통로에 휴대폰 한 대가 놓인 작은 탁자가 있다. 상자와 휴대폰에 글자·로고 없음. 사람 없음.`,
      videoStyle: "wide store interior with a glossy premium display on the left holding only two kinds of plain phone models, heaps of plain budget phone boxes on the right floor, and a small table with one phone in the narrow aisle between",
      videoStatics: "the premium display, the heaps of plain boxes, the narrow aisle, and the small table",
    },
    F: {
      label: "모듈을 바꿔 끼우는 손(6번)",
      image: `밝은 책상 위 근접 장면. 두 손이 ${PHONE}의 하단 부분을 서랍처럼 당겨 빼 다른 모듈로 바꿔 끼우고 있다. 얼굴 없음(손만). 따뜻한 조명.`,
      videoStyle: "bright desk close view of two hands pulling out the bottom module of a plain smartphone like a drawer and sliding in another module",
      videoStatics: "the desk and the warm light",
    },
    G: {
      label: "높이 쌓인 붉은 장부(7번)",
      image: "사무실 책상 위에 붉은 표지의 두꺼운 장부가 높이 쌓여 있고, 정장 소매의 한 손이 장부 하나를 더 맨 위에 올려놓는다. 표지에는 글자·숫자가 없다. 얼굴 없음(손만). 밤 사무실의 스탠드 불빛.",
      videoStyle: "night office desk with a tall stack of thick red ledgers with blank covers and a suited hand placing one more on top under a desk lamp",
      videoStatics: "the tall stack of red ledgers, the desk, and the lamp light",
    },
    H: {
      label: "가느다란 조각만 색칠된 원형 차트(8번)",
      image: "큰 모니터에 떠 있는 원형 차트 근접 장면. 원의 거의 전부가 짙은 회색이고 아주 가느다란 조각 하나만 선명한 색으로 칠해져 있다. 글자·숫자 없음. 모니터 앞 책상에 정장 소매의 한 손이 놓여 있다. 얼굴 없음.",
      videoStyle: "close view of a large monitor showing a pie chart almost entirely dark gray with one very thin vivid slice and no text, a suited hand resting on the desk in front",
      videoStatics: "the large monitor, the nearly all-gray pie chart with one thin vivid slice, and the desk",
    },
    I: {
      label: "보내기 직전의 이메일(9번)",
      image: "사무실 책상 위 노트북 근접 장면. 화면에 글자 없이 가는 줄무늬만 있는 메일 창이 열려 있고, 정장 소매의 한 손이 키보드 위에서 멈춰 있다. 얼굴 없음(손만). 창밖에 겨울 낮의 도시.",
      videoStyle: "office desk close view of a laptop showing a mail window of only thin lines and a suited hand paused over the keyboard, winter daytime city outside",
      videoStatics: "the laptop with the plain mail window, the desk, and the winter city window",
    },
    J: {
      label: "서로 서류철을 되돌려 미는 두 손(10번)",
      image: "회의실 탁자 위 근접 장면. 양복 소매의 두 손이 맞은편에서 글자 없는 서류철을 서로 상대 쪽으로 밀어 되돌려 보낸다. 탁자 뒤에 양쪽 협상단이 뒷모습으로 앉아 있다(얼굴 안 보임). 큰 창밖에 도시.",
      videoStyle: "meeting room table close view of two suited hands across from each other each pushing a plain folder back toward the other side, both delegations seen from behind",
      videoStatics: "the meeting table, the two plain folders, the delegations seen from behind, and the large window with the city view",
    },
    K: {
      label: "유리 상자 속 동전 탑과 새는 동전(11번)",
      image: "밝은 책상 위 두 소품. 왼쪽은 열쇠로 잠긴 유리 상자 안에 금빛 동전 탑이 높이 쌓여 있어 꺼낼 수 없는 모습이고, 오른쪽은 열린 상자 안으로 위에서 동전이 계속 떨어져 바닥 구멍으로 빠져나간다. 동전에 글자·숫자 없음. 사람 없음.",
      videoStyle: "bright desk with a locked glass case holding a tall gold coin tower on the left and an open box on the right where coins keep falling in from above and drain through a hole",
      videoStatics: "the locked glass case with the coin tower, the open box with the drain hole, and the desk",
    },
    L: {
      label: "날짜에 빨간 원을 치는 손(12번)",
      image: "책상 위 벽걸이 달력 근접 장면. 숫자와 글자 없이 격자 칸만 있고, 정장 소매의 한 손이 붉은 펜으로 한 칸을 크게 동그라미 치고 있다. 얼굴 없음(손만). 밝은 오전 햇살.",
      videoStyle: "close view of a wall calendar of an empty grid with no numbers or text and a suited hand circling one box with a red pen in bright morning light",
      videoStatics: "the wall calendar grid and the bright morning light",
    },
    M: {
      label: "서비스센터의 수리 창구(13번)",
      image: `서비스센터 수리 창구. 작업복 입은 기술자가 뒷모습으로 앉아 ${PHONE}을 열어 수리하고 있고, 뒤쪽 바닥에 포장된 상자 팔레트 두 개가 놓여 있다. 상자에 글자·로고 없음. 얼굴 안 보임.`,
      videoStyle: "service center repair counter with a technician in work clothes seen from behind opening a plain smartphone, two pallets of plain packed boxes on the floor behind",
      videoStatics: "the repair counter, the two pallets of plain packed boxes, and the bright indoor light",
    },
    N: {
      label: "책상이 가득한 넓은 사무실(14번)",
      image: "넓은 사무실에 책상이 끝없이 늘어서 있고, 수많은 직원이 각자 자리에 앉아 일하는 뒷모습(작은 모습, 얼굴 안 보임). 천장 조명이 일정하게 켜져 있다. 글자·로고 없음.",
      videoStyle: "very wide open-plan office with endless rows of desks and many staff seated and working seen small from behind, even ceiling lights",
      videoStatics: "the endless rows of desks, the ceiling lights, and the office walls",
    },
    O3: {
      label: "세 갈래 복도로 나뉘는 직원들(15번)",
      image: "건물 로비에서 세 갈래 복도로 갈라지는 장면. 직원들이 짐 상자를 들고 뒷모습으로 각기 다른 복도의 문으로 걸어 들어간다(얼굴 안 보임). 복도 위 표시는 글자 없이 색 불빛만. 밝은 로비 조명.",
      videoStyle: "building lobby splitting into three corridors with staff carrying small boxes seen from behind walking into different corridor doors, colored lights above each door and no text",
      videoStatics: "the lobby, the three corridors, the colored lights above the doors, and the bright lobby light",
    },
    P2: {
      label: "연구실 작업대(16번)",
      image: "연구실 작업대 근접 장면. 작은 카메라 모듈, 회로 기판, 안테나 시제품이 놓여 있고 장갑 낀 한 손이 핀셋으로 부품을 집어 올린다. 글자·로고 없음. 얼굴 없음(손만). 차가운 흰 조명.",
      videoStyle: "research lab bench close view of a small camera module, a circuit board and antenna prototypes with a gloved hand lifting a part with tweezers under cool white light",
      videoStatics: "the lab bench, the circuit board, the prototypes, and the cool white light",
    },
    Q: {
      label: "붉은 막대를 지우는 손(17번)",
      image: "책상 위 용지 근접 장면. 글자·숫자 없이 길고 굵은 붉은 막대 하나가 그려져 있고, 정장 소매의 한 손이 지우개로 그 막대를 끝에서부터 지워 나간다. 얼굴 없음(손만). 따뜻한 오후 빛.",
      videoStyle: "close view of a paper with one long thick red bar and no text and a suited hand erasing it from the end with an eraser in warm afternoon light",
      videoStatics: "the paper, the desk, and the warm afternoon light",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep8_s1_hook_motion.mp4",
      narration: "2021년 4월 5일, LG전자가 26년 해 온 휴대폰 사업에서 철수하기로 했어. 한때 세계 3위까지 올랐던 사업이었지.",
      imageBrief: `밤의 대형 휴대폰 매장. 진열대에 ${PHONE}이 여러 대 줄지어 놓여 있고, 양복 입은 한 사람이 뒷모습으로 서서 매장 불을 하나씩 끄고 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the person stays seen from behind with no face ever shown; the phones stay in the same arrangement with no text or logos; nobody else enters.",
      motion: motion("the person switches off one more row of lights and the showroom grows darker, the shelves and the phones stay completely still", "closing a business"),
    },
    {
      scene: 2, key: "s2_why", role: "evidence", video: "story_ep8_s2_why_motion.mp4",
      narration: "스스로 문을 닫은 건데, 왜 그랬을까?",
      imageBrief: `어두운 탁자 위 근접 장면. 한 손이 ${PHONE} 한 대를 조심스럽게 집어 올려 들여다본다. 얼굴·몸은 그리지 마(손만). 부드러운 스탠드 조명. ` + NO_TEXT,
      shot: "close", bg: "B",
      lock: "no face or body ever appears — only the one hand; the phone keeps no text or logos; the table and the lamp stay fixed.",
      motion: motion("the hand lifts the phone, turns it once under the lamp and sets it down, the lamp light stays steady, the table stays completely still", "a quiet question"),
    },
    {
      scene: 3, key: "s3_peak", role: "evidence", video: "story_ep8_s3_peak_motion.mp4",
      narration: "2008년, LG전자는 휴대폰 판매 1억 대를 처음 넘기며 세계 3위에 올랐어. 초콜릿폰은 1,000만 대를 넘게 팔렸지.",
      imageBrief: "밝은 전시장 안의 3단 시상대. 세 번째 칸 위에 반짝이는 검은 슬라이드형 휴대폰 모형(글자 없음)이 올라가 있고, 첫째·둘째 칸에는 색만 다른 이름 없는 휴대폰 모형이 놓여 있다. 사람 없음. 부드러운 스포트라이트. " + NO_TEXT,
      shot: "medium", bg: "C",
      lock: "the podium and the phone models stay in the same arrangement with no text or logos; no people appear; only the spotlight shifts.",
      motion: motion("the spotlight settles on the glossy black phone on the third step and glints once, the podium and the other models stay completely still", "a peak moment"),
    },
    {
      scene: 4, key: "s4_iphone", role: "evidence", video: "story_ep8_s4_iphone_motion.mp4",
      narration: "그런데 2007년 아이폰이 나오면서 휴대폰은 스마트폰으로 넘어가기 시작했어. LG는 그 변화에 대응이 늦었다는 평가를 받았지.",
      imageBrief: "매장 탁자 위. 버튼 달린 구식 폴더폰 여러 대가 한쪽으로 밀려나 있고, 가운데에 매끈한 터치스크린 스마트폰 한 대가 놓여 있다. 한 손이 폴더폰 하나를 옆으로 밀어내고 있다. 얼굴은 그리지 마(손만). " + NO_TEXT,
      shot: "close", bg: "D",
      lock: "no face or body appears — only the one hand; no phone shows any text, logos or brand shapes; the table stays fixed.",
      motion: motion("the hand pushes one more flip phone to the side leaving the sleek smartphone alone in the center, the table and the smartphone stay completely still", "the market shifts"),
    },
    {
      scene: 5, key: "s5_squeeze", role: "evidence", video: "story_ep8_s5_squeeze_motion.mp4",
      narration: "고가폰은 삼성과 애플 양강 체제가 굳어졌고, 저가폰은 가격 경쟁이 거셌어. 회사도 대응이 미흡해 성과를 내지 못했다고 밝혔지.",
      imageBrief: "넓은 매장 안쪽 장면. 왼쪽에는 번쩍이는 고급 진열대에 두 가지 휴대폰 모형만 가득 놓여 있고, 오른쪽 바닥에는 보급형 휴대폰 상자 더미가 빽빽하게 쌓여 있다. 가운데 좁은 통로에 휴대폰 한 대가 놓인 작은 탁자가 있다. 상자와 휴대폰에 글자·로고 없음. 사람 없음. " + NO_TEXT,
      shot: "wide", bg: "E",
      lock: "the premium display, the heaps of boxes and the small table stay in the same arrangement with no text or logos; no people appear; only the light shifts.",
      motion: motion("a soft light slides from the glossy premium display down the narrow aisle and settles on the lone phone on the small table, everything else stays completely still", "squeezed between"),
    },
    {
      scene: 6, key: "s6_g5", role: "evidence", video: "story_ep8_s6_g5_motion.mp4",
      narration: "2016년엔 부품을 갈아 끼우는 G5까지 내놨지만, 분기 손실은 1분기 2,022억 원에서 3분기 4,364억 원까지 커졌어.",
      imageBrief: `밝은 책상 위 근접 장면. 두 손이 ${PHONE}의 하단 부분을 서랍처럼 당겨 빼 다른 모듈로 바꿔 끼우고 있다. 얼굴은 그리지 마(손만). ` + NO_TEXT,
      shot: "close", bg: "F",
      lock: "no face or body appears — only the two hands; the phone and the module keep no text or logos; the desk stays fixed.",
      motion: motion("the hands slide the bottom module out and click another module in, the warm light stays steady, the desk stays completely still", "a bold attempt"),
    },
    {
      scene: 7, key: "s7_streak", role: "evidence", video: "story_ep8_s7_streak_motion.mp4",
      narration: "2015년 2분기부터 2020년 말까지 23분기 연속 적자였고, 쌓인 적자는 약 5조 원에 이르렀지.",
      imageBrief: "사무실 책상 위에 붉은 표지의 두꺼운 장부가 높이 쌓여 있고, 정장 소매의 한 손이 장부 하나를 더 맨 위에 올려놓는다. 표지에는 글자·숫자가 없다. 얼굴은 그리지 마(손만). 밤 사무실의 스탠드 불빛. " + NO_TEXT,
      shot: "close", bg: "G",
      lock: "no face or body appears — only the one hand and the suit sleeve; the ledgers keep blank red covers with no text or numbers; the desk and the lamp stay fixed.",
      motion: motion("the hand sets one more red ledger on top and the stack sways slightly then steadies, the lamp light stays steady, the desk stays completely still", "losses piling up"),
    },
    {
      scene: 8, key: "s8_loss2020", role: "evidence", video: "story_ep8_s8_loss2020_motion.mp4",
      narration: "2020년 한 해에만 8,000억 원이 넘게 잃었고, 점유율은 1%대로 내려와 있었어.",
      imageBrief: "큰 모니터에 떠 있는 원형 차트 근접 장면. 원의 거의 전부가 짙은 회색이고 아주 가느다란 조각 하나만 선명한 색으로 칠해져 있다. 글자·숫자 없음. 모니터 앞 책상에 정장 소매의 한 손이 놓여 있다. 얼굴은 그리지 마. " + NO_TEXT,
      shot: "close", bg: "H",
      lock: "no face or body appears — only the one hand and the suit sleeve; the pie chart keeps almost all dark gray with one thin vivid slice and no text or numbers; the monitor and the desk stay fixed.",
      motion: motion("a soft glow runs along the edge of the chart and stops at the thin vivid slice, the monitor and the hand stay completely still", "a sliver left"),
    },
    {
      scene: 9, key: "s9_mail", role: "evidence", video: "story_ep8_s9_mail_motion.mp4",
      narration: "그래도 바로 철수하지는 않았어. 2021년 1월, 권봉석 사장은 직원들에게 모든 가능성을 열어 두고 검토하고 있다고 알린 것으로 전해졌지.",
      imageBrief: "사무실 책상 위 노트북 근접 장면. 화면에 글자 없이 가는 줄무늬만 있는 메일 창이 열려 있고, 정장 소매의 한 손이 키보드 위에서 멈춰 있다. 얼굴은 그리지 마(손만). 창밖에 겨울 낮의 도시. " + NO_TEXT,
      shot: "close", bg: "I",
      lock: "no face or body appears — only the one hand and the suit sleeve; the laptop screen keeps only thin lines with no text; the desk and the window stay fixed.",
      motion: motion("the hand hovers over the keyboard and then lowers a finger to press one key, the winter light stays steady, the laptop and the desk stay completely still", "an undecided message"),
    },
    {
      scene: 10, key: "s10_sale", role: "evidence", video: "story_ep8_s10_sale_motion.mp4",
      narration: "사업을 넘기려고 베트남 빈그룹, 독일 폭스바겐과 이야기를 나눴지만 가격 등에서 의견이 엇갈린 것으로 알려졌어.",
      imageBrief: "회의실 탁자 위 근접 장면. 양복 소매의 두 손이 맞은편에서 글자 없는 서류철을 서로 상대 쪽으로 밀어 되돌려 보낸다. 탁자 뒤에 양쪽 협상단이 뒷모습으로 앉아 있다(얼굴 안 보임). 큰 창밖에 도시. " + NO_TEXT,
      shot: "close", bg: "J",
      lock: "no face ever appears — only the hands and suit sleeves, and the delegations stay seen from behind; the folders keep plain covers with no text; the table and the window stay fixed.",
      motion: motion("each hand pushes its folder back across the table and the folders stop in the middle, the delegations behind stay completely still", "no agreement"),
    },
    {
      scene: 11, key: "s11_sunk", role: "core_question", video: "story_ep8_s11_sunk_motion.mp4",
      narration: "이미 쌓인 5조 원은 철수하든 계속하든 돌아오지 않아. 계속하면 지난해 같은 8,000억 원대 손실이 또 쌓일 판이었지.",
      imageBrief: "밝은 책상 위 두 소품. 왼쪽은 열쇠로 잠긴 유리 상자 안에 금빛 동전 탑이 높이 쌓여 있어 꺼낼 수 없는 모습이고, 오른쪽은 열린 상자 안으로 위에서 동전이 계속 떨어져 바닥 구멍으로 빠져나간다. 동전에 글자·숫자 없음. 사람 없음. " + NO_TEXT,
      shot: "medium", bg: "K",
      lock: "the locked glass case with the tall coin tower stays completely fixed; the coins keep no text or numbers; no people appear; only the coins on the right keep falling.",
      motion: motion("coins keep dropping into the open box on the right and draining through the hole, the locked glass case with the tower on the left stays completely still", "sunk versus future loss"),
    },
    {
      scene: 12, key: "s12_board", role: "evidence", video: "story_ep8_s12_board_motion.mp4",
      narration: "결국 이사회는 7월 31일로 휴대폰 사업을 끝내기로 결정했어.",
      imageBrief: "책상 위 벽걸이 달력 근접 장면. 숫자와 글자 없이 격자 칸만 있고, 정장 소매의 한 손이 붉은 펜으로 한 칸을 크게 동그라미 치고 있다. 얼굴은 그리지 마(손만). 밝은 오전 햇살. " + NO_TEXT,
      shot: "close", bg: "L",
      lock: "no face or body appears — only the one hand and the suit sleeve; the calendar keeps only an empty grid with no numbers or text; the light stays fixed.",
      motion: motion("the red pen draws one firm circle around a box and lifts away, the morning light stays steady, the calendar stays completely still", "a date is set"),
    },
    {
      scene: 13, key: "s13_measures", role: "evidence", video: "story_ep8_s13_measures_motion.mp4",
      narration: "5월 말까지는 약속한 물량을 만들고, 이미 산 사람들을 위한 사후 서비스는 이어 가기로 했지. 협력사의 손실 보상도 협의하겠다고 했어.",
      imageBrief: `서비스센터 수리 창구. 작업복 입은 기술자가 뒷모습으로 앉아 ${PHONE}을 열어 수리하고 있고, 뒤쪽 바닥에 포장된 상자 팔레트 두 개가 놓여 있다. 상자에 글자·로고 없음. 얼굴 안 보임. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "M",
      lock: "the technician stays seen from behind with no face ever shown; the pallets and boxes stay in the same arrangement with no text or logos; nobody else enters.",
      motion: motion("the technician carefully replaces a part and closes the phone, the pallets behind and the counter stay completely still", "keeping promises"),
    },
    {
      scene: 14, key: "s14_headcount", role: "evidence", video: "story_ep8_s14_headcount_motion.mp4",
      narration: "철수를 발표할 때 휴대폰 사업본부 직원은 약 3,700명이었어. 회사는 고용을 유지한 채 다른 사업으로 옮기겠다고 했지.",
      imageBrief: "넓은 사무실에 책상이 끝없이 늘어서 있고, 수많은 직원이 각자 자리에 앉아 일하는 뒷모습(작은 모습). 천장 조명이 일정하게 켜져 있다. 글자·로고 없음. " + NO_TEXT,
      shot: "wide", bg: "N",
      lock: "the desks keep the same arrangement; the staff stay tiny and seen from behind with no face shown; no text or logos.",
      motion: motion("the many tiny staff keep typing and a few turn to talk to the person beside them, the desks and the ceiling lights stay completely still", "many people at stake"),
    },
    {
      scene: 15, key: "s15_reassign", role: "evidence", video: "story_ep8_s15_reassign_motion.mp4",
      narration: "7월 재배치 땐 약 3,300명 중 약 600명이 LG에너지솔루션 같은 계열사로, 나머지는 LG전자 안의 다른 본부로 갔어.",
      imageBrief: "건물 로비에서 세 갈래 복도로 갈라지는 장면. 직원들이 짐 상자를 들고 뒷모습으로 각기 다른 복도의 문으로 걸어 들어간다. 복도 위 표시는 글자 없이 색 불빛만. 밝은 로비 조명. " + NO_TEXT + FACE_SAFE,
      shot: "wide", bg: "O3",
      lock: "the staff stay seen from behind with no face ever shown; the corridor signs keep only colored lights with no text; the lobby and the corridors stay fixed.",
      motion: motion("the staff carrying small boxes walk into the three corridors one after another, the lobby and the corridor doors stay completely still", "moved, not dismissed"),
    },
    {
      scene: 16, key: "s16_rnd", role: "evidence", video: "story_ep8_s16_rnd_motion.mp4",
      narration: "6G와 카메라, 소프트웨어 기술 연구는 이어 가겠다고도 했어. 가전과 자동차 부품, 로봇에 필요한 힘이라는 거였지.",
      imageBrief: "연구실 작업대 근접 장면. 작은 카메라 모듈, 회로 기판, 안테나 시제품이 놓여 있고 장갑 낀 한 손이 핀셋으로 부품을 집어 올린다. 글자·로고 없음. 얼굴은 그리지 마(손만). 차가운 흰 조명. " + NO_TEXT,
      shot: "close", bg: "P2",
      lock: "no face or body appears — only the one gloved hand; the parts keep no text or logos; the bench and the cool light stay fixed.",
      motion: motion("the gloved hand lifts the small part with tweezers and seats it onto the circuit board, the bench and the light stay completely still", "technology carried on"),
    },
    {
      scene: 17, key: "s17_outlook", role: "evidence", video: "story_ep8_s17_outlook_motion.mp4",
      narration: "증권업계는 이 철수로 해마다 1조 원쯤 나던 적자가 사라질 것으로 내다봤어. 계속했다면 앞으로도 쌓였을 손실이지.",
      imageBrief: "책상 위 용지 근접 장면. 글자·숫자 없이 길고 굵은 붉은 막대 하나가 그려져 있고, 정장 소매의 한 손이 지우개로 그 막대를 끝에서부터 지워 나간다. 얼굴은 그리지 마(손만). 따뜻한 오후 빛. " + NO_TEXT,
      shot: "close", bg: "Q",
      lock: "no face or body appears — only the one hand and the suit sleeve; the paper keeps only the plain red bar with no text or numbers; the desk and the light stay fixed.",
      motion: motion("the eraser rubs along the red bar and more of it disappears, the warm light stays steady, the paper and the desk stay completely still", "a loss erased"),
    },
  ]),
});

// ── 18번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP8_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 8,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep8",
  sceneBackgrounds: Object.freeze({
    R: {
      label: "오피스 광장 저녁(18번 부엉박사)",
      image: "해 질 무렵 한국 도심 오피스 광장. 부엉박사 뒤로 글자 없는 유리 고층 건물 두 동과 불이 켜지기 시작한 창문들, 광장 한쪽에 빈 벤치 하나. 바닥은 매끈한 연한 회색 포장, 따뜻한 저녁 햇빛.",
      videoStyle: "dusk Korean downtown office plaza with two plain glass towers with windows starting to light up and an empty bench at one side",
      videoStatics: "the two plain glass towers, the lit windows, the empty bench, the smooth light gray pavement, and the warm evening light",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 18, key: "s18_close", role: "save", video: "story_ep8_s18_close_motion.mp4",
      narration: "이미 쌓인 5조 원은 돌아오지 않지만, 앞으로 쌓일 손실은 막는 쪽을 택했어. 사람은 지키며 내린 철수였지. 또 다른 결단의 순간이 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "R",
      lock: "the glass towers and the empty bench stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 5편 STORY_EP5_ASSEMBLE_SPEC과 같은 구성(2026-10-10) ──
// 제목(★임시안 — Owner 확정 필요, 영상 속 제목·커버 문구 동일): LG가 휴대폰을 / 26년 만에 / 접은 이유
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep8-assembly-spec.mjs --spec-export STORY_EP8_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep8-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep8-tts/output-v2/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep8-tts/story-ep8-tts-script.json --out-dir C:/tmp/story-ep8-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP8_FULL_SPEC = Object.freeze({
  ...STORY_EP8_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP8_SEMI_SPEC.sceneBackgrounds, ...STORY_EP8_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP8_SEMI_SPEC.scenes, ...STORY_EP8_END_SPEC.scenes]),
});

export const STORY_EP8_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP8_FULL_SPEC,
  headerTitle: Object.freeze(["LG가 휴대폰을","26년 만에","접은 이유"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["LG","휴대폰","철수","적자","5조 원","손실","스마트폰"]),
  emphasisNumberPatterns: Object.freeze(["[0-9][0-9,.]*(?:억|만|조)","[0-9][0-9,.]*%","[0-9][0-9,.]*분기","[0-9][0-9,.]*명"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  // 숫자 덩어리가 760px 한 줄에 안 들어가 가를 자리가 금지 경계뿐인 곳(2026-10-10): TTS 재생성(유료) 회피, 사유와 함께 승인.
  captionBoundaryExceptions: Object.freeze([
    { left: "2015년", right: "2분기부터", reason: "'2015년 2분기부터' 연도+분기가 한 줄(760px)에 안 들어가 '2015년 / 2분기부터'로 갈림(s7), TTS 재생성 회피(2026-10-10)" },
    { left: "약", right: "3,700명이었어", reason: "'직원은 약 3,700명이었어'가 한 줄에 안 들어가 '직원은 약 / 3,700명이었어'로 갈림(s14), TTS 재생성 회피(2026-10-10)" },
  ]),
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP8_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
