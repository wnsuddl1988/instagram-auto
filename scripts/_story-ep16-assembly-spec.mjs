/**
 * 스토리형 16편 — 불닭볶음면 — 먹을 수 없다던 라면이 다시 먹고 싶은 맛이 된 일 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep16-buldak/scenes-v1.json`. 설계 `C:/tmp/story-ep16-buldak/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep16-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~16번 재연 장면 + 17번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~16번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep16-assembly-spec.mjs --scene-spec-export STORY_EP16_SEMI_SPEC --out-dir C:/tmp/story-ep16-images`
 *            ② 17번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep16-assembly-spec.mjs --scene-spec-export STORY_EP16_END_SPEC --out-dir C:/tmp/story-ep16-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP16_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 16,
  displayEpisode: 16,
  sourceCandidate: "story-ep16-buldak-2012",
  title: "불닭볶음면 — 먹을 수 없다던 라면이 다시 먹고 싶은 맛이 된 일",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep16",
  storyStyleOnlyIdentity:
    "2012년 한국 식품 회사의 개발 주방과 명동 매운 음식점 골목을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(임원)을 닮게 그리지 않고, 실제 회사·브랜드 로고와 색을 흉내 내지 않아. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "소스 통과 닭 상자 앞에 놓인 라면 한 봉지(1번)", image: "개발 주방 조리대 위에 붉은 소스가 가득 담긴 큰 통 두 개와 닭 상자 더미가 쌓여 있고, 그 앞에 아무도 손대지 않은 붉은 포장의 라면 한 봉지(불꽃 무늬만, 글자 없음)가 놓여 있다. 사람 없음. 따뜻하지만 무거운 조명.", videoStyle: "a test kitchen counter with two large tubs of red sauce and a stack of chicken crates, with one untouched plain red noodle packet with only a flame pattern in front, no people, warm but heavy lighting", videoStatics: "the counter, the sauce tubs, the crates, and the lighting" },
    B: { label: "붉은 소스가 끓는 큰 솥(2번)", image: "주방 한가운데 붉은 소스가 보글보글 끓는 큰 솥과 그 앞의 비어 있는 조리대. 사람 없음. 따뜻한 조명.", videoStyle: "a large pot of red sauce simmering in the middle of a kitchen with an empty counter in front, no people, warm lighting", videoStatics: "the pot, the empty counter, and the kitchen walls" },
    C: { label: "밤의 명동 매운 음식점 입구(3번)", image: "밤의 서울 명동 골목 한쪽, 붉은 불빛이 번지는 작은 음식점 입구(간판은 무늬만, 글자 없음). 길 위로 사람들의 작은 뒷모습 서넛이 지나간다.", videoStyle: "a night alley in Seoul Myeong-dong with a small restaurant entrance glowing red, the signboard holding only a pattern and no text, a few small people seen from behind passing by", videoStatics: "the alley, the restaurant entrance, and the red glow" },
    D: { label: "땀을 닦으며 매운 음식을 먹는 사람들(4번)", image: "음식점 안 식탁에 젊은 사람 서너 명이 뒷모습으로 앉아 붉은 음식을 먹으며 이마의 땀을 손으로 닦는다(얼굴 안 보임). 글자 없음. 따뜻한 조명.", videoStyle: "inside a restaurant a few young people seen from behind seated at a table eating red spicy food and wiping sweat from their foreheads, no text, warm lighting", videoStatics: "the table, the red dishes, and the restaurant walls" },
    E: { label: "창가에서 수첩에 적는 사람(5번)", image: "음식점 창가 자리에서 한 사람이 뒷모습으로 수첩에 무언가를 적고 있다(글자는 보이지 않음, 얼굴 안 보임). 바깥은 붉은 불빛. 낮은 조명.", videoStyle: "a person seen from behind at a restaurant window seat writing in a notebook with no readable text, red light outside, low lighting", videoStatics: "the window seat, the notebook, and the red glow outside" },
    F: { label: "매대에 올라오는 붉은 라면 봉지들(6번)", image: "편의점 매대 위에 불꽃 무늬만 있는 붉은 라면 봉지들(글자·로고 없음)이 막 올라와 줄지어 놓여 있다. 사람 없음. 밝은 조명.", videoStyle: "a store shelf with plain red noodle packets with only a flame pattern and no text or logos freshly lined up, no people, bright lighting", videoStatics: "the shelf, the lined-up packets, and the lighting" },
    G: { label: "한 입 먹고 물컵을 급히 잡는 손(7번)", image: "식탁 위 라면 그릇 앞에서 한 손이 젓가락을 내려놓고 다른 손이 물컵을 급히 움켜쥔다. 손과 그릇만 보임, 얼굴 없음. 따뜻한 조명.", videoStyle: "close view of a hand setting down chopsticks and another hand quickly grabbing a water glass beside a noodle bowl, hands and bowl only, no face, warm lighting", videoStatics: "the table, the bowl, and the lighting" },
    H: { label: "빈 소스 통과 닭 상자가 쌓인 창고(8번)", image: "창고 한쪽에 비어 있는 소스 통들과 닭 상자들이 쌓여 있고, 그 앞 선반은 비어 있다. 사람 없음. 낮은 조명. 글자 없음.", videoStyle: "a warehouse corner with stacked empty sauce tubs and chicken crates and an empty shelf in front, no people, low lighting, no text", videoStatics: "the stacked tubs, the crates, the empty shelf, and the lighting" },
    I: { label: "낮은 막대 하나가 선 막대그래프 모형(9번)", image: "책상 위에 낮은 막대 하나가 서 있는 막대그래프 모형. 글자·숫자 없음. 사람 없음. 부드러운 조명.", videoStyle: "close view of a bar chart model on a desk with one low bar, no text or numbers, no people, soft lighting", videoStatics: "the desk, the chart model, and the soft light" },
    J: { label: "다시 매대 앞에 선 사람들(10번)", image: "매대 앞에 한 번 사 간 적 있는 사람들이 다시 서서 붉은 봉지를 집으려는 작은 뒷모습들(얼굴 안 보임). 글자·로고 없음. 밝은 조명.", videoStyle: "people seen from behind standing again in front of a shelf reaching for red plain packets, no text or logos, bright lighting", videoStatics: "the shelf, the packets, and the lighting" },
    K: { label: "둘러앉아 나눠 먹는 사람들(11번)", image: "식탁에 둘러앉은 사람들이 뒷모습으로 매운 라면을 나눠 먹으며 서로 손짓으로 반응을 나눈다(얼굴 안 보임). 글자 없음. 따뜻한 조명.", videoStyle: "people seen from behind seated around a table sharing spicy noodles and gesturing to each other, no text, warm lighting", videoStatics: "the table, the bowls, and the warm light" },
    L: { label: "네 배 가까이 높아진 막대(12번)", image: "책상 위 막대그래프 모형에서 첫 막대보다 네 배 가까이 높은 막대가 서 있다. 글자·숫자 없음. 사람 없음. 밝은 조명.", videoStyle: "close view of a bar chart model on a desk with a bar almost four times taller than the first, no text or numbers, no people, bright lighting", videoStatics: "the desk, the chart model, and the bright light" },
    M: { label: "삼각대 카메라 앞의 붉은 라면 한 그릇(13번)", image: "책상 위 붉은 라면 한 그릇 앞에 삼각대에 꽂힌 카메라가 놓여 있고, 그 뒤에서 한 사람이 뒷모습으로 숨을 고른다(얼굴 안 보임). 글자 없음. 낮은 조명.", videoStyle: "a tripod camera in front of a bowl of red noodles on a desk with a person seen from behind taking a breath behind it, no text, low lighting", videoStatics: "the desk, the camera on the tripod, the bowl, and the lighting" },
    N: { label: "서로 다른 방에서 같은 도전을 하는 사람들(14번)", image: "서로 다른 방 세 곳이 나란히 보이고, 각 방 책상 위에 같은 붉은 라면 그릇과 카메라가 놓여 있다. 사람은 작은 뒷모습. 글자·로고 없음.", videoStyle: "three different rooms side by side each with the same red noodle bowl and a camera on the desk, small people seen from behind, no text or logos", videoStatics: "the three rooms, the desks, the bowls, and the cameras" },
    O: { label: "영상 조회가 쌓이는 모니터와 라면 한 그릇(15번)", image: "책상 위 모니터 화면에 막대가 쌓여 올라가는 모양만 보이고(글자·숫자 없음), 그 앞에 붉은 라면 한 그릇이 놓여 있다. 사람 없음. 낮은 조명.", videoStyle: "a desk with a monitor showing only rising stacked bars with no text or numbers and a bowl of red noodles in front, no people, low lighting", videoStatics: "the desk, the monitor, the bowl, and the lighting" },
    Q: { label: "맨 끝에서 크게 솟은 막대(16번)", image: "여러 칸의 막대가 이어지다 맨 끝에서 크게 솟은 막대그래프 모형. 글자·숫자 없음. 사람 없음. 환한 빛.", videoStyle: "close view of a bar chart model with several bars ending in one very tall bar at the far end, no text or numbers, no people, bright light", videoStatics: "the chart model, the desk, and the bright light" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep16_s1_hook_motion.mp4",
      narration: "라면 하나를 만들려고 1년 동안 매운 소스 2톤과 닭 1,200마리를 썼어. 막상 나오자 사람들은 '도저히 먹을 수 없다'고 했지.",
      imageBrief: "개발 주방 조리대 위에 붉은 소스가 가득 담긴 큰 통 두 개와 닭 상자 더미가 쌓여 있고, 그 앞에 아무도 손대지 않은 붉은 포장의 라면 한 봉지(불꽃 무늬만, 글자 없음)가 놓여 있다. 사람 없음. 따뜻하지만 무거운 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "A",
      lock: "no people appear; the packet keeps no text or logo; the tubs and crates stay fixed.",
      motion: motion("a thin steam drifts from the sauce tubs while the packet sits untouched, the counter and the crates stay completely still", "a big input, a cold reaction") },
    { scene: 2, key: "s2_why", role: "core_question", video: "story_ep16_s2_why_motion.mp4",
      narration: "삼양식품은 왜 그렇게까지 매운 라면에 1년을 걸었을까?",
      imageBrief: "주방 한가운데 붉은 소스가 보글보글 끓는 큰 솥과 그 앞의 비어 있는 조리대. 사람 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "B",
      lock: "no people appear; the pot keeps no text or logo; the counter stays empty and fixed.",
      motion: motion("the red sauce bubbles slowly and steam rises, the pot and the counter stay completely still", "why so much") },
    { scene: 3, key: "s3_myeongdong", role: "evidence", video: "story_ep16_s3_myeongdong_motion.mp4",
      narration: "시작은 한 임원이 명동의 매운 음식점에서 본 장면이었어.",
      imageBrief: "밤의 서울 명동 골목 한쪽, 붉은 불빛이 번지는 작은 음식점 입구(간판은 무늬만, 글자 없음). 길 위로 사람들의 작은 뒷모습 서넛이 지나간다. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "C",
      lock: "the people stay small and seen from behind with no face shown; no text or logos; the entrance stays the same.",
      motion: motion("a few passersby slow down at the red glow and walk on, the alley and the entrance stay completely still", "where it began") },
    { scene: 4, key: "s4_sweat", role: "evidence", video: "story_ep16_s4_sweat_motion.mp4",
      narration: "젊은 사람들이 땀을 뻘뻘 흘리면서도 '스트레스가 풀린다'며 맛있게 먹고 있었지.",
      imageBrief: "음식점 안 식탁에 젊은 사람 서너 명이 뒷모습으로 앉아 붉은 음식을 먹으며 이마의 땀을 손으로 닦는다(얼굴 안 보임). 글자 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "D",
      lock: "the people stay seen from behind with no face ever shown; the dishes keep no text; nobody else enters.",
      motion: motion("one person wipes their forehead and reaches for another bite, the table and the dishes stay completely still", "sweating yet smiling") },
    { scene: 5, key: "s5_decide", role: "evidence", video: "story_ep16_s5_decide_motion.mp4",
      narration: "그 임원은 그 맛을 라면에 담아 보기로 했어.",
      imageBrief: "음식점 창가 자리에서 한 사람이 뒷모습으로 수첩에 무언가를 적고 있다(글자는 보이지 않음, 얼굴 안 보임). 바깥은 붉은 불빛. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "E",
      lock: "the people stay seen from behind with no face ever shown; the notebook keeps no readable text; nobody else enters.",
      motion: motion("the person writes a few strokes then stops and looks outside, the window and the table stay completely still", "an idea forming") },
    { scene: 6, key: "s6_launch", role: "evidence", video: "story_ep16_s6_launch_motion.mp4",
      narration: "2012년 4월, 불닭볶음면이 나왔어.",
      imageBrief: "편의점 매대 위에 불꽃 무늬만 있는 붉은 라면 봉지들(글자·로고 없음)이 막 올라와 줄지어 놓여 있다. 사람 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "F",
      lock: "no people appear; the packets keep no text or logos; the shelf stays fixed.",
      motion: motion("a soft glint of light sweeps over the lined packets once, the shelf and the packets stay completely still", "launch day") },
    { scene: 7, key: "s7_unfit", role: "evidence", video: "story_ep16_s7_unfit_motion.mp4",
      narration: "그런데 처음 돌아온 평가는 '너무 매워서 도저히 사람이 먹을 수 없다'였어.",
      imageBrief: "식탁 위 라면 그릇 앞에서 한 손이 젓가락을 내려놓고 다른 손이 물컵을 급히 움켜쥔다. 손과 그릇만 보임, 얼굴 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "G",
      lock: "no face or body appears — only the hands; the bowl and glass keep no text or logos; the table stays fixed.",
      motion: motion("the hand grips the glass and lifts it quickly, the table and the bowl stay completely still", "too spicy") },
    { scene: 8, key: "s8_cost", role: "evidence", video: "story_ep16_s8_cost_motion.mp4",
      narration: "개발에 1년을 쓴 라면이었어. 팔리기 전까지는 들어간 돈만 있는 상태였지.",
      imageBrief: "창고 한쪽에 비어 있는 소스 통들과 닭 상자들이 쌓여 있고, 그 앞 선반은 비어 있다. 사람 없음. 낮은 조명. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "H",
      lock: "no people appear; the tubs and crates keep no text or logos; the shelf stays empty.",
      motion: motion("dust drifts slowly through a shaft of light, the tubs and the shelf stay completely still", "cost before sales") },
    { scene: 9, key: "s9_first", role: "evidence", video: "story_ep16_s9_first_motion.mp4",
      narration: "출시 초기 한 달 매출은 7억 원쯤이었어.",
      imageBrief: "책상 위에 낮은 막대 하나가 서 있는 막대그래프 모형. 글자·숫자 없음. 사람 없음. 부드러운 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "I",
      lock: "no people appear; the chart keeps no text or numbers; the desk stays fixed.",
      motion: motion("a soft light slides over the low bar once, the desk and the chart stay completely still", "a small start") },
    { scene: 10, key: "s10_whyagain", role: "core_question", video: "story_ep16_s10_whyagain_motion.mp4",
      narration: "먹을 수 없다던 라면을, 사람들은 왜 계속 찾았을까?",
      imageBrief: "매대 앞에 한 번 사 간 적 있는 사람들이 다시 서서 붉은 봉지를 집으려는 작은 뒷모습들(얼굴 안 보임). 글자·로고 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "J",
      lock: "the people stay seen from behind with no face ever shown; the packets keep no text or logos; nobody else enters.",
      motion: motion("one person picks up a packet and holds it with both hands, the shelf and the packets stay completely still", "back for more") },
    { scene: 11, key: "s11_addict", role: "evidence", video: "story_ep16_s11_addict_motion.mp4",
      narration: "먹은 사람들 사이에서 이 맛은 '중독성 강한 매운맛'으로 불리기 시작했어.",
      imageBrief: "식탁에 둘러앉은 사람들이 뒷모습으로 매운 라면을 나눠 먹으며 서로 손짓으로 반응을 나눈다(얼굴 안 보임). 글자 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "K",
      lock: "the people stay seen from behind with no face ever shown; the bowls keep no text or logos; nobody else enters.",
      motion: motion("two people laugh and fan their mouths with their hands, the table and the bowls stay completely still", "addictive heat") },
    { scene: 12, key: "s12_month30", role: "evidence", video: "story_ep16_s12_month30_motion.mp4",
      narration: "출시 1년이 지나자 한 달 매출은 30억 원쯤까지 올랐어.",
      imageBrief: "책상 위 막대그래프 모형에서 첫 막대보다 네 배 가까이 높은 막대가 서 있다. 글자·숫자 없음. 사람 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no people appear; the chart keeps no text or numbers; the desk stays fixed.",
      motion: motion("a soft glow travels up the tall bar and fades, the desk and the chart stay completely still", "four times higher") },
    { scene: 13, key: "s13_uk", role: "evidence", video: "story_ep16_s13_uk_motion.mp4",
      narration: "그러다 영국의 한 유튜버가 이 라면을 먹는 도전 영상을 올렸어.",
      imageBrief: "책상 위 붉은 라면 한 그릇 앞에 삼각대에 꽂힌 카메라가 놓여 있고, 그 뒤에서 한 사람이 뒷모습으로 숨을 고른다(얼굴 안 보임). 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "M",
      lock: "the people stay seen from behind with no face ever shown; the camera and bowl keep no text or logos; nobody else enters.",
      motion: motion("the person exhales and lifts the chopsticks slowly, the desk and the camera stay completely still", "about to try") },
    { scene: 14, key: "s14_follow", role: "evidence", video: "story_ep16_s14_follow_motion.mp4",
      narration: "매운맛에 힘들어하는 모습이 호기심을 불러일으켰고, 세계 곳곳의 유튜버들이 같은 도전을 따라 했지.",
      imageBrief: "서로 다른 방 세 곳이 나란히 보이고, 각 방 책상 위에 같은 붉은 라면 그릇과 카메라가 놓여 있다. 사람은 작은 뒷모습. 글자·로고 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "N",
      lock: "the people stay small and seen from behind with no face shown; no text or logos; the three rooms stay fixed.",
      motion: motion("each person in turn lifts the chopsticks and winces slightly, the rooms and the desks stay completely still", "a challenge spreading") },
    { scene: 15, key: "s15_video", role: "evidence", video: "story_ep16_s15_video_motion.mp4",
      narration: "이 라면을 세계에 알린 건 먹는 사람들이 올린 영상이었어.",
      imageBrief: "책상 위 모니터 화면에 막대가 쌓여 올라가는 모양만 보이고(글자·숫자 없음), 그 앞에 붉은 라면 한 그릇이 놓여 있다. 사람 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "O",
      lock: "no people appear; the monitor keeps no text or numbers; the desk stays fixed.",
      motion: motion("the stacked bars on the monitor rise slowly and the glow brightens, the desk and the bowl stay completely still", "the world watching") },
    { scene: 16, key: "s16_y2016", role: "evidence", video: "story_ep16_s16_y2016_motion.mp4",
      narration: "2016년, 불닭 브랜드 매출은 1,000억 원을 넘었어.",
      imageBrief: "여러 칸의 막대가 이어지다 맨 끝에서 크게 솟은 막대그래프 모형. 글자·숫자 없음. 사람 없음. 환한 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "Q",
      lock: "no people appear; the chart keeps no text or numbers; the desk stays fixed.",
      motion: motion("a gentle glow travels once along the bars to the tallest one and fades, the desk and the chart stay completely still", "over a thousand") },
  ]),
});

// ── 17번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP16_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 16,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep16",
  sceneBackgrounds: Object.freeze({
    P: { label: "식품 매대 앞마당(17번 부엉박사)", image: "밝은 오후 한국 대형마트 식품 코너 앞. 부엉박사 뒤로 글자 없는 붉은 포장 라면이 높이 쌓인 매대와 바닥에 놓인 흰 상자 두 개(글자 없음). 바닥은 매끈한 연한 회색, 따뜻한 오후 빛.", videoStyle: "a bright afternoon in front of a Korean supermarket food aisle with a display of plain red noodle packets stacked high and two plain white boxes on the ground, smooth light gray floor", videoStatics: "the stacked display, the two white boxes, the smooth light gray floor, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 17, key: "s17_close", role: "save", video: "story_ep16_s17_close_motion.mp4",
      narration: "못 먹겠다던 맛이 다시 먹어 보고 싶은 맛이 됐어. 힘들다는 말이 곧 이 라면의 이야깃거리가 된 거야. 불닭볶음면의 다음 이야기가 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the display and the boxes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep16-assembly-spec.mjs --spec-export STORY_EP16_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep16-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep16-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep16-tts/story-ep16-tts-script.json --out-dir C:/tmp/story-ep16-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP16_FULL_SPEC = Object.freeze({
  ...STORY_EP16_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP16_SEMI_SPEC.sceneBackgrounds, ...STORY_EP16_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP16_SEMI_SPEC.scenes, ...STORY_EP16_END_SPEC.scenes]),
});

export const STORY_EP16_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP16_FULL_SPEC,
  headerTitle: Object.freeze(["못 먹겠다던","라면이 매출","1,000억 돌파"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["불닭볶음면","매운","1년","매출","유튜버","1,000억"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP16_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});

