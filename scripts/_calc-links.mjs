/**
 * 편별 맞춤 계산기 링크 — 생활계산연구소(buildgongjakso.com, 소스 C:\Users\PC\jjy\life-decision, 읽기만) 연결.
 * Owner 2026-10-14: 영상을 보고 넘어온 사람을 계산기 첫 화면이 아니라 그 편 주제에 맞는 계산기 페이지로 바로 보낸다.
 *
 * - 키 = 부엉박사 파일 번호(owl-ep{N}). contentId의 `owl-ep(\d+)`에서 읽는다.
 * - 계산기 슬러그는 실제 페이지를 열어 제목·정식 주소(canonical)를 확인한 것만 넣는다(2026-10-14).
 * - 맞는 계산기가 없는 편은 넣지 않는다 → 링크트리 기본 링크 유지(억지로 연결하지 않는다).
 * - 유튜브 설명란은 업로드 뒤 수정할 수 없으므로(토큰 업로드 전용) 주소를 바꾸지 말 것 — 계산기 쪽에도 301 유지를 요청해 둠.
 * - 인스타 캡션의 링크는 눌리지 않아 넣지 않는다. "광고 눌러 달라" 같은 문구 금지(애드센스 정책).
 */

export const CALC_SITE = "https://buildgongjakso.com";
export const UTM_CAMPAIGN = "gyeongjebeonyeokso";

/** @type {Record<number, {slug: string, label: string, cta: string}>} */
export const OWL_CALC_LINKS = {
  29: { slug: "national-pension-benefit", label: "내 국민연금, 나중에 얼마나 받을까요?", cta: "내 국민연금 예상 수령액 계산해 보기" }, // 통합 52편
  31: { slug: "pension-account-credit", label: "연금저축에 넣으면 세금을 얼마나 돌려받나요?", cta: "내 연금계좌 세액공제 계산해 보기" }, // 통합 54편
  32: { slug: "copay-ceiling-refund", label: "병원비를 많이 냈는데, 얼마나 돌려받을 수 있나요?", cta: "내 병원비 환급금 계산해 보기" }, // 통합 55편
};

/** contentId("owl-ep29-...")나 --ep 값에서 파일 번호를 구한다. */
export function fileEpFrom(contentId, epArg) {
  if (epArg != null && Number.isInteger(Number(epArg))) return Number(epArg);
  const m = /owl-ep(\d+)/.exec(String(contentId ?? ""));
  return m ? Number(m[1]) : null;
}

/** 계산기 정식 주소(쿼리 없음). */
export const calcBaseUrl = (slug) => `${CALC_SITE}/tools/${slug}`;

/** 플랫폼별 추적 주소. utm_content = 편 식별(owl-ep{N}). */
export function calcTrackedUrl(slug, source, fileEp) {
  const q = new URLSearchParams({ utm_source: source, utm_medium: "social", utm_campaign: UTM_CAMPAIGN, utm_content: `owl-ep${fileEp}` });
  return `${calcBaseUrl(slug)}?${q}`;
}
