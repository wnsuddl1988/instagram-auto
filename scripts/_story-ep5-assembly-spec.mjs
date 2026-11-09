/**
 * 스토리형 5편 — 삼성 구미 사업장 불량 제품 소각(1995) 재연 장면 스펙 (2026-10-08).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep7-anycall/scenes-v9.json`(15장면 523자, Owner 확정 2026-10-08).
 * 설계 `C:/tmp/story-ep7-anycall/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep5-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed…json`(77.5초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~14번 재연 장면 + 15번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형):
 *  - 화면에 글자·숫자·로고를 넣지 않는다(숫자는 자막이 맡는다). 제품 표면·상자·서류도 무늬만, 브랜드·로고·제품명 없음.
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - 인물이 나오는 장면은 얼굴·머리를 세로 45% 아래에(FACE_SAFE), 위 40%는 배경만(영상 위 제목이 얼굴을 덮은 1편 교훈).
 *  - 실존 인물을 닮게 그리지 않는다: 회장은 얼굴 없이 손·소품만, 나머지는 일반적인 직원·손님. 실제 회사·브랜드 로고·간판 없음.
 *  - 1995년 배경(안테나 달린 투박한 베이지색 무선전화기·휴대폰, 팩시밀리, 형광등, 작업복 직원).
 *
 * 이미지 생성: ① 1~14번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep5-assembly-spec.mjs --scene-spec-export STORY_EP5_SEMI_SPEC --out-dir C:/tmp/story-ep5-images`
 *            ② 15번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep5-assembly-spec.mjs --scene-spec-export STORY_EP5_END_SPEC --out-dir C:/tmp/story-ep5-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름은 하나도 넣지 마(제품 표면·상자·서류·간판 모두 무늬만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 얼굴과 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·얼굴·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해. 인물은 가슴 위가 아니라 허리 위까지 아래쪽 절반에 넉넉히 담아.";

const WORKER = "30대 한국 남성 생산직 직원(짧은 검은 머리, 흰 안전모, 하늘색 작업복)";
const INSPECTOR = "30대 한국 여성 검사원(머리를 묶음, 흰 위생모, 하늘색 작업복)";
const CUSTOMER = "30대 한국 남성 손님(짧은 검은 머리, 흰 셔츠에 회색 정장 바지)";
const CLERK = "20대 한국 여성 매장 직원(단정한 단발머리, 남색 조끼 유니폼)";
const PHONE = "안테나가 달린 투박한 베이지색 1990년대 무선전화기(브랜드·글자 없음)";

export const STORY_EP5_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 5,
  displayEpisode: 5,
  sourceCandidate: "story-ep5-samsung-anycall-burning-1995",
  title: "삼성 화형식 — 500억 원어치 불량품을 직접 불태운 날",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep5",
  storyStyleOnlyIdentity:
    "1995년 한국을 배경으로 한 재연 장면 시리즈의 한 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    `생산직 직원이 장면 설명에 나오면 ${WORKER}의 일반적인 모습으로 그려. ` +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "구미 사업장 운동장 소각 현장(1·2·4번)",
      image: "해 질 무렵 1995년 한국 전자공장 운동장. 넓은 흙 운동장 한가운데 불량 제품 더미가 쌓여 불타오르고, 뒤로 낮은 회색 공장 건물과 굴뚝, 붉게 물든 하늘, 운동장 가장자리에 하늘색 작업복을 입은 직원들이 둥글게 서 있다.",
      videoStyle: "dusk 1995 Korean electronics factory yard with a burning pile of plain unmarked devices and workers standing in a wide circle",
      videoStatics: "the low gray factory buildings, the chimney, the reddened sky, the wide dirt yard, and the circle of workers in light blue uniforms standing at the edge",
    },
    C: {
      label: "쌓인 제품 더미 근접(3번)",
      image: "운동장 흙바닥 위에 쌓인 제품 더미의 근접 장면. 안테나 달린 투박한 베이지색 무선전화기, 벽돌 크기의 휴대폰, 베이지색 팩시밀리 본체가 뒤섞여 산처럼 쌓여 있고 일부는 해머에 맞아 갈라져 있다. 제품 표면에 글자·로고 없음. 사람 없음. 뒤는 흐린 저녁 하늘.",
      videoStyle: "close view of a mixed pile of beige antenna cordless phones, brick-sized mobile phones and beige fax machines on a dirt yard under a dim evening sky",
      videoStatics: "the mixed pile of beige antenna phones, brick-size mobile phones and fax machines, the cracked casings, the dirt ground, and the dim evening sky",
    },
    D: {
      label: "검사 작업대(5·12번)",
      image: "1995년 한국 전자공장 검사 작업대. 밝은 형광등 아래 긴 작업대 위에 베이지색 휴대폰 열 대가 한 줄로 나란히 놓여 있고, 뒤쪽 선반에 부품 상자들. 바닥은 연한 회색 에폭시. 제품 표면에 글자·로고 없음.",
      videoStyle: "1990s Korean electronics factory inspection bench under bright fluorescent light with a row of ten plain beige mobile phones",
      videoStatics: "the long inspection bench, the row of ten plain beige phones, the shelf with the plain parts boxes, the fluorescent lights, and the light gray floor",
    },
    E: {
      label: "전자제품 매장 진열대(6번)",
      image: "1995년 한국 전자제품 매장. 큰 유리 진열대 앞쪽 줄에는 글자 없는 은회색 외국 휴대폰이 빽빽하게 놓여 있고, 구석 한 칸에만 베이지색 국산 휴대폰이 몇 대 놓여 있으며, 지나가는 손님들이 앞쪽 진열대 앞에 몰려 있다. 형광등과 밝은 바닥.",
      videoStyle: "1990s Korean electronics store with a glass display packed with plain silver phones and only a few beige phones in one corner",
      videoStatics: "the glass display counter, the packed rows of plain silver phones, the few beige phones in the corner, the fluorescent lights, and the light floor",
    },
    F: {
      label: "휴대폰 탑 두 개(7번)",
      image: "밝은 전시장 흰 바닥 위에 휴대폰이 쌓인 탑 두 개가 나란히 서 있다. 왼쪽은 은회색 휴대폰이 높게 쌓인 탑, 오른쪽은 베이지색 휴대폰이 그 절반도 안 되는 높이로 쌓인 탑. 제품 표면에 글자·숫자·로고 없음. 사람 없음. 뒤는 단색 연회색 벽.",
      videoStyle: "bright showroom with two towers of stacked plain phones, a tall silver one and a beige one less than half as high",
      videoStatics: "the tall silver tower, the beige tower less than half its height, the white floor, and the plain light gray wall",
    },
    G: {
      label: "서비스센터 카운터(8번)",
      image: "1995년 한국 서비스센터 카운터. 유리 칸막이 안쪽 남색 조끼 직원, 카운터 위에 베이지색 휴대폰 한 대, 앞쪽에 손님이 한 손으로 카운터를 짚고 다른 손으로 휴대폰을 가리킨다. 뒤쪽 선반에 글자 없는 수리 대기 상자들, 형광등.",
      videoStyle: "1990s Korean service center counter behind a glass partition with a plain beige phone on the counter",
      videoStatics: "the glass partition, the counter with the plain beige phone, the shelf with the plain repair boxes, and the fluorescent lights",
    },
    H: {
      label: "회수품 창고(9번)",
      image: "넓은 물류 창고. 철제 팔레트 위에 글자 없는 갈색 상자들이 높이 쌓여 있고, 상자 일부가 열려 베이지색 휴대폰이 드러나 있으며, 지게차 한 대가 멈춰 있고 천장에 형광등 줄. 바닥은 회색 콘크리트. 사람 없음.",
      videoStyle: "large logistics warehouse with stacked plain brown boxes on steel pallets, some open to show beige phones, and a parked forklift",
      videoStatics: "the stacked plain brown boxes, the steel pallets, the opened boxes with beige phones, the parked forklift, the fluorescent light rows, and the gray concrete floor",
    },
    I: {
      label: "회장 집무실 책상(10·11번)",
      image: "1995년 한국 대기업 회장 집무실. 큰 원목 책상 위에 서류 한 장과 만년필, 베이지색 휴대폰 한 대, 책상 스탠드, 뒤로 큰 창 밖에 저녁 시가지, 벽 한쪽에 원목 책장. 얼굴 없음.",
      videoStyle: "dim 1995 Korean executive office at dusk with a large wooden desk, a paper, a fountain pen and a beige phone",
      videoStatics: "the large wooden desk, the plain paper, the fountain pen, the beige phone, the desk lamp, the big window with the evening city view, and the wooden bookshelf",
    },
    J: {
      label: "전자제품 매장 손님(13번)",
      image: "1995년 한국 전자제품 매장. 이번에는 진열대 앞줄에 베이지색 국산 휴대폰이 빽빽하게 놓여 있고, 손님 여러 명이 몰려 휴대폰을 집어 들어 살펴보며, 직원들이 바쁘게 안내한다. 형광등과 밝은 바닥.",
      videoStyle: "1990s Korean electronics store with the front display packed with beige phones and customers crowding to pick them up",
      videoStatics: "the glass display counter, the packed rows of beige phones, the fluorescent lights, and the light floor",
    },
    K: {
      label: "판매 카운터(14번)",
      image: "1995년 한국 전자제품 매장 판매 카운터. 남색 조끼 직원이 새 베이지색 휴대폰을 두 손으로 건네고, 손님이 두 손으로 받아 환하게 웃는다. 카운터 위에 글자 없는 새 상자 하나, 뒤쪽 진열대와 형광등.",
      videoStyle: "1990s Korean electronics store sales counter with a clerk handing a new beige phone to a smiling customer",
      videoStatics: "the sales counter, the plain new box, the display shelves behind, and the fluorescent lights",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep5_s1_hook_motion.mp4",
      narration: "1995년 3월 9일, 삼성전자는 500억 원어치 제품을 직접 불태웠어.",
      imageBrief: "해 질 무렵 공장 운동장 한가운데에 쌓인 불량 제품 더미(베이지색 무선전화기·휴대폰·팩시밀리)가 크게 불타오르고, 불길과 연기가 붉은 하늘로 솟는다. 운동장 가장자리에 하늘색 작업복 직원들이 아주 작게 둥글게 서서 지켜본다. " + NO_TEXT,
      shot: "wide", bg: "A",
      lock: "the burning pile keeps plain unmarked beige devices with no logos or text; the low factory buildings and the chimney stay fixed; the workers stay tiny at the edge in the same positions and nobody new enters.",
      motion: motion("flames roar and rise from the pile and thick smoke drifts across the reddened sky while the tiny workers stand still watching, the factory buildings stay completely still", "shocking sight"),
    },
    {
      scene: 2, key: "s2_scene", role: "evidence", video: "story_ep5_s2_scene_motion.mp4",
      narration: "구미 사업장 운동장에 쌓인 불량 제품 15만 대를, 직원 2,000여 명이 지켜보는 앞에서 해머로 부수고 불을 붙였지.",
      imageBrief: `운동장에서 ${WORKER} 한 명이 큰 해머를 두 손으로 머리 위로 들어 쌓인 제품 더미를 내려치기 직전 멈춰 있고, 뒤로 하늘색 작업복 직원 수백 명이 둥글게 서서 지켜본다. 해가 지는 붉은 하늘. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "A",
      lock: "the hammer stays gripped in both of his hands for the whole clip; the pile keeps plain unmarked devices with no text; the crowd of workers behind keeps the same circle and nobody new enters.",
      motion: motion("the worker swings the hammer down onto the pile with a heavy blow and pieces split apart, then lifts it again, the watching crowd and the reddened sky stay completely still", "a heavy blow"),
    },
    {
      scene: 3, key: "s3_mix", role: "evidence", video: "story_ep5_s3_mix_motion.mp4",
      narration: "그 15만 대는 휴대폰만이 아니라 무선전화기와 팩시밀리까지 합친 수였어.",
      imageBrief: "흙바닥 위에 안테나 달린 베이지색 무선전화기, 벽돌 크기의 휴대폰, 베이지색 팩시밀리 본체가 섞여 산처럼 쌓여 있고 일부는 갈라져 있다. 사람 없음. " + NO_TEXT,
      shot: "close", bg: "C",
      lock: "the pile keeps the same mix of beige antenna phones, brick-size phones and fax machines with no logos or text; no people or hands ever appear; only the smoke and the light shift.",
      motion: motion("a thin line of smoke drifts across the pile and a loose antenna sways slightly in the wind, the devices and the ground stay completely still", "the sheer amount"),
    },
    {
      scene: 4, key: "s4_why", role: "core_question", video: "story_ep5_s4_why_motion.mp4",
      narration: "팔려고 만든 제품을 왜 이렇게 태웠을까?",
      imageBrief: "해 질 무렵 공장 운동장, 하늘색 작업복 직원 서너 명이 뒷모습으로 서서 멀리 불타는 제품 더미를 바라본다. 얼굴은 보이지 않는다(뒷모습만). 불길이 직원들의 등을 붉게 비춘다. " + NO_TEXT,
      shot: "wide", bg: "A",
      lock: "the workers stay seen only from behind with no faces ever shown; the burning pile keeps plain unmarked devices with no text; the factory buildings stay fixed and nobody new enters.",
      motion: motion("the workers stand still looking at the fire while one slowly turns his head toward another, the flames flicker on their backs, the factory and the sky stay completely still", "an unanswered question"),
    },
    {
      scene: 5, key: "s5_defect", role: "evidence", video: "story_ep5_s5_defect_motion.mp4",
      narration: "소각 직전 삼성 단말기 불량률은 11.8%였어. 열 대 중 한 대 넘게 불량이라는 뜻이지.",
      imageBrief: `공장 검사 작업대 위에 베이지색 휴대폰 열 대가 한 줄로 놓여 있고, ${INSPECTOR}이 그중 한 대를 두 손으로 집어 들어 빨간 점 하나가 찍힌 화면 쪽을 불만스럽게 들여다본다. 나머지 아홉 대는 그대로 놓여 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "D",
      lock: "the row of ten beige phones stays in a line with nine staying in place; the one she holds keeps a plain red dot and no text or logos; the bench and the shelf stay fixed; nobody else enters.",
      motion: motion("the inspector turns the phone over with a frown and sets it aside with a small shake of her head, the other nine phones and the bench stay completely still", "one in ten fails"),
    },
    {
      scene: 6, key: "s6_market", role: "evidence", video: "story_ep5_s6_market_motion.mp4",
      narration: "시장에서도 밀리고 있었어.",
      imageBrief: `전자제품 매장 유리 진열대 앞줄에는 글자 없는 은회색 외국 휴대폰이 빽빽하고, 구석 한 칸에만 베이지색 국산 휴대폰이 몇 대 놓여 있다. ${CUSTOMER} 한 명이 앞줄 진열대의 휴대폰을 들여다보고, 구석 베이지색 휴대폰 쪽은 지나쳐 간다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "E",
      lock: "the packed silver phones and the few beige phones in the corner stay in the same positions with no logos or text; the glass display and the lights stay fixed; the customer keeps looking at the front rows and nobody else enters.",
      motion: motion("the customer leans over the front display, compares two phones and walks past the beige corner without a glance, the displays and the lights stay completely still", "being passed over"),
    },
    {
      scene: 7, key: "s7_share", role: "evidence", video: "story_ep5_s7_share_motion.mp4",
      narration: "소각 다섯 달 전인 1994년 10월, 점유율은 삼성 25.8%에 모토로라 52.5%였지. 절반에도 못 미쳤어.",
      imageBrief: "밝은 전시장 흰 바닥 위에 휴대폰이 쌓인 탑 두 개가 나란히 서 있다. 왼쪽은 은회색 휴대폰이 높게 쌓인 탑, 오른쪽은 베이지색 휴대폰이 그 절반도 안 되는 높이로 쌓인 탑. 제품 표면에 글자·숫자·로고 없음. 사람 없음. " + NO_TEXT,
      shot: "medium", bg: "F",
      lock: "the tall silver tower and the beige tower less than half its height keep exactly those heights for the whole clip; the phones keep plain surfaces with no logos or text; no people appear; only the soft light shifts.",
      motion: motion("the light slowly sweeps from the tall silver tower to the shorter beige tower, a single phone on top of the silver tower wobbles slightly, both towers stay in place", "less than half"),
    },
    {
      scene: 8, key: "s8_cause", role: "evidence", video: "story_ep5_s8_cause_motion.mp4",
      narration: "애니콜은 품질이 불량하다는 지적까지 받았고, 제품을 무리하게 서둘러 내놓은 게 배경으로 꼽혀.",
      imageBrief: `서비스센터 카운터에서 ${CUSTOMER}이 한 손으로 카운터를 짚고 다른 손으로 카운터 위의 베이지색 휴대폰을 가리키며 불만스러운 표정으로 말하고, 유리 칸막이 안쪽 ${CLERK}이 난처한 표정으로 휴대폰을 살핀다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "G",
      lock: "the phone on the counter keeps a plain beige body with no text or logos; the glass partition and the repair boxes stay fixed; the customer keeps one hand on the counter and nobody else enters.",
      motion: motion("the customer points at the phone and speaks with a frown while the clerk turns the phone over with an apologetic look, the counter and the shelf stay completely still", "complaint at the counter"),
    },
    {
      scene: 9, key: "s9_cost", role: "evidence", video: "story_ep5_s9_cost_motion.mp4",
      narration: "이미 판 제품을 거둬 태우면, 그 값은 고스란히 회사가 치러야 해.",
      imageBrief: "넓은 창고에 글자 없는 갈색 상자들이 철제 팔레트 위에 높이 쌓여 있고, 상자 일부가 열려 베이지색 휴대폰이 보이며, 지게차 한 대가 멈춰 서 있다. 사람 없음. " + NO_TEXT,
      shot: "wide", bg: "H",
      lock: "the stacked boxes keep plain brown surfaces with no text or logos; the forklift stays parked in the same place; no people ever appear; only the dust in the light shifts.",
      motion: motion("dust drifts through the shafts of ceiling light over the towering boxes and a top box slides a little as if settling, the pallets and the forklift stay completely still", "the weight of the cost"),
    },
    {
      scene: 10, key: "s10_order", role: "core_question", video: "story_ep5_s10_order_motion.mp4",
      narration: "그런데도 이건희 회장이 소각을 지시했다고 전해져.",
      imageBrief: "해 질 무렵 회장 집무실 큰 원목 책상 위에서 짙은 회색 양복 소매의 한 손이 만년필로 서류 한 장에 서명하려는 순간 멈춰 있다. 얼굴은 그리지 마(손과 소품만). 서류에는 글자 없이 줄무늬만. " + NO_TEXT,
      shot: "close", bg: "I",
      lock: "no face, head or body ever appears — only the one hand and the dark gray suit sleeve; the fountain pen stays gripped in the hand and the paper keeps plain faint lines with no text; the phone and the lamp stay fixed.",
      motion: motion("the hand holds the pen steady over the paper, then signs one firm stroke and lifts the pen, the lamp light flickers faintly", "a firm decision"),
    },
    {
      scene: 11, key: "s11_words", role: "evidence", video: "story_ep5_s11_words_motion.mp4",
      narration: "돈 받고 파는 물건에 불량품을 내놓는 게 미안하지도 않으냐고 했다고 해.",
      imageBrief: "같은 집무실 책상 위에서 짙은 회색 양복 소매의 한 손이 책상 위 베이지색 휴대폰을 검지로 단호하게 짚고 있다. 얼굴은 그리지 마(손과 소품만). " + NO_TEXT,
      shot: "close", bg: "I",
      lock: "no face, head or body ever appears — only the one hand and the dark gray suit sleeve; the phone keeps a plain beige body with no text or logos; the lamp and the window stay fixed.",
      motion: motion("the index finger taps the phone twice firmly and then pushes it slowly away across the desk, the lamp light stays steady", "stern reproach"),
    },
    {
      scene: 12, key: "s12_after_defect", role: "evidence", video: "story_ep5_s12_after_defect_motion.mp4",
      narration: "그 뒤 불량률은 글로벌 제조사와 비슷한 2%대로 떨어졌다는 보도가 있어.",
      imageBrief: `공장 검사 작업대 위에 베이지색 휴대폰 열 대가 한 줄로 놓여 있고, ${INSPECTOR}이 만족스럽게 고개를 끄덕이며 한 대를 두 손으로 집어 살펴본다. 열 대 모두 흠 없이 깨끗하다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "D",
      lock: "the row of ten beige phones stays clean and in a line with no text or logos; the bench and the shelf stay fixed; the inspector keeps holding one phone with both hands and nobody else enters.",
      motion: motion("the inspector checks the phone, nods with a satisfied look and sets it back in the row, the other phones and the bench stay completely still", "quality restored"),
    },
    {
      scene: 13, key: "s13_after_share", role: "evidence", video: "story_ep5_s13_after_share_motion.mp4",
      narration: "그해 7~8월, 애니콜의 국내 점유율은 51.5~52%로 모토로라를 앞섰어. 1994년 10월의 두 배쯤이었고, 이듬해인 1996년에도 1위를 지켰지.",
      imageBrief: `전자제품 매장 유리 진열대 앞줄에 이번에는 베이지색 국산 휴대폰이 빽빽하게 놓여 있고, 손님 서너 명이 몰려 휴대폰을 집어 들어 살펴보며, ${CLERK}이 바쁘게 안내한다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "J",
      lock: "the packed beige phones keep plain bodies with no logos or text; the glass display and the lights stay fixed; the customers keep the same positions and nobody new enters.",
      motion: motion("the customers pick up phones and compare them while the clerk gestures toward a display, the displays and the lights stay completely still", "customers choosing"),
    },
    {
      scene: 14, key: "s14_meaning", role: "evidence", video: "story_ep5_s14_meaning_motion.mp4",
      narration: "손해를 감수하고도 불량품을 전부 거둬 태울 만큼, 정직하게 팔겠다는 선택이었어. 그 선택은 시장에서 인정받았지.",
      imageBrief: `전자제품 매장 판매 카운터에서 ${CLERK}이 새 베이지색 휴대폰을 두 손으로 정중하게 건네고, ${CUSTOMER}이 두 손으로 받아 환하게 웃는다. 카운터 위에 글자 없는 새 상자 하나가 놓여 있다. ` + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "K",
      lock: "the new phone stays in the clerk's and customer's hands during the handover with a plain beige body and no text or logos; the plain box and the display shelves stay fixed; nobody else enters.",
      motion: motion("the clerk hands over the new phone with both hands and the customer takes it with a bright smile and a small bow, the counter and the shelves stay completely still", "trust earned"),
    },
  ]),
});

// ── 15번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성(참조 이미지 첨부·부엉박사 프레임 규칙은 owl3dv5 경로가 처리) ──
export const STORY_EP5_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 5,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep5",
  sceneBackgrounds: Object.freeze({
    O: {
      label: "서비스센터 로비(15번 부엉박사)",
      image: "밝은 휴대폰 서비스센터 로비. 부엉박사 뒤로 글자 없는 접수 카운터와 유리 칸막이, 선반에 글자 없는 흰 상자들, 한쪽에 대기 의자. 바닥은 매끈한 연한 회색 석재, 따뜻한 오후 햇빛.",
      videoStyle: "bright phone service center lobby with a plain reception counter, a glass partition and shelves of plain white boxes",
      videoStatics: "the plain reception counter, the glass partition, the shelves with the plain white boxes, the waiting chairs, the smooth light gray stone floor, and the warm afternoon light",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 15, key: "s15_close", role: "save", video: "story_ep5_s15_close_motion.mp4",
      narration: "불량품은 팔고 끝이 아니야. 거둬들이는 값까지 회사가 치러야 하지. 그 값을 먼저 치른 삼성은 시장의 신뢰를 얻었어. 다음 일화는 팔로우하면 먼저 만날 수 있어.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 기둥·조명·천장 같은 배경만 보이게 해.",
      shot: "medium", bg: "O",
      lock: "the plain boxes on the shelves keep no text; the reception counter and the glass partition stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 4편 STORY_EP4_ASSEMBLE_SPEC과 같은 구성(2026-10-10) ──
// 제목(★임시안 — Owner 확정 필요, 영상 속 제목·커버 문구 동일): "500억 원어치 / 불량품을 / 직접 불태운 날" — 소스 제목(title)에서 '삼성 화형식 —' 머리말만 뺌.
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep5-assembly-spec.mjs --spec-export STORY_EP5_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep5-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep5-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep5-tts/story-ep5-tts-script.json --out-dir C:/tmp/story-ep5-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP5_FULL_SPEC = Object.freeze({
  ...STORY_EP5_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP5_SEMI_SPEC.sceneBackgrounds, ...STORY_EP5_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP5_SEMI_SPEC.scenes, ...STORY_EP5_END_SPEC.scenes]),
});

export const STORY_EP5_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP5_FULL_SPEC,
  headerTitle: Object.freeze(["500억 원어치", "불량품을", "직접 불태운 날"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["삼성", "불량", "소각", "모토로라", "애니콜", "점유율", "불량률"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+(?:억|만|조)", "[0-9,.]+%", "[0-9]+대"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  // 자막 경계 예외(2026-10-10): '휴대폰만이 아니라'(9자)는 한 줄 폭(760px)에 안 들어가고 '아니라 무선전화기와'(2줄 묶음)도 폭을 넘어,
  // 가를 자리가 '휴대폰만이 | 아니라' 하나뿐이다(s3). 대사 변경은 TTS 전체 재생성(유료·전 장면 음성 변동)이 필요해 회피.
  captionBoundaryExceptions: Object.freeze([
    { left: "휴대폰만이", right: "아니라", reason: "'휴대폰만이 아니라' 9자가 한 줄(760px)에 안 들어가고 다른 분할도 폭을 넘어 '휴대폰만이 / 아니라'로 갈림(s3), TTS 재생성 회피(2026-10-10)" },
  ]),
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP5_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
