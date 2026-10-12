/**
 * 스토리형 15편 — 한진해운 — 배는 멈추고 140억 달러어치 짐이 묶인 일 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep15-hanjin/scenes-v8.json`. 설계 `C:/tmp/story-ep15-hanjin/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep15-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep15-assembly-spec.mjs --scene-spec-export STORY_EP15_SEMI_SPEC --out-dir C:/tmp/story-ep15-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep15-assembly-spec.mjs --scene-spec-export STORY_EP15_END_SPEC --out-dir C:/tmp/story-ep15-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP15_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 15,
  displayEpisode: 15,
  sourceCandidate: "story-ep15-hanjin-shipping-2016",
  title: "한진해운 — 배는 멈추고 140억 달러어치 짐이 묶인 일",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep15",
  storyStyleOnlyIdentity:
    "2016년 한국 컨테이너 항만·해운 회사·법원을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 회사 로고·선박 이름·인물을 그리지 않고, 컨테이너와 배에는 글자·번호·로고가 없어. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "항구 바깥에 멈춘 배들(1번)", image: "항구 바깥 바다 위에 컨테이너를 가득 실은 큰 배 서너 척이 나란히 멈춰 서 있는 넓은 전경. 사람 없음. 컨테이너와 선체에 글자·번호·로고 없음. 흐린 아침 빛.", videoStyle: "a wide view of three or four large container ships stopped side by side on the sea outside a port, no people, no text, numbers or logos on the containers or hulls, overcast morning light", videoStatics: "the ships, the containers, the sea, and the port in the distance" },
    B: { label: "컨테이너선을 올려다보는 부두(2번)", image: "부두에서 컨테이너를 가득 실은 거대한 컨테이너선 한 척의 선체를 올려다보는 구도. 사람 없음. 선체에 글자·로고 없음. 낮의 햇살.", videoStyle: "a low angle from a quay looking up at the hull of a huge container ship loaded with containers, no people, no text or logos on the hull, daylight", videoStatics: "the ship hull, the containers, and the quay" },
    C: { label: "수출 화물 상자가 쌓인 부두와 사람(3번)", image: "부두에 글자 없는 수출 화물 상자들이 가득 쌓여 있고, 한 사람이 뒷모습으로 서서 바다 쪽 먼 배를 바라본다(얼굴 안 보임). 흐린 빛.", videoStyle: "a quay full of stacked plain export cargo boxes with no text and one person seen from behind looking out toward a distant ship on the sea, overcast light", videoStatics: "the stacked boxes, the quay, and the distant ship" },
    D: { label: "모두 손을 드는 회의 탁자(4번)", image: "회의실의 긴 탁자에 둘러앉은 정장 차림 사람들이 뒷모습으로 모두 손을 들고 있다(얼굴 안 보임). 탁자 위에 글자 없는 서류. 차가운 형광등.", videoStyle: "a meeting room with people in suits seated around a long table seen from behind all raising their hands, plain documents on the table, cold fluorescent light", videoStatics: "the long table, the documents, and the meeting room walls" },
    E: { label: "서류가 놓인 정박한 컨테이너선(5번)", image: "항구에 정박한 컨테이너선 한 척의 갑판 난간 위에 아무것도 인쇄되지 않은 순백의 빈 종이 한 장이 놓여 있다(글자·줄·도장·도형·무늬 없는 완전히 하얀 종이, 인쇄된 문서처럼 그리지 마). 사람 없음. 선체·컨테이너에 글자·로고 없음. 낮의 빛.", videoStyle: "a plain court document lying on the deck railing of a container ship moored at a port, no people, no text or logos on the hull or containers, daylight", videoStatics: "the ship deck railing, the document, the containers, and the port" },
    F: { label: "입항을 못 하고 멈춘 배들(6번)", image: "항구 입구 바깥에서 입항하지 못하고 줄지어 멈춰 선 컨테이너선들과 항구 쪽의 닫힌 부두 게이트. 사람 없음. 글자·로고 없음. 흐린 빛.", videoStyle: "container ships lined up and stopped outside a port entrance unable to enter and the closed quay gate on the port side, no people, no text or logos, overcast light", videoStatics: "the stopped ships, the closed quay gate, and the sea" },
    G: { label: "바다 위 점으로 흩어진 배 모형 지도(7번)", image: "책상 위 바다 지도 모형에 작은 배 모양 조각 몇 개가 점처럼 흩어져 놓여 있다. 글자·지명·숫자 없음. 사람 없음. 차가운 조명.", videoStyle: "close view of a sea chart model on a desk with a few small ship-shaped pieces scattered like dots, no text, place names or numbers, no people, cold light", videoStatics: "the desk, the sea chart model, and the cold light" },
    H: { label: "늘어나는 배 조각(8번)", image: "책상 위 바다 지도 모형에 작은 배 모양 조각이 전보다 훨씬 많이 빽빽하게 놓여 있다. 글자·숫자 없음. 사람 없음. 차가운 조명.", videoStyle: "close view of a sea chart model on a desk now with many more small ship-shaped pieces densely placed than before, no text or numbers, no people, cold light", videoStatics: "the desk, the sea chart model, and the cold light" },
    I: { label: "컨테이너가 층층이 쌓인 배 위(9번)", image: "컨테이너가 층층이 높이 쌓인 배 위 갑판과 아무것도 인쇄되지 않은 순백의 빈 종이 묶음 한 더미가 보이는 구도(종이에 글자·줄·도장·도형·무늬 없음, 인쇄된 서류처럼 그리지 마). 사람 없음. 컨테이너에 글자·번호 없음. 흐린 빛.", videoStyle: "a deck with containers stacked in many tall layers and a bundle of plain shipping documents visible, no people, no text or numbers on the containers or documents, overcast light", videoStatics: "the stacked containers, the documents, and the deck" },
    J: { label: "서류가 쌓인 접수 창구(10번)", image: "신고센터 접수 창구 책상에 글자 없는 서류가 높이 쌓여 있고 접수 도장이 옆에 놓여 있다. 사람 없음. 형광등.", videoStyle: "a reporting center reception desk with a tall pile of plain documents with no text and a stamp beside it, no people, fluorescent light", videoStatics: "the reception desk, the document pile, the stamp, and the fluorescent light" },
    K: { label: "계약서가 붙은 컨테이너 더미(11번)", image: "컨테이너 옆면마다 글자 없는 흰 계약서 한 장씩이 붙어 있는 듯한 근접 장면. 사람 없음. 낮의 빛.", videoStyle: "close view of containers each with a plain white contract sheet with no text attached to its side, no people, daylight", videoStatics: "the container sides, the white sheets, and the daylight" },
    L: { label: "마지막 컨테이너를 내리는 크레인(12번)", image: "부두의 대형 크레인이 마지막 컨테이너 하나를 천천히 내려 놓는 넓은 전경. 사람 없음. 글자·번호 없음. 저녁 노을.", videoStyle: "a wide quay view of a large crane slowly lowering the last container onto the ground, no people, no text or numbers, evening glow", videoStatics: "the crane, the quay, and the evening sky" },
    M: { label: "불이 꺼지는 사무실 복도(13번)", image: "문 닫힌 사무실 복도에서 천장 조명이 하나씩 꺼지는 장면. 사람 없음. 글자·명패 없음. 어두워지는 빛.", videoStyle: "an office corridor with closed doors where the ceiling lights go out one by one, no people, no text or nameplates, fading light", videoStatics: "the corridor, the closed doors, and the ceiling" },
    N: { label: "한쪽이 더 낮게 기우는 두 저울(14번)", image: "탁자 위 두 저울. 한쪽 저울의 접시가 다른 쪽보다 눈에 띄게 낮게 기울어 있다. 접시 위에 글자 없는 서류 묶음. 사람 없음.", videoStyle: "two scales on a table with one scale's plate tilted noticeably lower than the other and plain bundles of documents on the plates, no people", videoStatics: "the table, the two scale frames, and the documents" },
    O: { label: "법원 앞 계단의 사람(15번)", image: "법원 건물 앞 넓은 계단 위에서 한 사람이 서류를 든 채 뒷모습으로 서서 계단을 내려다본다(얼굴 안 보임). 건물에 글자 없음. 흐린 빛.", videoStyle: "on the wide steps in front of a courthouse a person holding documents seen from behind looking down the steps, no text on the building, overcast light", videoStatics: "the courthouse steps, the building, and the overcast sky" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep15_s1_hook_motion.mp4",
      narration: "배는 가라앉지 않았는데, 140억 달러어치 짐이 바다 위에 묶인 일이 있었어. 짐 주인은 한국 수출 기업들이었지.",
      imageBrief: "항구 바깥 바다 위에 컨테이너를 가득 실은 큰 배 서너 척이 나란히 멈춰 서 있는 넓은 전경. 사람 없음. 컨테이너와 선체에 글자·번호·로고 없음. 흐린 아침 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "A",
      lock: "no people appear; no text, numbers or logos on the ships or containers; the arrangement of the ships stays the same.",
      motion: motion("a faint swell moves the water and a gull crosses far away, the ships and the containers stay completely still", "ships stuck at sea") },
    { scene: 2, key: "s2_company", role: "evidence", video: "story_ep15_s2_company_motion.mp4",
      narration: "세계 7위 선대를 가진 한진해운이 멈춘 뒤의 일이야.",
      imageBrief: "부두에서 컨테이너를 가득 실은 거대한 컨테이너선 한 척의 선체를 올려다보는 구도. 사람 없음. 선체에 글자·로고 없음. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "B",
      lock: "no people appear; no text, numbers or logos on the hull; the framing stays fixed.",
      motion: motion("sunlight glints along the hull and a gantry crane arm moves slowly in the background, the ship and the quay stay completely still", "a giant ship") },
    { scene: 3, key: "s3_why_question", role: "core_question", video: "story_ep15_s3_why_question_motion.mp4",
      narration: "매출 8조 원짜리 회사 하나가 멈췄을 뿐인데, 왜 바다 위의 짐까지 묶였을까?",
      imageBrief: "부두에 글자 없는 수출 화물 상자들이 가득 쌓여 있고, 한 사람이 뒷모습으로 서서 바다 쪽 먼 배를 바라본다(얼굴 안 보임). 흐린 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "C",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the boxes keep no text or logos; nobody else enters.",
      motion: motion("the person lifts a hand to shade the eyes and keeps looking at the sea, the boxes and the quay stay completely still", "why is it stuck") },
    { scene: 4, key: "s4_creditors", role: "evidence", video: "story_ep15_s4_creditors_motion.mp4",
      narration: "2016년 8월 30일, 채권단은 만장일치로 한진해운에 새 돈을 대지 않기로 했어.",
      imageBrief: "회의실의 긴 탁자에 둘러앉은 정장 차림 사람들이 뒷모습으로 모두 손을 들고 있다(얼굴 안 보임). 탁자 위에 글자 없는 서류. 차가운 형광등. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "D",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the documents keep no text or numbers; nobody else enters.",
      motion: motion("the raised hands stay up for a moment and then slowly lower, the table and the room stay completely still", "a unanimous decision") },
    { scene: 5, key: "s5_seized", role: "evidence", video: "story_ep15_s5_seized_motion.mp4",
      narration: "같은 날 싱가포르 법원은 선주의 요청으로 한진해운 컨테이너선 한 척을 가압류했지.",
      imageBrief: "항구에 정박한 컨테이너선 한 척의 갑판 난간 위에 아무것도 인쇄되지 않은 순백의 빈 종이 한 장이 놓여 있다(글자·줄·도장·도형·무늬 없는 완전히 하얀 종이, 인쇄된 문서처럼 그리지 마). 사람 없음. 선체·컨테이너에 글자·로고 없음. 낮의 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "E",
      lock: "no people appear; the document keeps no readable text; no text or logos on the ship; the framing stays fixed.",
      motion: motion("a breeze lifts the corner of the document once and it settles, the ship and the railing stay completely still", "seized") },
    { scene: 6, key: "s6_denied", role: "evidence", video: "story_ep15_s6_denied_motion.mp4",
      narration: "나머지 배들은 압류 대신 하역과 입항을 거부당했어. 신용이 끊긴 거야.",
      imageBrief: "항구 입구 바깥에서 입항하지 못하고 줄지어 멈춰 선 컨테이너선들과 항구 쪽의 닫힌 부두 게이트. 사람 없음. 글자·로고 없음. 흐린 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "F",
      lock: "no people appear; no text, numbers or logos; the arrangement stays the same.",
      motion: motion("the water ripples lightly around the waiting ships and a signal light on the gate blinks once, the ships and the gate stay completely still", "credit is cut") },
    { scene: 7, key: "s7_how_many", role: "core_question", video: "story_ep15_s7_how_many_motion.mp4",
      narration: "그렇게 멈춘 배는 몇 척이나 됐을까?",
      imageBrief: "책상 위 바다 지도 모형에 작은 배 모양 조각 몇 개가 점처럼 흩어져 놓여 있다. 글자·지명·숫자 없음. 사람 없음. 차가운 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "G",
      lock: "no people appear; the chart keeps no text, place names or numbers; the desk stays fixed.",
      motion: motion("a soft light moves once across the scattered ship pieces, the desk and the chart stay completely still", "how many ships") },
    { scene: 8, key: "s8_ships45to70", role: "evidence", video: "story_ep15_s8_ships45to70_motion.mp4",
      narration: "정상 운항을 못 하는 배는 사흘 만에 45척에서 70척 안팎으로 늘었어.",
      imageBrief: "책상 위 바다 지도 모형에 작은 배 모양 조각이 전보다 훨씬 많이 빽빽하게 놓여 있다. 글자·숫자 없음. 사람 없음. 차가운 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no people appear; the chart keeps no text or numbers; the desk stays fixed.",
      motion: motion("a soft light sweeps across the crowded ship pieces and settles, the desk and the chart stay completely still", "it spreads") },
    { scene: 9, key: "s9_cargo", role: "evidence", video: "story_ep15_s9_cargo_motion.mp4",
      narration: "그런데 진짜 문제는 배 위의 짐이었어. 묶인 화물은 약 140억 달러어치, 컨테이너로는 50만 개 안팎이었지.",
      imageBrief: "컨테이너가 층층이 높이 쌓인 배 위 갑판과 아무것도 인쇄되지 않은 순백의 빈 종이 묶음 한 더미가 보이는 구도(종이에 글자·줄·도장·도형·무늬 없음, 인쇄된 서류처럼 그리지 마). 사람 없음. 컨테이너에 글자·번호 없음. 흐린 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "I",
      lock: "no people appear; no text, numbers or logos; the stacks keep the same arrangement.",
      motion: motion("a gentle sway moves the loose edge of the documents once, the containers and the deck stay completely still", "the cargo itself") },
    { scene: 10, key: "s10_reports397", role: "evidence", video: "story_ep15_s10_reports397_motion.mp4",
      narration: "3주도 안 돼, 한국무역협회 신고센터에는 수출 기업 피해가 397건, 약 1억 4,700만 달러가 접수됐어.",
      imageBrief: "신고센터 접수 창구 책상에 글자 없는 서류가 높이 쌓여 있고 접수 도장이 옆에 놓여 있다. 사람 없음. 형광등. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "J",
      lock: "no people appear; the documents keep no readable text or numbers; the desk stays fixed.",
      motion: motion("the top sheet of the pile lifts in a faint draft and settles, the desk and the pile stay completely still", "damage reports pile up") },
    { scene: 11, key: "s11_promises", role: "evidence", video: "story_ep15_s11_promises_motion.mp4",
      narration: "배 한 척이 멈춘 게 아니라, 그 배에 실린 남의 물건과 약속이 같이 멈춘 거야.",
      imageBrief: "컨테이너 옆면마다 글자 없는 흰 계약서 한 장씩이 붙어 있는 듯한 근접 장면. 사람 없음. 낮의 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "K",
      lock: "no people appear; the sheets keep no readable text or numbers; the containers stay fixed.",
      motion: motion("a light breeze flutters the edges of the white sheets and they settle, the containers stay completely still", "promises on board") },
    { scene: 12, key: "s12_three_months", role: "evidence", video: "story_ep15_s12_three_months_motion.mp4",
      narration: "석 달 가까이 지나서야 짐을 모두 내렸어.",
      imageBrief: "부두의 대형 크레인이 마지막 컨테이너 하나를 천천히 내려 놓는 넓은 전경. 사람 없음. 글자·번호 없음. 저녁 노을. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "L",
      lock: "no people appear; the container keeps no text or numbers; the quay stays the same.",
      motion: motion("the crane lowers the last container and releases it, the quay and the sky stay completely still", "finally unloaded") },
    { scene: 13, key: "s13_last_path", role: "core_question", video: "story_ep15_s13_last_path_motion.mp4",
      narration: "그럼 이 회사를 살릴 길은 남아 있었을까?",
      imageBrief: "문 닫힌 사무실 복도에서 천장 조명이 하나씩 꺼지는 장면. 사람 없음. 글자·명패 없음. 어두워지는 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "M",
      lock: "no people appear; no text or nameplates; the corridor stays the same.",
      motion: motion("the ceiling lights go out one after another toward the end of the corridor, the doors and walls stay completely still", "is there a way out") },
    { scene: 14, key: "s14_liquidation", role: "evidence", video: "story_ep15_s14_liquidation_motion.mp4",
      narration: "회사를 접고 팔 때의 값어치가 계속 운영할 때의 값보다 높다는 조사가 나왔어. 1조 7,980억 원이었지. 법원은 회생절차를 폐지했어.",
      imageBrief: "탁자 위 두 저울. 한쪽 저울의 접시가 다른 쪽보다 눈에 띄게 낮게 기울어 있다. 접시 위에 글자 없는 서류 묶음. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "N",
      lock: "no people appear; the documents keep no text or numbers; the tilt stays the same.",
      motion: motion("the lower plate sways slightly and settles back to the same lower tilt, the table and the frames stay completely still", "worth more sold than run") },
    { scene: 15, key: "s15_bankrupt", role: "evidence", video: "story_ep15_s15_bankrupt_motion.mp4",
      narration: "2017년 2월 17일, 서울중앙지법은 한진해운에 파산을 선고했어.",
      imageBrief: "법원 건물 앞 넓은 계단 위에서 한 사람이 서류를 든 채 뒷모습으로 서서 계단을 내려다본다(얼굴 안 보임). 건물에 글자 없음. 흐린 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "O",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the building and the documents keep no text; nobody else enters.",
      motion: motion("the person takes one slow step down and stops, the steps and the building stay completely still", "a verdict") },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP15_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 15,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep15",
  sceneBackgrounds: Object.freeze({
    P: { label: "항구 부두(16번 부엉박사)", image: "밝은 오후 항구 부두 앞마당. 부엉박사 뒤로 글자 없는 컨테이너 더미와 크레인 한 대가 보이고, 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 햇빛.", videoStyle: "bright afternoon at a port quay yard with a stack of plain containers and one crane behind, smooth light gray pavement, warm afternoon light", videoStatics: "the plain container stack, the crane, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep15_s16_close_motion.mp4",
      narration: "신용이 끊기는 순간 배는 항구에 못 들어가고, 한 회사의 멈춤은 수출 기업 전체의 짐을 묶었어. 해운 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the container stack and the crane stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep15-assembly-spec.mjs --spec-export STORY_EP15_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep15-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep15-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep15-tts/story-ep15-tts-script.json --out-dir C:/tmp/story-ep15-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP15_FULL_SPEC = Object.freeze({
  ...STORY_EP15_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP15_SEMI_SPEC.sceneBackgrounds, ...STORY_EP15_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP15_SEMI_SPEC.scenes, ...STORY_EP15_END_SPEC.scenes]),
});

export const STORY_EP15_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP15_FULL_SPEC,
  headerTitle: Object.freeze(["배는 멈췄고","짐은 묶였다","한진해운"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["한진해운","수출","짐","채권단","신용","파산","법원"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP15_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
