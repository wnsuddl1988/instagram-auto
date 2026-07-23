const ABBREVIATIONS: Record<string, string> = {
  "AI": "에이아이",
  "pH": "피에이치",
  "ml": "밀리리터",
  "cm": "센티미터",
  "LED": "엘이디",
  "FAQ": "에프에이큐",
};

function readKoreanInteger(value: string): string {
  const numeric = Number(value.replaceAll(",", ""));
  if (!Number.isSafeInteger(numeric) || numeric < 0 || numeric > 99999) return value;
  if (numeric === 0) return "영";

  const digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const units = ["", "십", "백", "천"];
  const underTenThousand = (number: number) => {
    let remaining = number;
    let spoken = "";
    for (let index = 3; index >= 0; index -= 1) {
      const divisor = 10 ** index;
      const digit = Math.floor(remaining / divisor);
      remaining %= divisor;
      if (digit === 0) continue;
      spoken += `${digit === 1 && index > 0 ? "" : digits[digit]}${units[index]}`;
    }
    return spoken;
  };
  const tenThousands = Math.floor(numeric / 10000);
  const remainder = numeric % 10000;
  return `${tenThousands ? `${underTenThousand(tenThousands)}만` : ""}${remainder ? underTenThousand(remainder) : ""}`;
}

function normalizeUrl(match: string): string {
  return match
    .replace(/^https?:/i, (protocol) => protocol.toLowerCase() === "https:" ? "에이치티티피에스 콜론" : "에이치티티피 콜론")
    .replaceAll("//", " 슬래시 슬래시 ")
    .replaceAll("/", " 슬래시 ")
    .replaceAll(".", " 점 ");
}

export function normalizeLumiTtsText(input: string): string {
  let text = input.trim();
  text = text.replace(/https?:\/\/[^\s]+/gi, normalizeUrl);
  for (const [source, spoken] of Object.entries(ABBREVIATIONS)) {
    text = text.replaceAll(source, spoken);
  }
  return text
    .replace(/(\d[\d,]*)\s*~\s*(\d[\d,]*)/g, "$1에서 $2")
    .replace(/%/g, " 퍼센트")
    .replace(/×/g, " 곱하기 ")
    .replace(/&/g, " 그리고 ")
    .replace(/\+/g, "더하기")
    .replace(/[\[\](){}]/g, " ")
    .replace(/\s*\/\s*/g, " 또는 ")
    .replace(/#/g, "해시태그 ")
    .replace(/@/g, "골뱅이 ")
    .replace(/(\d[\d,]*)(?=(분|가지|초|회|개|원|밀리리터|센티미터|퍼센트))/g, "$1 ")
    .replace(/\d[\d,]*/g, (number) => readKoreanInteger(number))
    .replace(/\s{2,}/g, " ")
    .trim();
}
