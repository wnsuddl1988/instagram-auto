/**
 * 스토리형 22편 — 10원 동전 — 만드는 돈이 액면보다 비싸졌을 때 한국은행이 바꾼 것 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep22-tenwon/scenes-v1.json`. 설계 `C:/tmp/story-ep22-tenwon/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep22-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~16번 재연 장면 + 17번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~16번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep22-assembly-spec.mjs --scene-spec-export STORY_EP22_SEMI_SPEC --out-dir C:/tmp/story-ep22-images`
 *            ② 17번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep22-assembly-spec.mjs --scene-spec-export STORY_EP22_END_SPEC --out-dir C:/tmp/story-ep22-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP22_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 22,
  displayEpisode: 22,
  sourceCandidate: "story-ep22-tenwon-2006",
  title: "10원 동전 — 만드는 돈이 액면보다 비싸졌을 때 한국은행이 바꾼 것",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep22",
  storyStyleOnlyIdentity:
    "한국의 조폐 공장과 중앙은행 회의실, 동네 마트를 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물을 닮게 그리지 않고, 실제 은행 로고와 동전 문자·숫자를 흉내 내지 않아(동전은 글자와 숫자 없는 무늬만 있는 구리색 또는 은색 원판). 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "구리색 동전 하나와 두툼한 지폐 뭉치(1번)", image: "탁자 위에 무늬만 있는 작은 구리색 동전 하나와 그 옆에 두툼하게 쌓인 지폐 뭉치(숫자 없는 무늬)가 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명.", videoStyle: "close view of one small copper-colored coin with only a plain pattern next to a thick stack of banknotes with no numerals on a table, no people, no text, bright lighting", videoStatics: "the table, the coin, the banknote stack, and the lighting" },
    B: { label: "글자 없는 석조 건물 앞 큰 동전 모형(2번)", image: "글자 없는 석조 중앙은행풍 건물 앞 광장에 큰 동전 모형 하나가 서 있다. 사람 없음. 글자·로고 없음. 맑은 낮.", videoStyle: "a plaza in front of a plain stone central-bank-style building with one large coin model standing, no people, no text or logos, clear daytime", videoStatics: "the building, the coin model, the plaza, and the light" },
    C: { label: "동전 제조 기계 앞에서 고민하는 직원들(3번)", image: "동전 제조 기계 앞에서 작업복 직원 서넛이 뒷모습으로 서서 고민하는 듯 서 있다(얼굴 안 보임). 글자 없음. 낮은 조명.", videoStyle: "a few factory workers seen from behind standing in front of a coin-making machine in thought, no text, low lighting", videoStatics: "the machine, the floor, and the lighting" },
    D: { label: "구리색·은색 금속이 섞이는 용광로 모형(4번)", image: "작은 용광로 모형 안에서 구리색 금속판과 은색 금속판이 섞여 붉게 빛난다. 사람 없음. 글자·숫자 없음.", videoStyle: "close view of a small furnace model where a copper-colored metal plate and a silver metal plate melt together glowing, no people, no text or numerals", videoStatics: "the furnace model and the surrounding bench" },
    E: { label: "구리 덩어리 위로 올라가는 화살표 모형(5번)", image: "책상 위에 구리 덩어리가 놓여 있고 그 뒤로 위로 올라가는 화살표 모양의 막대 모형이 서 있다(글자·숫자 없음). 사람 없음.", videoStyle: "a desk with a copper lump and behind it a bar model shaped like a rising arrow with no text or numerals, no people", videoStatics: "the desk, the copper lump, the arrow model, and the lighting" },
    F: { label: "저울 한쪽의 동전과 반대쪽의 더 무거운 구리 조각(6번)", image: "저울 한쪽 접시에 무늬만 있는 작은 동전 하나가, 반대쪽 접시에 구리 조각이 놓여 구리 쪽으로 기울어 있다. 사람 없음. 글자·숫자 없음.", videoStyle: "close view of a balance scale with one plain small coin on one pan and a copper piece on the other pan tipping toward the copper, no people, no text or numerals", videoStatics: "the scale, the coin, the copper piece, and the lighting" },
    G: { label: "동전이 찍혀 나오는 기계 옆에 쌓이는 영수증 더미(7번)", image: "동전이 찍혀 나오는 기계 옆 바닥에 글자 없는 영수증 종이 더미가 높이 쌓여 있다. 사람 없음. 글자·숫자 없음. 낮은 조명.", videoStyle: "a coin-minting machine with a tall pile of plain receipts without text on the floor beside it, no people, no text or numerals, low lighting", videoStatics: "the machine, the pile, and the lighting" },
    H: { label: "회의 테이블 위에 놓인 여러 금속 견본(8번)", image: "회의 테이블 위에 여러 종류의 금속 견본 조각이 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명.", videoStyle: "close view of several metal sample pieces laid side by side on a meeting table, no people, no text or numerals, bright lighting", videoStatics: "the table, the metal samples, and the lighting" },
    I: { label: "알루미늄 판 양면에 얇은 구리판을 덧씌우는 공정 모형(9번)", image: "작업대 위에서 은색 알루미늄 판 양면에 얇은 구리색 판을 덧씌우는 공정 모형이 놓여 있다. 사람 없음. 글자·숫자 없음.", videoStyle: "close view of a workbench process model where thin copper-colored sheets cover both faces of a silver aluminum plate, no people, no text or numerals", videoStatics: "the workbench, the plates, and the lighting" },
    J: { label: "큰 옛 동전 옆의 작고 가벼운 새 동전(10번)", image: "탁자 위에 큼직한 구리색 옛 동전 옆에 작고 가벼워 보이는 새 동전이 나란히 놓여 있다. 무늬만 있음. 사람 없음. 글자·숫자 없음.", videoStyle: "close view of a large old copper-colored coin beside a smaller lighter new coin on a table, plain patterns only, no people, no text or numerals", videoStatics: "the table, the two coins, and the lighting" },
    K: { label: "동전 투입구 앞에 동전을 든 손(11번)", image: "기계의 동전 투입구 앞에 한 손이 작은 새 동전을 들고 있다. 손만 보임. 글자·숫자 없음. 낮은 조명.", videoStyle: "close view of one hand holding a small new coin in front of a machine's coin slot, hand only, no text or numerals, low lighting", videoStatics: "the machine, the coin slot, and the lighting" },
    L: { label: "동전이 반환되는 공중전화기와 옛 동전이 가득한 저금통(12번)", image: "공중전화기 반환구에서 작은 동전이 굴러 나와 있고, 옆 선반에는 옛 동전이 가득 든 저금통이 놓여 있다. 사람 없음. 글자·숫자 없음.", videoStyle: "a public phone with a small coin returned in its tray and a piggy bank full of old coins on a shelf beside it, no people, no text or numerals", videoStatics: "the phone, the shelf, the piggy bank, and the lighting" },
    M: { label: "오래된 작은 동전들과 낡은 서류철(13번)", image: "낡은 나무 책상 위에 오래된 작은 동전 몇 개와 낡은 서류철이 놓여 있다. 사람 없음. 글자·숫자 없음. 빛바랜 조명.", videoStyle: "close view of a few old small coins and a worn document folder on an aged wooden desk, no people, no text or numerals, faded lighting", videoStatics: "the desk, the coins, the folder, and the lighting" },
    N: { label: "저울 위의 가벼워진 새 동전과 줄어든 영수증(14번)", image: "저울 접시에 작은 새 동전이 가볍게 놓여 있고 옆의 영수증 더미는 낮아졌다. 사람 없음. 글자·숫자 없음. 밝은 조명.", videoStyle: "close view of a small new coin lightly on a balance scale pan and a lowered pile of plain receipts beside it, no people, no text or numerals, bright lighting", videoStatics: "the scale, the coin, the pile, and the lighting" },
    O: { label: "한 해 절감을 뜻하는 돈 꾸러미와 달력(15번)", image: "책상 위에 묶인 돈 꾸러미와 숫자 없는 큰 달력 모양 소품이 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명.", videoStyle: "a desk with a bundled stack of banknotes and a large calendar-shaped prop without numerals side by side, no people, no text, bright lighting", videoStatics: "the desk, the bundle, the calendar prop, and the lighting" },
    Q: { label: "마트 진열대에 나란히 선 작아진 과자 봉지들(16번)", image: "동네 마트 진열대에 글자 없는 색 무늬 과자 봉지들이 나란히 있고 봉지가 작아 칸이 헐렁하다. 사람 없음. 글자·로고·브랜드 없음. 환한 매장 조명.", videoStyle: "a neighborhood mart shelf with small plain colorful snack bags without text or logos lined up leaving extra space in each slot, no people, bright store lighting", videoStatics: "the shelf, the snack bags, and the lighting" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep22_s1_hook_motion.mp4",
      narration: "10원짜리 동전 하나를 만드는 데, 10원의 서너 배가 들던 때가 있었어.",
      imageBrief: "탁자 위에 무늬만 있는 작은 구리색 동전 하나와 그 옆에 두툼하게 쌓인 지폐 뭉치(숫자 없는 무늬)가 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "A",
      lock: "no people appear; the coin and notes keep no text or numerals; the table stays fixed.",
      motion: motion("a soft light slides across the small coin and the thick stack, the table stays completely still", "a coin costing more than itself") },
    { scene: 2, key: "s2_who", role: "evidence", video: "story_ep22_s2_who_motion.mp4",
      narration: "2006년, 한국은행이 내린 결정 이야기야.",
      imageBrief: "글자 없는 석조 중앙은행풍 건물 앞 광장에 큰 동전 모형 하나가 서 있다. 사람 없음. 글자·로고 없음. 맑은 낮. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "B",
      lock: "no people appear; the building keeps no text or logos; the coin model stays fixed.",
      motion: motion("a gentle cloud shadow moves slowly across the plaza, the building and the coin model stay completely still", "the central bank decides") },
    { scene: 3, key: "s3_puzzle", role: "core_question", video: "story_ep22_s3_puzzle_motion.mp4",
      narration: "돈을 만들수록 손해라면, 한국은행은 어떻게 해야 했을까?",
      imageBrief: "동전 제조 기계 앞에서 작업복 직원 서넛이 뒷모습으로 서서 고민하는 듯 서 있다(얼굴 안 보임). 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "C",
      lock: "the people stay seen from behind with no face ever shown; the machine keeps no text or numerals; nobody else enters.",
      motion: motion("one worker folds his arms and tilts his head slightly, the machine and the floor stay completely still", "what to do") },
    { scene: 4, key: "s4_brass", role: "evidence", video: "story_ep22_s4_brass_motion.mp4",
      narration: "그때 10원 동전은 구리 65%, 아연 35%를 섞은 황동이었어.",
      imageBrief: "작은 용광로 모형 안에서 구리색 금속판과 은색 금속판이 섞여 붉게 빛난다. 사람 없음. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "D",
      lock: "no people appear; nothing carries text or numerals; the furnace stays fixed.",
      motion: motion("the molten glow pulses softly, the furnace and the bench stay completely still", "an alloy") },
    { scene: 5, key: "s5_price", role: "evidence", video: "story_ep22_s5_price_motion.mp4",
      narration: "그 사이 구리와 아연 값이 가파르게 올라, 구리 값은 역대 최고치 수준이었지.",
      imageBrief: "책상 위에 구리 덩어리가 놓여 있고 그 뒤로 위로 올라가는 화살표 모양의 막대 모형이 서 있다(글자·숫자 없음). 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "E",
      lock: "no people appear; the model keeps no text or numerals; the desk stays fixed.",
      motion: motion("a glow climbs slowly up the arrow model, the desk and the copper stay completely still", "prices climbing") },
    { scene: 6, key: "s6_metal24", role: "evidence", video: "story_ep22_s6_metal24_motion.mp4",
      narration: "한국은행은 그해 7월 말, 동전 속 금속값이 약 24원이라고 밝혔어. 10원짜리 안에 10원보다 비싼 금속이 들어 있던 거야.",
      imageBrief: "저울 한쪽 접시에 무늬만 있는 작은 동전 하나가, 반대쪽 접시에 구리 조각이 놓여 구리 쪽으로 기울어 있다. 사람 없음. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "F",
      lock: "no people appear; the coin keeps no text or numerals; the scale base stays fixed.",
      motion: motion("the scale arm settles a little lower on the copper side, the base and the objects stay completely still", "metal worth more") },
    { scene: 7, key: "s7_cost40", role: "evidence", video: "story_ep22_s7_cost40_motion.mp4",
      narration: "만드는 돈도 40원대였으니, 찍을수록 손해였지.",
      imageBrief: "동전이 찍혀 나오는 기계 옆 바닥에 글자 없는 영수증 종이 더미가 높이 쌓여 있다. 사람 없음. 글자·숫자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "G",
      lock: "no people appear; the paper keeps no text or numerals; the machine stays fixed.",
      motion: motion("one more blank receipt slides down onto the pile, the machine and the pile stay completely still", "making coins loses money") },
    { scene: 8, key: "s8_wayq", role: "core_question", video: "story_ep22_s8_wayq_motion.mp4",
      narration: "그렇다고 동전을 안 찍을 수는 없었어. 방법이 있었을까?",
      imageBrief: "회의 테이블 위에 여러 종류의 금속 견본 조각이 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no people appear; the samples keep no text or numerals; the table stays fixed.",
      motion: motion("a soft light moves slowly across the metal samples, the table stays completely still", "is there a way") },
    { scene: 9, key: "s9_decide", role: "evidence", video: "story_ep22_s9_decide_motion.mp4",
      narration: "답은 재료를 바꾸는 것이었어. 8월, 금융통화위원회가 구리를 얇게 씌운 알루미늄으로 새 10원을 만들기로 의결했지.",
      imageBrief: "작업대 위에서 은색 알루미늄 판 양면에 얇은 구리색 판을 덧씌우는 공정 모형이 놓여 있다. 사람 없음. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "I",
      lock: "no people appear; the plates keep no text or numerals; the workbench stays fixed.",
      motion: motion("the thin copper sheet settles gently onto the aluminum, the bench stays completely still", "the answer") },
    { scene: 10, key: "s10_size", role: "evidence", video: "story_ep22_s10_size_motion.mp4",
      narration: "지름은 22.86mm에서 18mm로 줄고, 무게는 4g에서 1g 남짓으로 가벼워졌어.",
      imageBrief: "탁자 위에 큼직한 구리색 옛 동전 옆에 작고 가벼워 보이는 새 동전이 나란히 놓여 있다. 무늬만 있음. 사람 없음. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "J",
      lock: "no people appear; the coins keep no text or numerals; the table stays fixed.",
      motion: motion("a soft glint passes over the small new coin, the table and the coins stay completely still", "smaller and lighter") },
    { scene: 11, key: "s11_machineq", role: "core_question", video: "story_ep22_s11_machineq_motion.mp4",
      narration: "그럼 크기가 달라진 동전을 기계들이 알아볼까?",
      imageBrief: "기계의 동전 투입구 앞에 한 손이 작은 새 동전을 들고 있다. 손만 보임. 글자·숫자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "K",
      lock: "no face or body appears — only the hand; the machine keeps no text or numerals; the slot stays fixed.",
      motion: motion("the hand moves the coin close to the slot and pauses, the machine stays completely still", "will it be recognized") },
    { scene: 12, key: "s12_payphone", role: "evidence", video: "story_ep22_s12_payphone_motion.mp4",
      narration: "일부 공중전화기에서는 새 10원을 쓸 수 없었어. 한국은행은 옛 10원이 60억 장 남아 계속 쓰일 테니 불편이 크지 않을 거라고 봤지.",
      imageBrief: "공중전화기 반환구에서 작은 동전이 굴러 나와 있고, 옆 선반에는 옛 동전이 가득 든 저금통이 놓여 있다. 사람 없음. 글자·숫자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "L",
      lock: "no people appear; the phone keeps no text or numerals; the shelf stays fixed.",
      motion: motion("the small coin settles in the return tray with a tiny glint, the phone and the shelf stay completely still", "a small inconvenience") },
    { scene: 13, key: "s13_precedent", role: "evidence", video: "story_ep22_s13_precedent_motion.mp4",
      narration: "이런 결정이 처음은 아니었어. 1968년에는 1원 동전을 황동에서 알루미늄으로 바꿨지. 만드는 값이 3.8원까지 올랐거든.",
      imageBrief: "낡은 나무 책상 위에 오래된 작은 동전 몇 개와 낡은 서류철이 놓여 있다. 사람 없음. 글자·숫자 없음. 빛바랜 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "M",
      lock: "no people appear; the coins and folder keep no text or numerals; the desk stays fixed.",
      motion: motion("a faint dust-lit glow drifts over the old coins, the desk and the folder stay completely still", "it has happened before") },
    { scene: 14, key: "s14_result", role: "evidence", video: "story_ep22_s14_result_motion.mp4",
      narration: "새 10원의 금속값은 5~6원으로 내려갔고, 만드는 값은 20원대로 떨어졌어.",
      imageBrief: "저울 접시에 작은 새 동전이 가볍게 놓여 있고 옆의 영수증 더미는 낮아졌다. 사람 없음. 글자·숫자 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "N",
      lock: "no people appear; nothing carries text or numerals; the scale stays fixed.",
      motion: motion("the scale arm rises lightly on the coin side, the base and the pile stay completely still", "costs come down") },
    { scene: 15, key: "s15_save", role: "evidence", video: "story_ep22_s15_save_motion.mp4",
      narration: "한국은행은 해마다 약 40억 원을 아낄 수 있다고 봤지.",
      imageBrief: "책상 위에 묶인 돈 꾸러미와 숫자 없는 큰 달력 모양 소품이 나란히 놓여 있다. 사람 없음. 글자·숫자 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "O",
      lock: "no people appear; nothing carries text or numerals; the desk stays fixed.",
      motion: motion("a gentle light slides over the bundle and the calendar, the desk stays completely still", "saved every year") },
    { scene: 16, key: "s16_lesson", role: "evidence", video: "story_ep22_s16_lesson_motion.mp4",
      narration: "그런데 이런 일은 동전에만 있는 게 아니야. 재료값이 오르면 값을 올리거나, 크기를 줄이거나, 재료를 바꿔.",
      imageBrief: "동네 마트 진열대에 글자 없는 색 무늬 과자 봉지들이 나란히 있고 봉지가 작아 칸이 헐렁하다. 사람 없음. 글자·로고·브랜드 없음. 환한 매장 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "Q",
      lock: "no people appear; the bags keep no text, logos or brands; the shelf stays fixed.",
      motion: motion("a soft light travels along the shelf past the small bags, the shelf and the bags stay completely still", "everyday shrinkage") },
  ]),
});

// ── 17번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP22_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 22,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep22",
  sceneBackgrounds: Object.freeze({
    P: { label: "마트 입구 앞 광장(17번 부엉박사)", image: "밝은 오후 한국 동네 마트 입구 앞 광장. 부엉박사 뒤로 글자 없는 마트 외벽과 열린 자동문, 바닥에 놓인 작은 과자 봉지 두 개(글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 빛.", videoStyle: "bright afternoon on the plaza in front of a Korean neighborhood mart with a plain wall, an open automatic door, and two small plain snack bags on the ground, smooth light gray pavement", videoStatics: "the mart wall, the open door, the two bags, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 17, key: "s17_close", role: "save", video: "story_ep22_s17_close_motion.mp4",
      narration: "과자 봉지가 작아지는 것도 이 동전과 같은 계산이야. 10원 동전 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the wall and the bags stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep22-assembly-spec.mjs --spec-export STORY_EP22_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep22-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep22-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep22-tts/story-ep22-tts-script.json --out-dir C:/tmp/story-ep22-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP22_FULL_SPEC = Object.freeze({
  ...STORY_EP22_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP22_SEMI_SPEC.sceneBackgrounds, ...STORY_EP22_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP22_SEMI_SPEC.scenes, ...STORY_EP22_END_SPEC.scenes]),
});

export const STORY_EP22_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP22_FULL_SPEC,
  headerTitle: Object.freeze(["10원 동전이","10원보다","비쌌던 해"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["10원","40원대","24원","20원대","40억"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP22_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
