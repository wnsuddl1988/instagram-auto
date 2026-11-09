/**
 * 스토리형 20편 — 대왕카스테라 — 닮은 가게 400곳이 방송 한 편에 같이 흔들린 일 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep20-castella/scenes-v1.json`. 설계 `C:/tmp/story-ep20-castella/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep20-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~14번 재연 장면 + 15번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~14번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep20-assembly-spec.mjs --scene-spec-export STORY_EP20_SEMI_SPEC --out-dir C:/tmp/story-ep20-images`
 *            ② 15번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep20-assembly-spec.mjs --scene-spec-export STORY_EP20_END_SPEC --out-dir C:/tmp/story-ep20-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP20_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 20,
  displayEpisode: 20,
  sourceCandidate: "story-ep20-castella-2017",
  title: "대왕카스테라 — 닮은 가게 400곳이 방송 한 편에 같이 흔들린 일",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep20",
  storyStyleOnlyIdentity:
    "2017년 한국 번화가 골목의 카스테라 가게들과 가정집 거실을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(점주·방송 관계자)을 닮게 그리지 않고, 실제 방송사·가게 로고와 색을 흉내 내지 않아(간판은 글자 없는 무늬 틀). 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "비슷한 간판 틀의 카스테라 가게들이 이어진 골목(1번)", image: "번화가 골목에 글자 없는 비슷한 간판 틀을 단 노란 카스테라 가게들이 줄줄이 이어져 있다. 가게 앞에는 사람들의 작은 뒷모습. 낮의 햇살.", videoStyle: "a busy street alley with yellow castella shops in a row each with a similar signboard frame holding no text, small people seen from behind in front of them, daylight", videoStatics: "the alley, the row of shops, and the signboard frames" },
    B: { label: "텔레비전 불빛이 번지는 거실과 가게 풍경(2번)", image: "저녁 거실에서 사람 서넛이 뒷모습으로 텔레비전을 본다. 화면은 노란 빵 모양만 번지는 불빛으로 보인다(얼굴 안 보임). 글자 없음.", videoStyle: "an evening living room with a few people seen from behind watching a television whose screen only shows a glow with a yellow cake shape, no text", videoStatics: "the living room, the television, and the lighting" },
    C: { label: "큼직한 카스테라를 든 사람들이 선 줄(3번)", image: "가게 앞에 사람들이 줄을 서서 큼직한 노란 카스테라를 두 손으로 감싸 쥐고 있다(뒷모습, 얼굴 안 보임). 글자 없음. 밝은 조명.", videoStyle: "people seen from behind in a queue in front of a shop each holding a large yellow castella cupped in both hands, no text, bright lighting", videoStatics: "the shop front, the queue, and the lighting" },
    D: { label: "한 거리에 나란히 선 비슷한 간판 가게 네댓 곳(4번)", image: "한 거리에 비슷한 노란 간판 틀을 단 카스테라 가게 네댓 곳이 나란히 서 있다. 글자·로고 없음. 사람 없음. 낮의 햇살.", videoStyle: "four or five yellow castella shops with similar signboard frames standing side by side on one street, no text or logos, no people, daylight", videoStatics: "the street, the shops, and the signboard frames" },
    E: { label: "상표 출원 서류 더미가 쌓인 책상(5번)", image: "책상 위에 글자 없는 서류 더미가 높이 쌓여 있고 그 옆에 도장 하나가 놓여 있다. 사람 없음. 낮은 조명.", videoStyle: "a desk with a tall stack of plain papers with no text and a stamp beside it, no people, low lighting", videoStatics: "the desk, the paper stack, the stamp, and the lighting" },
    F: { label: "카스테라 반죽 장면만 나오는 텔레비전 화면(6번)", image: "저녁 거실 텔레비전 화면에 반죽을 젓는 장면만 나오고 소파의 사람들이 뒷모습으로 지켜본다(얼굴 안 보임). 글자 없음.", videoStyle: "an evening living room television showing only a batter-stirring scene with people on the sofa seen from behind watching, no text", videoStatics: "the sofa, the television, and the living room walls" },
    G: { label: "큰 반죽 통에 기름 병을 기울이는 손(7번)", image: "큰 반죽 통 위에서 한 손이 투명한 기름 병을 기울여 붓고 있고 옆에 작은 첨가물 봉지가 놓여 있다(글자 없음). 손만 보임.", videoStyle: "close view of a hand tilting a clear oil bottle over a large batter bowl with a small additive packet beside it with no text, hand only", videoStatics: "the bowl, the packet, and the lighting" },
    H: { label: "방송 화면을 바라보는 가게 주인(8번)", image: "작은 카스테라 가게 안에서 주인이 뒷모습으로 작은 텔레비전을 바라본다(얼굴 안 보임). 진열대에는 노란 카스테라. 글자 없음.", videoStyle: "a shop owner seen from behind in a small castella shop looking at a small television with yellow castellas on the display, no text", videoStatics: "the shop interior, the display, and the television" },
    I: { label: "열 개 한 판 카스테라 틀과 기름 병 하나(9번)", image: "작업대 위에 열 개 한 판의 카스테라 틀이 놓여 있고 그 옆에 투명한 기름 병 하나가 놓여 있다. 글자·숫자 없음. 사람 없음.", videoStyle: "a workbench with a ten-cell castella tray and one clear oil bottle beside it, no text or numbers, no people", videoStatics: "the workbench, the tray, the bottle, and the lighting" },
    J: { label: "서면 입장문을 읽는 사람들과 맞은편 서류(10번)", image: "회의 테이블에 서류를 읽는 사람 서넛이 뒷모습으로 앉아 있고 맞은편에 다른 서류 묶음이 놓여 있다(얼굴 안 보임). 글자 없음.", videoStyle: "a meeting table with a few people seen from behind reading papers and another bundle of papers placed opposite, no text", videoStatics: "the table, the paper bundles, and the lighting" },
    K: { label: "손님이 없는 가게 앞 줄과 텅 빈 진열대(11번)", image: "카스테라 가게 앞에 줄이 사라지고 진열대가 반쯤 비어 있다. 사람 없음. 글자 없음. 한낮의 조명.", videoStyle: "a castella shop with the queue gone and the display half empty, no people, no text, midday lighting", videoStatics: "the shop front, the display, and the lighting" },
    L: { label: "줄어드는 막대그래프 모형과 한가한 계산대(12번)", image: "계산대 옆 책상 위에 높던 막대가 줄어든 막대그래프 모형과 한가한 계산대. 글자·숫자 없음. 사람 없음.", videoStyle: "a desk beside a checkout counter with a bar chart model whose tall bars have shrunk and an idle counter, no text or numbers, no people", videoStatics: "the desk, the chart model, the counter, and the lighting" },
    M: { label: "셔터가 내려간 가게와 한가한 옆 가게들(13번)", image: "번화가 골목의 카스테라 가게 하나는 셔터가 내려가 있고 옆 가게들은 손님 없이 한가하다. 글자·로고 없음. 사람 없음.", videoStyle: "a busy alley with one castella shop's shutter down and the neighboring shops idle without customers, no text or logos, no people", videoStatics: "the alley, the shuttered shop, and the idle shops" },
    N: { label: "비슷한 간판이 빽빽한 거리 모형과 작은 불씨(14번)", image: "책상 위 거리 모형에 비슷한 모양의 작은 가게 모형들이 빽빽이 서 있고, 한쪽 끝에 작은 불씨 하나가 반짝인다. 글자 없음. 사람 없음.", videoStyle: "a desk street model packed with small lookalike shop models and a tiny spark glowing at one end, no text, no people", videoStatics: "the desk, the street model, and the lighting" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep20_s1_hook_motion.mp4",
      narration: "이름만 조금씩 다른 카스테라 가게가 전국에 400곳 넘게 있었는데, 방송 한 편에 한꺼번에 흔들렸어.",
      imageBrief: "번화가 골목에 글자 없는 비슷한 간판 틀을 단 노란 카스테라 가게들이 줄줄이 이어져 있다. 가게 앞에는 사람들의 작은 뒷모습. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "A",
      lock: "the people stay small and seen from behind with no face shown; no text or logos; the shops stay fixed.",
      motion: motion("a few passersby stop in front of the shops and walk on, the alley and the shops stay completely still", "a street of lookalikes") },
    { scene: 2, key: "s2_how", role: "core_question", video: "story_ep20_s2_how_motion.mp4",
      narration: "방송 한 편이 어떻게 400곳을 한꺼번에 흔들었을까?",
      imageBrief: "저녁 거실에서 사람 서넛이 뒷모습으로 텔레비전을 본다. 화면은 노란 빵 모양만 번지는 불빛으로 보인다(얼굴 안 보임). 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "B",
      lock: "the people stay seen from behind with no face ever shown; the screen keeps no text or logos; nobody else enters.",
      motion: motion("the family leans slightly forward as the glow flickers, the room and the television stay completely still", "one broadcast") },
    { scene: 3, key: "s3_boom", role: "evidence", video: "story_ep20_s3_boom_motion.mp4",
      narration: "대만에서 온 큼직한 카스테라가 큰 인기를 끌었어.",
      imageBrief: "가게 앞에 사람들이 줄을 서서 큼직한 노란 카스테라를 두 손으로 감싸 쥐고 있다(뒷모습, 얼굴 안 보임). 글자 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "C",
      lock: "the people stay seen from behind with no face ever shown; the castellas keep no text or logos; nobody else enters.",
      motion: motion("one person lifts the castella slightly and the queue shuffles forward, the shop and the queue stay completely still", "a hit") },
    { scene: 4, key: "s4_spread", role: "evidence", video: "story_ep20_s4_spread_motion.mp4",
      narration: "인기가 오르자 비슷한 이름의 가게가 빠르게 늘었어.",
      imageBrief: "한 거리에 비슷한 노란 간판 틀을 단 카스테라 가게 네댓 곳이 나란히 서 있다. 글자·로고 없음. 사람 없음. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "D",
      lock: "no people appear; the signs keep no text or logos; the shops stay fixed.",
      motion: motion("a soft glint of sunlight sweeps along the signboard frames once, the street and the shops stay completely still", "so many alike") },
    { scene: 5, key: "s5_marks", role: "evidence", video: "story_ep20_s5_marks_motion.mp4",
      narration: "비슷한 이름으로 상표를 낸 곳만 30곳이 넘었지.",
      imageBrief: "책상 위에 글자 없는 서류 더미가 높이 쌓여 있고 그 옆에 도장 하나가 놓여 있다. 사람 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "E",
      lock: "no people appear; the papers keep no text or numbers; the desk stays fixed.",
      motion: motion("a soft light slides over the paper stack once, the desk and the stack stay completely still", "so many names") },
    { scene: 6, key: "s6_broadcast", role: "evidence", video: "story_ep20_s6_broadcast_motion.mp4",
      narration: "그러던 2017년 3월 12일, 한 종합편성채널의 먹거리 프로그램이 이 카스테라를 다뤘어.",
      imageBrief: "저녁 거실 텔레비전 화면에 반죽을 젓는 장면만 나오고 소파의 사람들이 뒷모습으로 지켜본다(얼굴 안 보임). 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "F",
      lock: "the people stay seen from behind with no face ever shown; the screen keeps no text or logos; nobody else enters.",
      motion: motion("the viewers stay still as the batter swirls on the screen, the sofa and the room stay completely still", "the report") },
    { scene: 7, key: "s7_point", role: "evidence", video: "story_ep20_s7_point_motion.mp4",
      narration: "반죽에 식용유를 700ml씩 붓는다고 지적했고, 합성 첨가물도 문제 삼았지.",
      imageBrief: "큰 반죽 통 위에서 한 손이 투명한 기름 병을 기울여 붓고 있고 옆에 작은 첨가물 봉지가 놓여 있다(글자 없음). 손만 보임. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "G",
      lock: "no face or body appears — only the hand; the bottle and packet keep no text or logos; the bowl stays fixed.",
      motion: motion("the oil pours in a thin stream and the hand withdraws, the bowl and the packet stay completely still", "the accusation") },
    { scene: 8, key: "s8_askbiz", role: "core_question", video: "story_ep20_s8_askbiz_motion.mp4",
      narration: "방송에 나온 업체는 가만히 있었을까?",
      imageBrief: "작은 카스테라 가게 안에서 주인이 뒷모습으로 작은 텔레비전을 바라본다(얼굴 안 보임). 진열대에는 노란 카스테라. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "H",
      lock: "the people stay seen from behind with no face ever shown; the television and display keep no text or logos; nobody else enters.",
      motion: motion("the owner slowly crosses their arms and stays facing the screen, the shop and the display stay completely still", "will they answer") },
    { scene: 9, key: "s9_answer", role: "evidence", video: "story_ep20_s9_answer_motion.mp4",
      narration: "아니었어. 한 판에 식용유 700ml, 한 개로 치면 70ml쯤이라며 많은 양이 아니라고 맞섰지.",
      imageBrief: "작업대 위에 열 개 한 판의 카스테라 틀이 놓여 있고 그 옆에 투명한 기름 병 하나가 놓여 있다. 글자·숫자 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "I",
      lock: "no people appear; the tray and bottle keep no text or numbers; the bench stays fixed.",
      motion: motion("a soft light moves across the ten cells once, the bench and the tray stay completely still", "a smaller share each") },
    { scene: 10, key: "s10_crew", role: "evidence", video: "story_ep20_s10_crew_motion.mp4",
      narration: "제작진도 점주들의 주장 가운데 사실과 다른 부분이 있다며 입장을 냈어.",
      imageBrief: "회의 테이블에 서류를 읽는 사람 서넛이 뒷모습으로 앉아 있고 맞은편에 다른 서류 묶음이 놓여 있다(얼굴 안 보임). 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "J",
      lock: "the people stay seen from behind with no face ever shown; the papers keep no text or numbers; nobody else enters.",
      motion: motion("one person turns a page while the opposite bundle stays untouched, the table and the bundles stay completely still", "two sides") },
    { scene: 11, key: "s11_customers", role: "core_question", video: "story_ep20_s11_customers_motion.mp4",
      narration: "그 사이 손님은 어디로 갔을까?",
      imageBrief: "카스테라 가게 앞에 줄이 사라지고 진열대가 반쯤 비어 있다. 사람 없음. 글자 없음. 한낮의 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "K",
      lock: "no people appear; the shop keeps no text or logos; the display stays fixed.",
      motion: motion("a leaf drifts across the empty queue spot, the shop and the display stay completely still", "where did they go") },
    { scene: 12, key: "s12_drop", role: "evidence", video: "story_ep20_s12_drop_motion.mp4",
      narration: "그런데 누구 말이 맞는지를 가리는 동안에도, 가게들의 매출은 급격히 줄었어.",
      imageBrief: "계산대 옆 책상 위에 높던 막대가 줄어든 막대그래프 모형과 한가한 계산대. 글자·숫자 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no people appear; the chart keeps no text or numbers; the desk stays fixed.",
      motion: motion("a soft light dims slowly over the shrunken bars, the desk and the counter stay completely still", "sales fell") },
    { scene: 13, key: "s13_shut", role: "evidence", video: "story_ep20_s13_shut_motion.mp4",
      narration: "일부 가게는 문을 닫았고, 방송에 나온 곳만이 아니라 대왕카스테라 가게 전반의 매출이 같이 줄었지.",
      imageBrief: "번화가 골목의 카스테라 가게 하나는 셔터가 내려가 있고 옆 가게들은 손님 없이 한가하다. 글자·로고 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "M",
      lock: "no people appear; the signs keep no text or logos; the alley stays fixed.",
      motion: motion("a soft shadow lengthens along the alley once, the shops and the shutter stay completely still", "some closed") },
    { scene: 14, key: "s14_analysis", role: "evidence", video: "story_ep20_s14_analysis_motion.mp4",
      narration: "여러 분석은 방송이 계기였을 뿐, 같은 가게가 너무 빨리 늘어난 뒤였다고 짚었어.",
      imageBrief: "책상 위 거리 모형에 비슷한 모양의 작은 가게 모형들이 빽빽이 서 있고, 한쪽 끝에 작은 불씨 하나가 반짝인다. 글자 없음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "N",
      lock: "no people appear; the models keep no text or logos; the desk stays fixed.",
      motion: motion("the spark glows brighter and a faint glow passes along the shop models, the desk and the model stay completely still", "a small spark") },
  ]),
});

// ── 15번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP20_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 20,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep20",
  sceneBackgrounds: Object.freeze({
    P: { label: "번화가 카스테라 거리 앞(15번 부엉박사)", image: "밝은 오후 한국 번화가 골목 입구. 부엉박사 뒤로 비슷한 간판 틀을 단 글자 없는 가게 외벽 둘과 바닥에 놓인 노란 상자 두 개(글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 빛.", videoStyle: "bright afternoon at the entrance of a busy Korean shopping alley with two plain shop facades with similar signboard frames holding no text and two plain yellow boxes on the ground, smooth light gray pavement", videoStatics: "the two facades, the two yellow boxes, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 15, key: "s15_finish", role: "save", video: "story_ep20_s15_finish_motion.mp4",
      narration: "이름과 빵이 닮은 가게들은 손님도 같이 나눴지만, 한 곳의 소문도 같이 나눴어. 닮은 가게가 너무 빨리 많아진 곳에서는 작은 계기도 크게 번졌지. 이런 가게 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the facades and the boxes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep20-assembly-spec.mjs --spec-export STORY_EP20_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep20-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep20-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep20-tts/story-ep20-tts-script.json --out-dir C:/tmp/story-ep20-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP20_FULL_SPEC = Object.freeze({
  ...STORY_EP20_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP20_SEMI_SPEC.sceneBackgrounds, ...STORY_EP20_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP20_SEMI_SPEC.scenes, ...STORY_EP20_END_SPEC.scenes]),
});

export const STORY_EP20_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP20_FULL_SPEC,
  headerTitle: Object.freeze(["닮은 가게 400곳이","방송 한 편에","같이 흔들린 일"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["카스테라","400곳","방송","700ml","매출","이름"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP20_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
