import fs from "node:fs";
const C = {
  17: { dir: "C:/tmp/story-ep17-freechal", repo: "ep17-freechal-v5", text: "공짜 옆에 또 다른 공짜가 있으면, 값을 매긴 쪽이 먼저 비게 돼. 프리챌의 다음 이야기가 궁금하면 팔로우해 줘." },
  18: { dir: "C:/tmp/story-ep18-pokemon", repo: "ep18-pokemon-v6", text: "사람들이 산 건 빵이 아니라 기억이었어. 모자란 건 빵이 아니라 그 기억의 개수였지. 포켓몬빵의 다음 이야기가 궁금하면 팔로우해 줘." },
  19: { dir: "C:/tmp/story-ep19-ryu", repo: "ep19-ryu-v5", text: "큰 숫자는 그 돈이 누구 주머니로 가는지부터 보면 달라. 280억 원은 협상할 권리의 값이었지. 류현진 이야기의 다음이 궁금하면 팔로우해 줘." },
  20: { dir: "C:/tmp/story-ep20-castella", repo: "ep20-castella-v6", text: "이름과 빵이 닮은 가게들은 손님도 소문도 같이 나눴어. 너무 빨리 늘어난 곳에선 작은 계기도 크게 번졌지. 이런 가게 이야기가 더 궁금하면 팔로우해 줘." },
};
for (const [n, c] of Object.entries(C)) {
  const p = `${c.dir}/scenes-v1.json`;
  const s = JSON.parse(fs.readFileSync(p, "utf8"));
  s[s.length - 1] = c.text;
  fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
  fs.writeFileSync(`C:/Users/PC/jjy/instagram-auto/_ai/story-s2-scripts/${c.repo}.json`, JSON.stringify(s, null, 2) + "\n");
  console.log(n, s.length, "장면, 마지막:", c.text.replace(/\s+/g, "").length, "자");
}
