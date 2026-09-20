// 적용된 코어 함수(classifyVeoBody) 검증 — 외부호출 없음.
// scripts/_gemini-veo-core.mjs 의 실제 export 를 import 해 PoC 테스트 케이스를 재실행한다.
import { classifyVeoBody } from "../../scripts/_gemini-veo-core.mjs";

const cases = [
  ["죄송하지만 이 콘텐츠는 생성할 수 없습니다", "refusal"],
  ["이 요청은 처리할 수 없어요", "refusal"],
  ["I'm not able to help with that", "refusal"],
  ["I can't create this video", "refusal"],
  ["This request violates our policy", "refusal"],
  ["content policy를 위반했습니다", "refusal"],
  ["I won't be able to generate", "refusal"],
  ["안전 가이드라인에 따라 거절합니다", "refusal"],
  ["unable to generate this", "refusal"],
  ["Sorry, I can't assist with that", "refusal"],
  ["해당 콘텐츠를 만들 수 없습니다", "refusal"],
  ["violates our guidelines", "refusal"],
  ["오늘 동영상 한도가 초과되었습니다", "quota"],
  ["video limit reached, try again later", "quota"],
  // 정상(=감지 없음). 코어는 null 을 반환하므로 unknown 으로 환산.
  ["준영님, 지금 기분이 어떠세요?", "unknown"],
  ["동영상 생성 중입니다...", "unknown"],
  ["", "unknown"],
];

let pass = 0, fail = 0;
for (const [input, expected] of cases) {
  const r = classifyVeoBody(input);
  const type = r ? r.type : "unknown";
  const ok = type === expected;
  if (ok) pass++; else fail++;
  const snip = r?.snippet ? ` snippet="${r.snippet}"` : "";
  console.log(`${ok ? "✅" : "❌"} [${type}/${expected}] "${input.slice(0, 40)}"${snip}`);
}
console.log(`\n결과: ${pass}/${cases.length} PASS, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
