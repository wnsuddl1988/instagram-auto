import fs from "node:fs";
const P = {
  17: ["C:/tmp/story-ep17-freechal/ep-config.mjs", 'key: "close"', "공짜 옆에 또 다른 공짜가 있으면, 값을 매긴 쪽이 먼저 비게 돼. 프리챌의 다음 이야기가 궁금하면 팔로우해 줘."],
  18: ["C:/tmp/story-ep18-pokemon/ep-config.mjs", 'key: "close"', "사람들이 산 건 빵이 아니라 기억이었어. 모자란 건 빵이 아니라 그 기억의 개수였지. 포켓몬빵의 다음 이야기가 궁금하면 팔로우해 줘."],
  19: ["C:/tmp/story-ep19-ryu/ep-config.mjs", 'key: "close"', "큰 숫자는 그 돈이 누구 주머니로 가는지부터 보면 달라. 이백팔십억 원은 협상할 권리의 값이었지. 류현진 이야기의 다음이 궁금하면 팔로우해 줘."],
  20: ["C:/tmp/story-ep20-castella/ep-config.mjs", 'key: "finish"', "이름과 빵이 닮은 가게들은 손님도 소문도 같이 나눴어. 너무 빨리 늘어난 곳에선 작은 계기도 크게 번졌지. 이런 가게 이야기가 더 궁금하면 팔로우해 줘."],
};
for (const [n, [file, keyMark, perf]] of Object.entries(P)) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const i = lines.findIndex((l) => l.includes(keyMark) && l.includes("perf:"));
  if (i < 0) throw new Error(`${n}: 마지막 장면 줄을 못 찾음`);
  lines[i] = lines[i].replace(/perf: "[^"]*"/, `perf: ${JSON.stringify(perf)}`);
  fs.writeFileSync(file, lines.join("\n"));
  console.log(n, "perf 교체", i + 1);
}
