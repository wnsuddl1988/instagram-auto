/**
 * 스토리형 11편 — 포스코 — 돈이 막히자 정해진 돈의 쓰임을 바꾼 제철소 재연 장면 스펙 (2026-10-11, 기본 베이스 구조).
 *
 * 기준: `_ai/story-script-rules.md` + 확정 대본 `C:/tmp/story-ep11-posco/scenes-v7.json`. 설계 `C:/tmp/story-ep11-posco/story-design.json`.
 * TTS `C:/tmp/money-shorts-os/story-ep11-tts/output-v1/tempo-1.2-gap0.25-pre/…tempo1.2-gap0.25-pre.json`.
 * 화풍: 반사실 3D(storysemi). 1~14번 재연 장면 + 15번 부엉박사 진행자 컷.
 * 이미지 규칙(스토리형): 화면에 글자·숫자·로고·브랜드·회사 이름을 넣지 않는다(숫자는 자막이 맡는다). 실존 인물을 닮게 그리지 않는다
 * (얼굴이 크게 보이는 구도 금지, 뒷모습·멀리 있는 작은 모습·손과 소품). 소품은 두 손으로 감싸 쥐거나 탁자·바닥에 거치. 빈 면 금지.
 * 저작권 캐릭터·로고(미키·디즈니 성·마리오 등)는 그리지 않는다.
 *
 * 이미지 생성: ① 1~14번 `ALLOW_CHATGPT_IMAGE=1 node scripts/probe-character-consistency-chatgpt-v1.mjs --character storysemi --scene-spec ./_story-ep11-assembly-spec.mjs --scene-spec-export STORY_EP11_SEMI_SPEC --out-dir C:/tmp/story-ep11-images`
 *            ② 15번(부엉박사) `… --character owl3dv5 --scene-spec ./_story-ep11-assembly-spec.mjs --scene-spec-export STORY_EP11_END_SPEC --out-dir C:/tmp/story-ep11-images`
 */

const NO_TEXT = "화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).";
const motion = (action, mood) => ({ type: "scene", action, mood });

export const STORY_EP11_SEMI_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  scriptStructureVersion: "story_format_structure_v3",
  formatProfile: "story_v1",
  episode: 11,
  displayEpisode: 11,
  sourceCandidate: "story-ep11-posco-claims-fund",
  title: "포스코 — 돈이 막히자 정해진 돈의 쓰임을 바꾼 제철소",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  imageCharacter: "storysemi",
  imagePrefix: "story_ep11",
  storyStyleOnlyIdentity:
    "1960~70년대 한국 영일만 포항 제철소 건설 시기를 배경으로 한 재연 장면 시리즈의 한 장면이야. 실존 인물(박태준·정부 인사·외국 인사)을 닮게 그리지 않아. 화풍: 고품질 반사실 3D CG 렌더링(시네마틱 게임 컷신·CG 다큐 재연 화면 같은 느낌) — 사람의 얼굴·눈·머리·몸 비율은 실제 사람처럼 사실적으로, 피부·옷·재질은 매끈한 CG 질감, 영화 같은 자연광과 부드러운 그림자, 차분하고 진지한 색감. 큰 눈·둥근 얼굴·과장된 만화 비율(픽사풍) 금지, 실제 사진처럼 보이는 실사도 금지. 장면 설명에 나오는 인물 외에는 아무도 그리지 마. 세로 9:16.",
  storySameStyleRule:
    "앞 장면들과 똑같은 반사실 3D CG 화풍(사실적인 사람 비율, 매끈한 CG 질감, 같은 시네마틱 조명·색감)을 유지해. 장면 설명에 없는 인물·글자·숫자·로고는 넣지 마. 얼굴을 크게 보이게 하지 말고 장면 설명대로 뒷모습·작은 모습·손과 소품 위주로 그려. 픽사풍 큰 눈·만화 비율 금지, 실사 사진 금지. 세로 9:16.",

  sceneBackgrounds: Object.freeze({
    A: { label: "설계도를 펼친 사람들(1번)", image: "사무실 탁자 위에 글자 없는 큰 설계도 도면이 펼쳐져 있고, 정장과 작업복 차림의 한국인 서너 명이 뒷모습으로 둘러서서 도면을 내려다본다(얼굴 안 보임). 탁자 한쪽에는 두꺼운 보고서 한 권이 덮인 채 밀려나 있다. 따뜻한 오후 햇살.", videoStyle: "an office table with a large plain blueprint unrolled, a few people in suits and work clothes seen from behind leaning over it, a thick closed report pushed aside, warm afternoon light", videoStatics: "the table, the blueprint, the closed report, and the office walls" },
    B: { label: "황량한 바닷가 부지(2번)", image: "황량한 바닷가 모래 부지. 한 사람이 뒷모습으로 서서 멀리 수평선을 바라보고, 발치에 측량용 말뚝 몇 개와 줄이 놓여 있다. 흐린 하늘.", videoStyle: "a bleak sandy seaside plot with one person seen from behind looking at the far horizon, a few survey stakes and a string at his feet, an overcast sky", videoStatics: "the sand, the survey stakes, the horizon, and the overcast sky" },
    C: { label: "새벽 바닷가 철골 기둥(3번)", image: "새벽 바닷가 빈 부지에 막 올린 철골 기둥 몇 개와 크레인 한 대의 넓은 전경. 사람 없음. 푸른 새벽빛.", videoStyle: "wide view of a seaside plot at dawn with a few freshly raised steel columns and one crane, no people, cool blue dawn light", videoStatics: "the steel columns, the crane, the sea and the dawn sky" },
    D: { label: "텅 빈 금고(4번)", image: "어두운 방의 큰 금고 문이 열려 있고 속이 텅 비어 있다. 문 앞에 양복 입은 사람이 뒷모습으로 서서 고개를 숙이고 안을 들여다본다(얼굴 안 보임). 한 줄기 빛.", videoStyle: "a dark room with a large open safe that is completely empty, a person in a suit seen from behind bowing his head to look inside, a single shaft of light", videoStatics: "the empty safe, the dark room, and the shaft of light" },
    E: { label: "보고서를 두고 돌아선 사람들(5번)", image: "탁자 위에 글자 없는 두꺼운 보고서가 놓여 있고, 맞은편 정장 차림 사람들이 등을 돌려 창가 쪽으로 천천히 걸어간다(작은 뒷모습). 차가운 낮빛.", videoStyle: "a thick plain report on a table while people in suits on the far side turn their backs and walk toward the window, small seen from behind, cold daylight", videoStatics: "the table, the thick plain report, the window, and the room walls" },
    F: { label: "응접실의 거절(6번)", image: "넓은 응접실. 소파에 앉은 정장 차림 사람의 뒷모습과 맞은편에서 고개를 젓는 사람의 뒷모습, 탁자 위에 글자 없는 서류가 놓여 있다(얼굴 안 보임). 따뜻하지만 무거운 조명.", videoStyle: "a spacious reception room with a person in a suit seated on a sofa seen from behind and another across shaking his head seen from behind, a plain document on the table, warm but heavy lighting", videoStatics: "the sofas, the table with the plain document, and the room walls" },
    G: { label: "귀국 비행기 창가(7번)", image: "비행기 좌석 창가에서 한 사람이 뒷모습으로 창밖의 구름과 석양을 바라본다(얼굴 안 보임). 창틀과 좌석 등받이만 보이고 글자는 없다.", videoStyle: "a person seen from behind by an airplane window looking out at clouds and sunset, only the window frame and seat back visible, no text", videoStatics: "the window frame, the seat back, and the clouds and sunset outside" },
    H: { label: "농사·어업 칸이 그려진 예산표(8번)", image: "탁자 위 근접 장면. 글자·숫자 없이 호미·삽 같은 농사 도구 그림과 작은 어선 그림이 칸마다 그려진 예산표 한 장을 한 손이 짚고 있다. 손만 보이고 얼굴은 그리지 마. 따뜻한 조명.", videoStyle: "close view of a budget sheet on a table with small drawings of farm tools and a fishing boat in its boxes and a single hand pointing at it, hand only, warm light", videoStatics: "the table, the budget sheet with its drawn boxes, and the warm light" },
    I: { label: "칸 사이로 옮겨 붙는 종이 조각(9번)", image: "탁자 위 근접 장면. 예산표의 농사 도구 칸에서 제철소 모양 그림 칸으로 한 손이 작은 색종이 조각을 옮겨 붙인다. 글자·숫자 없음. 손만 보임.", videoStyle: "close view of a hand moving a small colored paper piece from the farm-tools box to the steel-mill drawing box on a budget sheet, hand only, no text", videoStatics: "the table, the budget sheet with its plain boxes, and the warm light" },
    J: { label: "회의실의 설득(10번)", image: "회의실 탁자에 한국인 정장 차림 사람들과 외국인 정장 차림 사람들이 마주 앉아 있고, 한쪽 사람이 서류를 펼쳐 놓고 손으로 가리키며 설명한다(모두 뒷모습). 낮의 햇살.", videoStyle: "a meeting room table with Korean and foreign people in suits seated across from each other seen from behind, one person spreading out papers and pointing while explaining, daylight", videoStatics: "the meeting table, the window, and the room walls" },
    K: { label: "새벽 공사 현장 전경(11번)", image: "새벽 바닷가 대형 공사 현장의 넓은 전경. 철골 기둥이 올라가고 작업복과 안전모를 쓴 사람들이 작게 줄지어 일한다(작은 뒷모습). 크레인과 흙더미. 간판·글자 없음.", videoStyle: "wide dawn view of a large seaside construction site with steel columns rising and small workers in work clothes and helmets seen from behind lined up, cranes and soil mounds, no signs", videoStatics: "the steel columns, the cranes, the soil mounds, and the dawn sky" },
    L: { label: "붉은 쇳물이 쏟아지는 용광로(12번)", image: "어두운 용광로 앞에서 붉은 쇳물이 흘러나오고, 안전복을 입은 작업자 서너 명이 멀리 뒷모습으로 서서 올려다본다(얼굴 안 보임). 불빛이 벽을 붉게 물들인다.", videoStyle: "in front of a dark blast furnace red molten iron pours out while a few workers in protective gear stand far away seen from behind looking up, firelight reddening the walls", videoStatics: "the furnace, the dark walls, and the workers seen from behind" },
    M: { label: "빈 장부와 가동 중인 공장(13번)", image: "밝은 사무실 책상 위에 펼친 빈 장부 한 권과 그 앞에 서서 내려다보는 사람의 뒷모습, 창밖에는 가동 중인 공장 굴뚝의 연기가 보인다(얼굴 안 보임, 글자 없음).", videoStyle: "a bright office desk with an open blank ledger and a person standing before it seen from behind looking down, smoke from an operating factory chimney visible through the window, no text", videoStatics: "the desk, the open blank ledger, the window, and the chimney outside" },
    N: { label: "높아지는 금속 블록 그래프(14번)", image: "책상 위 근접 장면. 장부 옆에 막대 그래프 모양의 금속 블록들이 왼쪽에서 오른쪽으로 높아지도록 놓여 있다. 글자·숫자 없음. 사람 없음. 환한 빛.", videoStyle: "close view of metal blocks arranged like a bar graph rising from left to right beside a ledger on a desk, no text or numbers, no people, bright light", videoStatics: "the desk, the ledger, and the bright light" },
  }),

  scenes: Object.freeze([
    { scene: 1, key: "s1_hook", role: "hook", video: "story_ep11_s1_hook_motion.mp4",
      narration: "세계은행이 '시기상조'라고 한 제철소를, 한 나라가 짓겠다고 나섰어.",
      imageBrief: "사무실 탁자 위에 글자 없는 큰 설계도 도면이 펼쳐져 있고, 정장과 작업복 차림의 한국인 서너 명이 뒷모습으로 둘러서서 도면을 내려다본다(얼굴 안 보임). 탁자 한쪽에는 두꺼운 보고서 한 권이 덮인 채 밀려나 있다. 따뜻한 오후 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "A",
      lock: "the people stay seen from behind with no face ever shown and do not resemble any real person; the blueprint keeps only plain lines with no text; the closed report stays closed; nobody else enters.",
      motion: motion("the people lean closer and one hand moves along the blueprint lines, the closed report and the table stay completely still", "a plan unfolds despite refusal") },
    { scene: 2, key: "s2_how", role: "evidence", video: "story_ep11_s2_how_motion.mp4",
      narration: "돈도 기술도 없던 나라에, 제철소를 지을 길이 있었을까?",
      imageBrief: "황량한 바닷가 모래 부지. 한 사람이 뒷모습으로 서서 멀리 수평선을 바라보고, 발치에 측량용 말뚝 몇 개와 줄이 놓여 있다. 흐린 하늘. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "B",
      lock: "the person stays seen from behind with no face ever shown; the stakes and the string stay fixed; no text or signs; nobody else enters.",
      motion: motion("the person slowly turns his head toward the sea and a light wind moves the string between the stakes, the sand and the horizon stay completely still", "an empty plot and a question") },
    { scene: 3, key: "s3_company", role: "evidence", video: "story_ep11_s3_company_motion.mp4",
      narration: "포항제철, 지금의 포스코 이야기야.",
      imageBrief: "새벽 바닷가 빈 부지에 막 올린 철골 기둥 몇 개와 크레인 한 대의 넓은 전경. 사람 없음. 푸른 새벽빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "C",
      lock: "no people appear; the columns and the crane keep the same arrangement; no text, signs or logos.",
      motion: motion("the crane arm swings very slowly and the dawn light brightens along the columns, the columns and the sea stay completely still", "the beginning of a mill") },
    { scene: 4, key: "s4_no_money", role: "evidence", video: "story_ep11_s4_no_money_motion.mp4",
      narration: "필요한 외국 돈은 1억 달러 안팎이었어. 그런데 빌려줄 곳이 없었지.",
      imageBrief: "어두운 방의 큰 금고 문이 열려 있고 속이 텅 비어 있다. 문 앞에 양복 입은 사람이 뒷모습으로 서서 고개를 숙이고 안을 들여다본다(얼굴 안 보임). 한 줄기 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "D",
      lock: "the person stays seen from behind with no face ever shown; the safe stays empty with nothing appearing inside; no text or numbers.",
      motion: motion("the person puts a hand on the open safe door and slowly lowers his head, the safe and the room stay completely still", "no money to borrow") },
    { scene: 5, key: "s5_report", role: "evidence", video: "story_ep11_s5_report_motion.mp4",
      narration: "세계은행은 한국에 제철소는 시기상조라는 보고서를 냈고, 국제 차관단도 등을 돌렸어.",
      imageBrief: "탁자 위에 글자 없는 두꺼운 보고서가 놓여 있고, 맞은편 정장 차림 사람들이 등을 돌려 창가 쪽으로 천천히 걸어간다(작은 뒷모습). 차가운 낮빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "E",
      lock: "the people stay small and seen from behind with no face shown; the report keeps no text on its cover; no one returns to the table.",
      motion: motion("the people walk slowly away toward the window while the report lies untouched, the table and the window stay completely still", "refused") },
    { scene: 6, key: "s6_us_chair", role: "evidence", video: "story_ep11_s6_us_chair_motion.mp4",
      narration: "박태준 사장은 차관을 주선하던 미국 회사 회장을 만났지만, 돈을 구하는 데 끝내 실패했어.",
      imageBrief: "넓은 응접실. 소파에 앉은 정장 차림 사람의 뒷모습과 맞은편에서 고개를 젓는 사람의 뒷모습, 탁자 위에 글자 없는 서류가 놓여 있다(얼굴 안 보임). 따뜻하지만 무거운 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "F",
      lock: "both people stay seen from behind with no face ever shown and do not resemble any real person; the document keeps no text; nobody else enters.",
      motion: motion("the person across slowly shakes his head while the seated person lowers his shoulders, the sofa and the table stay completely still", "a hard no") },
    { scene: 7, key: "s7_way_home", role: "evidence", video: "story_ep11_s7_way_home_motion.mp4",
      narration: "절망적인 답을 듣고 돌아오는 귀국길에, 그는 다른 돈을 떠올렸어.",
      imageBrief: "비행기 좌석 창가에서 한 사람이 뒷모습으로 창밖의 구름과 석양을 바라본다(얼굴 안 보임). 창틀과 좌석 등받이만 보이고 글자는 없다. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "G",
      lock: "the person stays seen from behind with no face ever shown; no signs, text or logos; nobody else appears.",
      motion: motion("the clouds drift slowly past the window while the person leans a little closer to the glass, the window frame and the seat stay completely still", "a new idea on the way home") },
    { scene: 8, key: "s8_claims_fund", role: "evidence", video: "story_ep11_s8_claims_fund_motion.mp4",
      narration: "일본에서 받기로 한 청구권 자금 가운데, 농사와 어업에 쓰기로 한 몫이었지.",
      imageBrief: "탁자 위 근접 장면. 글자·숫자 없이 호미·삽 같은 농사 도구 그림과 작은 어선 그림이 칸마다 그려진 예산표 한 장을 한 손이 짚고 있다. 손만 보이고 얼굴은 그리지 마. 따뜻한 조명. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "H",
      lock: "no face or body appears — only the hand; the sheet keeps only plain drawings with no text or numbers; the table stays fixed.",
      motion: motion("the hand slides along the boxes and taps the farm and boat drawings once, the table and the sheet stay completely still", "money already set aside") },
    { scene: 9, key: "s9_change_use", role: "evidence", video: "story_ep11_s9_change_use_motion.mp4",
      narration: "새 돈을 구하지 못하자, 이미 정해진 돈의 쓰임을 바꾸자는 거야.",
      imageBrief: "탁자 위 근접 장면. 예산표의 농사 도구 칸에서 제철소 모양 그림 칸으로 한 손이 작은 색종이 조각을 옮겨 붙인다. 글자·숫자 없음. 손만 보임. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "I",
      lock: "no face or body appears — only the hand; the sheet keeps only plain drawings with no text or numbers; the table stays fixed.",
      motion: motion("the hand carries the small paper piece across and presses it into the steel-mill box, the table and the sheet stay completely still", "the use changes") },
    { scene: 10, key: "s10_persuade", role: "evidence", video: "story_ep11_s10_persuade_motion.mp4",
      narration: "그는 정부와 일본 정재계를 직접 찾아가 설득했고, 건설 계획이 바뀌었어.",
      imageBrief: "회의실 탁자에 한국인 정장 차림 사람들과 외국인 정장 차림 사람들이 마주 앉아 있고, 한쪽 사람이 서류를 펼쳐 놓고 손으로 가리키며 설명한다(모두 뒷모습). 낮의 햇살. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "J",
      lock: "everyone stays seen from behind with no face ever shown and nobody resembles a real person; the papers keep no text; nobody else enters.",
      motion: motion("the person pointing at the papers gestures steadily while the others on the far side slowly nod, the table and the window stay completely still", "persuading") },
    { scene: 11, key: "s11_construction", role: "evidence", video: "story_ep11_s11_construction_motion.mp4",
      narration: "1970년 4월 1일, 포항제철소 1기가 착공됐어. 일한 사람은 연인원 315만 명, 짓는 데 39개월이 걸렸지.",
      imageBrief: "새벽 바닷가 대형 공사 현장의 넓은 전경. 철골 기둥이 올라가고 작업복과 안전모를 쓴 사람들이 작게 줄지어 일한다(작은 뒷모습). 크레인과 흙더미. 간판·글자 없음. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "wide", bg: "K",
      lock: "the workers stay small and seen from behind with no face shown; no signs, text or logos; the arrangement of columns and cranes stays the same.",
      motion: motion("the small workers move steadily along the site and a crane arm lifts a steel beam slowly, the columns and the sea stay completely still", "building begins") },
    { scene: 12, key: "s12_completion", role: "evidence", video: "story_ep11_s12_completion_motion.mp4",
      narration: "1973년 7월 3일, 조강 연산 103만 톤 규모의 1기가 준공됐어. 들어간 돈은 1,204억 원, 그중 외국 돈이 711억 원이었지.",
      imageBrief: "어두운 용광로 앞에서 붉은 쇳물이 흘러나오고, 안전복을 입은 작업자 서너 명이 멀리 뒷모습으로 서서 올려다본다(얼굴 안 보임). 불빛이 벽을 붉게 물들인다. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "L",
      lock: "the workers stay far and seen from behind with no face shown; no text or signs; the furnace arrangement stays the same.",
      motion: motion("the molten iron flows steadily from the furnace and the glow flickers on the wall while the workers watch, the furnace and the walls stay completely still", "the first molten iron") },
    { scene: 13, key: "s13_test", role: "core_question", video: "story_ep11_s13_test_motion.mp4",
      narration: "그런데 진짜 시험은 지은 뒤였어. 공장은 섰지만, 쓴 돈은 돌아왔을까?",
      imageBrief: "밝은 사무실 책상 위에 펼친 빈 장부 한 권과 그 앞에 서서 내려다보는 사람의 뒷모습, 창밖에는 가동 중인 공장 굴뚝의 연기가 보인다(얼굴 안 보임, 글자 없음). 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만). 구도 규칙(가장 중요): 카메라를 낮게 잡아 인물의 머리는 화면 세로 45%보다 아래(45~85% 구간)에 오게 하고, 화면 위쪽 40%에는 사람·머리가 하나도 없이 벽·창문·천장·조명·하늘 같은 배경만 보이게 해.",
      shot: "medium", bg: "M",
      lock: "the person stays seen from behind with no face ever shown; the ledger keeps blank pages with no text or numbers; nobody else enters.",
      motion: motion("the person leans over the ledger and then lifts his head toward the window, the desk and the chimney stay completely still", "did the money come back") },
    { scene: 14, key: "s14_profit", role: "evidence", video: "story_ep11_s14_profit_motion.mp4",
      narration: "가동 1년 만인 1974년 7월, 포항제철소는 흑자로 돌아섰어. 국가기록원은 그해 매출을 1억 달러로 적었지.",
      imageBrief: "책상 위 근접 장면. 장부 옆에 막대 그래프 모양의 금속 블록들이 왼쪽에서 오른쪽으로 높아지도록 놓여 있다. 글자·숫자 없음. 사람 없음. 환한 빛. 화면 안에 글자·숫자·로고·브랜드 이름·회사 이름은 하나도 넣지 마(간판·서류·화면·계기판·상자·신문·지도 모두 무늬와 색 덩어리만).",
      shot: "close", bg: "N",
      lock: "no people appear; the blocks keep the same rising arrangement with no text or numbers; the desk stays fixed.",
      motion: motion("a soft light slides along the rising blocks and settles at the tallest one, the desk and the ledger stay completely still", "back in the black") },
  ]),
});

// ── 15번(부엉박사 마무리) — owl3dv5 스펙으로 따로 생성 ──
export const STORY_EP11_END_SPEC = Object.freeze({
  specVersion: "story_assembly_spec_v1",
  episode: 11,
  imageCharacter: "owl3dv5",
  imagePrefix: "story_ep11",
  sceneBackgrounds: Object.freeze({
    P: { label: "제철소 정문 앞 광장(15번 부엉박사)", image: "밝은 오후 한국 제철소 정문 앞 광장. 부엉박사 뒤로 글자 없는 대형 제철 설비 건물과 굴뚝이 보이고, 바닥은 매끈한 연한 회색 포장, 따뜻한 오후 햇빛.", videoStyle: "bright afternoon plaza in front of a Korean steel mill gate with a large plain steelworks building and chimneys, smooth light gray pavement, warm afternoon light", videoStatics: "the plain steelworks building, the chimneys, the smooth light gray pavement, and the warm afternoon light" },
  }),
  scenes: Object.freeze([
    {
      scene: 15, key: "s15_close", role: "save", video: "story_ep11_s15_close_motion.mp4",
      narration: "막힌 길 앞에서 새 돈을 찾는 대신, 손에 쥔 돈의 쓰임을 다시 따져 본 선택이 쇳물이 된 거야. 제철소 이야기가 더 궁금하면 팔로우해 줘.",
      imageBrief: "부엉이가 정면을 보며 한쪽 날개를 가슴 앞에 가볍게 모아 차분히 정리해 주는 듯한 따뜻한 표정으로 시청자에게 말하는 포즈, 다른 날개는 자연스럽게 내리고 소품은 들지 않음. 구도 규칙(가장 중요): 부엉이는 화면 아래쪽 절반(세로 45~95%)에 서 있고 머리·얼굴·선글라스는 세로 45%보다 아래에 오게 하며, 화면 위쪽 40%에는 부엉이 없이 건물·하늘·조명 같은 배경만 보이게 해.",
      shot: "medium", bg: "P",
      lock: "the steelworks building and the chimneys stay fixed; the sunglasses stay on top of the head; no props are held.",
      speaks: true,
      motion: motion("the character gestures gently with one wing at chest height while summarizing, then gives a small warm nod to the viewer; no props are held", "warm summary and invitation to follow"),
    },
  ]),
});

// ── 조립 스펙(run-owl-assemble-shorts-v2.mjs) — 제목은 ★임시안(Owner 확정 필요) ──
// 조립: node scripts/run-owl-assemble-shorts-v2.mjs --spec-module ./_story-ep11-assembly-spec.mjs --spec-export STORY_EP11_ASSEMBLE_SPEC --clip-dir C:/tmp/story-ep11-clips-named --audio-summary C:/tmp/money-shorts-os/story-ep11-tts/output-v1/tempo-1.2-gap0.25-pre/elevenlabs-scene-paced-tts-summary.audio-fixed.tempo1.2-gap0.25-pre.json --tts-script C:/tmp/money-shorts-os/story-ep11-tts/story-ep11-tts-script.json --out-dir C:/tmp/story-ep11-assembled
const STORY_RENDER = Object.freeze({
  width: 1080, height: 1920, fps: 24, videoCodec: "libx264", crf: 18, pixFmt: "yuv420p",
  audioCodec: "aac", audioBitrate: "192k", audioSampleRate: 48000, audioChannels: 1,
});

export const STORY_EP11_FULL_SPEC = Object.freeze({
  ...STORY_EP11_SEMI_SPEC,
  sceneBackgrounds: Object.freeze({ ...STORY_EP11_SEMI_SPEC.sceneBackgrounds, ...STORY_EP11_END_SPEC.sceneBackgrounds }),
  scenes: Object.freeze([...STORY_EP11_SEMI_SPEC.scenes, ...STORY_EP11_END_SPEC.scenes]),
});

export const STORY_EP11_ASSEMBLE_SPEC = Object.freeze({
  ...STORY_EP11_FULL_SPEC,
  headerTitle: Object.freeze(["빌릴 곳 없자","농어업 몫을 돌려","지은 제철소"]),
  videoShiftDownPx: 230,
  videoShiftFadePx: 260,
  headerTopY: 345,
  headerScrimHeight: 780,
  captionFontSize: 102,
  captionY: 1385,
  captionPlanner: "scene_dp_v1",
  footerChannelBar: false,
  captionLayout: "v2",
  emphasisTerms: Object.freeze(["세계은행","청구권","포스코","제철소","흑자","착공","준공"]),
  emphasisNumberPatterns: Object.freeze(["[0-9,.]+%","[0-9]+배","[0-9]+명","[0-9,.]+억","[0-9,.]+만"]),
  captionEmphasisPop: true,
  captionGapBridgeSec: 0.3,
  captionLastSceneNoMargin: true,
  captionSceneEndMarginSec: 0.1,
  captionLeadSec: 0.12,
  captionWidthExceptions: Object.freeze([
    { line: "'시기상조'라고", reason: "한 어절 816px — 줄바꿈으로 못 품(안전폭 864 이내, 글자 크기 102px 유지)" },
  ]),
  hookType: "story",
  render: STORY_RENDER,
  scenes: Object.freeze(STORY_EP11_FULL_SPEC.scenes.map((s) => Object.freeze({ ...s, overlays: [] }))),
});

