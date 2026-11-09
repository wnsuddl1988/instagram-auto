/**
 * 콘텐츠 유닛 JSON의 instagramCaption·youtubeDescription 에 구독 안내 줄(규칙 35)을 넣는다.
 * 이미 있으면 그대로 둔다(멱등). 기본은 미리보기(--write 없이는 파일을 바꾸지 않는다).
 *
 *   node scripts/patch-content-unit-subscribe-cta.mjs --content-unit <path.json>          # 미리보기
 *   node scripts/patch-content-unit-subscribe-cta.mjs --content-unit <path.json> --write  # 저장
 */
import fs from "node:fs";
import { appendSubscribeCta } from "./_subscribe-cta.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const file = flag("--content-unit");
const write = args.includes("--write");
if (!file || !fs.existsSync(file)) {
  console.error("사용법: --content-unit <content-unit.json> [--write]");
  process.exit(2);
}

const cu = JSON.parse(fs.readFileSync(file, "utf8"));
let changed = false;
for (const [field, platform] of [["instagramCaption", "instagram"], ["youtubeDescription", "youtube"]]) {
  if (typeof cu[field] !== "string" || cu[field].trim() === "") {
    console.log(`- ${field}: 없음(건너뜀)`);
    continue;
  }
  const next = appendSubscribeCta(cu[field], platform);
  if (next === cu[field]) {
    console.log(`- ${field}: 이미 구독 안내 있음`);
  } else {
    console.log(`- ${field}: 구독 안내 추가(${cu[field].length}자 → ${next.length}자)`);
    cu[field] = next;
    changed = true;
  }
}
if (cu.instagramCaption && cu.instagramCaption.length > 2200) {
  console.error(`ABORT: 인스타 캡션 ${cu.instagramCaption.length}자 > 2,200자 — 저장하지 않음`);
  process.exit(1);
}
if (changed && write) {
  fs.writeFileSync(file, JSON.stringify(cu, null, 2) + "\n", "utf8");
  console.log("저장 완료:", file);
} else if (changed) {
  console.log("(미리보기 — --write 로 저장)");
}
