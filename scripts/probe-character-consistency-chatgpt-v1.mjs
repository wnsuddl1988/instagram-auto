/**
 * 캐릭터 일관성 probe (ChatGPT 이미지, 단일 대화 연속 생성 방식)
 *
 * 목적:
 *   벤치마킹 채널(moneyhunter_kr)은 3D 리깅이 아니라 2D 일러스트 마스코트의
 *   "포즈별 그림"을 장면마다 교체해서 생동감을 만든다. 그 방향으로 가려면
 *   "같은 캐릭터가 여러 포즈에서 동일 인물로 보이는가"가 유일한 핵심 리스크다.
 *   이 probe 는 그 한 가지만 검증한다.
 *
 * 설계 (일관성 최대화):
 *   - 새 대화 1개를 열고 이미지 도구를 켠 뒤, 같은 대화 안에서 순차로 N개 포즈를 요청한다.
 *     같은 대화 맥락을 유지하면 모델이 직전 캐릭터를 참조하므로, 매번 새 대화를 여는
 *     reference-free 방식보다 동일성이 크게 올라간다.
 *   - 1번째 프롬프트만 전체 캐릭터 정의(IDENTITY)를 담고,
 *     2번째부터는 "같은 캐릭터 그대로, 포즈만" 을 명시한다.
 *
 * 안전:
 *   - 기존 _chatgpt-image-core.mjs 의 검증된 로직만 재사용한다.
 *   - ALLOW_CHATGPT_IMAGE=1 fail-closed guard (기존 유료 이미지 스크립트와 동일 규약).
 *   - 산출물은 repo 밖 --out-dir 에만 저장한다.
 *   - .env.local / .money-shorts-local 접근 없음, 외부 API 직접 호출 없음.
 *
 * 사용:
 *   node scripts/probe-character-consistency-chatgpt-v1.mjs \
 *     --out-dir C:\tmp\char-consistency-probe-v1 [--preflight-only]
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { failFast } from "./_owl-browser-diagnostics.mjs";

import {
  CDP_PORT_GPT1, USER_DATA_GPT1,
  ensureChrome, checkLogin, detectStop,
  typePrompt, checkSendEnabled, sendPrompt,
  isAssistantDone, interceptRecover,
  activateImageTool, openFreshImageChat,
  CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX, IMAGE_TOOL_PROMPT_ROUTING_FALLBACK,
  PROMPT_COMPOSER_SELECTOR,
} from "./_chatgpt-image-core.mjs";

/**
 * 현재 ChatGPT UI 대응 이미지 수집기.
 *
 * 이력: 2026-09-17에 이미 한 번 같은 종류의 UI 변경([data-message-author-role
 * ="assistant"] 소실)을 겪어, 문서 전체에서 URL 패턴(estuary/oaiusercontent)
 * 기준으로 수집하도록 고쳤었다. 그런데 2026-09-26 재확인 결과 결과 이미지가
 * 이제 blob: URL로 렌더링돼 그 URL 필터도 무효화돼 있었다(실측: 생성된
 * 물음표 카드 이미지가 button[data-testid="generated-image-preview"] 안에
 * blob:https://chatgpt.com/... 로 존재, 참조 이미지 쪽은
 * .group\/user-message 조상을 가짐). URL 패턴이 계속 바뀌는 걸 확인했으니,
 * 이번엔 "생성된 이미지"라는 의미가 명확한 data-testid를 1순위로 쓰고,
 * 옛 URL 패턴은 그 testid가 없을 때만 쓰는 fallback으로 낮춘다.
 */
async function collectGeneratedImages(page) {
  return await page.evaluate(() => {
    function cid(s) {
      const m = (s || "").match(/[?&]id=([^&]+)/);
      return m ? m[1] : null;
    }
    const seen = new Set();
    const out = [];
    const previewImgs = new Set();
    document.querySelectorAll('[data-testid="generated-image-preview"] img').forEach((i) => previewImgs.add(i));
    // DOM 순서(documentPosition) 기준 인덱스와 화면상 top 좌표를 함께 기록한다.
    // 첨부한 참조 이미지가 대화 상단에 남아있으면 top<0(화면 밖, 스크롤 위로
    // 밀려남)이거나 documentIndex가 더 작다 — 이 정보로 "가장 최근 assistant
    // 응답의 결과 이미지"를 해상도가 아니라 위치로 정확히 골라낸다
    // (2026-09-17 실측: 참조 이미지가 생성 결과보다 해상도가 커서 크기 기준
    // 정렬로는 항상 참조 이미지가 잘못 선택됐다).
    const allImgs = Array.from(document.querySelectorAll("img"));
    allImgs.forEach((i, documentIndex) => {
      const src = i.src || i.currentSrc || "";
      if (!src || i.naturalWidth < 400) return;
      const isGeneratedPreview = previewImgs.has(i);
      const isLegacyUrlMatch = /backend-api\/estuary\/content|oaiusercontent/.test(src);
      if (!isGeneratedPreview && !isLegacyUrlMatch) return;
      // 참조 이미지 첨부는 .group/user-message 조상을 갖는다 — testid로
      // 이미 걸러졌어도 이중 안전장치로 한 번 더 배제한다.
      let el = i, isUserAttachment = false;
      for (let d = 0; d < 12 && el; d += 1) {
        if (/group\/user-message/.test((el.className || "").toString())) { isUserAttachment = true; break; }
        el = el.parentElement;
      }
      if (isUserAttachment) return;
      const id = cid(src);
      const key = id || src;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        src, cid: id, w: i.naturalWidth, h: i.naturalHeight, gen: true,
        documentIndex, top: i.getBoundingClientRect().top,
      });
    });
    return out;
  });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return null;
}
const PREFLIGHT_ONLY = argv.includes("--preflight-only");
const FULL_POSES = argv.includes("--full-poses");
const CHARACTER_SHEET_MODE = argv.includes("--character-sheet");
const SCENE_BACKGROUND_MODE = argv.includes("--scene-background");
const PA5AE_8SCENE_MODE = argv.includes("--pa5ae-8scene");
const FRAME_STABILITY_MODE = argv.includes("--frame-stability");
const CANDIDATE_02_8SCENE_MODE = argv.includes("--candidate-02-8scene");
const CANDIDATE_02_8SCENE_RESUME_MODE = argv.includes("--candidate-02-8scene-resume");
// 스타일 후보 비교용: candidate-02 Scene 1(hook)만 생성해 기존 2D 버전과 나란히
// 비교한다. 8장을 다 뽑고 나서 스타일이 마음에 안 드는 사고를 막기 위한 단일 샘플.
const STYLE_PROBE_S1_MODE = argv.includes("--style-probe-s1");
// 부엉이 v5의 "날카롭고 냉철한" 표정이 손실회피(우려)·반전(확신) 같은 다른
// 감정에서도 캐릭터가 깨지지 않고 유지되는지 2장만으로 먼저 검증하는 모드.
const OWL_EMOTION_PROBE_MODE = argv.includes("--owl-emotion-probe");
// candidate-02 8장 전체를 owl3dv5(3D 부엉이 애널리스트, 최종 확정 캐릭터)로 생성.
const OWL_8SCENE_MODE = argv.includes("--owl-8scene");
// 2편(가계부채 목표 근접 vs 규제 유지) 8장면. POSES_OWL_EP2_8SCENE 사용.
const OWL_EP2_8SCENE_MODE = argv.includes("--owl-ep2-8scene");
// 8장 중 특정 장면만 재생성(예: HC-10 위반 발견 시 해당 장면만 재작업). 값은
// POSES_OWL_8SCENE 의 id 접두 없는 장면 번호(예: "7") 또는 정확한 id.
const OWL_8SCENE_ONLY = getArg("--owl-8scene-only");
// 2편 버전: POSES_OWL_EP2_8SCENE 에서 단일 장면만 재생성.
const OWL_EP2_8SCENE_ONLY = getArg("--owl-ep2-8scene-only");
// 3편(전세난 역설·HUG 안심신탁) 11장면. 8장면 고정 규칙 폐기(2026-09-17
// Owner 승인) 이후 첫 편이라 장면 수가 8이 아니다. POSES_OWL_EP3_11SCENE 사용.
const OWL_EP3_11SCENE_MODE = argv.includes("--owl-ep3-11scene");
// 3편 버전: POSES_OWL_EP3_11SCENE 에서 단일 장면만 재생성.
const OWL_EP3_11SCENE_ONLY = getArg("--owl-ep3-11scene-only");
// 4편(초소형 아파트 급등) 9장면. real_estate 도메인, action을 3개 씬으로
// 분할하는 새 표준(2026-09-18 Owner 확정) 적용 첫 편. POSES_OWL_EP4_9SCENE 사용.
const OWL_EP4_9SCENE_MODE = argv.includes("--owl-ep4-9scene");
// 4편 버전: POSES_OWL_EP4_9SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP4_9SCENE_ONLY = getArg("--owl-ep4-9scene-only");
// 5편(한국은행 11월 추가 인상, macro_rate 도메인) 10장면. impact 2분할(대출자/
// 자산시장) + action 3분할(변동금리 대출자/신규 대출 예정자/투자자) 표준 적용.
// 씬 1~8만 ChatGPT로 생성(Flow는 씬 9~10). POSES_OWL_EP5_10SCENE 사용.
const OWL_EP5_10SCENE_MODE = argv.includes("--owl-ep5-10scene");
// 5편 버전: POSES_OWL_EP5_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP5_10SCENE_ONLY = getArg("--owl-ep5-10scene-only");
// 6편(IRP 안전자산 30% 규정, investing 도메인) 9장면. 배경을 증권사/은행
// 상담 라운지로 새로 설계(1~5편 사무실/거실 반복 탈피). POSES_OWL_EP6_9SCENE 사용.
const OWL_EP6_9SCENE_MODE = argv.includes("--owl-ep6-9scene");
// 6편 버전: POSES_OWL_EP6_9SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP6_9SCENE_ONLY = getArg("--owl-ep6-9scene-only");
// 7편(3배 레버리지 ETF, investing 도메인) 9장면. 배경을 홈트레이딩 데스크로
// 새로 설계(1~6편 사무실/거실/증권사 라운지 반복 탈피). POSES_OWL_EP7_9SCENE 사용.
const OWL_EP7_9SCENE_MODE = argv.includes("--owl-ep7-9scene");
// 7편 버전: POSES_OWL_EP7_9SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP7_9SCENE_ONLY = getArg("--owl-ep7-9scene-only");
// 8편(투자경고 종목, 4건 중 1건 30% 급락) 10장면 — 오프닝 신설로 부엉이 편
// 최초로 10장면 구성(1~7편은 8~9장면). 배경을 증권사 트레이딩룸/리서치
// 데스크로 새로 설계(1~7편 반복 탈피). POSES_OWL_EP8_10SCENE 사용.
const OWL_EP8_10SCENE_MODE = argv.includes("--owl-ep8-10scene");
// 8편 버전: POSES_OWL_EP8_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP8_10SCENE_ONLY = getArg("--owl-ep8-10scene-only");
// 9편(카드론·현금서비스가 신용점수를 깎는 구조) 10장면 — Owner 요청으로 현실적
// 대안(서민금융진흥원 1397) 장면을 신설해 9씬→10씬으로 확장. 배경을 은행
// 창구/모바일뱅킹 앱 UI 공간으로 새로 설계(1~8편 반복 탈피). POSES_OWL_EP9_10SCENE 사용.
const OWL_EP9_10SCENE_MODE = argv.includes("--owl-ep9-10scene");
// 9편 버전: POSES_OWL_EP9_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP9_10SCENE_ONLY = getArg("--owl-ep9-10scene-only");
// 10편(국민연금 보험료율 9%→13% 인상, 27년 만의 인상) 10장면. 배경을 국민연금공단
// 상담 창구/공적 서류 발급 데스크로 새로 설계(1~9편 반복 탈피). POSES_OWL_EP10_10SCENE 사용.
const OWL_EP10_10SCENE_MODE = argv.includes("--owl-ep10-10scene");
// 10편 버전: POSES_OWL_EP10_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP10_10SCENE_ONLY = getArg("--owl-ep10-10scene-only");
// 11편(고용률 8월 사상 첫 70% 돌파 vs 청년고용 46개월 연속 감소) 10장면. 배경을
// 통계청/고용센터 상담 데스크로 새로 설계(1~10편 반복 탈피). POSES_OWL_EP11_10SCENE 사용.
const OWL_EP11_10SCENE_MODE = argv.includes("--owl-ep11-10scene");
// 11편 버전: POSES_OWL_EP11_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP11_10SCENE_ONLY = getArg("--owl-ep11-10scene-only");
// 12편(토지거래허가구역 실거주 유예 1년 연장) 10장면. 배경을 부동산 중개사무소/
// 구청 민원 상담 데스크로 새로 설계(1~11편 반복 탈피). POSES_OWL_EP12_10SCENE 사용.
const OWL_EP12_10SCENE_MODE = argv.includes("--owl-ep12-10scene");
// 12편 버전: POSES_OWL_EP12_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP12_10SCENE_ONLY = getArg("--owl-ep12-10scene-only");
// 13편(퇴직연금 실물이전) 10장면. 배경을 퇴직연금 고객센터 상담 데스크로 새로
// 설계(1~12편 반복 탈피). POSES_OWL_EP13_10SCENE 사용.
const OWL_EP13_10SCENE_MODE = argv.includes("--owl-ep13-10scene");
// 13편 버전: POSES_OWL_EP13_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP13_10SCENE_ONLY = getArg("--owl-ep13-10scene-only");
// 14편(한은 금융안정 상황 경고) — POSES_OWL_EP14_10SCENE 사용.
const OWL_EP14_10SCENE_MODE = argv.includes("--owl-ep14-10scene");
// 14편 버전: POSES_OWL_EP14_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP14_10SCENE_ONLY = getArg("--owl-ep14-10scene-only");
// 15편(재고, 실업급여 22년 만의 개편) — POSES_OWL_EP15_10SCENE 사용. 배경을
// 고용노동부 정책 브리핑룸으로 새로 설계(11편 고용센터 상담 데스크와는 톤 구분).
const OWL_EP15_10SCENE_MODE = argv.includes("--owl-ep15-10scene");
// 15편 버전: POSES_OWL_EP15_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP15_10SCENE_ONLY = getArg("--owl-ep15-10scene-only");
// 16편(2027년 최저임금 확정, 실업급여 하한액 연동) — POSES_OWL_EP16_10SCENE 사용.
// 배경을 최저임금위원회 심의장으로 새로 설계(15편 정책 브리핑룸과 톤 구분).
const OWL_EP16_10SCENE_MODE = argv.includes("--owl-ep16-10scene");
// 16편 버전: POSES_OWL_EP16_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP16_10SCENE_ONLY = getArg("--owl-ep16-10scene-only");
// 17편(청약통장 종합저축 전환 기한 1년 연장) — POSES_OWL_EP17_10SCENE 사용.
const OWL_EP17_10SCENE_MODE = argv.includes("--owl-ep17-10scene");
// 17편 버전: POSES_OWL_EP17_10SCENE 에서 단일 장면(또는 콤마 구분 다중 장면)만 재생성.
const OWL_EP17_10SCENE_ONLY = getArg("--owl-ep17-10scene-only");
// v2 재제작 11편(청약통장, 씬 구조 v2) — 새로 만드는 5장면만(나머지는 17편 v1 재사용).
// 배경은 OWL_EP17_BG 그대로. POSES_OWL_V2_EP11_5SCENE 사용.
const OWL_V2_EP11_5SCENE_MODE = argv.includes("--owl-v2-ep11-5scene");
const OWL_V2_EP11_5SCENE_ONLY = getArg("--owl-v2-ep11-5scene-only");
// v2 재제작 12편(토지거래허가구역 실거주 유예) — 새로 만드는 4장면만(나머지는 12편 v1 재사용).
const OWL_V2_EP12_4SCENE_MODE = argv.includes("--owl-v2-ep12-4scene");
const OWL_V2_EP12_4SCENE_ONLY = getArg("--owl-v2-ep12-4scene-only");
// v2 재제작 13편(고용률·청년 취업 지원) — 새로 만드는 5장면만(나머지는 v1 파일 ep11 재사용).
const OWL_V2_EP13_5SCENE_MODE = argv.includes("--owl-v2-ep13-5scene");
const OWL_V2_EP13_5SCENE_ONLY = getArg("--owl-v2-ep13-5scene-only");
// v2 재제작 14편(국민연금 보험료 2027년 10%) — 새로 만드는 5장면만(나머지는 v1 파일 ep10 재사용).
const OWL_V2_EP14_5SCENE_MODE = argv.includes("--owl-v2-ep14-5scene");
const OWL_V2_EP14_5SCENE_ONLY = getArg("--owl-v2-ep14-5scene-only");
// v2 재제작 15편(실업급여 22년 만의 개편) — 새로 만드는 9장면만(나머지 6장면은 v1 파일 ep15 재사용).
const OWL_V2_EP15_9SCENE_MODE = argv.includes("--owl-v2-ep15-9scene");
const OWL_V2_EP15_9SCENE_ONLY = getArg("--owl-v2-ep15-9scene-only");
// v2 재제작 16편(퇴직연금 실물이전) — 새로 만드는 10장면만(나머지 6장면은 v1 파일 ep13 재사용).
const OWL_V2_EP16_10SCENE_MODE = argv.includes("--owl-v2-ep16-10scene");
const OWL_V2_EP16_10SCENE_ONLY = getArg("--owl-v2-ep16-10scene-only");
// v2 재제작 17편(2027 최저임금) — 새로 만드는 8장면만(나머지 8장면은 v1 파일 ep16 재사용).
const OWL_V2_EP17_8SCENE_MODE = argv.includes("--owl-v2-ep17-8scene");
const OWL_V2_EP17_8SCENE_ONLY = getArg("--owl-v2-ep17-8scene-only");
// v2 신규 18편(전세사기 최소보장제, 재제작 7편 이후 첫 신규 소재) — 재사용
// 원본이 없어 17장면 전부 신규 생성.
const OWL_V2_EP18_15SCENE_MODE = argv.includes("--owl-v2-ep18-15scene");
const OWL_V2_EP18_15SCENE_ONLY = getArg("--owl-v2-ep18-15scene-only");
// 부엉이 고정 CTA v2(팔로우+티저 2장면) — Owner 지적으로 기존 CTA(follow/teaser
// 배경 불일치, 목소리 톤 단절, "부엉박사" 캐릭터명 누락)를 전면 재작업. 1~9편
// 어디와도 안 겹치면서 어떤 편에 붙여도 무난한 방송국/뉴스 스튜디오 톤으로
// 새로 설계. 앞으로 모든 편에 공용으로 붙이는 고정 자산이 된다.
const OWL_CTA_FIXED_V2_MODE = argv.includes("--owl-cta-fixed-v2");
const OWL_CTA_FIXED_V2_ONLY = getArg("--owl-cta-fixed-v2-only");
// 6편/7편 오프닝 소급 추가(2026-09-20 Owner 지적: "6편과 7편 보면 8~9편과
// 다르게 맨앞 오프닝멘트 영상이 없잖아") — 8편부터 신설된 "안녕, 난 매일
// 경제 뉴스를 콕 집어 전해주는 부엉박사야! 오늘은 [주제] 얘기해볼게." 오프닝
// 고정 템플릿을 6, 7편에도 소급 적용. 각 편 단일 오프닝 씬 1개만 생성해
// 기존 조립본 맨 앞에 이어붙인다. 배경은 각 편 기존 배경(6편: 증권사·은행
// 상담 라운지 / 7편: 홈트레이딩 데스크)과 반드시 동일해야 한다.
const OWL_EP6_OPENING_MODE = argv.includes("--owl-ep6-opening");
const OWL_EP7_OPENING_MODE = argv.includes("--owl-ep7-opening");
// 금박사(coin3dv1) 1편(IRP 세액공제 기초) 9장면. 부엉이와 완전히 별도 트랙 —
// 오버레이 없이 이미지 소품/화면에 실제 수치·문구를 직접 그려 넣는 방식으로
// 처음부터 설계됨(2026-09-19 Owner 확정). POSES_GEUMBAKSA_EP1_9SCENE 사용.
const GEUMBAKSA_EP1_9SCENE_MODE = argv.includes("--geumbaksa-ep1-9scene");
// 금박사 1편 버전: POSES_GEUMBAKSA_EP1_9SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성.
const GEUMBAKSA_EP1_9SCENE_ONLY = getArg("--geumbaksa-ep1-9scene-only");
// 금박사 전용 클로징(팔로우 유도, 부엉이 CTA 재사용 금지) — POSES_GEUMBAKSA_CTA_FOLLOW.
const GEUMBAKSA_CTA_FOLLOW_MODE = argv.includes("--geumbaksa-cta-follow");
// 금박사 2편(ETF 기초) 11장면 — scripts/_geumbaksa-ep2-assembly-spec.mjs.
// 1편과 동일 원칙(오버레이 없음, 소품에 실제 수치·문구 직접 기입, 부엉이 7편
// 선행 설명 역할). POSES_GEUMBAKSA_EP2_11SCENE 사용.
const GEUMBAKSA_EP2_11SCENE_MODE = argv.includes("--geumbaksa-ep2-11scene");
// 금박사 2편 버전: POSES_GEUMBAKSA_EP2_11SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성.
const GEUMBAKSA_EP2_11SCENE_ONLY = getArg("--geumbaksa-ep2-11scene-only");
// 금박사 3편(레버리지 원리·리스크) 10장면. 2026-09-20부터 파일명 규칙 변경 —
// 원본 role 이름(s6a/s6b 등) 대신 실제 scene 순번(1~10)만 쓴다.
const GEUMBAKSA_EP3_10SCENE_MODE = argv.includes("--geumbaksa-ep3-10scene");
// 금박사 3편 버전: POSES_GEUMBAKSA_EP3_10SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~10)으로만 지정한다.
const GEUMBAKSA_EP3_10SCENE_ONLY = getArg("--geumbaksa-ep3-10scene-only");
// 금박사 4편(파일명 순번, 실제 배포는 1편 — 환율의 원리와 파급 효과) 11장면.
// 3편과 동일하게 파일명은 scene 순번만 쓴다(geumbaksa_ep4_s1 ~ geumbaksa_ep4_s11).
const GEUMBAKSA_EP4_11SCENE_MODE = argv.includes("--geumbaksa-ep4-11scene");
// 금박사 4편 버전: POSES_GEUMBAKSA_EP4_11SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~11)으로만 지정한다.
const GEUMBAKSA_EP4_11SCENE_ONLY = getArg("--geumbaksa-ep4-11scene-only");
// 금박사 5편(신용점수 개념·평가항목·실제영향·오해바로잡기·회복구조) 10장면.
// 3~4편과 동일하게 파일명은 scene 순번만 쓴다(geumbaksa_ep5_s1 ~ geumbaksa_ep5_s10).
const GEUMBAKSA_EP5_10SCENE_MODE = argv.includes("--geumbaksa-ep5-10scene");
// 금박사 5편 버전: POSES_GEUMBAKSA_EP5_10SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~10)으로만 지정한다.
const GEUMBAKSA_EP5_10SCENE_ONLY = getArg("--geumbaksa-ep5-10scene-only");
// 금박사 파일 ep5(표시 7편) s4 재생성용 기준 이미지(2026-09-26) — 원본 이미지가 없고 기존
// 클립 첫 프레임에는 헤더·하단 바가 새겨져 있어, 첫 프레임 구도를 그대로 살린 깨끗한 이미지를 새로 만든다.
const GEUMBAKSA_EP5_S4_FIX_MODE = argv.includes("--geumbaksa-ep5-s4-fix");
// 금박사 6편(국민연금 소득대체율 43%, 진짜 내 몫은 얼마일까) 10장면. 부엉박사
// 10편(국민연금 보험료율 인상)에서 언급만 되고 안 풀린 "소득대체율"을 금박사가
// 이어받아 개인화해서 풀어주는 구성. 파일명은 scene 순번만 쓴다
// (geumbaksa_ep6_s1 ~ geumbaksa_ep6_s10).
const GEUMBAKSA_EP6_10SCENE_MODE = argv.includes("--geumbaksa-ep6-10scene");
// 금박사 6편 버전: POSES_GEUMBAKSA_EP6_10SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~10)으로만 지정한다.
const GEUMBAKSA_EP6_10SCENE_ONLY = getArg("--geumbaksa-ep6-10scene-only");
// 금박사 7편(예금자보호 한도 1억원) 11장면. 이번 편은 부엉박사와 연계하지 않는
// 독립 소재(마땅한 연계 소재가 없어 예외 적용, 2026-09-22 확정). 파일명은
// scene 순번만 쓴다(geumbaksa_ep7_s1 ~ geumbaksa_ep7_s11).
const GEUMBAKSA_EP7_11SCENE_MODE = argv.includes("--geumbaksa-ep7-11scene");
// 금박사 7편 버전: POSES_GEUMBAKSA_EP7_11SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~11)으로만 지정한다.
const GEUMBAKSA_EP7_11SCENE_ONLY = getArg("--geumbaksa-ep7-11scene-only");
// 금박사 8편(표시번호, 토지거래허가구역) 8장면. 부엉박사 12편 연계 소재.
// 파일명은 scene 순번만 쓴다(geumbaksa_ep8_s1 ~ geumbaksa_ep8_s8).
const GEUMBAKSA_EP8_8SCENE_MODE = argv.includes("--geumbaksa-ep8-8scene");
// 금박사 8편 버전: POSES_GEUMBAKSA_EP8_8SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~8)으로만 지정한다.
const GEUMBAKSA_EP8_8SCENE_ONLY = getArg("--geumbaksa-ep8-8scene-only");
// 금박사 9편(표시번호, 퇴직연금 DB형·DC형·IRP) 9장면. 부엉박사 13편 연계 소재.
// 파일명은 scene 순번만 쓴다(geumbaksa_ep9_s1 ~ geumbaksa_ep9_s9).
const GEUMBAKSA_EP9_9SCENE_MODE = argv.includes("--geumbaksa-ep9-9scene");
// 금박사 9편 버전: POSES_GEUMBAKSA_EP9_9SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~9)으로만 지정한다.
const GEUMBAKSA_EP9_9SCENE_ONLY = getArg("--geumbaksa-ep9-9scene-only");
// 금박사 10편(표시번호, 실업급여 최저액 계산법) 9장면. 부엉박사 16편
// (최저임금 10,700원 확정→실업급여 하한액 연동, 계산식만 언급되고 안 풀림)
// 연계 소재. 파일명은 scene 순번만 쓴다(geumbaksa_ep10_s1 ~ geumbaksa_ep10_s9).
const GEUMBAKSA_EP10_9SCENE_MODE = argv.includes("--geumbaksa-ep10-9scene");
// 금박사 10편 버전: POSES_GEUMBAKSA_EP10_9SCENE 에서 단일 장면(또는 콤마
// 구분 다중 장면)만 재생성. 순번(1~9)으로만 지정한다.
const GEUMBAKSA_EP10_9SCENE_ONLY = getArg("--geumbaksa-ep10-9scene-only");
// 금박사 11편(신규 제작, 오프닝 훅 뒤 재배치 첫 편, 주휴수당) 11장면. 부엉박사
// 17편(2027 최저임금 확정, 주휴수당은 이름만 언급) 연계 소재. 파일명은 scene
// 순번만 쓴다(geumbaksa_ep11_s1 ~ geumbaksa_ep11_s11).
const GEUMBAKSA_EP11_11SCENE_MODE = argv.includes("--geumbaksa-ep11-11scene");
// 금박사 11편 버전: POSES_GEUMBAKSA_EP11_11SCENE 에서 단일 장면(또는 콤마
// 구분 다중 장면)만 재생성. 순번(1~11)으로만 지정한다.
const GEUMBAKSA_EP11_11SCENE_ONLY = getArg("--geumbaksa-ep11-11scene-only");
// 황소특보 1편(반도체 섹터 강세 원인체인) 9장면. 부엉박사/금박사와 동일하게
// 파일명은 scene 순번만 쓴다(bull_ep1_s1 ~ bull_ep1_s9).
const BULL_EP1_9SCENE_MODE = argv.includes("--bull-ep1-9scene");
// 황소특보 1편 버전: POSES_BULL_EP1_9SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~9)으로만 지정한다.
const BULL_EP1_9SCENE_ONLY = getArg("--bull-ep1-9scene-only");
// 황소특보 2편(레버리지 ETF 반전 수급) 9장면. 파일명은 scene 순번만 쓴다
// (bull_ep2_s1 ~ bull_ep2_s9).
const BULL_EP2_9SCENE_MODE = argv.includes("--bull-ep2-9scene");
// 황소특보 2편 버전: POSES_BULL_EP2_9SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~9)으로만 지정한다.
const BULL_EP2_9SCENE_ONLY = getArg("--bull-ep2-9scene-only");
// 황소특보 3편(반도체 랠리 착시, 외국인 종목별 반대 베팅) 10장면 — 대본
// 구조 v2([[project_bull_script_structure_v2_confirmed]])의 최초 적용편.
// 파일명은 scene 순번만 쓴다(bull_ep3_s1 ~ bull_ep3_s10).
const BULL_EP3_10SCENE_MODE = argv.includes("--bull-ep3-10scene");
// 씬 구조 v3([[project_bull_script_structure_v3_confirmed_2026_09_26]]) 최초
// 적용편. 파일명은 scene 순번만 쓴다(bull_ep4_s1 ~ bull_ep4_s14).
const BULL_EP4_14SCENE_MODE = argv.includes("--bull-ep4-14scene");
// 황소특보 3편 버전: POSES_BULL_EP3_10SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~10)으로만 지정한다.
const BULL_EP3_10SCENE_ONLY = getArg("--bull-ep3-10scene-only");
// 황소특보 4편 버전: POSES_BULL_EP4_14SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~14)으로만 지정한다.
const BULL_EP4_14SCENE_ONLY = getArg("--bull-ep4-14scene-only");
// 씬 구조 v3 두 번째 적용편(반도체 기판주 재급등, 메타 '뮤즈' CPU 랠리).
// 9.5초 규칙 초과 씬(원래 14씬 중 s9/s10/s13)을 문장 경계에서만 나눠
// 17씬으로 확장(Owner 지시: 내용 압축 대신 자연스러운 흐름 유지, 2026-09-27).
// 파일명은 scene 순번만 쓴다(bull_ep5_s1 ~ bull_ep5_s17).
const BULL_EP5_17SCENE_MODE = argv.includes("--bull-ep5-17scene");
// 황소특보 5편 버전: POSES_BULL_EP5_17SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~17)으로만 지정한다.
const BULL_EP5_17SCENE_ONLY = getArg("--bull-ep5-17scene-only");
// 황소특보 6편(삼성전자 3분기 배당 마지막 매수일) 18장면. 파일명은 scene
// 순번만 쓴다(bull_ep6_s1 ~ bull_ep6_s18).
const BULL_EP6_18SCENE_MODE = argv.includes("--bull-ep6-18scene");
// 황소특보 6편 버전: POSES_BULL_EP6_18SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~18)으로만 지정한다.
const BULL_EP6_18SCENE_ONLY = getArg("--bull-ep6-18scene-only");
// 황소특보 7편(국내 바이오사 FDA 승인 상한가) 16장면. 파일명은 scene
// 순번만 쓴다(bull_ep7_s1 ~ bull_ep7_s16).
const BULL_EP7_16SCENE_MODE = argv.includes("--bull-ep7-16scene");
// 황소특보 7편 버전: POSES_BULL_EP7_16SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~16)으로만 지정한다.
const BULL_EP7_16SCENE_ONLY = getArg("--bull-ep7-16scene-only");
// 황소특보 8편(미국 태양광 최저수입가격 랠리) 16장면. 파일명은 scene 순번만
// 쓴다(bull_ep8_s1 ~ bull_ep8_s16).
const BULL_EP8_16SCENE_MODE = argv.includes("--bull-ep8-16scene");
// 황소특보 8편 버전: POSES_BULL_EP8_16SCENE 에서 단일 장면(또는 콤마 구분
// 다중 장면)만 재생성. 순번(1~16)으로만 지정한다.
const BULL_EP8_16SCENE_ONLY = getArg("--bull-ep8-16scene-only");
// 황소특보 9편(오픈AI 신모델 출시 취소 × 마이크론 실적 D-1) 16장면. 파일명은 scene
// 순번만 쓴다(bull_ep9_s1 ~ bull_ep9_s16). --bull-ep9-16scene-only "3,7" 처럼 선택 재생성.
const BULL_EP9_16SCENE_MODE = argv.includes("--bull-ep9-16scene");
const BULL_EP9_16SCENE_ONLY = getArg("--bull-ep9-16scene-only");
// 황소특보 1편 배경 컨셉 비교(2안, 2026-09-23) — 최초 스펙이 CTA용 서재
// 배경을 기계적으로 재사용해 "반도체 강세"라는 소재와 개연성이 없다는
// Owner 지적으로 재설계. 트레이딩데스크/시황브리핑룸 vs 반도체 공장/클린룸
// 두 컨셉을 먼저 1장씩 비교한다.
const BULL_EP1_BG_COMPARE_MODE = argv.includes("--bull-ep1-bg-compare");
// 고정 CTA 시그니처 배경 비교(2안 생성) — 2026-09-17 Owner 결정.
const OWL_CTA_BG_COMPARE_MODE = argv.includes("--owl-cta-bg-compare");
// 위 2안 비교 후 확정된 3안(서재 소품 + 뉴스룸 톤)만 단독 생성.
const OWL_CTA_BG_EDGY_ONLY_MODE = argv.includes("--owl-cta-bg-edgy-only");
// 3안을 다듬은 4안(최종 후보) — 배경 단순화 + 팔로우 유도 제스처.
const OWL_CTA_BG_FINAL_ONLY_MODE = argv.includes("--owl-cta-bg-final-only");
// CTA 밝은 톤 리뉴얼(2026-09-18 Owner 확정) — 기존 owl_cta_bg_final(밤/네이비
// 톤)이 3편 이후 예고 클립과 이어붙이기엔 너무 어둡다는 지적에 따라, 밝은
// 톤으로 이미지 2장(팔로우 유도용 1장 + 다음 편 예고용 1장)을 새로 만든다.
// 두 장 다 배경 소품·톤은 통일하되 구도를 다르게 해 8초+8초를 이어붙였을 때
// 화면이 거의 안 바뀌는 지루함을 피한다. 1·2편에 이미 게시된 기존 CTA는
// 그대로 두고, 3편부터 이 밝은 톤으로 전체 교체한다(Owner 승인 범위).
const OWL_CTA_BRIGHT_V2_MODE = argv.includes("--owl-cta-bright-v2");
// follow(손가락 가리키기) 이미지가 3차 시도까지 손짓이 약하게만 나와,
// 이미 성공한 teaser는 건드리지 않고 follow 하나만 재시도할 수 있어야
// 한다(2026-09-18).
const OWL_CTA_BRIGHT_FOLLOW_ONLY_MODE = argv.includes("--owl-cta-bright-follow-only");
const OUT_DIR = getArg("--out-dir");
const CHARACTER = getArg("--character") || "cat";

if (!OUT_DIR) {
  // --character 기본값은 cat(초기 probe 실험 캐릭터)으로 하위 호환을 위해 그대로
  // 둔다. 부엉박사/금박사 실제 편 제작에는 owl3dv5/coin3dv1을 쓰고, 그때는 반드시
  // 해당 편 전용 모드 플래그(--owl-epN-...scene, --geumbaksa-epN-...scene 등)를
  // 함께 지정해야 한다 — 위쪽 캐릭터 불일치 가드가 이를 강제한다.
  console.error(
    "Usage: node scripts/probe-character-consistency-chatgpt-v1.mjs --out-dir <path outside repo> " +
      "--character <cat|calc|owl3dv5|coin3dv1|bull3dv1|vest> [--preflight-only] " +
      "[--owl-epN-...scene | --geumbaksa-epN-...scene | --bull-ep1-9scene | --owl-cta-fixed-v2 | ...] " +
      "(부엉박사/금박사/황소특보 실제 편 제작 시 --character owl3dv5|coin3dv1|bull3dv1 + 해당 편 전용 모드 플래그 필수)",
  );
  process.exit(1);
}

const OUT_DIR_ABS = path.resolve(OUT_DIR);
// 막혔을 때 사람이 직접 처리하고 이어갈 수 있게 한다(예: 로그인 세션 만료).
const MANUAL_ASSIST = process.argv.includes("--manual-assist");
if (OUT_DIR_ABS.startsWith(REPO_ROOT + "\\") || OUT_DIR_ABS.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out: ${OUT_DIR_ABS}`);
  process.exit(1);
}
if (OUT_DIR_ABS.includes(".money-shorts-local")) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ChatGPT image 경로 차단 (fail-closed). 필요한 env: ALLOW_CHATGPT_IMAGE=1");
  process.exit(2);
}

// --candidate-02-8scene은 PA-5AE에서 최종 검증된 조끼 버전(vest)의 canonical
// IDENTITY를 재사용해야 한다. 다른 --character를 무심코 넘기면 정체성이 다른
// 캐릭터로 콘텐츠가 만들어지는 사고가 되므로, 명시적 불일치는 즉시 차단한다.
if ((CANDIDATE_02_8SCENE_MODE || CANDIDATE_02_8SCENE_RESUME_MODE) && CHARACTER !== "vest") {
  console.error(
    "ABORT: --candidate-02-8scene(-resume)은 --character vest(PA-5AE canonical)와 함께 써야 합니다. " +
      `받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
// --owl-8scene은 3D 전환 확정 캐릭터인 owl3dv5(감정 폭 검증 통과)로만 실행해야
// 한다. 다른 --character를 무심코 넘기면 정체성이 다른 캐릭터로 콘텐츠가 만들어지는
// 사고가 되므로 즉시 차단한다.
if (
  (OWL_8SCENE_MODE || OWL_8SCENE_ONLY || OWL_EP2_8SCENE_MODE || OWL_EP2_8SCENE_ONLY ||
    OWL_EP3_11SCENE_MODE || OWL_EP3_11SCENE_ONLY || OWL_EP4_9SCENE_MODE || OWL_EP4_9SCENE_ONLY ||
    OWL_EP5_10SCENE_MODE || OWL_EP5_10SCENE_ONLY || OWL_EP6_9SCENE_MODE || OWL_EP6_9SCENE_ONLY ||
    OWL_EP7_9SCENE_MODE || OWL_EP7_9SCENE_ONLY || OWL_EP8_10SCENE_MODE || OWL_EP8_10SCENE_ONLY ||
    OWL_EP9_10SCENE_MODE || OWL_EP9_10SCENE_ONLY ||
    OWL_EP10_10SCENE_MODE || OWL_EP10_10SCENE_ONLY ||
    OWL_EP11_10SCENE_MODE || OWL_EP11_10SCENE_ONLY ||
    OWL_EP12_10SCENE_MODE || OWL_EP12_10SCENE_ONLY ||
    OWL_EP13_10SCENE_MODE || OWL_EP13_10SCENE_ONLY ||
    OWL_EP14_10SCENE_MODE || OWL_EP14_10SCENE_ONLY ||
    OWL_EP15_10SCENE_MODE || OWL_EP15_10SCENE_ONLY ||
    OWL_EP16_10SCENE_MODE || OWL_EP16_10SCENE_ONLY ||
    OWL_EP17_10SCENE_MODE || OWL_EP17_10SCENE_ONLY ||
    OWL_V2_EP11_5SCENE_MODE || OWL_V2_EP11_5SCENE_ONLY ||
    OWL_V2_EP12_4SCENE_MODE || OWL_V2_EP12_4SCENE_ONLY ||
    OWL_V2_EP13_5SCENE_MODE || OWL_V2_EP13_5SCENE_ONLY ||
    OWL_V2_EP14_5SCENE_MODE || OWL_V2_EP14_5SCENE_ONLY ||
    OWL_V2_EP15_9SCENE_MODE || OWL_V2_EP15_9SCENE_ONLY ||
    OWL_V2_EP16_10SCENE_MODE || OWL_V2_EP16_10SCENE_ONLY ||
    OWL_V2_EP17_8SCENE_MODE || OWL_V2_EP17_8SCENE_ONLY ||
    OWL_V2_EP18_15SCENE_MODE || OWL_V2_EP18_15SCENE_ONLY ||
    OWL_CTA_FIXED_V2_MODE || OWL_CTA_FIXED_V2_ONLY ||
    OWL_EP6_OPENING_MODE || OWL_EP7_OPENING_MODE) &&
  CHARACTER !== "owl3dv5"
) {
  console.error(
    `ABORT: --owl-8scene(-only)/--owl-ep3-11scene(-only)/--owl-ep4-9scene(-only)/--owl-ep5-10scene(-only)/--owl-ep6-9scene(-only)/--owl-ep8-10scene(-only)/--owl-ep9-10scene(-only)/--owl-ep10-10scene(-only)/--owl-ep11-10scene(-only)/--owl-ep12-10scene(-only)/--owl-ep13-10scene(-only)/--owl-ep14-10scene(-only)/--owl-ep15-10scene(-only)/--owl-ep16-10scene(-only)/--owl-ep17-10scene(-only)/--owl-cta-fixed-v2(-only)/--owl-ep6-opening/--owl-ep7-opening은 --character owl3dv5(최종 확정)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
// --geumbaksa-ep1-9scene은 금박사 캐릭터인 coin3dv1로만 실행해야 한다. 다른
// --character를 무심코 넘기면 부엉이 정체성으로 금박사 콘텐츠가 만들어지는
// 사고가 되므로 즉시 차단한다.
if (
  (GEUMBAKSA_EP1_9SCENE_MODE || GEUMBAKSA_EP1_9SCENE_ONLY || GEUMBAKSA_CTA_FOLLOW_MODE ||
    GEUMBAKSA_EP2_11SCENE_MODE || GEUMBAKSA_EP2_11SCENE_ONLY ||
    GEUMBAKSA_EP3_10SCENE_MODE || GEUMBAKSA_EP3_10SCENE_ONLY ||
    GEUMBAKSA_EP4_11SCENE_MODE || GEUMBAKSA_EP4_11SCENE_ONLY ||
    GEUMBAKSA_EP5_10SCENE_MODE || GEUMBAKSA_EP5_10SCENE_ONLY || GEUMBAKSA_EP5_S4_FIX_MODE ||
    GEUMBAKSA_EP6_10SCENE_MODE || GEUMBAKSA_EP6_10SCENE_ONLY ||
    GEUMBAKSA_EP7_11SCENE_MODE || GEUMBAKSA_EP7_11SCENE_ONLY ||
    GEUMBAKSA_EP8_8SCENE_MODE || GEUMBAKSA_EP8_8SCENE_ONLY ||
    GEUMBAKSA_EP9_9SCENE_MODE || GEUMBAKSA_EP9_9SCENE_ONLY ||
    GEUMBAKSA_EP10_9SCENE_MODE || GEUMBAKSA_EP10_9SCENE_ONLY ||
    GEUMBAKSA_EP11_11SCENE_MODE || GEUMBAKSA_EP11_11SCENE_ONLY) &&
  CHARACTER !== "coin3dv1"
) {
  console.error(
    `ABORT: --geumbaksa-ep1-9scene(-only)/--geumbaksa-cta-follow/--geumbaksa-ep2-11scene(-only)/--geumbaksa-ep3-10scene(-only)/--geumbaksa-ep4-11scene(-only)/--geumbaksa-ep5-10scene(-only)/--geumbaksa-ep6-10scene(-only)/--geumbaksa-ep7-11scene(-only)/--geumbaksa-ep10-9scene(-only)/--geumbaksa-ep11-11scene(-only) 는 --character coin3dv1(금박사)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
// --bull-ep1-9scene은 황소특보 캐릭터인 bull3dv1로만 실행해야 한다. 다른
// --character를 무심코 넘기면 다른 캐릭터 정체성으로 황소특보 콘텐츠가
// 만들어지는 사고가 되므로 즉시 차단한다.
if ((BULL_EP1_9SCENE_MODE || BULL_EP1_9SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep1-9scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if ((BULL_EP2_9SCENE_MODE || BULL_EP2_9SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep2-9scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if ((BULL_EP3_10SCENE_MODE || BULL_EP3_10SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep3-10scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if ((BULL_EP4_14SCENE_MODE || BULL_EP4_14SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep4-14scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if ((BULL_EP5_17SCENE_MODE || BULL_EP5_17SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep5-17scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if ((BULL_EP6_18SCENE_MODE || BULL_EP6_18SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep6-18scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if ((BULL_EP7_16SCENE_MODE || BULL_EP7_16SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep7-16scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if ((BULL_EP8_16SCENE_MODE || BULL_EP8_16SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep8-16scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if ((BULL_EP9_16SCENE_MODE || BULL_EP9_16SCENE_ONLY) && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep9-16scene(-only)은 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}
if (BULL_EP1_BG_COMPARE_MODE && CHARACTER !== "bull3dv1") {
  console.error(
    `ABORT: --bull-ep1-bg-compare는 --character bull3dv1(황소특보)와 함께 써야 합니다. 받은 값: --character ${CHARACTER}`,
  );
  process.exit(1);
}

fs.mkdirSync(OUT_DIR_ABS, { recursive: true });

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][charprobe] ${m}`); }
function warn(m) { console.warn(`[WARN][charprobe] ${m}`); }

// ── 캐릭터 후보 정의 (1번 프롬프트에만 전체 기술) ────────────────────────────
// 주의: 벤치마킹 채널(moneyhunter_kr)은 "지폐 의인화" 마스코트를 쓴다. 표절을 피하기
// 위해 돈 자체를 의인화하는 방향(지폐/동전)은 후보에서 제외한다. 참고하는 것은 캐릭터가
// 아니라 표현 방식(2D 플랫 일러스트 + 포즈 교체 + 빠른 컷)뿐이다.
const STYLE_COMMON =
  "굵은 검정 외곽선, 단순한 셀셰이딩 평면 채색, 어린이 그림책 같은 밝고 선명한 벡터 " +
  "일러스트 스타일. 3D 렌더링 금지, 사진풍 금지, 실사 금지. 세로 9:16 구도, 전신이 " +
  "화면 중앙에 보이게. 배경은 아주 단순한 단색 또는 연한 색으로.";

// 3D 후보 공통 렌더링 조건. 후보마다 조명·질감 문구가 다르면 캐릭터가 아니라
// 렌더링 차이를 비교하게 되므로 반드시 동일 문구를 공유한다.
const STYLE_3D_COMMON =
  "픽사/드림웍스 장편 애니메이션 같은 고품질 3D 렌더링. 부드러운 3점 조명과 은은한 " +
  "앰비언트 오클루전, 바닥에 자연스러운 그림자. 따뜻하고 밝은 톤. 얕은 피사계심도로 " +
  "배경은 살짝 흐리게. 평면 2D 일러스트 금지, 셀셰이딩 금지, 굵은 검정 외곽선 금지, " +
  "실사 사진 금지. 세로 9:16 구도, 전신이 화면 중앙에 보이게. 배경은 아주 단순한 " +
  "단색 또는 연한 색으로.";

const CHARACTERS = {
  // 후보 A: 아기 고양이 재무설계사 — 호감도/표정 연기 폭이 넓음
  cat: {
    label: "아기 고양이 재무설계사",
    identity:
      "귀여운 아기 고양이 마스코트 캐릭터를 2D 플랫 일러스트로 만들어줘. " +
      "동그랗고 통통한 몸, 연한 크림색/베이지색 털, 크고 동그란 눈(흰자 + 큰 검은 눈동자), " +
      "작은 삼각형 귀와 분홍 코, 목에는 작고 단정한 남색 넥타이를 매고 있어. " +
      "친근하고 똑똑해 보이는 인상. " + STYLE_COMMON,
  },
  // 후보 B: 계산기 로봇 — 기하학적 단순형이라 AI 일관성에 유리, 화면에 정보 표시 가능
  calc: {
    label: "계산기 로봇",
    identity:
      "귀여운 계산기 로봇 마스코트 캐릭터를 2D 플랫 일러스트로 만들어줘. " +
      "둥근 모서리의 네모난 흰색/연회색 계산기 몸통, 몸통 위쪽에 가로로 긴 액정 화면이 있고 " +
      "그 화면이 얼굴 역할을 해서 크고 동그란 두 눈이 화면 안에 표시돼. 몸통 아래쪽에는 " +
      "작고 둥근 색색의 버튼들이 있어. 짧고 단순한 팔다리와 하얀 만화풍 장갑 손, 둥근 신발. " +
      "밝은 파란색 포인트 컬러. 똑똑하고 친근한 인상. " + STYLE_COMMON,
  },
  // 후보 C: 돼지저금통 탐정 — 단순 마스코트가 아니라 "역할(persona)"이 있는 캐릭터.
  // 재테크 콘텐츠의 본질(숨은 비용 추적, 손해 파헤치기)이 탐정 행위와 그대로 맞물려
  // 장면마다 단서/추리/지목 같은 연출이 가능하다. 벤치마킹의 "사냥꾼"과는 결이 다르다.
  detective: {
    label: "돼지저금통 탐정",
    identity:
      "귀여운 돼지저금통 탐정 마스코트 캐릭터를 2D 플랫 일러스트로 만들어줘. " +
      "동그랗고 통통한 분홍색 돼지저금통 몸통(등 위에 동전 투입구 슬롯이 있음), " +
      "크고 동그란 눈, 작은 분홍 코와 쫑긋한 귀, 돌돌 말린 꼬리. " +
      "베이지색 트렌치코트를 입고 갈색 중절모(페도라)를 쓰고 있어. " +
      "한 손에는 돋보기를 들고 있고, 짧고 둥근 팔다리에 하얀 만화풍 장갑 손. " +
      "똑똑하고 호기심 많은 탐정 같은 인상. " + STYLE_COMMON,
  },
  // 후보 C-2: 탐정 v2 — Owner 피드백 반영.
  //  (1) 앞이 열린 코트 + 분홍 맨몸이 드러나 "옷이 덜 입혀진" 느낌이라 불편 → 코트를
  //      앞까지 여며 몸통을 덮는다.
  //  (2) 더 귀여웠으면 좋겠다 → 2~3등신 치비 비율(머리 크게, 몸 작고 동글)로 조정.
  // 후보 C-3: 조끼 버전 — Owner 피드백 "코트가 답답하다".
  // 셜록 홈즈도 조끼를 입으므로 탐정 정체성은 유지하면서 훨씬 가볍고, 몸통은 여전히
  // 덮이며, 돼지의 동글한 실루엣이 살아난다.
  vest: {
    label: "돼지저금통 탐정 v3 (조끼)",
    identity:
      "아주 귀여운 돼지저금통 탐정 마스코트 캐릭터를 2D 플랫 일러스트로 만들어줘. " +
      "치비(chibi) 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "연한 분홍색 돼지 얼굴, 아주 크고 반짝이는 동그란 눈(큰 검은 눈동자에 하이라이트), " +
      "작고 동그란 분홍 코, 쫑긋한 귀, 발그레한 볼터치. " +
      "옷차림: 하얀 반팔 셔츠 위에 갈색 체크무늬 조끼(베스트)를 입고 작은 나비넥타이를 " +
      "맸어. 조끼는 짧아서 답답해 보이지 않고 가볍고 산뜻한 느낌. 아래는 짧은 갈색 반바지. " +
      "긴 코트는 입지 않아. 머리에는 갈색 중절모(페도라)를 쓰고, 짧고 통통한 팔에 하얀 " +
      "만화풍 장갑 손, 작고 둥근 갈색 구두. 엉덩이 쪽에 돌돌 말린 분홍 꼬리가 보이고, " +
      "등 위쪽에 동전 투입구 슬롯이 살짝 보여. 사랑스럽고 순한 표정. " + STYLE_COMMON,
  },
  // 후보 C-4: 멜빵바지 버전 — 귀여움 극대화 방향.
  overall: {
    label: "돼지저금통 탐정 v4 (멜빵바지)",
    identity:
      "아주 귀여운 돼지저금통 탐정 마스코트 캐릭터를 2D 플랫 일러스트로 만들어줘. " +
      "치비(chibi) 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "연한 분홍색 돼지 얼굴, 아주 크고 반짝이는 동그란 눈(큰 검은 눈동자에 하이라이트), " +
      "작고 동그란 분홍 코, 쫑긋한 귀, 발그레한 볼터치. " +
      "옷차림: 하얀 반팔 티셔츠 위에 청록색 멜빵바지(오버올)를 입고 있어. 멜빵바지 앞주머니가 " +
      "있고 어깨끈에 동그란 단추가 달려 있어. 가볍고 활동적이며 답답하지 않은 느낌. " +
      "긴 코트는 입지 않아. 머리에는 갈색 중절모(페도라)를 쓰고, 짧고 통통한 팔에 하얀 " +
      "만화풍 장갑 손, 작고 둥근 갈색 구두. 엉덩이 쪽에 돌돌 말린 분홍 꼬리가 보이고, " +
      "등 위쪽에 동전 투입구 슬롯이 살짝 보여. 사랑스럽고 순한 표정. " + STYLE_COMMON,
  },
  // 후보 D: 조끼 버전과 동일한 캐릭터 설계를, 플랫 2D가 아니라 3D 렌더링으로 옮긴 것.
  // 전환 이유: 실제 영상화가 리깅이 아니라 image-to-video(Veo)로 바뀌면서, 플랫 2D가
  // 갖던 리깅 비용 이점이 사라졌다. 오히려 플랫 2D는 음영·깊이 단서가 없어 모델이
  // 전후 관계를 추론하지 못해 움직임이 뭉개진다. 3D 렌더 스타일은 조명/그림자가
  // 깊이 단서로 작동해 image-to-video 품질이 유의하게 낫다.
  // 캐릭터 정체성(돼지저금통 탐정, 조끼+나비넥타이+페도라)은 vest와 동일하게 유지한다.
  vest3d: {
    label: "돼지저금통 탐정 v5 (3D 픽사풍)",
    style3d: true,
    identity:
      "아주 귀여운 돼지저금통 탐정 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "연한 분홍색 돼지 얼굴에 부드럽고 말랑한 서브서피스 스캐터링 질감, 아주 크고 " +
      "촉촉하게 반짝이는 동그란 눈(큰 검은 눈동자에 또렷한 하이라이트와 반사), " +
      "작고 동그란 분홍 코, 쫑긋한 귀, 발그레한 볼터치. " +
      "옷차림: 하얀 반팔 셔츠 위에 갈색 체크무늬 조끼(베스트)를 입고 작은 나비넥타이를 " +
      "맸어. 조끼는 짧아서 답답해 보이지 않고 가볍고 산뜻한 느낌. 천의 결과 미세한 " +
      "주름이 보이는 사실적인 패브릭 질감. 아래는 짧은 갈색 반바지. 긴 코트는 입지 않아. " +
      "머리에는 갈색 중절모(페도라)를 쓰고, 짧고 통통한 팔에 하얀 만화풍 장갑 손, " +
      "작고 둥근 갈색 구두. 엉덩이 쪽에 돌돌 말린 분홍 꼬리가 보이고, 등 위쪽에 동전 " +
      "투입구 슬롯이 살짝 보여. 사랑스럽고 순한 표정. " + STYLE_3D_COMMON,
  },
  // ── 3D 전환에 따른 주인공 재탐색 후보 ──────────────────────────────────────
  // 돼지저금통 탐정은 플랫 2D 제약(표정·질감을 못 쓰니 기호를 겹쳐 의미를 전달) 위에서
  // 최적화된 선택이었다. 3D에서는 표정·조명·질감이 의미를 전달하므로 기호를 여러 겹
  // 쌓을 필요가 없고, 오히려 정보 과잉으로 읽힌다. 아래 후보는 "기호 1개 + 표정 연기"
  // 원칙으로 설계했다. 공통: Scene 1 hook 포즈 동일 조건으로 비교해야 하므로 모두
  // 스마트폰과 돋보기를 들 수 있는 손 구조를 갖는다.
  //
  // 공통 3D 스타일 문구는 STYLE_3D_COMMON 으로 묶어 후보 간 렌더링 조건을 동일하게
  // 맞춘다. 조건이 다르면 캐릭터가 아니라 렌더링 차이를 비교하게 된다.
  owl3d: {
    label: "부엉이 애널리스트 (3D)",
    style3d: true,
    identity:
      "아주 귀여운 부엉이 애널리스트 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "부드러운 크림색과 연한 갈색 깃털, 깃털 한 올 한 올의 결이 보이는 폭신한 질감. " +
      "아주 크고 동그란 눈(호박색 홍채에 큰 검은 눈동자, 또렷한 하이라이트와 반사), " +
      "작고 단단한 주황색 부리, 머리 위에 살짝 솟은 귀깃. " +
      "옷차림: 짙은 남색 니트 조끼 하나만 입고 있어 — 단정하지만 답답하지 않은 느낌. " +
      "그 외 장신구는 없어(안경·모자·넥타이 없음). 짧고 통통한 날개 팔로 물건을 잡을 수 " +
      "있고, 작고 둥근 주황색 발. 똑똑하고 차분하며 믿음직한 표정. " + STYLE_3D_COMMON,
  },
  // v2: v1(owl3d) 실사 검증에서 발견된 두 가지를 교정.
  //  (1) 두 눈동자가 서로 다른 방향을 봐서 사시처럼 보임 → 시선 정렬을 명시.
  //  (2) "안경 쓴 학자 부엉이"는 뻔한 클리셰라는 Owner 피드백 → 안경을 씌우지 않고
  //      대신 "이마에 걸친 선글라스"(방금 벗어둔 프로의 여유)와 "한쪽 발톱의 금색
  //      링"(오래 이 일을 해온 관록의 증표)으로 신뢰감을 표현. 둘 다 눈을 가리지
  //      않아 표정 연기가 그대로 유지된다.
  owl3dv2: {
    label: "부엉이 애널리스트 v2 (시선 교정 + 이마 선글라스)",
    style3d: true,
    identity:
      "아주 귀여운 부엉이 애널리스트 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "부드러운 크림색과 연한 갈색 깃털, 깃털 한 올 한 올의 결이 보이는 폭신한 질감. " +
      "아주 크고 동그란 눈(호박색 홍채에 큰 검은 눈동자, 또렷한 하이라이트와 반사) — " +
      "양쪽 눈동자는 반드시 같은 방향을 정확히 바라봐야 해(사시처럼 서로 다른 방향을 " +
      "보면 안 됨), 시선은 정면 또는 정면에서 살짝 위를 향함. " +
      "작고 단단한 주황색 부리, 머리 위에 살짝 솟은 귀깃. " +
      "이마 위쪽에는 완전히 검정색인 무광 렌즈의 각지고 모던한 선글라스를 벗어서 " +
      "걸쳐 두었어(쓰고 있지 않음, 눈을 가리지 않음). 프레임은 가늘고 광택 있는 " +
      "짙은 차콜색 또는 검정 금속 재질 — 동그란 빈티지 안경테나 금색 프레임, 갈색·" +
      "와인색 렌즈는 절대 아님. 고급스럽고 세련된 디자이너 선글라스 느낌, 방금 일을 " +
      "마치고 여유롭게 쉬는 베테랑 같은 인상. " +
      "옷차림: 짙은 남색 니트 조끼 하나만 입고 있어 — 단정하지만 답답하지 않은 느낌. " +
      "한쪽 발톱에는 얇고 작은 금색 링을 하나 끼고 있어(오래 이 일을 해온 관록의 " +
      "증표, 화려하지 않고 은은함). 그 외 장신구는 없어. " +
      "짧고 통통한 날개 팔로 물건을 잡을 수 있고, 작고 둥근 주황색 발. " +
      "똑똑하고 차분하며 믿음직한 표정. " + STYLE_3D_COMMON,
  },
  // v3: v2 실사 검증 피드백 반영.
  //  (1) 선글라스가 얼굴 크기 대비 너무 작아 어색함 → 크기를 얼굴에 맞게 키움.
  //  (2) "탐정"보다는 "유명 스타 애널리스트/이코노미스트" 톤이 더 엣지있다는 피드백
  //      → 니트 조끼를 정장 조끼(웨이스트코트)로 격상, 행커치프 포켓 추가.
  owl3dv3: {
    label: "부엉이 애널리스트 v3 (선글라스 확대 + 정장 조끼)",
    style3d: true,
    identity:
      "아주 귀여운 부엉이 애널리스트 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "부드러운 크림색과 연한 갈색 깃털, 깃털 한 올 한 올의 결이 보이는 폭신한 질감. " +
      "아주 크고 동그란 눈(호박색 홍채에 큰 검은 눈동자, 또렷한 하이라이트와 반사) — " +
      "양쪽 눈동자는 반드시 같은 방향을 정확히 바라봐야 해(사시처럼 서로 다른 방향을 " +
      "보면 안 됨), 시선은 정면 또는 정면에서 살짝 위를 향함. " +
      "작고 단단한 주황색 부리, 머리 위에 살짝 솟은 귀깃. " +
      "이마 위쪽에는 완전히 검정색인 무광 렌즈의 각지고 모던한 선글라스를 벗어서 " +
      "걸쳐 두었어(쓰고 있지 않음, 눈을 가리지 않음) — 선글라스는 얼굴과 머리 크기에 " +
      "비례해 충분히 큼직하고 존재감 있는 사이즈여야 해(너무 작아서 안 보이면 안 됨). " +
      "프레임은 가늘고 광택 있는 짙은 차콜색 또는 검정 금속 재질 — 동그란 빈티지 " +
      "안경테나 금색 프레임, 갈색·와인색 렌즈는 절대 아님. 유명 스타 애널리스트/" +
      "이코노미스트가 방송에서 쓸 법한 고급스럽고 세련된 디자이너 선글라스. " +
      "옷차림: 짙은 차콜색 정장 조끼(웨이스트코트)를 입고 있어 — 니트가 아니라 " +
      "슈트 원단처럼 매끈하고 격식 있는 재질, 가슴 쪽에 작은 행커치프 포켓이 " +
      "달려 있어. 단추는 짙은 남색. 방송에 자주 나오는 유명 애널리스트 같은 " +
      "자신감 있고 세련된 분위기. " +
      "한쪽 발톱에는 얇고 작은 금색 링을 하나 끼고 있어(오래 이 일을 해온 관록의 " +
      "증표, 화려하지 않고 은은함). 그 외 장신구는 없어. " +
      "짧고 통통한 날개 팔로 물건을 잡을 수 있고, 작고 둥근 주황색 발. " +
      "똑똑하고 자신감 있으며 여유로운 표정. " + STYLE_3D_COMMON,
  },
  // v4: v3가 "옷은 스타 애널리스트인데 표정·구도·색이 밋밋해서 안 어울린다"는
  // 피드백을 받음. 세 가지를 한 번에 반영: (1) 눈빛/눈썹을 자신감 있게, (2) 정면
  // 증명사진 구도 대신 살짝 기울인 3쿼터 구도, (3) 무채색+베이지에 갇히지 않도록
  // 넥타이/포켓치프에 선명한 버건디 포인트 컬러 추가.
  owl3dv4: {
    label: "부엉이 애널리스트 v4 (자신감 표정 + 3쿼터 구도 + 포인트 컬러)",
    style3d: true,
    poseOverride:
      "포즈: 살짝 비스듬한 3쿼터 구도로 고개를 약간 기울이고 몸을 살짝 비틀어 서 있음. " +
      "스마트폰 화면(빈 화면)을 보며 한쪽 눈썹만 살짝 올리고 입꼬리를 올려 자신만만하게 " +
      "웃는 표정 — 놀라거나 걱정하는 표정이 아니라 '이미 답을 알고 있다는 듯' 여유롭고 " +
      "확신에 찬 표정. 반대편 날개는 허리 쪽에 편하게 얹어 자신감 있는 자세. 단순한 배경. " +
      "스마트폰 화면에는 어떠한 숫자나 텍스트도 표시하지 않음 — 완전히 비워둠.",
    identity:
      "아주 귀여운 부엉이 애널리스트 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "부드러운 크림색과 연한 갈색 깃털, 깃털 한 올 한 올의 결이 보이는 폭신한 질감. " +
      "아주 크고 동그란 눈(호박색 홍채에 큰 검은 눈동자, 또렷한 하이라이트와 반사) — " +
      "양쪽 눈동자는 반드시 같은 방향을 정확히 바라봐야 해(사시처럼 서로 다른 방향을 " +
      "보면 안 됨). 눈썹은 살짝 치켜올라가 자신감 있고 예리한 인상을 줘 — 놀라거나 " +
      "걱정하는 눈썹이 아니라 '다 알고 있다'는 듯한 여유로운 눈빛. " +
      "작고 단단한 주황색 부리, 머리 위에 살짝 솟은 귀깃. " +
      "이마 위쪽에는 완전히 검정색인 무광 렌즈의 각지고 모던한 선글라스를 벗어서 " +
      "걸쳐 두었어(쓰고 있지 않음, 눈을 가리지 않음) — 선글라스는 얼굴과 머리 크기에 " +
      "비례해 충분히 큼직하고 존재감 있는 사이즈여야 해. 프레임은 가늘고 광택 있는 " +
      "짙은 차콜색 또는 검정 금속 재질 — 동그란 빈티지 안경테나 금색 프레임, 갈색·" +
      "와인색 렌즈는 절대 아님. " +
      "옷차림: 짙은 차콜색 정장 조끼(웨이스트코트)를 입고 있어 — 슈트 원단처럼 " +
      "매끈하고 격식 있는 재질. 안에는 하얀 셔츠와 선명한 버건디(진한 와인레드)색 " +
      "넥타이를 매고 있어 — 이 캐릭터의 시그니처 포인트 컬러. 가슴 쪽 행커치프 " +
      "포켓에도 같은 버건디색 포켓치프를 살짝 꽂았어. 단추는 짙은 남색. 방송에 " +
      "자주 나오는 유명 애널리스트 같은 자신감 있고 세련된 분위기. " +
      "한쪽 발톱에는 얇고 작은 금색 링을 하나 끼고 있어(오래 이 일을 해온 관록의 " +
      "증표, 화려하지 않고 은은함). 그 외 장신구는 없어. " +
      "짧고 통통한 날개 팔로 물건을 잡을 수 있고, 작고 둥근 주황색 발. " +
      "똑똑하고 자신감 있으며 카리스마 있는 표정. " + STYLE_3D_COMMON,
  },
  // v5: v4가 "느끼하고 능글맞아 보인다"는 피드백을 받음. 원인은 웃는 입꼬리 +
  // 곁눈질하는 듯한 시선 각도였다. "스마트하고 엣지있는" 인상은 여유로운 미소가
  // 아니라 날카로운 눈매와 절제된(웃지 않는) 표정에서 나온다는 판단으로 교정.
  owl3dv5: {
    label: "부엉이 애널리스트 v5 (날카로운 무표정, 느끼함 제거)",
    style3d: true,
    poseOverride:
      "포즈: 살짝 비스듬한 3쿼터 구도로 고개를 약간 기울이고 몸을 살짝 비틀어 서 있음. " +
      "스마트폰 화면(빈 화면)을 정면으로 똑바로 응시하며(곁눈질 아님) 웃지 않고 입을 " +
      "다문 채 날카롭고 냉철하게 관찰하는 표정. 입꼬리는 올리지 않음 — 미소나 능글맞은 " +
      "표정이 아니라 무언가를 정확히 꿰뚫어 보는 듯한 진지하고 예리한 인상. 눈은 크게 " +
      "뜨되 여유롭게 풀어진 눈이 아니라 집중한 눈. 반대편 날개는 허리 쪽에 편하게 얹어 " +
      "안정된 자세. 단순한 배경. " +
      "스마트폰 화면에는 어떠한 숫자나 텍스트도 표시하지 않음 — 완전히 비워둠.",
    identity:
      "아주 귀여운 부엉이 애널리스트 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "부드러운 크림색과 연한 갈색 깃털, 깃털 한 올 한 올의 결이 보이는 폭신한 질감. " +
      "아주 크고 동그란 눈(호박색 홍채에 큰 검은 눈동자, 또렷한 하이라이트와 반사) — " +
      "양쪽 눈동자는 반드시 같은 방향을 정확히 바라봐야 해(사시처럼 서로 다른 방향을 " +
      "보면 안 됨), 시선은 정면을 똑바로 응시(곁눈질 금지). " +
      "눈썹은 짙고 거의 일자에 가깝게 곧게 뻗어 있어 — 처지거나 둥글게 휘어 느끼해 " +
      "보이면 안 되고, 날카롭고 단호한 인상이어야 해. 입은 다물고 있고 미소를 짓지 " +
      "않음 — 웃는 표정, 능글맞은 표정, 곁눈질하는 표정은 절대 금지. " +
      "작고 단단한 주황색 부리, 머리 위에 살짝 솟은 귀깃. " +
      "이마 위쪽에는 완전히 검정색인 무광 렌즈의 각지고 모던한 선글라스를 벗어서 " +
      "걸쳐 두었어(쓰고 있지 않음, 눈을 가리지 않음) — 선글라스는 얼굴과 머리 크기에 " +
      "비례해 충분히 큼직하고 존재감 있는 사이즈여야 해. 프레임은 가늘고 광택 있는 " +
      "짙은 차콜색 또는 검정 금속 재질 — 동그란 빈티지 안경테나 금색 프레임, 갈색·" +
      "와인색 렌즈는 절대 아님. " +
      "옷차림: 짙은 차콜색 정장 조끼(웨이스트코트)를 입고 있어 — 슈트 원단처럼 " +
      "매끈하고 격식 있는 재질. 안에는 하얀 셔츠와 선명한 버건디(진한 와인레드)색 " +
      "넥타이를 매고 있어 — 이 캐릭터의 시그니처 포인트 컬러. 가슴 쪽 행커치프 " +
      "포켓에도 같은 버건디색 포켓치프를 살짝 꽂았어. 단추는 짙은 남색. " +
      "한쪽 발톱에는 얇고 작은 금색 링을 하나 끼고 있어(오래 이 일을 해온 관록의 " +
      "증표, 화려하지 않고 은은함). 그 외 장신구는 없어. " +
      "짧고 통통한 날개 팔로 물건을 잡을 수 있고, 작고 둥근 주황색 발. " +
      "똑똑하고 날카로우며 냉철한 표정 — 절대 능글맞거나 느끼한 인상이 되지 않도록. " +
      STYLE_3D_COMMON,
  },
  // 부엉이(owl3dv5)의 보조 캐릭터(2026-09-19 Owner 확정) — 부엉이가 "오늘 이런
  // 일이 있었다"는 시사를 해설하는 대장 역할이라면, 이 캐릭터는 그 안에 나온
  // 어려운 용어(IRP, ETF 등)를 개인 상황에 맞는 예시로 쉽게 풀어주는 부하 역할.
  // 동물 반복을 피하고 "돈/금융"을 직관적으로 상징하도록 순금화를 의인화했다.
  // 옷을 입히지 않고 금화 자체의 질감·형태만으로 정체성을 준 것이 owl3dv5(정장)
  // 와의 결정적 차이 — 부엉이는 유기체+정장, 이 캐릭터는 무기체+무의상.
  coin3dv1: {
    label: "금박사 (부엉이 보조 캐릭터 v1, 순금 원반)",
    style3d: true,
    // STYLE_PROBE_S1_CLAUSE(스마트폰 보며 의아해하는 표정)를 기본으로 쓰면
    // identity에 적어둔 "활짝 웃는 친근한 표정"이 가려진다. 정체성 검증 단계는
    // 순수하게 정면 기본 표정만 봐야 하므로 poseOverride로 덮어쓴다.
    poseOverride:
      "포즈: 정면을 똑바로 바라보고 서서 양손을 가볍게 허리 옆에 얹은 편안한 자세. " +
      "소품 없음. 활짝 웃는 친근한 표정을 유지. 단순한 배경.",
    // 부엉이는 "웃지 않음"이 정체성이라 감정 표현 시에도 그걸 지키지만, 이
    // 캐릭터는 반대로 "친근하고 웃는 인상"이 정체성이다. 걱정할 때도 눈썹만
    // 살짝 찌푸리고 입은 계속 웃는 채로 유지해야 정체성이 안 깨진다.
    emotionProbeStyle:
      "입꼬리는 계속 올라가 있는 웃는 얼굴을 유지한 채, 눈썹만 안쪽으로 살짝 " +
      "찌푸려 걱정을 더한 느낌 — 부엉이처럼 무표정하거나 날카로워지면 안 됨",
    emotionTwistStyle:
      "활짝 웃는 친근한 표정을 그대로 유지한 채 눈을 크게 뜨고 확신에 찬 느낌만 " +
      "더함 — 표정 자체가 진지하거나 날카로워지면 안 됨",
    identity:
      "아주 귀여운 순금 동전 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 몸통이 두툼한 원반(동전) 형태이고 머리와 몸이 " +
      "하나로 합쳐진 실루엣 — 옷을 전혀 입지 않고 온몸이 반짝이는 순금 재질 그대로 " +
      "드러나 있어(고급스러운 금괴 같은 광택, 표면에 미세한 브러시 느낌의 금속 " +
      "질감과 부드러운 하이라이트, 저렴한 동전이 아니라 고급 금화처럼 보여야 함). " +
      "동전 테두리에는 은은한 톱니 무늬(밀링 엣지)가 둘러져 있어. " +
      "아주 크고 동그란 눈(짙은 갈색 눈동자에 또렷한 하이라이트와 반사) — 양쪽 " +
      "눈동자는 반드시 같은 방향을 정확히 바라봐야 해, 시선은 정면을 똑바로 응시. " +
      "둥글게 휘어진 다정한 눈썹, 볼이 살짝 붉게 물든 통통한 뺨, 활짝 웃는 입 — " +
      "친근하고 귀여운 표정(부엉이처럼 날카롭거나 냉철한 인상이 아니라 정반대로 " +
      "누구나 편하게 다가갈 수 있는 푸근한 인상이어야 함). " +
      "동전 표면(얼굴이 있는 앞면)에는 초상화·문양·숫자·글자를 절대 새기지 않음 — " +
      "눈·눈썹·입 외에는 완전히 매끈하게 비워둠. " +
      "짧고 통통한 금색 팔이 동전 옆면에서 나와 있고, 하얀 만화풍 장갑 손과 작고 " +
      "둥근 금색 발. 장신구나 옷은 일절 걸치지 않음. " + STYLE_3D_COMMON,
  },
  // 부엉박사(정책·경제뉴스)·금박사(용어 해설)에 이은 세 번째 캐릭터(2026-09-23
  // Owner 확정) — 1~2일 내 신선도 있는 국내·미국장 시황/섹터/종목(공시) 소식을
  // 빠르게 전달하는 캐스터 역할. 8차 반복 끝에 확정된 디자인을
  // canonical reference 이미지(bull3dv1-canonical-reference.png)로 고정해뒀고,
  // owl3dv5/coin3dv1과 동일하게 매 턴 그 이미지를 첨부해 텍스트 설명만으로
  // 생기는 편차를 막는다. identity 텍스트는 참조 이미지가 없을 때의 폴백 및
  // 사람이 읽는 문서 목적으로만 유지한다.
  bull3dv1: {
    label: "황소특보 (시황 캐스터, 골드 SD비율 황소)",
    style3d: true,
    poseOverride:
      "포즈: 한 손으로 정면을 향해 포인팅하며 속보를 전하는 듯한 역동적인 " +
      "동작, 반대 손은 허리에 얹은 자신감 있는 자세. 밝고 명랑한 귀여운 표정 " +
      "(근엄하거나 진지한 표정 아님). 캐릭터가 화면의 50~55%만 차지하도록 " +
      "배경이 넓게 보이는 구도. 소품(마이크, 리모컨 등)을 들 경우 반드시 " +
      "감싸 쥐거나 바닥에 거치한 상태로만 — 동작이 필요한 손은 소품 없이 " +
      "비워둠. 서재(원목 책장, 스탠드 조명, 지구본, 앤틱 지도)와 도심 " +
      "야경(노을, 시황 캔들차트 모니터)이 어우러진 배경.",
    identity:
      "아주 귀여운 황소 시황 캐스터 마스코트 캐릭터를 3D 애니메이션 영화 " +
      "스타일로 만들어줘. 극단적인 SD(슈퍼 디포르메) 비율: 머리가 몸통의 " +
      "60~65%를 차지하고, 짧고 뭉툭한 팔다리에 통통한 몸통. 어깨~목은 " +
      "다부지게, 뿔은 크고 두껍게, 주둥이는 넓적하게, 턱 밑에는 작은 " +
      "dewlap(턱살)을 더해 확실히 황소로 보이도록 함(돼지처럼 보이면 안 됨). " +
      "몸 전체는 광택 있는 골드 계열 색상. 코걸이(노즈링)는 없음. " +
      "두 눈에 각지고 모던한 검정 안경(뿔테)을 실제로 착용하고 있어 — " +
      "투명한 렌즈를 통해 눈이 그대로 보이는 정상적인 안경 착용 상태(선글라스 " +
      "아님, 이마 위에 걸쳐 놓은 상태 절대 아님 — 부엉박사가 선글라스를 " +
      "이마에 걸치는 것과는 명확히 다름). 옷차림: 재킷 없이 화이트 셔츠 + 버건디 또는 " +
      "네이비 넥타이 + 네이비 정장 바지 + 구두(정장 재킷은 입지 않음). " +
      "표정은 부엉박사st 발랄하고 밝은 톤 — 근엄하거나 진지한 거장 톤이 " +
      "아니라 명랑하고 귀여운 인상. " + STYLE_3D_COMMON,
  },
  safe3d: {
    label: "금고 캐릭터 (3D)",
    style3d: true,
    identity:
      "아주 귀여운 금고(세이프) 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "모서리가 둥글게 깎인 네모난 금고 몸통, 짙은 청록색 도장에 미세한 금속 질감과 " +
      "은은한 반사. 몸통 앞면이 얼굴 역할을 해: 위쪽에 크고 동그란 두 눈(검은 눈동자에 " +
      "또렷한 하이라이트)이 있고, 그 아래 중앙에 황동색 다이얼이 코처럼 달려 있어. " +
      "몸통 가장자리에는 황동색 모서리 보강 장식과 작은 경첩이 있어. " +
      "짧고 통통한 팔다리가 몸통에서 나와 있고, 하얀 만화풍 장갑 손과 작고 둥근 " +
      "짙은 갈색 신발을 신었어. 든든하고 친근한 표정. " +
      "금고 문 표면에는 어떠한 숫자나 글자도 새기지 않음 — 완전히 비워둠. " + STYLE_3D_COMMON,
  },
  beaver3d: {
    label: "비버 자산관리자 (3D)",
    style3d: true,
    identity:
      "아주 귀여운 비버 자산관리자 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "따뜻한 갈색 털에 짧고 촘촘한 결이 보이는 폭신한 질감, 배 쪽은 연한 베이지색. " +
      "아주 크고 동그란 눈(큰 검은 눈동자에 또렷한 하이라이트), 작고 동그란 검은 코, " +
      "작고 둥근 귀, 앞니 두 개가 살짝 보이는 귀여운 입. 엉덩이 뒤로 넓적한 갈색 꼬리. " +
      "옷차림: 머스터드색 작업 조끼 하나만 입고 있어 — 주머니가 있는 실용적인 느낌. " +
      "그 외 장신구는 없어. 짧고 통통한 팔에 작은 앞발 손, 작고 둥근 발. " +
      "성실하고 다정하며 믿음직한 표정. " + STYLE_3D_COMMON,
  },
  turtle3d: {
    label: "거북이 장기투자자 (3D)",
    style3d: true,
    identity:
      "아주 귀여운 거북이 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "연한 올리브 그린색 피부에 부드럽고 말랑한 질감, 등에는 짙은 갈색과 황토색이 " +
      "어우러진 육각 무늬 등껍질(매끈하고 은은한 광택). " +
      "아주 크고 동그란 눈(큰 검은 눈동자에 또렷한 하이라이트), 작고 동그란 콧구멍, " +
      "온화하게 미소 짓는 입. " +
      "옷차림: 짙은 주황색 목도리 하나만 두르고 있어 — 그 외 장신구는 없어. " +
      "짧고 통통한 팔다리, 둥근 앞발 손. 차분하고 지혜로우며 느긋한 표정. " + STYLE_3D_COMMON,
  },
  compass3d: {
    label: "나침반 가이드 (3D)",
    style3d: true,
    identity:
      "아주 귀여운 나침반 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "동그랗고 통통한 황동색 회중 나침반 몸통, 따뜻한 금속 광택과 미세한 사용감이 " +
      "느껴지는 질감. 몸통 앞면이 얼굴 역할을 해: 유리 덮개 안쪽 위편에 크고 동그란 " +
      "두 눈(검은 눈동자에 또렷한 하이라이트)이 있고, 그 아래 중앙에 빨강과 흰색으로 " +
      "칠해진 나침반 바늘이 코처럼 달려 있어. 유리 덮개에는 부드러운 반사光이 비쳐. " +
      "몸통 위쪽에는 고리가 달려 있고, 테두리는 톱니 모양으로 정교하게 깎여 있어. " +
      "짧고 통통한 팔다리가 몸통에서 나와 있고, 하얀 만화풍 장갑 손과 작고 둥근 " +
      "짙은 갈색 신발을 신었어. 든든하고 길을 안내하는 듯한 친근한 표정. " +
      "나침반 눈금판에는 어떠한 숫자나 글자도 새기지 않음 — 방위 표시 없이 완전히 " +
      "비워둠. " + STYLE_3D_COMMON,
  },
  // 돼지저금통 2종: 기존 vest3d(돼지 '동물' + 탐정 기호 6겹)와 달리, 저금통이라는
  // 오브제 자체를 의인화해 기호를 1개로 줄인 버전. 기존 컨셉 자산을 일부 승계하면서
  // 3D에서 과잉으로 읽히던 정보량을 덜어낸다.
  piggybank3d: {
    label: "돼지저금통 오브제 (3D, 도자기)",
    style3d: true,
    identity:
      "아주 귀여운 돼지저금통 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "동물 돼지가 아니라 '도자기 돼지저금통' 오브제 자체가 살아난 캐릭터야. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "매끈한 광택이 도는 연한 분홍색 도자기 재질 — 표면에 은은한 유약 반사와 " +
      "부드러운 하이라이트가 보여. 아주 크고 동그란 눈(큰 검은 눈동자에 또렷한 " +
      "하이라이트), 작고 동그란 코, 쫑긋한 귀, 등 위쪽에 동전 투입구 슬롯. " +
      "엉덩이 쪽에 돌돌 말린 꼬리. " +
      "옷차림: 아무것도 입지 않은 순수한 도자기 저금통 형태 — 모자·조끼·넥타이 등 " +
      "장신구가 전혀 없어. 짧고 통통한 팔다리, 둥근 앞발 손. " +
      "사랑스럽고 순하며 믿음직한 표정. " + STYLE_3D_COMMON,
  },
  piggybankscarf3d: {
    label: "돼지저금통 오브제 (3D, 목도리 포인트)",
    style3d: true,
    identity:
      "아주 귀여운 돼지저금통 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "동물 돼지가 아니라 '도자기 돼지저금통' 오브제 자체가 살아난 캐릭터야. " +
      "치비 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "매끈한 광택이 도는 연한 분홍색 도자기 재질 — 표면에 은은한 유약 반사와 " +
      "부드러운 하이라이트가 보여. 아주 크고 동그란 눈(큰 검은 눈동자에 또렷한 " +
      "하이라이트), 작고 동그란 코, 쫑긋한 귀, 등 위쪽에 동전 투입구 슬롯. " +
      "엉덩이 쪽에 돌돌 말린 꼬리. " +
      "옷차림: 목에 짙은 남색 니트 목도리 하나만 둘렀어 — 포근한 털실 질감이 " +
      "도자기의 매끈함과 대비돼. 그 외 장신구는 전혀 없어. " +
      "짧고 통통한 팔다리, 둥근 앞발 손. 사랑스럽고 순하며 믿음직한 표정. " +
      STYLE_3D_COMMON,
  },
  gold3d: {
    label: "금괴 캐릭터 (3D, 원물)",
    style3d: true,
    identity:
      "아주 귀여운 금괴(골드바) 마스코트 캐릭터를 3D 애니메이션 영화 스타일로 만들어줘. " +
      "모서리가 둥글게 깎인 사다리꼴 금괴 몸통 — 위가 살짝 좁고 아래가 넓은 형태. " +
      "따뜻한 황금색 금속 재질에 부드럽고 고급스러운 광택, 표면에 은은한 반사와 " +
      "미세한 결이 보여. 몸통 앞면이 얼굴 역할을 해: 크고 동그란 두 눈(검은 눈동자에 " +
      "또렷한 하이라이트)과 온화하게 미소 짓는 작은 입. " +
      "짧고 통통한 팔다리가 몸통에서 나와 있고, 하얀 만화풍 장갑 손과 작고 둥근 " +
      "짙은 갈색 신발을 신었어. 든든하고 여유로우며 친근한 표정. " +
      "금괴 표면에는 어떠한 숫자나 글자나 각인도 새기지 않음 — 완전히 매끈하게 " +
      "비워둠. " + STYLE_3D_COMMON,
  },
  detective2: {
    label: "돼지저금통 탐정 v2 (치비/코트 여밈)",
    identity:
      "아주 귀여운 돼지저금통 탐정 마스코트 캐릭터를 2D 플랫 일러스트로 만들어줘. " +
      "치비(chibi) 스타일의 2~3등신 비율: 머리가 몸보다 크고, 몸은 작고 동글동글해. " +
      "연한 분홍색 돼지 얼굴, 아주 크고 반짝이는 동그란 눈(큰 검은 눈동자에 하이라이트), " +
      "작고 동그란 분홍 코, 쫑긋한 귀, 발그레한 볼터치. " +
      "몸에는 앞을 단추로 단정하게 여민 베이지색 트렌치코트를 입고 있어서 몸통이 코트로 " +
      "완전히 덮여 있어(맨살이 드러나지 않음). 코트 뒤쪽 아래로 돌돌 말린 분홍 꼬리가 " +
      "살짝 보이고, 코트 등 쪽 위에 동전 투입구 슬롯이 보여. " +
      "머리에는 갈색 중절모(페도라)를 쓰고, 짧고 통통한 팔에 하얀 만화풍 장갑 손, " +
      "작고 둥근 갈색 구두. 사랑스럽고 순한 표정. " + STYLE_COMMON,
  },
};

const CHAR_DEF = CHARACTERS[CHARACTER];
if (!CHAR_DEF) {
  console.error(`ABORT: unknown --character "${CHARACTER}". 사용 가능: ${Object.keys(CHARACTERS).join(", ")}`);
  process.exit(1);
}
const IDENTITY = CHAR_DEF.identity;

// 후속 장면 지시문은 렌더링 스타일 고정 문구를 포함한다. 3D 캐릭터에 2D용 문구
// ("3D 금지, 2D 플랫 유지")를 그대로 쓰면 2장째부터 스타일이 무너지므로 분기한다.
const SAME_CHARACTER_RULE = CHAR_DEF.style3d
  ? "앞에서 만든 그 캐릭터와 완전히 똑같은 캐릭터로, 외형(모자 모양, 옷과 옷을 여민 상태, " +
    "머리와 몸의 비율, 눈 크기와 색, 피부·천의 질감, 색조, 장갑과 신발)을 하나도 바꾸지 " +
    "말고 유지해줘. 같은 3D 애니메이션 영화 스타일(픽사/드림웍스풍 렌더링, 부드러운 조명, " +
    "앰비언트 오클루전, 얕은 피사계심도)을 그대로 유지해. 평면 2D 일러스트 금지, 셀셰이딩 " +
    "금지, 검정 외곽선 금지, 실사 사진 금지. 세로 9:16, 전신, 단순한 배경. 바꿀 것은 오직 " +
    "포즈와 표정, 그리고 들고 있는 소품뿐이야."
  : "앞에서 만든 그 캐릭터와 완전히 똑같은 캐릭터로, 외형(모자 모양, 옷과 옷을 여민 상태, " +
    "머리와 몸의 비율, 눈 크기와 색, 색조, 외곽선 두께, 장갑과 신발)을 하나도 바꾸지 말고 " +
    "유지해줘. 3D 금지, 실사 금지, 같은 2D 플랫 일러스트 스타일 유지. 세로 9:16, 전신, " +
    "단순한 배경. 바꿀 것은 오직 포즈와 표정, 그리고 들고 있는 소품뿐이야.";

// 기본 포즈 세트: 감정 표현 폭(설명/놀람/고민/긍정)을 본다.
const POSES_BASIC = [
  {
    id: "01_anchor_pointing",
    file: "01_anchor_pointing.png",
    first: true,
    clause:
      "포즈: 자신감 있게 서서 한 손으로 정면(보는 사람)을 가리키며 무언가 설명하는 표정. 입을 벌리고 활기차게.",
  },
  {
    id: "02_surprised",
    file: "02_surprised.png",
    first: false,
    clause:
      "포즈: 깜짝 놀란 표정. 두 손을 얼굴 옆으로 들어올리고, 눈을 크게 뜨고 입은 O자 모양으로.",
  },
  {
    id: "03_thinking",
    file: "03_thinking.png",
    first: false,
    clause:
      "포즈: 고민하는 표정. 한 손으로 턱을 짚고 눈썹을 찡그린 채 고개를 살짝 기울이고 생각하는 모습.",
  },
  {
    id: "04_happy_thumbsup",
    file: "04_happy_thumbsup.png",
    first: false,
    clause:
      "포즈: 환하게 웃으며 한 손으로 엄지척(따봉)을 하는 모습. 눈은 기쁘게 휘어지고 당당하게 서 있는 자세.",
  },
];

// 캐릭터 시트 세트: 프로덕션 레퍼런스로 쓸 기본 자세/각도. 액션 포즈와 달리
// "이 캐릭터의 정면·측면 기준형이 무엇인가"를 고정하는 용도.
// 프레임 안정성 테스트 (Owner 요청: "LLM으로 애니메이션 프레임을 직접 뽑아서 이어붙이면
// 되지 않나"에 대한 실증). 4번 모두 동일한 지시(변화 없음)로 요청해, ChatGPT 생성 자체가
// 만들어내는 프레임간 편차(노이즈)를 측정한다. 이 편차가 크면 연속 재생 시 "지글거림"으로
// 나타나 애니메이션 프레임 소스로 쓸 수 없다는 뜻이다.
const POSES_FRAME_STABILITY = [
  {
    id: "stability_01",
    file: "stability_01.png",
    first: true,
    clause:
      "포즈: 정면을 보고 차렷 자세로 똑바로 서 있는 기본 중립 자세. 팔은 자연스럽게 옆으로 " +
      "내리고, 표정은 은은한 미소를 띤 평온한 얼굴. 소품은 들지 않음.",
  },
  {
    id: "stability_02",
    file: "stability_02.png",
    first: false,
    clause:
      "포즈는 방금과 완전히 동일하게 유지해줘 — 자세, 팔 위치, 표정 전부 그대로, 하나도 " +
      "바꾸지 마. 단지 다시 한 장 더 그려줘.",
  },
  {
    id: "stability_03",
    file: "stability_03.png",
    first: false,
    clause:
      "포즈는 방금과 완전히 동일하게 유지해줘 — 자세, 팔 위치, 표정 전부 그대로, 하나도 " +
      "바꾸지 마. 단지 다시 한 장 더 그려줘.",
  },
  {
    id: "stability_04",
    file: "stability_04.png",
    first: false,
    clause:
      "포즈는 방금과 완전히 동일하게 유지해줘 — 자세, 팔 위치, 표정 전부 그대로, 하나도 " +
      "바꾸지 마. 단지 다시 한 장 더 그려줘.",
  },
];

const POSES_CHARACTER_SHEET = [
  {
    id: "sheet_01_front_neutral",
    file: "sheet_01_front_neutral.png",
    first: true,
    clause:
      "포즈: 정면을 보고 차렷 자세로 똑바로 서 있는 기본 중립 자세. 팔은 자연스럽게 옆으로 " +
      "내리고, 표정은 은은한 미소를 띤 평온한 얼굴. 소품은 들지 않음.",
  },
  {
    id: "sheet_02_side_profile",
    file: "sheet_02_side_profile.png",
    first: false,
    clause:
      "포즈: 완전한 옆모습(측면, 90도 프로필)으로 똑바로 서 있는 모습. 같은 중립적이고 " +
      "평온한 표정. 소품은 들지 않음.",
  },
  {
    id: "sheet_03_three_quarter",
    file: "sheet_03_three_quarter.png",
    first: false,
    clause:
      "포즈: 45도 정도 비스듬히 몸을 튼 3쿼터 뷰로 서 있는 모습. 한쪽 손을 살짝 들어 " +
      "가볍게 인사하듯 흔드는 자세. 밝고 친근한 미소.",
  },
  {
    id: "sheet_04_expression_neutral",
    file: "sheet_04_expression_neutral.png",
    first: false,
    clause:
      "포즈: 정면을 보고 서 있으며 얼굴 클로즈업 느낌으로 무표정(평온, 감정 없는 기본 " +
      "얼굴)을 보여줌. 몸은 중립 자세 그대로.",
  },
];

// 배경 포함 실장면 세트: 지금까지는 전부 단색 배경이었다. 실제 영상에 쓰일 법한
// 배경(카페/집/은행)이 들어가도 캐릭터가 흔들리지 않는지 검증한다. 배경이 캐릭터
// 외형(옷/소품/비율)을 침범하지 않는지가 핵심 관찰 포인트다.
const POSES_SCENE_BACKGROUND = [
  {
    id: "scene_01_cafe_receipt",
    file: "scene_01_cafe_receipt.png",
    first: true,
    clause:
      "배경: 카페 테이블 위, 커피잔과 영수증이 놓여 있는 아늑한 카페 실내. " +
      "포즈: 테이블 앞에 앉아 영수증을 돋보기로 들여다보며 놀란 표정.",
  },
  {
    id: "scene_02_home_desk_phone",
    file: "scene_02_home_desk_phone.png",
    first: false,
    clause:
      "배경: 아늑한 집 책상 위, 스탠드 조명과 노트가 놓여 있는 방. " +
      "포즈: 책상 앞에 서서 스마트폰 화면을 들여다보며 심각한 표정으로 고민하는 모습.",
  },
  {
    id: "scene_03_bank_atm",
    file: "scene_03_bank_atm.png",
    first: false,
    clause:
      "배경: 은행 ATM 기기 앞, 깔끔한 은행 창구 실내 배경. " +
      "포즈: ATM 앞에 서서 한 손으로 화면을 가리키며 자신만만하게 설명하는 모습.",
  },
];

// 탐정 포즈 세트: 실제 쇼츠 장면 흐름(훅 → 단서 → 추리 → 결론)을 그대로 따른다.
// 캐릭터에 역할이 있으면 정지 이미지만으로도 스토리가 생기는지 함께 확인한다.
// PA-5AE 8-Scene Character Continuity Proof (Control Tower exact scope, 2026-09-15).
// 8장을 단순히 비슷하게만 만들면 안 되고, 일부러 난도가 다른 8종을 섞어 실제 production
// tolerance를 본다: (A) 중립 설명 (B) 놀람/발견 (C) 자신감 있는 답변 (D) 우려/경고
// (E) 집 환경 (F) 카페/상점 환경 (G) 은행/ATM 환경 (H) 숫자/설명 환경.
// 각 장면은 포즈·표정·소품·배경·구도를 의도적으로 다르게 하되, 캐릭터 정체성(의상·비율·
// 눈 디자인·모자 디자인·팔레트·외곽선/스타일·장갑/신발)은 고정되어야 한다.
const POSES_8SCENE_CONTINUITY = [
  {
    id: "pa5ae_A_neutral_explain",
    file: "pa5ae_A_neutral_explain.png",
    first: true,
    clause:
      "장면 A (중립 설명): 단순한 연한 배경 앞에 서서, 한 손을 펴 보이며 차분하고 " +
      "친절하게 무언가를 설명하는 중립적인 표정과 자세.",
  },
  {
    id: "pa5ae_B_surprise_discovery",
    file: "pa5ae_B_surprise_discovery.png",
    first: false,
    clause:
      "장면 B (놀람/발견): 단순한 연한 배경 앞에서, 돋보기로 무언가를 발견하고 눈을 " +
      "크게 뜨며 놀란 표정. 입을 살짝 벌리고 한 손을 들어올림.",
  },
  {
    id: "pa5ae_C_confident_answer",
    file: "pa5ae_C_confident_answer.png",
    first: false,
    clause:
      "장면 C (자신감 있는 답변): 단순한 연한 배경 앞에서, 검지를 위로 치켜들며 " +
      "확신에 찬 미소로 정답을 발표하는 당당한 자세.",
  },
  {
    id: "pa5ae_D_concerned_warning",
    file: "pa5ae_D_concerned_warning.png",
    first: false,
    clause:
      "장면 D (우려/경고): 단순한 연한 배경 앞에서, 두 손을 앞으로 살짝 들어 " +
      "주의를 주듯 눈썹을 찡그리고 걱정스러운 표정으로 경고하는 자세.",
  },
  {
    id: "pa5ae_E_home_environment",
    file: "pa5ae_E_home_environment.png",
    first: false,
    clause:
      "장면 E (집 환경): 아늑한 집 거실 배경(소파, 러그, 창문)에서, 편안하게 앉아 " +
      "수첩을 무릎에 놓고 무언가를 적는 모습.",
  },
  {
    id: "pa5ae_F_cafe_store_environment",
    file: "pa5ae_F_cafe_store_environment.png",
    first: false,
    clause:
      "장면 F (카페/상점 환경): 카페 또는 작은 상점 내부 배경(진열대, 간판)에서, " +
      "영수증이나 가격표를 들고 살펴보는 모습.",
  },
  {
    id: "pa5ae_G_bank_atm_environment",
    file: "pa5ae_G_bank_atm_environment.png",
    first: false,
    clause:
      "장면 G (은행/ATM 환경): 은행 창구 또는 ATM 기기 배경에서, 화면을 손으로 " +
      "가리키며 안내하는 모습.",
  },
  {
    id: "pa5ae_H_number_explanation_environment",
    file: "pa5ae_H_number_explanation_environment.png",
    first: false,
    clause:
      "장면 H (숫자/설명 환경): 화이트보드나 큰 메모판이 있는 배경 앞에서, 화이트보드 " +
      "쪽을 향해 손으로 가리키며 숫자를 설명하는 진지한 모습. 화이트보드 위 텍스트나 " +
      "숫자는 그리지 말고 빈 보드로 둔다(실제 숫자는 나중에 별도로 합성됨).",
  },
];

// L2~L3 파이프라인이 만든 첫 프로덕션 대본(candidate-02, 14/18점 합격)의 8장면을
// 그대로 이미지 프롬프트로 옮긴 것. 출처: _ai/live-topic-runs/
// 2026-09-15T15-20-11-679Z-candidate-02-scene-image-prompts.md
// 제목: "이번 주 한국경제 카드론 기사, 한국은행 기준금리와 같이 봐야 할 이유"
const POSES_CANDIDATE_02_8SCENE = [
  {
    id: "c02_s1_hook",
    file: "c02_s1_hook.png",
    first: true,
    clause:
      "포즈: 스마트폰 화면(빈 화면)을 보며 한쪽 눈썹을 살짝 올리고 의아해하는 표정. " +
      "돋보기를 반대편 손에 들고 있음. 정면 구도. 단순한 배경.",
  },
  {
    id: "c02_s2_loss_aversion",
    file: "c02_s2_loss_aversion.png",
    first: false,
    clause:
      "장면 2 (손실 회피): 신용카드 모양 소품(무늬 없는 빈 카드)을 손에 들고 걱정스러운 " +
      "표정으로 내려다보는 자세. 배경: 집 책상, 조명 약간 어둡게.",
  },
  {
    id: "c02_s3_evidence_card",
    file: "c02_s3_evidence_card.png",
    first: false,
    clause:
      "장면 3 (근거 제시): 탐정 모자를 고쳐 쓰며 수첩을 펼쳐 든 진지한 자세. 정면 또는 " +
      "3쿼터 구도. 배경: 한국은행 건물을 연상시키는 단순한 건축물 실루엣(은행 명칭·텍스트 " +
      "없음), 빈 정보 카드 형태의 소품을 옆에 배치. 화이트보드나 카드 표면에는 어떠한 " +
      "숫자나 텍스트도 그리지 않음 — 완전히 비워둠.",
  },
  {
    id: "c02_s4_background",
    file: "c02_s4_background.png",
    first: false,
    clause:
      "장면 4 (배경 설명): 빈 신문/뉴스 화면 모양 소품을 들고 읽는 자세. 배경: 카페 또는 " +
      "서재 느낌의 배경, 신문 지면에는 텍스트나 로고를 넣지 않고 완전히 비워둠.",
  },
  {
    id: "c02_s5_twist",
    file: "c02_s5_twist.png",
    first: false,
    clause:
      "장면 5 (핵심 반전): 검지를 들고 확신에 찬 표정으로 강조하는 자세. 다른 손에는 " +
      "두 개의 빈 게이지/막대 모양 소품(높이가 다른 두 개)을 나란히 들거나 옆에 배치 — " +
      "숫자나 텍스트 없이 형태로만 '변화'를 암시. 배경: 단순한 단색 배경.",
  },
  {
    id: "c02_s6_impact",
    file: "c02_s6_impact.png",
    first: false,
    clause:
      "장면 6 (영향): 양손에 각각 다른 모양의 빈 카드(하나는 은행 아이콘, 하나는 신용카드 " +
      "아이콘)를 들고 서로 다르다는 듯 비교하는 자세. 배경: 단순한 실내 배경.",
  },
  {
    id: "c02_s7_action",
    file: "c02_s7_action.png",
    first: false,
    clause:
      "장면 7 (실행): 수첩과 돋보기를 양손에 들고 차분히 확인하는 자세, 안내하듯 살짝 " +
      "웃는 표정. 배경: 밝은 톤의 집/카페 배경.",
  },
  {
    id: "c02_s8_closing",
    file: "c02_s8_closing.png",
    first: false,
    clause:
      "장면 8 (마무리/고지): 정면을 보고 차렷 자세로 돌아와 은은한 미소를 띤 평온한 " +
      "얼굴. 소품 없음. 배경: 밝은 단색 마무리 배경.",
  },
];

// 3D 전환 확정: 돼지저금통 탐정 대신 owl3dv5(부엉이 애널리스트, 정장 조끼+버건디
// 넥타이+선글라스+발톱 골드 링, 날카롭고 냉철한 표정)로 candidate-02 8장 전체를
// 생성한다. 탐정 전용 소품(돋보기·탐정모자)은 빼고 의미는 그대로 유지했다.
// owl3dv5 감정 폭 검증(hook/손실회피/반전 3장)에서 "웃지 않고 다문 입, 날카로운
// 눈빛"이 다른 감정에서도 능글맞음으로 안 돌아가는 것을 확인했으므로, 각 장면에도
// 동일한 표정 원칙(미소·능글맞은 표정 금지)을 명시해 일관성을 지킨다.
const POSES_OWL_8SCENE = [
  {
    id: "owl_s1_hook",
    file: "owl_s1_hook.png",
    first: true,
    clause:
      "포즈: 스마트폰 화면(빈 화면)을 정면으로 응시하며 한쪽 눈썹만 살짝 올린 날카롭고 " +
      "진지한 표정 — 웃지 않고 입은 다물고 있음. 단순한 배경. 스마트폰 화면에는 어떠한 " +
      "숫자나 텍스트도 표시하지 않음 — 완전히 비워둠.",
  },
  {
    id: "owl_s2_loss_aversion",
    file: "owl_s2_loss_aversion.png",
    first: false,
    clause:
      "장면 2 (손실 회피): 신용카드 모양 소품(무늬 없는 빈 카드)을 손에 들고 눈썹 안쪽을 " +
      "살짝 찌푸리며 걱정스럽게 내려다보는 표정 — 입은 다물고 있고 미소나 능글맞은 " +
      "표정은 짓지 않음. 배경: 집 책상, 조명 약간 어둡게.",
  },
  {
    id: "owl_s3_evidence_card",
    file: "owl_s3_evidence_card.png",
    first: false,
    clause:
      "장면 3 (근거 제시): 작은 수첩을 펼쳐 들고 진지하게 들여다보는 자세, 표정은 " +
      "집중하고 냉철함 — 웃지 않음. 정면 또는 3쿼터 구도. 배경: 한국은행 건물을 " +
      "연상시키는 단순한 건축물 실루엣(은행 명칭·텍스트 없음), 빈 정보 카드 형태의 " +
      "소품을 옆에 배치. 화이트보드나 카드 표면에는 어떠한 숫자나 텍스트도 그리지 " +
      "않음 — 완전히 비워둠.",
  },
  {
    id: "owl_s4_background",
    file: "owl_s4_background.png",
    first: false,
    clause:
      "장면 4 (배경 설명): 빈 신문/뉴스 화면 모양 소품을 들고 읽는 자세, 진지하고 " +
      "집중한 표정 — 웃지 않음. 배경: 카페 또는 서재 느낌의 배경, 신문 지면에는 " +
      "텍스트나 로고를 넣지 않고 완전히 비워둠.",
  },
  {
    id: "owl_s5_twist",
    file: "owl_s5_twist.png",
    first: false,
    clause:
      "장면 5 (핵심 반전): 한쪽 날개(손)로 검지를 들어 강조하는 자세. 다른 손에는 두 " +
      "개의 빈 게이지/막대 모양 소품(높이가 다른 두 개)을 나란히 들거나 옆에 배치 — " +
      "숫자나 텍스트 없이 형태로만 '변화'를 암시. 표정은 웃지 않고 입을 다문 채 " +
      "확신에 찬 날카로운 눈빛으로 정면을 응시. 배경: 단순한 단색 배경.",
  },
  {
    id: "owl_s6_impact",
    file: "owl_s6_impact.png",
    first: false,
    clause:
      "장면 6 (영향): 양쪽 날개(손)에 각각 다른 모양의 빈 카드(하나는 은행 아이콘, " +
      "하나는 신용카드 아이콘)를 들고 서로 다르다는 듯 비교하는 자세, 진지하게 " +
      "설명하는 표정 — 웃지 않음. 배경: 단순한 실내 배경.",
  },
  {
    id: "owl_s7_action",
    file: "owl_s7_action.png",
    first: false,
    clause:
      "장면 7 (실행): 수첩을 한 손에 들고 차분히 확인하는 자세, 안내하듯 침착하고 " +
      "믿음직한 표정 — 크게 웃지 않고 살짝 진지함이 남아있는 표정. 배경: 밝은 톤의 " +
      "집/카페 배경. 배경에 등장하는 모든 소품(머그컵, 액자, 포스터, 책 표지 등)에는 " +
      "어떠한 글자·문구·텍스트도 적혀 있으면 안 됨 — 완전히 비워두거나 무늬 없이 " +
      "단순하게 표현.",
  },
  {
    id: "owl_s8_closing",
    file: "owl_s8_closing.png",
    first: false,
    clause:
      "장면 8 (마무리/고지): 정면을 보고 차렷 자세로 돌아와 침착하고 안정된 표정 — " +
      "크게 웃지 않고 단정하게 정리된 인상. 소품 없음. 배경: 밝은 단색 마무리 배경.",
  },
];

// 2편(가계부채 목표 근접 vs 규제 유지) 8장면 포즈 정의. 1편(POSES_OWL_8SCENE)과
// 캐릭터 정체성·표정 원칙은 동일하게 유지하되, 소품과 배경만 이번 주제에 맞춘다.
// 1편에서 검증된 "빈 소품(숫자·텍스트 없음)" 원칙(HC-10)을 그대로 따른다.
//
// ⚠ 3편부터 반드시 반영할 것 — 모바일 검수(2026-09-17)에서 1·2편 공통으로
// 지적된 3가지 문제. 아래 POSES_OWL_EP2_8SCENE 는 이 문제를 그대로 갖고 있는
// "반면교사" 예시이니 다음 편 포즈 배열을 새로 쓸 때 절대 복사하지 말 것:
//
//   1. 캐릭터가 화면의 70~80%를 차지해 답답하다 — clause 에 "전신이 화면의
//      약 45~55%만 차지하도록 여유 있게, 배경이 넉넉히 보이는 미디엄 샷"처럼
//      프레임 점유율을 명시적으로 지정할 것. 지금 아래 예시들은 이 지시가
//      전혀 없어 이미지 생성기가 캐릭터를 화면 가득 채웠다.
//   2. 배경이 단조롭다("단순한 단색 배경", "밝은 단색 마무리 배경" 등) —
//      대본 주제·흐름에 맞는 실생활 공간(예: 은행 창구, 부동산 중개소,
//      마트 계산대, 거실 소파)을 구체적으로 지정할 것. "단순한 배경"이라는
//      표현 자체를 되도록 쓰지 말 것.
//   3. 동작이 독백처럼 보인다(소품을 내려다보며 혼자 계산/확인하는 자세뿐) —
//      "시청자를 향해 설명하는" 느낌이 나도록 카메라(=시청자)를 정면으로
//      응시하며 손짓으로 가리키거나 강조하는 동작을 섞을 것. 표정도 대본의
//      감정선(놀람·확신·경고 등)에 맞춰 다양화할 것 — 지금처럼 전 장면이
//      "진지하고 웃지 않음"으로 통일되면 단조롭다.
const POSES_OWL_EP2_8SCENE = [
  {
    id: "owl_ep2_s1_hook",
    file: "owl_ep2_s1_hook.png",
    first: true,
    clause:
      "포즈: 스마트폰 화면(빈 화면)을 정면으로 응시하며 한쪽 눈썹만 살짝 올린 날카롭고 " +
      "의아해하는 표정 — 웃지 않고 입은 다물고 있음. 단순한 배경. 스마트폰 화면에는 " +
      "어떠한 숫자나 텍스트도 표시하지 않음 — 완전히 비워둠.",
  },
  {
    id: "owl_ep2_s2_loss_aversion",
    file: "owl_ep2_s2_loss_aversion.png",
    first: false,
    clause:
      "장면 2 (손실 회피): 계산기 모양 소품(화면 완전히 비어있음)을 한 손에 들고 다른 " +
      "손으로 턱을 짚으며 걱정스럽게 계산해보는 표정 — 입은 다물고 있고 미소나 " +
      "능글맞은 표정은 짓지 않음. 배경: 집 책상, 조명 약간 어둡게.",
  },
  {
    id: "owl_ep2_s3_evidence_card",
    file: "owl_ep2_s3_evidence_card.png",
    first: false,
    clause:
      "장면 3 (근거 제시): 작은 수첩을 펼쳐 들고 진지하게 들여다보는 자세, 표정은 " +
      "집중하고 냉철함 — 웃지 않음. 정면 또는 3쿼터 구도. 배경: 정부 청사나 관공서를 " +
      "연상시키는 단순한 건축물 실루엣(기관명·텍스트 없음), 빈 정보 카드 형태의 " +
      "소품을 옆에 배치. 화이트보드나 카드 표면에는 어떠한 숫자나 텍스트도 그리지 " +
      "않음 — 완전히 비워둠.",
  },
  {
    id: "owl_ep2_s4_background",
    file: "owl_ep2_s4_background.png",
    first: false,
    clause:
      "장면 4 (배경 설명): 달력 모양 소품(빈 페이지, 숫자·텍스트 없음)을 손에 들고 " +
      "먼 곳을 가리키듯 손짓하는 자세, 설명하는 듯한 진지한 표정 — 웃지 않음. " +
      "배경: 서재 느낌의 배경.",
  },
  {
    id: "owl_ep2_s5_twist",
    file: "owl_ep2_s5_twist.png",
    first: false,
    clause:
      "장면 5 (핵심 반전): 한쪽 날개(손)로 X자 또는 정지 신호를 만들듯 손바닥을 세워 " +
      "단호하게 제지하는 자세, 다른 손에는 목표 지점을 가리키는 작은 깃발 모양 소품 " +
      "(빈 깃발, 숫자·텍스트 없음)을 들고 있음 — 표정은 웃지 않고 입을 다문 채 " +
      "확신에 찬 날카로운 눈빛으로 정면을 응시. 배경: 단순한 단색 배경.",
  },
  {
    id: "owl_ep2_s6_impact",
    file: "owl_ep2_s6_impact.png",
    first: false,
    clause:
      "장면 6 (영향): 세계지도 모양의 빈 패널(국가명·숫자 없음)을 한 손으로 가리키며 " +
      "다른 손은 허리에 얹은 자세, 진지하게 설명하는 표정 — 웃지 않음. " +
      "배경: 단순한 실내 배경.",
  },
  {
    id: "owl_ep2_s7_action",
    file: "owl_ep2_s7_action.png",
    first: false,
    clause:
      "장면 7 (실행): 스마트폰 화면(빈 화면)을 한 손에 들고 차분히 확인하는 자세, " +
      "안내하듯 침착하고 믿음직한 표정 — 크게 웃지 않고 살짝 진지함이 남아있는 " +
      "표정. 배경: 밝은 톤의 집/카페 배경. 배경에 등장하는 모든 소품(머그컵, 액자, " +
      "포스터, 책 표지 등)에는 어떠한 글자·문구·텍스트도 적혀 있으면 안 됨 — " +
      "완전히 비워두거나 무늬 없이 단순하게 표현.",
  },
  {
    id: "owl_ep2_s8_closing",
    file: "owl_ep2_s8_closing.png",
    first: false,
    clause:
      "장면 8 (마무리): 정면을 보고 날개(팔)를 살짝 펼치며 침착하고 안정된 표정 — " +
      "크게 웃지 않고 단정하게 정리된 인상. 소품 없음. 배경: 밝은 단색 마무리 배경.",
  },
];

// 3편(서울 아파트값 84주 연속 상승 → 전세난 역설 → HUG 안심신탁) 11장면 포즈
// 정의. 8장면 고정 규칙이 폐기(2026-09-17 Owner 승인)된 뒤 나온 첫 편이라
// 장면 수가 8이 아니라 대본 분량을 따라 11개다(하나의 사건 흐름을 하나의
// 장면에 욱여넣지 않고, 나레이션이 8~10초 클립 상한을 넘을 때마다 장면을
// 쪼갠 결과 — 6/7번은 impact 역할 하나를 2장면으로, 8~11번은 action 역할
// 하나를 4장면으로 나눴다). 10번째(closing_disclaimer)는 이 편부터 아예
// 스펙에 넣지 않는다 — 투자 콘텐츠가 아닌데 투자용 면책 문구가 어색하다는
// 지적(Owner)에 따라 고지 문구 없이 11번(action) 장면에서 바로 끝내고
// 고정 CTA 클립을 이어붙인다(8-1절 참고).
//
// 캐릭터 정체성·표정 원칙은 1·2편과 동일. 모바일 검수 3원칙(2026-09-17)을
// 전부 반영: (1) 프레임 점유율은 OWL3DV5_FRAME_RATIO_RULE이 자동 지시하므로
// clause에서 별도로 챙기지 않음, (2) 배경은 매 장면 실생활 공간을 구체적으로
// 지정(단색/단순 배경 표현 금지), (3) 소품을 내려다보는 독백형 자세만 반복하지
// 않고 정면 응시+설명 동작을 섞음.
const POSES_OWL_EP3_11SCENE = [
  {
    id: "owl_ep3_s1_hook",
    file: "owl_ep3_s1_hook.png",
    first: true,
    clause:
      "장면 1 (훅): 도심 스카이라인이 내다보이는 사무실 창가에 서서 카메라(시청자)를 " +
      "정면으로 응시하며 한쪽 날개(손)로 창밖 스카이라인을 가리키는 자세 — 날카롭고 " +
      "확신에 찬 표정, 웃지 않고 입은 다물고 있음. 배경: 통유리창 너머로 보이는 " +
      "서울 아파트 단지 실루엣(건물명·숫자 없음).",
  },
  {
    id: "owl_ep3_s2_loss_aversion",
    file: "owl_ep3_s2_loss_aversion.png",
    first: false,
    clause:
      "장면 2 (손실 회피): 빈 메모장(글자 없음)을 한 손에 들고 다른 손으로는 걱정스럽게 " +
      "관자놀이를 짚으며 카메라를 향해 안타까운 표정을 짓는 자세 — 웃지 않음. " +
      "배경: 부동산 중개소 사무실, 매물 게시판(빈 종이, 텍스트 없음)이 뒤로 보임.",
  },
  {
    id: "owl_ep3_s3_evidence_card",
    file: "owl_ep3_s3_evidence_card.png",
    first: false,
    clause:
      "장면 3 (근거 제시): 빈 정보 보드(숫자·텍스트 없음)를 한 날개로 가리키며 " +
      "카메라를 정면으로 응시하는 진지하고 냉철한 표정 — 웃지 않음. 배경: 서울 " +
      "아파트 단지 실루엣이 보이는 부동산 중개소 창가.",
  },
  {
    id: "owl_ep3_s4_background",
    file: "owl_ep3_s4_background.png",
    first: false,
    clause:
      "장면 4 (배경 설명): 빈 페이지의 탁상 달력 소품을 한 손에 들고 다른 손으로는 " +
      "먼 곳(과거)을 가리키듯 손짓하며 설명하는 표정 — 웃지 않고 진지함. 배경: " +
      "서재, 책장에 제목 없는 책들이 꽂혀 있음.",
  },
  {
    id: "owl_ep3_s5_twist",
    file: "owl_ep3_s5_twist.png",
    first: false,
    clause:
      "장면 5 (반전): 두 개의 빈 막대 그래프 모양 소품(수치·텍스트 없음)을 양 날개로 " +
      "하나씩 들어 비교하듯 보여주며 카메라를 정면으로 응시하는 확신에 찬 표정 — " +
      "웃지 않음. 배경: 서울 강남·강북을 동시에 조망하는 듯한 도시 파노라마 창가.",
  },
  {
    id: "owl_ep3_s6_impact_a",
    file: "owl_ep3_s6_impact_a.png",
    first: false,
    clause:
      "장면 6 (영향 1/2 — 아이러니 제시): 빈 정책 표지판 두 개(종부세·양도세 자리, " +
      "글자 없음) 사이에 서서 한 날개로 표지판을 가리키며 카메라를 향해 알듯 " +
      "말듯한 진지한 표정 — 웃지 않음. 배경: 정부 청사를 연상시키는 단순한 " +
      "건축물 실루엣(기관명 없음).",
  },
  {
    id: "owl_ep3_s7_impact_b",
    file: "owl_ep3_s7_impact_b.png",
    first: false,
    clause:
      "장면 7 (영향 2/2 — 역설 결론): 고개를 살짝 갸웃하며 아이러니를 짚어내는 듯한 " +
      "표정(살짝 씁쓸한 미소 정도는 허용, 크게 웃지는 않음), 한 날개를 들어 " +
      "가볍게 좌우로 흔드는 제스처. 배경: 앞 장면과 동일한 정책 표지판이 이번엔 " +
      "배경 뒤쪽으로 물러나 아파트 단지 실루엣과 함께 보임.",
  },
  {
    id: "owl_ep3_s8_action_a",
    file: "owl_ep3_s8_action_a.png",
    first: false,
    clause:
      "장면 8 (실행 1/4 — 서류 확인): 빈 서류(등기부등본 형태, 글자·숫자 없음)를 " +
      "양 날개로 펼쳐 들고 카메라를 정면으로 응시하며 차분하고 신뢰감 있는 표정으로 " +
      "안내하는 자세 — 웃지 않음. 배경: 밝은 톤의 거실 소파.",
  },
  {
    id: "owl_ep3_s9_action_b",
    file: "owl_ep3_s9_action_b.png",
    first: false,
    clause:
      "장면 9 (실행 2/4 — 대안 안내): 한 날개를 들어 안심시키듯 손바닥을 살짝 펼치며 " +
      "카메라를 향해 설명하는 표정 — 살짝 부드러운 인상이되 크게 웃지는 않음. " +
      "배경: 앞 장면과 동일한 거실, 현관문 실루엣이 옆으로 보임.",
  },
  {
    id: "owl_ep3_s10_action_c",
    file: "owl_ep3_s10_action_c.png",
    first: false,
    clause:
      "장면 10 (실행 3/4 — HUG 신탁 소개): 작은 금고(빈 문, 숫자·텍스트 없음) 모양 " +
      "소품을 한 날개로 가리키며 안심시키는 듯한 따뜻하고 신뢰감 있는 표정 — " +
      "웃지 않되 부드러움. 배경: 은행 창구를 연상시키는 단순한 카운터 실루엣.",
  },
  {
    id: "owl_ep3_s11_action_d",
    file: "owl_ep3_s11_action_d.png",
    first: false,
    clause:
      "장면 11 (실행 4/4 — 마무리 권유): 앞 장면과 동일한 금고 소품 옆에서 고개를 " +
      "끄덕이며 카메라를 정면으로 응시하는 확신에 찬 신뢰감 있는 표정 — 웃지 않음. " +
      "배경: 앞 장면과 동일한 은행 창구 실루엣.",
  },
];

// 4편(서울 12평 이하 초소형 아파트값 1년 새 15% 상승) 9장면. real_estate 도메인.
// action을 3개 씬(실거래가 조회 → 청약 자격 → 디딤돌대출)으로 나누는 새 표준
// (2026-09-18 Owner 확정) 적용 첫 편.
const POSES_OWL_EP4_9SCENE = [
  {
    id: "owl_ep4_s1_hook",
    file: "owl_ep4_s1_hook.png",
    first: true,
    clause:
      "장면 1 (훅): 아담한 크기의 미니어처 아파트 모형(빈 표면, 텍스트·숫자 없음)을 " +
      "한 날개로 들어 보이며 카메라(시청자)를 정면으로 응시하는 놀란 듯 확신에 찬 " +
      "표정 — 웃지 않고 눈을 크게 뜸. 배경: 도심 스카이라인이 보이는 부동산 " +
      "중개소 사무실 창가.",
  },
  {
    id: "owl_ep4_s2_loss_aversion",
    file: "owl_ep4_s2_loss_aversion.png",
    first: false,
    // 배경 지시를 "앞 장면과 동일한"(상대적 표현)으로 뒀더니 실제로는 전혀 다른
    // 뉴스룸/스튜디오 톤으로 나왔다(2026-09-18 Owner 지적: "캐릭터는 그대로 두고
    // 배경만 바꾸자"). 씬1의 배경(도심 스카이라인이 보이는 통유리창 사무실)을
    // 절대적으로 다시 명시해 재현율을 높인다.
    clause:
      "장면 2 (손실 회피): 빈 저금통 소품(글자·숫자 없음)을 한 손에 들고 다른 손으로는 " +
      "걱정스럽게 관자놀이를 짚으며 카메라를 향해 안타까운 표정을 짓는 자세 — " +
      "웃지 않음. 배경: 도심 스카이라인이 내다보이는 밝은 사무실 통유리창 " +
      "(서울 아파트 단지 실루엣이 보임, 건물명·숫자 없음) — 앞 장면과 똑같은 " +
      "창가 공간, 은은한 화이트·베이지 톤 인테리어, 어둡거나 파란 조명의 " +
      "뉴스룸/스튜디오 배경으로 바뀌지 않도록 유지.",
  },
  {
    id: "owl_ep4_s3_evidence_card",
    file: "owl_ep4_s3_evidence_card.png",
    first: false,
    // 1차 시도에서 오른쪽(서울 전체) 그래프가 막대가 점점 짧아지는 "하락" 모양으로
    // 나와, 실제로는 둘 다 상승(+15%, +14.6%)인 대본 내용과 어긋나 보였다
    // (2026-09-18 Owner 지적). 두 그래프 모두 막대가 점점 커지는 상승 형태여야
    // 한다는 것을 명시적으로 지정해 재생성.
    clause:
      "장면 3 (근거 제시): 두 개의 빈 막대그래프 소품(수치·텍스트 없음)을 양 날개로 " +
      "하나씩 들어 비교하듯 보여주며 카메라를 정면으로 응시하는 진지하고 냉철한 " +
      "표정 — 웃지 않음. 두 그래프 모두 반드시 막대가 왼쪽에서 오른쪽으로 갈수록 " +
      "점점 커지는 '상승' 형태여야 한다 — 색상(예: 하나는 파란 계열, 하나는 " +
      "붉은/주황 계열)으로만 두 그룹을 구분하고, 하락하거나 막대가 작아지는 " +
      "그래프는 절대 넣지 않는다(두 수치 모두 실제로는 상승 지표이기 때문). " +
      "배경: 서울 소형 아파트 단지 실루엣이 보이는 창가.",
  },
  {
    id: "owl_ep4_s4_background",
    file: "owl_ep4_s4_background.png",
    first: false,
    clause:
      "장면 4 (배경 설명): 빈 계기판/게이지 모양 소품(숫자 없음)을 한 손에 들고 " +
      "다른 손으로는 설명하듯 가리키는 진지한 표정 — 웃지 않음. 배경: 한국은행을 " +
      "연상시키는 단순한 건축물 실루엣(기관명 없음)이 먼 배경에 보임.",
  },
  {
    id: "owl_ep4_s5_twist",
    file: "owl_ep4_s5_twist.png",
    first: false,
    clause:
      "장면 5 (반전): 한 손으로는 큰 집 모형(빈 표면)을, 다른 손으로는 작은 집 모형을 " +
      "들어 대비시키며 작은 쪽을 살짝 강조하듯 기울이는 확신에 찬 표정 — 웃지 않음. " +
      "배경: 서울 아파트 단지 파노라마 창가.",
  },
  {
    id: "owl_ep4_s6_impact",
    file: "owl_ep4_s6_impact.png",
    first: false,
    clause:
      "장면 6 (영향 — 진입 장벽): 빈 벽돌담 또는 장벽 모양 소품(텍스트 없음) 앞에 " +
      "서서 한 날개로 그것을 가리키며 안타까운 진지한 표정 — 웃지 않음. 배경: " +
      "앞 장면과 동일한 도시 파노라마 창가, 톤은 살짝 어둡게.",
  },
  {
    id: "owl_ep4_s7_action_a",
    file: "owl_ep4_s7_action_a.png",
    first: false,
    clause:
      "장면 7 (실행 1/3 — 실거래가 조회): 빈 태블릿 화면(화면 완전히 비어 있음, " +
      "텍스트·숫자·아이콘 없음)을 한 날개로 들고 다른 날개로 화면을 가리키며 " +
      "차분하고 신뢰감 있게 안내하는 표정 — 웃지 않음. 배경: 밝은 톤의 거실 소파.",
  },
  {
    id: "owl_ep4_s8_action_b",
    file: "owl_ep4_s8_action_b.png",
    first: false,
    clause:
      "장면 8 (실행 2/3 — 청약 자격 확인): 빈 서류(청약 신청서 형태, 글자·숫자 없음)를 " +
      "양 날개로 펼쳐 들고 카메라를 향해 안내하는 부드럽고 신뢰감 있는 표정 — " +
      "웃지 않되 따뜻함. 배경: 앞 장면과 동일한 거실.",
  },
  {
    id: "owl_ep4_s9_action_c",
    file: "owl_ep4_s9_action_c.png",
    first: false,
    clause:
      "장면 9 (실행 3/3 — 대출 한도 계산 마무리): 작은 계산기 모양 소품(빈 화면, " +
      "숫자 없음)을 한 날개로 들고 고개를 살짝 끄덕이며 카메라를 정면으로 " +
      "응시하는 확신에 찬 신뢰감 있는 표정 — 웃지 않음. 배경: 앞 장면과 동일한 거실.",
  },
];

// 5편(한국은행 기준금리 3.00%, 11월 추가 인상) 10장면. impact를 대출자/자산시장
// 두 갈래로, action을 변동금리 대출자/신규 대출 예정자/투자자 세 유형으로 나눈
// 2026-09-18 최종 대본 반영. 씬 1~8만 여기서 생성(씬 9~10은 Flow 자동화 대상).
const POSES_OWL_EP5_10SCENE = [
  {
    id: "owl_ep5_s1_hook",
    file: "owl_ep5_s1_hook.png",
    first: true,
    clause:
      "장면 1 (훅): 탁상 달력 소품을 한 날개로 들어 보이며 카메라(시청자)를 " +
      "정면으로 응시하는 놀란 듯 확신에 찬 표정 — 웃지 않고 눈을 크게 뜸. " +
      "달력 페이지에는 7행 5열의 빈 날짜 격자(달력 그리드 선)만 인쇄되어 " +
      "있어야 한다 — 숫자나 글자는 전혀 없지만, 격자선 자체는 뚜렷하게 " +
      "보여야 하고 그중 한 칸(오른쪽 아래 칸)에 작은 빨간 원 표시(동그라미 " +
      "친 표시, 숫자 없음)가 되어 있어 '특정 날짜를 짚고 있다'는 인상을 " +
      "줘야 한다. 완전히 새하얀 백지 페이지로 나오면 안 된다. 배경: 도심 " +
      "스카이라인이 보이는 통유리창 사무실.",
  },
  {
    id: "owl_ep5_s2_loss_aversion",
    file: "owl_ep5_s2_loss_aversion.png",
    first: false,
    clause:
      "장면 2 (손실 회피 — 대출도 투자도): 한 손에는 위쪽으로 향하는 굵은 빨간 " +
      "화살표 하나만 그려진 카드(숫자·글자 없음, 화살표만), 다른 손에는 " +
      "아래쪽으로 향하는 굵은 파란 화살표 하나만 그려진 카드(숫자·글자 없음, " +
      "화살표만)를 각각 들고 두 소품을 번갈아 보듯 걱정스러운 표정을 짓는 " +
      "자세 — 웃지 않음. 두 카드 모두 화살표 하나 외에는 다른 그림·표· " +
      "텍스트·숫자가 없어야 한다(실제 수치는 나중에 합성으로 얹는다). 완전히 " +
      "새하얀 빈 백지로 나오면 안 되고, 반드시 방향을 가리키는 화살표가 " +
      "선명하게 보여야 한다. 배경은 반드시 다음과 절대적으로 동일해야 한다 — 어두운 " +
      "우드톤 원목 책상과 짙은 갈색 가죽 임원 의자가 왼쪽에 보이고, 오른쪽에는 " +
      "초록 잎 화분과 책이 꽂힌 선반, 그 옆에 지구본 소품이 있으며, 정면 뒤로는 " +
      "바닥부터 천장까지 통유리창 너머 도심 고층빌딩 스카이라인이 보이는 밝은 " +
      "사무실. 바닥은 광택 있는 밝은 회색 대리석 타일. 크림색 패브릭 소파, " +
      "카펫 러그, 액자가 있는 거실풍 공간으로 바뀌면 안 된다 — 반드시 원목 " +
      "책상+가죽 의자+책장 조합의 사무실 공간을 유지한다.",
  },
  {
    id: "owl_ep5_s3_evidence_card",
    file: "owl_ep5_s3_evidence_card.png",
    first: false,
    clause:
      "장면 3 (근거 제시): 빈 막대그래프 카드 소품을 한 날개로 들고 다른 " +
      "날개로 가리키며 카메라를 정면으로 응시하는 진지하고 냉철한 표정 — " +
      "웃지 않음. 카드에는 왼쪽보다 오른쪽이 더 높은 두 개의 빈 막대(윤곽선만, " +
      "숫자·글자 전혀 없음)가 그려져 있어 상승 추세를 보여줘야 한다 — 완전히 " +
      "새하얀 백지 카드로 나오면 안 된다. 배경: 앞 장면과 동일한 통유리창 " +
      "사무실.",
  },
  {
    id: "owl_ep5_s4_background",
    file: "owl_ep5_s4_background.png",
    first: false,
    clause:
      "장면 4 (배경 설명 — 환율·집값·유가 동반 상승): 디지털 전광판/태블릿 형태의 " +
      "소품을 한 날개로 가리키며 설명하는 진지한 표정 — 웃지 않음. 화면에는 " +
      "위쪽을 향하는 화살표 아이콘 3개가 나란히 빛나듯 표시되어 있어야 " +
      "한다(주황·빨강 계열 네온/발광 스타일, 짙은 남색 배경, 숫자·글자 " +
      "전혀 없음, 오직 화살표 3개만) — 완전히 빈 화면이나 검게 칠해지기만 " +
      "한 판으로 나오면 안 된다. 배경: 앞 장면과 동일한 통유리창 사무실, " +
      "창밖으로 도심 스카이라인 실루엣이 보임.",
  },
  {
    id: "owl_ep5_s5_twist",
    file: "owl_ep5_s5_twist.png",
    first: false,
    clause:
      "장면 5 (반전 — 유가 85달러 기준): 빈 유가 게이지 소품(바늘·눈금만 있고 " +
      "숫자 없음)을 양 날개로 들어 보이며 확신에 찬 진지한 표정 — 웃지 않음. " +
      "배경: 앞 장면과 동일한 통유리창 사무실.",
  },
  {
    id: "owl_ep5_s6_impact_a",
    file: "owl_ep5_s6_impact_a.png",
    first: false,
    clause:
      "장면 6 (영향 1/2 — 대출자 이자 부담): 위쪽으로 향하는 굵은 빨간 화살표 " +
      "하나가 크게 그려진 카드(숫자·글자 없음, 화살표만, 클립이나 바인더 " +
      "없이 낱장)를 두 날개로 들고 안타까운 진지한 표정을 짓는 자세 — 웃지 " +
      "않음. 카드는 완전히 새하얀 백지로 나오면 안 되고, 반드시 뚜렷한 " +
      "상승 화살표 하나가 보여야 한다. 배경은 반드시 다음과 " +
      "절대적으로 동일해야 한다 — 바닥부터 천장까지 이어지는 통유리창 너머로 " +
      "도심 고층빌딩 스카이라인과 강물이 보이고, 왼쪽에는 초록 화분과 짙은 " +
      "색 대리석 카운터가 있는 밝은 사무실 공간. 바닥은 광택 있는 회색 대리석 " +
      "타일. 파란 조명의 뉴스 스튜디오, 세계지도 벽, 트로피, 방송 데스크가 " +
      "있는 뉴스룸 배경으로 절대 바뀌면 안 된다 — 반드시 낮의 밝은 통유리창 " +
      "사무실을 유지한다.",
  },
  {
    id: "owl_ep5_s7_impact_b",
    file: "owl_ep5_s7_impact_b.png",
    first: false,
    clause:
      "장면 7 (영향 2/2 — 자산시장 부담): 가로세로 눈금선이 그려진 격자 " +
      "그래프 카드 소품을 한 날개로 들고 다른 날개로는 카드를 가리키며 " +
      "걱정스러운 진지한 표정 — 웃지 않음. 격자 위에는 오른쪽 아래로 " +
      "꺾이며 내려가는 얇은 꺾은선 곡선 하나가 그려져 있어야 한다(숫자· " +
      "라벨 전혀 없음, 오직 하락하는 선 하나만) — 완전히 빈 좌표축 격자만 " +
      "있고 아무 곡선도 없는 카드로 나오면 안 된다. 배경은 반드시 다음과 " +
      "절대적으로 동일해야 " +
      "한다 — 바닥부터 천장까지 이어지는 통유리창 너머로 도심 고층빌딩 " +
      "스카이라인과 강물이 보이고, 왼쪽에는 초록 화분과 짙은 색 대리석 " +
      "카운터가 있는 밝은 사무실 공간. 바닥은 광택 있는 회색 대리석 타일. " +
      "세계지도 스크린, 어두운 뉴스 데스크가 있는 스튜디오 배경으로 절대 " +
      "바뀌면 안 된다 — 반드시 낮의 밝은 통유리창 사무실을 유지한다.",
  },
  {
    id: "owl_ep5_s8_action_a",
    file: "owl_ep5_s8_action_a.png",
    first: false,
    clause:
      "장면 8 (실행 1/3 — 변동금리 대출자, 고정금리 전환 확인): 태블릿 화면에 " +
      "물결 모양(구불구불한) 변동 화살표에서 곧게 뻗은 직선 화살표로 바뀌는 " +
      "간단한 전환 아이콘(화살표 두 개, 숫자·글자 전혀 없음)이 표시된 " +
      "태블릿을 한 날개로 들고 다른 날개로 화면을 가리키며 차분하고 " +
      "신뢰감 있게 안내하는 표정 — 웃지 않음. 화면이 완전히 새하얗게 비어 " +
      "있으면 안 되고, 반드시 두 화살표 아이콘이 보여야 한다. 배경: 밝은 " +
      "톤의 거실 소파.",
  },
  {
    id: "owl_ep5_s9_action_b",
    file: "owl_ep5_s9_action_b.png",
    first: false,
    clause:
      "장면 9 (실행 2/3 — 신규 대출 예정자, 대출 조건 미리 확인): 대출 신청서 " +
      "형태의 서류를 양 날개로 펼쳐 들고 카메라를 향해 안내하는 부드럽고 " +
      "신뢰감 있는 표정 — 웃지 않되 따뜻함. 서류에는 체크박스 3개가 세로로 " +
      "나란히 그려져 있고 그중 위쪽 두 개에는 체크 표시(✓)가 되어 있어야 " +
      "한다(글자·숫자 전혀 없음, 체크박스와 체크 표시만) — 완전히 빈 백지 " +
      "서류로 나오면 안 된다. 배경: 앞 장면과 동일한 밝은 톤의 거실 소파.",
  },
  {
    id: "owl_ep5_s10_action_c",
    file: "owl_ep5_s10_action_c.png",
    first: false,
    clause:
      "장면 10 (실행 3/3 — 투자자, 금리 취약 종목 비중 점검): 원형 파이 " +
      "차트가 그려진 카드 소품(두 조각으로 나뉜 원, 한 조각은 진한 색, " +
      "다른 조각은 옅은 색으로 구분되되 숫자·글자 전혀 없음)을 한 날개로 " +
      "들고 고개를 살짝 끄덕이며 카메라를 정면으로 응시하는 확신에 찬 " +
      "신뢰감 있는 표정 — 웃지 않음. 카드가 완전히 빈 격자나 백지로 " +
      "나오면 안 되고, 반드시 두 조각으로 나뉜 원형 차트가 보여야 한다. " +
      "배경: 앞 장면과 동일한 밝은 톤의 거실 소파.",
  },
];

// 6편(IRP 안전자산 30% 규정, 혼합형 ETF도 인정) 9장면. investing 도메인 첫
// 편이자 배경을 증권사/은행 상담 라운지로 새로 설계한 첫 편(2026-09-19 Owner
// 지적: "4편과 5편이 거의 같은 사무실/거실 배경이라 식상하다" — 1~5편 어디에도
// 쓰지 않은 공간). 소품도 5편에서 확정한 "방향성 있는 이미지" 원칙을 그대로
// 계승(완전 백지 금지, 게이지·저울·체크리스트 등).
// 2026-09-19 재작성 — 소재를 재채택하며(_owl-assembly-spec.mjs 상단 주석 참고)
// 이미지에 정보를 직접 그려 넣는 방식(금박사 1편에서 검증)으로 전면 교체했다.
// 기존엔 "숫자·글자 없음"이 원칙이었으나, 이제는 소품에 실제 문구·수치를 직접
// 그려 넣고 오버레이는 화살표·강조 문구 등으로 병행한다.
const POSES_OWL_EP6_9SCENE = [
  {
    id: "owl_ep6_s1_hook",
    file: "owl_ep6_s1_hook.png",
    first: true,
    clause:
      "장면 1 (훅): 'IRP 계좌'라는 텍스트가 적힌 카드를 한 날개로 들어 보이며, " +
      "카드 위에 안전자산 비중을 나타내는 원형 게이지(약 1/3 구간이 짙은 색으로 " +
      "강조된 형태)를 함께 그려 넣는다. 카메라(시청자)를 정면으로 응시하는 놀란 " +
      "듯 확신에 찬 표정 — 웃지 않고 눈을 크게 뜸. 배경: 증권사·은행 상담 " +
      "라운지 — 벽에 시세·차트가 흐르는 대형 디지털 데이터 패널(구체적 숫자·" +
      "종목명은 흐릿하게 처리되어 읽을 수 없음), 세련된 상담 데스크와 편안한 " +
      "라운지 의자가 보이는 밝은 공간.",
  },
  {
    id: "owl_ep6_s2_loss_aversion",
    file: "owl_ep6_s2_loss_aversion.png",
    first: false,
    clause:
      "장면 2 (손실 회피): 채권 증서 카드만 가득 담긴 상자를 안타까운 표정으로 " +
      "내려다보는 자세 — 웃지 않음. 상자 옆 빈 공간에 '성장 자산'이라는 텍스트와 " +
      "그쪽을 가리키는 화살표를 함께 그려 넣어 '놓치고 있는 기회'를 시각화한다. " +
      "배경은 앞 장면과 절대적으로 동일해야 한다 — 대형 데이터 패널이 있는 " +
      "증권사·은행 상담 라운지, 세련된 상담 데스크와 라운지 의자.",
  },
  {
    id: "owl_ep6_s3_evidence_card",
    file: "owl_ep6_s3_evidence_card.png",
    first: false,
    clause:
      "장면 3 (근거 제시): 옆에 큼직한 정보 카드(패널) 소품을 배치하고 그 안에 " +
      "'개인형퇴직연금 IRP', '안전자산 최소 30%' 문구와 원형 게이지(30% 구간 " +
      "강조)를 명확히 그려 넣는다. 카드 하단에 작은 글씨로 '퇴직연금 감독규정' " +
      "출처 표기. 한 날개로 카드를 가리키며 카메라를 정면으로 응시하는 진지하고 " +
      "냉철한 표정 — 웃지 않음. 배경: 증권사·은행 상담 라운지 — 벽에 '투자상담 " +
      "Investment Consultation'이라는 표지판과 '더 나은 오늘, 든든한 내일 WE " +
      "INVEST A BRIGHTER TOMORROW' 문구, 시세·차트가 흐르는 대형 디지털 데이터 " +
      "패널(구체적 숫자·종목명은 흐릿하게 처리), 세련된 상담 데스크와 편안한 " +
      "라운지 의자가 보이는 밝은 공간(뉴스룸이나 지구본이 있는 서재풍 배경은 " +
      "절대 아님).",
  },
  {
    id: "owl_ep6_s4_background",
    file: "owl_ep6_s4_background.png",
    first: false,
    clause:
      "장면 4 (배경 설명 — 흔한 오해): 채권 증서 카드 한 장을 한 날개로 들고, " +
      "카드에 '채권형만?'이라는 물음표 느낌의 작은 텍스트를 그려 넣는다. 다른 " +
      "날개로는 고개를 갸웃하듯 관자놀이를 짚는 자세, 생각에 잠긴 진지한 표정 " +
      "— 웃지 않음. 배경: 증권사·은행 상담 라운지 — 벽에 '투자상담 Investment " +
      "Consultation'이라는 표지판과 '더 나은 오늘, 든든한 내일 WE INVEST A " +
      "BRIGHTER TOMORROW' 문구, 시세·차트가 흐르는 대형 디지털 데이터 패널, " +
      "세련된 상담 데스크와 편안한 라운지 의자가 보이는 밝은 공간(뉴스룸이나 " +
      "지구본이 있는 서재풍 배경은 절대 아님).",
  },
  {
    id: "owl_ep6_s5_twist",
    file: "owl_ep6_s5_twist.png",
    first: false,
    clause:
      "장면 5 (반전 — 혼합형도 인정): 한 손에는 채권 증서 카드를, 다른 손에는 " +
      "주식 차트 카드를 나란히 들어 보이며, 두 카드 사이에 '5 : 5'라는 비율 " +
      "표기를 명확히 그려 넣어 혼합 비율을 직접 보여준다. 확신에 찬 표정 — 웃지 " +
      "않음. 배경: 증권사·은행 상담 라운지 — 벽에 '투자상담 Investment " +
      "Consultation'이라는 표지판과 '더 나은 오늘, 든든한 내일 WE INVEST A " +
      "BRIGHTER TOMORROW' 문구, 시세·차트가 흐르는 대형 디지털 데이터 패널, " +
      "세련된 상담 데스크와 편안한 라운지 의자가 보이는 밝은 공간(뉴스룸이나 " +
      "지구본이 있는 서재풍 배경은 절대 아님).",
  },
  {
    id: "owl_ep6_s6_impact",
    file: "owl_ep6_s6_impact.png",
    first: false,
    clause:
      "장면 6 (영향 — 기회를 스스로 좁힘): 좁아지는 문(입구가 점점 좁아지는 " +
      "형태) 모양 소품을 한 날개로 가리키며, 문 안쪽에 '선택지'라는 작은 표기를 " +
      "그려 넣어 스스로 좁히는 선택지를 시각화한다. 안타까운 진지한 표정 — 웃지 " +
      "않음. 배경: 증권사·은행 상담 라운지 — 벽에 '투자상담 Investment " +
      "Consultation'이라는 표지판과 '더 나은 오늘, 든든한 내일 WE INVEST A " +
      "BRIGHTER TOMORROW' 문구, 디지털 데이터 패널이 보이는 공간, 톤은 살짝 " +
      "어둡게(뉴스룸이나 지구본이 있는 서재풍 배경은 절대 아님).",
  },
  {
    id: "owl_ep6_s7_action_a",
    file: "owl_ep6_s7_action_a.png",
    first: false,
    clause:
      "장면 7 (실행 1/3 — 상품 목록 확인): 스마트폰 화면을 들고 있는 포즈, " +
      "화면 안에는 'IRP 상품 목록'이라는 제목과 '혼합형 ETF' 항목 옆에 '안전자산 " +
      "편입 가능' 체크 표시를 명확히 그려 넣는다. 화면을 가리키며 차분하고 " +
      "신뢰감 있는 표정 — 웃지 않음. 배경: 증권사·은행 상담 라운지 — 벽에 " +
      "'투자상담 Investment Consultation'이라는 표지판과 '더 나은 오늘, 든든한 " +
      "내일 WE INVEST A BRIGHTER TOMORROW' 문구, 디지털 데이터 패널이 보이는 " +
      "밝은 공간(뉴스룸이나 지구본이 있는 서재풍 배경은 절대 아님).",
  },
  {
    id: "owl_ep6_s8_action_b",
    file: "owl_ep6_s8_action_b.png",
    first: false,
    clause:
      "장면 8 (실행 2/3 — 검색·메모): 태블릿 화면을 들고 있는 포즈, 화면 안에는 " +
      "돋보기 검색 아이콘과 '혼합형 ETF' 검색어, 그 아래 메모 아이콘을 함께 " +
      "그려 넣어 '검색 후 메모'라는 두 단계 행동을 시각화한다. 화면을 가리키며 " +
      "안내하는 표정 — 웃지 않음. 배경: 증권사·은행 상담 라운지 — 벽에 '투자상담 " +
      "Investment Consultation'이라는 표지판과 '더 나은 오늘, 든든한 내일 WE " +
      "INVEST A BRIGHTER TOMORROW' 문구, 디지털 데이터 패널이 보이는 밝은 공간 " +
      "(뉴스룸이나 지구본이 있는 서재풍 배경은 절대 아님).",
  },
  {
    id: "owl_ep6_s9_action_c",
    file: "owl_ep6_s9_action_c.png",
    first: false,
    clause:
      "장면 9 (실행 3/3 — 기존 보유자 점검, 마무리): 자산 구성 비율을 나타내는 " +
      "원형 그래프 서류(현재 채권 100%로 표시된 형태)를 양 날개로 펼쳐 들고 " +
      "고개를 갸웃하며 고민하는 신중한 표정 — 웃지 않음. 배경: 증권사·은행 " +
      "상담 라운지 — 벽에 '투자상담 Investment Consultation'이라는 표지판과 " +
      "'더 나은 오늘, 든든한 내일 WE INVEST A BRIGHTER TOMORROW' 문구, 디지털 " +
      "데이터 패널이 보이는 밝은 공간(뉴스룸이나 지구본이 있는 서재풍 배경은 " +
      "절대 아님).",
  },
];

// 부엉이 7편(3배 레버리지 ETF에 1.1조 다시 몰린 이유) 9장면 —
// scripts/_owl-ep7-assembly-spec.mjs의 imageBrief를 그대로 옮긴 것. 6편에서
// 확정한 방식(배경 문구를 모든 씬 clause에 동일하게 반복 삽입해 배경 일관성
// 사고 방지) 그대로 계승. 배경은 홈트레이딩 데스크(대형 모니터+캔들차트+
// 호가창) — 1~6편(사무실/거실/증권사 라운지)과 겹치지 않는 새 공간.
const OWL_EP7_BG =
  "홈트레이딩 데스크 — 대형 모니터에 캔들차트와 호가창이 떠 있고(구체적 숫자·" +
  "종목명은 흐릿하게 처리되어 읽을 수 없음), 책상 위에 노트북과 커피잔이 놓인 " +
  "개인 투자자용 밝은 홈오피스 공간(1~6편의 사무실·거실·증권사 상담 라운지와는 " +
  "다른 배경, 뉴스룸이나 지구본이 있는 서재풍 배경은 절대 아님).";
const POSES_OWL_EP7_9SCENE = [
  {
    id: "owl_ep7_s1_hook",
    file: "owl_ep7_s1_hook.png",
    first: true,
    clause:
      `장면 1 (훅): 스마트폰 화면을 한 날개로 들어 보이며, 화면 안에 'ETF 순매수' ` +
      `제목과 '1.1조원' 숫자, 상승 화살표를 명확히 그려 넣는다. 카메라(시청자)를 ` +
      `정면으로 응시하는 놀란 듯 확신에 찬 표정 — 웃지 않고 눈을 크게 뜸. ` +
      `배경: ${OWL_EP7_BG}`,
  },
  {
    id: "owl_ep7_s2_loss_aversion",
    file: "owl_ep7_s2_loss_aversion.png",
    first: false,
    clause:
      `장면 2 (손실 회피): 급격히 아래로 꺾이는 빨간 화살표 그래프 소품을 한 ` +
      `날개로 가리키며, 화살표 옆에 '원금 이상 손실'이라는 경고성 문구를 작게 ` +
      `그려 넣는다. 진지하고 걱정스러운 표정 — 웃지 않음. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP7_BG}`,
  },
  {
    id: "owl_ep7_s3_evidence_card",
    file: "owl_ep7_s3_evidence_card.png",
    first: false,
    clause:
      `장면 3 (근거 제시): 옆에 큼직한 정보 패널 소품을 배치하고 그 안에 ` +
      `'한국예탁결제원 집계', '반도체 3배 레버리지 ETF', '순매수 전환'이라는 ` +
      `문구와 상승 막대그래프를 명확히 그려 넣는다. 한 날개로 패널을 가리키며 ` +
      `카메라를 정면으로 응시하는 진지하고 냉철한 표정 — 웃지 않음. ` +
      `배경: ${OWL_EP7_BG}`,
  },
  {
    id: "owl_ep7_s4_background",
    file: "owl_ep7_s4_background.png",
    first: false,
    clause:
      `장면 4 (배경 설명 — 흔한 오해): 상승 화살표와 '수익 3배'라는 문구만 크게 ` +
      `적힌 카드를 한 날개로 들고 흥미롭게 바라보는 표정 — 웃지 않되 호기심 어린 ` +
      `눈빛. 카드에는 손실 관련 표기는 전혀 없이 상승만 강조돼 있어 '반쪽짜리 ` +
      `정보'라는 톤을 시각화한다. 배경: ${OWL_EP7_BG}`,
  },
  {
    id: "owl_ep7_s5_twist",
    file: "owl_ep7_s5_twist.png",
    first: false,
    clause:
      `장면 5 (반전 — 손실도 3배): 한 손에는 상승 화살표 카드를, 다른 손에는 ` +
      `하락 화살표 카드를 나란히 들어 보이며, 두 카드 모두 '3배'라는 동일한 ` +
      `배율 표기를 명확히 그려 넣어 양방향으로 배율이 적용됨을 보여준다. ` +
      `진지하고 확신에 찬 표정 — 웃지 않음. 배경: ${OWL_EP7_BG}`,
  },
  {
    id: "owl_ep7_s6_impact",
    file: "owl_ep7_s6_impact.png",
    first: false,
    clause:
      `장면 6 (영향 — 체감 수치): 계산기와 빠르게 줄어드는 막대그래프 소품을 ` +
      `함께 들고 심각한 표정으로 내려다보는 자세 — 웃지 않음. 그래프 옆에 ` +
      `'지수 -10%'와 '잔고 -30%'라는 대비되는 두 수치를 명확히 그려 넣는다. ` +
      `배경: ${OWL_EP7_BG.replace("밝은", "톤은 살짝 어둡게, 밝은")}`,
  },
  {
    id: "owl_ep7_s7_action_a",
    file: "owl_ep7_s7_action_a.png",
    first: false,
    clause:
      `장면 7 (실행 1/3 — 자금 성격 점검): 가계부나 통장 소품을 양 날개로 펼쳐 ` +
      `들고 진지하게 점검하는 표정 — 웃지 않음. 통장에는 '여유자금 점검'이라는 ` +
      `문구를 작게 그려 넣는다. 배경: ${OWL_EP7_BG}`,
  },
  {
    id: "owl_ep7_s8_action_b",
    file: "owl_ep7_s8_action_b.png",
    first: false,
    clause:
      `장면 8 (실행 2/3 — 구조 공부): 책이나 상품설명서를 한 날개로 들고 ` +
      `진지하게 읽고 있는 신중한 표정 — 웃지 않음. 책 표지에 'ETF 상품설명서' ` +
      `라는 문구를 작게 그려 넣는다. 배경: ${OWL_EP7_BG}`,
  },
  {
    id: "owl_ep7_s9_action_c",
    file: "owl_ep7_s9_action_c.png",
    first: false,
    clause:
      `장면 9 (실행 3/3 — 뉴스 습관, 마무리): 스마트폰으로 경제 뉴스를 읽으며 ` +
      `고개를 끄덕이는 밝고 신뢰감 있는 표정 — 은은한 미소는 허용(마무리 톤이라 ` +
      `다른 씬보다 부드러워도 됨). 화면에는 '경제 뉴스'라는 제목만 작게 그려 ` +
      `넣는다. 배경: ${OWL_EP7_BG}`,
  },
];

// 부엉이 8편(투자경고 종목, 4건 중 1건 30% 급락) 10장면 —
// scripts/_owl-ep8-assembly-spec.mjs의 imageBrief를 그대로 옮긴 것. 오프닝
// 신설로 부엉이 편 최초 10장면 구성. 배경은 증권사 트레이딩룸/리서치 데스크
// (경고 알림창이 뜬 대형 모니터) — 1~7편(사무실/거실/증권사 상담 라운지/
// 홈트레이딩 데스크)과 겹치지 않는 새 공간.
const OWL_EP8_BG =
  "증권사 트레이딩룸/리서치 데스크 — 대형 모니터에 빨간 경고 알림창과 " +
  "'투자경고' 아이콘이 떠 있고(구체적 종목명·가격은 흐릿하게 처리되어 읽을 " +
  "수 없음), 여러 개의 보조 모니터가 늘어선 전문적인 리서치 공간(1~7편의 " +
  "사무실·거실·증권사 상담 라운지·홈트레이딩 데스크와는 다른 배경).";
const POSES_OWL_EP8_10SCENE = [
  {
    id: "owl_ep8_s1_opening",
    file: "owl_ep8_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경에 '투자경고' 글자가 ` +
      `크게 쓰인 대형 모니터나 전광판을 배치해 오늘 주제를 예고. 특정 종목명· ` +
      `매수 유도 요소 없음. 배경: ${OWL_EP8_BG}`,
  },
  {
    id: "owl_ep8_s2_hook",
    file: "owl_ep8_s2_hook.png",
    first: false,
    clause:
      `장면 2 (훅): 스마트폰 화면을 한 날개로 들어 보이며, 화면 안에 '투자경고' ` +
      `딱지 아이콘과 급락하는 빨간 화살표 그래프를 명확히 그려 넣는다. 카메라 ` +
      `(시청자)를 정면으로 응시하는 놀란 듯 확신에 찬 표정 — 웃지 않고 눈을 ` +
      `크게 뜸. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP8_BG}`,
  },
  {
    id: "owl_ep8_s3_loss_aversion",
    file: "owl_ep8_s3_loss_aversion.png",
    first: false,
    clause:
      `장면 3 (손실 회피): 깜빡이는 빨간 경고등 소품을 한 날개로 가리키며, ` +
      `경고등 옆에 '위험 신호'라는 문구를 작게 그려 넣는다. 진지하고 걱정스러운 ` +
      `표정 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP8_BG}`,
  },
  {
    id: "owl_ep8_s4_evidence_card",
    file: "owl_ep8_s4_evidence_card.png",
    first: false,
    clause:
      `장면 4 (근거 제시): 옆에 큼직한 정보 패널 소품을 배치하고 그 안에 ` +
      `'투자경고·위험 지정 1,548건', '68% 하락'이라는 문구와 하락 원그래프를 ` +
      `명확히 그려 넣는다. 한 날개로 패널을 가리키며 카메라를 정면으로 응시하는 ` +
      `진지하고 냉철한 표정 — 웃지 않음. 배경: ${OWL_EP8_BG}`,
  },
  {
    id: "owl_ep8_s5_background",
    file: "owl_ep8_s5_background.png",
    first: false,
    clause:
      `장면 5 (배경 설명 — 심화 수치): 앞 장면과 이어지는 정보 패널에 '398건', ` +
      `'30% 이상 급락'이라는 문구를 추가로 가리키며, 급락 폭이 더 가파른 빨간 ` +
      `화살표를 함께 그려 넣는다. 진지한 표정 — 웃지 않음. 배경: ${OWL_EP8_BG}`,
  },
  {
    id: "owl_ep8_s6_twist",
    file: "owl_ep8_s6_twist.png",
    first: false,
    clause:
      `장면 6 (반전 — 경고 무시): 한 손에는 '경고' 딱지 카드를, 다른 손에는 ` +
      `매수 버튼을 누르는 손 모양 소품을 나란히 들어 보이며, 두 소품이 서로 ` +
      `모순됨을 시각적으로 보여준다. 진지하고 확신에 찬 표정 — 웃지 않음. ` +
      `배경: ${OWL_EP8_BG}`,
  },
  {
    id: "owl_ep8_s7_impact",
    file: "owl_ep8_s7_impact.png",
    first: false,
    clause:
      `장면 7 (영향 — 반대 매매): 매도 화살표(외국인·기관)와 매수 화살표(개인)가 ` +
      `서로 반대 방향을 가리키는 도식 소품을 심각한 표정으로 내려다보는 자세 — ` +
      `웃지 않음. 도식 옆에 '41종목 중 13종목'이라는 수치를 명확히 그려 넣는다. ` +
      `배경: ${OWL_EP8_BG.replace("전문적인", "톤은 살짝 어둡게, 전문적인")}`,
  },
  {
    id: "owl_ep8_s8_action_a",
    file: "owl_ep8_s8_action_a.png",
    first: false,
    clause:
      `장면 8 (실행 1/2 — 사유 확인): 스마트폰으로 거래소 공시 화면을 확인하는 ` +
      `진지하고 꼼꼼한 표정 — 웃지 않음. 화면에는 '지정 사유 확인'이라는 문구를 ` +
      `작게 그려 넣는다. 배경: ${OWL_EP8_BG}`,
  },
  {
    id: "owl_ep8_s9_action_b",
    file: "owl_ep8_s9_action_b.png",
    first: false,
    clause:
      `장면 9 (실행 2/2 — 판단 점검, 마무리): 상승 그래프 앞에서 팔짱을 끼고 ` +
      `신중하게 되돌아보는 표정 — 은은한 미소는 허용(마무리 톤이라 다른 씬보다 ` +
      `부드러워도 됨). 그래프 옆에 '근거 있는 판단인지 점검'이라는 문구를 작게 ` +
      `그려 넣는다. 배경: ${OWL_EP8_BG}`,
  },
];

// 부엉이 9편(카드론·현금서비스가 신용점수를 깎는 구조) 10장면 —
// scripts/_owl-ep9-assembly-spec.mjs의 imageBrief를 그대로 옮긴 것. Owner 요청으로
// 현실적 대안(서민금융진흥원 1397) 장면을 신설해 10장면 구성. 배경은 은행
// 창구/모바일뱅킹 앱 UI 공간 — 1~8편(사무실/거실/증권사 라운지/홈트레이딩
// 데스크/증권사 트레이딩룸)과 겹치지 않는 새 공간.
const OWL_EP9_BG =
  "은행 창구/모바일뱅킹 앱 UI가 크게 뜬 공간 — 대형 스크린이나 태블릿에 " +
  "모바일뱅킹 앱 화면(구체적 계좌번호·금액은 흐릿하게 처리되어 읽을 수 없음)이 " +
  "떠 있고, 은행 창구 데스크나 상담 공간이 배경에 보이는 밝고 신뢰감 있는 공간 " +
  "(1~8편의 사무실·거실·증권사 상담 라운지·홈트레이딩 데스크·증권사 " +
  "트레이딩룸과는 다른 배경, 특정 은행명·로고 없음).";
const POSES_OWL_EP9_10SCENE = [
  {
    id: "owl_ep9_s1_opening",
    file: "owl_ep9_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경에 대형 모바일뱅킹 앱 ` +
      `화면이나 은행 안내 스크린을 배치해 오늘 주제를 예고. 특정 은행명·상품명 ` +
      `없음. 배경: ${OWL_EP9_BG}`,
  },
  {
    id: "owl_ep9_s2_hook",
    file: "owl_ep9_s2_hook.png",
    first: false,
    clause:
      `장면 2 (훅): 스마트폰 화면을 한 날개로 들어 보이며, 화면 안에 '카드론', ` +
      `'현금서비스' 아이콘과 작은 빨간 경고 아이콘을 명확히 그려 넣는다. 카메라 ` +
      `(시청자)를 정면으로 응시하는 놀란 듯 확신에 찬 표정 — 웃지 않고 눈을 ` +
      `크게 뜸. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP9_BG}`,
  },
  {
    id: "owl_ep9_s3_loss_aversion",
    file: "owl_ep9_s3_loss_aversion.png",
    first: false,
    clause:
      `장면 3 (손실 회피): 깜빡이는 빨간 경고등 소품을 한 날개로 가리키며, ` +
      `경고등 옆에 '금리 상승 위험'이라는 문구를 작게 그려 넣는다. 진지하고 ` +
      `걱정스러운 표정 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP9_BG}`,
  },
  {
    id: "owl_ep9_s4_evidence_card",
    file: "owl_ep9_s4_evidence_card.png",
    first: false,
    clause:
      `장면 4 (근거 제시): 옆에 큼직한 정보 패널 소품을 배치하고 그 안에 ` +
      `'담보 없는 고금리 대출', '상환 능력 부족 신호'라는 문구를 명확히 그려 ` +
      `넣는다. 한 날개로 패널을 가리키며 카메라를 정면으로 응시하는 진지하고 ` +
      `냉철한 표정 — 웃지 않음. 배경: ${OWL_EP9_BG}`,
  },
  {
    id: "owl_ep9_s5_background",
    file: "owl_ep9_s5_background.png",
    first: false,
    clause:
      `장면 5 (배경 설명 — 심화 수치): 앞 장면과 이어지는 정보 패널에 '카드론 ` +
      `이용액 28조원', '전년비 +20.9%'라는 문구를 추가로 가리키며, 상승하는 ` +
      `막대그래프를 함께 그려 넣는다. 진지한 표정 — 웃지 않음. 배경: ${OWL_EP9_BG}`,
  },
  {
    id: "owl_ep9_s6_twist",
    file: "owl_ep9_s6_twist.png",
    first: false,
    clause:
      `장면 6 (반전 — 반복 습관): 한 손에는 '한두 번'이라고 쓰인 작은 카드를, ` +
      `다른 손에는 '반복 이용'이라고 쓰인 빨간 경고 카드를 나란히 들어 보이며, ` +
      `두 소품의 대비를 시각적으로 보여준다. 진지하고 확신에 찬 표정 — 웃지 ` +
      `않음. 배경: ${OWL_EP9_BG}`,
  },
  {
    id: "owl_ep9_s7_impact",
    file: "owl_ep9_s7_impact.png",
    first: false,
    clause:
      `장면 7 (영향 — 물음표 누적): 물음표가 여러 개 쌓여가는 도식 소품을 ` +
      `심각한 표정으로 내려다보는 자세 — 웃지 않음. 도식 옆에 '신용점수 반영' ` +
      `이라는 문구를 명확히 그려 넣는다. 배경: ${OWL_EP9_BG.replace("밝고 신뢰감 있는", "톤은 살짝 어둡게, 신뢰감 있는")}`,
  },
  {
    id: "owl_ep9_s8_alternative",
    file: "owl_ep9_s8_alternative.png",
    first: false,
    clause:
      `장면 8 (현실적 대안): 스마트폰으로 전화 상담 화면을 보여주며 밝고 ` +
      `안심시키는 표정 — 은은한 미소는 허용(대안 제시 톤이라 다른 씬보다 ` +
      `부드러워도 됨). 화면에는 '서민금융진흥원 1397'이라는 문구를 명확히 ` +
      `그려 넣는다. 배경: ${OWL_EP9_BG}`,
  },
  {
    id: "owl_ep9_s9_action_a",
    file: "owl_ep9_s9_action_a.png",
    first: false,
    clause:
      `장면 9 (실행 1/2 — 상환 계획): 다이어리나 메모장에 상환 계획을 적는 ` +
      `진지하고 꼼꼼한 표정 — 웃지 않음. 메모장에는 '상환 계획'이라는 문구를 ` +
      `작게 그려 넣는다. 배경: ${OWL_EP9_BG}`,
  },
  {
    id: "owl_ep9_s10_action_b",
    file: "owl_ep9_s10_action_b.png",
    first: false,
    clause:
      `장면 10 (실행 2/2 — 습관 점검, 마무리): 팔짱을 끼고 신중하게 되돌아보는 ` +
      `표정 — 은은한 미소는 허용(마무리 톤이라 다른 씬보다 부드러워도 됨). 옆에 ` +
      `'급한 상황인지 습관인지 점검'이라는 문구를 작게 그려 넣는다. 배경: ` +
      `${OWL_EP9_BG}`,
  },
];

// 부엉이 10편(국민연금 보험료율 9%→13% 인상, 27년 만의 인상) 10장면 —
// scripts/_owl-ep10-assembly-spec.mjs(및 작업용 사본 _owl-assembly-spec.mjs)의
// imageBrief를 그대로 옮긴 것. 배경은 국민연금공단 상담 창구/공적 서류 발급
// 데스크 공간 — 1~9편(사무실/거실/증권사 상담 라운지/홈트레이딩 데스크/증권사
// 트레이딩룸/은행 창구)과 겹치지 않는 새 공간.
const OWL_EP10_BG =
  "국민연금공단 상담 창구나 공적 서류 발급 데스크가 있는 공간 — 대형 스크린이나 " +
  "태블릿에 연금 조회 화면(구체적 개인정보·금액은 흐릿하게 처리되어 읽을 수 없음)이 " +
  "떠 있고, 공공기관 상담 창구 데스크가 배경에 보이는 밝고 신뢰감 있는 공간 " +
  "(1~9편의 사무실·거실·증권사 상담 라운지·홈트레이딩 데스크·증권사 " +
  "트레이딩룸·은행 창구와는 다른 배경, 특정 기관 로고·마크 없이 일반적인 " +
  "공공 상담 창구 톤).";
const POSES_OWL_EP10_10SCENE = [
  {
    id: "owl_ep10_s1_opening",
    file: "owl_ep10_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경에 국민연금공단 상담 ` +
      `창구나 공적 서류 발급 데스크를 배치해 오늘 주제를 예고. 배경: ${OWL_EP10_BG}`,
  },
  {
    id: "owl_ep10_s2_hook",
    file: "owl_ep10_s2_hook.png",
    first: false,
    clause:
      `장면 2 (훅): 급여명세서 형태의 소품을 한 날개로 들어 보이며, 명세서에는 ` +
      `'국민연금' 항목과 작은 위쪽 화살표 아이콘을 명확히 그려 넣는다. 카메라 ` +
      `(시청자)를 정면으로 응시하는 놀란 듯 확신에 찬 표정 — 웃지 않음. 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP10_BG}`,
  },
  {
    id: "owl_ep10_s3_why",
    file: "owl_ep10_s3_why.png",
    first: false,
    clause:
      `장면 3 (왜 지금 올리는가): '1998년 9%'라고 적힌 낡은 서류와, 점점 줄어드는 ` +
      `기금 그래프가 바닥을 향하는 도식을 함께 가리키며 진지하고 걱정스러운 표정 ` +
      `— 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP10_BG}`,
  },
  {
    id: "owl_ep10_s4_evidence_card",
    file: "owl_ep10_s4_evidence_card.png",
    first: false,
    clause:
      `장면 4 (근거 제시): 옆에 큼직한 정보 패널 소품을 배치하고 그 안에 ` +
      `'보험료율 9% → 13%', '2026~2033년 단계적 인상'이라는 문구를 명확히 그려 ` +
      `넣는다. 한 날개로 패널을 가리키며 카메라를 정면으로 응시하는 진지하고 ` +
      `냉철한 표정 — 웃지 않음. 배경: ${OWL_EP10_BG}`,
  },
  {
    id: "owl_ep10_s5_background",
    file: "owl_ep10_s5_background.png",
    first: false,
    clause:
      `장면 5 (배경 설명 — 심화 수치): 앞 장면과 이어지는 정보 패널에 '기금 ` +
      `소진 2071년으로 연장', '직장인 월 +7,700원', '지역가입자 월 +15,400원' ` +
      `이라는 문구를 추가로 가리키며, 늘어난 화살표와 숫자를 나란히 비교하는 ` +
      `작은 그래픽을 함께 그려 넣는다. 진지한 표정 — 웃지 않음. 배경: ${OWL_EP10_BG}`,
  },
  {
    id: "owl_ep10_s6_twist",
    file: "owl_ep10_s6_twist.png",
    first: false,
    clause:
      `장면 6 (반전 — 받는 돈도 오른다): 한 손에는 '더 낸다'라고 쓰인 카드를, ` +
      `다른 손에는 '더 받는다 + 국가 책임'이라고 쓰인 카드를 나란히 들어 보이며, ` +
      `두 소품의 균형을 시각적으로 보여준다. 진지하고 확신에 찬 표정 — 웃지 ` +
      `않음. 배경: ${OWL_EP10_BG}`,
  },
  {
    id: "owl_ep10_s7_impact",
    file: "owl_ep10_s7_impact.png",
    first: false,
    clause:
      `장면 7 (영향 — 소득대체율·국가 책임): '은퇴 전 소득 대비 돌려받는 비율 ` +
      `41.5% → 43%'와 '기금 부족해도 국가 책임'이라는 문구가 함께 적힌 서류 ` +
      `소품을 진지하게 내려다보는 자세 — 웃지 않음. 배경: ${OWL_EP10_BG.replace("밝고 신뢰감 있는", "톤은 살짝 밝게, 신뢰감 있는")}`,
  },
  {
    id: "owl_ep10_s8_alternative",
    file: "owl_ep10_s8_alternative.png",
    first: false,
    clause:
      `장면 8 (내 연금 직접 확인): 스마트폰으로 연금 조회 화면을 보여주며 밝고 ` +
      `안심시키는 표정 — 은은한 미소는 허용(대안 제시 톤이라 다른 씬보다 ` +
      `부드러워도 됨). 화면에는 '내 연금 알아보기'라는 문구를 명확히 그려 ` +
      `넣는다. 배경: ${OWL_EP10_BG}`,
  },
  {
    id: "owl_ep10_s9_action_a",
    file: "owl_ep10_s9_action_a.png",
    first: false,
    clause:
      `장면 9 (실행 1/2 — 직장인): 급여명세서 두 장(현재/내년 예상)을 나란히 ` +
      `손가락으로 짚으며 진지하고 꼼꼼한 표정 — 웃지 않음. 명세서에는 '국민연금 ` +
      `공제액 비교'라는 문구를 작게 그려 넣는다. 배경: ${OWL_EP10_BG}`,
  },
  {
    id: "owl_ep10_s10_action_b",
    file: "owl_ep10_s10_action_b.png",
    first: false,
    clause:
      `장면 10 (실행 2/2 — 자영업자, 마무리): 전화 상담 소품을 들고 신중하게 ` +
      `되돌아보는 표정 — 은은한 미소는 허용(마무리 톤이라 다른 씬보다 부드러워도 ` +
      `됨). 옆에 '국민연금공단 1355'라는 문구를 작게 그려 넣는다. 배경: ` +
      `${OWL_EP10_BG}`,
  },
];

// 11편(고용률 8월 사상 첫 70% 돌파 vs 청년고용 46개월 연속 감소) 배경 —
// 통계청/고용센터 상담 데스크 공간(1~10편과 겹치지 않는 새 배경).
const OWL_EP11_BG =
  "통계청/고용센터 느낌의 밝은 상담 데스크가 있는 공간 — 벽에 걸린 '고용센터' " +
  "안내판 하나, 화분과 의자로 채워진 아늑한 공공기관 상담 톤 (1~10편의 사무실· " +
  "거실·증권사 상담 라운지·홈트레이딩 데스크·증권사 트레이딩룸·은행 창구· " +
  "국민연금공단 상담 창구와는 다른 배경, 특정 기관 로고·마크 없이 일반적인 " +
  "공공 상담 창구 톤).";
const POSES_OWL_EP11_10SCENE = [
  {
    id: "owl_ep11_s1_opening",
    file: "owl_ep11_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경: ${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s2_hook",
    file: "owl_ep11_s2_hook.png",
    first: false,
    clause:
      `장면 2 (훅): 양 날개를 살짝 벌리며 고개를 갸웃하는 의아한 포즈, 눈썹을 ` +
      `찌푸린 궁금한 표정 — 웃지 않음. 옆에 작은 물음표 아이콘 하나만 배치(설명 ` +
      `문구 없이 아이콘만). 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s3_fact",
    file: "owl_ep11_s3_fact.png",
    first: false,
    clause:
      `장면 3 (팩트): 큰 원형 게이지 카드를 한쪽 날개로 감싸 쥐고 자신 있게 ` +
      `가리키는 포즈, 진지하고 확신에 찬 표정 — 웃지 않음. 카드에는 '고용률 ` +
      `70.4%'라는 큰 글자만 명확히 그려 넣는다(작은 부연 설명 없음). 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s4_youth_gap",
    file: "owl_ep11_s4_youth_gap.png",
    first: false,
    clause:
      `장면 4 (반전 근거): 아래로 향하는 빨간 화살표가 그려진 카드를 다른 쪽 ` +
      `날개로 감싸 쥐고 진지하게 보여주는 포즈, 걱정스러운 표정 — 웃지 않음. ` +
      `카드에는 '청년 취업 46개월 연속 감소'라는 큰 글자만 그려 넣는다. 배경: ` +
      `${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s5_why_gap",
    file: "owl_ep11_s5_why_gap.png",
    first: false,
    clause:
      `장면 5 (원인 설명): 바닥에 세운 큰 보드를 한쪽 날개로 가리키는 포즈, ` +
      `침착하고 설명하는 표정 — 웃지 않음. 보드에는 '15세~64세 전체 평균'이라는 ` +
      `큰 글자와 함께, 올라가는 화살표 하나(고령층)와 내려가는 화살표 하나(청년)가 ` +
      `합쳐져 평평한 화살표가 되는 간단한 도식만 그려 넣는다(보드는 바닥 거치라 ` +
      `손으로 들지 않는다). 배경: ${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s6_impact",
    file: "owl_ep11_s6_impact.png",
    first: false,
    clause:
      `장면 6 (임팩트): '고용률 역대 최고'라는 큰 글자가 적힌 신문/뉴스 카드를 ` +
      `한쪽 날개로 감싸 쥐고, 안타깝다는 듯 고개를 살짝 젓는 표정 — 웃지 않음. ` +
      `소품은 카드 하나만. 배경: ${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s7_summary",
    file: "owl_ep11_s7_summary.png",
    first: false,
    clause:
      `장면 7 (요약·관점 전환): 확신에 찬 표정으로 한쪽 날개를 가볍게 들어 ` +
      `강조하는 포즈 — 웃지 않음. 배경 보드에는 '내 또래는 어떨까?'라는 큰 ` +
      `글자 하나만 남기고 다른 소품은 없는 단순한 구도. 배경: ${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s8_action_a",
    file: "owl_ep11_s8_action_a.png",
    first: false,
    clause:
      `장면 8 (실행 1/2 — 채용 제도): 두 개의 제도명이 적힌 카드('중소기업 ` +
      `재직자 우대 저축공제', '국민취업지원제도')를 양쪽 날개로 하나씩 감싸 쥐고 ` +
      `나란히 보여주는 포즈, 따뜻하고 도움을 주는 표정 — 은은한 미소 허용(대안 ` +
      `제시 톤). 배경: ${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s9_action_b",
    file: "owl_ep11_s9_action_b.png",
    first: false,
    clause:
      `장면 9 (실행 2/2 — 통계 확인): 스마트폰 화면('워크넷')을 한쪽 날개로 ` +
      `확실히 감싸 쥔 채 들어 보이고, 다른 쪽 날개로는 바닥에 세운 '고용복지 ` +
      `플러스센터' 안내판을 가리키는 포즈, 진지하고 꼼꼼한 표정 — 웃지 않음. ` +
      `폰 화면이 흔들리지 않도록 고정된 자세로. 배경: ${OWL_EP11_BG}`,
  },
  {
    id: "owl_ep11_s10_action_c",
    file: "owl_ep11_s10_action_c.png",
    first: false,
    clause:
      `장면 10 (마무리): '구직촉진수당' 문구가 큼직하게 적힌 카드를 한쪽 날개로 ` +
      `감싸 쥐고 밝은 미소로 마무리하는 포즈 — 은은한 미소 허용(마무리 톤이라 ` +
      `다른 씬보다 부드러워도 됨). 배경: ${OWL_EP11_BG}`,
  },
];

// 12편(토지거래허가구역 실거주 유예 1년 연장) 배경 — 부동산 중개사무소/구청
// 민원 상담 데스크 공간(1~11편과 겹치지 않는 새 배경).
const OWL_EP12_BG =
  "밝은 공인중개사 사무소 느낌의 상담 데스크가 있는 공간 — 벽에 걸린 '부동산' " +
  "안내판 하나, 매물 게시판과 화분·의자로 채워진 아늑한 상담 톤 (1~11편의 " +
  "사무실·거실·증권사 상담 라운지·홈트레이딩 데스크·증권사 트레이딩룸·은행 " +
  "창구·국민연금공단 상담 창구·고용센터와는 다른 배경, 특정 중개업체 로고·" +
  "마크 없이 일반적인 부동산 상담 창구 톤).";
const POSES_OWL_EP12_10SCENE = [
  {
    id: "owl_ep12_s1_opening",
    file: "owl_ep12_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경: ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s2_background",
    file: "owl_ep12_s2_background.png",
    first: false,
    clause:
      `장면 2 (배경 설명): '토지거래허가구역' 카드를 한쪽 날개로 감싸 쥐고, ` +
      `'4개월 내 입주 · 2년 거주'라는 큰 글자를 함께 가리키는 진지한 포즈 — ` +
      `웃지 않음. 카드에는 이 큰 글자만 명확히 그려 넣는다(작은 부연 설명 없음). ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s3_problem",
    file: "owl_ep12_s3_problem.png",
    first: false,
    clause:
      `장면 3 (문제 제기): 아래로 향하는 빨간 화살표가 그려진 카드를 다른 쪽 ` +
      `날개로 감싸 쥐고 안타까운 표정으로 보여주는 포즈 — 웃지 않음. 카드에는 ` +
      `'전월세 물량 감소'라는 큰 글자만 그려 넣는다. 배경은 앞 장면과 절대적으로 ` +
      `동일해야 한다 — ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s4_existing_relief",
    file: "owl_ep12_s4_existing_relief.png",
    first: false,
    clause:
      `장면 4 (기존 대응): 바닥에 세운 큰 보드를 한쪽 날개로 가리키는 포즈, ` +
      `침착하고 설명하는 표정 — 웃지 않음. 보드에는 '실거주 유예 제도'라는 큰 ` +
      `글자와 시계 아이콘 하나만 그려 넣는다(보드는 바닥 거치라 손으로 들지 ` +
      `않는다). 배경: ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s5_extension",
    file: "owl_ep12_s5_extension.png",
    first: false,
    clause:
      `장면 5 (변화 1 — 기한 연장): '신청기한 1년 연장'이라는 큰 글자가 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 자신 있게 보여주는 포즈, 확신에 찬 표정 — ` +
      `웃지 않음. 배경: ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s6_renewal_included",
    file: "owl_ep12_s6_renewal_included.png",
    first: false,
    clause:
      `장면 6 (변화 2 — 갱신 인정): '갱신 계약도 인정'이라는 큰 글자가 적힌 ` +
      `다른 카드를 다른 쪽 날개로 감싸 쥐고 보여주는 포즈, 밝고 설명적인 표정 ` +
      `— 은은한 미소 허용. 배경: ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s7_impact",
    file: "owl_ep12_s7_impact.png",
    first: false,
    clause:
      `장면 7 (임팩트 — 합산 결과): 바닥에 세운 큰 보드를 한쪽 날개로 들어 ` +
      `강조하는 포즈, 확신에 찬 표정 — 웃지 않음. 보드에는 '최장 2029년 말까지' ` +
      `라는 큰 글자만 그려 넣는다. 배경: ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s8_condition",
    file: "owl_ep12_s8_condition.png",
    first: false,
    clause:
      `장면 8 (조건 — 대상): '무주택 유지 · 입주 후 2년 거주'라는 큰 글자가 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 진지한 표정으로 보여주는 포즈 — ` +
      `웃지 않음. 배경: ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s9_balance",
    file: "owl_ep12_s9_balance.png",
    first: false,
    clause:
      `장면 9 (균형 — 우려): 물음표가 그려진 카드를 한쪽 날개로 감싸 쥐고, ` +
      `고개를 살짝 갸웃하며 신중한 표정을 짓는 포즈 — 웃지 않음. 배경: ${OWL_EP12_BG}`,
  },
  {
    id: "owl_ep12_s10_action",
    file: "owl_ep12_s10_action.png",
    first: false,
    clause:
      `장면 10 (마무리 — 액션): '관할 구청에 확인'이라는 문구가 적힌 스마트폰 ` +
      `화면을 한쪽 날개로 확실히 감싸 쥔 채 들어 보이는 포즈, 밝고 친근한 ` +
      `미소로 마무리 — 은은한 미소 허용(마무리 톤이라 다른 씬보다 부드러워도 됨). ` +
      `폰 화면이 흔들리지 않도록 고정된 자세로. 배경: ${OWL_EP12_BG}`,
  },
];

// 13편(퇴직연금 실물이전) 배경 — 퇴직연금 고객센터 상담 데스크 공간(1~12편과
// 겹치지 않는 새 배경).
const OWL_EP13_BG =
  "밝은 퇴직연금 고객센터 상담 데스크가 있는 공간 — 벽에 걸린 '퇴직연금 상담' " +
  "안내판 하나, 화분·의자·모니터로 채워진 차분한 상담 톤 (1~12편의 사무실·거실·" +
  "증권사 상담 라운지·홈트레이딩 데스크·증권사 트레이딩룸·은행 창구·국민연금공단 " +
  "상담 창구·고용센터·부동산 중개사무소와는 다른 배경, 특정 금융회사 로고·마크 " +
  "없이 일반적인 고객센터 상담 창구 톤).";
const POSES_OWL_EP13_10SCENE = [
  {
    id: "owl_ep13_s1_opening",
    file: "owl_ep13_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경: ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s2_background",
    file: "owl_ep13_s2_background.png",
    first: false,
    clause:
      `장면 2 (배경 설명): '전량 매도 후 현금 이전'이라는 큰 글자가 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고 설명하는 진지한 포즈 — 웃지 않음. 카드에는 이 큰 ` +
      `글자만 명확히 그려 넣는다(작은 부연 설명 없음). 배경은 앞 장면과 절대적으로 ` +
      `동일해야 한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s3_problem",
    file: "owl_ep13_s3_problem.png",
    first: false,
    clause:
      `장면 3 (문제+결과): 아래로 향하는 빨간 화살표와 사슬 아이콘이 함께 그려진 ` +
      `카드를 다른 쪽 날개로 감싸 쥐고 안타까운 표정으로 보여주는 포즈 — 웃지 ` +
      `않음. 카드에는 '매도·재매수 손실 → 그냥 묶임'이라는 큰 글자만 그려 넣는다. ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s4_new_system",
    file: "owl_ep13_s4_new_system.png",
    first: false,
    clause:
      `장면 4 (제도 등장): '실물이전 제도'라는 큰 글자와 화살표 아이콘이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 자신 있는 표정으로 보여주는 포즈, 확신에 찬 ` +
      `표정 — 웃지 않음. 배경: ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s5_scale_flow",
    file: "owl_ep13_s5_scale_flow.png",
    first: false,
    clause:
      `장면 5 (규모+흐름): '상반기 6.9조 원, 은행 → 증권사'라는 큰 글자와 ` +
      `화살표가 적힌 카드를 한쪽 날개로 감싸 쥐고 보여주는 포즈, 밝고 설명적인 ` +
      `표정 — 은은한 미소 허용. 배경: ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s6_condition",
    file: "owl_ep13_s6_condition.png",
    first: false,
    clause:
      `장면 6 (조건): 카드를 한쪽 날개로 감싸 쥐고 진지한 표정으로 보여주는 포즈 ` +
      `— 웃지 않음. 카드 안에는 'DB → DB', 'DC → DC', 'IRP → IRP' 세 줄을 화살표와 ` +
      `함께 세로로 배치한 표 형태로 큰 글자로 넣는다. 배경: ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s7_db_dc_explainer",
    file: "owl_ep13_s7_db_dc_explainer.png",
    first: false,
    clause:
      `장면 7 (DB/DC 설명): 바닥에 세운 큰 보드를 좌우로 나눠, 왼쪽엔 'DB형' ` +
      `글자와 회사 건물 아이콘, 오른쪽엔 'DC형' 글자와 사람이 그래프를 보는 ` +
      `아이콘을 그려 넣는다. 부엉이는 보드 옆에서 차분히 설명하는 표정으로 ` +
      `한쪽 날개를 가볍게 드는 포즈 — 웃지 않음(보드는 바닥 거치라 손으로 들지 ` +
      `않는다). 배경: ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s8_exception",
    file: "owl_ep13_s8_exception.png",
    first: false,
    clause:
      `장면 8 (예외): 물음표가 그려진 카드를 한쪽 날개로 감싸 쥐고, 고개를 ` +
      `살짝 갸웃하며 신중한 표정을 짓는 포즈 — 웃지 않음. 배경: ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s9_upcoming",
    file: "owl_ep13_s9_upcoming.png",
    first: false,
    clause:
      `장면 9 (확대 예정): 'DC형 → 타사 IRP, 확대 추진 중'이라는 큰 글자와 ` +
      `화살표가 적힌 카드를 한쪽 날개로 감싸 쥐고 기대감 있는 밝은 표정으로 ` +
      `보여주는 포즈 — 은은한 미소 허용. '추진 중'이라는 글자는 확정된 시행 ` +
      `문구('시행', '가능')와 시각적으로 구분되도록 작은 별표나 다른 색으로 ` +
      `강조한다. 배경: ${OWL_EP13_BG}`,
  },
  {
    id: "owl_ep13_s10_action",
    file: "owl_ep13_s10_action.png",
    first: false,
    clause:
      `장면 10 (마무리 — 액션): '실물이전 가능 여부 확인'이라는 문구가 적힌 ` +
      `스마트폰 화면을 한쪽 날개로 확실히 감싸 쥔 채 들어 보이는 포즈, 밝고 ` +
      `친근한 미소로 마무리 — 은은한 미소 허용(마무리 톤이라 다른 씬보다 부드러워도 ` +
      `됨). 폰 화면이 흔들리지 않도록 고정된 자세로. 배경: ${OWL_EP13_BG}`,
  },
];

// 14편(한은 금융안정 상황 경고) 배경 — 금융감독 브리핑룸(1~13편과 겹치지
// 않는 새 배경).
const OWL_EP14_BG =
  "밝은 금융감독 브리핑룸 — 브리핑 단상과 뒤쪽 대형 스크린에 상승/하락 " +
  "화살표 그래프 실루엣만 흐릿하게, 화분·의자·스크린으로 채워진 차분한 " +
  "톤 (1~13편의 사무실·거실·증권사 상담 라운지·홈트레이딩 데스크·증권사 " +
  "트레이딩룸·은행 창구·국민연금공단 상담 창구·고용센터·부동산 중개사무소· " +
  "퇴직연금 고객센터와는 다른 배경, 특정 기관 로고·마크 없이 일반적인 " +
  "금융 브리핑룸 톤).";
const POSES_OWL_EP14_10SCENE = [
  {
    id: "owl_ep14_s1_opening",
    file: "owl_ep14_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경: ${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s2_alert",
    file: "owl_ep14_s2_alert.png",
    first: false,
    clause:
      `장면 2 (경고): '금융불안지수 19.5, 주의 단계 진입'이라는 큰 글자와 ` +
      `경고등(노란 원형 조명) 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지한 ` +
      `표정으로 보여주는 포즈 — 웃지 않음. 카드에는 이 큰 글자만 명확히 그려 ` +
      `넣는다(작은 부연 설명 없음). 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s3_twist_highend",
    file: "owl_ep14_s3_twist_highend.png",
    first: false,
    clause:
      `장면 3 (반전 — 고가지역 하락): '강남 -1.28% · 서초 -0.94%'라는 큰 글자와 ` +
      `파란 하락 화살표가 적힌 카드를 한쪽 날개로 감싸 쥐고 놀란 표정으로 ` +
      `보여주는 포즈 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s4_fact_lowend",
    file: "owl_ep14_s4_fact_lowend.png",
    first: false,
    clause:
      `장면 4 (사실 — 저가지역 상승): '중랑 +3.46% · 성북 +3.36% · 강북 ` +
      `+2.92%'라는 큰 글자와 빨간 상승 화살표가 적힌 카드를 다른 쪽 날개로 ` +
      `감싸 쥐고 담담하고 진지한 표정으로 설명하는 포즈 — 웃지 않음. 배경: ` +
      `${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s5_consequence_debt",
    file: "owl_ep14_s5_consequence_debt.png",
    first: false,
    clause:
      `장면 5 (파급 — 가계부채): '가계신용 2019.8조 원, 전년比 +3.6%'라는 큰 ` +
      `글자와 우상향 막대그래프 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 ` +
      `걱정스러운 표정으로 보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s6_evidence_delinquency",
    file: "owl_ep14_s6_evidence_delinquency.png",
    first: false,
    clause:
      `장면 6 (근거 — 연체율): '취약 자영업자 연체율 12.71%'라는 큰 글자와 붉은 ` +
      `경고 삼각형 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 심각한 표정으로 ` +
      `보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s7_twist_timing",
    file: "owl_ep14_s7_twist_timing.png",
    first: false,
    clause:
      `장면 7 (반전 — 시차): 시계 아이콘과 '금리인상 효과, 취약차주일수록 ` +
      `빠르게'라는 큰 글자가 적힌 카드를 한쪽 날개로 감싸 쥐고 놀란 듯 진지한 ` +
      `표정으로 보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s8_impact_months",
    file: "owl_ep14_s8_impact_months.png",
    first: false,
    clause:
      `장면 8 (영향 — 개월 수 비교): 바닥에 세운 큰 보드를 좌우로 나눠, 왼쪽엔 ` +
      `'전체 차주, 15개월 후 최대 영향' 글자와 긴 시계 아이콘, 오른쪽엔 ` +
      `'취약차주·중소기업, 9개월 후 최대 영향' 글자와 짧은 시계 아이콘을 그려 ` +
      `넣는다. 부엉이는 보드 옆에서 심각한 표정으로 한쪽 날개를 가볍게 드는 ` +
      `포즈 — 웃지 않음(보드는 바닥 거치라 손으로 들지 않는다). 배경: ` +
      `${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s9_recommendation",
    file: "owl_ep14_s9_recommendation.png",
    first: false,
    clause:
      `장면 9 (권고): '방심 금지, 이자부담 증가 가능'이라는 큰 글자와 느낌표 ` +
      `아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지하지만 차분한 표정으로 ` +
      `보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP14_BG}`,
  },
  {
    id: "owl_ep14_s10_action",
    file: "owl_ep14_s10_action.png",
    first: false,
    clause:
      `장면 10 (마무리 — 액션): '상환 계획 점검하기'라는 문구가 적힌 스마트폰 ` +
      `화면을 한쪽 날개로 확실히 감싸 쥔 채 들어 보이는 포즈, 밝고 친근한 ` +
      `미소로 마무리 — 은은한 미소 허용(마무리 톤이라 다른 씬보다 부드러워도 ` +
      `됨). 폰 화면이 흔들리지 않도록 고정된 자세로. 배경: ${OWL_EP14_BG}`,
  },
];

// 15편(재고, 실업급여 22년 만의 개편) 배경 — 고용노동부 정책 브리핑룸
// (11편 고용센터 상담 데스크와 톤 구분: 상담 데스크가 아니라 정책 발표
// 단상, 초록/네이비 톤으로 14편 금융감독 브리핑룸과도 색감 구분).
const OWL_EP15_BG =
  "밝은 고용노동부 정책 브리핑룸 — 발표 단상과 뒤쪽 대형 스크린에 " +
  "고용·근로 관련 아이콘 실루엣만 흐릿하게, 초록·네이비 톤 배너와 화분· " +
  "의자로 채워진 차분한 정책 발표 톤 (1~14편의 사무실·거실·증권사 상담 " +
  "라운지·홈트레이딩 데스크·증권사 트레이딩룸·은행 창구·국민연금공단 " +
  "상담 창구·고용센터 상담 데스크·부동산 중개사무소·퇴직연금 고객센터· " +
  "금융감독 브리핑룸과는 다른 배경, 특정 기관 로고·마크 없이 일반적인 " +
  "정책 브리핑룸 톤).";
const POSES_OWL_EP15_10SCENE = [
  {
    id: "owl_ep15_s1_opening",
    file: "owl_ep15_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경: ${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s2_hook",
    file: "owl_ep15_s2_hook.png",
    first: false,
    clause:
      `장면 2 (훅): '줄어든다? 늘어난다?'라는 큰 글자와 물음표 아이콘이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 고개를 갸웃하는 궁금한 표정으로 보여주는 ` +
      `포즈 — 웃지 않음. 카드에는 이 짧은 문구만 크게 그려 넣는다. 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s3_fact",
    file: "owl_ep15_s3_fact.png",
    first: false,
    clause:
      `장면 3 (사실 — 발표): '실업급여 22년 만의 개편'이라는 큰 글자가 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 담담하고 진지한 표정으로 설명하는 포즈 — ` +
      `웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s4_mechanism",
    file: "owl_ep15_s4_mechanism.png",
    first: false,
    clause:
      `장면 4 (계산방식 변경): 바닥에 세운 큰 보드를 좌우로 나눠, 왼쪽엔 '주 ` +
      `7일치' 글자와 달력 아이콘, 오른쪽엔 '주 6일치' 글자와 달력 아이콘을 ` +
      `그려 넣는다. 부엉이는 보드 옆에서 설명하듯 한쪽 날개를 가볍게 드는 ` +
      `포즈 — 웃지 않음(보드는 바닥 거치라 손으로 들지 않는다). 배경: ` +
      `${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s5_twist",
    file: "owl_ep15_s5_twist.png",
    first: false,
    clause:
      `장면 5 (반전 — 월 지급액 감소): '월 198만원 → 176만원'이라는 큰 글자와 ` +
      `파란 하락 화살표가 적힌 카드를 한쪽 날개로 감싸 쥐고 놀란 표정으로 ` +
      `보여주는 포즈 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s6_consequence",
    file: "owl_ep15_s6_consequence.png",
    first: false,
    clause:
      `장면 6 (파급 — 총액 유지): '지급 기간 5개월 → 5.8개월'이라는 큰 글자와 ` +
      `늘어난 달력 아이콘이 적힌 카드를 다른 쪽 날개로 감싸 쥐고 담담하게 ` +
      `설명하는 표정으로 보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s7_evidence",
    file: "owl_ep15_s7_evidence.png",
    first: false,
    clause:
      `장면 7 (근거 — 재취업 기준 강화): '재취업 월소득 300만원 이상 제외'라는 ` +
      `큰 글자와 붉은 금지 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지한 ` +
      `표정으로 보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s8_caveat",
    file: "owl_ep15_s8_caveat.png",
    first: false,
    clause:
      `장면 8 (주의 — 미확정): '국회 통과 전, 아직 정부안'이라는 큰 글자와 ` +
      `노란 경고 삼각형 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 심각한 ` +
      `표정으로 보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s9_recommendation",
    file: "owl_ep15_s9_recommendation.png",
    first: false,
    clause:
      `장면 9 (권고): '국회 통과 소식 확인하기'라는 큰 글자와 느낌표 아이콘이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 진지하지만 차분한 표정으로 보여주는 ` +
      `포즈 — 웃지 않음. 배경: ${OWL_EP15_BG}`,
  },
  {
    id: "owl_ep15_s10_action",
    file: "owl_ep15_s10_action.png",
    first: false,
    clause:
      `장면 10 (마무리 — 액션): 한쪽 날개로 팔로우 버튼을 가리키듯 확실히 ` +
      `가리키는 포즈, 밝고 친근한 미소로 마무리 — 은은한 미소 허용(마무리 ` +
      `톤이라 다른 씬보다 부드러워도 됨). 배경: ${OWL_EP15_BG}`,
  },
];

// 16편(2027년 최저임금 확정, 실업급여 하한액 연동) 배경 — 최저임금위원회
// 심의장/노동위원회 톤. 15편(정책 브리핑룸 발표 단상)·11편(고용센터 상담
// 데스크)과 겹치지 않는 새 배경 — 둥근 회의 테이블과 명패가 있는 심의장
// 톤으로 차별화.
const OWL_EP16_BG =
  "밝은 최저임금위원회 심의장 — 둥근 회의 테이블과 위원석 명패, 뒤쪽 " +
  "대형 스크린에 임금·고용 관련 아이콘 실루엣만 흐릿하게, 베이지·네이비 " +
  "톤 벽면과 화분·의자로 채워진 차분한 심의 회의장 톤 (1~15편의 사무실· " +
  "거실·증권사 상담 라운지·홈트레이딩 데스크·증권사 트레이딩룸·은행 " +
  "창구·국민연금공단 상담 창구·고용센터 상담 데스크·부동산 중개사무소· " +
  "퇴직연금 고객센터·금융감독 브리핑룸·고용노동부 정책 브리핑룸과는 " +
  "다른 배경, 특정 기관 로고·마크 없이 일반적인 심의 회의장 톤).";
const POSES_OWL_EP16_10SCENE = [
  {
    id: "owl_ep16_s1_opening",
    file: "owl_ep16_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경에 밝은 최저임금위원회 ` +
      `심의장을 배치해 오늘 주제를 예고 — 1~15편과 겹치지 않는 새 배경. 특정 ` +
      `기관 로고·마크 없이 일반적인 심의 회의장 톤. 배경 소품에는 작은 설명문 ` +
      `대신 큰 글자 라벨만 사용(예: 위원석 명패 정도), 빈 벽면이 크게 남지 ` +
      `않도록 화분·의자·스크린 등으로 채운다. 배경: ${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s2_hook",
    file: "owl_ep16_s2_hook.png",
    first: false,
    clause:
      `장면 2 (훅): '난 상관없다?'라는 큰 글자와 물음표 아이콘이 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고 고개를 갸웃하는 궁금한 표정으로 보여주는 포즈 — ` +
      `웃지 않음. 카드에는 이 짧은 문구만 크게 그려 넣는다. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s3_fact",
    file: "owl_ep16_s3_fact.png",
    first: false,
    clause:
      `장면 3 (사실 — 확정 인상): '최저임금 10,700원 확정'이라는 큰 글자와 ` +
      `상승 화살표 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 담담하고 진지한 ` +
      `표정으로 설명하는 포즈 — 웃지 않음. 배경은 앞 장면과 절대적으로 ` +
      `동일해야 한다 — ${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s4_fact",
    file: "owl_ep16_s4_fact.png",
    first: false,
    clause:
      `장면 4 (사실 — 월 환산액): '월 223만 6천원'이라는 큰 글자와 계산기 ` +
      `아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정으로 ` +
      `보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s5_twist",
    file: "owl_ep16_s5_twist.png",
    first: false,
    clause:
      `장면 5 (반전 예고): '나만의 얘기가 아니다?'라는 큰 글자와 물음표 ` +
      `아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 놀란 표정으로 보여주는 포즈 ` +
      `— 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s6_evidence",
    file: "owl_ep16_s6_evidence.png",
    first: false,
    clause:
      `장면 6 (근거 — 연동 구조): 바닥에 세운 큰 보드에 '최저임금'과 '실업급여 ` +
      `최저 금액' 두 글자 상자를 화살표로 잇는 도식을 그려 넣는다. 부엉이는 ` +
      `보드 옆에서 설명하듯 한쪽 날개를 가볍게 드는 포즈 — 웃지 않음(보드는 ` +
      `바닥 거치라 손으로 들지 않는다). 배경: ${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s7_evidence",
    file: "owl_ep16_s7_evidence.png",
    first: false,
    clause:
      `장면 7 (근거 — 결론): '실업급여 최저 금액도 UP'이라는 큰 글자와 상승 ` +
      `화살표 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 ` +
      `보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s8_consequence",
    file: "owl_ep16_s8_consequence.png",
    first: false,
    clause:
      `장면 8 (파급 — 체감 시점): '퇴사·실직하면 내 얘기'라는 큰 글자와 사람 ` +
      `실루엣 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지한 표정으로 ` +
      `보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s9_recommendation",
    file: "owl_ep16_s9_recommendation.png",
    first: false,
    clause:
      `장면 9 (해소 — 시리즈 연결): '15편 하한액의 비밀'이라는 큰 글자와 ` +
      `전구 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 밝고 기대감 있는 ` +
      `표정으로 보여주는 포즈 — 은은한 미소 허용(해소감 톤). 배경: ` +
      `${OWL_EP16_BG}`,
  },
  {
    id: "owl_ep16_s10_action",
    file: "owl_ep16_s10_action.png",
    first: false,
    clause:
      `장면 10 (마무리 — 액션): '알아두면 쓸모있는 정보'라는 큰 글자가 적힌 ` +
      `카드를 한쪽 날개로 확실히 감싸 쥔 채 들어 보이는 포즈, 밝고 친근한 ` +
      `미소로 마무리 — 은은한 미소 허용(마무리 톤이라 다른 씬보다 부드러워도 ` +
      `됨). 배경: ${OWL_EP16_BG}`,
  },
];
// teaser(밝은 화이트/골드 오피스)로 서로 다른 톤이었고, 1~9편 어디와도 안
// 겹치는 낯선 제3의 공간이었던 문제를 해결. 방송국/뉴스 스튜디오 톤 하나로
// 통일해 어떤 편(사무실/거실/증권사 라운지/홈트레이딩 데스크/증권사
// 트레이딩룸/은행 창구) 뒤에 붙여도 무난하게 어울리도록 설계.
const OWL_CTA_FIXED_V2_BG =
  "밝은 톤의 방송국/뉴스 스튜디오 — 은은한 조명, 낮은 채도의 블루/그레이 " +
  "패널과 흐릿한 세계지도 그래픽이 배경에 있고, 구체적 수치·종목명·기사 " +
  "제목은 전혀 없는 깔끔하고 중립적인 뉴스 데스크 공간(1~9편의 사무실· " +
  "거실·증권사 상담 라운지·홈트레이딩 데스크·증권사 트레이딩룸·은행 " +
  "창구와는 다른 배경, 특정 방송사명·로고 없음).";
const POSES_OWL_CTA_FIXED_V2 = [
  {
    id: "owl_cta_fixed_v2_s1_follow",
    file: "owl_cta_fixed_v2_s1_follow.png",
    first: true,
    clause:
      `장면 1 (팔로우 유도): 정면을 보며 한쪽 날개로 '팔로우' 아이콘(사람 실루엣 ` +
      `+ 플러스 기호)이 그려진 카드를 들어 보이는 자세, 밝고 신뢰감 있는 표정 ` +
      `— 은은한 미소 허용(팔로우 유도 톤). 다른 날개는 시청자를 향해 손짓하듯 ` +
      `펼친다. 배경: ${OWL_CTA_FIXED_V2_BG}`,
  },
  {
    id: "owl_cta_fixed_v2_s2_teaser",
    file: "owl_cta_fixed_v2_s2_teaser.png",
    first: false,
    clause:
      `장면 2 (다음 편 예고): 한쪽 날개를 턱에 살짝 대고 궁금증을 자아내는 ` +
      `듯한 표정, 다른 날개로는 물음표 아이콘이 그려진 작은 카드를 가리키는 ` +
      `자세 — 밝고 기대감 있는 표정, 은은한 미소 허용(예고 톤). 배경은 절대 ` +
      `새로 만들지 말고 바로 직전 장면(장면 1) 이미지의 배경을 픽셀 단위로 ` +
      `그대로 재사용한다는 느낌으로 그린다 — 카메라 위치·앵글까지 동일, ` +
      `책장·지구본·트로피·화분·의자·책상 등 어떤 가구·소품도 새로 추가하지 ` +
      `않는다. 오직 캐릭터 포즈와 손에 든 카드만 바뀐다. 배경 자체: ` +
      `${OWL_CTA_FIXED_V2_BG} (다른 어떤 가구도 없음, 패널과 세계지도 ` +
      `그래픽 외에는 완전히 빈 공간).`,
  },
];

// 6편(IRP 안전자산 30% 규정) 오프닝 소급 추가 — 8편에서 신설된 오프닝
// 템플릿("안녕, 난 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야! 오늘은
// [주제] 얘기해볼게.")을 6편에도 적용한다. 배경은 6편 기존 9씬(POSES_OWL_EP6_9SCENE)
// 과 동일한 증권사·은행 상담 라운지 문구를 그대로 재사용해 새 오프닝이 기존
// 본편과 이어 붙었을 때 배경이 어긋나지 않게 한다.
const POSES_OWL_EP6_OPENING = [
  {
    id: "owl_ep6_s0_opening",
    file: "owl_ep6_s0_opening.png",
    first: true,
    clause:
      "장면 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 " +
      "찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경에 'IRP 안전자산 규정' " +
      "글자가 크게 쓰인 카드나 패널을 배치해 오늘 주제를 예고. 특정 종목명·" +
      "매수 유도 요소 없음. 배경: 증권사·은행 상담 라운지 — 벽에 시세·차트가 " +
      "흐르는 대형 디지털 데이터 패널(구체적 숫자·종목명은 흐릿하게 처리되어 " +
      "읽을 수 없음), 세련된 상담 데스크와 편안한 라운지 의자가 보이는 밝은 공간.",
  },
];

// 7편(3배 레버리지 ETF) 오프닝 소급 추가 — 배경은 7편 기존 9씬(POSES_OWL_EP7_9SCENE)
// 과 동일한 홈트레이딩 데스크(OWL_EP7_BG)를 그대로 재사용한다.
const POSES_OWL_EP7_OPENING = [
  {
    id: "owl_ep7_s0_opening",
    file: "owl_ep7_s0_opening.png",
    first: true,
    clause:
      `장면 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경에 '3배 레버리지 ETF' ` +
      `글자가 크게 쓰인 카드나 모니터 화면을 배치해 오늘 주제를 예고. 특정 ` +
      `종목명·매수 유도 요소 없음. 배경: ${OWL_EP7_BG}`,
  },
];

// 금박사(coin3dv1) 1편(IRP 세액공제 기초) 9장면 — scripts/_geumbaksa-assembly-spec.mjs
// 의 imageBrief를 그대로 이미지 생성 clause로 옮긴 것. 부엉이(HC-10, 빈 소품+오버레이)와
// 달리 처음부터 오버레이 없이 진행하므로, 소품·화면 안에 실제 수치·문구를 직접
// 그려 넣는다(2026-09-19 Owner 확정). 투자 유도(특정 종목 매수 권유 등)만 금지.
const POSES_GEUMBAKSA_EP1_9SCENE = [
  {
    id: "geumbaksa_ep1_s1_opening",
    file: "geumbaksa_ep1_s1_opening.png",
    first: true,
    clause:
      "장면 1 (오프닝): 밝고 캐주얼한 스튜디오·서재풍 배경(부엉이의 상담 라운지와 " +
      "겹치지 않는 공간). 정면을 보며 인사하듯 한쪽 팔(손)을 살짝 드는 포즈. 배경에 " +
      "'IRP'라는 글자가 크게 쓰인 칠판 또는 화이트보드를 배치해 오늘 주제를 예고. " +
      "투자 유도 요소(종목명, 매수 문구)는 없음. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep1_s2_relatable_scenario",
    file: "geumbaksa_ep1_s2_relatable_scenario.png",
    first: false,
    clause:
      "장면 2 (체감 상황): 따뜻한 색감의 거실·책상 배경. 귀여운 돼지저금통 모양 " +
      "소품을 두 손으로 들고 동전을 넣는 듯한 포즈. 저금통 옆에 '세금 할인' 느낌의 " +
      "퍼센트 기호 아이콘을 배치해 궁금증을 유발하되, 구체적 수치는 아직 넣지 않음. " +
      "활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep1_s3_one_line_definition",
    file: "geumbaksa_ep1_s3_one_line_definition.png",
    first: false,
    clause:
      "장면 3 (한 줄 정리): 앞 장면과 동일한 배경. 'IRP' 글자와 '개인형퇴직연금'이라는 " +
      "풀네임이 함께 적힌 작은 통장·카드 소품을 자신 있게 들어 보이는 포즈. 통장 " +
      "디자인에 저금통 아이콘을 곁들여 2번 장면(저금통 비유)과 시각적으로 이어지게 " +
      "한다. 확신에 찬 표정으로, 활짝 웃는 친근한 표정은 유지.",
  },
  {
    id: "geumbaksa_ep1_s4_eligibility",
    file: "geumbaksa_ep1_s4_eligibility.png",
    first: false,
    clause:
      "장면 4 (가입 대상): 배경을 밝은 공공기관 창구풍으로 전환. 주위에 정장 " +
      "실루엣(직장인), 앞치마(자영업자), 노트북(프리랜서), 공무원 배지 같은 4개 " +
      "아이콘을 원형으로 배치하고 그 중앙에 '누구나 가입 가능'을 보여주는 체크 " +
      "표시. 아이콘 옆에 '직장인 · 자영업자 · 프리랜서 · 공무원' 텍스트를 작은 캡션 " +
      "카드로 함께 그려 넣는다. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep1_s5_how_to_start",
    file: "geumbaksa_ep1_s5_how_to_start.png",
    first: false,
    clause:
      "장면 5 (가입 방법): 스마트폰 화면을 들고 있는 포즈, 화면 안에는 '계좌 개설' " +
      "버튼과 예금·펀드·ETF 3개 상품 아이콘이 나열된 심플한 앱 UI가 그려져 있다. " +
      "상단에 '은행 · 증권사 앱에서 개설'이라는 짧은 캡션이 화면 UI의 일부처럼 " +
      "자연스럽게 들어간다. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep1_s6_exact_numbers_a",
    file: "geumbaksa_ep1_s6_exact_numbers_a.png",
    first: false,
    clause:
      "장면 6-A (핵심 수치 1/2 — 연 한도): 옆에 큼직한 정보 카드(칠판 또는 인포그래픽 " +
      "패널) 소품을 배치하고 그 안에 '연 900만원 한도' 한 줄만 명확한 숫자 표기로 " +
      "직접 그려 넣는다. 카드 하단에 작은 글씨로 '국세청' 출처 표기. 카드 아래쪽 " +
      "절반은 다음 장면에서 소득 구간별 공제율이 채워질 예정이라 비워둔다. " +
      "숫자는 절대 다른 값으로 바뀌지 않도록 정확히 그대로 렌더링한다. 진지하게 " +
      "설명하는 표정이되 활짝 웃는 친근함은 유지.",
  },
  {
    id: "geumbaksa_ep1_s6_exact_numbers_b",
    file: "geumbaksa_ep1_s6_exact_numbers_b.png",
    first: false,
    clause:
      "장면 6-B (핵심 수치 2/2 — 소득 구간별 공제율): 앞 장면과 완전히 동일한 배경과 " +
      "정보 카드를 유지하되, 카드 위쪽에는 이미 있던 '연 900만원 한도' 문구를 그대로 " +
      "두고, 비어 있던 아래쪽 절반에 '총급여 5,500만원 이하 15%', '초과 12%' 두 줄을 " +
      "추가로 그려 넣어 카드를 완성한다. 카드 하단 '국세청' 출처 표기 유지. 숫자는 " +
      "절대 다른 값으로 바뀌지 않도록 정확히 그대로 렌더링한다. 진지하게 설명하는 " +
      "표정이되 활짝 웃는 친근함은 유지.",
  },
  {
    id: "geumbaksa_ep1_s7_relatable_conversion",
    file: "geumbaksa_ep1_s7_relatable_conversion.png",
    first: false,
    clause:
      "장면 7 (체감 환산): 6번 장면과 이어지는 정보 카드에 '900만원 → 최대 135만원 " +
      "환급'이라는 계산 결과와 '매달 75만원씩'이라는 월 환산 문구를 화살표로 " +
      "연결해 그려 넣는다. 계산기나 저금통을 가리키며 뿌듯한 표정, 활짝 웃음.",
  },
  {
    id: "geumbaksa_ep1_s8_long_term_projection",
    file: "geumbaksa_ep1_s8_long_term_projection.png",
    first: false,
    clause:
      "장면 8 (장기 시뮬레이션): 배경을 은퇴 후 노후 이미지(따뜻한 톤의 미래 지향적 " +
      "장면)로 전환. 옆에 시간이 흐르며 쌓여가는 동전 더미 또는 성장 그래프 소품을 " +
      "배치하고, 그래프 위에 '20년 × 900만원 = 원금 1.8억' 텍스트를 직접 그려 " +
      "넣는다. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep1_s9_closing_takeaway",
    file: "geumbaksa_ep1_s9_closing_takeaway.png",
    first: false,
    clause:
      "장면 9 (마무리): 1번 장면과 톤이 이어지는 밝은 마무리 구도. IRP 통장 소품을 " +
      "품에 안듯 들고 따뜻하게 웃는 포즈. 별도 텍스트 없이 여운 있는 정리 이미지로 " +
      "마무리한다. 활짝 웃는 친근한 표정 유지.",
  },
];

// 금박사(coin3dv1) 2편(ETF 기초) 11장면 — scripts/_geumbaksa-ep2-assembly-spec.mjs
// 의 imageBrief를 그대로 이미지 생성 clause로 옮긴 것. 1편과 동일하게 오버레이
// 없이 소품·화면에 실제 수치·문구를 직접 그려 넣는다. 부엉이 7편(3배 레버리지
// ETF)의 선행 설명 역할 — "ETF 자체가 뭔지"부터 쉽게 풀어준다.
const POSES_GEUMBAKSA_EP2_11SCENE = [
  {
    id: "geumbaksa_ep2_s1_opening",
    file: "geumbaksa_ep2_s1_opening.png",
    first: true,
    clause:
      "장면 1 (오프닝): 밝고 캐주얼한 스튜디오·서재풍 배경(1편과 유사한 톤이되 소품 " +
      "배치는 다르게). 정면을 보며 인사하듯 한쪽 팔(손)을 살짝 드는 포즈. 배경에 " +
      "'ETF'라는 글자가 크게 쓰인 칠판 또는 화이트보드를 배치해 오늘 주제를 예고. " +
      "투자 유도 요소(종목명, 매수 문구)는 없음. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep2_s2_relatable_scenario",
    file: "geumbaksa_ep2_s2_relatable_scenario.png",
    first: false,
    clause:
      "장면 2 (체감 상황): 밝은 마트·장보기 느낌의 배경. 여러 상품이 담긴 장바구니 " +
      "소품을 두 손으로 들어 보이는 포즈. 장바구니 안에 서로 다른 색의 작은 " +
      "아이콘(과일, 채소 등 일반 상품) 여러 개가 함께 담긴 모습을 그려 넣어 " +
      "'여러 개를 한 번에'라는 느낌을 시각화. 구체적 종목명이나 수치는 아직 넣지 " +
      "않음. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep2_s3_one_line_definition",
    file: "geumbaksa_ep2_s3_one_line_definition.png",
    first: false,
    clause:
      "장면 3 (한 줄 정리): 앞 장면과 동일한 배경. 'ETF'라는 글자와 '상장지수펀드'" +
      "라는 풀네임이 함께 적힌 카드 소품을 자신 있게 들어 보이는 포즈. 카드 " +
      "디자인에 2번 장면의 장바구니 아이콘을 작게 곁들여 시각적으로 이어지게 " +
      "한다. 확신에 찬 표정으로, 활짝 웃는 친근한 표정은 유지.",
  },
  {
    id: "geumbaksa_ep2_s4_eligibility",
    file: "geumbaksa_ep2_s4_eligibility.png",
    first: false,
    clause:
      "장면 4 (가입 대상): 배경을 밝은 증권사 창구·모바일 앱 느낌으로 전환. 주위에 " +
      "다양한 연령대·직업을 암시하는 단순한 실루엣 아이콘 몇 개를 원형으로 " +
      "배치하고 중앙에 '누구나 가능'을 보여주는 체크 표시. 특정 종목이나 매수 " +
      "문구는 절대 넣지 않는다. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep2_s5_how_to_start",
    file: "geumbaksa_ep2_s5_how_to_start.png",
    first: false,
    clause:
      "장면 5 (이용 방법): 스마트폰 화면을 들고 있는 포즈, 화면 안에는 검색창과 " +
      "실시간 시세를 보여주는 심플한 차트 아이콘이 그려져 있다. 상단에 '증권사 " +
      "앱에서 실시간 매매'라는 짧은 캡션이 화면 UI의 일부처럼 자연스럽게 " +
      "들어간다. 실제 종목명·가격은 넣지 않음. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep2_s6_exact_numbers_a",
    file: "geumbaksa_ep2_s6_exact_numbers_a.png",
    first: false,
    clause:
      "장면 6 (핵심 예시): 옆에 큼직한 정보 카드(인포그래픽 패널) 소품을 배치하고 " +
      "그 안에 '패시브 ETF 1개 = 국내 대표기업 200곳'이라는 문구와, 크고 작은 원 " +
      "여러 개가 크기순으로 배열된 인포그래픽(시가총액이 클수록 크게 담기는 " +
      "구조)을 함께 그려 넣는다. 특정 기업의 실제 로고나 상표는 넣지 않고 " +
      "일반화된 건물·주식 아이콘으로 표현한다. 진지하게 설명하는 표정이되 활짝 " +
      "웃는 친근함은 유지.",
  },
  {
    id: "geumbaksa_ep2_s6b_diversification_benefit",
    file: "geumbaksa_ep2_s6b_diversification_benefit.png",
    first: false,
    clause:
      "장면 7 (이득① 위험 분산): 앞 장면과 이어지는 정보 카드에 여러 개의 작은 " +
      "기둥(회사들) 중 한두 개가 살짝 기울어져도 전체 구조는 안정적으로 서 있는 " +
      "모습을 그려 넣어 '위험 분산'을 시각화한다. '위험을 나눈다'는 짧은 문구를 " +
      "카드에 함께 그려 넣는다. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep2_s6_exact_numbers_b",
    file: "geumbaksa_ep2_s6_exact_numbers_b.png",
    first: false,
    clause:
      "장면 8 (운용방식 구분): 배경은 유지하되 정보 카드를 새로 배치. 카드를 " +
      "좌우로 나눠 왼쪽엔 '패시브 — 지수 그대로 복사'라는 문구와 격자 무늬 " +
      "아이콘(자동화 느낌), 오른쪽엔 '전문가가 직접 종목 선별'이라는 문구와 " +
      "돋보기·서류를 든 사람 실루엣 아이콘을 배치해 두 방식을 대비해 보여준다. " +
      "두 카드 사이를 손으로 가리키는 자세. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep2_s7_relatable_conversion",
    file: "geumbaksa_ep2_s7_relatable_conversion.png",
    first: false,
    clause:
      "장면 9 (테마 다양성): 옆에 여러 개의 작은 바구니 아이콘이 나란히 놓인 정보 " +
      "카드를 배치하고, 각 바구니 위에 반도체 칩 아이콘, 로봇 팔 아이콘 같은 " +
      "일반화된 심볼을 그려 넣어 '분야별로 다른 바구니가 있다'는 걸 시각화한다. " +
      "실제 상품명이나 특정 기업명은 넣지 않는다. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep2_s8_long_term_projection",
    file: "geumbaksa_ep2_s8_long_term_projection.png",
    first: false,
    clause:
      "장면 10 (복리+배당): 배경을 시간의 흐름을 암시하는 톤(성장 그래프가 있는 " +
      "서재풍)으로 전환. 처음엔 완만하다가 뒤로 갈수록 가팔라지는 우상향 곡선 " +
      "소품과, 매달 동전이 하나씩 떨어지는 저금통 아이콘을 함께 배치. '월배당 " +
      "ETF 분배율 연 2~20%대(상품별 상이)'와 '국내 순자산 26조원'이라는 두 " +
      "문구를 카드에 그려 넣는다. 카드 하단에 작은 글씨로 '2026년 기준' 출처 " +
      "표기를 넣는다. 구체적 복리 수익률·금액 수치는 넣지 않는다. 활짝 웃는 " +
      "친근한 표정.",
  },
  {
    id: "geumbaksa_ep2_s9_closing_takeaway",
    file: "geumbaksa_ep2_s9_closing_takeaway.png",
    first: false,
    clause:
      "장면 11 (마무리): 1번 장면과 톤이 이어지는 밝은 마무리 구도. ETF 카드 " +
      "소품을 품에 안듯 들고 따뜻하게 웃는 포즈. 별도 텍스트 없이 여운 있는 " +
      "정리 이미지로 마무리한다. 활짝 웃는 친근한 표정 유지.",
  },
];

// 금박사(coin3dv1) 3편(레버리지 원리·리스크) 10장면 — scripts/_geumbaksa-ep3-assembly-spec.mjs
// 의 imageBrief를 그대로 이미지 생성 clause로 옮긴 것. 2편까지는 원본 role
// 이름(s6, s6b, s6_b 등)을 파일명에 그대로 써서 실제 씬 순서와 헷갈렸다는
// 지적(2026-09-20) — 3편부터 파일명은 scene 순번만 쓴다(geumbaksa_ep3_s1 ~
// geumbaksa_ep3_s10, A/B 접미사 없음).
const POSES_GEUMBAKSA_EP3_10SCENE = [
  {
    id: "geumbaksa_ep3_s1",
    file: "geumbaksa_ep3_s1.png",
    first: true,
    clause:
      "장면 1 (오프닝): 밝고 캐주얼한 스튜디오·서재풍 배경(1~2편과 유사한 톤이되 소품 " +
      "배치는 다르게). 정면을 보며 인사하듯 한쪽 팔(손)을 살짝 드는 포즈. 배경에 " +
      "'레버리지'라는 글자가 크게 쓰인 칠판 또는 화이트보드를 배치해 오늘 주제를 예고. " +
      "투자 유도 요소(종목명, 매수 문구)는 없음. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep3_s2",
    file: "geumbaksa_ep3_s2.png",
    first: false,
    clause:
      "장면 2 (체감 상황): 밝은 거실·책상 배경. 두 개의 돈다발 소품(하나는 작은 '내 돈 " +
      "100만원' 라벨, 다른 하나는 더 큰 '빌린 돈 900만원' 라벨)을 양손에 들고 합치는 " +
      "듯한 포즈. 두 돈다발이 합쳐진 곳에 '천만원 투자'라는 문구를 작게 그려 넣는다. " +
      "구체적 수익률 결과는 아직 넣지 않음. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep3_s3",
    file: "geumbaksa_ep3_s3.png",
    first: false,
    clause:
      "장면 3 (한 줄 정리): 앞 장면과 동일한 배경. '레버리지'라는 글자와 지렛대(지레) " +
      "아이콘이 함께 그려진 카드 소품을 자신 있게 들어 보이는 포즈. 지레가 작은 힘으로 " +
      "큰 물체를 들어 올리는 그림을 곁들여 '작은 돈으로 큰 규모를 움직인다'는 개념을 " +
      "시각화. 확신에 찬 표정으로, 활짝 웃는 친근한 표정은 유지.",
  },
  {
    id: "geumbaksa_ep3_s4",
    file: "geumbaksa_ep3_s4.png",
    first: false,
    clause:
      "장면 4 (가입대상+이용방법): 배경을 밝은 증권사 창구·모바일 앱 느낌으로 전환. " +
      "스마트폰 화면을 들고 있는 포즈, 화면 안에는 검색창에 '레버리지'라는 글자가 " +
      "입력된 심플한 앱 UI가 그려져 있다. 실제 종목명·가격은 넣지 않음. 활짝 웃는 " +
      "친근한 표정.",
  },
  {
    id: "geumbaksa_ep3_s5",
    file: "geumbaksa_ep3_s5.png",
    first: false,
    clause:
      "장면 5 (경각심 훅): 옆에 큼직한 정보 카드(인포그래픽 패널) 소품을 배치하고 그 " +
      "안에 '개인투자자 레버리지 ETF 순매수 8조원'이라는 문구와 위로 향하는 " +
      "화살표·동전 더미 아이콘을 그려 넣는다. 카드 하단에 작은 글씨로 '2026년 기준' " +
      "출처 표기. 살짝 걱정스러운 표정으로 고개를 갸웃하는 자세.",
  },
  {
    id: "geumbaksa_ep3_s6",
    file: "geumbaksa_ep3_s6.png",
    first: false,
    clause:
      "장면 6 (작동원리): 앞 장면(장면 5)과 동일한 밝은 증권사·투자 라운지 배경을 " +
      "그대로 유지한다(배경에 '더 많은 사람이 더 나은 내일을 만드는 투자', '지식이 " +
      "투자의 힘이 되는 세상' 같은 포스터 문구가 흐릿하게 보이는 공간). 정보 카드를 " +
      "새로 배치. 카드 안에 '하루 등락률에만 적용'이라는 문구와, '지수 +3%' → '2배 " +
      "ETF +6%' → '3배 ETF +9%'로 이어지는 화살표 도식을 명확히 그려 넣는다. 숫자는 " +
      "절대 다른 값으로 바뀌지 않도록 정확히 그대로 렌더링한다. 진지하게 설명하는 " +
      "표정이되 활짝 웃는 친근함은 유지. 단색 배경이나 스튜디오 화이트 배경으로 " +
      "바뀌지 않도록 한다.",
  },
  {
    id: "geumbaksa_ep3_s7",
    file: "geumbaksa_ep3_s7.png",
    first: false,
    clause:
      "장면 7 (리스크 사례): 앞 장면과 이어지는 정보 카드에 지수가 오르내리는 톱니 " +
      "모양 그래프와, 그 아래 훨씬 가파르게 떨어지는 3배 ETF 그래프를 나란히 그려 " +
      "넣는다. '지수 -2%' vs '3배 ETF -17%' 두 수치를 명확히 대비해 표기. 심각하고 " +
      "걱정스러운 표정.",
  },
  {
    id: "geumbaksa_ep3_s8",
    file: "geumbaksa_ep3_s8.png",
    first: false,
    clause:
      "장면 8 (변동성 끌림): 정보 카드에 지수 그래프가 원래 자리로 돌아오는 화살표와, " +
      "그 아래 레버리지 ETF 그래프는 돌아오지 못하고 낮은 자리에 머무는 모습을 대비해 " +
      "그려 넣는다. '변동성 끌림'이라는 용어를 카드에 명확히 표기. 진지한 표정.",
  },
  {
    id: "geumbaksa_ep3_s9",
    file: "geumbaksa_ep3_s9.png",
    first: false,
    clause:
      "장면 9 (비용 근거): 정보 카드에 톱니바퀴가 매일 돌아가는 아이콘과 함께 '매일 " +
      "배율 재조정 비용'이라는 문구, 그 아래 '3배: 연 12%', '2배: 연 6~7%' 두 수치를 " +
      "명확히 표기. 카드 하단에 작은 글씨로 출처 표기. 심각한 표정.",
  },
  {
    id: "geumbaksa_ep3_s10",
    file: "geumbaksa_ep3_s10.png",
    first: false,
    clause:
      "장면 10 (마무리): 1번 장면과 톤이 이어지는 밝은 마무리 구도이되 신중한 분위기. " +
      "저울 소품을 양손에 들고(한쪽엔 상승 화살표, 다른 쪽엔 하락 화살표) 균형을 " +
      "살피는 포즈. 별도 텍스트 없이 여운 있는 정리 이미지로 마무리한다. 진지하되 " +
      "따뜻한 표정.",
  },
];

// 금박사(coin3dv1) 4편(파일명 순번, 실제 배포는 1편 — 환율의 원리와 파급 효과)
// 11장면 — scripts/_geumbaksa-ep4-assembly-spec.mjs 의 imageBrief를 그대로
// 이미지 생성 clause로 옮긴 것. 3편과 동일하게 파일명은 scene 순번만 쓴다
// (geumbaksa_ep4_s1 ~ geumbaksa_ep4_s11, A/B 접미사 없음).
const POSES_GEUMBAKSA_EP4_11SCENE = [
  {
    id: "geumbaksa_ep4_s1",
    file: "geumbaksa_ep4_s1.png",
    first: true,
    clause:
      "장면 1 (오프닝): 밝고 캐주얼한 스튜디오·서재풍 배경(이전 편들과 유사한 톤이되 " +
      "소품 배치는 다르게). 정면을 보며 인사하듯 한쪽 팔(손)을 살짝 드는 포즈. 배경에 " +
      "'환율'이라는 글자와 원화(₩)·달러($) 기호가 함께 크게 쓰인 칠판 또는 화이트보드를 " +
      "배치해 오늘 주제를 예고. 투자 유도 요소는 없음. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep4_s2",
    file: "geumbaksa_ep4_s2.png",
    first: false,
    clause:
      "장면 2 (체감 상황): 스마트폰으로 해외직구 쇼핑몰 화면을 보여주는 포즈. 화면 안에 " +
      "신발 이미지와 '$100' 표시, 그 옆에 환율 1,300원/1,400원 두 계산 결과를 나란히 " +
      "비교하는 작은 인포그래픽이 그려져 있다. 궁금해하는 표정, 활짝 웃는 친근함 유지.",
  },
  {
    id: "geumbaksa_ep4_s3",
    file: "geumbaksa_ep4_s3.png",
    first: false,
    clause:
      "장면 3 (한 줄 정리): 동일 배경 연속. 원화(₩)와 달러($) 기호가 저울처럼 균형을 " +
      "이루다가 달러 쪽으로 살짝 기우는 모습을 표현한 소품을 자신 있게 가리키는 포즈. " +
      "'환율' 글자를 큼직하게 함께 배치. 확신에 찬 표정.",
  },
  {
    id: "geumbaksa_ep4_s4",
    file: "geumbaksa_ep4_s4.png",
    first: false,
    clause:
      "장면 4 (영향 범위): 배경을 주유소·마트 진열대가 함께 보이는 생활 공간으로 전환. " +
      "주유기 아이콘과 빵·밀가루 아이콘을 원형으로 배치해 '누구나 영향권'이라는 느낌을 " +
      "직관적으로 전달. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep4_s5",
    file: "geumbaksa_ep4_s5.png",
    first: false,
    clause:
      "장면 5 (전가 경로): 컨테이너선 또는 수입 원자재 창고를 배경으로, 석유 드럼통과 " +
      "밀 포대 아이콘이 실린 소품을 가리키는 포즈. '수입 원자재' 캡션과 화살표로 원가 " +
      "상승 방향을 표시. 설명하는 진지한 표정.",
  },
  {
    id: "geumbaksa_ep4_s6",
    file: "geumbaksa_ep4_s6.png",
    first: false,
    clause:
      "장면 6 (가계 부담): 밝은 마트·카페 진열대 배경. 빵, 커피잔, 주유기 아이콘 3개를 " +
      "나열하고 각 아이콘 위에 작은 상승 화살표를 그려 넣어 '동시에 오른다'는 느낌을 " +
      "표현. 가격표에는 구체적 숫자 대신 상승 화살표만 사용(투자 유도 아님). 살짝 " +
      "걱정스러운 표정.",
  },
  {
    id: "geumbaksa_ep4_s7",
    file: "geumbaksa_ep4_s7.png",
    first: false,
    clause:
      "장면 7 (기업 부담): 공장·생산 라인풍 배경. 원자재 상자에서 완제품 상자로 이어지는 " +
      "컨베이어벨트 소품을 배치하고, 컨베이어벨트 위 가격표 아이콘에 작은 상승 화살표를 " +
      "그려 넣어 원가 부담이 판매가로 이어지는 흐름을 시각화. 진지하고 설명하는 표정.",
  },
  {
    id: "geumbaksa_ep4_s8",
    file: "geumbaksa_ep4_s8.png",
    first: false,
    clause:
      "장면 8 (핵심 수치): 옆에 큼직한 정보 카드(인포그래픽 패널) 소품을 배치하고 그 " +
      "안에 '소비자물가 +0.4%p'를 명확한 숫자 표기로 직접 그려 넣는다. 카드 하단에 " +
      "작은 글씨로 '한국은행' 출처 표기. 확신에 찬 진지한 표정.",
  },
  {
    id: "geumbaksa_ep4_s9",
    file: "geumbaksa_ep4_s9.png",
    first: false,
    clause:
      "장면 9 (체감 환산): 앞 장면과 이어지는 정보 카드에 원그래프 소품을 추가해 전체 " +
      "물가 상승분 중 환율 요인이 차지하는 5분의 1 조각을 시각적으로 강조(색을 다르게). " +
      "그 조각을 가리키는 진지한 포즈.",
  },
  {
    id: "geumbaksa_ep4_s10",
    file: "geumbaksa_ep4_s10.png",
    first: false,
    clause:
      "장면 10 (다음 파급): 배경을 한국은행풍 실내(중앙은행 이미지)로 전환. 저울 또는 " +
      "금리 게이지 소품을 배치하고 바늘이 위쪽(인상 방향)을 가리키는 모습을 그려 넣는다. " +
      "'기준금리 인상' 캡션. 진지하고 확신에 찬 표정.",
  },
  {
    id: "geumbaksa_ep4_s11",
    file: "geumbaksa_ep4_s11.png",
    first: false,
    clause:
      "장면 11 (마무리): 1번 장면과 톤이 이어지는 밝은 마무리 구도. 원화·달러 기호가 " +
      "함께 그려진 소품을 품에 안듯 들고 따뜻하게 웃는 포즈. 별도 텍스트 없이 여운 있는 " +
      "정리 이미지로 마무리한다. 활짝 웃는 친근한 표정 유지.",
  },
];

// 금박사(coin3dv1) 5편(신용점수 — 정의/평가항목/실제영향/오해바로잡기/회복구조)
// 10장면 — scripts/geumbaksa-ep5-tts-script.json의 10씬 나레이션을 그대로
// 반영한 이미지 생성 clause. 3~4편과 동일하게 파일명은 scene 순번만 쓴다
// (geumbaksa_ep5_s1 ~ geumbaksa_ep5_s10, A/B 접미사 없음). 신용점수는 투자
// 상품이 아니라 개인 신용 정보이므로, 배경은 은행·금융 상담 데스크가 아니라
// 밝은 서재·홈오피스풍(개인 재무 정리 느낌)으로 1~4편과 겹치지 않게 설계.
// 금박사 파일 ep5 s4 재생성용 — 기존 클립 첫 프레임 구도(좌측 금박사, 우측 체크리스트 클립보드,
// 뒤쪽 '신용점수' 게이지 화이트보드·책장·스탠드)를 그대로 재현한다. 원본 영상에서 동전 몸통에
// 'PIXAR' 같은 글자가 생긴 사고가 있어 몸통 표면을 매끈하게 비워 두라고 명시한다.
const POSES_GEUMBAKSA_EP5_S4_FIX = [
  {
    id: "geumbaksa_ep5_s4_fix",
    file: "geumbaksa_ep5_s4_fix.png",
    first: true,
    clause:
      "장면 4 (평가 항목, 재생성용): 밝고 캐주얼한 홈오피스·서재풍 배경 — 왼쪽 뒤 나무 책장과 " +
      "작은 액자, 가운데 뒤쪽 화이트보드에 큰 글자 '신용점수'와 빨강→노랑→초록 반원 게이지(왼쪽 " +
      "끝 '1', 오른쪽 끝 '1000'), 오른쪽 뒤 스탠드 조명과 화분, 앞쪽 원목 책상. 금박사는 화면 " +
      "왼쪽~가운데에 서서 오른손(화면 오른쪽 손)으로 세로로 긴 클립보드의 윗부분을 단단히 감싸 쥐고 " +
      "클립보드 아래쪽은 책상 위에 받쳐 세운다. 클립보드에는 아이콘+체크 표시+큰 글자 4줄 " +
      "'상환 이력' / '부채 수준' / '거래 기간' / '거래 형태'를 체크리스트로 크고 선명하게. 다른 손" +
      "(화면 왼쪽 손)은 클립보드 옆에서 첫 항목을 가리키는 포즈, 활짝 웃는 설명하는 표정. " +
      "★ 금박사 동전 몸통 표면은 매끈한 금색으로 비워 둔다 — 글자·로고·각인·무늬를 절대 넣지 " +
      "않는다. 클립보드는 하나만, 다른 손에 추가 소품 없음.",
  },
];

const POSES_GEUMBAKSA_EP5_10SCENE = [
  {
    id: "geumbaksa_ep5_s1",
    file: "geumbaksa_ep5_s1.png",
    first: true,
    clause:
      "장면 1 (오프닝): 밝고 캐주얼한 홈오피스·서재풍 배경(책장·화이트보드가 있는 " +
      "아늑한 공간, 1~4편과는 다른 소품 배치). 정면을 보며 인사하듯 한쪽 팔(손)을 " +
      "살짝 드는 포즈. 배경 화이트보드에 '신용점수'라는 글자와 점수 게이지 아이콘을 " +
      "크게 그려 넣어 오늘 주제를 예고. 투자 유도 요소는 없음. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep5_s2",
    file: "geumbaksa_ep5_s2.png",
    first: false,
    clause:
      "장면 2 (체감 상황): 동일 배경 연속. 두 개의 대출 서류 카드를 양손에 들고 " +
      "비교하는 포즈 — 한 카드엔 낮은 금리 숫자, 다른 카드엔 높은 금리 숫자가 " +
      "표시되어 있고 그 차이를 의아해하는 표정. 궁금해하는 표정, 친근함 유지.",
  },
  {
    id: "geumbaksa_ep5_s3",
    file: "geumbaksa_ep5_s3.png",
    first: false,
    clause:
      "장면 3 (한 줄 정리): 동일 배경 연속. 1점부터 1000점까지 눈금이 그려진 " +
      "커다란 게이지 소품을 자신 있게 가리키는 포즈. 게이지 위에 '신용점수'라는 " +
      "글자를 큼직하게 함께 배치. 확신에 찬 표정.",
  },
  {
    id: "geumbaksa_ep5_s4",
    file: "geumbaksa_ep5_s4.png",
    first: false,
    clause:
      "장면 4 (평가 항목): 정보 카드 소품에 네 개의 항목 — '상환 이력', '부채 수준', " +
      "'거래 기간', '거래 형태' — 을 체크리스트 형태로 명확히 그려 넣고, 하나씩 " +
      "짚어가듯 손으로 가리키는 포즈. 차분하고 설명하는 표정.",
  },
  {
    id: "geumbaksa_ep5_s5",
    file: "geumbaksa_ep5_s5.png",
    first: false,
    clause:
      "장면 5 (제도 배경): 배경은 절대 새로 만들지 말고 앞 장면들과 완전히 " +
      "동일한 밝은 홈오피스·서재풍 배경을 그대로 유지한다 — 나무 책장(책, " +
      "지구본, 화분 포함), 벽에 걸린 화이트보드나 액자, 원목 책상과 편안한 " +
      "의자가 보이는 아늑한 공간. 단색 배경이나 스튜디오풍 배경으로 절대 " +
      "바꾸지 않는다. '등급제'라고 쓰인 카드가 흐릿하게 지워지고 그 옆에 " +
      "'점수제'라고 쓰인 카드가 선명하게 나타나는 전환을 손으로 가리키는 " +
      "포즈. 카드 하단에 작은 글씨로 '2021년' 표기. 설명하는 진지한 표정.",
  },
  {
    id: "geumbaksa_ep5_s6",
    file: "geumbaksa_ep5_s6.png",
    first: false,
    clause:
      "장면 6 (핵심 수치): 배경은 절대 새로 만들지 말고 앞 장면들과 완전히 " +
      "동일한 밝은 홈오피스·서재풍 배경을 그대로 유지한다 — 나무 책장(책, " +
      "지구본, 화분 포함), 벽에 걸린 화이트보드나 액자, 원목 책상과 편안한 " +
      "의자가 보이는 아늑한 공간. 단색 배경이나 스튜디오풍 배경으로 절대 " +
      "바꾸지 않는다. 옆에 큼직한 정보 카드(인포그래픽 패널) 소품을 배치하고 " +
      "그 안에 달력 아이콘과 함께 '단기 연체 최대 3년', '장기 연체 최장 5년'이라는 " +
      "문구를 명확한 숫자 표기로 직접 그려 넣는다. 진지하고 다소 심각한 표정.",
  },
  {
    id: "geumbaksa_ep5_s7",
    file: "geumbaksa_ep5_s7.png",
    first: false,
    clause:
      "장면 7 (실제 영향): 배경은 절대 새로 만들지 말고 앞 장면들과 완전히 " +
      "동일한 밝은 홈오피스·서재풍 배경을 그대로 유지한다 — 나무 책장(책, " +
      "지구본, 화분 포함), 벽에 걸린 화이트보드나 액자, 원목 책상과 편안한 " +
      "의자가 보이는 아늑한 공간. 단색 배경이나 스튜디오풍 배경으로 절대 " +
      "바꾸지 않는다. 앞 장면과 이어지는 정보 카드에 '대출 한도', '대출 금리', " +
      "'카드 발급 심사' 세 갈래로 뻗어나가는 화살표 도식을 추가로 그려 넣어 " +
      "신용점수 하나가 여러 결과로 이어짐을 시각화. 확신에 찬 진지한 표정.",
  },
  {
    id: "geumbaksa_ep5_s8",
    file: "geumbaksa_ep5_s8.png",
    first: false,
    clause:
      "장면 8 (오해 바로잡기): 배경은 절대 새로 만들지 말고 앞 장면들과 완전히 " +
      "동일한 밝은 홈오피스·서재풍 배경을 그대로 유지한다 — 나무 책장(책, " +
      "지구본, 화분 포함), 벽에 걸린 화이트보드나 액자, 원목 책상과 편안한 " +
      "의자가 보이는 아늑한 공간. 단색 배경이나 스튜디오풍 배경으로 절대 " +
      "바꾸지 않는다. '조회하면 점수 깎임?' 이라고 쓰인 카드에 크게 X 표시를 " +
      "그려 넣고 그 옆에 '2011년부터 아님'이라는 문구를 함께 배치. 살짝 " +
      "장난스럽게 고개를 젓는 듯한, 흥미를 자아내는 표정.",
  },
  {
    id: "geumbaksa_ep5_s9",
    file: "geumbaksa_ep5_s9.png",
    first: false,
    clause:
      "장면 9 (액션 팁): 배경은 절대 새로 만들지 말고 앞 장면들과 완전히 " +
      "동일한 밝은 홈오피스·서재풍 배경을 그대로 유지한다 — 나무 책장(책, " +
      "지구본, 화분 포함), 벽에 걸린 화이트보드나 액자, 원목 책상과 편안한 " +
      "의자가 보이는 아늑한 공간. 단색 배경이나 스튜디오풍 배경으로 절대 " +
      "바꾸지 않는다. 톤은 밝고 희망적으로. 통신비·공공요금 고지서 아이콘을 " +
      "손에 들고 그 옆에 '성실납부 기록 제출'이라는 문구와 상승하는 작은 화살표를 " +
      "그려 넣는다. 따뜻하고 격려하는 표정.",
  },
  {
    id: "geumbaksa_ep5_s10",
    file: "geumbaksa_ep5_s10.png",
    first: false,
    clause:
      "장면 10 (마무리): 배경은 절대 새로 만들지 말고 앞 장면들과 완전히 " +
      "동일한 밝은 홈오피스·서재풍 배경을 그대로 유지한다 — 나무 책장(책, " +
      "지구본, 화분 포함), 벽에 걸린 화이트보드나 액자, 원목 책상과 편안한 " +
      "의자가 보이는 아늑한 공간. 단색 배경이나 스튜디오풍 배경으로 절대 " +
      "바꾸지 않는다. 신용점수 게이지 소품을 품에 안듯 들고 따뜻하게 웃는 " +
      "포즈. 별도 텍스트 없이 여운 있는 정리 이미지로 마무리한다. 활짝 웃는 " +
      "친근한 표정 유지.",
  },
];

// 금박사 6편(국민연금 소득대체율 43%, 진짜 내 몫은 얼마일까) 10장면 —
// scripts/_geumbaksa-ep6-assembly-spec.mjs의 imageBrief를 그대로 옮긴 것.
// 배경은 "미래를 계획하는 서재/거실" — 달력과 시간의 흐름을 보여주는 타임라인
// 그래프 소품을 강조해 "가입기간이 쌓인다"는 주제를 시각적으로 뒷받침한다.
// 1~5편의 기본 홈오피스·서재풍 톤은 유지하되 소품 배치(달력·타임라인)를 다르게
// 해 겹치지 않는 공간으로 설계.
const GEUMBAKSA_EP6_BG =
  "밝고 캐주얼한 서재·거실풍 배경 — 나무 책장, 원목 책상, 편안한 의자가 " +
  "보이는 아늑한 공간이되, 벽에 걸린 큼직한 달력과 시간의 흐름을 보여주는 " +
  "타임라인 그래프 소품이 눈에 띄게 배치되어 있다(1~5편과는 다른 소품 배치). " +
  "단색 배경이나 스튜디오풍 배경으로 바꾸지 않는다.";
const POSES_GEUMBAKSA_EP6_10SCENE = [
  {
    id: "geumbaksa_ep6_s1",
    file: "geumbaksa_ep6_s1.png",
    first: true,
    clause:
      `장면 1 (오프닝): ${GEUMBAKSA_EP6_BG} 정면을 보며 인사하듯 한쪽 팔(손)을 ` +
      "살짝 드는 포즈. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep6_s2",
    file: "geumbaksa_ep6_s2.png",
    first: false,
    clause:
      `장면 2 (훅): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP6_BG} '소득대체율 43%'라고 쓰인 카드를 손에 들고 ` +
      "놀란 듯 고개를 갸웃하는 포즈, 카드 옆에 작은 물음표 아이콘. 궁금해하는 표정.",
  },
  {
    id: "geumbaksa_ep6_s3",
    file: "geumbaksa_ep6_s3.png",
    first: false,
    clause:
      `장면 3 (한 줄 정리): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP6_BG} 저울 형태의 소품 양쪽에 '내가 벌던 돈'과 ` +
      "'연금으로 받는 돈'을 표시하고 균형을 가리키는 포즈. 확신에 찬 표정.",
  },
  {
    id: "geumbaksa_ep6_s4",
    file: "geumbaksa_ep6_s4.png",
    first: false,
    clause:
      `장면 4 (계산식): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP6_BG} 정보 카드 소품에 '가입기간 × 1.075% = ` +
      "소득대체율'이라는 계산식을 명확하게 그려 넣고, 계단처럼 한 칸씩 쌓여 " +
      "올라가는 작은 막대 도식을 함께 배치. 차분하고 설명하는 표정.",
  },
  {
    id: "geumbaksa_ep6_s5",
    file: "geumbaksa_ep6_s5.png",
    first: false,
    clause:
      `장면 5 (조건): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP6_BG} 타임라인 그래프 소품에 '20세 → 60세, ` +
      "40년 만근'이라는 문구를 명확히 그려 넣고, 그 길이를 가리키며 진지한 " +
      "표정으로 조건을 짚는 포즈.",
  },
  {
    id: "geumbaksa_ep6_s6",
    file: "geumbaksa_ep6_s6.png",
    first: false,
    clause:
      `장면 6 (현실 확인): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP6_BG} 앞 장면과 이어지는 타임라인 그래프에 ` +
      "'평균 가입기간 20년', '소득대체율 21.5%'라는 문구를 추가로 그려 넣고, " +
      "40년 만근 막대와 20년 막대를 나란히 비교하는 도식을 함께 배치. 놀란 듯 " +
      "진지한 표정.",
  },
  {
    id: "geumbaksa_ep6_s7",
    file: "geumbaksa_ep6_s7.png",
    first: false,
    clause:
      `장면 7 (정리): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP6_BG} 정보 카드에 '43% = 최댓값'이라는 문구와 ` +
      "'내 가입기간 × 1.075% = 진짜 내 몫'이라는 문구를 함께 그려 넣고, 확신에 " +
      "찬 표정으로 정리하는 포즈.",
  },
  {
    id: "geumbaksa_ep6_s8",
    file: "geumbaksa_ep6_s8.png",
    first: false,
    clause:
      `장면 8 (액션 — 추후납부): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP6_BG} 톤은 밝고 희망적으로. '추후납부', ` +
      "'최대 119개월'이라는 문구가 적힌 카드를 들고 빈 공백을 채우는 듯한 손짓 " +
      "포즈. 은은한 미소.",
  },
  {
    id: "geumbaksa_ep6_s9",
    file: "geumbaksa_ep6_s9.png",
    first: false,
    clause:
      `장면 9 (액션 — 임의계속가입): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP6_BG} '임의계속가입', '65세 전'` +
      "이라는 문구가 적힌 카드를 가리키며 타임라인을 연장하는 듯한 손짓 포즈. " +
      "따뜻하고 격려하는 표정.",
  },
  {
    id: "geumbaksa_ep6_s10",
    file: "geumbaksa_ep6_s10.png",
    first: false,
    clause:
      `장면 10 (액션 — 내 가입기간 조회, 마무리): 배경은 절대 새로 만들지 말고 ` +
      `앞 장면과 완전히 동일하게 유지한다 — ${GEUMBAKSA_EP6_BG} 스마트폰으로 ` +
      "조회 화면을 보여주며 따뜻하게 웃는 포즈. 화면에는 '내 가입기간 조회'라는 " +
      "문구를 명확히 그려 넣는다. 활짝 웃는 친근한 표정.",
  },
];

// 금박사 7편(예금자보호 한도 1억원) 배경 — 은행/저축은행 창구 상담 데스크
// 공간(1~6편의 홈오피스·서재풍 배경과 겹치지 않는 새 배경).
const GEUMBAKSA_EP7_BG =
  "밝고 캐주얼한 은행 창구 상담 데스크 공간 — 벽에 걸린 '예금자보호제도' " +
  "안내판 하나, 저축 관련 포스터 소품, 상담 데스크와 편안한 의자가 보이는 " +
  "공간(1~6편과는 다른 소품 배치). 특정 은행 로고·마크 없는 일반적인 은행 " +
  "창구 톤. 단색 배경이나 스튜디오풍 배경으로 바꾸지 않는다.";
const POSES_GEUMBAKSA_EP7_11SCENE = [
  {
    id: "geumbaksa_ep7_s1",
    file: "geumbaksa_ep7_s1.png",
    first: true,
    clause:
      `장면 1 (오프닝): ${GEUMBAKSA_EP7_BG} 정면을 보며 인사하듯 한쪽 팔(손)을 ` +
      "살짝 드는 포즈. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep7_s2",
    file: "geumbaksa_ep7_s2.png",
    first: false,
    clause:
      `장면 2 (훅): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP7_BG} '내 돈은 안전할까?'라고 쓰인 카드를 손에 ` +
      "들고 궁금한 듯 고개를 갸웃하는 포즈, 카드 옆에 작은 물음표 아이콘. " +
      "궁금해하는 표정.",
  },
  {
    id: "geumbaksa_ep7_s3",
    file: "geumbaksa_ep7_s3.png",
    first: false,
    clause:
      `장면 3 (정의+핵심수치): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP7_BG} 정보 카드 소품에 '5천만원 → ` +
      "1억원'이라는 큰 글자와 화살표를 명확히 그려 넣고, 카드를 손으로 감싸 " +
      "쥐고 자신 있게 보여주는 포즈. 확신에 찬 표정.",
  },
  {
    id: "geumbaksa_ep7_s4",
    file: "geumbaksa_ep7_s4.png",
    first: false,
    clause:
      `장면 4 (한도 체감 — 정상/초과 대비): 배경은 절대 새로 만들지 말고 앞 ` +
      `장면과 완전히 동일하게 유지한다 — ${GEUMBAKSA_EP7_BG} 정보 카드 소품에 ` +
      "두 가지 예시를 위아래로 나란히 그려 넣는다 — 위쪽 '9천만원 → 9천만원 " +
      "전액 보호'(초록 체크 아이콘), 아래쪽 '1억2천만원 → 1억원만 보호, " +
      "2천만원 초과'(빨간 X 아이콘). 카드를 손으로 감싸 쥐고 진지한 표정으로 " +
      "가리키는 포즈.",
  },
  {
    id: "geumbaksa_ep7_s5",
    file: "geumbaksa_ep7_s5.png",
    first: false,
    clause:
      `장면 5 (오해 정정 — 계좌 쪼개기 무의미): 배경은 절대 새로 만들지 말고 ` +
      `앞 장면과 완전히 동일하게 유지한다 — ${GEUMBAKSA_EP7_BG} 바닥에 세운 큰 ` +
      "보드에 여러 개의 작은 계좌 아이콘이 하나의 큰 화살표로 합쳐지는 도식과 " +
      "'소용없음'이라는 큰 글자를 그려 넣는다. 보드 옆에서 한쪽 팔로 도식을 " +
      "가리키는 포즈. 단호한 표정.",
  },
  {
    id: "geumbaksa_ep7_s6",
    file: "geumbaksa_ep7_s6.png",
    first: false,
    clause:
      `장면 6 (진짜 방법 — 은행 분산): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP7_BG} 바닥에 세운 큰 보드에 두 ` +
      "개의 은행 건물 아이콘('A은행', 'B은행')과 각각 '9천만원 전액 보호'라는 " +
      "큰 글자, 하단에 '총 1억8천만원'이라는 합계를 그려 넣는다. 보드 옆에서 " +
      "밝은 표정으로 가리키는 포즈.",
  },
  {
    id: "geumbaksa_ep7_s7",
    file: "geumbaksa_ep7_s7.png",
    first: false,
    clause:
      `장면 7 (보충 — 저축은행도 동일): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP7_BG} 정보 카드 소품에 '시중은행 ` +
      "= 저축은행, 한도 동일 1억원'이라는 큰 글자를 명확히 그려 넣고, 카드를 " +
      "손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep7_s8",
    file: "geumbaksa_ep7_s8.png",
    first: false,
    clause:
      `장면 8 (보충 — 퇴직연금 별도 한도): 배경은 절대 새로 만들지 말고 앞 ` +
      `장면과 완전히 동일하게 유지한다 — ${GEUMBAKSA_EP7_BG} 정보 카드 소품에 ` +
      "'일반 예금'과 '퇴직연금·연금저축'을 각각 별도 박스로 나누고, 두 박스 " +
      "각각에 '1억원'이라는 글자를 그려 넣어 따로 계산됨을 시각화. 카드를 " +
      "손으로 감싸 쥔 포즈. 차분하고 설명하는 표정.",
  },
  {
    id: "geumbaksa_ep7_s9",
    file: "geumbaksa_ep7_s9.png",
    first: false,
    clause:
      `장면 9 (신청 필요 — 자동 아님): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP7_BG} 정보 카드 소품에 통장 ` +
      "아이콘과 빨간 X 표시, '자동 입금 아님'이라는 글자, 그 옆에 '예금보험 " +
      "공사에 직접 신청'이라는 큰 글자를 명확히 그려 넣는다. 카드를 감싸 쥐고 " +
      "진지한 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep7_s10",
    file: "geumbaksa_ep7_s10.png",
    first: false,
    clause:
      `장면 10 (신청 방법): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP7_BG} 톤은 밝고 희망적으로. 스마트폰 ` +
      "화면에 '예금보험공사 신청'이라는 문구가 명확히 그려진 소품을 손으로 " +
      "감싸 쥐고, 은은한 미소로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep7_s11",
    file: "geumbaksa_ep7_s11.png",
    first: false,
    clause:
      `장면 11 (마무리): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP7_BG} 소품 없이 따뜻하게 웃으며 손을 흔드는 ` +
      "포즈. 활짝 웃는 친근한 표정으로 여운 있게 마무리.",
  },
];

// 금박사 8편(표시번호, 토지거래허가구역) 배경 — 부동산/지역 정보 상담 데스크
// 공간(1~7편의 홈오피스·서재풍·은행 창구 배경과 겹치지 않는 새 배경).
const GEUMBAKSA_EP8_BG =
  "밝고 캐주얼한 부동산 정보 상담 데스크 공간 — 벽에 걸린 지도 형태의 구역도 " +
  "안내판 하나, 서류철·모니터 소품(1~7편과는 다른 소품 배치). 특정 기관 " +
  "로고·마크 없는 일반적인 부동산 정보 상담 톤. 단색 배경이나 스튜디오풍 " +
  "배경으로 바꾸지 않는다.";
const POSES_GEUMBAKSA_EP8_8SCENE = [
  {
    id: "geumbaksa_ep8_s1",
    file: "geumbaksa_ep8_s1.png",
    first: true,
    clause:
      `장면 1 (오프닝): ${GEUMBAKSA_EP8_BG} 정면을 보며 인사하듯 한쪽 팔(손)을 ` +
      "살짝 드는 포즈. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep8_s2",
    file: "geumbaksa_ep8_s2.png",
    first: false,
    clause:
      `장면 2 (훅 — 반전): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP8_BG} 서울 지도 모양 도식에서 강남3구· ` +
      "용산만 표시된 작은 부분과 서울 전역이 표시된 넓은 부분을 대비해서 " +
      "보여주는 카드를 손으로 감싸 쥐고 놀란 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep8_s3",
    file: "geumbaksa_ep8_s3.png",
    first: false,
    clause:
      `장면 3 (정의): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP8_BG} 정보 카드 소품에 '계약 전 구청 허가 ` +
      "필수'라는 큰 글자를 명확히 그려 넣고, 카드를 손으로 감싸 쥐고 차분히 " +
      "설명하는 포즈.",
  },
  {
    id: "geumbaksa_ep8_s4",
    file: "geumbaksa_ep8_s4.png",
    first: false,
    clause:
      `장면 4 (처벌): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP8_BG} 정보 카드 소품에 계약서 아이콘 위에 빨간 ` +
      "X 표시와 '무효 · 징역 · 벌금'이라는 큰 글자를 그려 넣는다. 카드를 손으로 " +
      "감싸 쥐고 진지한 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep8_s5",
    file: "geumbaksa_ep8_s5.png",
    first: false,
    clause:
      `장면 5 (실거주 조건 + 취지): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP8_BG} 정보 카드 소품에 집 ` +
      "아이콘과 '실거주 2년'이라는 큰 글자, 그 아래 위로 향하는 집값 그래프 " +
      "위에 빨간 금지 표시를 함께 그려 넣는다. 카드를 손으로 감싸 쥐고 진지한 " +
      "표정으로 설명하는 포즈.",
  },
  {
    id: "geumbaksa_ep8_s6",
    file: "geumbaksa_ep8_s6.png",
    first: false,
    clause:
      `장면 6 (최신 변화 — 유예 확대): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP8_BG} 정보 카드 소품에 '실거주 ` +
      "유예 최장 3년 3개월'이라는 큰 글자를 명확히 그려 넣고, 카드를 손으로 " +
      "감싸 쥐고 밝은 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep8_s7",
    file: "geumbaksa_ep8_s7.png",
    first: false,
    clause:
      `장면 7 (최신 변화 — 국토부 지정 권한): 배경은 절대 새로 만들지 말고 앞 ` +
      `장면과 완전히 동일하게 유지한다 — ${GEUMBAKSA_EP8_BG} 정보 카드 소품에 ` +
      "'국토부 장관 직접 지정, 국회 통과 · 시행 예정'이라는 큰 글자를 명확히 " +
      "그려 넣고, 카드를 손으로 감싸 쥐고 차분히 설명하는 포즈.",
  },
  {
    id: "geumbaksa_ep8_s8",
    file: "geumbaksa_ep8_s8.png",
    first: false,
    clause:
      `장면 8 (확인 방법 + 마무리): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP8_BG} 톤은 밝고 희망적으로. ` +
      "스마트폰 화면에 '토지이음 eum.go.kr'이라는 문구가 명확히 그려진 소품을 " +
      "손으로 감싸 쥐고, 따뜻하게 웃으며 보여주는 포즈. 여운 있는 마무리 표정.",
  },
];

// 금박사 9편(표시번호, 퇴직연금 DB형·DC형·IRP) 배경 — 은퇴자금/연금 상담
// 데스크 공간(8편 부동산 상담 배경과 겹치지 않는 새 배경).
const GEUMBAKSA_EP9_BG =
  "밝고 차분한 은퇴자금·연금 상담 데스크 공간 — 벽에 걸린 '퇴직연금 상담' " +
  "안내판, 계산기·서류철·저금통 소품(8편 이전과는 다른 소품 배치). 특정 " +
  "기관 로고·마크 없는 일반적인 금융 상담 톤. 단색 배경이나 스튜디오풍 " +
  "배경으로 바꾸지 않는다.";
const POSES_GEUMBAKSA_EP9_9SCENE = [
  {
    id: "geumbaksa_ep9_s1",
    file: "geumbaksa_ep9_s1.png",
    first: true,
    clause:
      `장면 1 (오프닝): ${GEUMBAKSA_EP9_BG} 정면을 보며 인사하듯 한쪽 팔(손)을 ` +
      "살짝 드는 포즈. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep9_s2",
    file: "geumbaksa_ep9_s2.png",
    first: false,
    clause:
      `장면 2 (훅): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP9_BG} 물음표가 그려진 카드와 돈뭉치 아이콘이 ` +
      "그려진 카드를 양손에 하나씩 들고 놀란 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep9_s3",
    file: "geumbaksa_ep9_s3.png",
    first: false,
    clause:
      `장면 3 (DB형 정의): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP9_BG} 정보 카드 소품에 건물(회사) ` +
      "아이콘과 'DB형 · 금액 확정'이라는 큰 글자를 명확히 그려 넣고, 카드를 " +
      "손으로 감싸 쥐고 차분히 설명하는 포즈.",
  },
  {
    id: "geumbaksa_ep9_s4",
    file: "geumbaksa_ep9_s4.png",
    first: false,
    clause:
      `장면 4 (DC형 정의): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP9_BG} 정보 카드 소품에 사람(개인) ` +
      "아이콘과 'DC형 · 내가 직접 운용'이라는 큰 글자를 명확히 그려 넣고, " +
      "카드를 손으로 감싸 쥐고 설명하는 포즈.",
  },
  {
    id: "geumbaksa_ep9_s5",
    file: "geumbaksa_ep9_s5.png",
    first: false,
    clause:
      `장면 5 (선택 기준): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP9_BG} 정보 카드 소품에 저울 아이콘 ` +
      "위에 'DB형'과 'DC형'을 양쪽에 올려놓은 그림을 그려 넣는다. 카드를 " +
      "손으로 감싸 쥐고 차분히 설명하는 포즈.",
  },
  {
    id: "geumbaksa_ep9_s6",
    file: "geumbaksa_ep9_s6.png",
    first: false,
    clause:
      `장면 6 (IRP): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP9_BG} 정보 카드 소품에 개인 지갑 아이콘과 ` +
      "'IRP · 세액공제'라는 큰 글자를 명확히 그려 넣고, 카드를 손으로 감싸 " +
      "쥐고 밝은 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep9_s7",
    file: "geumbaksa_ep9_s7.png",
    first: false,
    clause:
      `장면 7 (제한 조건): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP9_BG} 정보 카드 소품에 'DB→DB', ` +
      "'DC→DC' 두 줄을 명확히 그려 넣고, 카드를 손으로 감싸 쥐고 진지한 " +
      "표정으로 설명하는 포즈.",
  },
  {
    id: "geumbaksa_ep9_s8",
    file: "geumbaksa_ep9_s8.png",
    first: false,
    clause:
      `장면 8 (확인 방법): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP9_BG} 스마트폰 화면에 '퇴직연금 ` +
      "조회'라는 문구와 체크마크가 명확히 그려진 소품을 손으로 감싸 쥐고, " +
      "따뜻하게 웃으며 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep9_s9",
    file: "geumbaksa_ep9_s9.png",
    first: false,
    clause:
      `장면 9 (추진 중 정책 + 마무리): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP9_BG} 톤은 밝고 희망적으로. ` +
      "정보 카드 소품에 'DC형 → 타사 IRP'라는 문구와 화살표, '추진 중'이라는 " +
      "작은 배지를 함께 그려 넣는다. 손으로 감싸 쥐고 따뜻하게 웃으며 여운 " +
      "있는 마무리 표정.",
  },
];

const GEUMBAKSA_EP10_BG =
  "밝고 차분한 고용보험·실업급여 상담 창구 공간 — 벽에 걸린 '실업급여 안내' " +
  "포스터, 계산기·서류 클립보드·달력 소품(8, 9편과는 다른 소품 배치). " +
  "특정 기관 로고·마크 없는 일반적인 고용 상담 톤. 단색 배경이나 스튜디오풍 " +
  "배경으로 바꾸지 않는다.";
const POSES_GEUMBAKSA_EP10_9SCENE = [
  {
    id: "geumbaksa_ep10_s1",
    file: "geumbaksa_ep10_s1.png",
    first: true,
    clause:
      `장면 1 (오프닝): ${GEUMBAKSA_EP10_BG} 정면을 보며 인사하듯 한쪽 팔(손)을 ` +
      "살짝 드는 포즈. 활짝 웃는 친근한 표정.",
  },
  {
    id: "geumbaksa_ep10_s2",
    file: "geumbaksa_ep10_s2.png",
    first: false,
    clause:
      `장면 2 (훅): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP10_BG} 정보 카드 소품에 상승 화살표 아이콘과 ` +
      "'마냥 좋은 일?'이라는 큰 글자를 명확히 그려 넣고, 카드를 손으로 감싸 " +
      "쥐고 갸웃하는 궁금한 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep10_s3",
    file: "geumbaksa_ep10_s3.png",
    first: false,
    clause:
      `장면 3 (계산식): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP10_BG} 정보 카드 소품에 '최저임금 × 80% × ` +
      "8시간'이라는 큰 글자 수식을 명확히 그려 넣고, 카드를 손으로 감싸 쥐고 " +
      "차분히 설명하는 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep10_s4",
    file: "geumbaksa_ep10_s4.png",
    first: false,
    clause:
      `장면 4 (금액 계산): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP10_BG} 정보 카드 소품에 '하루 ` +
      "68,480원'이라는 큰 글자와 동전 아이콘을 명확히 그려 넣고, 카드를 손으로 " +
      "감싸 쥐고 확신에 찬 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep10_s5",
    file: "geumbaksa_ep10_s5.png",
    first: false,
    clause:
      `장면 5 (반전): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP10_BG} 정보 카드 소품에 하락 화살표 아이콘과 ` +
      "'통장은 오히려 줄어든다?'라는 큰 글자를 명확히 그려 넣고, 카드를 손으로 " +
      "감싸 쥐고 놀란 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep10_s6",
    file: "geumbaksa_ep10_s6.png",
    first: false,
    clause:
      `장면 6 (원인): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 동일하게 ` +
      `유지한다 — ${GEUMBAKSA_EP10_BG} 바닥에 세운 큰 보드에 '주 7일'과 '주 ` +
      "6일' 두 글자 상자를 화살표로 잇는 도식을 그려 넣는다. 금박사는 보드 " +
      "옆에서 설명하듯 한쪽 팔을 가볍게 드는 포즈.",
  },
  {
    id: "geumbaksa_ep10_s7",
    file: "geumbaksa_ep10_s7.png",
    first: false,
    clause:
      `장면 7 (감소 체감): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP10_BG} 정보 카드 소품에 '198만원 → ` +
      "176만원'이라는 큰 글자를 명확히 그려 넣고, 카드를 손으로 감싸 쥐고 " +
      "진지한 표정으로 설명하는 포즈.",
  },
  {
    id: "geumbaksa_ep10_s8",
    file: "geumbaksa_ep10_s8.png",
    first: false,
    clause:
      `장면 8 (안심 포인트): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP10_BG} 정보 카드 소품에 '총액은 ` +
      "그대로 990만원'이라는 큰 글자와 동그라미 체크 아이콘을 명확히 그려 " +
      "넣고, 카드를 손으로 감싸 쥐고 안심시키듯 밝게 웃는 표정으로 보여주는 " +
      "포즈.",
  },
  {
    id: "geumbaksa_ep10_s9",
    file: "geumbaksa_ep10_s9.png",
    first: false,
    clause:
      `장면 9 (확인 방법 + 마무리): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP10_BG} 톤은 밝고 희망적으로. ` +
      "스마트폰 화면에 '실업급여 모의계산'이라는 문구와 체크마크가 명확히 " +
      "그려진 소품을 손으로 감싸 쥐고, 따뜻하게 웃으며 여운 있는 마무리 표정.",
  },
];

const GEUMBAKSA_EP11_BG =
  "밝고 단정한 인사총무팀 근로계약 상담 창구 공간 — 벽에 걸린 급여명세서· " +
  "근로계약서 아이콘 포스터, 클립보드와 계산기 소품(1~10편과는 다른 소품 " +
  "배치). 특정 회사 로고·마크 없는 일반적인 사무 공간 톤. 단색 배경이나 " +
  "스튜디오풍 배경으로 바꾸지 않는다.";
// ★ 2026-09-27 씬 구조 8씬 재확정 후, 신규 제작이 필요한 3장면만 등록
// (s1 hook 통합, s5 method 통합, s8 closing 통합). 나머지 5장면(s2·s3·
// s4·s6·s7)은 11씬 시절 이미지를 그대로 재사용한다(파일명만 리네임).
const POSES_GEUMBAKSA_EP11_11SCENE = [
  {
    id: "geumbaksa_ep11_s1",
    file: "geumbaksa_ep11_s1.png",
    first: true,
    clause:
      `장면 1 (훅+한줄정리 통합): ${GEUMBAKSA_EP11_BG} 정보 카드 소품에 ` +
      "'안 나가도?'라는 큰 글자를 윗줄, '주휴수당'이라는 큰 글자를 아랫줄에 " +
      "명확히 그려 넣고, 카드를 손으로 감싸 쥐고 궁금한 표정에서 확신에 찬 " +
      "미소로 이어지는 포즈.",
  },
  {
    id: "geumbaksa_ep11_s5",
    file: "geumbaksa_ep11_s5.png",
    first: false,
    clause:
      `장면 5 (계산법+핵심수치 통합): 배경은 절대 새로 만들지 말고 앞 장면과 ` +
      `완전히 동일하게 유지한다 — ${GEUMBAKSA_EP11_BG} 정보 카드 소품에 ` +
      "'시급 × 8시간'이라는 큰 글자 수식을 윗줄, '하루 85,600원'이라는 큰 " +
      "글자를 아랫줄에 명확히 그려 넣고, 카드를 손으로 감싸 쥐고 또박또박 " +
      "설명하다 확신에 찬 표정으로 보여주는 포즈.",
  },
  {
    id: "geumbaksa_ep11_s8",
    file: "geumbaksa_ep11_s8.png",
    first: false,
    clause:
      `장면 8 (마무리 통합): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 ` +
      `동일하게 유지한다 — ${GEUMBAKSA_EP11_BG} 정보 카드 소품에 '신청 없이 ` +
      "자동 지급'이라는 큰 글자를 명확히 그려 넣고, 카드를 한쪽 손으로 감싸 " +
      "쥐고 다른 손은 살짝 흔들며 밝고 친근한 표정으로 보여주는 포즈.",
  },
];

const OWL_EP17_BG =
  "밝은 주택청약 상담 창구 — 상담 데스크와 벽에 걸린 '청약통장 안내' " +
  "포스터, 아파트 단지 조감도 액자, 신청서 클립보드와 화분으로 채워진 " +
  "차분한 주택금융 상담 톤 (1~16편의 사무실·거실·증권사 상담 라운지· " +
  "홈트레이딩 데스크·증권사 트레이딩룸·은행 창구·국민연금공단 상담 창구· " +
  "고용센터 상담 데스크·부동산 중개사무소·퇴직연금 고객센터·금융감독 " +
  "브리핑룸·고용노동부 정책 브리핑룸·최저임금위원회 심의장과는 겹치지 " +
  "않는 새 배경). 특정 기관 로고·마크 없음.";
const POSES_OWL_EP17_10SCENE = [
  {
    id: "owl_ep17_s1_opening",
    file: "owl_ep17_s1_opening.png",
    first: true,
    clause:
      `장면 1 (오프닝): 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 ` +
      `찬 진지한 표정 — 웃지 않되 신뢰감 있는 눈빛. 배경에 밝은 주택청약 상담 ` +
      `창구를 배치해 오늘 주제를 예고. 배경 소품에는 작은 설명문 대신 큰 글자 ` +
      `라벨만 사용, 빈 벽면이 크게 남지 않도록 화분·의자·포스터 등으로 ` +
      `채운다. 배경: ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s2_hook",
    file: "owl_ep17_s2_hook.png",
    first: false,
    clause:
      `장면 2 (훅): '이번 주 안에 확인!'이라는 큰 글자와 느낌표 아이콘이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 다급하지만 친절한 표정으로 보여주는 포즈 ` +
      `— 웃지 않음. 카드에는 이 짧은 문구만 크게 그려 넣는다. 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s3_fact",
    file: "owl_ep17_s3_fact.png",
    first: false,
    clause:
      `장면 3 (사실 — 기한 연장): '전환기한 1년 연장'이라는 큰 글자와 달력 ` +
      `아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 담담하고 진지한 표정으로 ` +
      `설명하는 포즈 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 ` +
      `— ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s4_definition",
    file: "owl_ep17_s4_definition.png",
    first: false,
    clause:
      `장면 4 (정의 — 기존 구분): 바닥에 세운 큰 보드에 '청약예금·부금 → ` +
      `민영주택'과 '청약저축 → 국민주택' 두 글자 상자를 나란히 그려 넣는다. ` +
      `부엉이는 보드 옆에서 설명하듯 한쪽 날개를 가볍게 드는 포즈 — 웃지 ` +
      `않음(보드는 바닥 거치라 손으로 들지 않는다). 배경: ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s5_definition",
    file: "owl_ep17_s5_definition.png",
    first: false,
    clause:
      `장면 5 (정의 — 전환 효과): '국민주택 + 민영주택 둘 다 OK'라는 큰 ` +
      `글자와 체크마크 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 밝은 ` +
      `표정으로 보여주는 포즈 — 은은한 미소 허용. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s6_condition",
    file: "owl_ep17_s6_condition.png",
    first: false,
    clause:
      `장면 6 (조건 — 실적 리셋 주의): '실적은 전환일부터 새로 시작'이라는 ` +
      `큰 글자와 주의 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지하게 ` +
      `설명하는 표정으로 보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s7_evidence",
    file: "owl_ep17_s7_evidence.png",
    first: false,
    clause:
      `장면 7 (근거 — 예전 방식): '예전: 가입기간 0부터 다시'라는 큰 글자와 ` +
      `리셋 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 아쉬운 표정으로 ` +
      `보여주는 포즈 — 웃지 않음. 배경: ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s8_evidence",
    file: "owl_ep17_s8_evidence.png",
    first: false,
    clause:
      `장면 8 (근거 — 개선된 금리): '연 3.1% 즉시 적용'이라는 큰 글자와 상승 ` +
      `화살표 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 ` +
      `보여주는 포즈 — 은은한 미소 허용. 배경: ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s9_condition",
    file: "owl_ep17_s9_condition.png",
    first: false,
    clause:
      `장면 9 (조건 — 비가역성 경고): '되돌리기 불가 · 예금자보호 제외'라는 ` +
      `큰 글자와 경고 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지한 ` +
      `표정으로 설명하는 포즈 — 웃지 않음. 배경: ${OWL_EP17_BG}`,
  },
  {
    id: "owl_ep17_s10_action",
    file: "owl_ep17_s10_action.png",
    first: false,
    clause:
      `장면 10 (마무리 — 액션): '은행 앱·창구에서 확인'이라는 큰 글자가 적힌 ` +
      `카드를 한쪽 날개로 확실히 감싸 쥔 채 들어 보이는 포즈, 밝고 친근한 ` +
      `미소로 마무리 — 은은한 미소 허용(마무리 톤이라 다른 씬보다 부드러워도 ` +
      `됨). 배경: ${OWL_EP17_BG}`,
  },
];

// v2 재제작 11편 — 새로 만드는 5장면(s1·s2·s7·s10·s13). 나머지 9장면은 17편 v1
// 이미지·영상을 재사용하므로 배경 설명은 OWL_EP17_BG를 그대로 쓴다. 글자는 큰
// 글자 1~2줄만, 소품은 감싸 쥐거나 바닥 거치(§0-1).
// v2 재제작 14편 — 새로 만드는 5장면(s1·s7·s8·s11·s14). 배경은 v1 파일 ep10과 같은 OWL_EP10_BG.
// v1 영상 배경의 '연금 상담 창구' 현판·파란 조회 스크린 톤을 맞춘다.
const OWL_EP10_BG_V2 = `${OWL_EP10_BG} 벽 위쪽에 남색 바탕 흰 글자 '연금 상담 창구' 현판 하나, 파란색 연금 조회 스크린, 남색 의자.`;
const POSES_OWL_V2_EP14_5SCENE = [
  {
    id: "owl_v2_ep14_s1_hook_q",
    file: "owl_v2_ep14_s1_hook_q.png",
    first: true,
    clause:
      `장면 1 (훅 — 질문): '국민연금' / '또 오른다?'라는 큰 글자 2줄이 적힌 카드를 한쪽 ` +
      `날개로 감싸 쥐고, 눈썹을 치켜올린 날카롭고 궁금한 표정 — 웃지 않음. 카드에는 이 ` +
      `짧은 문구만 크게. 배경: ${OWL_EP10_BG_V2}`,
  },
  {
    // 2026-09-29 팩트 수정 재생성: v1 보드 '기금 소진 2071년으로 연장'은 수익률 가정이 달라
    // (2056=4.5%, 2071=5.5%) 개혁 효과로 비교 불가 → 같은 가정의 2064년으로 교체.
    id: "owl_v2_ep14_s6_why",
    file: "owl_v2_ep14_s6_why.png",
    first: false,
    clause:
      `장면 6 (왜): '기금 소진' / '2056년 → 2064년'이라는 큰 글자 2줄이 적힌 카드를 한쪽 ` +
      `날개로 감싸 쥐고, 다른 날개는 카드를 가리키듯 살짝 들어 설명하는 진지한 표정 — 웃지 ` +
      `않음. 카드에는 이 짧은 문구만 크게. 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP10_BG_V2}`,
  },
  {
    id: "owl_v2_ep14_s7_core_q_answer",
    file: "owl_v2_ep14_s7_core_q_answer.png",
    first: false,
    clause:
      `장면 7 (핵심 질문): '내 월급은' / '또 줄까?'라는 큰 글자 2줄이 적힌 카드를 한쪽 날개로 ` +
      `감싸 쥐고, 다른 날개는 턱 근처에서 생각하는 포즈, 날카로운 눈빛 — 웃지 않음. 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP10_BG_V2}`,
  },
  {
    id: "owl_v2_ep14_s8_point1_calc",
    file: "owl_v2_ep14_s8_point1_calc.png",
    first: false,
    clause:
      `장면 8 (부담 계산): 바닥에 세운 큰 보드에 큰 글자 2줄 '직장인 +7,700원' / ` +
      `'지역 +15,400원'. 부엉이는 보드 옆에서 소품을 들지 않은 날개로 보드를 가리키는 진지한 ` +
      `표정 — 웃지 않음(보드는 바닥 거치라 손으로 들지 않는다). 배경은 앞 장면과 절대적으로 ` +
      `동일해야 한다 — ${OWL_EP10_BG_V2}`,
  },
  {
    id: "owl_v2_ep14_s11_caution",
    file: "owl_v2_ep14_s11_caution.png",
    first: false,
    clause:
      `장면 11 (주의): 빨간 경고 아이콘과 '미납하면' / '연금 줄어요'라는 큰 글자 2줄이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 진지하고 단호한 표정 — 웃지 않음. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP10_BG_V2}`,
  },
  {
    id: "owl_v2_ep14_s14_bridge",
    file: "owl_v2_ep14_s14_bridge.png",
    first: false,
    clause:
      `장면 14 (마무리): '진짜' / '내 몫?'이라는 큰 글자 2줄이 적힌 카드를 한쪽 날개로 감싸 ` +
      `쥐고, 다른 날개는 가볍게 흔드는 밝고 친근한 마무리 표정. 배경은 앞 장면과 절대적으로 ` +
      `동일해야 한다 — ${OWL_EP10_BG_V2}`,
  },
];

// v2 재제작 15편 — 새로 만드는 9장면(s1·s2·s4·s7·s9·s11·s12·s14·s15). 배경은
// v1 파일 ep15와 같은 OWL_EP15_BG(고용노동부 정책 브리핑룸, 초록·네이비 톤).
const POSES_OWL_V2_EP15_9SCENE = [
  {
    id: "owl_v2_ep15_s1_hook_q",
    file: "owl_v2_ep15_s1_hook_q.png",
    first: true,
    clause:
      `장면 1 (훅 — 질문): '실업급여' / '바뀐다?'라는 큰 글자 2줄이 적힌 카드를 한쪽 ` +
      `날개로 감싸 쥐고, 눈썹을 치켜올린 날카롭고 궁금한 표정 — 웃지 않음. 카드에는 이 ` +
      `짧은 문구만 크게. 배경: ${OWL_EP15_BG}`,
  },
  {
    id: "owl_v2_ep15_s2_hook_stakes",
    file: "owl_v2_ep15_s2_hook_stakes.png",
    first: false,
    clause:
      `장면 2 (훅 — 판돈): '줄어든다?' / '늘어난다?'라는 큰 글자 2줄과 물음표 아이콘 ` +
      `2개가 적힌 카드를 한쪽 날개로 감싸 쥐고 고개를 갸웃하는 궁금한 표정 — 웃지 않음. ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_v2_ep15_s4_definition",
    file: "owl_v2_ep15_s4_definition.png",
    first: false,
    clause:
      `장면 4 (개념 정의): '구직급여 =' / '재취업 생활비'라는 큰 글자 2줄이 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고 담담하고 진지하게 설명하는 표정 — 웃지 않음. 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_v2_ep15_s7_core_q_answer",
    file: "owl_v2_ep15_s7_core_q_answer.png",
    first: false,
    clause:
      `장면 7 (핵심 질문): '내 실업급여는' / '얼마나 줄까?'라는 큰 글자 2줄이 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고, 다른 날개는 턱 근처에서 생각하는 포즈, 날카로운 눈빛 — 웃지 ` +
      `않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_v2_ep15_s9_point1_ratio",
    file: "owl_v2_ep15_s9_point1_ratio.png",
    first: false,
    clause:
      `장면 9 (비율): '수급자 10명 중' / '6명'이라는 큰 글자 2줄과 사람 아이콘이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정 — 웃지 않음. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_v2_ep15_s11_point3_why",
    file: "owl_v2_ep15_s11_point3_why.png",
    first: false,
    clause:
      `장면 11 (이유): 바닥에 세운 큰 보드에 큰 글자 2줄 '일할 때 193만원' / '쉴 때 ` +
      `198만원'(아랫줄을 붉게 강조). 부엉이는 보드 옆에서 소품을 들지 않은 날개로 보드를 ` +
      `가리키는 진지한 표정 — 웃지 않음(보드는 바닥 거치라 손으로 들지 않는다). 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_v2_ep15_s12_point4_fee",
    file: "owl_v2_ep15_s12_point4_fee.png",
    first: false,
    clause:
      `장면 12 (보험료율): '보험료율' / '1.8%→2.0%'라는 큰 글자 2줄이 적힌 카드를 한쪽 ` +
      `날개로 감싸 쥐고 진지한 표정 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 ` +
      `한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_v2_ep15_s14_summary_check",
    file: "owl_v2_ep15_s14_summary_check.png",
    first: false,
    clause:
      `장면 14 (정리+확인): 바닥에 세운 큰 보드에 큰 글자 2줄 '체크① 하한액 여부' / ` +
      `'체크② 국회 진행상황'. 부엉이는 보드 옆에서 소품을 들지 않은 날개로 손가락 두 개를 ` +
      `세워 보이는 진지한 표정 — 웃지 않음(보드는 바닥 거치라 손으로 들지 않는다). 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
  {
    id: "owl_v2_ep15_s15_bridge",
    file: "owl_v2_ep15_s15_bridge.png",
    first: false,
    clause:
      `장면 15 (마무리): '실업급여' / '계산?'이라는 큰 글자 2줄이 적힌 카드를 한쪽 날개로 ` +
      `감싸 쥐고, 다른 날개는 가볍게 흔드는 밝고 친근한 마무리 표정. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP15_BG}`,
  },
];

// v2 재제작 16편 — 새로 만드는 10장면(s1·s2·s4·s7·s8·s9·s10·s14·s15·s16).
// 배경은 v1 파일 ep13과 같은 OWL_EP13_BG(퇴직연금 고객센터 상담 데스크).
const POSES_OWL_V2_EP16_10SCENE = [
  {
    id: "owl_v2_ep16_s1_hook_q",
    file: "owl_v2_ep16_s1_hook_q.png",
    first: true,
    clause:
      `장면 1 (훅 — 질문): '퇴직연금' / '팔고 또 사?'라는 큰 글자 2줄이 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고, 눈썹을 치켜올린 날카롭고 궁금한 표정 — 웃지 않음. ` +
      `카드에는 이 짧은 문구만 크게. 배경: ${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s2_hook_stakes",
    file: "owl_v2_ep16_s2_hook_stakes.png",
    first: false,
    clause:
      `장면 2 (훅 — 판돈): '안 팔고 그대로?'라는 큰 글자와 물음표 아이콘이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 눈이 커진 놀란 표정. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s4_definition",
    file: "owl_v2_ep16_s4_definition.png",
    first: false,
    clause:
      `장면 4 (개념 정의): '실물이전 =' / '상품 그대로 이전'이라는 큰 글자 2줄이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정 — 웃지 않음. ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s7_core_q_answer",
    file: "owl_v2_ep16_s7_core_q_answer.png",
    first: false,
    clause:
      `장면 7 (핵심 질문): '나는' / '어떻게 해야 할까?'라는 큰 글자 2줄이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고, 다른 날개는 턱 근처에서 생각하는 포즈, ` +
      `날카로운 눈빛 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s8_point1_scale_amount",
    file: "owl_v2_ep16_s8_point1_scale_amount.png",
    first: false,
    clause:
      `장면 8 (규모 수치): '상반기 6.9조 원'이라는 큰 글자와 상승 화살표 아이콘이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 밝고 설명적인 표정 — 웃지 않되 자신 있는 ` +
      `표정. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s9_point1_scale_flow",
    file: "owl_v2_ep16_s9_point1_scale_flow.png",
    first: false,
    clause:
      `장면 9 (자금 흐름): '은행 → 증권사'라는 큰 글자와 화살표가 그려진 카드를 ` +
      `한쪽 날개로 감싸 쥐고 설명하는 표정. 배경은 앞 장면과 절대적으로 동일해야 ` +
      `한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s10_point2_condition_rule",
    file: "owl_v2_ep16_s10_point2_condition_rule.png",
    first: false,
    clause:
      `장면 10 (조건 원칙): '같은 종류 계좌만'이라는 큰 글자가 적힌 카드를 한쪽 ` +
      `날개로 감싸 쥐고 진지한 표정 — 웃지 않음. 배경은 앞 장면과 절대적으로 ` +
      `동일해야 한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s14_summary",
    file: "owl_v2_ep16_s14_summary.png",
    first: false,
    clause:
      `장면 14 (정리): '실물이전,' / '이미 가능해'라는 큰 글자 2줄이 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s15_checklist",
    file: "owl_v2_ep16_s15_checklist.png",
    first: false,
    clause:
      `장면 15 (체크리스트): 바닥에 세운 큰 보드에 큰 글자 2줄 '체크① 내 계좌 ` +
      `종류' / '체크② 대상 상품 여부'. 부엉이는 보드 옆에서 소품을 들지 않은 ` +
      `날개로 손가락 두 개를 세워 보이는 진지한 표정 — 웃지 않음(보드는 바닥 ` +
      `거치라 손으로 들지 않는다). 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s16_bridge",
    file: "owl_v2_ep16_s16_bridge.png",
    first: false,
    clause:
      `장면 16 (마무리): 'DB형·DC형?'이라는 큰 글자가 적힌 카드를 한쪽 날개로 ` +
      `감싸 쥐고, 다른 날개는 가볍게 흔드는 밝고 친근한 마무리 표정. 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP13_BG}`,
  },
  // ★ 2026-09-27 씬 구조 14씬 재확정 후 추가(舊 s8+s9 통합, 舊 s10+s11 통합,
  // 舊 s13 재사용 포기분). 새 씬 번호 기준 id로 등록한다.
  {
    id: "owl_v2_ep16_s8_point1_scale",
    file: "owl_v2_ep16_s8_point1_scale.png",
    first: true,
    clause:
      `장면 8 (규모+흐름 통합): '상반기 6.9조 원'이라는 큰 글자를 윗줄, ` +
      `'은행 → 증권사' 화살표가 그려진 문구를 아랫줄로 이어 붙인 카드를 한쪽 ` +
      `날개로 감싸 쥐고 밝고 설명적인 표정 — 웃지 않되 자신 있는 표정. 배경: ` +
      `${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s9_point2_condition",
    file: "owl_v2_ep16_s9_point2_condition.png",
    first: false,
    clause:
      `장면 9 (조건 통합): '같은 종류 계좌만'이라는 큰 글자를 윗줄, 그 아래 ` +
      `'DB→DB', 'DC→DC', 'IRP→IRP' 세 줄을 화살표와 함께 작은 표 형태로 ` +
      `배치한 카드를 한쪽 날개로 감싸 쥐고 진지한 표정 — 웃지 않음. 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP13_BG}`,
  },
  {
    id: "owl_v2_ep16_s11_caution",
    file: "owl_v2_ep16_s11_caution.png",
    first: false,
    clause:
      `장면 11 (주의): 물음표가 크게 그려진 카드를 한쪽 날개로 감싸 쥐고, ` +
      `고개를 살짝 갸웃하며 신중한 표정을 짓는 포즈 — 웃지 않음. 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP13_BG}`,
  },
];

// 18편(전세사기 최소보장제) 배경 — 법률·주거 피해구제 상담 창구 톤.
// 재사용 원본이 없는 완전 신규 편이라 17장면 전부 새 배경으로 제작.
// 16편(최저임금위원회 심의장)과 다른, 법률구조공단/주거지원센터 상담
// 데스크 톤으로 차별화(특정 기관 로고 없음).
const OWL_EP18_BG =
  "밝은 법률·주거 피해구제 상담 창구 — 둥근 상담 데스크, 벽면에 계약서· " +
  "보증금·집 모양 아이콘이 그려진 안내판, 베이지·네이비 톤 벽면과 화분· " +
  "의자로 채워진 차분한 상담 공간 톤 (1~17편의 사무실·거실·증권사 " +
  "상담 라운지·홈트레이딩 데스크·증권사 트레이딩룸·은행 창구·국민연금 " +
  "공단 상담 창구·고용센터 상담 데스크·부동산 중개사무소·퇴직연금 " +
  "고객센터·금융감독 브리핑룸·고용노동부 정책 브리핑룸·최저임금위원회 " +
  "심의장과는 다른 배경, 특정 기관 로고·마크 없이 일반적인 법률 상담 " +
  "창구 톤).";
const POSES_OWL_V2_EP18_15SCENE = [
  {
    id: "owl_v2_ep18_s1_hook_q",
    file: "owl_v2_ep18_s1_hook_q.png",
    first: true,
    clause:
      `장면 1 (훅 — 질문): '보증금' / '한 푼도?'라는 큰 글자 2줄이 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고, 눈썹을 치켜올린 걱정스럽고 놀란 표정 — 웃지 ` +
      `않음. 카드에는 이 짧은 문구만 크게. 배경: ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s2_hook_stakes",
    file: "owl_v2_ep18_s2_hook_stakes.png",
    first: false,
    clause:
      `장면 2 (훅 — 판돈): '국가가 채워준다?'라는 큰 글자와 작은 동전 아이콘이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 눈이 커진 놀란 표정. 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s3_opening",
    file: "owl_v2_ep18_s3_opening.png",
    first: false,
    clause:
      `장면 3 (오프닝): 한쪽 날개를 살짝 들어 인사하는 자세, 담담한 미소 — ` +
      `기본 표정 유지. 소품 없음. 배경은 앞 장면과 절대적으로 동일해야 ` +
      `한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s4_definition",
    file: "owl_v2_ep18_s4_definition.png",
    first: false,
    clause:
      `장면 4 (개념 정의): '전세사기 최소보장제'라는 큰 글자가 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정 — 웃지 않음. 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s5_fact_timing",
    file: "owl_v2_ep18_s5_fact_timing.png",
    first: false,
    clause:
      `장면 5 (시행일): '11월 13일 시행'이라는 큰 글자와 달력 아이콘이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 확신에 찬 표정 — 웃지 않음. 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s6_fact_criteria",
    file: "owl_v2_ep18_s6_fact_criteria.png",
    first: false,
    clause:
      `장면 6 (기준): '보증금 × 1/3'이라는 큰 글자 수식과 차액 화살표 아이콘이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 또박또박 설명하는 진지한 표정 — ` +
      `웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s7_retroactive",
    file: "owl_v2_ep18_s7_retroactive.png",
    first: false,
    clause:
      `장면 7 (소급 적용): '이미 끝났어도 OK'라는 큰 글자와 되돌리기 화살표 ` +
      `아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 안심시키는 표정 — 웃지 ` +
      `않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s8_core_q_answer",
    file: "owl_v2_ep18_s8_core_q_answer.png",
    first: false,
    clause:
      `장면 8 (핵심 질문): '아무나?' / '피해자 인정자만'이라는 큰 글자 2줄이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고, 처음엔 갸웃하다 확신에 찬 표정 — ` +
      `웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s9_point1_limit",
    file: "owl_v2_ep18_s9_point1_limit.png",
    first: false,
    clause:
      `장면 9 (한도): '3억 원 → 5억 원' 윗줄과 '재량 최대 7억' 아랫줄로 이어진 ` +
      `큰 글자 2줄 카드를 한쪽 날개로 감싸 쥐고 확신에 찬 표정 — 웃지 않음. ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s10_point2_deadline",
    file: "owl_v2_ep18_s10_point2_deadline.png",
    first: false,
    clause:
      `장면 10 (기한): '2027.5.31까지' 윗줄과 '결정일+3년' 아랫줄로 이어진 큰 ` +
      `글자 2줄 카드를 한쪽 날개로 감싸 쥐고 또박또박 설명하는 진지한 표정 — ` +
      `웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s11_caution_exclusion",
    file: "owl_v2_ep18_s11_caution_exclusion.png",
    first: false,
    clause:
      `장면 11 (제외 조건): '직접 매수·배당요구 없음'이라는 큰 글자와 금지 ` +
      `아이콘(사선 원)이 적힌 카드를 한쪽 날개로 감싸 쥐고 단호하고 신중한 ` +
      `표정 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s12_caution_choice",
    file: "owl_v2_ep18_s12_caution_choice.png",
    first: false,
    clause:
      `장면 12 (택1 제약): '현금 or 공공임대'라는 큰 글자와 저울 아이콘이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 신중한 표정 — 웃지 않음. 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s13_summary",
    file: "owl_v2_ep18_s13_summary.png",
    first: false,
    clause:
      `장면 13 (정리): '최소 3분의 1은 국가 보장'이라는 큰 글자가 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세 — 웃지 않음. ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s14_checklist",
    file: "owl_v2_ep18_s14_checklist.png",
    first: false,
    clause:
      `장면 14 (확인): '체크 ① 피해자 인정 여부' / '② 신청 기한'이라고 두 줄로 ` +
      `크게 적힌 카드를 한쪽 날개로 감싸 쥐고, 다른 날개로 손가락 두 개를 ` +
      `세워 보이는 자세 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 ` +
      `한다 — ${OWL_EP18_BG}`,
  },
  {
    id: "owl_v2_ep18_s15_bridge",
    file: "owl_v2_ep18_s15_bridge.png",
    first: false,
    clause:
      `장면 15 (마무리): '저장해두고'와 '신청 전 확인'이라는 큰 글자 2줄이 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고, 다른 날개는 가볍게 흔드는 밝고 친근한 마무리 표정. 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP18_BG}`,
  },
];

// v2 재제작 17편(2027 최저임금) — 새로 만드는 8장면(s1,s2,s4,s6,s8,s10,s14,s16).
// 배경은 v1 파일 ep16과 같은 최저임금위원회 심의장(OWL_EP16_BG).
const POSES_OWL_V2_EP17_8SCENE = [
  {
    id: "owl_v2_ep17_s1_hook_q",
    file: "owl_v2_ep17_s1_hook_q.png",
    first: true,
    clause:
      `장면 1 (훅 — 질문): '최저임금' / '나랑 상관없다?'라는 큰 글자 2줄이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고, 눈썹을 치켜올린 날카롭고 궁금한 표정 — ` +
      `웃지 않음. 카드에는 이 짧은 문구만 크게. 배경: ${OWL_EP16_BG}`,
  },
  {
    id: "owl_v2_ep17_s2_hook_stakes",
    file: "owl_v2_ep17_s2_hook_stakes.png",
    first: false,
    clause:
      `장면 2 (훅 — 판돈): '생각보다 많은 사람'이라는 큰 글자와 사람 여럿 ` +
      `실루엣 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 눈이 커진 놀란 ` +
      `표정. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP16_BG}`,
  },
  {
    id: "owl_v2_ep17_s4_definition",
    file: "owl_v2_ep17_s4_definition.png",
    first: false,
    clause:
      `장면 4 (개념 정의): '최저임금 =' / '시간당 최소 급여'라는 큰 글자 2줄이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정 — 웃지 않음. ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP16_BG}`,
  },
  {
    id: "owl_v2_ep17_s6_fact_rate",
    file: "owl_v2_ep17_s6_fact_rate.png",
    first: false,
    clause:
      `장면 6 (인상률): '3.7% 인상'이라는 큰 글자를 윗줄, '최근 3년 최고치'라는 ` +
      `작은 부제를 아랫줄에 넣고 빨간 상승 화살표 아이콘을 곁들인 카드를 ` +
      `한쪽 날개로 감싸 쥐고 확신에 찬 표정 — 웃지 않음. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP16_BG}`,
  },
  {
    id: "owl_v2_ep17_s8_core_q_answer",
    file: "owl_v2_ep17_s8_core_q_answer.png",
    first: false,
    clause:
      `장면 8 (핵심 질문): '나는' / '상관없을까?'라는 큰 글자 2줄이 적힌 카드를 ` +
      `한쪽 날개로 감싸 쥐고, 다른 날개는 턱 근처에서 생각하는 포즈, 날카로운 ` +
      `눈빛 — 웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ` +
      `${OWL_EP16_BG}`,
  },
  {
    id: "owl_v2_ep17_s10_point1_formula",
    file: "owl_v2_ep17_s10_point1_formula.png",
    first: false,
    clause:
      `장면 10 (계산식): '최저임금 × 80% × 8시간'이라는 큰 글자 수식이 적힌 ` +
      `카드를 한쪽 날개로 감싸 쥐고 또박또박 설명하는 진지한 표정 — 웃지 ` +
      `않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP16_BG}`,
  },
  {
    id: "owl_v2_ep17_s14_summary",
    file: "owl_v2_ep17_s14_summary.png",
    first: false,
    clause:
      `장면 14 (정리): '최저임금 UP,' / '실업급여도 UP'이라는 큰 글자 2줄이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세 — ` +
      `웃지 않음. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP16_BG}`,
  },
  {
    id: "owl_v2_ep17_s16_bridge",
    file: "owl_v2_ep17_s16_bridge.png",
    first: false,
    clause:
      `장면 16 (마무리): '주휴수당은?'이라는 큰 글자가 적힌 카드를 한쪽 날개로 ` +
      `감싸 쥐고, 다른 날개는 가볍게 흔드는 밝고 친근한 마무리 표정. 배경은 ` +
      `앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP16_BG}`,
  },
];

// v2 재제작 13편 — 새로 만드는 5장면(s1·s10·s12·s13·s14). 배경은 v1 파일 ep11과 같은 OWL_EP11_BG.
// ★ '워크넷'은 2024-09 종료된 서비스라 어떤 이미지에도 그리지 않는다(고용24로 표기).
const POSES_OWL_V2_EP13_5SCENE = [
  {
    id: "owl_v2_ep13_s1_hook_q",
    file: "owl_v2_ep13_s1_hook_q.png",
    first: true,
    clause:
      `장면 1 (훅 — 질문): '고용률' / '역대 최고?'라는 큰 글자 2줄이 적힌 카드를 한쪽 ` +
      `날개로 감싸 쥐고, 눈썹을 치켜올린 날카롭고 궁금한 표정 — 웃지 않음. 카드에는 ` +
      `이 짧은 문구만 크게. 배경: ${OWL_EP11_BG}`,
  },
  {
    id: "owl_v2_ep13_s10_calc",
    file: "owl_v2_ep13_s10_calc.png",
    first: false,
    clause:
      `장면 10 (계산 예시): 바닥에 세운 큰 보드에 큰 글자 2줄 '6개월 최대' / '360만 원' ` +
      `(아랫줄을 더 크고 진하게). 부엉이는 보드 옆에서 소품을 들지 않은 날개로 아랫줄을 ` +
      `가리키는 확신에 찬 표정 — 은은한 미소 허용(보드는 바닥 거치라 손으로 들지 않는다). ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP11_BG}`,
  },
  {
    id: "owl_v2_ep13_s12_caution",
    file: "owl_v2_ep13_s12_caution.png",
    first: false,
    clause:
      `장면 12 (주의): '소득 · 재산' / '기준 확인'이라는 큰 글자 2줄과 작은 경고 아이콘이 ` +
      `적힌 카드를 한쪽 날개로 감싸 쥐고 진지한 표정 — 웃지 않음. 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP11_BG}`,
  },
  {
    id: "owl_v2_ep13_s13_summary_check",
    file: "owl_v2_ep13_s13_summary_check.png",
    first: false,
    clause:
      `장면 13 (정리 + 확인): 바닥에 세운 큰 보드에 체크 표시와 큰 글자 2줄 ` +
      `'✔ 수당 대상?' / '✔ 취업 후 제도'. 부엉이는 보드 옆에서 소품을 들지 않은 날개를 ` +
      `가볍게 드는 설명 포즈, 진지하지만 친근한 표정. 배경은 앞 장면과 절대적으로 ` +
      `동일해야 한다 — ${OWL_EP11_BG}`,
  },
  {
    id: "owl_v2_ep13_s14_bridge",
    file: "owl_v2_ep13_s14_bridge.png",
    first: false,
    clause:
      `장면 14 (마무리): '고용24' / '고용센터'라는 큰 글자 2줄이 적힌 카드를 한쪽 날개로 ` +
      `감싸 쥐고, 밝고 친근한 미소로 마무리하는 포즈. 스마트폰·모니터 화면에 다른 사이트 ` +
      `이름을 그리지 않는다. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP11_BG}`,
  },
];

// v2 재제작 12편 — 새로 만드는 4장면(s1·s2·s8·s13). 배경은 12편 v1과 같은 OWL_EP12_BG.
const POSES_OWL_V2_EP12_4SCENE = [
  {
    id: "owl_v2_ep12_s1_hook_q",
    file: "owl_v2_ep12_s1_hook_q.png",
    first: true,
    clause:
      `장면 1 (훅 — 질문): '최대' / '3년 3개월'이라는 큰 글자 2줄이 적힌 카드를 한쪽 ` +
      `날개로 감싸 쥐고, 눈썹을 치켜올린 날카롭고 궁금한 표정 — 웃지 않음. 카드에는 ` +
      `이 짧은 문구만 크게. 배경: ${OWL_EP12_BG}`,
  },
  {
    id: "owl_v2_ep12_s2_hook_stakes",
    file: "owl_v2_ep12_s2_hook_stakes.png",
    first: false,
    clause:
      `장면 2 (훅 — 판돈): 바닥에 세운 큰 보드에 큰 글자 2줄 '기한만?' / '갱신도 인정'. ` +
      `부엉이는 보드 옆에 서서 소품을 들지 않은 날개로 보드를 가리키는 진지한 표정 — 웃지 ` +
      `않음(보드는 바닥 거치라 손으로 들지 않는다). 배경은 앞 장면과 절대적으로 동일해야 ` +
      `한다 — ${OWL_EP12_BG}`,
  },
  {
    id: "owl_v2_ep12_s8_core_q_answer",
    file: "owl_v2_ep12_s8_core_q_answer.png",
    first: false,
    clause:
      `장면 8 (핵심 질문): '나한테는' / '뭐가 달라?'라는 큰 글자 2줄이 적힌 카드를 한쪽 ` +
      `날개로 감싸 쥐고, 다른 날개는 턱 근처에서 생각하는 포즈, 날카로운 눈빛 — 웃지 않음. ` +
      `물음표 그림 카드는 쓰지 않는다. 배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP12_BG}`,
  },
  {
    id: "owl_v2_ep12_s13_summary_check",
    file: "owl_v2_ep12_s13_summary_check.png",
    first: false,
    clause:
      `장면 13 (정리 + 확인): 바닥에 세운 큰 보드에 체크 표시와 큰 글자 2줄 ` +
      `'✔ 계약 끝나는 날' / '✔ 갱신할까?'. 부엉이는 보드 옆에서 소품을 들지 않은 날개를 ` +
      `가볍게 드는 설명 포즈, 진지하지만 친근한 표정. 배경은 앞 장면과 절대적으로 ` +
      `동일해야 한다 — ${OWL_EP12_BG}`,
  },
];

const POSES_OWL_V2_EP11_5SCENE = [
  {
    id: "owl_v2_ep11_s1_hook_q",
    file: "owl_v2_ep11_s1_hook_q.png",
    first: true,
    clause:
      `장면 1 (훅 — 질문): '9월 30일 마감?'이라는 큰 글자 2줄('9월 30일' / ` +
      `'마감?')이 적힌 카드를 한쪽 날개로 감싸 쥐고, 눈썹을 치켜올린 날카롭고 ` +
      `궁금한 표정 — 웃지 않음. 카드에는 이 짧은 문구만 크게. 달력·작은 숫자판 ` +
      `없음. 배경: ${OWL_EP17_BG}`,
  },
  {
    id: "owl_v2_ep11_s2_hook_stakes",
    file: "owl_v2_ep11_s2_hook_stakes.png",
    first: false,
    clause:
      `장면 2 (훅 — 판돈): 바닥에 세운 큰 보드에 큰 글자 2줄 '기한만?' / ` +
      `'금리도 바뀜'. 부엉이는 보드 옆에 서서 소품을 들지 않은 날개로 보드를 ` +
      `가리키는 진지한 표정 — 웃지 않음(보드는 바닥 거치라 손으로 들지 않는다). ` +
      `배경은 앞 장면과 절대적으로 동일해야 한다 — ${OWL_EP17_BG}`,
  },
  {
    id: "owl_v2_ep11_s7_core_q_answer",
    file: "owl_v2_ep11_s7_core_q_answer.png",
    first: false,
    clause:
      `장면 7 (핵심 질문): 카드 가득 큰 물음표 하나만 그려진 카드를 한쪽 날개로 ` +
      `감싸 쥐고, 다른 날개는 턱 근처에서 생각하는 포즈, 날카로운 눈빛 — 웃지 ` +
      `않음. 카드에 글자 없음(물음표가 카드 면을 크게 채운다). 배경은 앞 장면과 ` +
      `절대적으로 동일해야 한다 — ${OWL_EP17_BG}`,
  },
  {
    id: "owl_v2_ep11_s10_calc",
    file: "owl_v2_ep11_s10_calc.png",
    first: false,
    clause:
      `장면 10 (계산 예시): 바닥에 세운 큰 보드에 큰 글자 2줄 '이제 31만 원' / ` +
      `'예전 23만 원'(윗줄을 더 크고 진하게). 부엉이는 보드 옆에서 소품을 들지 ` +
      `않은 날개로 윗줄을 가리키는 확신에 찬 표정 — 은은한 미소 허용. 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP17_BG}`,
  },
  {
    id: "owl_v2_ep11_s13_summary_check",
    file: "owl_v2_ep11_s13_summary_check.png",
    first: false,
    clause:
      `장면 13 (정리 + 확인): 바닥에 세운 큰 보드에 체크 표시와 큰 글자 2줄 ` +
      `'✔ 내 가입기간' / '✔ 국민? 민영?'. 부엉이는 보드 옆에서 소품을 들지 ` +
      `않은 날개를 가볍게 드는 설명 포즈, 진지하지만 친근한 표정. 배경은 앞 ` +
      `장면과 절대적으로 동일해야 한다 — ${OWL_EP17_BG}`,
  },
];

const POSES_BULL_EP1_BG_COMPARE = [
  {
    id: "bull_ep1_bg_tradingdesk",
    file: "bull_ep1_bg_tradingdesk.png",
    first: true,
    clause:
      "전신이 화면의 약 50~55%만 차지하도록 살짝 뒤로 물러난 미디엄 샷 — " +
      "캐릭터가 화면을 가득 채우지 않고 배경이 넉넉히 보여야 함. 한 손으로 " +
      "위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈. " +
      "소품 없음. 배경: 증권사 트레이딩데스크/시황브리핑룸 — 여러 대의 " +
      "대형 모니터에 반도체 관련 캔들차트와 필라델피아반도체지수 그래프 " +
      "실루엣(숫자·텍스트 없이 그래프 형태만), 책상 위에 작은 반도체 칩 " +
      "모형 소품, 파란/흰색 조명의 현대적인 인테리어.",
  },
  {
    id: "bull_ep1_bg_fab",
    file: "bull_ep1_bg_fab.png",
    first: false,
    clause:
      "전신이 화면의 약 50~55%만 차지하도록 살짝 뒤로 물러난 미디엄 샷 — " +
      "캐릭터가 화면을 가득 채우지 않고 배경이 넉넉히 보여야 함. 한 손으로 " +
      "위를 가리키고 다른 손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈. " +
      "소품 없음. 배경: 반도체 공장/클린룸 분위기 — 웨이퍼 공정 라인과 " +
      "반도체 칩 생산 이미지를 형상화한 배경(방진복 인물·특정 기업 로고 " +
      "없음), 은은한 블루 조명과 정밀한 기계 설비 실루엣이 보이는 첨단 " +
      "산업 현장 느낌.",
  },
];

// 황소특보 1편(반도체 섹터 강세, 원인 체인 설명형) 9장면 — 2026-09-23 Owner
// 지적으로 재설계. 최초안(서재+도심야경 CTA 배경 재사용)이 소재(반도체 강세)와
// 개연성이 없다는 지적에 따라, 트레이딩데스크안과 반도체 공장/클린룸안을
// 비교 생성했고 "소재마다 특색 있는 현장 배경"이 시리즈 전체로 볼 때 더
// 낫다는 판단으로 공장/클린룸 톤 확정(Owner: "저렇게 가면 매번 똑같은
// 배경에서만 만들어서 배포하면 사람들이 지루할거잖아"). 방문/현장 리포트
// 느낌을 주는 방진복 없는 클린룸 통로 + 배너 텍스트는 제거(§0 작은 글씨
// 금지 규칙 위반 방지)해 위화감을 낮췄다.
// 황소특보 배경 프롬프트 공통 템플릿(2026-09-23 확정) — 편마다 소재에 맞는
// 현장 배경을 새로 설계하되(금박사가 은행 창구/부동산 데스크/연금 상담실로
// 소재마다 배경을 바꾸는 것과 동일 원칙), 스타일 자체는 항상 캐릭터와 같은
// 3D 애니메이션 톤으로 고정해야 한다. clause 안에 "3D 애니메이션 스타일,
// 실사 금지"를 산문으로 흩어 쓰면 배경 세부 묘사 단어(정밀 기계, 웨이퍼
// 등)에 묻혀 지켜지지 않는 게 실측으로 확인됐다(1편 s1 실사풍 회귀). 이
// 헬퍼가 스타일 강제 문구를 항상 앞뒤로 감싸서 매 편 반복 작성을 막는다.
function wrapBull3dv1SceneBackground(sceneSpecificDescription) {
  return (
    "배경 스타일(최우선 규칙): 사진처럼 정밀하고 사실적인 렌더링 절대 금지. " +
    "장난감 디오라마처럼 모서리를 다 둥글리고 디테일(버튼·배선·라벨·스크래치·" +
    "정밀 반사)을 생략한 매끈하고 단순한 저폴리곤 3D 오브젝트만 사용. " +
    "배경 내용: " + sceneSpecificDescription
  );
}
const BULL_EP1_BG = wrapBull3dv1SceneBackground(
  "반도체 공장 정문 앞. 황소특보 뒤로 대형 공장 건물(매끈한 상자 모양, " +
  "유리창이 격자무늬로 반복되어 반도체 회로 기판을 연상시킴)이 넓게 " +
  "펼쳐지고, 건물 입구 위에는 커다란 반도체 웨이퍼 모양(둥근 원반에 " +
  "무지개빛 격자 패턴) 장식 조형물이 걸려 있어 한눈에 반도체 회사임을 " +
  "알 수 있음. 정문 앞 넓은 광장, 깃대에는 글자 없는 매끈한 깃발. " +
  "건물 외벽과 간판에는 어떠한 글자도 새기지 않는다 — 웨이퍼 원반과 " +
  "회로 패턴 장식만으로 반도체 회사임을 표현. 깃발은 흰색이 아니라 " +
  "선명한 블루와 골드 색상으로. 표지판·인물 없음.",
);
const POSES_BULL_EP1_9SCENE = [
  {
    id: "bull_ep1_s1",
    file: "bull_ep1_s1.png",
    first: true,
    clause:
      `장면 1 (오프닝, 와이드 로우앵글): 카메라를 살짝 아래에서 위로 ` +
      `올려다보는 앵글로 찍어 뒤쪽 건물·웨이퍼 장식이 웅장하고 임팩트 ` +
      `있게 보이게 한다 — 단, 앵글 때문에 캐릭터가 화면을 꽉 채우면 안 됨. ` +
      `카메라를 캐릭터에서 충분히 멀리 두어 캐릭터의 세로 길이는 여전히 ` +
      `화면 전체의 약 45~50%만 차지하고, 캐릭터 위로 건물이 넉넉히 ` +
      `보여야 함. 황소가 정면을 보며 한 손으로 위를 힘차게 가리키고 ` +
      `다른 손은 허리에 얹은 채 눈을 크게 뜨고 활짝 웃는, 에너지 넘치는 ` +
      `표정. ${BULL_EP1_BG}`,
  },
  {
    id: "bull_ep1_s2",
    file: "bull_ep1_s2.png",
    first: false,
    clause:
      "장면 2 (훅, 클로즈업): 배경은 절대 새로 만들지 말고 앞 장면과 완전히 " +
      "동일하게 유지하되, 카메라를 캐릭터 상반신 쪽으로 확대해 얼굴과 " +
      "카드가 화면을 크게 채우는 클로즈업 구도로 바꾼다. 황소가 눈을 " +
      "동그랗게 크게 뜨고 입을 벌린 채 놀란 표정으로, 위를 향하는 굵고 " +
      "큼직한 초록색 화살표 3개가 그려진 카드 소품을 두 손으로 번쩍 " +
      "들어 보여주는 자세.",
  },
  {
    id: "bull_ep1_s3",
    file: "bull_ep1_s3.png",
    first: false,
    clause:
      "장면 3 (배경 설명, 미디엄샷): 배경은 절대 새로 만들지 말고 앞 " +
      "장면과 완전히 동일하게 유지하되, 카메라를 다시 캐릭터 전신이 " +
      "보이는 미디엄샷 거리로 되돌린다. 황소가 호기심 가득한 눈빛으로 " +
      "고개를 살짝 기울이며 '간밤 뉴욕증시 반도체 급등'(큰 글자)과 " +
      "'필라델피아반도체지수 +2.06%'(더 크고 굵은 붉은 글자)가 적힌 " +
      "직사각형 카드를 감싸 쥐고 보여주는 자세.",
  },
  {
    id: "bull_ep1_s4",
    file: "bull_ep1_s4.png",
    first: false,
    clause:
      "장면 4 (진짜 원인, 살짝 측면 3쿼터 앵글): 배경은 절대 새로 만들지 " +
      "말고 앞 장면과 완전히 동일하게 유지하되, 카메라를 살짝 옆으로 " +
      "돌려 3쿼터 각도로 찍는다. 황소가 확신에 찬 진지한 표정으로 " +
      "눈썹을 치켜올리며, 'AI 신제품 흥행'이 적힌 동그란 배지 모양 카드와 " +
      "'AI 반도체 수요 확대 기대'가 적힌 화살표 모양 카드를 양손에 하나씩 " +
      "들고 부딪히듯 마주 보여주는 자세.",
  },
  {
    id: "bull_ep1_s5",
    file: "bull_ep1_s5.png",
    first: false,
    clause:
      "장면 5 (반전, 확산 — 와이드샷): 배경은 절대 새로 만들지 말고 앞 " +
      "장면과 완전히 동일하게 유지하되, 카메라를 뒤로 물러나 건물 전체와 " +
      "캐릭터가 함께 보이는 와이드샷으로 바꾼다. 황소가 입을 크게 벌리고 " +
      "눈을 번쩍 뜬 과장된 놀람 표정으로, '대형주→중소형 장비주까지 " +
      "확산'이라는 큰 글자와 함께 하나의 화살표가 여러 갈래로 퍼져나가는 " +
      "대형 도식 카드를 두 손으로 들어 보여주는 자세.",
  },
  {
    id: "bull_ep1_s6",
    file: "bull_ep1_s6.png",
    first: false,
    clause:
      "장면 6 (영향, 로우앵글 클로즈업): 배경은 절대 새로 만들지 말고 앞 " +
      "장면과 완전히 동일하게 유지하되 톤은 밝게, 카메라는 살짝 아래에서 " +
      "올려다보는 클로즈업 앵글로 캐릭터를 웅장하게 담는다. 황소가 승리한 " +
      "듯 자신감 넘치는 표정으로 활짝 웃으며, '코스피 장 초반 1%대 상승'" +
      "이라는 크고 굵은 글자와 큼직한 초록 상승 그래프가 그려진 카드를 " +
      "번쩍 들어 보여주는 자세.",
  },
  {
    id: "bull_ep1_s7",
    file: "bull_ep1_s7.png",
    first: false,
    clause:
      "장면 7 (균형 잡힌 의미, 정적인 미디엄샷): 배경은 절대 새로 만들지 " +
      "말고 앞 장면과 완전히 동일하게 유지하되, 카메라를 차분한 정면 " +
      "미디엄샷으로 되돌려 앞 장면들과 리듬 차이를 준다. 황소가 웃음기를 " +
      "거두고 눈썹을 살짝 모은 진지하고 사려 깊은 표정으로 두 손을 " +
      "가볍게 벌리며 신중함을 강조하는 자세. 소품 없이 빈 손.",
  },
  {
    id: "bull_ep1_s8",
    file: "bull_ep1_s8.png",
    first: false,
    clause:
      "장면 8 (체크포인트, 3쿼터 앵글): 배경은 절대 새로 만들지 말고 앞 " +
      "장면과 완전히 동일하게 유지하되, 카메라를 다시 3쿼터 각도로 " +
      "돌린다. 황소가 눈을 반짝이며 기대에 찬 표정으로, '오늘 밤 미국 " +
      "증시 재개장'이 큰 글자로 적히고 시계 아이콘이 그려진 카드를 " +
      "가리키며 안내하는 자세.",
  },
  {
    id: "bull_ep1_s9",
    file: "bull_ep1_s9.png",
    first: false,
    clause:
      "장면 9 (여운 있는 마무리, 와이드 로우앵글): 배경은 절대 새로 " +
      "만들지 말고 앞 장면과 완전히 동일하게 유지하되, 카메라를 1번 " +
      "장면과 비슷한 와이드 로우앵글로 되돌려 시작과 끝의 시각적 " +
      "통일감을 준다. 황소가 부드럽고 여운 있는 미소를 지으며 두 손을 " +
      "가볍게 벌리거나 한 손만 편하게 내린 차분한 마무리 자세. 소품 " +
      "없이 빈 손 — 인사하듯 손을 흔드는 동작 아님, 담담하고 따뜻한 " +
      "마무리 느낌.",
  },
];

// 황소특보 2편(레버리지 ETF 반전 수급) 배경 — 증권사 트레이딩 라운지.
// 1편(반도체 공장 정문)과 겹치지 않는 새 공간, 소재(수급 통계)에 맞춰
// 모니터 캔들차트 실루엣으로 증권 정보 현장 느낌을 준다.
const BULL_EP2_BG = wrapBull3dv1SceneBackground(
  "증권사 트레이딩 라운지. 좌우로 매끈하고 둥근 모니터 여러 대(디테일 " +
  "생략, 캔들차트 실루엣만 은은하게), 파스텔톤 조명, 매끈한 바닥. " +
  "글자가 적힌 배너·표지판·숫자·종목명 없음.",
);
const POSES_BULL_EP2_9SCENE = [
  {
    id: "bull_ep2_s1",
    file: "bull_ep2_s1.png",
    first: true,
    clause:
      `장면 1 (오프닝): 카메라를 살짝 아래에서 위로 올려다보는 앵글로 ` +
      `찍어 뒤쪽 공간이 웅장하고 임팩트 있게 보이게 한다 — 단, 앵글 ` +
      `때문에 캐릭터가 화면을 꽉 채우면 안 됨. 카메라를 캐릭터에서 ` +
      `충분히 멀리 두어 캐릭터의 세로 길이는 여전히 화면 전체의 약 ` +
      `45~50%만 차지하고, 캐릭터 위로 공간이 넉넉히 보여야 함. 황소가 ` +
      `정면을 보며 한 손으로 위를 힘차게 가리키고 다른 손은 허리에 얹은 ` +
      `채 밝고 명랑하게 웃는 포즈. ${BULL_EP2_BG}`,
  },
  {
    id: "bull_ep2_s2",
    file: "bull_ep2_s2.png",
    first: false,
    clause:
      `장면 2 (훅): 황소가 놀란 듯 궁금하다는 표정으로 물음표가 ` +
      `그려진 카드 소품을 한 손으로 감싸 쥐고 보여주는 자세. 다른 손은 ` +
      `허리에. ${BULL_EP2_BG}`,
  },
  {
    id: "bull_ep2_s3",
    file: "bull_ep2_s3.png",
    first: false,
    clause:
      `장면 3 (배경 설명): 황소가 '개인 순매도' '코스콤 집계'와 ` +
      `'SK하이닉스 레버리지 1,084억' '삼성전자 레버리지 606억'이라고 ` +
      `적힌 카드를 감싸 쥐고 흥미롭다는 표정으로 보여주는 자세. ${BULL_EP2_BG}`,
  },
  {
    id: "bull_ep2_s4",
    file: "bull_ep2_s4.png",
    first: false,
    clause:
      `장면 4 (팩트): 황소가 '외국인·기관 순매수'와 '외국인 최대 ` +
      `684억 매수'라고 적힌 카드 두 장을 나란히 세워두고 설명하듯 ` +
      `가리키는 자세. ${BULL_EP2_BG}`,
  },
  {
    id: "bull_ep2_s5",
    file: "bull_ep2_s5.png",
    first: false,
    clause:
      `장면 5 (반전): 황소가 놀랍다는 표정으로 '현물 주식은 반대! ` +
      `외국인 1조4,150억 순매도'라고 적힌 카드를 가리키며, 레버리지 ` +
      `ETF와 현물이 서로 반대 방향 화살표로 표시된 도식을 함께 ` +
      `보여주는 자세. ${BULL_EP2_BG}`,
  },
  {
    id: "bull_ep2_s6",
    file: "bull_ep2_s6.png",
    first: false,
    clause:
      `장면 6 (영향): 톤은 밝게. 황소가 '삼성전자 +11.27% · ` +
      `SK하이닉스 +8.88%'이라고 적힌 카드를 감싸 쥐고 밝은 표정으로 ` +
      `보여주는 자세. ${BULL_EP2_BG}`,
  },
  {
    id: "bull_ep2_s7",
    file: "bull_ep2_s7.png",
    first: false,
    clause:
      `장면 7 (의미): 황소가 '수급 엇갈림 = 방향성 불안정'이라고 ` +
      `적힌 카드를 감싸 쥐고 진지하지만 차분한 표정으로 보여주는 자세. ${BULL_EP2_BG}`,
  },
  {
    id: "bull_ep2_s8",
    file: "bull_ep2_s8.png",
    first: false,
    clause:
      `장면 8 (체크포인트): 황소가 '배율 구조 확인' '나눠서 ` +
      `접근'이라고 적힌 카드를 가리키며 안내하듯 밝은 표정. ${BULL_EP2_BG}`,
  },
  {
    id: "bull_ep2_s9",
    file: "bull_ep2_s9.png",
    first: false,
    clause:
      `장면 9 (여운 있는 마무리): 황소가 부드럽고 여운 있는 ` +
      `미소를 지으며 두 손을 가볍게 벌리거나 한 손만 편하게 내린 차분한 ` +
      `마무리 자세. 소품 없이 빈 손 — 인사하듯 손을 흔드는 동작 아님, ` +
      `담담하고 따뜻한 마무리 느낌. ${BULL_EP2_BG}`,
  },
];

// 황소특보 3편(반도체 랠리 착시, 외국인 종목별 반대 베팅) 10장면.
// [_bull-ep3-assembly-spec.mjs]의 imageBrief를 그대로 반영한다. 배경은
// 1·2편과 동일한 트레이딩 라운지 컨셉 재사용(같은 채널·같은 캐릭터
// 연속성 유지 — 부엉박사처럼 편마다 배경을 바꾸지 않고 황소특보는 고정
// 스튜디오 톤을 쓰기로 확정된 상태, [[project_bull_character_design_confirmed]]).
const BULL_EP3_BG = BULL_EP2_BG;
const POSES_BULL_EP3_10SCENE = [
  {
    id: "bull_ep3_s1",
    file: "bull_ep3_s1.png",
    first: true,
    clause:
      `장면 1 (오프닝): 카메라를 살짝 아래에서 위로 올려다보는 앵글로 ` +
      `찍어 뒤쪽 공간이 웅장하고 임팩트 있게 보이게 한다 — 단, 앵글 ` +
      `때문에 캐릭터가 화면을 꽉 채우면 안 됨. 카메라를 캐릭터에서 ` +
      `충분히 멀리 두어 캐릭터의 세로 길이는 여전히 화면 전체의 약 ` +
      `45~50%만 차지하고, 캐릭터 위로 공간이 넉넉히 보여야 함. 황소가 ` +
      `정면을 보며 한 손으로 위를 힘차게 가리키고 다른 손은 허리에 얹은 ` +
      `채 밝고 명랑하게 웃는 포즈. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s2",
    file: "bull_ep3_s2.png",
    first: false,
    clause:
      `장면 2 (훅): 황소가 궁금하다는 표정으로 물음표가 그려진 카드 ` +
      `소품을 한 손으로 감싸 쥐고 보여주는 자세. 다른 손은 허리에. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s3",
    file: "bull_ep3_s3.png",
    first: false,
    clause:
      `장면 3 (배경1): 황소가 '코스피 7080선 회복' '삼성전자 +3.28%'라고 ` +
      `적힌 카드 두 장을 나란히 들고 밝은 표정으로 보여주는 자세. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s4",
    file: "bull_ep3_s4.png",
    first: false,
    clause:
      `장면 4 (배경2): 황소가 '24만원대 → 7거래일 +14%'라고 적힌 상승 ` +
      `곡선 카드를 감싸 쥐고 놀랍다는 표정으로 보여주는 자세. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s5",
    file: "bull_ep3_s5.png",
    first: false,
    clause:
      `장면 5 (반전): 황소가 놀랍다는 표정으로 '외국인, 삼성전자는 매수 ` +
      `화살표 위 / SK하이닉스는 매도 화살표 아래'로 서로 반대 방향을 ` +
      `가리키는 도식 카드를 들고 보여주는 자세. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s6",
    file: "bull_ep3_s6.png",
    first: false,
    clause:
      `장면 6 (근거): 황소가 '삼성전자 2조59억 매수' '하이닉스 2조2,795억 ` +
      `매도' 두 카드를 양손에 하나씩 들고 대조해서 보여주는 자세, 표정은 ` +
      `확신에 찬 눈빛. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s7",
    file: "bull_ep3_s7.png",
    first: false,
    clause:
      `장면 7 (맥락): 황소가 '개인·외국인 매도 vs 자사주 매입'이라고 ` +
      `적힌 카드를 가리키며, 매도 화살표와 매입 화살표가 팽팽하게 맞서는 ` +
      `도식을 함께 보여주는 자세, 진지한 표정. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s8",
    file: "bull_ep3_s8.png",
    first: false,
    clause:
      `장면 8 (체크리스트1): 황소가 '체크 1: 외국인 순매수·매도 상위 ` +
      `확인'이라고 적힌 카드를 확신에 찬 표정으로 가리키는 자세, 한 손 ` +
      `검지를 세워 강조하는 제스처. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s9",
    file: "bull_ep3_s9.png",
    first: false,
    clause:
      `장면 9 (체크리스트2): 황소가 '체크 2: 자사주 매입 진행률 ` +
      `삼성전자 82%·SK하이닉스 64%'라고 적힌 게이지형 카드를 가리키며 ` +
      `검지를 두 개 세운 제스처로 강조하는 자세. ${BULL_EP3_BG}`,
  },
  {
    id: "bull_ep3_s10",
    file: "bull_ep3_s10.png",
    first: false,
    clause:
      `장면 10 (여운 있는 마무리): 황소가 확신에 찬 표정으로 살짝 ` +
      `웃으며 두 손을 자연스럽게 내리거나 가볍게 벌린 마무리 자세. 소품 ` +
      `없이 빈 손. ${BULL_EP3_BG}`,
  },
];

// 황소특보 4편(삼성전자보다 더 오른 반도체 부품주, MLCC 품절+증설 두 축)
// 14장면. [_bull-ep4-assembly-spec.mjs]의 imageBrief를 그대로 반영한다.
// 씬 구조 v3 최초 적용편이라 3편보다 씬이 4개 많다(10→14). 배경은 1~3편과
// 동일한 트레이딩 라운지 컨셉을 그대로 재사용(캐릭터 연속성 유지).
const BULL_EP4_BG = BULL_EP3_BG;
const POSES_BULL_EP4_14SCENE = [
  {
    id: "bull_ep4_s1",
    file: "bull_ep4_s1.png",
    first: true,
    clause:
      `장면 1 (훅 도입): 황소가 궁금하다는 표정으로 큰 물음표가 그려진 ` +
      `카드 소품을 한 손으로 감싸 쥐고 보여주는 자세. 다른 손은 허리에. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s2",
    file: "bull_ep4_s2.png",
    first: false,
    clause:
      `장면 2 (훅 판돈): 황소가 '삼성전자 +9.39%' '기판주 +24%' 두 카드를 ` +
      `양손에 하나씩 감싸 쥐고 대조해 보여주는 자세, 눈이 커진 놀란 표정. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s3",
    file: "bull_ep4_s3.png",
    first: false,
    clause:
      `장면 3 (오프닝): 황소가 정면을 보며 한 손으로 위를 가리키고 다른 ` +
      `손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s4",
    file: "bull_ep4_s4.png",
    first: false,
    clause:
      `장면 4 (상황1): 황소가 '코스피 +2.71%'라고 크게 적힌 카드를 두 ` +
      `손으로 감싸 쥐고 밝은 표정으로 보여주는 자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s5",
    file: "bull_ep4_s5.png",
    first: false,
    clause:
      `장면 5 (상황2): 황소 옆 바닥에 세운 시상대 모양 보드에 1·2·3위 ` +
      `자리마다 '24%' '15.7%' '14.66%'가 크게 적혀 있고, 황소가 빈 손으로 ` +
      `1위 자리를 가리키며 감탄하는 자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s6",
    file: "bull_ep4_s6.png",
    first: false,
    clause:
      `장면 6 (핵심질문+즉답): 황소가 '칩 → 부품'이라는 화살표가 크게 ` +
      `그려진 카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 화살표 방향을 ` +
      `가리키는 자세, 무언가 알아낸 확신에 찬 표정. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s7",
    file: "bull_ep4_s7.png",
    first: false,
    clause:
      `장면 7 (근거1 용어): 황소가 'MLCC 품절'이라고 크게 적힌 카드를 ` +
      `두 손으로 감싸 쥐고 진지한 표정으로 보여주는 자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s8",
    file: "bull_ep4_s8.png",
    first: false,
    clause:
      `장면 8 (근거1 수치): 황소가 '유통가 최대 +280%'라고 크게 적힌 ` +
      `카드를 두 손으로 감싸 쥐고 확신에 찬 눈빛으로 앞으로 내밀어 보여주는 ` +
      `자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s9",
    file: "bull_ep4_s9.png",
    first: false,
    clause:
      `장면 9 (근거1 원인): 황소 옆 바닥에 세운 보드에 'AI 서버 → 공급 ` +
      `부족'이 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 ` +
      `자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s10",
    file: "bull_ep4_s10.png",
    first: false,
    clause:
      `장면 10 (근거2): 황소가 '반도체 증설 시작'이라고 크게 적힌 카드를 ` +
      `한 손으로 감싸 쥐고, 다른 빈 손 검지를 세워 '둘째'를 강조하는 자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s11",
    file: "bull_ep4_s11.png",
    first: false,
    clause:
      `장면 11 (근거2 의미): 황소 옆 바닥에 세운 보드에 '상반기 대장주 → ` +
      `하반기 부품주'가 크게 적혀 있고, 황소가 빈 손으로 오른쪽 화살표 ` +
      `끝을 가리키는 자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s12",
    file: "bull_ep4_s12.png",
    first: false,
    clause:
      `장면 12 (균형): 황소가 '급등 뒤 되돌림 주의'라고 크게 적힌 카드를 ` +
      `두 손으로 감싸 쥐고 신중하고 진지한 표정으로 보여주는 자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s13",
    file: "bull_ep4_s13.png",
    first: false,
    clause:
      `장면 13 (요약+체크리스트): 황소가 '체크 ① 부품주 등락률' '체크 ② ` +
      `MLCC 가격'이라고 두 줄로 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 ` +
      `빈 손으로 손가락 두 개를 세워 보이는 자세. ${BULL_EP4_BG}`,
  },
  {
    id: "bull_ep4_s14",
    file: "bull_ep4_s14.png",
    first: false,
    clause:
      `장면 14 (당부+CTA 마무리): 황소가 확신에 찬 표정으로 살짝 웃으며 ` +
      `한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 ` +
      `없이 빈 손. ${BULL_EP4_BG}`,
  },
];

// 황소특보 5편(반도체 기판주 재급등, 메타 '뮤즈' 앱 흥행→미국 CPU 랠리→
// 한국 기판주 전이) 17장면. [_bull-ep5-assembly-spec.mjs]의 imageBrief를
// 그대로 반영한다. 9.5초 규칙 초과 씬을 문장 경계에서만 나눠 14→17씬으로
// 확장했으므로(내용 압축 없음, 2026-09-27 Owner 지시), 나뉜 씬끼리는 같은
// 카드/포즈를 유지한 채 빈 손 동작만 다르게 해 화면이 자연스럽게 이어지도록
// 설계했다(s9→s10, s11→s12).
//
// ★배경 신규 설계(2026-09-27)★: 1~4편은 전부 같은 트레이딩 라운지 배경을
// 재사용해왔는데, Owner가 "심심하다"고 지적 — 방송 스튜디오/뉴스룸 컨셉으로
// 교체한다(Owner 선택). 황소특보의 "시황 캐스터" 정체성과 어울리고, 부엉박사
// CTA 배경(서재·뉴스룸 톤, POSES_GEUMBAKSA_CTA_FOLLOW 인근 주석 참고)과는
// 소품 구성을 다르게 잡아 캐릭터별 공간이 겹치지 않게 한다.
const BULL_EP5_BG = wrapBull3dv1SceneBackground(
  "경제 뉴스 방송 스튜디오. 황소특보 뒤로 큼직한 곡면 LED 백월(뉴스 " +
  "그래픽 화면, 매끈한 저폴리곤 스타일로 단순화된 캔들차트 실루엣만, " +
  "글자 없음)이 넓게 펼쳐지고, 스튜디오 천장에는 둥글고 뭉툭한 방송용 " +
  "조명 몇 개가 매달려 있음. 화면 앞쪽 좌우로 뉴스 데스크(광택 있는 " +
  "곡선형 책상, 마이크 스탠드 1~2개)가 살짝 보이고, 바닥은 매끈한 " +
  "스튜디오 타일. 트레이딩 라운지의 모니터 벽·소파·화분 배치와는 " +
  "확실히 다른 구도로 — 더 넓고 트인 방송 세트 느낌. 은은한 " +
  "블루·골드 조명. 글자가 적힌 간판·자막바·프롬프터 화면 없음.",
);
const POSES_BULL_EP5_17SCENE = [
  {
    id: "bull_ep5_s1",
    file: "bull_ep5_s1.png",
    first: true,
    clause:
      `장면 1 (훅 도입): 황소가 놀랍고 궁금하다는 표정으로 'AI 앱 1개'라고 ` +
      `적힌 스마트폰 모양 카드를 한 손으로 감싸 쥐고 보여주는 자세. 다른 ` +
      `손은 허리에. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s2",
    file: "bull_ep5_s2.png",
    first: false,
    clause:
      `장면 2 (훅 판돈): 황소가 '미국 CPU 반도체 +14~24%'라고 크게 적힌 ` +
      `카드를 두 손으로 감싸 쥐고 눈이 커진 놀란 표정으로 보여주는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s3",
    file: "bull_ep5_s3.png",
    first: false,
    clause:
      `장면 3 (오프닝): 황소가 정면을 보며 한 손으로 위를 가리키고 다른 ` +
      `손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s4",
    file: "bull_ep5_s4.png",
    first: false,
    clause:
      `장면 4 (상황1): 황소 옆 바닥에 세운 시상대 모양 보드에 1·2·3위 ` +
      `자리마다 'Arm +24%' 'AMD +14%' '인텔 +13%'가 크게 적혀 있고, 황소가 ` +
      `빈 손으로 1위 자리를 가리키며 설명하는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s5",
    file: "bull_ep5_s5.png",
    first: false,
    clause:
      `장면 5 (상황2): 황소가 '반도체지수 +11.8% / DRAM ETF +9.7%' 카드를 ` +
      `두 손으로 감싸 쥐고 고개를 끄덕이며 보여주는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s6",
    file: "bull_ep5_s6.png",
    first: false,
    clause:
      `장면 6 (핵심질문+즉답): 황소가 'Arm·AMD·인텔 = CPU 회사'라고 크게 ` +
      `적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손 검지를 세워 '공통점'을 ` +
      `짚어내는 자세, 무언가 알아낸 확신에 찬 표정. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s7",
    file: "bull_ep5_s7.png",
    first: false,
    clause:
      `장면 7 (근거1 용어): 황소가 '메타 뮤즈 앱스토어 1위'라고 크게 적힌 ` +
      `카드를 두 손으로 감싸 쥐고 진지한 표정으로 보여주는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s8",
    file: "bull_ep5_s8.png",
    first: false,
    clause:
      `장면 8 (근거1 설명): 황소 옆 바닥에 세운 보드에 '온디바이스 AI → ` +
      `CPU 성능 중요'가 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 ` +
      `설명하는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s9",
    file: "bull_ep5_s9.png",
    first: false,
    clause:
      `장면 9 (근거1 원인 전반부): 황소가 'AMD·인텔·Arm ↑'이라고 크게 적힌 ` +
      `카드를 한 손으로 감싸 쥐고, 다른 빈 손 검지를 세워 강조하는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s10",
    file: "bull_ep5_s10.png",
    first: false,
    clause:
      `장면 10 (근거1 원인 후반부, s9와 같은 카드 유지): 황소가 s9와 같은 ` +
      `'AMD·인텔·Arm ↑' 카드를 그대로 감싸 쥔 채, 다른 빈 손으로 카드를 ` +
      `톡톡 짚으며 확신에 찬 표정으로 고개를 끄덕이는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s11",
    file: "bull_ep5_s11.png",
    first: false,
    clause:
      `장면 11 (근거2 전이 전반부): 황소가 '기판 대장주 +8.57% / 기판주 ` +
      `+15.7%' 카드를 두 손으로 감싸 쥐고 놀란 표정으로 앞으로 내밀어 ` +
      `보여주는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s12",
    file: "bull_ep5_s12.png",
    first: false,
    clause:
      `장면 12 (근거2 전이 후반부, s11과 같은 카드 유지): 황소가 s11과 같은 ` +
      `카드를 그대로 감싸 쥔 채, 다른 빈 손으로 '미국 → 한국' 방향을 ` +
      `가리키며 놀란 표정을 짓는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s13",
    file: "bull_ep5_s13.png",
    first: false,
    clause:
      `장면 13 (근거2 의미): 황소 옆 바닥에 세운 보드에 '소부장주 +14.66%'가 ` +
      `크게 적혀 있고, 황소가 빈 손으로 보드 오른쪽을 가리키는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s14",
    file: "bull_ep5_s14.png",
    first: false,
    clause:
      `장면 14 (균형): 황소가 '급등 뒤 되돌림 주의'라고 크게 적힌 카드를 ` +
      `두 손으로 감싸 쥐고 신중하고 진지한 표정으로 보여주는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s15",
    file: "bull_ep5_s15.png",
    first: false,
    clause:
      `장면 15 (요약): 황소가 '앱 1위 → CPU → 기판주' 화살표가 크게 그려진 ` +
      `카드를 두 손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s16",
    file: "bull_ep5_s16.png",
    first: false,
    clause:
      `장면 16 (체크리스트): 황소가 '체크 ① 뮤즈 앱스토어 순위 ② 기판주 ` +
      `등락률'이라고 두 줄로 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 ` +
      `손으로 손가락 두 개를 세워 보이는 자세. ${BULL_EP5_BG}`,
  },
  {
    id: "bull_ep5_s17",
    file: "bull_ep5_s17.png",
    first: false,
    clause:
      `장면 17 (당부+CTA 마무리): 황소가 확신에 찬 표정으로 살짝 웃으며 ` +
      `한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 ` +
      `없이 빈 손. ${BULL_EP5_BG}`,
  },
];

// 황소특보 6편(삼성전자 3분기 배당 마지막 매수일) 배경 — Owner 요청으로
// "회사 정문 앞"을 시도. 실제 회사명 텍스트("삼성" 등)나 로고·상표는
// 이미지에 그려 넣지 않는다(대본 나레이션·자막에서는 "삼성전자" 실명을
// 그대로 쓰지만, 이는 §3 허용리스트 종목 실명 규칙과 별개로 이미지 자체에
// 로고를 재현하는 것과는 다른 문제 — 로고 재현은 상표권 소지가 있어
// 피한다). "대형 전자기업 사옥"처럼 막연한 표현 대신, 실제 대기업 본사
// 앞 광장에서 흔히 보이는 구체적 요소(대형 통유리 로비, 조경, 깃대,
// 안내 데스크)로 채워 자연스럽게 완성한다. 1~5편(반도체 공장 정문/
// 트레이딩 라운지/뉴스 스튜디오)과 겹치지 않는 새 배경.
const BULL_EP6_BG = wrapBull3dv1SceneBackground(
  "글로벌 반도체 기업 본사 앞 광장. 황소특보 뒤로 높고 매끈한 유리 " +
  "타워형 사옥 1~2동이 나란히 솟아 있고(모서리를 둥글린 저폴리곤 상자 " +
  "형태, 통유리 로비 1층이 훤히 비치는 매끈한 격자 패턴), 사옥 앞 " +
  "광장에는 둥근 화단과 잘 다듬어진 나무 몇 그루, 매끈한 돌바닥 " +
  "보행로가 깔려 있음. 광장 한쪽에는 깃대 두세 개가 나란히 서 있고 " +
  "깃발에는 글자·문양이 전혀 없는 매끈한 단색(흰색·하늘색). 사옥 정문 " +
  "위·외벽·로비 유리에는 어떠한 글자·로고·마크·기호도 새기지 않는다 — " +
  "건물의 규모와 통유리 로비 구조만으로 대기업 본사임을 표현한다. " +
  "은은한 골드·화이트 조명, 맑은 하늘. 표지판·인물·차량 없음.",
);
const POSES_BULL_EP6_18SCENE = [
  {
    id: "bull_ep6_s1",
    file: "bull_ep6_s1.png",
    first: true,
    clause:
      `장면 1 (훅): 황소가 다급하지만 확신에 찬 표정으로 '오늘이 마지막?' ` +
      `이라고 적힌 카드를 한 손으로 감싸 쥐고 보여주는 자세. 다른 손은 ` +
      `허리에. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s2",
    file: "bull_ep6_s2.png",
    first: false,
    clause:
      `장면 2 (훅 판돈): 황소가 '배당 30조 원'이라고 크게 적힌 카드를 두 ` +
      `손으로 감싸 쥐고 눈이 커진 놀란 표정으로 보여주는 자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s3",
    file: "bull_ep6_s3.png",
    first: false,
    clause:
      `장면 3 (오프닝): 황소가 정면을 보며 한 손으로 위를 가리키고 다른 ` +
      `손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s4",
    file: "bull_ep6_s4.png",
    first: false,
    clause:
      `장면 4 (상황1): 황소 옆 바닥에 세운 보드(바닥 거치)에 '배당 기준일 ` +
      `9/30'이 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 ` +
      `자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s5",
    file: "bull_ep6_s5.png",
    first: false,
    clause:
      `장면 5 (상황2): 황소가 '9/28까지 매수'라고 크게 적힌 카드를 두 ` +
      `손으로 감싸 쥐고 진지하고 다급한 표정으로 보여주는 자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s6",
    file: "bull_ep6_s6.png",
    first: false,
    clause:
      `장면 6 (상황3): 황소가 '9/29 배당락일'이라고 크게 적힌 카드를 한 ` +
      `손으로 감싸 쥐고, 다른 빈 손 검지를 세워 설명하는 자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s7",
    file: "bull_ep6_s7.png",
    first: false,
    clause:
      `장면 7 (핵심질문+즉답): 황소가 '정규배당 + 특별배당'이라고 크게 ` +
      `적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손 검지를 세워 확신에 찬 ` +
      `표정을 짓는 자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s8",
    file: "bull_ep6_s8.png",
    first: false,
    clause:
      `장면 8 (근거1-규모): 황소가 '2.45조 원 → 30조 원'이라고 화살표와 ` +
      `함께 크게 적힌 카드를 두 손으로 감싸 쥐고 놀란 표정으로 보여주는 ` +
      `자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s9",
    file: "bull_ep6_s9.png",
    first: false,
    clause:
      `장면 9 (근거1-배경): 황소 옆 바닥에 세운 보드(바닥 거치)에 '주주환원 ` +
      `90~110조 원'이 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 ` +
      `설명하는 자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s10",
    file: "bull_ep6_s10.png",
    first: false,
    clause:
      `장면 10 (근거2-원천): 황소가 'AI 메모리 호황 → 현금 증가'라고 ` +
      `화살표와 함께 크게 적힌 카드를 두 손으로 감싸 쥐고 설명하는 자세. ` +
      `${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s11",
    file: "bull_ep6_s11.png",
    first: false,
    clause:
      `장면 11 (근거2-수치): 황소가 'HBM4 매출 3배↑'라고 크게 적힌 카드를 ` +
      `한 손으로 감싸 쥐고, 다른 빈 손 검지를 세워 강조하는 자세. ` +
      `${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s12",
    file: "bull_ep6_s12.png",
    first: false,
    clause:
      `장면 12 (근거2-의미): 황소가 앞 장면과 같은 'HBM4 매출 3배↑' 카드를 ` +
      `그대로 감싸 쥔 채, 다른 빈 손으로 카드를 톡톡 짚으며 확신에 찬 ` +
      `표정으로 고개를 끄덕이는 자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s13",
    file: "bull_ep6_s13.png",
    first: false,
    clause:
      `장면 13 (근거3-체감): 황소가 '주당 약 4,500원 / 1000주 = 약 450만 ` +
      `원'이라고 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 밝은 ` +
      `표정으로 보여주는 자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s14",
    file: "bull_ep6_s14.png",
    first: false,
    clause:
      `장면 14 (균형1): 황소가 '배당락 → 이론상 주가 조정'이라고 크게 ` +
      `적힌 카드를 두 손으로 감싸 쥐고 신중하고 진지한 표정으로 보여주는 ` +
      `자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s15",
    file: "bull_ep6_s15.png",
    first: false,
    clause:
      `장면 15 (균형2): 황소가 '최종 확정은 10월 말'이라고 크게 적힌 ` +
      `카드를 한 손으로 감싸 쥐고 차분하고 신중한 표정으로 보여주는 자세. ` +
      `${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s16",
    file: "bull_ep6_s16.png",
    first: false,
    clause:
      `장면 16 (요약): 황소가 '오늘 = 마지막 매수 기회'라고 크게 적힌 ` +
      `카드를 두 손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세. ` +
      `${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s17",
    file: "bull_ep6_s17.png",
    first: false,
    clause:
      `장면 17 (체크리스트): 황소가 '체크 ① 오늘 장 마감 전 매수 ② 10월 ` +
      `말 확정 배당금'이라고 두 줄로 크게 적힌 카드를 한 손으로 감싸 쥐고, ` +
      `다른 빈 손으로 손가락 두 개를 세워 보이는 자세. ${BULL_EP6_BG}`,
  },
  {
    id: "bull_ep6_s18",
    file: "bull_ep6_s18.png",
    first: false,
    clause:
      `장면 18 (당부+CTA 마무리): 황소가 확신에 찬 표정으로 살짝 웃으며 ` +
      `한 손을 가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 ` +
      `없이 빈 손. ${BULL_EP6_BG}`,
  },
];

// 황소특보 7편(국내 바이오사 FDA 승인 상한가) — 1~4편과 동일한 증권사
// 트레이딩 라운지 배경 재사용(같은 채널·캐릭터 연속성 유지).
const BULL_EP7_BG = BULL_EP4_BG;
const POSES_BULL_EP7_16SCENE = [
  {
    id: "bull_ep7_s1",
    file: "bull_ep7_s1.png",
    first: true,
    clause:
      `장면 1 (훅): 황소가 궁금하다는 표정으로 큰 물음표가 그려진 카드를 ` +
      `한 손으로 감싸 쥐고 보여주는 자세. 다른 손은 허리에. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s2",
    file: "bull_ep7_s2.png",
    first: false,
    clause:
      `장면 2 (훅 판돈): 황소가 '오늘 +29.95%'라고 크게 적힌 카드를 두 ` +
      `손으로 감싸 쥐고 눈이 커진 놀란 표정으로 보여주는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s3",
    file: "bull_ep7_s3.png",
    first: false,
    clause:
      `장면 3 (오프닝): 황소가 정면을 보며 한 손으로 위를 가리키고 다른 ` +
      `손은 허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s4",
    file: "bull_ep7_s4.png",
    first: false,
    clause:
      `장면 4 (상황1): 황소 옆 바닥에 세운 보드(바닥 거치)에 'FDA 승인'` +
      `이라고 크게 적혀 있고 승인 도장 아이콘이 그려져 있으며, 황소가 빈 ` +
      `손으로 보드를 가리키며 설명하는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s5",
    file: "bull_ep7_s5.png",
    first: false,
    clause:
      `장면 5 (상황2): 황소가 '국내 최초 사례'라고 크게 적힌 카드를 두 ` +
      `손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s6",
    file: "bull_ep7_s6.png",
    first: false,
    clause:
      `장면 6 (상황3): 황소가 '계열 바이오주 동반 상한가'라고 크게 적힌 ` +
      `카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 상승 화살표를 그리듯 ` +
      `가리키는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s7",
    file: "bull_ep7_s7.png",
    first: false,
    clause:
      `장면 7 (핵심질문+즉답): 황소가 '신약 하나 = 회사 운명'이라고 크게 ` +
      `적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손 검지를 세워 확신에 찬 ` +
      `표정을 짓는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s8",
    file: "bull_ep7_s8.png",
    first: false,
    clause:
      `장면 8 (근거1-승인내용): 황소가 '4분기 미국 출시 예정'이라고 크게 ` +
      `적힌 카드를 두 손으로 감싸 쥐고 설명하는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s9",
    file: "bull_ep7_s9.png",
    first: false,
    clause:
      `장면 9 (근거1-한계): 황소 옆 바닥에 세운 보드(바닥 거치)에 '대상 ` +
      `환자 제한적'이라고 크게 적혀 있고, 황소가 빈 손으로 보드를 ` +
      `가리키며 신중한 표정을 짓는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s10",
    file: "bull_ep7_s10.png",
    first: false,
    clause:
      `장면 10 (근거2-이력): 황소가 '7월 → 하한가'라고 크게 적힌 카드를 ` +
      `한 손으로 감싸 쥐고, 다른 빈 손으로 하락 화살표를 그리듯 가리키며 ` +
      `진지한 표정을 짓는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s11",
    file: "bull_ep7_s11.png",
    first: false,
    clause:
      `장면 11 (근거2-의미): 황소가 앞 장면과 같은 하락 화살표 카드를 ` +
      `그대로 감싸 쥔 채, 다른 빈 손으로 카드를 톡톡 짚으며 신중하게 ` +
      `고개를 끄덕이는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s12",
    file: "bull_ep7_s12.png",
    first: false,
    clause:
      `장면 12 (균형, 매수추천 아님 명시): 황소가 '매수 추천 아님'이라고 ` +
      `크게 적힌 카드를 두 손으로 감싸 쥐고 단호하고 신중한 표정으로 ` +
      `보여주는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s13",
    file: "bull_ep7_s13.png",
    first: false,
    clause:
      `장면 13 (요약): 황소가 'FDA 승인 = 상한가, 그만큼 변동성도'라고 ` +
      `크게 적힌 카드를 두 손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 ` +
      `자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s14",
    file: "bull_ep7_s14.png",
    first: false,
    clause:
      `장면 14 (체크리스트): 황소가 '체크 ① 상업화 진행상황 ② 계열주 ` +
      `등락률'이라고 두 줄로 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 ` +
      `빈 손으로 손가락 두 개를 세워 보이는 자세. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s15",
    file: "bull_ep7_s15.png",
    first: false,
    clause:
      `장면 15 (당부): 황소가 확신에 찬 표정으로 살짝 웃으며 한 손을 ` +
      `가볍게 흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 ` +
      `손. ${BULL_EP7_BG}`,
  },
  {
    id: "bull_ep7_s16",
    file: "bull_ep7_s16.png",
    first: false,
    clause:
      `장면 16 (댓글 유도 마무리): 황소가 밝은 미소로 한 손을 가볍게 ` +
      `흔들고 다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손. ` +
      `${BULL_EP7_BG}`,
  },
];

// 황소특보 8편(미국 태양광 최저수입가격 랠리) — 앞선 편과 동일한 증권사
// 트레이딩 라운지 배경 재사용. 카드·보드 글자는 크고 짧게(줄당 12자 이내),
// 소품은 감싸 쥐거나 바닥 거치, 동작은 빈 손에만.
const BULL_EP8_BG = BULL_EP4_BG;
const POSES_BULL_EP8_16SCENE = [
  {
    id: "bull_ep8_s1",
    file: "bull_ep8_s1.png",
    first: true,
    clause:
      `장면 1 (훅): 황소가 궁금하다는 표정으로 '삼성전자 -5%'와 '태양광 +14%'` +
      `라고 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s2",
    file: "bull_ep8_s2.png",
    first: false,
    clause:
      `장면 2 (훅 판돈): 황소가 '이틀 새 +21%'라고 크게 적힌 카드를 두 손으로 ` +
      `감싸 쥐고 눈이 커진 놀란 표정으로 보여주는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s3",
    file: "bull_ep8_s3.png",
    first: false,
    clause:
      `장면 3 (오프닝): 황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 ` +
      `허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s4",
    file: "bull_ep8_s4.png",
    first: false,
    clause:
      `장면 4 (상황): 황소 옆 바닥에 세운 보드(바닥 거치)에 '대장주 +14.21%'` +
      `와 '폴리실리콘 +10.92%'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 ` +
      `보드를 가리키며 설명하는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s5",
    file: "bull_ep8_s5.png",
    first: false,
    clause:
      `장면 5 (핵심질문+즉답): 황소가 '미국 규제 시행 기대'가 두 줄로 크게 ` +
      `적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손 검지를 세워 확신에 찬 ` +
      `표정을 짓는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s6",
    file: "bull_ep8_s6.png",
    first: false,
    clause:
      `장면 6 (개념): 황소 옆 바닥에 세운 보드(바닥 거치)에 '수입 태양광 ` +
      `최저가'와 '0.38달러'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 ` +
      `보드를 톡톡 짚으며 차분히 설명하는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s7",
    file: "bull_ep8_s7.png",
    first: false,
    clause:
      `장면 7 (2차 질문): 황소가 '8월 규제인데 왜 28일?'이 두 줄로 크게 적힌 ` +
      `카드를 한 손으로 감싸 쥐고 고개를 갸웃하며 궁금한 표정을 짓는 ` +
      `자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s8",
    file: "bull_ep8_s8.png",
    first: false,
    clause:
      `장면 8 (근거1-미중 회담): 황소가 '미중 회담 완화는 제외'가 두 줄로 크게 ` +
      `적힌 카드를 두 손으로 감싸 쥐고 설명하는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s9",
    file: "bull_ep8_s9.png",
    first: false,
    clause:
      `장면 9 (근거2-가격): 황소 옆 바닥에 세운 보드(바닥 거치)에 '모듈 가격 ` +
      `+41%'와 '최저가와 같아짐'이 두 줄로 크게 적혀 있고, 황소가 빈 손으로 ` +
      `상승 화살표를 그리듯 보드를 가리키는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s10",
    file: "bull_ep8_s10.png",
    first: false,
    clause:
      `장면 10 (근거3-한국 업체): 황소가 '미국 현지 생산'과 '중국 밖 공급망'이 ` +
      `두 줄로 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 손가락 ` +
      `두 개를 세워 보이는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s11",
    file: "bull_ep8_s11.png",
    first: false,
    clause:
      `장면 11 (균형): 황소가 '기대 먼저 반영 되돌림 주의'가 두 줄로 크게 적힌 ` +
      `카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 카드를 톡톡 짚으며 신중하게 ` +
      `고개를 끄덕이는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s12",
    file: "bull_ep8_s12.png",
    first: false,
    clause:
      `장면 12 (엔딩1 통찰): 황소가 '실적이 아니라 시행 기대'가 두 줄로 크게 ` +
      `적힌 카드를 두 손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 ` +
      `자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s13",
    file: "bull_ep8_s13.png",
    first: false,
    clause:
      `장면 13 (엔딩2 프레임): 황소 옆 바닥에 세운 보드(바닥 거치)에 '발표', ` +
      `'기대', '시행', '실적' 네 단어가 화살표로 이어진 큰 네 칸으로 크게 ` +
      `적혀 있고 두 번째 '기대' 칸만 강조되어 있으며, 황소가 빈 손으로 ` +
      `'기대' 칸을 가리키는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s14",
    file: "bull_ep8_s14.png",
    first: false,
    clause:
      `장면 14 (엔딩3 체크): 황소가 '체크', '① 12월 4일 시행', '② 0.38달러 위'가 ` +
      `세 줄로 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 손가락 ` +
      `두 개를 세워 보이는 자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s15",
    file: "bull_ep8_s15.png",
    first: false,
    clause:
      `장면 15 (엔딩4 이득): 황소가 '이유를 알면 신호가 읽힌다'가 두 줄로 크게 ` +
      `적힌 카드를 두 손으로 감싸 쥐고 따뜻하고 차분한 미소로 보여주는 ` +
      `자세. ${BULL_EP8_BG}`,
  },
  {
    id: "bull_ep8_s16",
    file: "bull_ep8_s16.png",
    first: false,
    clause:
      `장면 16 (엔딩5 약속+댓글): 황소가 밝은 미소로 한 손을 가볍게 흔들고 ` +
      `다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손. ${BULL_EP8_BG}`,
  },
];

// 황소특보 9편(오픈AI 신모델 출시 취소 × 마이크론 실적 D-1) — 8편과 동일한 증권사
// 트레이딩 라운지 배경. 카드·보드 글자는 크고 짧게(줄당 12자 이내), 소품은
// 감싸 쥐거나 바닥 거치, 동작은 빈 손에만(§0-1).
const BULL_EP9_BG =
  `${BULL_EP4_BG} 구도 규칙: 캐릭터와 카드·보드·손 전체가 화면 좌우 가장자리에서 최소 ` +
  `8% 안쪽에 완전히 들어오게 하고(가장자리에 닿거나 잘리면 안 됨), 캐릭터와 소품 ` +
  `묶음을 화면 중앙에 배치한다. 카드·보드의 글자는 화면 가로의 절반 가까이 차지할 ` +
  `만큼 크게 쓴다.`;
const POSES_BULL_EP9_16SCENE = [
  {
    id: "bull_ep9_s1",
    file: "bull_ep9_s1.png",
    first: true,
    clause:
      `장면 1 (훅): 황소가 궁금하다는 표정으로 '오픈AI 출시 취소'와 '마이크론 500억 달러'` +
      `가 두 줄로 크게 적힌 카드를 두 손으로 감싸 쥐고 보여주는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s2",
    file: "bull_ep9_s2.png",
    first: false,
    clause:
      `장면 2 (훅 판돈): 황소가 '10월 1일'과 '새벽 5시 30분'이 두 줄로 크게 적힌 카드를 ` +
      `두 손으로 감싸 쥐고 눈이 커진 긴장한 표정으로 보여주는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s3",
    file: "bull_ep9_s3.png",
    first: false,
    clause:
      `장면 3 (오프닝): 황소가 정면을 보며 한 손으로 위를 가리키고 다른 손은 ` +
      `허리에 얹은 채 밝고 명랑하게 웃는 포즈, 소품 없음. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s4",
    file: "bull_ep9_s4.png",
    first: false,
    clause:
      `장면 4 (상황): 황소 옆 바닥에 세운 보드(바닥 거치)에 'GPT-6.1 아스트라'와 ` +
      `'출시 취소'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 가리키며 ` +
      `설명하는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s5",
    file: "bull_ep9_s5.png",
    first: false,
    clause:
      `장면 5 (핵심질문+즉답): 황소가 '답은'과 '계약 장부'가 두 줄로 크게 적힌 카드를 ` +
      `한 손으로 감싸 쥐고, 다른 빈 손 검지를 세워 확신에 찬 표정을 짓는 ` +
      `자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s6",
    file: "bull_ep9_s6.png",
    first: false,
    clause:
      `장면 6 (개념-장기계약): 황소 옆 바닥에 세운 보드(바닥 거치)에 '5년 장기계약'과 ` +
      `'1000억 달러'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 보드를 톡톡 짚으며 ` +
      `차분히 설명하는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s7",
    file: "bull_ep9_s7.png",
    first: false,
    clause:
      `장면 7 (개념-HBM): 황소 옆 바닥에 세운 보드(바닥 거치)에 'HBM 웨이퍼'와 ` +
      `'D램의 3배'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 손가락 세 개를 ` +
      `펴 보이며 설명하는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s8",
    file: "bull_ep9_s8.png",
    first: false,
    clause:
      `장면 8 (한국 연결): 황소가 '마이크론 먼저'와 '삼성·SK 잣대'가 두 줄로 크게 적힌 ` +
      `카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 앞을 가리키며 확신에 찬 표정을 ` +
      `짓는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s9",
    file: "bull_ep9_s9.png",
    first: false,
    clause:
      `장면 9 (균형): 황소가 '계약도 재협상'과 '가능성 주의'가 두 줄로 크게 적힌 카드를 ` +
      `한 손으로 감싸 쥐고, 다른 빈 손으로 카드를 톡톡 짚으며 신중하게 고개를 ` +
      `끄덕이는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s10",
    file: "bull_ep9_s10.png",
    first: false,
    clause:
      `장면 10 (반전-환율): 황소 옆 바닥에 세운 보드(바닥 거치)에 '환율 -11%'와 ` +
      `'2분기 말 대비'가 두 줄로 크게 적혀 있고, 황소가 빈 손으로 아래로 향하는 ` +
      `화살표를 그리듯 보드를 가리키는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s11",
    file: "bull_ep9_s11.png",
    first: false,
    clause:
      `장면 11 (환율 숫자): 황소가 '삼성전자 104조'와 'SK하이닉스 70조'가 두 줄로 크게 ` +
      `적힌 카드를 두 손으로 감싸 쥐고 신중하고 진지한 표정으로 보여주는 ` +
      `자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s12",
    file: "bull_ep9_s12.png",
    first: false,
    clause:
      `장면 12 (엔딩1 통찰): 황소가 '수요가 계약으로'와 '잠겨 있는가'가 두 줄로 크게 ` +
      `적힌 카드를 두 손으로 감싸 쥐고 확신에 찬 표정으로 보여주는 ` +
      `자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s13",
    file: "bull_ep9_s13.png",
    first: false,
    clause:
      `장면 13 (엔딩2 프레임): 황소 옆 바닥에 세운 보드(바닥 거치)에 '달러 숫자', ` +
      `'다음 전망', '환율' 세 단어가 위에서 아래로 화살표로 이어진 큰 세 칸으로 크게 ` +
      `적혀 있고, 황소가 빈 손으로 보드를 가리키며 설명하는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s14",
    file: "bull_ep9_s14.png",
    first: false,
    clause:
      `장면 14 (엔딩3 체크): 황소가 '체크', '① 다음 분기 전망', '② 한국은 환율'이 ` +
      `세 줄로 크게 적힌 카드를 한 손으로 감싸 쥐고, 다른 빈 손으로 손가락 ` +
      `두 개를 세워 보이는 자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s15",
    file: "bull_ep9_s15.png",
    first: false,
    clause:
      `장면 15 (엔딩4 이득): 황소가 '순서대로 읽으면'과 '속보에 안 흔들려'가 두 줄로 ` +
      `크게 적힌 카드를 두 손으로 감싸 쥐고 따뜻하고 차분한 미소로 보여주는 ` +
      `자세. ${BULL_EP9_BG}`,
  },
  {
    id: "bull_ep9_s16",
    file: "bull_ep9_s16.png",
    first: false,
    clause:
      `장면 16 (엔딩5 약속+댓글): 황소가 밝은 미소로 한 손을 가볍게 흔들고 ` +
      `다른 손은 자연스럽게 내린 마무리 포즈, 소품 없이 빈 손. ${BULL_EP9_BG}`,
  },
];

// 금박사 전용 클로징(팔로우 유도) — 2026-09-19 Owner 확정: 부엉이의 고정 CTA
// (follow 8초+teaser 8초, 부엉이 캐릭터 등장)를 금박사 편 끝에 그대로 붙이면
// 캐릭터가 갑자기 바뀌어 흐름이 끊긴다는 지적. 금박사는 비정기 게시라 "다음 편
// 예고"도 어색하므로, 다음 편 예고 없이 팔로우 유도만 담은 짧은 전용 클로징을
// 별도로 만든다. 배경은 부엉이 CTA(서재·뉴스룸 톤)와 겹치지 않게 금박사 본편에서
// 쓰지 않은 새 공간으로 잡는다.
const POSES_GEUMBAKSA_CTA_FOLLOW = [
  {
    id: "geumbaksa_cta_follow",
    file: "geumbaksa_cta_follow.png",
    first: true,
    clause:
      "전신이 화면의 약 45~55%만 차지하도록 살짝 뒤로 물러난 미디엄 샷 — 캐릭터가 " +
      "화면을 가득 채우지 않고 배경이 넉넉히 보여야 함. 카메라(시청자)를 정면으로 " +
      "응시하며 한쪽 날개(손)로 하트 모양을 만들거나 손을 흔들며 반기는 자세 — " +
      "활짝 웃는 친근한 표정. 소품 없음. " +
      "배경: 따뜻한 조명의 아늑한 홈스튜디오 느낌 — 부엉이 CTA(서재·뉴스룸)나 " +
      "금박사 본편 9씬 어디에도 쓰이지 않은 새로운 공간. 은은한 파스텔 톤 벽지와 " +
      "작은 화분, 부드러운 조명.",
  },
];

// ── 고정 CTA(채널 유입용) 후보 — 시그니처 배경 2안 비교 ──────────────────────────
//
// 2026-09-17 Owner 결정: 매 편 8번째 장면(채널 소개 + 팔로우 유도)은 내용이
// 사실상 고정이라 매번 새로 생성할 필요가 없다. 최고 퀄리티로 한 번만 만들어
// 모든 편에 재사용하는 "고정 CTA 클립"을 채택한다. 이 배열은 그 시그니처
// 배경을 정하기 위한 비교용 2안이며, 확정되면 하나만 남기고 나머지는 삭제한다.
//
// 위 3가지 모바일 검수 원칙(프레임 점유율 45~55%, 시그니처 배경, 정면 응시하며
// 설명하는 동작)을 전부 반영한 참고 구현이기도 하다 — 다음 편 포즈를 새로 쓸 때
// 이 배열의 clause 문체를 참고할 것.
const POSES_OWL_CTA_SIGNATURE_BG_COMPARE = [
  {
    id: "owl_cta_bg_studio",
    file: "owl_cta_bg_studio.png",
    first: true,
    clause:
      "전신이 화면의 약 45~55%만 차지하도록 살짝 뒤로 물러난 미디엄 샷 — 캐릭터가 " +
      "화면을 가득 채우지 않고 배경이 넉넉히 보여야 함. 카메라(시청자)를 정면으로 " +
      "응시하며 한쪽 날개(손)를 살짝 펼쳐 반기듯, 설명하듯 내미는 자세 — 진지하되 " +
      "친근한 표정, 크게 웃지 않되 딱딱하지 않음. 소품 없음. " +
      "배경: 서재·방송국 스튜디오 느낌 — 뒤쪽에 책장(빈 책등, 텍스트 없음)과 " +
      "따뜻한 조명, 은은한 스튜디오 조명 장비 실루엣이 보이는 경제 방송 진행자 " +
      "같은 공간. 색감은 짙은 우드톤과 앰버 조명.",
  },
  {
    id: "owl_cta_bg_newsroom",
    file: "owl_cta_bg_newsroom.png",
    first: false,
    clause:
      "전신이 화면의 약 45~55%만 차지하도록 살짝 뒤로 물러난 미디엄 샷 — 캐릭터가 " +
      "화면을 가득 채우지 않고 배경이 넉넉히 보여야 함. 카메라(시청자)를 정면으로 " +
      "응시하며 한쪽 날개(손)를 살짝 펼쳐 반기듯, 설명하듯 내미는 자세 — 진지하되 " +
      "친근한 표정, 크게 웃지 않되 딱딱하지 않음. 소품 없음. " +
      "배경: 현대적인 오피스·뉴스룸 느낌 — 유리벽 너머 흐릿한 모니터/차트 실루엣 " +
      "(숫자·텍스트 없음), 깔끔한 화이트·네이비 톤 인테리어. 트렌디하고 신뢰감 있는 " +
      "경제 매체 스튜디오 같은 공간.",
  },
  // 3안: Owner 방향(2026-09-17) — 1안(서재)의 소품 구성은 마음에 들지만 앤티크한
  // 앰버 톤이 너무 올드해 보이고, 2안(뉴스룸)의 차갑고 트렌디한 톤이 더 낫다는
  // 피드백. "서재 소품 + 뉴스룸 톤"을 합친 버전 — 여기까지는 확정.
  {
    id: "owl_cta_bg_studio_edgy",
    file: "owl_cta_bg_studio_edgy.png",
    first: true,
    clause:
      "전신이 화면의 약 45~55%만 차지하도록 살짝 뒤로 물러난 미디엄 샷 — 캐릭터가 " +
      "화면을 가득 채우지 않고 배경이 넉넉히 보여야 함. 카메라(시청자)를 정면으로 " +
      "응시하며 한쪽 날개(손)를 살짝 펼쳐 반기듯, 설명하듯 내미는 자세 — 진지하되 " +
      "친근한 표정, 크게 웃지 않되 딱딱하지 않음. 소품 없음. " +
      "배경: 서재 겸 방송 스튜디오 — 뒤쪽에 책장(빈 책등, 텍스트 없음), 작은 지구본, " +
      "간단한 트로피 오브제, 벽에 걸린 세계지도 형태의 차트 패널(숫자·텍스트 없음)이 " +
      "있는 구성은 유지하되, 톤은 따뜻한 앰버·우드가 아니라 차갑고 세련된 " +
      "네이비·화이트·차콜 톤으로. 조명은 은은한 LED 스트립 라이트(네이비 또는 " +
      "시안 색조)와 깔끔한 화이트 스팟 조명 위주 — 앤티크한 느낌을 완전히 배제하고 " +
      "모던하고 트렌디하며 엣지 있는 뉴스룸 분위기로.",
  },
  // 4안(최종): 위 3안을 "고정 CTA는 모든 편에 어디에 붙여도 자연스러워야 하고,
  // 팔로우 유도에 최적화돼야 한다"는 기준으로 다시 다듬은 버전(2026-09-17).
  //   - 배경: 오른쪽의 구체적인 뉴스 데스크/의자를 빼서 특정 세트장처럼 보이지
  //     않게 하고, 서재 소품(책장·지구본·트로피·세계지도 차트)과 네이비·화이트
  //     LED 톤은 유지하되 더 심플하고 배경으로서 물러나도록 정리한다. 매 편
  //     주제가 다른 콘텐츠 장면들과 이어붙였을 때 "이 장면만 세트장이 다르다"는
  //     이질감이 없어야 한다.
  //   - 동작: 실제 SNS CTA에서 가장 효과적인 제스처인 "검지로 화면 아래(팔로우
  //     버튼이 있는 위치)를 가리키는" 동작으로 교체 — 단순히 손을 내미는
  //     동작보다 훨씬 명확한 행동 유도가 된다.
  // 6안(참조 이미지 첨부 방식, 2026-09-17): 첨부한 기준 이미지 덕분에 캐릭터
  // 색감·눈매·비율은 확보됐다(Owner 확인). 남은 과제는 표정·동작·프레임 비율 —
  // Owner 지시: "표정, 검지, 제스처, 프레임은 자유롭게 바꿔도 되지만 캐릭터
  // 자체는 반드시 기준 이미지와 같아야 한다." 참조 이미지가 실제로 붙어있는
  // 상태이므로 "첨부한 이미지 속 캐릭터"를 명시적으로 지칭해 그 외형은 고정하고,
  // 표정·동작·구도만 자유도를 준다.
  {
    id: "owl_cta_bg_final",
    file: "owl_cta_bg_final.png",
    // first:false — IDENTITY 전문(웃는 표정 절대 금지 등 강한 부정 지시 포함)
    // 대신 짧은 SAME_CHARACTER_RULE 만 붙인다. 캐릭터 고정은 이제 텍스트가
    // 아니라 첨부한 참조 이미지가 담당하므로, 길고 상충하는 텍스트 규칙을
    // 반복할 필요가 없다(2026-09-17).
    first: false,
    clause:
      "지금 첨부한 참조 이미지 속 부엉이 캐릭터와 얼굴형, 눈매, 눈동자 색과 " +
      "크기, 깃털 색감(진한 시나몬 브라운과 크림색의 뚜렷한 대비), 부리 모양, " +
      "몸 비율을 정확히 동일하게 유지해줘 — 이 캐릭터 외형은 절대 바꾸지 마. " +
      "옷차림(차콜 조끼, 버건디 넥타이와 포켓치프, 이마의 선글라스)도 그대로. " +
      "그 위에서 이번 장면만 다음을 새로 연출해줘: " +
      "구도는 뉴스 방송의 풀샷(full shot) 카메라 워크처럼 캐릭터 뒤 배경 " +
      "공간(책장, 지구본, 트로피, 세계지도 패널, 뉴스 데스크)이 넉넉하고 " +
      "또렷하게 다 보이는 거리에서 촬영해줘 — 카메라 거리 자체는 방금 이 " +
      "구도를 그대로 유지해. 그 안에서 캐릭터의 세로 길이(정수리부터 발끝까지)만 " +
      "이미지 전체 세로 길이의 약 50~60%를 차지하도록 캐릭터를 조금 더 크게 " +
      "그려줘 — 정수리 위로 약간의 여백은 남기되 너무 작지 않게, 발밑 바닥도 " +
      "적당히 보이는 균형 잡힌 비율로. 캐릭터가 화면을 꽉 채우면 안 되지만, " +
      "너무 멀리 있어서 작아 보여도 안 돼 — 배경 소품들이 잘 보이면서도 " +
      "캐릭터가 장면의 주인공으로 확실히 눈에 띄어야 해. 카메라(시청자)를 " +
      "정면으로 응시하며 한쪽 날개(손)의 " +
      "검지를 곧게 펴서 화면 아래쪽을 향해 확신에 찬 자세로 가리키는 동작을 " +
      "취해줘. 표정만은 이 장면에 한해 눈이 둥글게 부드럽게 휘어지고 부리 " +
      "양옆이 위로 올라간 환하고 다정한 미소로 바꿔줘 — 다른 장면들의 날카로운 " +
      "무표정과 다르게, 시청자를 반갑게 맞이하는 인상. 소품 없음. " +
      "배경: 서재 겸 방송 스튜디오 — 뒤쪽에 책장(빈 책등, 텍스트 없음), 작은 " +
      "지구본, 간단한 트로피 오브제, 벽에 걸린 세계지도 형태의 차트 패널(숫자· " +
      "텍스트 없음)이 있는 구성. 톤은 차갑고 세련된 네이비·화이트·차콜 톤. " +
      "조명은 은은한 LED 스트립 라이트(네이비 또는 시안 색조)와 깔끔한 화이트 " +
      "스팟 조명 위주 — 앤티크한 느낌 없이 모던하고 트렌디하며 엣지 있는 뉴스룸 " +
      "분위기로.",
  },
];

// CTA 밝은 톤 리뉴얼 2장(2026-09-18 Owner 확정). 참조 이미지는 기존
// owl_cta_signature.png(캐릭터 정체성 기준) 그대로 첨부하고, 톤·구도만
// 새로 지시한다 — owl_cta_bg_final과 같은 "참조 이미지 첨부 방식"(6안)을
// 따른다. 두 장 다 배경 소품(책장·지구본·트로피·세계지도)과 캐릭터는
// 동일하게 유지해 세계관을 통일하되, 구도와 톤 디테일을 달리해 화면
// 전환감을 준다.
// 1~2차 시도(2026-09-18) 모두 실패 — 손짓은 팔을 늘어뜨린 정도로만, 측면
// 구도는 거의 반영되지 않고 정면샷만 반복 생성됨. owl3dv5 참조 이미지의
// "정면 응시 + 양 날개 자연스럽게 늘어뜨림" 자세가 매우 강하게 고정되어
// 있어(캐릭터 정체성 고정 목적으로 원래 그렇게 설계됨), 상대적/서술적
// 지시로는 그 기본 자세를 깨지 못하는 것으로 보인다. 3차 시도는 자세를
// "이 부분만 다르게" 요청하는 대신, 최종 결과 이미지를 프레임 단위로
// 지정하듯 훨씬 더 과장되고 구체적인 물리적 묘사로 강제한다.
const POSES_OWL_CTA_BRIGHT_V2 = [
  {
    id: "owl_cta_bright_follow",
    file: "owl_cta_bright_follow.png",
    first: false,
    clause:
      "지금 첨부한 참조 이미지 속 부엉이 캐릭터와 얼굴형, 눈매, 눈동자 색과 " +
      "크기, 깃털 색감, 부리 모양, 몸 비율을 정확히 동일하게 유지해줘 — 이 " +
      "캐릭터 외형은 절대 바꾸지 마. 옷차림(차콜 조끼, 버건디 넥타이와 " +
      "포켓치프, 이마의 선글라스)도 그대로. " +
      "포즈만은 참조 이미지와 완전히 다르게 새로 그려줘 — 참조 이미지처럼 " +
      "양 날개를 몸통 옆에 가만히 늘어뜨린 자세는 이번 장면에서 절대 쓰지 " +
      "마. 이 장면의 유일한 목적은 '아래를 가리키는 손짓'이며, 이 동작이 " +
      "이미지에서 가장 먼저 눈에 띄어야 한다. 다음 자세를 과장될 정도로 " +
      "명확하게 그려줘: 오른쪽 날개(팔) 전체를 어깨 관절에서부터 몸통 " +
      "바깥쪽 대각선 아래 방향으로 완전히 곧게 뻗어라 — 팔이 구부러지지 " +
      "않고 일직선이며, 몸통에서 45도 이상 벌어져 캐릭터 몸 옆 빈 공간을 " +
      "가로지른다. 팔 끝(날개깃 부분)은 이미지 하단 가장자리에서 " +
      "10~15% 지점까지 내려가 거의 프레임을 벗어날 듯한 위치에 있어야 " +
      "한다. 그 팔 끝에서 뻗어나온 손은 다른 손가락은 전부 접고 검지 " +
      "하나만 길게 곧게 편 '가리키는 손' 모양이며, 그 손가락이 화면 " +
      "아래쪽 정중앙을 향해 겨누듯 가리킨다. 이 자세는 사람이 바닥에 " +
      "놓인 물건을 손가락으로 지목할 때의 팔 각도와 동일해야 한다 — " +
      "손을 허벅지나 허리 높이에 살짝 내리는 정도로는 안 되고, 반드시 " +
      "팔 전체가 몸통과 뚜렷한 각도를 이루며 아래로 뻗어나가야 한다. " +
      "이 뻗은 팔 때문에 캐릭터의 실루엣이 확연히 좌우 비대칭이 되어야 " +
      "한다. 왼쪽 날개는 반대로 허리 옆에 짧게 접어 붙임. 상체는 정면을 " +
      "향하고 얼굴도 카메라를 정면으로 응시. 표정은 눈이 둥글게 부드럽게 " +
      "휘어지고 부리 양옆이 위로 올라간 " +
      "환하고 다정한 미소로. 구도는 캐릭터의 세로 길이가 이미지 전체 세로 " +
      "길이의 약 50~60%를 차지하는 정면 풀샷, 배경 공간(책장, 지구본, " +
      "트로피, 세계지도 패널)이 넉넉하고 또렷하게 다 보이는 거리. 소품 없음. " +
      "배경: 서재 겸 방송 스튜디오 — 뒤쪽에 책장(빈 책등, 텍스트 없음), 작은 " +
      "지구본, 트로피 오브제, 벽에 걸린 세계지도 형태의 차트 패널(숫자·텍스트 " +
      "없음). 톤은 기존의 어둡고 차가운 네이비 야간 톤이 아니라, 낮의 밝고 " +
      "화사한 톤으로 완전히 바꿔줘 — 큰 창이나 채광창으로 부드러운 자연광이 " +
      "들어오는 느낌, 전체적으로 화이트·라이트베이지·소프트골드 색조. 밝지만 " +
      "여전히 세련되고 신뢰감 있는 경제 매체 스튜디오 분위기(과하게 파스텔 " +
      "톤이거나 유치해 보이면 안 됨).",
  },
  {
    id: "owl_cta_bright_teaser",
    file: "owl_cta_bright_teaser.png",
    first: false,
    clause:
      "지금 첨부한 참조 이미지 속 부엉이 캐릭터와 얼굴형, 눈매, 눈동자 색과 " +
      "크기, 깃털 색감, 부리 모양, 몸 비율을 정확히 동일하게 유지해줘 — 이 " +
      "캐릭터 외형은 절대 바꾸지 마. 옷차림도 그대로. " +
      "카메라 각도만은 참조 이미지와 완전히 다르게 새로 그려줘 — 참조 " +
      "이미지처럼 캐릭터가 카메라를 똑바로 마주보는 정면 구도는 이번 " +
      "장면에서 절대 쓰지 마. 대신: 카메라를 캐릭터의 옆으로 크게 돌려서, " +
      "캐릭터의 몸통 옆면(측면)이 화면의 절반 이상을 차지하도록 90도에 " +
      "가까운 옆모습(profile view)으로 그려줘 — 캐릭터가 마치 옆에 있는 " +
      "무언가를 바라보며 서 있는 것처럼, 몸통·부리·발이 전부 화면을 " +
      "기준으로 왼쪽 또는 오른쪽을 향하게 한다(정면을 향한 신체 부위가 " +
      "있으면 안 됨). 얼굴만 살짝(약 15도 정도) 카메라 쪽으로 틀어 한쪽 " +
      "눈이 보이는 정도로만 시청자와 눈을 마주친다. 캐릭터는 화면 중앙에서 " +
      "한쪽으로 치우쳐 서고, 반대편 배경(세계지도 패널 또는 창밖 도시 " +
      "풍경)이 넓게 드러나 보이게 한다. 표정은 부드러운 미소를 유지하되 " +
      "살짝 상기되고 기대에 찬 느낌. 양쪽 날개는 차분하게 몸 옆에 붙여 " +
      "두고, 가리키는 손짓은 하지 않음. 소품 없음. " +
      "배경: 앞 장면과 동일한 밝은 서재 겸 뉴스룸(책장, 지구본, 트로피, " +
      "세계지도 패널, 화이트·라이트베이지·소프트골드 톤, 부드러운 자연광).",
  },
];

// candidate-02 8장 중 5~8번이 이전 대화 종료(전송 버튼 실패)로 미완성 상태였을 때
// 이어가기 위한 배열. 이전 대화 맥락은 재사용할 수 없으므로(브라우저 탭이 이미
// 닫힘) 새 대화를 열되, 5번을 first:true로 바꿔 canonical IDENTITY 전문을 다시
// 포함시킨다 — PA-5AE의 session reentry proof(새 세션에서도 IDENTITY 텍스트만으로
// 동일 캐릭터 재현 가능)가 이미 이 방식의 안전성을 검증했다.
const POSES_CANDIDATE_02_8SCENE_RESUME = [
  {
    id: "c02_s5_twist",
    file: "c02_s5_twist.png",
    first: true,
    clause:
      "장면 5 (핵심 반전): 검지를 들고 확신에 찬 표정으로 강조하는 자세. 다른 손에는 " +
      "두 개의 빈 게이지/막대 모양 소품(높이가 다른 두 개)을 나란히 들거나 옆에 배치 — " +
      "숫자나 텍스트 없이 형태로만 '변화'를 암시. 배경: 단순한 단색 배경.",
  },
  {
    id: "c02_s6_impact",
    file: "c02_s6_impact.png",
    first: false,
    clause:
      "장면 6 (영향): 양손에 각각 다른 모양의 빈 카드(하나는 은행 아이콘, 하나는 신용카드 " +
      "아이콘)를 들고 서로 다르다는 듯 비교하는 자세. 배경: 단순한 실내 배경.",
  },
  {
    id: "c02_s7_action",
    file: "c02_s7_action.png",
    first: false,
    clause:
      "장면 7 (실행): 수첩과 돋보기를 양손에 들고 차분히 확인하는 자세, 안내하듯 살짝 " +
      "웃는 표정. 배경: 밝은 톤의 집/카페 배경.",
  },
  {
    id: "c02_s8_closing",
    file: "c02_s8_closing.png",
    first: false,
    clause:
      "장면 8 (마무리/고지): 정면을 보고 차렷 자세로 돌아와 은은한 미소를 띤 평온한 " +
      "얼굴. 소품 없음. 배경: 밝은 단색 마무리 배경.",
  },
];

// 스타일 비교용 단일 장면. candidate-02 Scene 1(hook)과 동일한 포즈/소품을 써야
// 기존 2D 산출물과 1:1로 비교된다. 파일명에 캐릭터 키를 넣어 스타일별 결과가
// 같은 out-dir에서 서로 덮어써지지 않게 한다.
// 돋보기는 탐정 캐릭터 전용 소품이라 부엉이/금고/비버/거북이에는 맞지 않는다.
// 주인공 후보를 비교할 때는 소품이 아니라 캐릭터 자체를 봐야 하므로, hook의 의미
// (스마트폰을 보다가 의아해함)만 남기고 탐정 소품은 뺀다.
const STYLE_PROBE_S1_CLAUSE =
  "포즈: 스마트폰 화면(빈 화면)을 보며 한쪽 눈썹을 살짝 올리고 의아해하는 표정. " +
  "반대편 손은 자연스럽게 내리고 있음. 정면 구도. 단순한 배경. " +
  "스마트폰 화면에는 어떠한 숫자나 텍스트도 표시하지 않음 — 완전히 비워둠.";

const POSES_STYLE_PROBE_S1 = [
  {
    id: `style_s1_${CHARACTER}`,
    file: `style_s1_${CHARACTER}.png`,
    first: true,
    clause: CHAR_DEF.poseOverride || STYLE_PROBE_S1_CLAUSE,
  },
];

// 감정 폭 검증용 2장. 1번째는 hook(v5 poseOverride, IDENTITY 전체 포함)으로 시작해
// 캐릭터를 고정하고, 이어서 가장 대비되는 두 감정(우려/확신)을 순서대로 요청한다.
// coin3dv1처럼 "친근하고 웃는" 정체성인 캐릭터는 부엉이의 "웃지 않음" 규칙을
// 그대로 쓰면 정체성이 깨진다(친근함이 사라짐). 캐릭터별로 감정 표현 시 유지할
// 인상이 다르므로, CHAR_DEF에 emotionProbeStyle이 있으면 그걸 쓰고 없으면
// 기존 부엉이 문구(날카롭고 진지함 유지)로 fallback한다.
const EMOTION_KEEP_STYLE =
  CHAR_DEF.emotionProbeStyle ??
  "날카롭고 진지한 인상은 유지한 채 걱정만 더해진 느낌";
const EMOTION_TWIST_STYLE =
  CHAR_DEF.emotionTwistStyle ??
  "표정은 웃지 않고 입을 다문 채 확신에 찬 날카로운 눈빛으로 정면을 응시 — 미소나 능글맞은 표정 절대 금지";

const POSES_OWL_EMOTION_PROBE = [
  {
    id: `owlemo_1_hook_${CHARACTER}`,
    file: `owlemo_1_hook_${CHARACTER}.png`,
    first: true,
    clause: CHAR_DEF.poseOverride || STYLE_PROBE_S1_CLAUSE,
  },
  {
    id: `owlemo_2_loss_aversion_${CHARACTER}`,
    file: `owlemo_2_loss_aversion_${CHARACTER}.png`,
    first: false,
    clause:
      "장면 (손실 회피): 신용카드 모양 소품(무늬 없는 빈 카드)을 손에 들고 눈썹 " +
      `안쪽을 살짝 찌푸리며 걱정스럽게 내려다보는 표정 — ${EMOTION_KEEP_STYLE}. ` +
      "배경: 집 책상, 조명 약간 어둡게.",
  },
  {
    id: `owlemo_3_twist_${CHARACTER}`,
    file: `owlemo_3_twist_${CHARACTER}.png`,
    first: false,
    clause:
      "장면 (핵심 반전): 한쪽 손으로 검지를 들어 강조하는 자세. 다른 손에는 " +
      "두 개의 빈 게이지/막대 모양 소품(높이가 다른 두 개)을 나란히 들거나 옆에 " +
      `배치 — 숫자나 텍스트 없이 형태로만 '변화'를 암시. ${EMOTION_TWIST_STYLE}. ` +
      "배경: 단순한 단색 배경.",
  },
];

const POSES_DETECTIVE = [
  {
    id: "01_anchor_magnifier",
    file: "01_anchor_magnifier.png",
    first: true,
    clause:
      "포즈: 돋보기를 눈앞에 들고 무언가를 자세히 들여다보는 모습. 돋보기 렌즈 너머로 한쪽 눈이 크게 확대되어 보이고, 호기심 가득한 표정.",
  },
  {
    id: "02_shocked_discovery",
    file: "02_shocked_discovery.png",
    first: false,
    clause:
      "포즈: 무언가 충격적인 단서를 발견하고 깜짝 놀란 표정. 돋보기를 든 손은 그대로 들고, 다른 손은 입을 가리며 눈을 크게 뜨고 있어.",
  },
  {
    id: "03_taking_notes",
    file: "03_taking_notes.png",
    first: false,
    clause:
      "포즈: 작은 수첩과 연필을 들고 단서를 적으며 골똘히 생각하는 모습. 눈썹을 살짝 찡그리고 진지한 표정.",
  },
  {
    id: "04_pointing_answer",
    file: "04_pointing_answer.png",
    first: false,
    clause:
      "포즈: 사건을 해결한 듯 자신만만한 표정으로 한 손 검지를 위로 치켜들며 정답을 발표하는 모습. 눈은 확신에 차 있고 입가에 미소.",
  },
];

// 의상 비교 전용 축약 세트: 캐릭터 정체성은 이미 검증됐으므로, 의상만 볼 때는
// 대표 2컷(기본 서기 + 놀람)만 뽑아 생성 시간과 비용을 줄인다.
// --full-poses 를 주면 축약하지 않고 전체 포즈를 생성한다(의상 확정 후 최종 시트용).
const POSES_OUTFIT_COMPARE = [POSES_DETECTIVE[0], POSES_DETECTIVE[1]];

// 역할이 있는 캐릭터는 그 역할에 맞는 포즈로 검증해야 실제 사용 가능성을 볼 수 있다.
const OUTFIT_VARIANTS = new Set(["vest", "overall"]);
// 단일 장면 재생성: 해당 장면만 뽑아 first:true로 바꾼다. 후속 장면 clause는
// IDENTITY 없이 "포즈만" 전제하므로, 재생성 시에는 IDENTITY_FOR_PROMPT가 자동으로
// 앞에 붙도록(buildPrompt의 pose.first 분기) 여기서 first만 true로 바꿔주면 된다.
const POSES_OWL_8SCENE_SINGLE = OWL_8SCENE_ONLY
  ? (() => {
      const target = POSES_OWL_8SCENE.find(
        (p) => p.id === OWL_8SCENE_ONLY || p.id === `owl_s${OWL_8SCENE_ONLY}` || p.id.startsWith(`owl_s${OWL_8SCENE_ONLY}_`),
      );
      if (!target) {
        console.error(
          `ABORT: --owl-8scene-only "${OWL_8SCENE_ONLY}" 에 해당하는 장면을 찾을 수 없습니다. ` +
            `사용 가능 id: ${POSES_OWL_8SCENE.map((p) => p.id).join(", ")}`,
        );
        process.exit(1);
      }
      return [{ ...target, first: true }];
    })()
  : null;

const POSES_OWL_EP2_8SCENE_SINGLE = OWL_EP2_8SCENE_ONLY
  ? (() => {
      const target = POSES_OWL_EP2_8SCENE.find(
        (p) =>
          p.id === OWL_EP2_8SCENE_ONLY ||
          p.id === `owl_ep2_s${OWL_EP2_8SCENE_ONLY}` ||
          p.id.startsWith(`owl_ep2_s${OWL_EP2_8SCENE_ONLY}_`),
      );
      if (!target) {
        console.error(
          `ABORT: --owl-ep2-8scene-only "${OWL_EP2_8SCENE_ONLY}" 에 해당하는 장면을 찾을 수 없습니다. ` +
            `사용 가능 id: ${POSES_OWL_EP2_8SCENE.map((p) => p.id).join(", ")}`,
        );
        process.exit(1);
      }
      return [{ ...target, first: true }];
    })()
  : null;

// --owl-ep3-11scene-only는 단일 번호("3")뿐 아니라 콤마로 구분한 여러 번호도
// 받는다("3,5,6,7,8,9,10,11"). 자동화가 중간에 끊긴 뒤 재실행할 때, 남은 장면을
// 전부 하나의 프로세스(=하나의 ChatGPT 대화 세션) 안에서 순차로 이어서 생성해야
// 캐릭터 일관성이 유지된다(런북 원칙: 참조 이미지 첨부 + 세션 연속성을 함께
// 쓴다). 장면을 하나씩 별도 프로세스로 재실행하면 매번 새 대화가 열려 사실상
// reference-free 방식이 되어버리고, 실제로 3편 씬2·3에서 참조 이미지가
// 그대로 복제 반환되는 문제로 나타났다(2026-09-17). 목록의 첫 장면만
// first:true(IDENTITY 전문 + 참조 이미지 첨부)로 시작하고, 나머지는 같은
// 대화 안에서 "포즈만" 이어서 요청한다.
const POSES_OWL_EP3_11SCENE_SINGLE = OWL_EP3_11SCENE_ONLY
  ? (() => {
      const requested = OWL_EP3_11SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP3_11SCENE.find(
          (p) => p.id === id || p.id === `owl_ep3_s${id}` || p.id.startsWith(`owl_ep3_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep3-11scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP3_11SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 4편도 3편과 동일한 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep4-9scene-only
// "1,2" 처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// Owner 2026-09-18: "한 대화창에 2개씩만 씬 생성하고 새 대화창으로" — 이 옵션을
// 그 운용 방식대로 매번 2개씩 잘라서 호출하면 된다(예: "1,2" → "3,4" → ...).
const POSES_OWL_EP4_9SCENE_SINGLE = OWL_EP4_9SCENE_ONLY
  ? (() => {
      const requested = OWL_EP4_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP4_9SCENE.find(
          (p) => p.id === id || p.id === `owl_ep4_s${id}` || p.id.startsWith(`owl_ep4_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep4-9scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP4_9SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 5편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep5-10scene-only "1,2"
// 처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
const POSES_OWL_EP5_10SCENE_SINGLE = OWL_EP5_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP5_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP5_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep5_s${id}` || p.id.startsWith(`owl_ep5_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep5-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP5_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 6편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep6-9scene-only "1,2"
// 처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
const POSES_OWL_EP6_9SCENE_SINGLE = OWL_EP6_9SCENE_ONLY
  ? (() => {
      const requested = OWL_EP6_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP6_9SCENE.find(
          (p) => p.id === id || p.id === `owl_ep6_s${id}` || p.id.startsWith(`owl_ep6_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep6-9scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP6_9SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 7편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep7-9scene-only "1,2"
// 처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
const POSES_OWL_EP7_9SCENE_SINGLE = OWL_EP7_9SCENE_ONLY
  ? (() => {
      const requested = OWL_EP7_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP7_9SCENE.find(
          (p) => p.id === id || p.id === `owl_ep7_s${id}` || p.id.startsWith(`owl_ep7_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep7-9scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP7_9SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 8편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep8-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep8_s1 ~ s9) 배열 순번으로 매칭한다.
const POSES_OWL_EP8_10SCENE_SINGLE = OWL_EP8_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP8_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP8_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep8_s${id}` || p.id.startsWith(`owl_ep8_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep8-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP8_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 9편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep9-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep9_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_OWL_EP9_10SCENE_SINGLE = OWL_EP9_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP9_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP9_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep9_s${id}` || p.id.startsWith(`owl_ep9_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep9-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP9_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 10편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep10-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep10_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_OWL_EP10_10SCENE_SINGLE = OWL_EP10_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP10_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP10_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep10_s${id}` || p.id.startsWith(`owl_ep10_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep10-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP10_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 11편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep11-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
const POSES_OWL_EP11_10SCENE_SINGLE = OWL_EP11_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP11_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP11_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep11_s${id}` || p.id.startsWith(`owl_ep11_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep11-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP11_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 12편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep12-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep12_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_OWL_EP12_10SCENE_SINGLE = OWL_EP12_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP12_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP12_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep12_s${id}` || p.id.startsWith(`owl_ep12_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep12-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP12_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 13편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep13-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep13_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_OWL_EP13_10SCENE_SINGLE = OWL_EP13_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP13_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP13_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep13_s${id}` || p.id.startsWith(`owl_ep13_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep13-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP13_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 14편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep14-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep14_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_OWL_EP14_10SCENE_SINGLE = OWL_EP14_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP14_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP14_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep14_s${id}` || p.id.startsWith(`owl_ep14_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep14-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP14_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 15편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep15-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep15_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_OWL_EP15_10SCENE_SINGLE = OWL_EP15_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP15_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP15_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep15_s${id}` || p.id.startsWith(`owl_ep15_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep15-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP15_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 16편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep16-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep16_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_OWL_EP16_10SCENE_SINGLE = OWL_EP16_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP16_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP16_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep16_s${id}` || p.id.startsWith(`owl_ep16_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep16-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP16_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 17편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) — --owl-ep17-10scene-only
// "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화 세션 안에서 순차 생성한다.
// id/file이 scene 순번과 정확히 일치하므로(owl_ep17_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_OWL_EP17_10SCENE_SINGLE = OWL_EP17_10SCENE_ONLY
  ? (() => {
      const requested = OWL_EP17_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_EP17_10SCENE.find(
          (p) => p.id === id || p.id === `owl_ep17_s${id}` || p.id.startsWith(`owl_ep17_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-ep17-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_EP17_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// v2 재제작 14편 — --owl-v2-ep14-5scene-only "1,8" 처럼 장면 번호로 선택.
const POSES_OWL_V2_EP14_5SCENE_SINGLE = OWL_V2_EP14_5SCENE_ONLY
  ? (() => {
      const requested = OWL_V2_EP14_5SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_V2_EP14_5SCENE.find(
          (p) => p.id === id || p.id.startsWith(`owl_v2_ep14_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-v2-ep14-5scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_V2_EP14_5SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// v2 재제작 15편 — --owl-v2-ep15-9scene-only "1,9" 처럼 장면 번호로 선택.
const POSES_OWL_V2_EP15_9SCENE_SINGLE = OWL_V2_EP15_9SCENE_ONLY
  ? (() => {
      const requested = OWL_V2_EP15_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_V2_EP15_9SCENE.find(
          (p) => p.id === id || p.id.startsWith(`owl_v2_ep15_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-v2-ep15-9scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_V2_EP15_9SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// v2 재제작 16편 — --owl-v2-ep16-10scene-only "1,8" 처럼 장면 번호로 선택.
const POSES_OWL_V2_EP16_10SCENE_SINGLE = OWL_V2_EP16_10SCENE_ONLY
  ? (() => {
      const requested = OWL_V2_EP16_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_V2_EP16_10SCENE.find(
          (p) => p.id === id || p.id.startsWith(`owl_v2_ep16_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-v2-ep16-10scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_V2_EP16_10SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// v2 재제작 17편 — --owl-v2-ep17-8scene-only "1,8" 처럼 장면 번호로 선택.
const POSES_OWL_V2_EP17_8SCENE_SINGLE = OWL_V2_EP17_8SCENE_ONLY
  ? (() => {
      const requested = OWL_V2_EP17_8SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_V2_EP17_8SCENE.find(
          (p) => p.id === id || p.id.startsWith(`owl_v2_ep17_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-v2-ep17-8scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_V2_EP17_8SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 신규 18편 — --owl-v2-ep18-15scene-only "1,8" 처럼 장면 번호로 선택.
const POSES_OWL_V2_EP18_15SCENE_SINGLE = OWL_V2_EP18_15SCENE_ONLY
  ? (() => {
      const requested = OWL_V2_EP18_15SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_V2_EP18_15SCENE.find(
          (p) => p.id === id || p.id.startsWith(`owl_v2_ep18_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-v2-ep18-15scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_V2_EP18_15SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// v2 재제작 13편 — --owl-v2-ep13-5scene-only "1,10" 처럼 장면 번호로 선택.
const POSES_OWL_V2_EP13_5SCENE_SINGLE = OWL_V2_EP13_5SCENE_ONLY
  ? (() => {
      const requested = OWL_V2_EP13_5SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_V2_EP13_5SCENE.find(
          (p) => p.id === id || p.id.startsWith(`owl_v2_ep13_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-v2-ep13-5scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_V2_EP13_5SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// v2 재제작 12편 — --owl-v2-ep12-4scene-only "1,8" 처럼 장면 번호로 선택.
const POSES_OWL_V2_EP12_4SCENE_SINGLE = OWL_V2_EP12_4SCENE_ONLY
  ? (() => {
      const requested = OWL_V2_EP12_4SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_V2_EP12_4SCENE.find(
          (p) => p.id === id || p.id.startsWith(`owl_v2_ep12_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-v2-ep12-4scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_V2_EP12_4SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// v2 재제작 11편 — --owl-v2-ep11-5scene-only "1,7" 처럼 장면 번호(s 뒤 숫자)로 선택.
const POSES_OWL_V2_EP11_5SCENE_SINGLE = OWL_V2_EP11_5SCENE_ONLY
  ? (() => {
      const requested = OWL_V2_EP11_5SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_V2_EP11_5SCENE.find(
          (p) => p.id === id || p.id.startsWith(`owl_v2_ep11_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-v2-ep11-5scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_V2_EP11_5SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 부엉이 고정 CTA v2도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --owl-cta-fixed-v2-only "1,2"처럼 콤마로 여러 장면을 받아 하나의 대화
// 세션 안에서 순차 생성한다. id/file이 scene 순번과 정확히 일치하므로
// (owl_cta_fixed_v2_s1 ~ s2) 배열 순번으로 매칭한다.
const POSES_OWL_CTA_FIXED_V2_SINGLE = OWL_CTA_FIXED_V2_ONLY
  ? (() => {
      const requested = OWL_CTA_FIXED_V2_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_OWL_CTA_FIXED_V2.find(
          (p) => p.id === id || p.id === `owl_cta_fixed_v2_s${id}` || p.id.startsWith(`owl_cta_fixed_v2_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --owl-cta-fixed-v2-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_OWL_CTA_FIXED_V2.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 1편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep1-9scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다.
const POSES_GEUMBAKSA_EP1_9SCENE_SINGLE = GEUMBAKSA_EP1_9SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP1_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((id) => {
        const target = POSES_GEUMBAKSA_EP1_9SCENE.find(
          (p) => p.id === id || p.id === `geumbaksa_ep1_s${id}` || p.id.startsWith(`geumbaksa_ep1_s${id}_`),
        );
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep1-9scene-only "${id}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `사용 가능 id: ${POSES_GEUMBAKSA_EP1_9SCENE.map((p) => p.id).join(", ")}`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 2편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep2-11scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다. id에 남은 원본 role 이름(s6, s6b, s7...)이
// 조립 스펙의 scene 번호(1~11)와 어긋나므로, 배열 순번(1-based 인덱스)으로
// 매칭한다 — "7"은 항상 POSES_GEUMBAKSA_EP2_11SCENE의 7번째 원소를 가리킨다.
const POSES_GEUMBAKSA_EP2_11SCENE_SINGLE = GEUMBAKSA_EP2_11SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP2_11SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP2_11SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep2-11scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP2_11SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 3편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep3-10scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다. 3편부터 id/file이 이미 scene 순번과
// 정확히 일치하므로(geumbaksa_ep3_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_GEUMBAKSA_EP3_10SCENE_SINGLE = GEUMBAKSA_EP3_10SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP3_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP3_10SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep3-10scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP3_10SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 4편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep4-11scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다. id/file이 scene 순번과 정확히 일치하므로
// (geumbaksa_ep4_s1 ~ s11) 배열 순번으로 매칭한다.
const POSES_GEUMBAKSA_EP4_11SCENE_SINGLE = GEUMBAKSA_EP4_11SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP4_11SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP4_11SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep4-11scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP4_11SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 5편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep5-10scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다. id/file이 scene 순번과 정확히 일치하므로
// (geumbaksa_ep5_s1 ~ s10) 배열 순번으로 매칭한다.
const POSES_GEUMBAKSA_EP5_10SCENE_SINGLE = GEUMBAKSA_EP5_10SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP5_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP5_10SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep5-10scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP5_10SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 7편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep7-11scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다.
const POSES_GEUMBAKSA_EP7_11SCENE_SINGLE = GEUMBAKSA_EP7_11SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP7_11SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP7_11SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep7-11scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP7_11SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 8편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep8-8scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다.
const POSES_GEUMBAKSA_EP8_8SCENE_SINGLE = GEUMBAKSA_EP8_8SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP8_8SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP8_8SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep8-8scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP8_8SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 9편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep9-9scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다.
const POSES_GEUMBAKSA_EP9_9SCENE_SINGLE = GEUMBAKSA_EP9_9SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP9_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP9_9SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep9-9scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP9_9SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 금박사 10편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --geumbaksa-ep10-9scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다.
const POSES_GEUMBAKSA_EP10_9SCENE_SINGLE = GEUMBAKSA_EP10_9SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP10_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP10_9SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep10-9scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP10_9SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// --geumbaksa-ep11-11scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의
// 대화 세션 안에서 순차 생성한다.
const POSES_GEUMBAKSA_EP11_11SCENE_SINGLE = GEUMBAKSA_EP11_11SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP11_11SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP11_11SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep11-11scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP11_11SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

// 황소특보 1편도 동일 원칙(참조 이미지 첨부 + 세션 연속성) —
// --bull-ep1-9scene-only "1,2" 처럼 콤마로 여러 장면을 받아 하나의 대화
// 세션 안에서 순차 생성한다.
const POSES_BULL_EP1_9SCENE_SINGLE = BULL_EP1_9SCENE_ONLY
  ? (() => {
      const requested = BULL_EP1_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP1_9SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep1-9scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP1_9SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_BULL_EP2_9SCENE_SINGLE = BULL_EP2_9SCENE_ONLY
  ? (() => {
      const requested = BULL_EP2_9SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP2_9SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep2-9scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP2_9SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_BULL_EP3_10SCENE_SINGLE = BULL_EP3_10SCENE_ONLY
  ? (() => {
      const requested = BULL_EP3_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP3_10SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep3-10scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP3_10SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_BULL_EP4_14SCENE_SINGLE = BULL_EP4_14SCENE_ONLY
  ? (() => {
      const requested = BULL_EP4_14SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP4_14SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep4-14scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP4_14SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_BULL_EP5_17SCENE_SINGLE = BULL_EP5_17SCENE_ONLY
  ? (() => {
      const requested = BULL_EP5_17SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP5_17SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep5-17scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP5_17SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_BULL_EP6_18SCENE_SINGLE = BULL_EP6_18SCENE_ONLY
  ? (() => {
      const requested = BULL_EP6_18SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP6_18SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep6-18scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP6_18SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_BULL_EP7_16SCENE_SINGLE = BULL_EP7_16SCENE_ONLY
  ? (() => {
      const requested = BULL_EP7_16SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP7_16SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep7-16scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP7_16SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_BULL_EP8_16SCENE_SINGLE = BULL_EP8_16SCENE_ONLY
  ? (() => {
      const requested = BULL_EP8_16SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP8_16SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep8-16scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP8_16SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_BULL_EP9_16SCENE_SINGLE = BULL_EP9_16SCENE_ONLY
  ? (() => {
      const requested = BULL_EP9_16SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_BULL_EP9_16SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --bull-ep9-16scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_BULL_EP9_16SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES_GEUMBAKSA_EP6_10SCENE_SINGLE = GEUMBAKSA_EP6_10SCENE_ONLY
  ? (() => {
      const requested = GEUMBAKSA_EP6_10SCENE_ONLY.split(",").map((s) => s.trim()).filter(Boolean);
      const targets = requested.map((token) => {
        const index = Number.parseInt(token, 10);
        const target = Number.isInteger(index) ? POSES_GEUMBAKSA_EP6_10SCENE[index - 1] : undefined;
        if (!target) {
          console.error(
            `ABORT: --geumbaksa-ep6-10scene-only "${token}" 에 해당하는 장면을 찾을 수 없습니다. ` +
              `1~${POSES_GEUMBAKSA_EP6_10SCENE.length} 사이의 순번을 사용하세요.`,
          );
          process.exit(1);
        }
        return target;
      });
      return targets.map((t, i) => ({ ...t, first: i === 0 }));
    })()
  : null;

const POSES = OWL_8SCENE_ONLY
  ? POSES_OWL_8SCENE_SINGLE
  : OWL_EP2_8SCENE_ONLY
  ? POSES_OWL_EP2_8SCENE_SINGLE
  : OWL_EP3_11SCENE_ONLY
  ? POSES_OWL_EP3_11SCENE_SINGLE
  : OWL_EP4_9SCENE_ONLY
  ? POSES_OWL_EP4_9SCENE_SINGLE
  : OWL_EP5_10SCENE_ONLY
  ? POSES_OWL_EP5_10SCENE_SINGLE
  : OWL_EP6_9SCENE_ONLY
  ? POSES_OWL_EP6_9SCENE_SINGLE
  : OWL_EP7_9SCENE_ONLY
  ? POSES_OWL_EP7_9SCENE_SINGLE
  : OWL_EP8_10SCENE_ONLY
  ? POSES_OWL_EP8_10SCENE_SINGLE
  : OWL_EP9_10SCENE_ONLY
  ? POSES_OWL_EP9_10SCENE_SINGLE
  : OWL_EP10_10SCENE_ONLY
  ? POSES_OWL_EP10_10SCENE_SINGLE
  : OWL_EP11_10SCENE_ONLY
  ? POSES_OWL_EP11_10SCENE_SINGLE
  : OWL_EP12_10SCENE_ONLY
  ? POSES_OWL_EP12_10SCENE_SINGLE
  : OWL_EP13_10SCENE_ONLY
  ? POSES_OWL_EP13_10SCENE_SINGLE
  : OWL_EP14_10SCENE_ONLY
  ? POSES_OWL_EP14_10SCENE_SINGLE
  : OWL_EP15_10SCENE_ONLY
  ? POSES_OWL_EP15_10SCENE_SINGLE
  : OWL_EP16_10SCENE_ONLY
  ? POSES_OWL_EP16_10SCENE_SINGLE
  : OWL_EP17_10SCENE_ONLY
  ? POSES_OWL_EP17_10SCENE_SINGLE
  : OWL_V2_EP11_5SCENE_ONLY
  ? POSES_OWL_V2_EP11_5SCENE_SINGLE
  : OWL_V2_EP12_4SCENE_ONLY
  ? POSES_OWL_V2_EP12_4SCENE_SINGLE
  : OWL_V2_EP13_5SCENE_ONLY
  ? POSES_OWL_V2_EP13_5SCENE_SINGLE
  : OWL_V2_EP14_5SCENE_ONLY
  ? POSES_OWL_V2_EP14_5SCENE_SINGLE
  : OWL_V2_EP15_9SCENE_ONLY
  ? POSES_OWL_V2_EP15_9SCENE_SINGLE
  : OWL_V2_EP16_10SCENE_ONLY
  ? POSES_OWL_V2_EP16_10SCENE_SINGLE
  : OWL_V2_EP17_8SCENE_ONLY
  ? POSES_OWL_V2_EP17_8SCENE_SINGLE
  : OWL_V2_EP18_15SCENE_ONLY
  ? POSES_OWL_V2_EP18_15SCENE_SINGLE
  : OWL_CTA_FIXED_V2_ONLY
  ? POSES_OWL_CTA_FIXED_V2_SINGLE
  : GEUMBAKSA_EP1_9SCENE_ONLY
  ? POSES_GEUMBAKSA_EP1_9SCENE_SINGLE
  : GEUMBAKSA_EP2_11SCENE_ONLY
  ? POSES_GEUMBAKSA_EP2_11SCENE_SINGLE
  : GEUMBAKSA_EP3_10SCENE_ONLY
  ? POSES_GEUMBAKSA_EP3_10SCENE_SINGLE
  : GEUMBAKSA_EP4_11SCENE_ONLY
  ? POSES_GEUMBAKSA_EP4_11SCENE_SINGLE
  : GEUMBAKSA_EP5_10SCENE_ONLY
  ? POSES_GEUMBAKSA_EP5_10SCENE_SINGLE
  : GEUMBAKSA_EP6_10SCENE_ONLY
  ? POSES_GEUMBAKSA_EP6_10SCENE_SINGLE
  : GEUMBAKSA_EP7_11SCENE_ONLY
  ? POSES_GEUMBAKSA_EP7_11SCENE_SINGLE
  : GEUMBAKSA_EP8_8SCENE_ONLY
  ? POSES_GEUMBAKSA_EP8_8SCENE_SINGLE
  : GEUMBAKSA_EP9_9SCENE_ONLY
  ? POSES_GEUMBAKSA_EP9_9SCENE_SINGLE
  : GEUMBAKSA_EP10_9SCENE_ONLY
  ? POSES_GEUMBAKSA_EP10_9SCENE_SINGLE
  : GEUMBAKSA_EP11_11SCENE_ONLY
  ? POSES_GEUMBAKSA_EP11_11SCENE_SINGLE
  : BULL_EP1_9SCENE_ONLY
  ? POSES_BULL_EP1_9SCENE_SINGLE
  : BULL_EP2_9SCENE_ONLY
  ? POSES_BULL_EP2_9SCENE_SINGLE
  : BULL_EP3_10SCENE_ONLY
  ? POSES_BULL_EP3_10SCENE_SINGLE
  : BULL_EP4_14SCENE_ONLY
  ? POSES_BULL_EP4_14SCENE_SINGLE
  : BULL_EP5_17SCENE_ONLY
  ? POSES_BULL_EP5_17SCENE_SINGLE
  : BULL_EP6_18SCENE_ONLY
  ? POSES_BULL_EP6_18SCENE_SINGLE
  : BULL_EP7_16SCENE_ONLY
  ? POSES_BULL_EP7_16SCENE_SINGLE
  : BULL_EP8_16SCENE_ONLY
  ? POSES_BULL_EP8_16SCENE_SINGLE
  : BULL_EP9_16SCENE_ONLY
  ? POSES_BULL_EP9_16SCENE_SINGLE
  : OWL_8SCENE_MODE
  ? POSES_OWL_8SCENE
  : OWL_EP2_8SCENE_MODE
  ? POSES_OWL_EP2_8SCENE
  : OWL_EP3_11SCENE_MODE
  ? POSES_OWL_EP3_11SCENE
  : OWL_EP4_9SCENE_MODE
  ? POSES_OWL_EP4_9SCENE
  : OWL_EP5_10SCENE_MODE
  ? POSES_OWL_EP5_10SCENE
  : OWL_EP6_9SCENE_MODE
  ? POSES_OWL_EP6_9SCENE
  : OWL_EP7_9SCENE_MODE
  ? POSES_OWL_EP7_9SCENE
  : OWL_EP8_10SCENE_MODE
  ? POSES_OWL_EP8_10SCENE
  : OWL_EP9_10SCENE_MODE
  ? POSES_OWL_EP9_10SCENE
  : OWL_EP10_10SCENE_MODE
  ? POSES_OWL_EP10_10SCENE
  : OWL_EP11_10SCENE_MODE
  ? POSES_OWL_EP11_10SCENE
  : OWL_EP12_10SCENE_MODE
  ? POSES_OWL_EP12_10SCENE
  : OWL_EP13_10SCENE_MODE
  ? POSES_OWL_EP13_10SCENE
  : OWL_EP14_10SCENE_MODE
  ? POSES_OWL_EP14_10SCENE
  : OWL_EP15_10SCENE_MODE
  ? POSES_OWL_EP15_10SCENE
  : OWL_EP16_10SCENE_MODE
  ? POSES_OWL_EP16_10SCENE
  : OWL_EP17_10SCENE_MODE
  ? POSES_OWL_EP17_10SCENE
  : OWL_V2_EP11_5SCENE_MODE
  ? POSES_OWL_V2_EP11_5SCENE
  : OWL_V2_EP12_4SCENE_MODE
  ? POSES_OWL_V2_EP12_4SCENE
  : OWL_V2_EP13_5SCENE_MODE
  ? POSES_OWL_V2_EP13_5SCENE
  : OWL_V2_EP14_5SCENE_MODE
  ? POSES_OWL_V2_EP14_5SCENE
  : OWL_V2_EP15_9SCENE_MODE
  ? POSES_OWL_V2_EP15_9SCENE
  : OWL_V2_EP16_10SCENE_MODE
  ? POSES_OWL_V2_EP16_10SCENE
  : OWL_V2_EP17_8SCENE_MODE
  ? POSES_OWL_V2_EP17_8SCENE
  : OWL_V2_EP18_15SCENE_MODE
  ? POSES_OWL_V2_EP18_15SCENE
  : OWL_CTA_FIXED_V2_MODE
  ? POSES_OWL_CTA_FIXED_V2
  : OWL_EP6_OPENING_MODE
  ? POSES_OWL_EP6_OPENING
  : OWL_EP7_OPENING_MODE
  ? POSES_OWL_EP7_OPENING
  : GEUMBAKSA_EP1_9SCENE_MODE
  ? POSES_GEUMBAKSA_EP1_9SCENE
  : GEUMBAKSA_EP2_11SCENE_MODE
  ? POSES_GEUMBAKSA_EP2_11SCENE
  : GEUMBAKSA_EP3_10SCENE_MODE
  ? POSES_GEUMBAKSA_EP3_10SCENE
  : GEUMBAKSA_EP4_11SCENE_MODE
  ? POSES_GEUMBAKSA_EP4_11SCENE
  : GEUMBAKSA_EP5_10SCENE_MODE
  ? POSES_GEUMBAKSA_EP5_10SCENE
  : GEUMBAKSA_EP5_S4_FIX_MODE
  ? POSES_GEUMBAKSA_EP5_S4_FIX
  : GEUMBAKSA_EP6_10SCENE_MODE
  ? POSES_GEUMBAKSA_EP6_10SCENE
  : GEUMBAKSA_EP7_11SCENE_MODE
  ? POSES_GEUMBAKSA_EP7_11SCENE
  : GEUMBAKSA_EP8_8SCENE_MODE
  ? POSES_GEUMBAKSA_EP8_8SCENE
  : GEUMBAKSA_EP9_9SCENE_MODE
  ? POSES_GEUMBAKSA_EP9_9SCENE
  : GEUMBAKSA_EP10_9SCENE_MODE
  ? POSES_GEUMBAKSA_EP10_9SCENE
  : GEUMBAKSA_EP11_11SCENE_MODE
  ? POSES_GEUMBAKSA_EP11_11SCENE
  : BULL_EP1_9SCENE_MODE
  ? POSES_BULL_EP1_9SCENE
  : BULL_EP2_9SCENE_MODE
  ? POSES_BULL_EP2_9SCENE
  : BULL_EP3_10SCENE_MODE
  ? POSES_BULL_EP3_10SCENE
  : BULL_EP4_14SCENE_MODE
  ? POSES_BULL_EP4_14SCENE
  : BULL_EP5_17SCENE_MODE
  ? POSES_BULL_EP5_17SCENE
  : BULL_EP6_18SCENE_MODE
  ? POSES_BULL_EP6_18SCENE
  : BULL_EP7_16SCENE_MODE
  ? POSES_BULL_EP7_16SCENE
  : BULL_EP8_16SCENE_MODE
  ? POSES_BULL_EP8_16SCENE
  : BULL_EP9_16SCENE_MODE
  ? POSES_BULL_EP9_16SCENE
  : BULL_EP1_BG_COMPARE_MODE
  ? POSES_BULL_EP1_BG_COMPARE
  : GEUMBAKSA_CTA_FOLLOW_MODE
  ? POSES_GEUMBAKSA_CTA_FOLLOW
  : OWL_CTA_BG_FINAL_ONLY_MODE
  ? [{ ...POSES_OWL_CTA_SIGNATURE_BG_COMPARE.find((p) => p.id === "owl_cta_bg_final"), first: true }]
  : OWL_CTA_BG_EDGY_ONLY_MODE
  ? [{ ...POSES_OWL_CTA_SIGNATURE_BG_COMPARE.find((p) => p.id === "owl_cta_bg_studio_edgy"), first: true }]
  : OWL_CTA_BG_COMPARE_MODE
  ? POSES_OWL_CTA_SIGNATURE_BG_COMPARE
  : OWL_CTA_BRIGHT_V2_MODE
  ? POSES_OWL_CTA_BRIGHT_V2
  : OWL_CTA_BRIGHT_FOLLOW_ONLY_MODE
  ? [{ ...POSES_OWL_CTA_BRIGHT_V2.find((p) => p.id === "owl_cta_bright_follow"), first: false }]
  : OWL_EMOTION_PROBE_MODE
  ? POSES_OWL_EMOTION_PROBE
  : STYLE_PROBE_S1_MODE
  ? POSES_STYLE_PROBE_S1
  : FRAME_STABILITY_MODE
  ? POSES_FRAME_STABILITY
  : CANDIDATE_02_8SCENE_RESUME_MODE
  ? POSES_CANDIDATE_02_8SCENE_RESUME
  : CANDIDATE_02_8SCENE_MODE
  ? POSES_CANDIDATE_02_8SCENE
  : PA5AE_8SCENE_MODE
  ? POSES_8SCENE_CONTINUITY
  : SCENE_BACKGROUND_MODE
    ? POSES_SCENE_BACKGROUND
    : CHARACTER_SHEET_MODE
      ? POSES_CHARACTER_SHEET
      : OUTFIT_VARIANTS.has(CHARACTER) && !FULL_POSES
        ? POSES_OUTFIT_COMPARE
        : CHARACTER.startsWith("detective") || OUTFIT_VARIANTS.has(CHARACTER)
          ? POSES_DETECTIVE
          : POSES_BASIC;

// 배경이 있는 장면 모드(배경 실장면 검증 또는 PA-5AE 8-Scene)에서는 IDENTITY 의
// "단색 배경" 고정 지시가 장면 배경과 충돌하므로 제거한 버전을 쓴다. 캐릭터 외형
// 문구(옷/비율/색)는 그대로 유지해 정체성을 고정한다.
const USES_VARIED_BACKGROUND =
  SCENE_BACKGROUND_MODE ||
  PA5AE_8SCENE_MODE ||
  CANDIDATE_02_8SCENE_MODE ||
  CANDIDATE_02_8SCENE_RESUME_MODE ||
  OWL_8SCENE_MODE ||
  OWL_8SCENE_ONLY ||
  OWL_EP2_8SCENE_MODE ||
  OWL_EP2_8SCENE_ONLY ||
  OWL_CTA_BG_COMPARE_MODE ||
  OWL_CTA_BG_EDGY_ONLY_MODE ||
  OWL_CTA_BG_FINAL_ONLY_MODE ||
  OWL_CTA_BRIGHT_V2_MODE ||
  OWL_CTA_BRIGHT_FOLLOW_ONLY_MODE ||
  OWL_EMOTION_PROBE_MODE;
// 고정 CTA 시도: IDENTITY 본문의 "웃는 표정 절대 금지" 문구를 치환하는 방식은
// 캐릭터 색감·눈매·비율까지 함께 흔들리는 부작용이 있었다(2026-09-17 실측 —
// Owner 지적: "원래 캐릭터와 좀 달라, 색깔도 연해, 크기도 이상해"). IDENTITY는
// 다른 7개 콘텐츠 장면과 완전히 동일하게 그대로 두어 캐릭터 정체성을 100%
// 고정하고, 표정 예외는 pose clause 안에서만 짧고 명확하게 지시한다.
const IDENTITY_FOR_PROMPT = USES_VARIED_BACKGROUND
  ? IDENTITY.replace(/배경은 아주 단순한 단색 또는 연한 색으로\.\s*/, "")
  : IDENTITY;

// toolMode 가 prompt-routing fallback 이면 (현재 ChatGPT UI 에 이미지 메뉴/칩이
// 없는 경우) 고정 접두사를 붙여 텍스트 응답으로 새지 않게 한다.
// owl3dv5 전용 프레임 비율 기준(2026-09-17 Owner 최종 확정) — 여러 차례 시행
// 착오 끝에 "캐릭터 50~55%, 배경 소품이 넓고 선명하게 보이는" 구도로 확정.
// 이 구도가 반영된 최종 이미지가 OWL3DV5_CANONICAL_REFERENCE 자체이므로,
// 참조 이미지 첨부와 함께 이 문구를 반복해 다음 3편부터도 같은 카메라
// 거리·캐릭터 비율이 기본값이 되게 한다. 포즈 clause 가 이 비율과 다른 값을
// 명시하면 그쪽이 우선한다(고정 CTA처럼 의도적으로 다른 비율이 필요할 수 있음).
const OWL3DV5_FRAME_RATIO_RULE =
  "카메라 구도는 지금 첨부한 참조 이미지와 동일하게 유지해줘 — 캐릭터의 " +
  "세로 길이(정수리부터 발끝까지)가 이미지 전체 세로 길이의 약 50~55%를 " +
  "차지하고, 배경이 넉넉하고 선명하게 보이는 거리감. 캐릭터가 화면을 " +
  "꽉 채우거나 배경이 잘려 보이지 않게 되면 안 돼.";
// bull3dv1도 동일 원칙(2026-09-23) — 부엉박사 프레임 비율 규칙을 그대로
// 가져오되 45~50%로 살짝 더 작게(Owner 지시: "캐릭터가 너무 크게 나온다").
// 이전까지는 이 규칙이 owl3dv5 전용으로만 buildPrompt()에 하드코딩돼 있어
// 황소특보는 매 씬 clause에 손으로 쓴 문구에 의존했고, 그 결과 화면 비율이
// 씬마다 들쭉날쭉했다(캐릭터가 70% 이상 차지) — 근본 수정은 buildPrompt()에서
// 캐릭터 무관하게 이 규칙을 자동 주입하는 것.
// 2026-09-26 재확인(4편 14씬 1차 생성): 이 규칙이 있었는데도 14장 중 9장이
// 캐릭터 얼굴·몸통이 화면의 70~90%를 차지하는 클로즈업으로 나왔다(특히 카드
// 소품을 든 정면 포즈에서 반복). 글 규칙만으로는 카메라 거리가 안정적으로
// 지켜지지 않아, 수치를 낮추고(55~60%→45~50%) "카메라를 뒤로 물러서서
// 전신+배경이 함께 보이게" 식의 직접적인 카메라 동작 지시와, 실패 사례를
// 구체적으로 금지하는 문장을 추가해 강제력을 높였다.
// 2026-09-27 재조정(5편): 45~50%로 낮춘 뒤 Owner가 "캐릭터가 너무 작게
// 나온다"고 재지적 — 4편 1차 생성 때의 반대 방향(70~90% 클로즈업) 문제를
// 잡으려다 과잉 교정됐다. 55~60%로 올리고 "작은 전신 인물" 같은 과도한
// 축소 표현을 빼, 두 실패 사례(너무 큼/너무 작음) 사이 중간값을 노린다.
const BULL3DV1_FRAME_RATIO_RULE =
  "화면 구도(가장 중요한 규칙, 반드시 지킬 것 — 위반 시 재생성 대상): " +
  "정수리부터 발끝까지가 이미지 전체 세로 길이의 55~60%를 차지하도록 " +
  "그려. 캐릭터가 화면 안에서 존재감 있게 보이되, 위로 머리 위 여백과 " +
  "양옆 배경이 자연스럽게 보여야 해. 절대 하지 말 것: 캐릭터 얼굴이나 " +
  "상반신만 클로즈업해서 화면의 80% 이상을 채우는 구도, 반대로 캐릭터가 " +
  "화면 세로의 40% 이하로 작아져 배경 소품에 묻혀 보이는 구도. 캐릭터가 " +
  "화면의 주인공으로 뚜렷하게 보이면서 그 뒤로 트레이딩 라운지 배경이 " +
  "적당히 보여야 정답이다.";

// 10편(국민연금) 이미지 생성 중 발견(2026-09-21): clause에서 명시적으로 지정하지
// 않은 배경 요소(간판, 스크린 문구 등)를 ChatGPT가 기본값으로 영어로 채워 넣는
// 현상 확인("Pension Consultation", "Consultation Desk" 등). 한국 채널(경제
// 번역소) 콘텐츠에 영어 배경 텍스트가 섞이면 부자연스러우므로, 모든 프롬프트에
// 공통 규칙으로 강제한다. clause에서 직접 지정한 한글 문구는 그대로 우선 적용되고,
// 이 규칙은 명시되지 않은 나머지 배경 텍스트에 대한 기본값을 한국어로 고정하는
// 역할이다. 10편부터 적용 — 1~9편(이미 배포/제작 완료분)은 재작업 대상 아님.
//
// ★2026-09-27 수정(5편)★: "영어 단어는 단 하나도 넣지 마"가 너무 절대적이라,
// clause가 명시적으로 지정한 해외 종목명·영문 약어(Arm, AMD, CPU 등)까지
// ChatGPT가 임의로 한글 음차("암", "에이엠디", "씨피유")로 바꿔버리는 사고가
// 확인됐다(5편 s4: "Arm +24%"가 "암 +24%"로 그려짐). "설명에서 지정한 대로"라는
// 문구만으로는 예외를 충분히 강제하지 못해, clause가 원표기 그대로 지정한
// 영문 종목명·약어는 절대 한글로 바꾸지 말라는 문장을 명시적으로 추가한다.
const KOREAN_TEXT_ONLY_RULE =
  "이미지 안에 등장하는 모든 글자(간판, 표지판, 화면 속 문구, 서류, 배지, 안내판 등)는 " +
  "기본적으로 전부 한국어로 표시해줘 — 장면 설명에 없는 배경 요소(스크린 메뉴, " +
  "벽면 문구 등)를 채울 때는 영어 단어나 영어 문장을 넣지 말고 반드시 한국어로만 채워. " +
  "단, 위 장면 설명(카드나 보드에 적을 문구)에서 'Arm', 'AMD', 'CPU', 'DRAM', 'ETF' " +
  "처럼 영문 그대로 적으라고 명시한 종목명·약어는 예외다 — 이런 문구는 절대 " +
  "한글 음차(예: '암', '에이엠디', '씨피유')로 바꾸지 말고, 지정된 영문 철자 그대로 " +
  "정확히 그려. 나머지 모든 글자(숫자·설명·라벨)는 장면 설명에 지정된 대로 한국어로 써.";

// ★ 영상(Veo) 안전 규칙 — 2026-09-21 87씬 전수조사로 확정, 모든 이미지에 강제 주입.
//
// 이 이미지들은 그대로 Veo에 넣어 8~10초 영상으로 변환된다. 전수조사 결과 Veo 실패는
// 영상 프롬프트로 막을 수 없고(텍스트 깨짐은 0.1초 시작 프레임에 이미 확정됨), 막을 수
// 있는 유일한 지점이 이 이미지 생성 단계라는 것이 확인됐다. 상세 근거는
// _ai/CURRENT_STANDARDS.md §0 "★ 영상 생성 절대규칙".
//
//   ① 작은 글씨: 87씬 중 큰 글자 실패 0건, 화면 높이 ~1.5% 이하 소자만 깨짐
//   ② 소품 그립: 감싸쥠/바닥거치 11/11 유지 vs 손끝에 얹기+팔동작 5건 중 4건 사고
//   ③ 빈 면: Veo가 빈 면을 없던 텍스트로 채움("PIXAR", "CREDIT SSOORE",
//      가짜 전화번호 "033-990-5000" 등 — 사실과 다른 정보라 게시 불가 사유)
const VEO_SAFE_IMAGE_RULE =
  "그리고 이 이미지는 이후 영상으로 변환되므로 아래 세 가지를 반드시 지켜줘. " +
  "첫째, 글자는 크고 짧게만 넣어 — 핵심 라벨과 숫자를 큼직하게 쓰고, 작은 글씨로 된 " +
  "설명문·부연 캡션·여러 줄짜리 목록(메뉴 리스트, 표 항목, 그래프 축 라벨, 보드 하단 " +
  "작은 안내문 등)은 아예 넣지 마. 정보가 더 필요해도 작은 글씨를 추가하지 말고 큰 " +
  "글자 라벨로만 표현해. " +
  "둘째, 캐릭터가 소품을 들 때는 손으로 확실히 감싸 쥐거나 몸통에 밀착시켜 들고, " +
  "그게 어려운 큰 소품(보드, 안내판, 차트)은 아예 바닥이나 이젤에 세워둬 — 손가락 " +
  "끝으로만 옆면을 받치거나 손바닥 위에 얹어놓은 불안정한 자세로는 그리지 마. " +
  "셋째, 화면에 크고 아무것도 없는 빈 면(캐릭터 몸통의 민무늬 클로즈업, 텅 빈 흰 보드나 " +
  "빈 계기판 등)을 남기지 마 — 빈 면이 크면 영상 변환 중 엉뚱한 글자가 저절로 생겨난다.";

function buildPrompt(pose, toolMode) {
  const sameRule = USES_VARIED_BACKGROUND
    ? `${SAME_CHARACTER_RULE} 배경은 장면마다 달라도 되지만, 캐릭터의 옷차림과 소품은 ` +
      "배경에 가려지거나 바뀌지 않고 그대로 온전히 보여야 해."
    : SAME_CHARACTER_RULE;
  const frameRule =
    CHARACTER === "owl3dv5" ? ` ${OWL3DV5_FRAME_RATIO_RULE}` :
    CHARACTER === "bull3dv1" ? ` ${BULL3DV1_FRAME_RATIO_RULE}` : "";
  const body = pose.first
    ? `${IDENTITY_FOR_PROMPT}${frameRule} ${pose.clause} ${KOREAN_TEXT_ONLY_RULE} ${VEO_SAFE_IMAGE_RULE}`
    : `${sameRule}${frameRule} ${pose.clause} ${KOREAN_TEXT_ONLY_RULE} ${VEO_SAFE_IMAGE_RULE}`;
  return toolMode === IMAGE_TOOL_PROMPT_ROUTING_FALLBACK
    ? `${CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX} ${body}`
    : body;
}

// 이미지 도구 활성화는 core 의 activateImageTool 을 그대로 쓴다.
// core 는 (1) 이미 활성 칩 확인 (2) 홈 직접 버튼 (3) plus 메뉴 (4) 메뉴가 사라진
// 현재 UI 를 위한 prompt-routing fallback 까지 이미 처리한다. 로컬 사본을 두면
// UI 변경 때마다 낡은 셀렉터로 멈추므로(이 probe 의 첫 실행이 정확히 그랬다)
// 반드시 core 버전을 호출한다.

async function saveGeneratedImage(page, destPath, baselineCids) {
  const imgs = await collectGeneratedImages(page);
  // cid가 없는 이미지(로컬 첨부 미리보기 등)는 fresh 후보에서 제외한다 —
  // generateTurn의 완료 판정과 동일한 기준을 써야 두 곳이 서로 다른 이미지를
  // "새 것"이라 판단해 어긋나는 일이 없다(2026-09-17). 2026-09-26: cid가
  // 항상 null인 blob URL 체계에서는 src를 fallback 식별자로 쓴다(generateTurn
  // 쪽 baselineCids/fresh 판정과 동일한 기준으로 맞춤).
  const fresh = imgs.filter((x) => x.gen && (x.cid || x.src) && !baselineCids.has(x.cid || x.src));
  // 해상도가 아니라 DOM 순서(documentIndex)로 가장 나중에 등장한 이미지를
  // 고른다 — 참조로 첨부한 이미지가 생성 결과보다 해상도가 큰 경우가 있어
  // 크기 기준 정렬은 신뢰할 수 없다(2026-09-17 실측: owl_cta_bg_final 저장
  // 결과가 계속 첨부 참조 이미지 그대로였음). 대화 흐름상 항상 새 응답이 더
  // 아래(더 큰 documentIndex)에 렌더링된다.
  const cand = (fresh.length > 0 ? fresh : imgs.filter((x) => x.gen))
    .sort((a, b) => b.documentIndex - a.documentIndex)[0];

  if (cand && cand.src) {
    const buf = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u);
        const ab = await r.arrayBuffer();
        return Array.from(new Uint8Array(ab));
      } catch { return null; }
    }, cand.src).catch(() => null);
    if (buf && buf.length > 10000) {
      fs.writeFileSync(destPath, Buffer.from(buf));
      return { ok: true, method: "estuary_fetch", w: cand.w, h: cand.h, bytes: buf.length };
    }
  }

  const convUrl = page.url();
  const intercepted = await interceptRecover(page, convUrl, log);
  let biggest = null;
  for (const [, body] of intercepted) {
    if (!biggest || body.length > biggest.length) biggest = body;
  }
  if (biggest && biggest.length > 10000) {
    fs.writeFileSync(destPath, Buffer.from(biggest));
    return { ok: true, method: "intercept_reload", bytes: biggest.length };
  }
  return { ok: false, method: "none" };
}

// 같은 page(같은 대화) 안에서 한 턴 보내고 이미지 회수
// 오리지널 확정 캐릭터 이미지를 매 요청마다 첨부해 색감·눈매·비율 편차를
// 원천 차단한다(2026-09-17 Owner 결정 — 세션 연속성만으로는 부족했다: 대화가
// 끊기면 텍스트 설명만으로 캐릭터가 미묘하게 달라지는 현상이 실제로 발생).
// 이 상수는 --character owl3dv5 로 실행할 때만 쓰인다.
// v3-final(2026-09-17 Owner 확정) — 발목 링 추가 + 휴대폰 제거로 특정 포즈에
// 얽매이지 않는 중립 기준 이미지. 임시 폴더가 아니라 저장소 assets/ 아래
// 영구 보관해 재부팅·정리로 유실되지 않게 한다.
const OWL3DV5_CANONICAL_REFERENCE = path.join(REPO_ROOT, "assets/character-references/owl3dv5-canonical-reference.png");
// coin3dv1(금박사)도 동일 원칙 적용(2026-09-19) — Owner가 확정한 canonical
// reference(coin3dv1-canonical-reference.png)가 이미 assets/에 있는데도
// 첨부 로직이 owl3dv5 전용으로만 하드코딩돼 있어 텍스트 설명만으로 생성되고
// 있었다. 부엉이와 동일하게 매 요청마다 첨부해 편차를 막는다.
const COIN3DV1_CANONICAL_REFERENCE = path.join(REPO_ROOT, "assets/character-references/coin3dv1-canonical-reference.png");
// bull3dv1(황소특보)도 동일 원칙(2026-09-23) — 8차 반복 끝에 확정된
// canonical reference를 매 요청마다 첨부해 색감·비율 편차를 막는다.
const BULL3DV1_CANONICAL_REFERENCE = path.join(REPO_ROOT, "assets/character-references/bull3dv1-canonical-reference.png");

/** 여러 셀렉터 후보 중 실제로 화면에 보이는 첫 번째 요소를 반환(없으면 null). */
async function firstVisibleLocatorLocal(candidates) {
  for (const candidate of candidates) {
    const count = await candidate.count();
    for (let i = 0; i < count; i += 1) {
      const item = candidate.nth(i);
      if (await item.isVisible({ timeout: 350 }).catch(() => false)) return item;
    }
  }
  return null;
}

async function attachReferenceImage(page, refPath) {
  // 2026-09-26 확인: 플러스 버튼 testid/aria-label이 바뀌었다(OpenAI 쪽 변경,
  // "파일 등 추가"가 현재 라벨). 여러 후보를 순서대로 시도한다.
  const plusBtn = await firstVisibleLocatorLocal([
    page.locator('[data-testid="composer-plus-btn"]'),
    page.locator('button[aria-label="파일 등 추가"]'),
    page.locator('button[aria-label="파일 추가 및 기타"]'),
    page.locator('button[aria-label*="Attach" i]'),
    page.locator('button[aria-label*="Add" i]'),
  ]);
  if (!plusBtn) { warn("참조 이미지 첨부 실패: 플러스 버튼(파일 등 추가) 없음"); return false; }
  await plusBtn.click();
  await page.waitForTimeout(500);

  const uploadItem = await firstVisibleLocatorLocal([
    page.getByText("사진 및 파일 추가", { exact: false }),
    page.getByText("사진 및 파일", { exact: false }),
    page.getByText("파일 업로드", { exact: false }),
    page.getByText("Add photos & files", { exact: false }),
    page.getByText("Upload from computer", { exact: false }),
  ]);
  if (!uploadItem) {
    warn("참조 이미지 첨부 실패: '사진 및 파일 추가' 메뉴 항목 없음");
    await page.keyboard.press("Escape").catch(() => {});
    return false;
  }

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 6000 }).catch(() => null),
    uploadItem.click(),
  ]);
  if (!fileChooser) { warn("참조 이미지 첨부 실패: filechooser 안 열림"); return false; }
  await fileChooser.setFiles(refPath);
  await page.waitForTimeout(1500);
  await dismissDuplicateFileModal(page);
  log(`참조 이미지 첨부 완료: ${refPath}`);
  return true;
}

// 같은 참조 이미지를 매 턴 반복 첨부하면(캐릭터 일관성 유지를 위해 의도적으로
// 그렇게 한다) ChatGPT가 몇 번째 반복부터 "이미 업로드한 파일" 확인 모달
// (id="modal-duplicate-file")을 띄운다. 이 모달이 화면을 가리면 뒤의
// #prompt-textarea 클릭이 30초 타임아웃으로 실패해 자동화 전체가 멈춘다
// (2026-09-17, 3편 씬4/씬10에서 재현). 버튼 텍스트를 모델 업데이트로 예측할
// 수 없으므로 "계속/업로드/확인"류 버튼을 먼저 시도하고, 없으면 Escape로
// 모달만 닫는다(모달이 없으면 즉시 반환 — 매 첨부 후 호출해도 비용이 없다).
async function dismissDuplicateFileModal(page) {
  const modal = page.locator("#modal-duplicate-file");
  if (await modal.count() === 0) return;
  const visible = await modal.isVisible().catch(() => false);
  if (!visible) return;
  warn("중복 파일 확인 모달 감지 — 닫는 중");
  const confirmBtn = modal.getByRole("button", { name: /계속|업로드|확인|Continue|Upload|Confirm/i }).first();
  if ((await confirmBtn.count()) > 0) {
    await confirmBtn.click().catch(() => {});
  } else {
    await page.keyboard.press("Escape").catch(() => {});
  }
  await page.waitForTimeout(500);
}

async function generateTurn(page, pose, toolMode, savedHashes) {
  log(`=== ${pose.id} 생성 시작 ===`);
  const destPath = path.join(OUT_DIR_ABS, pose.file);

  const ta = page.locator(PROMPT_COMPOSER_SELECTOR).first();
  const taVisible = await ta.isVisible({ timeout: 8000 }).catch(() => false);
  if (!taVisible) throw new Error("composer: prompt composer not visible");

  if (CHARACTER === "owl3dv5" && fs.existsSync(OWL3DV5_CANONICAL_REFERENCE)) {
    await attachReferenceImage(page, OWL3DV5_CANONICAL_REFERENCE);
  }
  if (CHARACTER === "coin3dv1" && fs.existsSync(COIN3DV1_CANONICAL_REFERENCE)) {
    await attachReferenceImage(page, COIN3DV1_CANONICAL_REFERENCE);
  }
  if (CHARACTER === "bull3dv1" && fs.existsSync(BULL3DV1_CANONICAL_REFERENCE)) {
    await attachReferenceImage(page, BULL3DV1_CANONICAL_REFERENCE);
  }

  // baseline은 반드시 참조 이미지 첨부 "이후"에 찍는다 — 첨부한 시점보다 먼저
  // 찍으면 그 참조 이미지 자체가 "새로 생성된 이미지"로 오판된다(2026-09-17
  // 실측: owl_cta_bg_final 저장 결과가 매번 첨부한 참조 이미지 그대로였음).
  // 2026-09-26 확인: 결과 이미지가 이제 blob: URL로 렌더링되고 여기엔 ?id=
  // 쿼리스트링이 없어 x.cid가 항상 null이다. cid 전용 식별자 대신 매 요청마다
  // 고유한 blob URL(src) 자체를 식별자로 쓴다(cid가 있으면 그것도 함께 기록해
  // 옛 URL 체계로 되돌아가도 계속 동작하게 한다).
  const baseImgs = await collectGeneratedImages(page);
  const baselineCids = new Set(baseImgs.map((x) => x.cid || x.src).filter(Boolean));

  await typePrompt(page, buildPrompt(pose, toolMode), log);
  const sendOk = await checkSendEnabled(page);
  if (!sendOk) throw new Error("send_enabled: send button not found/disabled");

  // 2026-09-26: 전송 버튼 셀렉터가 여기 별도로 하드코딩돼 있어 core 모듈의
  // SEND_BUTTON_SELECTOR 갱신("보내기" 라벨 추가)이 반영되지 않았다.
  // 셀렉터 이중 관리를 없애기 위해 core의 sendPrompt()를 그대로 재사용한다.
  await sendPrompt(page);
  log(`${pose.id} 전송 완료 — 생성 대기 중...`);

  // fresh 판정은 cid가 있는 이미지만 신뢰한다. cid가 없는 이미지(예: 방금
  // 첨부한 참조 이미지의 로컬 미리보기, 아직 로딩 중인 프리뷰)를 "새로
  // 생성됨"으로 잡으면 첨부 직후에 바로 완료로 오판해 실제 생성을 기다리지
  // 않고 저장을 시도하게 된다 — cid 판정 경합의 상당수가 여기서 시작됐다
  // (2026-09-17, 3편 씬6/7/10/11에서 재현). 완료 판정 직후 한 번 더 대기해
  // DOM이 안정되길 기다린다(짧은 텀에 연속 요청하면 이전 응답의 렌더링이
  // 덜 끝난 상태로 다음 요청이 감지되는 경우가 있었다).
  // 실제 이미지 생성은 최소 20~30초는 걸린다(실측: 정상 생성 1~2분). 참조
  // 이미지를 매 턴 재첨부하면 ChatGPT 서버가 재업로드를 새 파일 id로 처리해,
  // baseline 판정과 첨부 완료 사이의 짧은 경합으로 "새 cid"가 조기에 감지되는
  // 오탐이 실측됐다(2026-09-23, 황소특보 1편 s2/s3 — 전송 14초 만에 "완료"로
  // 오판해 방금 첨부한 참조 이미지를 그대로 저장). 최소 대기시간을 강제해
  // 이 조기 오탐 경로를 원천 차단한다.
  const MIN_GENERATION_WAIT_MS = 25000;
  const turnStartedAt = Date.now();
  let done = false;
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(2000);
    // 콘텐츠 정책 위반 거부는 이미지 없이 텍스트 응답으로만 온다. 이전까지는
    // 이 경우를 감지하지 못해 "생성 완료"로 오판, 화면에 남아있던 참조
    // 이미지를 그대로 저장해버렸다(2026-09-23, 황소특보 1편 s1 — "당사
    // 콘텐츠 정책을 위반할 수 있습니다" 거부를 감지 못하고 canonical
    // reference를 재저장). 거부 문구가 보이면 즉시 중단해 오저장을 막는다.
    const refused = await page.evaluate(() => {
      // 2026-09-26: turn 컨테이너 testid가 [data-turn-key]로 바뀌었다(구
      // "conversation-turn"도 폴백으로 계속 매칭).
      const turns = document.querySelectorAll('[data-turn-key], [data-testid^="conversation-turn"]');
      if (turns.length === 0) return false;
      const last = turns[turns.length - 1].textContent || "";
      return /콘텐츠 정책을 위반|content policy|정책에 위배|policy violation/i.test(last);
    });
    if (refused) {
      throw new Error(`${pose.id}: ChatGPT 콘텐츠 정책 위반으로 거부됨 — 프롬프트 수정 필요`);
    }
    if (Date.now() - turnStartedAt < MIN_GENERATION_WAIT_MS) continue;
    if (await isAssistantDone(page)) {
      await page.waitForTimeout(4000);
      if (!(await isAssistantDone(page))) continue; // 늦게 시작된 재생성 중일 수 있음
      const imgs = await collectGeneratedImages(page);
      // 2026-09-26: cid가 항상 null인 blob URL 체계에서는 x.cid만 보면
      // "새 이미지 없음"으로 영원히 오판한다(위 baselineCids 계산과 동일한
      // fallback: cid 없으면 src 자체로 식별).
      const fresh = imgs.filter((x) => x.gen && (x.cid || x.src) && !baselineCids.has(x.cid || x.src));
      if (fresh.length > 0) { done = true; break; }
    }
  }
  if (!done) warn(`${pose.id}: 생성 완료 감지 timeout — fallback 시도`);

  const saveRes = await saveGeneratedImage(page, destPath, baselineCids);
  if (!saveRes.ok) throw new Error(`${pose.id}: 이미지 저장 실패 (${saveRes.method})`);

  // "새로 생성된 이미지"를 가려내는 로직(collectGeneratedImages의 cid 필터,
  // saveGeneratedImage의 documentIndex 정렬)이 타이밍 경합으로 실패하면,
  // 실제로 새로 생성되지 않았는데도 대화창에 남아있는 다른 이미지를 그대로
  // 가져와 저장하는 회귀가 반복 관측됐다(2026-09-17). 두 가지 변종이 있다:
  // (a) 매 턴 반복 첨부하는 기준 참조 이미지 자체를 재반환 — owl_cta_bg_final,
  //     3편 씬2/3/6/7. (b) 같은 대화 안에서 먼저 생성해 저장했던 다른 씬의
  //     이미지를 재반환 — 3편 씬10/11(둘 다 씬1 hook과 동일한 스튜디오 이미지
  //     였음). 근본 수정(cid/documentIndex 판정 자체를 더 신뢰성 있게 만들기)
  //     전까지는, 저장 직후 (1) 기준 이미지와 (2) 이 세션에서 이미 저장한
  //     모든 씬 파일과 바이트 단위로 비교해 겹치면 실패로 처리한다.
  const savedBuf = fs.existsSync(destPath) ? fs.readFileSync(destPath) : null;
  if (savedBuf) {
    const savedHash = crypto.createHash("sha256").update(savedBuf).digest("hex");
    const isRefDuplicate =
      (CHARACTER === "owl3dv5" &&
        fs.existsSync(OWL3DV5_CANONICAL_REFERENCE) &&
        Buffer.compare(savedBuf, fs.readFileSync(OWL3DV5_CANONICAL_REFERENCE)) === 0) ||
      (CHARACTER === "coin3dv1" &&
        fs.existsSync(COIN3DV1_CANONICAL_REFERENCE) &&
        Buffer.compare(savedBuf, fs.readFileSync(COIN3DV1_CANONICAL_REFERENCE)) === 0) ||
      (CHARACTER === "bull3dv1" &&
        fs.existsSync(BULL3DV1_CANONICAL_REFERENCE) &&
        Buffer.compare(savedBuf, fs.readFileSync(BULL3DV1_CANONICAL_REFERENCE)) === 0);
    const dupOf = savedHashes.get(savedHash);
    if (isRefDuplicate || dupOf) {
      fs.unlinkSync(destPath);
      const reason = isRefDuplicate
        ? "기준 참조 이미지와 완전히 동일함(생성이 아니라 재반환)"
        : `이미 저장된 "${dupOf}"와 완전히 동일함(다른 씬 이미지 재반환)`;
      throw new Error(`${pose.id}: 저장된 이미지가 ${reason} — 재시도 필요`);
    }
    savedHashes.set(savedHash, pose.id);
  }

  log(`${pose.id} 저장 ✅ ${destPath} (${saveRes.method}, ${Math.round((saveRes.bytes || 0) / 1024)}KB)`);
  return { id: pose.id, destPath, save: saveRes, prompt: buildPrompt(pose, toolMode) };
}

async function main() {
  log(`=== 캐릭터 일관성 probe (단일 대화 연속 생성) ===`);
  log(`character: ${CHARACTER} — ${CHAR_DEF.label}`);
  log(`out-dir: ${OUT_DIR_ABS}`);
  log(`mode:    ${PREFLIGHT_ONLY ? "PREFLIGHT_ONLY (전송 0회)" : `GENERATE (최대 ${POSES.length}장)`}`);

  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0];
  if (!ctx) { console.error("ABORT: no browser context"); process.exit(1); }

  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);

  if (/auth|login/i.test(page.url())) {
    const resumed = await failFast(page, {
      outDir: OUT_DIR_ABS,
      label: "login-required",
      what: "ChatGPT 로그인이 필요합니다. 브라우저에서 로그인해 주세요",
      selectors: ["URL 에 auth/login 포함"],
      hint: "CDP 프로필의 세션이 만료됐습니다. 한 번 로그인해두면 다음부터는 유지됩니다.",
      manualAssist: MANUAL_ASSIST,
    });
    if (!resumed) process.exit(1);
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);
  }
  await checkLogin(page, log);
  await detectStop(page);

  // 2026-09-26: 여기서 새 대화를 강제로 열지 않으면 이 CDP 프로필/탭에 남아
  //있던 기존 대화(캐릭터 디자인용 대화 등)에 그대로 이어 붙어 전송되는
  // 사고가 실제로 발생했다(황소특보 4편 s1이 엉뚱한 배경·소품으로 생성됨).
  await openFreshImageChat(page, log);
  await detectStop(page);

  const toolResult = await activateImageTool(page, log, warn);
  const toolMode = toolResult?.mode ?? "unknown";
  log(`image tool mode: ${toolMode}`);

  const ta = page.locator(PROMPT_COMPOSER_SELECTOR).first();
  if (!(await ta.isVisible({ timeout: 8000 }).catch(() => false))) {
    await failFast(page, {
      outDir: OUT_DIR_ABS,
      label: "composer-missing",
      what: "ChatGPT 입력창(컴포저)을 찾지 못했습니다",
      selectors: [PROMPT_COMPOSER_SELECTOR],
      hint: "ChatGPT UI 가 바뀌었을 수 있습니다. clickable-elements.txt 와 page.html 에서 새 입력창 셀렉터를 찾으세요.",
      manualAssist: false,
    });
    process.exit(1);
  }

  if (PREFLIGHT_ONLY) {
    log("PREFLIGHT PASS — 로그인/이미지툴/composer 확인 완료. 전송 0회.");
    fs.writeFileSync(
      path.join(OUT_DIR_ABS, "PREFLIGHT.json"),
      JSON.stringify(
        { schema: "CHAR_CONSISTENCY_PROBE_PREFLIGHT_V1", result: "PASS", sent: 0, toolMode },
        null, 2
      ),
      "utf-8"
    );
    await page.close().catch(() => {});
    return;
  }

  // out-dir에 이전 실행(또는 이 실행의 앞선 프로세스)에서 이미 저장된 씬
  // 파일이 있으면 그 해시도 미리 등록한다 — 재시도 실행이 방금 지운 실패
  // 파일뿐 아니라 앞서 성공한 다른 씬과 겹치는지도 걸러낼 수 있어야 한다.
  const savedHashes = new Map();
  for (const entry of fs.readdirSync(OUT_DIR_ABS)) {
    if (!entry.endsWith(".png")) continue;
    const full = path.join(OUT_DIR_ABS, entry);
    const hash = crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    savedHashes.set(hash, entry);
  }

  const results = [];
  for (const pose of POSES) {
    try {
      results.push(await generateTurn(page, pose, toolMode, savedHashes));
    } catch (err) {
      warn(`${pose.id} 실패: ${err.message}`);
      results.push({ id: pose.id, ok: false, error: err.message });
      break; // 첫 실패에서 중단
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR_ABS, "PROBE_MANIFEST.json"),
    JSON.stringify({
      schema: "CHAR_CONSISTENCY_PROBE_V1",
      method: "single_conversation_sequential_turns",
      character: CHARACTER,
      characterLabel: CHAR_DEF.label,
      toolMode,
      identity: IDENTITY,
      sameCharacterRule: SAME_CHARACTER_RULE,
      generated: results.filter((r) => r.destPath).length,
      failed: results.filter((r) => r.ok === false).length,
      conversationUrl: page.url(),
      results,
    }, null, 2),
    "utf-8"
  );

  log(`완료. 생성 ${results.filter((r) => r.destPath).length}장 → ${OUT_DIR_ABS}`);
  await page.close().catch(() => {});
}

// 2026-09-19 버그 수정: page.close()만으로는 CDP 브라우저 연결(웹소켓 등)이
// 열린 채로 남아 Node 프로세스가 종료되지 않았다(Owner 지적: 백그라운드 완료를
// harness가 계속 "실행 중"으로 인식 — 실제로는 결과 파일까지 다 만들어진 뒤였다).
// 성공 경로에서도 명시적으로 process.exit(0)을 호출해 프로세스를 확실히 끝낸다.
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("probe failed:", err.message);
    process.exit(1);
  });
