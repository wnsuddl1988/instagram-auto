/**
 * 스토리형 6편 — 현대차 미국 10년·10만 마일 보증 재연 장면 스펙 (2026-10-08).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep6-hyundai-warranty/scenes-v9.json`(13장면 504자, Owner 확정 2026-10-08).
 * 설계 `C:/tmp/story-ep6-hyundai-warranty/story-design.json`. TTS `C:/tmp/money-shorts-os/story-ep6-tts/output-v1/tempo-1.2-gap0.25-pre/…audio-fixed…json`(80.3초).
 * 화풍: 반사실 3D(storysemi, Owner 확정). 1~12번 재연 장면 + 13번 부엉박사 진행자 컷.
 *
 * 이미지 규칙(CURRENT_STANDARDS 이미지 3대 원칙 + 스토리형):
 *  - 화면에 글자·숫자·로고·브랜드·번호판 글자를 넣지 않는다(숫자는 자막이 맡는다). 차량은 마크 없는 일반 소형 세단.
 *  - 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지. 핵심 피사체는 세로 15~62%(자막 자리 비움).
 *  - 인물이 나오는 장면은 얼굴·머리를 세로 45% 아래에(FACE_SAFE), 위 40%는 배경만.
 *  - ★ 실존 인물 오인 방지(4편 11번 영상 거부 사례, 2026-10-08): 얼굴이 크게 보이는 정면·근접 구도를 피하고, 인물은 뒷모습·멀리 있는 작은 모습·손과 소품 위주로 그린다. 직업명(조사원·수사관 등)·실제 인물명·닮음 지시 없음.
 *  - 1980~2000년대 미국 배경(소형 세단, 딜러 전시장, 항구, 토크쇼 스튜디오).
 *
 * 이미지 생성: ① 1~12번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep6-assembly-spec.mjs --scene-spec-export STORY_EP6_SEMI_SPEC --out-dir C:/tmp/story-ep6-images`
 *            ② 13번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep6-assembly-spec.mjs --scene-spec-export STORY_EP6_END_SPEC --out-dir C:/tmp/story-ep6-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·번호판 글자는 하나도 넣지 마(차량·서류·간판·차트 모두 무늬만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

const FACE_SAFE = " 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.";
const CAR = "마크·로고·글자가 전혀 없는 1980년대식 작은 회색 소형 세단(번호판은 글자 없는 빈 판)";

export const STORY_EP6_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 6,
  displayEpisode: 6,
  sourceCandidate: "story-ep6-hyundai-warranty-90s",
  title: "현대차 — 놀림받던 회사의 10년·10만 마일 보증",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep6",
  storyStyleOnlyIdentity:
    "1980~2000년대 미국을 배경으로 한 재연 장면 시리즈의 한 장면이야. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, " +
    "피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. " +
    "장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. " +
    "장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: {
      label: "심야 토크쇼 스튜디오(1번)",
      image: "1980~90년대 미국 심야 토크쇼 스튜디오 전경. 무대 중앙의 책상 뒤에 정장 입은 진행자가 뒷모습으로 앉아 있고(얼굴 안 보임), 객석의 관객 수십 명이 웃으며 박수 친다. 무대 뒤는 글자 없는 짙은 남색 커튼과 반짝이는 조명, 책상 위에 글자·마크 없는 작은 회색 장난감 자동차 하나.",
      videoStyle: "1980s-90s American late-night talk show studio with the host seen from behind at a desk, a laughing audience, a plain navy curtain and a small plain gray toy car on the desk",
      videoStatics: "the plain navy curtain, the sparkling stage lights, the desk with the small plain gray toy car, and the rows of the audience seats",
    },
    B: {
      label: "엔진룸 근접(2번)",
      image: "정비소 안 리프트 위 작은 회색 소형 세단의 열린 보닛 아래 엔진룸 근접 장면. 엔진 위에 렌치 하나가 놓여 있고, 옆에 변속기 부품이 놓인 작업대. 사람·손·팔 없음. 밝은 형광등, 기름 얼룩 없는 깨끗한 바닥.",
      videoStyle: "close view of the engine bay of a small plain gray sedan on a lift with a wrench lying on the engine and a transmission part on the workbench, no people or hands",
      videoStatics: "the open hood, the engine parts, the transmission part on the workbench, the fluorescent lights, and the clean garage floor",
    },
    C: {
      label: "딜러 전시장 앞 주차장(3번)",
      image: "해 질 무렵 미국 딜러 전시장 앞 넓은 주차장. 마크·글자 없는 작은 회색 소형 세단 여러 대가 줄지어 서 있고, 뒤로 유리벽 전시장 건물에 불이 켜져 있으며 붉은 노을. 사람 없음. 간판은 글자 없는 빈 판.",
      videoStyle: "dusk American car dealership lot with a row of small plain gray sedans and a glass showroom with its lights on",
      videoStatics: "the row of small plain gray sedans, the glass showroom building with its lights on, the plain blank sign, and the reddened sky",
    },
    D: {
      label: "미국 항구 선적장(4번)",
      image: "맑은 날 1986년 미국 항구 부두. 대형 자동차 운반선에서 마크·글자 없는 새 작은 회색 소형 세단들이 한 대씩 내려오고, 부두에 같은 차들이 줄지어 서 있으며, 작업자들이 아주 작게 보인다. 뒤로 크레인과 푸른 하늘.",
      videoStyle: "clear-day 1986 American port dock with a car carrier ship unloading small plain gray sedans onto the dock",
      videoStatics: "the large car carrier ship, the row of small plain gray sedans on the dock, the cranes, the tiny workers, and the blue sky",
    },
    E: {
      label: "고속도로 갓길 고장(5번)",
      image: "한적한 미국 도로 갓길. 작은 회색 소형 세단의 보닛이 열려 흰 김이 오르고, 30대 미국 남성 운전자가 뒷모습으로 차 앞에 서서 한 손으로 머리를 짚고 있다(얼굴 안 보임). 멀리 지나가는 차들, 석양.",
      videoStyle: "quiet American roadside at sunset with a small plain gray sedan with its hood up and steam rising, the driver seen from behind",
      videoStatics: "the small plain gray sedan with its hood up, the asphalt road, the distant passing cars, and the sunset sky",
    },
    F: {
      label: "닳은 시트와 녹슨 문턱 근접(6번)",
      image: "오래된 작은 회색 소형 세단 실내와 문 아래 근접 장면. 좌석 천이 해져 실밥이 풀려 있고, 열린 문 아래 문턱과 차체 하단에 갈색 녹이 번져 있다. 사람 없음. 부드러운 측광.",
      videoStyle: "close view of a frayed fabric car seat and a rusty door sill on an old plain gray sedan under soft side light",
      videoStatics: "the frayed seat fabric, the rusty door sill, the open door, and the soft side light",
    },
    G: {
      label: "보증안 전달 회의 탁자(7번)",
      image: "1996년 회의실 탁자 위 근접 장면. 소매가 보이는 한 손이 글자 없는 서류철을 맞은편으로 밀어 건네고, 맞은편 짙은 색 양복 소매의 손이 서류철을 막 받으려 한다. 탁자 뒤에 양복 입은 여러 명이 뒷모습으로 앉아 있다(얼굴 안 보임). 서류철 표지에 글자 없음.",
      videoStyle: "1996 meeting room table close view with one hand sliding a plain folder across to an opposite hand, executives seen from behind",
      videoStatics: "the meeting table, the plain folder, the executives seen from behind, and the plain wall behind them",
    },
    H: {
      label: "텅 빈 딜러 전시장(8번)",
      image: "1998년 미국 딜러 전시장 내부. 마크·글자 없는 작은 회색 소형 세단 서너 대가 넓은 바닥에 덩그러니 서 있고, 유리벽 밖 주차장은 거의 비어 있으며, 멀리 직원 한 명이 창가에서 밖을 보는 작은 뒷모습. 형광등, 손님 없음.",
      videoStyle: "1998 American dealership showroom nearly empty with a few small plain gray sedans and one tiny employee seen from behind at the window",
      videoStatics: "the few small plain gray sedans, the large empty floor, the glass wall with the nearly empty lot, and the fluorescent lights",
    },
    I: {
      label: "열쇠와 보증서 전달(9번)",
      image: "마크 없는 작은 회색 소형 세단 앞에서 딜러 직원의 한 손이 자동차 열쇠와 글자 없는 작은 흰색 책자를 손님의 손에 건네는 근접 장면. 손님의 손이 두 손으로 받으려 한다. 얼굴 없음(손과 소품만). 밝은 전시장 조명.",
      videoStyle: "close view of a dealer's hand handing car keys and a plain blank white booklet to a customer's hands in front of a small plain gray sedan",
      videoStatics: "the small plain gray sedan behind, the keys, the plain blank white booklet, and the bright showroom light",
    },
    J: {
      label: "붐비는 딜러 전시장(10번)",
      image: "2000년 미국 딜러 전시장과 앞마당. 마크·글자 없는 작은 회색 소형 세단 수십 대가 가득하고, 손님들이 아주 작게 여러 명 차를 둘러보며, 맑은 낮 햇빛. 넓은 구도.",
      videoStyle: "bright daytime American dealership lot full of small plain gray sedans with many tiny customers looking around",
      videoStatics: "the dozens of small plain gray sedans, the glass showroom, the tiny customers, and the bright daytime sky",
    },
    K: {
      label: "품질 순위 차트 책상(11·12번)",
      image: "밝은 사무실 책상 위 큰 가로 막대 순위 차트. 막대가 수십 줄 세로로 길게 늘어서 있고(글자·숫자 없이 무늬 막대만), 작은 회색 자동차 모형 하나가 차트의 아래쪽 근처에 놓여 있으며, 정장 소매의 한 손이 그 모형 옆을 짚는다. 얼굴 없음.",
      videoStyle: "bright office desk with a large horizontal ranking chart of dozens of plain bars and a small plain gray car model placed near the lower part, a suited hand pointing beside it",
      videoStatics: "the large horizontal ranking chart with plain bars, the small plain gray car model, and the bright office",
    },
  }),

  scenes: Object.freeze([
    {
      scene: 1, key: "s1_hook", role: "hook", video: "story_ep6_s1_hook_motion.mp4",
      narration: "미국 심야 토크쇼와 TV 코미디에서 놀림받던 차를 팔던 회사가, 10년 안에 엔진이 고장 나면 회사 돈으로 고쳐 주겠다고 했어.",
      imageBrief: "심야 토크쇼 스튜디오 전경(넓은 구도). 책상 뒤 정장 입은 진행자가 뒷모습으로 앉아 책상 위 글자 없는 작은 회색 장난감 자동차를 한 손으로 들어 올리고, 객석의 관객 수십 명이 아주 작게 보이며 웃고 박수 친다. " + NO_TEXT,
      shot: "wide", bg: "A",
      lock: "the host stays seen from behind with no face ever shown; the toy car keeps a plain gray body with no logos or text; the navy curtain and the stage lights stay fixed; the audience stays small and in the same seats.",
      motion: motion("the host lifts the toy car slightly and the small audience laughs and claps, the stage lights glimmer softly, the curtain and the desk stay completely still", "mocking laughter"),
    },
    {
      scene: 2, key: "s2_scope", role: "evidence", video: "story_ep6_s2_scope_motion.mp4",
      narration: "정확히는 10년 또는 10만 마일, 엔진과 변속기를 고쳐 주겠다는 약속이었지.",
      // 2026-10-11 수정(Owner "2번 영상에 사람 팔 없이 손만 혼자 움직여"): 장갑 낀 손이 팔 없이 떠 있던 것을 사람·손이 전혀 없는 장면으로 바꿈.
      imageBrief: "정비소 안 리프트 위 작은 회색 소형 세단의 열린 보닛 아래 엔진룸 근접 장면. 엔진 위에 렌치 하나가 놓여 있고, 옆 작업대에 변속기 부품이 놓여 있다. 사람·손·팔·몸·얼굴은 하나도 그리지 마(빈 정비 장면, 장갑도 없음). " + NO_TEXT,
      shot: "close", bg: "B",
      lock: "no person, no hand, no arm, no glove and no body ever appears; the wrench stays lying on the engine; the engine parts and the transmission part keep plain surfaces with no text or logos; the workbench and lights stay fixed.",
      motion: motion("a soft work-lamp glow slowly brightens across the engine and the wrench, a faint wisp of warm air shimmers above the engine, everything else stays completely still", "careful repair"),
    },
    {
      scene: 3, key: "s3_who_why", role: "core_question", video: "story_ep6_s3_who_why_motion.mp4",
      narration: "그 회사는 현대였어. 현대는 왜 그런 약속까지 해야 했을까?",
      imageBrief: "해 질 무렵 미국 딜러 전시장 앞 넓은 주차장. 마크·글자 없는 작은 회색 소형 세단 여러 대가 줄지어 서 있고, 뒤로 유리벽 전시장 건물에 불이 켜져 있으며 붉은 노을이 진다. 사람 없음. " + NO_TEXT,
      shot: "wide", bg: "C",
      lock: "the row of small plain gray sedans keeps no logos or text and stays in the same arrangement; the glass showroom and the blank sign stay fixed; no people ever appear; only the sunset light shifts.",
      motion: motion("the sunset light slowly deepens and a soft glow flickers on the glass showroom wall, the sedans and the building stay completely still", "an open question"),
    },
    {
      scene: 4, key: "s4_excel", role: "evidence", video: "story_ep6_s4_excel_motion.mp4",
      narration: "시작은 1986년이었어. 현대는 엑셀로 미국에 들어가, 첫해에 16만 대가 넘게 팔았지.",
      imageBrief: "맑은 날 1986년 미국 항구 부두. 대형 자동차 운반선에서 마크·글자 없는 새 작은 회색 소형 세단이 한 대씩 내려오고, 부두에 같은 차들이 줄지어 서 있으며 작업자들이 아주 작게 보인다. " + NO_TEXT,
      shot: "wide", bg: "D",
      lock: "the sedans keep plain gray bodies with no logos or text and the row on the dock stays in the same arrangement; the ship and the cranes stay fixed; the workers stay tiny and few.",
      motion: motion("a sedan rolls slowly down the ramp of the ship onto the dock while the tiny workers guide it, a light sea breeze stirs, the ship and the cranes stay completely still", "a hopeful arrival"),
    },
    {
      scene: 5, key: "s5_gap", role: "evidence", video: "story_ep6_s5_gap_motion.mp4",
      narration: "그런데 품질 관리도, 차를 고쳐 줄 정비망도 모자랐어.",
      imageBrief: "한적한 미국 도로 갓길에서 작은 회색 소형 세단의 보닛이 열려 흰 김이 오르고, 30대 미국 남성 운전자가 뒷모습으로 차 앞에 서서 한 손으로 머리를 짚고 있다(얼굴 안 보임). 멀리 지나가는 차들, 석양. " + NO_TEXT + FACE_SAFE,
      shot: "medium", bg: "E",
      lock: "the driver stays seen from behind with no face ever shown; the sedan keeps a plain gray body with no logos or text; the hood stays open and the road stays fixed; nobody else enters.",
      motion: motion("steam drifts up from under the open hood and the driver shakes his head and rubs the back of his neck, the road and the distant cars stay completely still", "stranded"),
    },
    {
      scene: 6, key: "s6_analyst", role: "evidence", video: "story_ep6_s6_analyst_motion.mp4",
      narration: "한 업계 분석가는 몇 해 안에 시트 천이 해지고 차체가 녹슬었다고 말했어.",
      imageBrief: "오래된 작은 회색 소형 세단의 열린 문 근접 장면. 좌석 천이 해져 실밥이 풀려 있고, 문 아래 문턱과 차체 하단에 갈색 녹이 번져 있다. 사람 없음. 부드러운 측광. " + NO_TEXT,
      shot: "close", bg: "F",
      lock: "the frayed seat and the rusty door sill stay exactly as shown with no text or logos; no people or hands ever appear; only the soft light shifts.",
      motion: motion("a loose thread on the frayed seat sways in a light breeze and the soft light slowly slides across the rusty sill, the seat and the door stay completely still", "decay"),
    },
    {
      scene: 7, key: "s7_dealer", role: "evidence", video: "story_ep6_s7_dealer_motion.mp4",
      narration: "고전하던 1996년, 미국 딜러 한 명이 바로 그 10년, 10만 마일 보증안을 현대 경영진에 내밀었다고 전해져.",
      imageBrief: "회의실 탁자 위 근접 장면. 소매가 보이는 한 손이 글자 없는 서류철을 맞은편으로 밀어 건네고, 맞은편 짙은 색 양복 소매의 손이 서류철을 막 받으려 한다. 탁자 뒤에 양복 입은 여러 명이 뒷모습으로 앉아 있다(얼굴 안 보임). 서류철 표지에 글자 없음. " + NO_TEXT,
      shot: "close", bg: "G",
      lock: "no face ever appears — only the hands and the suit sleeves, and the executives stay seen from behind; the folder keeps a plain cover with no text; the table and the wall stay fixed; nobody new enters.",
      motion: motion("one hand slides the plain folder slowly across the table and the opposite hand rests on it and draws it closer, the executives behind stay completely still", "a proposal is offered"),
    },
    {
      scene: 8, key: "s8_low_sales", role: "evidence", video: "story_ep6_s8_low_sales_motion.mp4",
      narration: "그 뒤에도 판매는 줄어, 1998년엔 약 9만 대까지 내려갔어. 진출 첫해의 절반 남짓이고, 역대 최저 수준으로 향하던 때였지.",
      imageBrief: "딜러 전시장 내부. 마크·글자 없는 작은 회색 소형 세단 서너 대가 넓은 바닥에 덩그러니 서 있고, 유리벽 밖 주차장은 거의 비어 있으며, 멀리 직원 한 명이 창가에서 밖을 보는 작은 뒷모습. 손님 없음. " + NO_TEXT,
      shot: "wide", bg: "H",
      lock: "the few sedans keep plain gray bodies with no logos or text and stay in the same places; the glass wall and the nearly empty lot stay fixed; the employee stays tiny and seen from behind; no customers ever enter.",
      motion: motion("the employee at the window turns slightly and looks down at the floor, dust drifts in the light over the empty floor, the sedans and the glass wall stay completely still", "an empty showroom"),
    },
    {
      scene: 9, key: "s9_warranty", role: "evidence", video: "story_ep6_s9_warranty_motion.mp4",
      narration: "현대가 그 보증을 내건 건 90년대 말이었어. 고장이 날 때마다 수리 비용을 회사가 내겠다는 약속이었지.",
      imageBrief: "마크 없는 작은 회색 소형 세단 앞에서 딜러 직원의 한 손이 자동차 열쇠와 글자 없는 작은 흰색 책자를 손님의 손에 건네는 근접 장면. 손님의 두 손이 받으려 한다. 얼굴은 그리지 마(손과 소품만). " + NO_TEXT,
      shot: "close", bg: "I",
      lock: "no face or body appears — only the hands and sleeves; the keys and the booklet stay held in the hands with the booklet cover plain and blank; the sedan behind keeps no logos or text.",
      motion: motion("the dealer's hand places the keys and the plain booklet into the customer's cupped hands and both hands close around them, the sedan behind stays completely still", "a promise handed over"),
    },
    {
      scene: 10, key: "s10_sales_up", role: "evidence", video: "story_ep6_s10_sales_up_motion.mp4",
      narration: "보증을 시행한 뒤인 2000년엔 미국 판매가 약 24만 대로, 1998년의 두 배를 넘었어.",
      imageBrief: "맑은 낮 딜러 전시장과 앞마당 전경(넓은 구도). 마크·글자 없는 작은 회색 소형 세단 수십 대가 가득하고, 손님들이 아주 작게 여러 명 차를 둘러보며 다닌다. " + NO_TEXT,
      shot: "wide", bg: "J",
      lock: "the sedans keep plain gray bodies with no logos or text and stay in the same rows; the glass showroom stays fixed; the customers stay tiny and no one becomes large.",
      motion: motion("the tiny customers walk between the rows and a few open car doors, a light breeze moves the sunlight on the cars, the rows and the showroom stay completely still", "crowded again"),
    },
    {
      scene: 11, key: "s11_quality_late", role: "core_question", video: "story_ep6_s11_quality_late_motion.mp4",
      narration: "하지만 품질 평가는 한참 뒤에 따라왔어. J.D. 파워 새 차 품질 조사에서 현대는 2001년에도 32위였지.",
      imageBrief: "밝은 사무실 책상 위 큰 가로 막대 순위 차트. 막대가 수십 줄 세로로 길게 늘어서 있고(글자·숫자 없이 무늬 막대만), 작은 회색 자동차 모형 하나가 차트의 아래쪽 근처에 놓여 있으며, 정장 소매의 한 손이 그 모형 옆을 짚는다. 얼굴은 그리지 마. " + NO_TEXT,
      shot: "close", bg: "K",
      lock: "no face or body appears — only the one hand and the suit sleeve; the chart keeps only plain bars with no text or numbers; the car model stays near the lower part of the chart and keeps a plain gray body with no logos.",
      motion: motion("the hand taps the table beside the car model and drags a finger slowly upward along the chart edge, the chart and the model stay completely still", "still near the bottom"),
    },
    {
      scene: 12, key: "s12_rank_up", role: "evidence", video: "story_ep6_s12_rank_up_motion.mp4",
      narration: "그 순위는 2004년 7위로 처음 10위권에 들었고, 2006년엔 3위까지 올랐어.",
      imageBrief: "같은 밝은 사무실 책상 위 큰 가로 막대 순위 차트. 이번에는 작은 회색 자동차 모형이 차트의 위쪽 근처에 놓여 있고, 정장 소매의 한 손이 모형을 위쪽 칸으로 옮겨 놓은 직후 손을 떼고 있다. 막대는 글자·숫자 없이 무늬만. 얼굴은 그리지 마. " + NO_TEXT,
      shot: "close", bg: "K",
      lock: "no face or body appears — only the one hand and the suit sleeve; the chart keeps only plain bars with no text or numbers; the car model stays near the upper part of the chart and keeps a plain gray body with no logos.",
      motion: motion("the hand lifts away from the car model near the top of the chart and gives a small satisfied tap on the table, the chart and the model stay completely still", "climbing up"),
    },
  ]),
});

// ── 13번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성(참조 이미지 첨부·부엉박사 프레임 규칙은 owl3dv5 경로가 처리) ──
export const STORY_EP6_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 6,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep6",
  sceneBackgrounds: Object.freeze({
    O: {
      label: "자동차 전시장 로비(13번 부엉박사)",
      image: "밝은 자동차 전시장 로비. 부엉박사 뒤로 글자·마크 없는 작은 회색 소형 세단 한 대와 유리벽, 한쪽에 글자 없는 접수 카운터, 탁자 위에 글자 없는 흰 책자 하나. 바닥은 매끈한 연한 회색 석재, 따뜻한 오후 햇빛.",
      videoStyle: "bright car showroom lobby with a small plain gray sedan, a glass wall and a plain reception counter",
      videoStatics: "the small plain gray sedan, the glass wall, the plain reception counter, the plain white booklet on the table, the smooth light gray stone floor, and the warm afternoon light",
    },
  }),
  scenes: Object.freeze([
    {
      scene: 13, key: "s13_close", role: "save", video: "story_ep6_s13_close_motion.mp4",
      narration: "보증이 몇 년인지는 회사가 자기 품질을 얼마나 믿는지 보여 주는 숫자야. 놀림받던 회사는 그 숫자로 말했던 거지. 다음 일화는 팔로우하고 기다리면 돼.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 기둥·조명·천장 같은 배경만 보이게 해.",
      shot: "medium", bg: "O",
      lock: "the plain booklet on the table keeps no text; the plain gray sedan and the glass wall stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 스토리형 조립 스펙(조립기 run-owl-assemble-shorts-v2.mjs 용) — 5편 STORY_EP5_ASSEMBLE_SPEC과 같은 구성(2026-10-10) ──
// 제목(★임시안 — Owner 확정 필요, 영상 속 제목·커버 문구 동일): 놀림받던 차가 / 10년 보증을 / 내건 이유
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep6-assembly-spec.mjs --spec-export STORY_EP6_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep6-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep6-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep6-tts/story-ep6-tts-script.json --out-dir C:/tmp/story-ep6-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP6_FULL_SPEC = Object.freeze({
  ...STORY_EP6_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP6_SEMI_SPEC.sceneBackgrounds, ...STORY_EP6_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP6_SEMI_SPEC.scenes, ...STORY_EP6_END_SPEC.scenes]),
});

export const STORY_EP6_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP6_FULL_SPEC,
  headerTitle: Object.freeze(["놀림받던 차가","10년 보증을","내건 이유"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["현대","엑셀","보증","10만 마일","딜러","품질"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+(?:만|억)","[0-9]+년","[0-9]+위","[0-9]+대"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP6_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
