/**
 * 스토리형 19편 — 류현진 포스팅 — 280억 원은 선수 몸값이 아니라 협상할 권리의 값이었다 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep19-ryu/scenes-v1.json`. 설계 `C:/tmp/story-ep19-ryu/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep19-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~15번 재연 장면 + 16번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~15번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep19-assembly-spec.mjs --scene-spec-export STORY_EP19_SEMI_SPEC --out-dir C:/tmp/story-ep19-images`
 *            ② 16번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep19-assembly-spec.mjs --scene-spec-export STORY_EP19_END_SPEC --out-dir C:/tmp/story-ep19-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP19_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 19,
  displayEpisode: 19,
  sourceCandidate: "story-ep19-ryu-posting-2012",
  title: "류현진 포스팅 — 280억 원은 선수 몸값이 아니라 협상할 권리의 값이었다",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep19",
  storyStyleOnlyIdentity:
    "2012년 한국과 미국 프로야구 구단 사무실과 협상 테이블을 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(선수·에이전트·구단 관계자)을 닮게 그리지 않고, 실제 구단 로고·유니폼 글자와 색을 흉내 내지 않아(유니폼은 글자 없는 단색). 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "큰 금액 봉투가 놓인 구단 사무실 책상 앞 빈 의자(1번)", image: "구단 사무실 책상 위에 두툼한 봉투 하나와 서류가 놓여 있고, 그 맞은편 의자는 비어 있다. 사람 없음. 글자·로고 없음. 차분한 조명.", videoStyle: "a team office desk with one thick envelope and papers on it and an empty chair opposite, no people, no text or logos, calm lighting", videoStatics: "the desk, the envelope, the empty chair, and the lighting" },
    B: { label: "서류를 앞에 두고 생각에 잠긴 관계자들(2번)", image: "회의실 테이블에 앉은 구단 관계자 서넛이 뒷모습으로 서류를 앞에 두고 생각에 잠겨 있다(얼굴 안 보임). 글자 없음. 낮은 조명.", videoStyle: "a few team officials seen from behind seated at a meeting table with papers in front of them in thought, no text, low lighting", videoStatics: "the meeting table, the papers, and the lighting" },
    C: { label: "봉투에 금액을 넣어 상자에 담는 여러 손(3번)", image: "탁자 위 투명한 상자에 여러 구단의 손이 봉투를 하나씩 넣는다. 손과 봉투만 보임, 글자 없음. 밝은 조명.", videoStyle: "close view of several hands each placing an envelope into a clear box on a table, hands and envelopes only, no text, bright lighting", videoStatics: "the table, the clear box, and the lighting" },
    D: { label: "가장 두꺼운 봉투 하나만 따로 놓인 책상(4번)", image: "책상 위에 여러 봉투 중 가장 두꺼운 봉투 하나만 따로 가운데에 놓여 있다. 글자 없음. 사람 없음. 밝은 조명.", videoStyle: "a desk with only the thickest envelope placed alone in the center among others pushed aside, no text, no people, bright lighting", videoStatics: "the desk, the envelopes, and the lighting" },
    E: { label: "서류를 읽고 고개를 끄덕이는 관계자(5번)", image: "구단 사무실에서 한 관계자가 뒷모습으로 전달받은 서류를 읽고 고개를 끄덕인다(얼굴 안 보임). 글자 없음. 아침 햇살.", videoStyle: "a team official seen from behind in an office reading a delivered document and nodding, no text, morning light", videoStatics: "the office, the document, and the morning light" },
    F: { label: "큰 금액 막대와 환산 표시 모형(6번)", image: "책상 위에 큰 막대 하나와 그 옆 환산을 뜻하는 화살표 모양 표시만 있는 모형(글자·숫자 없음). 사람 없음. 환한 조명.", videoStyle: "close view of a desk model with one tall bar and an arrow-shaped conversion marker beside it with no text or numbers, no people, bright lighting", videoStatics: "the desk, the bar model, the arrow marker, and the lighting" },
    G: { label: "금액 상자 옆에 놓인 빈 유니폼 걸이(7번)", image: "방 안 한쪽에 큰 금액 상자가 놓여 있고, 그 옆 걸이에 글자 없는 단색 야구 유니폼이 걸려 있지만 입은 사람은 없다. 사람 없음.", videoStyle: "a room with a large sum box on one side and a plain solid-color baseball uniform with no text hanging on a rack beside it with nobody wearing it, no people", videoStatics: "the room, the box, the uniform rack, and the lighting" },
    H: { label: "문이 하나만 열린 복도(8번)", image: "긴 복도에 문이 하나만 열려 있고 나머지 문은 모두 닫혀 있다. 열린 문으로 밝은 빛이 새어 나온다. 사람 없음. 글자 없음.", videoStyle: "a long corridor with only one door open and all the others closed, bright light spilling from the open door, no people, no text", videoStatics: "the corridor, the closed doors, and the one open door" },
    I: { label: "서로 다른 책상에 놓인 서류 두 묶음(9번)", image: "두 개의 책상이 떨어져 있고 각 책상 위에 서류 묶음 하나씩 놓여 있다. 사람 없음. 글자·숫자 없음. 차분한 조명.", videoStyle: "two separate desks each holding one bundle of papers with no text or numbers, no people, calm lighting", videoStatics: "the two desks, the paper bundles, and the lighting" },
    J: { label: "계약서를 밀어 돌려보내는 손(10번)", image: "테이블 위에서 한 손이 두툼한 계약서를 맞은편으로 밀어 돌려보낸다. 손과 서류만 보임. 글자·숫자 없음. 낮은 조명.", videoStyle: "close view of a hand pushing a thick contract back across a table, hand and papers only, no text or numbers, low lighting", videoStatics: "the table, the contract, and the lighting" },
    K: { label: "지도 위 두 나라 사이의 비행기 모형(11번)", image: "책상 위 지도 모형에서 한 나라와 이웃 나라 사이에 작은 비행기 모형이 놓여 있다. 글자 없음. 사람 없음. 낮은 조명.", videoStyle: "a desk map model with a small airplane model placed between one country and its neighbor, no text, no people, low lighting", videoStatics: "the desk, the map model, the airplane model, and the lighting" },
    L: { label: "줄어드는 모래시계와 닫힌 서류함(12번)", image: "책상 위에 모래시계가 거의 다 흘러내렸고 그 옆에 서류함이 닫혀 있다. 글자 없음. 사람 없음. 낮은 조명.", videoStyle: "a desk with an hourglass nearly run out beside a closed document box, no text, no people, low lighting", videoStatics: "the desk, the hourglass, the closed box, and the lighting" },
    M: { label: "선수 출입구 앞의 빈 가방과 열린 문(13번)", image: "야구장 선수 출입구 앞에 가방 하나가 놓여 있고 문은 열려 있다. 사람 없음. 글자·로고 없음. 낮의 햇살.", videoStyle: "a baseball stadium players' entrance with one bag set down and the door open, no people, no text or logos, daylight", videoStatics: "the entrance, the bag, the open door, and the daylight" },
    N: { label: "새벽 시계와 비어 가는 책상 위 서류들(14번)", image: "새벽 시각을 가리키는 벽시계(숫자 없는 시계)와 그 아래 책상 위에 서류가 한두 장만 남아 있다. 사람 없음. 푸른 새벽빛.", videoStyle: "a wall clock without numerals pointing to early dawn and a desk below with only one or two papers left, no people, blue dawn light", videoStatics: "the clock, the desk, the papers, and the dawn light" },
    O: { label: "마지막 서명 칸에 펜이 닿는 계약서(15번)", image: "계약서의 마지막 서명 칸에 만년필 끝이 닿는 순간. 손만 보임. 글자·숫자 없음. 따뜻한 조명.", videoStyle: "close view of a fountain pen tip touching the last signature line of a contract, hand only, no text or numbers, warm lighting", videoStatics: "the table, the contract, and the warm light" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep19_s1_hook_motion.mp4",
      narration: "한국 구단이 280억 원짜리 제안을 받아들이기로 한 날, 정작 그 선수는 아직 아무 계약도 하지 않은 상태였어.",
      imageBrief: "구단 사무실 책상 위에 두툼한 봉투 하나와 서류가 놓여 있고, 그 맞은편 의자는 비어 있다. 사람 없음. 글자·로고 없음. 차분한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "A",
      lock: "no people appear; the envelope and papers keep no text or logos; the chair stays empty.",
      motion: motion("a soft light slides across the envelope and the empty chair, the desk and the chair stay completely still", "a big offer, no contract") },
    { scene: 2, key: "s2_why", role: "core_question", video: "story_ep19_s2_why_motion.mp4",
      narration: "선수는 계약도 안 했는데, 한화는 왜 벌써 그 금액을 받아들였을까?",
      imageBrief: "회의실 테이블에 앉은 구단 관계자 서넛이 뒷모습으로 서류를 앞에 두고 생각에 잠겨 있다(얼굴 안 보임). 글자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "B",
      lock: "the people stay seen from behind with no face ever shown; the papers keep no text or numbers; nobody else enters.",
      motion: motion("one official taps the papers and leans back slowly, the table and the papers stay completely still", "why accept already") },
    { scene: 3, key: "s3_bid", role: "evidence", video: "story_ep19_s3_bid_motion.mp4",
      narration: "2012년 11월, 류현진을 두고 메이저리그 구단들이 금액을 써냈어.",
      imageBrief: "탁자 위 투명한 상자에 여러 구단의 손이 봉투를 하나씩 넣는다. 손과 봉투만 보임, 글자 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "C",
      lock: "no face or body appears — only the hands; the envelopes keep no text or logos; the box stays fixed.",
      motion: motion("the hands drop their envelopes in one after another and withdraw, the table and the box stay completely still", "sealed bids") },
    { scene: 4, key: "s4_top", role: "evidence", video: "story_ep19_s4_top_motion.mp4",
      narration: "가장 높은 금액을 써낸 구단만 류현진과 협상할 수 있었지.",
      imageBrief: "책상 위에 여러 봉투 중 가장 두꺼운 봉투 하나만 따로 가운데에 놓여 있다. 글자 없음. 사람 없음. 밝은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "D",
      lock: "no people appear; the envelopes keep no text or logos; the desk stays fixed.",
      motion: motion("a soft spotlight brightens on the thickest envelope, the desk and the envelopes stay completely still", "the highest wins") },
    { scene: 5, key: "s5_accept", role: "evidence", video: "story_ep19_s5_accept_motion.mp4",
      narration: "11월 10일, 한화는 그 금액을 전해 받고 얼마 뒤 받아들였어.",
      imageBrief: "구단 사무실에서 한 관계자가 뒷모습으로 전달받은 서류를 읽고 고개를 끄덕인다(얼굴 안 보임). 글자 없음. 아침 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "E",
      lock: "the people stay seen from behind with no face ever shown; the document keeps no text or numbers; nobody else enters.",
      motion: motion("the official nods and lowers the document slowly, the office and the desk stay completely still", "accepted") },
    { scene: 6, key: "s6_dodgers", role: "evidence", video: "story_ep19_s6_dodgers_motion.mp4",
      narration: "써낸 구단은 LA 다저스, 금액은 2,573만 달러. 우리 돈으로 280억 원쯤이었지.",
      imageBrief: "책상 위에 큰 막대 하나와 그 옆 환산을 뜻하는 화살표 모양 표시만 있는 모형(글자·숫자 없음). 사람 없음. 환한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "F",
      lock: "no people appear; the model keeps no text or numbers; the desk stays fixed.",
      motion: motion("a gentle glow travels up the tall bar and fades, the desk and the model stay completely still", "a huge sum") },
    { scene: 7, key: "s7_notplayer", role: "evidence", video: "story_ep19_s7_notplayer_motion.mp4",
      narration: "그런데 이 돈으로 다저스가 산 건 선수가 아니었어.",
      imageBrief: "방 안 한쪽에 큰 금액 상자가 놓여 있고, 그 옆 걸이에 글자 없는 단색 야구 유니폼이 걸려 있지만 입은 사람은 없다. 사람 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "G",
      lock: "no people appear; the box and uniform keep no text or logos; the rack stays fixed.",
      motion: motion("the uniform sways very slightly on its hanger, the room and the box stay completely still", "not the player") },
    { scene: 8, key: "s8_right", role: "evidence", video: "story_ep19_s8_right_motion.mp4",
      narration: "다저스가 얻은 건 30일 동안 류현진과만 협상할 수 있는 권리였지.",
      imageBrief: "긴 복도에 문이 하나만 열려 있고 나머지 문은 모두 닫혀 있다. 열린 문으로 밝은 빛이 새어 나온다. 사람 없음. 글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "H",
      lock: "no people appear; the doors keep no text or numbers; the corridor stays fixed.",
      motion: motion("the light from the open door brightens gently, the corridor and the doors stay completely still", "the only door") },
    { scene: 9, key: "s9_separate", role: "evidence", video: "story_ep19_s9_separate_motion.mp4",
      narration: "선수에게 갈 돈은 그 280억 원과 별개로, 그 30일 안에 따로 정해야 했어.",
      imageBrief: "두 개의 책상이 떨어져 있고 각 책상 위에 서류 묶음 하나씩 놓여 있다. 사람 없음. 글자·숫자 없음. 차분한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "I",
      lock: "no people appear; the papers keep no text or numbers; the desks stay fixed.",
      motion: motion("a soft light moves from one bundle to the other and rests, the desks and the bundles stay completely still", "two separate sums") },
    { scene: 10, key: "s10_refuse", role: "evidence", video: "story_ep19_s10_refuse_motion.mp4",
      narration: "첫 협상에서 다저스는 장기 계약을 내밀었어. 류현진 쪽은 바로 거절했지.",
      imageBrief: "테이블 위에서 한 손이 두툼한 계약서를 맞은편으로 밀어 돌려보낸다. 손과 서류만 보임. 글자·숫자 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "J",
      lock: "no face or body appears — only the hand; the contract keeps no text or numbers; the table stays fixed.",
      motion: motion("the hand slides the contract across and withdraws, the table and the contract stay completely still", "refused at once") },
    { scene: 11, key: "s11_japan", role: "evidence", video: "story_ep19_s11_japan_motion.mp4",
      narration: "에이전트는 '일본에서 뛸 수도 있다'며 다저스를 압박했어.",
      imageBrief: "책상 위 지도 모형에서 한 나라와 이웃 나라 사이에 작은 비행기 모형이 놓여 있다. 글자 없음. 사람 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "K",
      lock: "no people appear; the map keeps no text or labels; the desk stays fixed.",
      motion: motion("the airplane model turns slightly toward the neighbor and stops, the desk and the map stay completely still", "an alternative") },
    { scene: 12, key: "s12_fail", role: "core_question", video: "story_ep19_s12_fail_motion.mp4",
      narration: "30일 안에 맞추지 못하면 어떻게 됐을까?",
      imageBrief: "책상 위에 모래시계가 거의 다 흘러내렸고 그 옆에 서류함이 닫혀 있다. 글자 없음. 사람 없음. 낮은 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "L",
      lock: "no people appear; the box keeps no text or labels; the desk stays fixed.",
      motion: motion("the last grains of sand fall slowly, the desk and the box stay completely still", "time running out") },
    { scene: 13, key: "s13_stay", role: "evidence", video: "story_ep19_s13_stay_motion.mp4",
      narration: "계약이 안 되면 류현진은 다음 해 한화에서 다시 뛰어야 했어.",
      imageBrief: "야구장 선수 출입구 앞에 가방 하나가 놓여 있고 문은 열려 있다. 사람 없음. 글자·로고 없음. 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "M",
      lock: "no people appear; the bag and door keep no text or logos; the entrance stays fixed.",
      motion: motion("the open door swings very slightly in the breeze, the entrance and the bag stay completely still", "back to the old club") },
    { scene: 14, key: "s14_deadline", role: "evidence", video: "story_ep19_s14_deadline_motion.mp4",
      narration: "협상 마감은 12월 10일 오전 7시였어.",
      imageBrief: "새벽 시각을 가리키는 벽시계(숫자 없는 시계)와 그 아래 책상 위에 서류가 한두 장만 남아 있다. 사람 없음. 푸른 새벽빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "medium", bg: "N",
      lock: "no people appear; the clock keeps no numerals or text; the desk stays fixed.",
      motion: motion("the clock's second hand ticks forward steadily, the desk and the papers stay completely still", "the deadline") },
    { scene: 15, key: "s15_deal", role: "evidence", video: "story_ep19_s15_deal_motion.mp4",
      narration: "마감 직전, 계약은 6년 3,600만 달러로 맺어졌어.",
      imageBrief: "계약서의 마지막 서명 칸에 만년필 끝이 닿는 순간. 손만 보임. 글자·숫자 없음. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "O",
      lock: "no face or body appears — only the hand; the contract keeps no text or numbers; the table stays fixed.",
      motion: motion("the pen glides across the signature line and lifts, the table and the contract stay completely still", "signed") },
  ]),
});

// ── 16번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP19_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 19,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep19",
  sceneBackgrounds: Object.freeze({
    P: { label: "서류 두 묶음 앞(16번 부엉박사)", image: "밝은 오후 한국의 야구장 앞 광장. 부엉박사 뒤로 글자 없는 구장 외벽과 열린 출입문, 바닥에 놓인 서류 상자 두 개(글자 없음). 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 빛.", videoStyle: "bright afternoon on the plaza in front of a Korean baseball stadium with a plain stadium wall, an open gate, and two plain document boxes on the ground, smooth light gray pavement", videoStatics: "the stadium wall, the open gate, the two boxes, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 16, key: "s16_close", role: "save", video: "story_ep19_s16_close_motion.mp4",
      narration: "큰 숫자가 나왔을 때는 그 돈이 누구 주머니로 가는지부터 보면 달라. 280억 원은 협상할 권리의 값이었고, 선수에게 간 돈은 따로였지. 류현진 이야기의 다음이 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the wall and the boxes stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep19-assembly-spec.mjs --spec-export STORY_EP19_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep19-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep19-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep19-tts/story-ep19-tts-script.json --out-dir C:/tmp/story-ep19-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP19_FULL_SPEC = Object.freeze({
  ...STORY_EP19_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP19_SEMI_SPEC.sceneBackgrounds, ...STORY_EP19_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP19_SEMI_SPEC.scenes, ...STORY_EP19_END_SPEC.scenes]),
});

export const STORY_EP19_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP19_FULL_SPEC,
  headerTitle: Object.freeze(["280억 원은","몸값이 아닌","협상할 권리"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["280억","협상","30일","다저스","한화","3,600만"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP19_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});
