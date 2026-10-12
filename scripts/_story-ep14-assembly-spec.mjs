/**
 * 스토리형 14편 — 닌텐도 — 화투 회사를 살린 직원의 장난감 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep14-nintendo/scenes-v10.json`. 설계 `C:/tmp/story-ep14-nintendo/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep14-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~17번 재연 장면 + 18번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~17번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep14-assembly-spec.mjs --scene-spec-export STORY_EP14_SEMI_SPEC --out-dir C:/tmp/story-ep14-images`
 *            ② 18번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep14-assembly-spec.mjs --scene-spec-export STORY_EP14_END_SPEC --out-dir C:/tmp/story-ep14-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP14_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 14,
  displayEpisode: 14,
  sourceCandidate: "story-ep14-nintendo-hanafuda-ultrahand",
  title: "닌텐도 — 화투 회사를 살린 직원의 장난감",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep14",
  storyStyleOnlyIdentity:
    "1960년대 일본 교토의 화투·카드 제조 회사와 공장·사무실을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(야마우치·요코이)을 닮게 그리지 않고, 실제 회사 로고·게임 캐릭터(마리오 등)는 그리지 않아. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "택시 열쇠와 즉석밥 상자가 놓인 화투 사무실(1번)", image: "오래된 사무실 선반 위에 택시 열쇠 꾸러미와 글자 없는 흰 즉석밥 상자들이 나란히 놓여 있고, 그 옆 책상에 화투 패 한 더미가 쌓여 있다. 사람 없음. 따뜻한 오후 햇살.", videoStyle: "an old office shelf with a set of taxi keys and plain white instant rice boxes with no text side by side and a stack of hanafuda cards on the desk beside it, no people, warm afternoon sunlight", videoStatics: "the shelf, the taxi keys, the white boxes, the desk, and the hanafuda stack" },
    B: { label: "화투 패를 만드는 손(2번)", image: "오래된 교토 작업장의 작업대 위에서 두 손이 색색의 화투 패를 한 장씩 가지런히 쌓는다. 손만 보이고 얼굴은 그리지 마. 따뜻한 조명.", videoStyle: "close view of two hands neatly stacking colorful hanafuda cards one by one on an old Kyoto workshop bench, hands only, warm light", videoStatics: "the bench, the card stacks, and the warm light" },
    C: { label: "카드 상자가 가득 찬 창고(3번)", image: "창고 선반에 글자 없는 카드 상자가 빼곡히 쌓여 더 둘 곳이 없고, 한 사람이 작은 뒷모습으로 서서 올려다본다(얼굴 안 보임). 약한 창문 빛.", videoStyle: "a warehouse with shelves packed full of plain card boxes with no text and no room left, one small person seen from behind looking up, weak window light", videoStatics: "the packed shelves, the plain boxes, and the warehouse walls" },
    D: { label: "빈 가게 카운터의 카드 상자(4번)", image: "텅 빈 가게 카운터 앞에 글자 없는 카드 상자를 든 한 사람의 뒷모습(얼굴 안 보임). 손님이 없는 가게 안. 낮은 조명.", videoStyle: "an empty shop counter with one person seen from behind holding a plain card box with no text, no customers in the shop, low lighting", videoStatics: "the empty counter, the shop shelves, and the low lighting" },
    E: { label: "택시와 즉석밥 포장 라인이 나란한 장면(5번)", image: "한 화면에 택시 두 대가 줄지어 서 있고 그 옆에 글자 없는 흰 즉석밥 포장 라인이 이어지는 합성 장면. 사람 없음. 낮의 햇살. 택시와 상자에 글자·로고 없음.", videoStyle: "a composite wide scene with two taxis lined up and a plain white instant rice packing line continuing beside them, no people, daylight, no text or logos on the taxis or boxes", videoStatics: "the two taxis, the packing line, and the daylight" },
    F: { label: "멈춘 택시와 먼지 쌓인 포장 라인(6번)", image: "멈춰 선 택시 한 대와 먼지가 얇게 앉은 즉석밥 포장 라인. 사람 없음. 흐린 빛 한 줄기. 글자·로고 없음.", videoStyle: "a stopped taxi and a dusty idle instant rice packing line, no people, a single shaft of dim light, no text or logos", videoStatics: "the stopped taxi, the dusty packing line, and the dim shaft of light" },
    G: { label: "곤두박질치는 막대 블록(7번)", image: "책상 위에 막대 그래프 모양의 블록들이 왼쪽에서 오른쪽으로 갈수록 급하게 낮아지는 배열. 글자·숫자 없음. 사람 없음. 차가운 조명.", videoStyle: "close view of block bars on a desk dropping steeply from left to right, no text or numbers, no people, cold lighting", videoStatics: "the desk, the block bars, and the cold lighting" },
    H: { label: "막다른 골목 끝의 작은 빛(8번)", image: "좁은 막다른 골목 끝에 작은 빛 하나가 보이고, 한 사람이 뒷모습으로 서서 그쪽을 바라본다(얼굴 안 보임). 어두운 저녁.", videoStyle: "the end of a narrow dead-end alley with a single small light and one person seen from behind looking toward it, dark evening", videoStatics: "the alley walls, the single small light, and the dark evening" },
    I: { label: "설비를 점검하는 직원(9번)", image: "공장 조립 라인의 설비 앞에서 작업복 차림 직원이 뒷모습으로 허리를 숙여 점검한다(얼굴 안 보임). 공구 가방과 밝은 형광등.", videoStyle: "a factory assembly line machine with an employee in work clothes seen from behind bending over to inspect it, a tool bag and bright fluorescent lights", videoStatics: "the assembly line machine, the tool bag, and the fluorescent lights" },
    J: { label: "늘어나는 팔 모양 막대를 만지는 손(10번)", image: "공구 선반 앞 작업대에서 한 손이 접었다 펴지는 늘어나는 팔 모양의 막대 장난감을 만지작거린다. 글자 없음. 손만 보임. 따뜻한 조명.", videoStyle: "close view of a hand fiddling with an extending arm-shaped toy that folds and stretches on a workbench in front of a tool shelf, hand only, warm light", videoStatics: "the workbench, the tool shelf, and the warm light" },
    K: { label: "임원실 문 앞의 직원(11번)", image: "임원실 나무 문 앞에서 직원이 뒷모습으로 서서 한 손에 늘어나는 팔 장난감을 쥐고 있다(얼굴 안 보임). 복도의 약한 불빛.", videoStyle: "in front of an executive office wooden door an employee seen from behind holding an extending arm toy in one hand, weak corridor light", videoStatics: "the wooden door, the corridor walls, and the weak light" },
    L: { label: "장난감을 꼭 쥔 손(12번)", image: "긴장해서 굳은 어깨와 늘어나는 팔 장난감을 꼭 쥔 손 근접. 얼굴은 그리지 마. 차분한 조명.", videoStyle: "close view of tense shoulders and a hand gripping an extending arm toy tightly, face not shown, calm lighting", videoStatics: "the shoulders, the hand, the toy, and the calm lighting" },
    M: { label: "책상 위로 건네는 장난감(13번)", image: "사장 책상 위에서 한 손이 늘어나는 팔 장난감을 들어 올려 맞은편 손에 건넨다. 얼굴은 그리지 마(손만). 따뜻한 조명.", videoStyle: "close view of a hand on a boss's desk lifting an extending arm toy and handing it to a hand across the desk, hands only, warm light", videoStatics: "the desk, the warm light, and the background wall" },
    N: { label: "상자와 창밖 올림픽 뒤 거리(14번)", image: "탁자 위에 글자·로고 없는 늘어나는 팔 장난감 상자가 놓여 있고, 창밖으로 1960년대 일본 도심 거리 풍경(글자·간판 없음)이 보인다. 사람 없음. 낮의 햇살.", videoStyle: "a table with a plain extending arm toy box with no text or logos and a 1960s Japanese downtown street visible through the window without signs, no people, daylight", videoStatics: "the table, the toy box, the window, and the street outside" },
    O: { label: "상자가 높이 쌓인 매장 진열대(15번)", image: "매장 진열대에 글자·로고 없는 장난감 상자가 높은 탑처럼 빽빽하게 쌓여 있다. 사람 없음. 밝은 조명.", videoStyle: "a shop display with plain toy boxes with no text or logos stacked densely like tall towers, no people, bright lighting", videoStatics: "the display shelves, the stacked boxes, and the bright lighting" },
    Q: { label: "작은 개발 사무실 책상과 시제품(16번)", image: "작은 사무실에 책상 두 개가 마주 놓여 있고 위에 글자·로고 없는 휴대용 게임기 시제품과 도면이 놓여 있다. 사람 없음. 따뜻한 조명.", videoStyle: "a small office with two desks facing each other holding a plain handheld game console prototype with no text or logos and blueprints, no people, warm lighting", videoStatics: "the two desks, the prototype, the blueprints, and the warm lighting" },
    R: { label: "화투 패와 낡은 휴대 게임기(17번)", image: "탁자 위에 오래된 화투 패 한 줄과 낡은 휴대용 게임기 한 대가 나란히 놓여 있다. 글자·로고·캐릭터 없음. 사람 없음. 따뜻한 조명.", videoStyle: "close view of a row of old hanafuda cards and an old handheld game console side by side on a table, no text, logos or characters, no people, warm light", videoStatics: "the table, the cards, the console, and the warm light" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep14_s1_hook_motion.mp4",
      narration: "화투를 만들던 회사가 택시 회사를 차리고 즉석밥까지 팔았어. 그러는 사이 주가는 15분의 1쯤으로 쪼그라들었지.",
      imageBrief: "오래된 사무실 선반 위에 택시 열쇠 꾸러미와 글자 없는 흰 즉석밥 상자들이 나란히 놓여 있고, 그 옆 책상에 화투 패 한 더미가 쌓여 있다. 사람 없음. 따뜻한 오후 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "A",
      lock: "no people appear; the boxes keep plain white faces with no text or logos; the cards keep only plain patterns with no characters; nothing else enters.",
      motion: motion("the afternoon light slides across the keys and the card stack, the shelf and the desk stay completely still", "an odd mix of businesses") },
    { scene: 2, key: "s2_origin", role: "evidence", video: "story_ep14_s2_origin_motion.mp4",
      narration: "이 회사는 1889년부터 화투를 만들어 온 곳이었어. 스물한 살에 사장이 된 야마우치 히로시는 디즈니 캐릭터 카드로 첫해에 60만 팩 넘게 팔았지.",
      imageBrief: "오래된 교토 작업장의 작업대 위에서 두 손이 색색의 화투 패를 한 장씩 가지런히 쌓는다. 손만 보이고 얼굴은 그리지 마. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "B",
      lock: "no face or body appears — only the hands; the cards keep only plain patterns with no readable text or characters; the bench stays fixed.",
      motion: motion("the hands place one more card on the stack and square the pile, the bench and the stacks stay completely still", "a card maker") },
    { scene: 3, key: "s3_saturated", role: "evidence", video: "story_ep14_s3_saturated_motion.mp4",
      narration: "그런데 화투와 트럼프 시장은 이미 가득 차 있었어. 더 팔 곳이 없었지.",
      imageBrief: "창고 선반에 글자 없는 카드 상자가 빼곡히 쌓여 더 둘 곳이 없고, 한 사람이 작은 뒷모습으로 서서 올려다본다(얼굴 안 보임). 약한 창문 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "C",
      lock: "the person stays small and seen from behind with no face shown; the boxes keep no text or logos; nobody else enters.",
      motion: motion("the person slowly raises a hand toward the top shelf and lowers it, the shelves and the boxes stay completely still", "nowhere to sell") },
    { scene: 4, key: "s4_question", role: "core_question", video: "story_ep14_s4_question_motion.mp4",
      narration: "팔 곳이 없으면, 무엇을 팔아야 할까?",
      imageBrief: "텅 빈 가게 카운터 앞에 글자 없는 카드 상자를 든 한 사람의 뒷모습(얼굴 안 보임). 손님이 없는 가게 안. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "D",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the box keeps no text or logos; nobody else enters.",
      motion: motion("the person shifts the box to the other hand and looks around the empty shop, the counter and the shelves stay completely still", "what to sell next") },
    { scene: 5, key: "s5_outside", role: "evidence", video: "story_ep14_s5_outside_motion.mp4",
      narration: "사장은 밖에서 답을 찾았어. 택시 회사를 세우고, 즉석밥 같은 식품 사업에도 손을 댔지.",
      imageBrief: "한 화면에 택시 두 대가 줄지어 서 있고 그 옆에 글자 없는 흰 즉석밥 포장 라인이 이어지는 합성 장면. 사람 없음. 낮의 햇살. 택시와 상자에 글자·로고 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "E",
      lock: "no people appear; the taxis and the boxes keep no text, logos or numbers; the arrangement stays the same.",
      motion: motion("the packing line moves steadily and a taxi's tail lights blink once, the taxis and the line frame stay completely still", "trying other businesses") },
    { scene: 6, key: "s6_failed", role: "evidence", video: "story_ep14_s6_failed_motion.mp4",
      narration: "결과는 대부분 실패였어.",
      imageBrief: "멈춰 선 택시 한 대와 먼지가 얇게 앉은 즉석밥 포장 라인. 사람 없음. 흐린 빛 한 줄기. 글자·로고 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "F",
      lock: "no people appear; no text or logos; the arrangement stays the same.",
      motion: motion("dust motes drift in the single shaft of light, the taxi and the line stay completely still", "it did not work") },
    { scene: 7, key: "s7_stock60", role: "evidence", video: "story_ep14_s7_stock60_motion.mp4",
      narration: "도쿄올림픽이 열린 1964년 무렵, 주가는 900엔 안팎에서 60엔까지 떨어졌지.",
      imageBrief: "책상 위에 막대 그래프 모양의 블록들이 왼쪽에서 오른쪽으로 갈수록 급하게 낮아지는 배열. 글자·숫자 없음. 사람 없음. 차가운 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "G",
      lock: "no people appear; the blocks keep the same descending arrangement with no text or numbers; the desk stays fixed.",
      motion: motion("a cold light slides down the descending blocks and settles on the smallest one, the desk and the blocks stay completely still", "the price collapsed") },
    { scene: 8, key: "s8_no_path", role: "core_question", video: "story_ep14_s8_no_path_motion.mp4",
      narration: "카드는 막혔고, 새 사업도 막혔어. 이 회사에 남은 길이 있기는 했을까?",
      imageBrief: "좁은 막다른 골목 끝에 작은 빛 하나가 보이고, 한 사람이 뒷모습으로 서서 그쪽을 바라본다(얼굴 안 보임). 어두운 저녁. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "H",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; no text or signs; nobody else enters.",
      motion: motion("the small light flickers once and holds while the person stands still, the alley stays completely still", "is there a way") },
    { scene: 9, key: "s9_yokoi1965", role: "evidence", video: "story_ep14_s9_yokoi1965_motion.mp4",
      narration: "1965년, 설비를 고치는 직원 요코이 군페이가 입사했어.",
      imageBrief: "공장 조립 라인의 설비 앞에서 작업복 차림 직원이 뒷모습으로 허리를 숙여 점검한다(얼굴 안 보임). 공구 가방과 밝은 형광등. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "I",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; no text or logos; nobody else enters.",
      motion: motion("the employee tightens a bolt with a wrench and wipes his hands, the machine and the line stay completely still", "the maintenance man") },
    { scene: 10, key: "s10_tinkering", role: "evidence", video: "story_ep14_s10_tinkering_motion.mp4",
      narration: "그는 일이 지루해서, 회사 기계로 틈틈이 장난감을 만들어 놀았지.",
      imageBrief: "공구 선반 앞 작업대에서 한 손이 접었다 펴지는 늘어나는 팔 모양의 막대 장난감을 만지작거린다. 글자 없음. 손만 보임. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "J",
      lock: "no face or body appears — only the hand; the toy keeps no text or logos; the workbench stays fixed.",
      motion: motion("the hand stretches the toy arm out and folds it back, the workbench and the tool shelf stay completely still", "tinkering for fun") },
    { scene: 11, key: "s11_office", role: "evidence", video: "story_ep14_s11_office_motion.mp4",
      narration: "하루는 사장이 그걸 보고, 들고 임원실로 오라고 했어.",
      imageBrief: "임원실 나무 문 앞에서 직원이 뒷모습으로 서서 한 손에 늘어나는 팔 장난감을 쥐고 있다(얼굴 안 보임). 복도의 약한 불빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "K",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; no text or nameplates on the door; nobody else enters.",
      motion: motion("the employee takes a breath and lifts a hand toward the door and stops, the door and the corridor stay completely still", "called in") },
    { scene: 12, key: "s12_scolding", role: "evidence", video: "story_ep14_s12_scolding_motion.mp4",
      narration: "요코이는 훗날 혼날 줄 알았다고 회고했지.",
      imageBrief: "긴장해서 굳은 어깨와 늘어나는 팔 장난감을 꼭 쥔 손 근접. 얼굴은 그리지 마. 차분한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no face appears — only shoulders and the hand; the toy keeps no text or logos; the framing stays fixed.",
      motion: motion("the grip loosens slightly and tightens again, the shoulders and the background stay completely still", "bracing to be scolded") },
    { scene: 13, key: "s13_sell_it", role: "evidence", video: "story_ep14_s13_sell_it_motion.mp4",
      narration: "그런데 사장은 그걸 상품으로 만들어 팔자고 했어.",
      imageBrief: "사장 책상 위에서 한 손이 늘어나는 팔 장난감을 들어 올려 맞은편 손에 건넨다. 얼굴은 그리지 마(손만). 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "M",
      lock: "no face or body appears — only the hands; the toy keeps no text or logos; the desk stays fixed.",
      motion: motion("one hand lifts the toy and the other hand takes it with a small nod of the wrist, the desk and the wall stay completely still", "let us sell it") },
    { scene: 14, key: "s14_name", role: "evidence", video: "story_ep14_s14_name_motion.mp4",
      narration: "이름은 사장이 직접 지었어. 도쿄올림픽 뒤 유행하던 말 울트라C에서 딴 울트라 핸드였지.",
      imageBrief: "탁자 위에 글자·로고 없는 늘어나는 팔 장난감 상자가 놓여 있고, 창밖으로 1960년대 일본 도심 거리 풍경(글자·간판 없음)이 보인다. 사람 없음. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "N",
      lock: "no people appear; the box and the street keep no text, signs or logos; the window view stays the same.",
      motion: motion("sunlight shifts slowly across the toy box and the street outside moves faintly, the table and the window stay completely still", "a name chosen") },
    { scene: 15, key: "s15_million", role: "evidence", video: "story_ep14_s15_million_motion.mp4",
      narration: "10만 개만 팔려도 대히트라던 장난감 시장에서, 울트라 핸드는 100만 개 넘게 팔렸어.",
      imageBrief: "매장 진열대에 글자·로고 없는 장난감 상자가 높은 탑처럼 빽빽하게 쌓여 있다. 사람 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "O",
      lock: "no people appear; the boxes keep no text or logos; the stacks keep the same arrangement.",
      motion: motion("a soft light rises along the tallest stack and holds, the shelves and the boxes stay completely still", "a hit") },
    { scene: 16, key: "s16_devdept", role: "evidence", video: "story_ep14_s16_devdept_motion.mp4",
      narration: "사장은 요코이를 위해 개발 부서를 따로 만들어 줬고, 그는 훗날 게임보이를 설계했어.",
      imageBrief: "작은 사무실에 책상 두 개가 마주 놓여 있고 위에 글자·로고 없는 휴대용 게임기 시제품과 도면이 놓여 있다. 사람 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "Q",
      lock: "no people appear; the prototype and the blueprints keep no text, logos or characters; the desks stay fixed.",
      motion: motion("a soft light brightens the small prototype screen once, the desks and the blueprints stay completely still", "a department of two") },
    { scene: 17, key: "s17_reveal", role: "evidence", video: "story_ep14_s17_reveal_motion.mp4",
      narration: "이 화투 회사의 이름은 닌텐도야. 지금은 마리오를 만드는 회사지.",
      imageBrief: "탁자 위에 오래된 화투 패 한 줄과 낡은 휴대용 게임기 한 대가 나란히 놓여 있다. 글자·로고·캐릭터 없음. 사람 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "R",
      lock: "no people appear; the cards and the console keep no text, logos or characters; the arrangement stays the same.",
      motion: motion("a gentle light crosses from the cards to the console and holds, the table and the objects stay completely still", "cards to games") },
  ]),
});

// ── 18번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP14_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 14,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep14",
  sceneBackgrounds: Object.freeze({
    P: { label: "오래된 작업장과 사무동 앞(18번 부엉박사)", image: "밝은 오후 교토풍 오래된 목조 작업장 건물과 현대식 사무동 앞 마당. 부엉박사 뒤로 글자 없는 두 건물과 열린 문, 바닥에 흰 상자 두 개. 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 햇빛.", videoStyle: "bright afternoon yard in front of an old wooden workshop and a modern office building in a Kyoto style with an open door and two plain white boxes on the ground, smooth light gray pavement", videoStatics: "the old workshop, the modern office building, the open door, the two plain white boxes, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 18, key: "s18_close", role: "save", video: "story_ep14_s18_close_motion.mp4",
      narration: "밖에서 벌인 사업은 막혔는데, 안에서 놀며 만든 장난감이 길을 열었어. 막힌 본업을 푼 회사 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the two buildings and the boxes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep14-assembly-spec.mjs --spec-export STORY_EP14_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep14-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep14-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep14-tts/story-ep14-tts-script.json --out-dir C:/tmp/story-ep14-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP14_FULL_SPEC = Object.freeze({
  ...STORY_EP14_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP14_SEMI_SPEC.sceneBackgrounds, ...STORY_EP14_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP14_SEMI_SPEC.scenes, ...STORY_EP14_END_SPEC.scenes]),
});

export const STORY_EP14_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP14_FULL_SPEC,
  headerTitle: Object.freeze(["막힌 본업을 푼","직원의 장난감","닌텐도"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["화투","택시","즉석밥","주가","장난감","울트라 핸드","닌텐도"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP14_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
