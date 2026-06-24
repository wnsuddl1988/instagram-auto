import type { RiskFinding } from "./types";

type RiskLevel = Exclude<RiskFinding["riskLevel"], never>;

export interface RiskPattern {
  code: string;
  riskLevel: RiskLevel;
  /** Regex tested against lowercased text. */
  pattern: RegExp;
  message: string;
  saferWording: string | null;
}

/**
 * Ordered from most severe to least severe.
 * Patterns are tested against lowercased text.
 * Required detection examples from HANDOFF_NOW §Required detection examples are all included.
 */
export const RISK_PATTERNS: RiskPattern[] = [
  // ── BLOCKED: explicit investment buy/sell recommendations ─────────────────
  {
    code: "investment_buy_recommendation",
    riskLevel: "blocked",
    pattern: /매수하세요|지금\s*사세요|지금\s*바로\s*사세요|이\s*종목\s*사면\s*됩니다|이\s*주식\s*사면\s*됩니다/,
    message: "특정 종목 매수 권유 표현은 금융소비자보호법 위반 위험이 있어 사용 불가합니다.",
    saferWording: "투자 판단에는 추가 확인이 필요합니다",
  },
  {
    code: "investment_sell_recommendation",
    riskLevel: "blocked",
    pattern: /매도하세요|지금\s*팔아야\s*합니다|지금\s*팔면\s*됩니다/,
    message: "특정 종목 매도 권유 표현은 금융소비자보호법 위반 위험이 있어 사용 불가합니다.",
    saferWording: "투자 판단에는 추가 확인이 필요합니다",
  },
  {
    code: "guaranteed_profit",
    riskLevel: "blocked",
    pattern: /수익\s*보장|원금\s*보장|손실\s*없음|무조건\s*수익|반드시\s*오릅니다|100%\s*돈\s*법니다|100%\s*수익/,
    message: "수익·원금 보장 표현은 금융광고 규정 위반 위험이 있어 사용 불가합니다.",
    saferWording: "투자에는 원금 손실 위험이 있습니다",
  },
  {
    code: "certain_surge",
    riskLevel: "blocked",
    pattern: /급등\s*확정|폭등\s*확정|무조건\s*오릅니다|반드시\s*오를|확실히\s*오릅니다/,
    message: "가격 급등 확정 표현은 허위·과장 표현으로 사용 불가합니다.",
    saferWording: "변동성이 커질 수 있어 주의가 필요합니다",
  },
  {
    code: "fomo_pressure",
    riskLevel: "blocked",
    pattern: /지금\s*안\s*사면\s*늦습니다|지금\s*안\s*하면\s*늦습니다|이\s*기회\s*놓치면\s*후회|마지막\s*기회입니다/,
    message: "공포 마케팅(FOMO) 표현은 불공정 금융 권유로 사용 불가합니다.",
    saferWording: "투자 판단은 개인 상황에 따라 신중하게 결정하세요",
  },
  {
    code: "sure_profit_claim",
    riskLevel: "blocked",
    pattern: /돈\s*법니다|대박\s*확정|부자\s*됩니다|무조건\s*부자/,
    message: "수익 확정·대박 표현은 과장된 금융 광고로 사용 불가합니다.",
    saferWording: "투자 성과는 시장 상황에 따라 다를 수 있습니다",
  },

  // ── HIGH: strong directional claims without disclaimer ─────────────────────
  {
    code: "strong_directional_claim",
    riskLevel: "high",
    pattern: /반드시\s*내립니다|당연히\s*오릅니다|분명히\s*오릅니다|당연히\s*내립니다/,
    message: "단정적인 방향 예측 표현은 과장 표현으로 위험합니다.",
    saferWording: "데이터상 주목할 만한 변화입니다",
  },
  {
    code: "specific_target_price",
    riskLevel: "high",
    pattern: /목표\s*주가|목표가|목표\s*가격|price\s*target/i,
    message: "특정 목표 주가 언급은 투자 권유로 오인될 수 있어 위험합니다.",
    saferWording: "출처 데이터 기준의 수치를 확인하세요",
  },
  {
    code: "misleading_certainty",
    riskLevel: "high",
    pattern: /무조건|절대\s*안전|리스크\s*없음|위험\s*없음|손해\s*없음/,
    message: "투자 위험을 부정하는 표현은 위험한 과장입니다.",
    saferWording: "투자에는 위험이 따를 수 있습니다",
  },

  // ── MEDIUM: caution-level expressions ──────────────────────────────────────
  {
    code: "informal_investment_urge",
    riskLevel: "medium",
    pattern: /담아두세요|모아두세요|쓸어담으세요|줍줍/,
    message: "특정 자산을 모으라는 비공식 투자 권유 표현은 주의가 필요합니다.",
    saferWording: "투자 판단에는 추가 확인이 필요합니다",
  },
  {
    code: "market_timing_advice",
    riskLevel: "medium",
    pattern: /지금이\s*기회|지금\s*들어가면|지금\s*매수\s*타이밍/,
    message: "시장 타이밍을 제안하는 표현은 투자 권유로 오인될 수 있습니다.",
    saferWording: "관찰할 필요가 있습니다",
  },
  {
    code: "excessive_return_claim",
    riskLevel: "medium",
    pattern: /\d{2,}배\s*수익|\d{2,}배\s*오른|몇\s*배\s*수익/,
    message: "과도한 수익률 주장은 과장 표현으로 주의가 필요합니다.",
    saferWording: "변동성이 커질 수 있어 신중한 판단이 필요합니다",
  },
];

/** Risk level priority (higher index = more severe). */
const RISK_ORDER: RiskFinding["riskLevel"][] = ["low", "medium", "high", "blocked"];

export function maxRiskLevel(
  a: RiskFinding["riskLevel"],
  b: RiskFinding["riskLevel"],
): RiskFinding["riskLevel"] {
  return RISK_ORDER.indexOf(a) >= RISK_ORDER.indexOf(b) ? a : b;
}
