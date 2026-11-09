/**
 * 뉴스레터 구독 안내 줄 — 모든 영상 캡션·설명 마지막(해시태그 바로 위)에 붙인다.
 * CURRENT_STANDARDS 규칙 35 (Owner 2026-10-13 승인).
 *
 * - Instagram 캡션 안의 URL은 눌리지 않으므로 "프로필 링크"로 안내한다.
 * - YouTube 설명란은 URL이 눌리므로 구독 페이지 주소를 직접 적는다.
 * - 이미 안내 줄이 있으면 다시 붙이지 않는다(멱등).
 */

export const SUBSCRIBE_URL = "https://page.stibee.com/subscriptions/522827";
const MARKER = "이번 주 경제번역";

export const SUBSCRIBE_CTA_INSTAGRAM = [
  "매주 마감 임박 제도와 경제 숫자를 메일로 받아보세요(무료)",
  `구독은 프로필 링크 → '${MARKER} 구독하기'`,
];

export const SUBSCRIBE_CTA_YOUTUBE = [
  `매주 마감 임박 제도와 경제 숫자를 메일로 받아보세요(무료) — '${MARKER}'`,
  "구독하면 혜택·마감 캘린더 PDF를 드려요.",
  SUBSCRIBE_URL,
];

/**
 * 완성된 캡션/설명 문자열에 구독 안내 줄을 끼워 넣는다.
 * 마지막 줄이 해시태그(#...)면 그 바로 위, 아니면 맨 끝에 둔다.
 * @param {string} text
 * @param {"instagram"|"youtube"} platform
 */
export function appendSubscribeCta(text, platform) {
  if (typeof text !== "string" || text.includes(MARKER)) return text;
  const cta = platform === "youtube" ? SUBSCRIBE_CTA_YOUTUBE : SUBSCRIBE_CTA_INSTAGRAM;
  const lines = text.split("\n");
  let tail = lines.length;
  while (tail > 0 && lines[tail - 1].trim() === "") tail -= 1;
  const lastIsHashtags = tail > 0 && /^#\S/.test(lines[tail - 1].trim());
  const insertAt = lastIsHashtags ? tail - 1 : tail;
  const head = lines.slice(0, insertAt);
  while (head.length > 0 && head[head.length - 1].trim() === "") head.pop();
  const rest = lines.slice(insertAt);
  return [...head, "", ...cta, ...(rest.length > 0 ? ["", ...rest] : [])].join("\n");
}
