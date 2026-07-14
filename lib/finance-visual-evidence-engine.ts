import { createHash } from "node:crypto";

import type { FinanceEditorialLane, FinanceEditorialSubtopicId } from "./finance-editorial-topic-bank";

export const FINANCE_VISUAL_EVIDENCE_VERSION = "money_shorts_finance_3d_editorial_sequence_v11" as const;
export const FINANCE_VISUAL_STYLE_CONTRACT = "money_shorts_bright_integrated_motion_ready_family_3d_v3" as const;
export const FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION = "money_shorts_selected_character_reference_v1" as const;
export const FINANCE_VISUAL_CHARACTER_CONTINUITY =
  "within one video, every visible person must match the selected character reference exactly in face, age, hairstyle, hair color, body proportions and fixed wardrobe; integrate that character into one natural story view with believable adult proportions and restrained micro-acting rather than copying the multi-view identity board; hands-only scenes may omit the head" as const;
export const FINANCE_VISUAL_SCENE_INTEGRATION_CONTRACT =
  "generate the character, room, props and lighting together as one authored shot with matched perspective, ambient color bounce, contact shadows, foot-floor grounding, hand-object grip and foreground occlusion; no cutout character, pasted-on subject, green-screen edge or composited look" as const;
export const FINANCE_VISUAL_MOTION_CONTRACT_VERSION = "money_shorts_scene_motion_plan_v1" as const;
export const FINANCE_VISUAL_MOTION_CONTRACT =
  "stage a plausible middle moment of one small action with relaxed shoulders and restrained micro-acting; keep foreground, character plane and background separable for later camera parallax, with clean local motion around the gaze, hands, one story prop, hair or fabric; never lunge, reach toward the camera or use a superhero pose" as const;
export const FINANCE_VISUAL_MIN_ADJACENT_DIFFERENCES = 4;

export type FinanceVisualStage =
  | "hook"
  | "problem"
  | "situation"
  | "consequence"
  | "psychology"
  | "mindset"
  | "habit"
  | "recommendation"
  | "save";

export type FinanceVisualEvidence = {
  version: typeof FINANCE_VISUAL_EVIDENCE_VERSION;
  sceneIdentity: string;
  stage: FinanceVisualStage;
  financeSubtopic: FinanceEditorialSubtopicId;
  editorialLane: FinanceEditorialLane;
  claim: string;
  visualStyle: typeof FINANCE_VISUAL_STYLE_CONTRACT;
  titleSpecificSignal: string;
  sceneSpecificSignal: string;
  sceneSetting: string;
  visualForm: string;
  cameraPlan: string;
  lightingPlan: string;
  sceneIntegrationPlan: string;
  motionPlan: string;
  differenceContract: string;
  heroSubject: string;
  mustShow: string;
  visibleAction: string;
  economicMeaning: string;
  editorialProof: string;
  causalComposition: string;
  continuityAnchor: string;
  continuityState: string;
  captionSafeZone: string;
  mustNotShow: string;
};

type DomainVisualKit = {
  context: string;
  mechanism: string;
  result: string;
  trigger: string;
  control: string;
  action: string;
  future: string;
  continuity: string;
  forbidden: string;
};

type SubtopicScopedRule<T extends object> = T & {
  subtopics?: readonly FinanceEditorialSubtopicId[];
};

const DOMAIN_VISUAL_KITS: Record<FinanceEditorialSubtopicId, DomainVisualKit> = {
  economy_literacy: {
    context: "a hand checking unlabeled news tiles beside a real household budget object",
    mechanism: "one news signal branching toward groceries, a loan payment and a paycheck",
    result: "a household cash-flow tray changing before the distant economy chart moves",
    trigger: "an urgent news alert pulling a hand toward an immediate money decision",
    control: "three separated trays for spending, debt and income impact",
    action: "trace one news signal to one changed household number before moving money",
    future: "a calm household budget protected from a noisy wall of news tiles",
    continuity: "one small folded news tile",
    forbidden: "a television studio, stock ticker wall or decorative world map with no household consequence",
  },
  inflation_living_cost: {
    context: "a grocery basket holding the same essentials beside a visibly longer receipt",
    mechanism: "identical food and household items consuming a larger share of one budget tray",
    result: "the living-cost compartment filling while the free-cash compartment shrinks",
    trigger: "a discount tag tempting a hand to add an unnecessary item",
    control: "a fixed grocery boundary separating planned essentials from impulse extras",
    action: "compare one item, remove one extra or set the basket limit before checkout",
    future: "a stable essentials basket inside a protected monthly spending boundary",
    continuity: "one small grocery token",
    forbidden: "floating price arrows or coins without an actual basket, bill or household tradeoff",
  },
  interest_debt: {
    context: "a loan statement, card installment slips and a repayment calendar arranged by due date",
    mechanism: "interest weight accumulating across repeated monthly payment slots",
    result: "more income diverted into interest while emergency cash space contracts",
    trigger: "a low monthly-payment offer hiding a longer chain of payment slots",
    control: "principal, total interest and payoff date separated into three physical markers",
    action: "move one repayment ahead, compare total interest or close one expensive balance",
    future: "a shorter repayment path releasing space back to emergency savings",
    continuity: "one small repayment marker",
    forbidden: "a generic bank temple, giant percent symbol, chain or key without a repayment mechanism",
  },
  consumption_psychology: {
    context: "a hand pausing above a one-tap checkout object beside unopened parcels",
    mechanism: "an emotion cue flowing into a payment action before a budget boundary appears",
    result: "more packages accumulating while the available-spending tray empties",
    trigger: "a reward, stress or scarcity cue pulling the hand toward checkout",
    control: "a pause barrier between the trigger object and the payment object",
    action: "remove a saved payment path, wait, close the cart or set one purchase boundary",
    future: "a quiet checkout area with only the intentionally chosen item remaining",
    continuity: "one small checkout token",
    forbidden: "a generic shopping bag and credit card posed as decoration without a visible trigger and decision",
  },
  sns_comparison: {
    context: "a glossy social-feed frame beside a real wallet and a group-spending moment",
    mechanism: "someone else's highlighted purchase enlarging while the viewer's budget boundary fades",
    result: "relationship and appearance spending crowding out planned personal expenses",
    trigger: "a spotlighted lifestyle image pulling a faceless viewer toward matching it",
    control: "a personal budget card placed physically in front of the comparison feed",
    action: "set the relationship-spending limit before opening the feed or joining the event",
    future: "a social moment continuing without crossing the protected personal budget",
    continuity: "one small mirror-like feed tile",
    forbidden: "luxury props alone, glamorous faces or a vague envy silhouette without the viewer's budget consequence",
  },
  labor_income: {
    context: "a paycheck or side-income deposit entering a tray already divided by real obligations",
    mechanism: "new income immediately flowing into lifestyle upgrades and fixed costs",
    result: "earnings blocks rising while the retained-asset compartment stays flat",
    trigger: "a fresh deposit making extra spending feel harmless",
    control: "income split first into tax, living costs and retained cash",
    action: "move a fixed share on payday before any discretionary payment",
    future: "higher income leaving a visibly larger retained-cash compartment",
    continuity: "one small payday token",
    forbidden: "a salary envelope, coins and chart posed together without showing where the new income goes",
  },
  investing_assets: {
    context: "an order ticket beside a portfolio position and a separate household-cash buffer",
    mechanism: "price movement tugging the decision away from the written buy and sell boundary",
    result: "household cash leaking into a position or a loss forcing an unplanned sale",
    trigger: "a sharp gain or loss pulling a hand toward an impulsive order",
    control: "buy reason, loss limit and exit condition represented by three separate markers",
    action: "set the buy reason, allowed loss and exit boundary before placing the order",
    future: "a portfolio position contained behind a protected household-cash buffer",
    continuity: "one small portfolio marker",
    forbidden: "a rocket, bull, bear, candlestick wall or coin pile without a decision rule and downside boundary",
  },
  housing_asset_gap: {
    context: "a full-scale home interior divided into rent or mortgage, management and commute cost zones",
    mechanism: "the visible home price hiding several recurring monthly drains behind it",
    result: "housing costs compressing the paycheck and emergency-cash compartments",
    trigger: "fear of missing the home pushing a hand toward a contract before total cost is assembled",
    control: "one total monthly housing boundary containing every recurring cost",
    action: "combine interest, management and commute costs before sending a deposit",
    future: "a chosen home leaving visible room for savings and other life choices",
    continuity: "one small house-plan tile",
    forbidden: "a giant house, key or bank facade without the recurring monthly-cost breakdown",
  },
  anxiety_avoidance: {
    context: "a closed banking object beside unopened bills and an approaching due-date calendar",
    mechanism: "unread balances stacking up while available response time disappears",
    result: "several due dates converging with no order for payment or reduction",
    trigger: "an alarming balance causing a hand to close the app or turn away",
    control: "one opened balance isolated beside one clearly chosen next action",
    action: "open one avoided balance, record the total and choose the first payment step",
    future: "fewer hidden bills and one visible sequence replacing the closed pile",
    continuity: "one small opened-bill tab",
    forbidden: "a frightened silhouette, dark void or warning icon without the bill, balance and next action",
  },
  success_habits: {
    context: "a payday sequence where spending, fixed costs and saving compete for first position",
    mechanism: "the same payment order repeating each month before saving begins",
    result: "income blocks growing while the retained-asset compartment remains unchanged",
    trigger: "a new goal creating relief while the old payment order stays untouched",
    control: "saving or repayment placed physically before the consumption lane",
    action: "move one automatic saving or repayment transfer ahead of discretionary spending",
    future: "the revised order repeating automatically and leaving retained cash each month",
    continuity: "one small sequence marker",
    forbidden: "generic stairs, forked paths, floating receipts or an envelope used as the hero without showing payment order",
  },
  crisis_risk: {
    context: "essential monthly expenses beside a finite emergency-cash runway",
    mechanism: "an income interruption reaching cards, debt and forced asset sales in sequence",
    result: "a small shock consuming the runway and forcing expensive borrowing",
    trigger: "crisis news provoking random cash hoarding or a risky recovery bet",
    control: "essential costs, removable fixed costs and runway months separated clearly",
    action: "calculate essential monthly cost and the number of months cash can cover it",
    future: "an emergency runway protecting daily life while optional costs are switched off",
    continuity: "one small runway block",
    forbidden: "a collapsing market chart, storm or red warning field without household survival numbers and choices",
  },
  time_retirement: {
    context: "today's spending object beside a distant future-income compartment on a calendar timeline",
    mechanism: "each delayed start removing time and increasing the required monthly contribution",
    result: "future choices narrowing as the contribution needed later grows",
    trigger: "a distant retirement horizon making today's purchase feel more real than future living costs",
    control: "a small automatic future-income transfer starting on the current date",
    action: "start one affordable retirement transfer now and preserve its start date",
    future: "many small transfers forming a stable future-income stream over time",
    continuity: "one small calendar-time marker",
    forbidden: "an hourglass, elderly silhouette or coin stack alone without the start-time and monthly-contribution mechanism",
  },
};

type TopicVisualOverride = {
  pattern: RegExp;
  kit: Partial<DomainVisualKit>;
  settings?: readonly string[];
  stageSettings?: Partial<Record<FinanceVisualStage, readonly string[]>>;
};

const TOPIC_VISUAL_OVERRIDES: readonly TopicVisualOverride[] = [
  {
    pattern: /구독|자동결제|정기결제/,
    kit: {
      context: "unused media and service objects still connected to separate recurring-renewal markers",
      mechanism: "automatic renewal tokens passing through calendar gates before the user makes a fresh choice",
      result: "the fixed-cost lane widening before payday while the available-choice lane narrows",
      trigger: "familiar service objects creating comfort while their unattended renewal path stays active",
      control: "used and unused service markers separated before the next renewal gate",
      action: "a faceless stylized hand disconnects one unused service token from the recurring-payment path",
      future: "the next payday arriving with a narrower fixed-cost lane and visibly more room for choice",
      continuity: "one small renewal-ring marker",
      forbidden: "shopping parcels, store checkout, grocery basket or decorative credit-card props that confuse subscription renewal with a new purchase",
    },
    settings: [
      "a bright Korean living-room media shelf where separate service objects sit beside different renewal calendar markers",
      "a lived-in sofa-side table where unused subscription objects remain beside quiet recurring-payment envelopes",
      "a sunny payday breakfast table where recurring charges are sorted before the available-choice envelope",
      "a calm living-room review moment with one comforting service object in front and its unattended renewal marker behind",
      "an open home planning table where used and unused service markers are separated before renewal",
      "a compact home-office desk focused on one recurring-payment folder and one disconnect action",
      "a bright entry console where the next renewal reminder pauses beside the household calendar",
      "a resolved payday kitchen table with a smaller recurring-cost group and more open room for choice",
      "a side-view household calendar wall showing repeated renewal markers without readable dates",
      "an airy cafe-side subscription review table with one protected cash envelope and several inactive service objects",
    ],
    stageSettings: {
      hook: ["a bright Korean living-room media shelf where separate service objects sit beside different renewal calendar markers"],
      problem: ["a side-view household calendar wall where automatic renewal markers accumulate before a fresh choice"],
      situation: ["a lived-in sofa-side table where unused subscription objects remain beside quiet recurring-payment envelopes"],
      consequence: ["a sunny payday breakfast table where the recurring-cost group grows before income reaches the available-choice envelope"],
      psychology: ["a calm living-room review moment with a comforting service object in front and its unattended renewal marker behind"],
      mindset: ["an open home planning table where used and unused service markers are separated before renewal"],
      habit: ["a compact home-office desk focused on one recurring-payment folder and one disconnect action"],
      recommendation: ["a bright entry console where the next renewal reminder pauses beside the household calendar"],
      save: [
        "a bright entry console where the next renewal reminder pauses beside the household calendar",
        "a resolved payday kitchen table with a smaller recurring-cost group and more open room for choice",
      ],
    },
  },
  {
    pattern: /할인|쿠폰|세일|대용량/,
    kit: {
      context: "one planned purchase beside a tempting discount object that increases the basket total",
      mechanism: "the discount cue enlarging quantity before actual need is checked",
      result: "more cash leaving now while unused quantity remains behind",
      control: "planned need and discounted extra separated by one hard basket boundary",
      action: "a faceless stylized hand removes the unplanned extra before payment",
      future: "the planned item remaining inside the budget while excess stock disappears",
      forbidden: "generic luxury shopping bags or price arrows without the planned-versus-extra decision",
    },
    settings: [
      "a human-scale 3D store aisle with one planned item and one enlarged discount extra",
      "a checkout approach where the basket boundary is visible before payment",
      "a pantry-scale editorial scene where unused bulk quantity remains after cash has left",
      "a bright grocery comparison counter separating actual need from discounted excess",
      "a lived-in checkout shelf where one extra item is being returned",
    ],
  },
  {
    pattern: /배달|야식|음식s*주문/,
    kit: {
      context: "a repeated one-tap meal order crossing a bounded monthly food lane",
      mechanism: "convenience and fatigue shortening the path from craving to payment",
      result: "small delivery tokens accumulating while the remaining meal budget contracts",
      control: "a pause gate between the craving cue and the saved payment path",
      action: "a faceless stylized hand closes the saved order path and chooses the preset meal boundary",
      future: "the meal budget staying open after the impulse window passes",
      forbidden: "generic shopping parcels, fashion bags or unrelated card props",
    },
    settings: [
      "a human-scale 3D late-night kitchen with a craving cue and one-tap order path",
      "a sofa-side meal-order scene with the monthly food boundary visible",
      "a kitchen wall calendar beside repeated small delivery containers and a shrinking meal envelope",
      "a quiet kitchen counter where the craving cue stops beside the saved-payment boundary",
      "a bright next-evening kitchen where the preset meal boundary remains intact",
    ],
  },
];

function topicVisualOverride(title: string): TopicVisualOverride | null {
  return TOPIC_VISUAL_OVERRIDES.find((override) => override.pattern.test(title)) ?? null;
}

const TITLE_SIGNAL_RULES: ReadonlyArray<SubtopicScopedRule<{ pattern: RegExp; signal: string }>> = [
  { pattern: /환율/, subtopics: ["economy_literacy", "inflation_living_cost"], signal: "a foreign purchase and imported grocery cost crossing into one card payment" },
  { pattern: /금리\s*인하|기준금리/, subtopics: ["economy_literacy", "interest_debt"], signal: "a policy-rate marker reaching a real loan payment only after a delay" },
  { pattern: /실업률|일자리|회사/, subtopics: ["economy_literacy", "labor_income"], signal: "a workplace shift reaching one paycheck and household runway" },
  { pattern: /할인|쿠폰|세일/, subtopics: ["inflation_living_cost", "consumption_psychology"], signal: "a discount cue adding an unplanned item to a bounded basket" },
  { pattern: /배달|야식|음식\s*주문/, subtopics: ["inflation_living_cost", "consumption_psychology"], signal: "a one-tap food order repeating across a monthly meal budget" },
  { pattern: /대용량/, subtopics: ["inflation_living_cost"], signal: "a large package occupying cash now while unused portions remain" },
  { pattern: /구독/, subtopics: ["consumption_psychology"], signal: "several quiet recurring charges leaving on different calendar dates" },
  { pattern: /간편결제|원클릭|결제/, subtopics: ["consumption_psychology"], signal: "a hand crossing from impulse cue to payment before a pause barrier" },
  { pattern: /친구|모임|관계|체면/, subtopics: ["sns_comparison"], signal: "a group-spending choice pressing against one personal relationship budget" },
  { pattern: /연봉|월급|수입|소득/, subtopics: ["labor_income", "success_habits"], signal: "new income entering while the retained-cash compartment fails to grow" },
  { pattern: /자동이체/, subtopics: ["labor_income", "success_habits", "interest_debt"], signal: "two automatic transfers physically competing for first position on payday" },
  { pattern: /카드값|할부/, subtopics: ["interest_debt", "consumption_psychology"], signal: "today's purchase linked to several future card-payment slots" },
  { pattern: /대출|이자|상환/, subtopics: ["interest_debt"], signal: "principal and total interest separated across a repayment timeline" },
  { pattern: /주식|매수|매도|종목/, subtopics: ["investing_assets"], signal: "an order decision placed beside its loss boundary and household-cash buffer" },
  { pattern: /수익률|복리/, subtopics: ["investing_assets", "time_retirement"], signal: "return blocks compared with time, contribution and downside boundaries" },
  { pattern: /집값|월세|전세|주거비/, subtopics: ["housing_asset_gap"], signal: "the visible home cost opened to reveal all recurring monthly drains" },
  { pattern: /잔고|명세서|청구서/, subtopics: ["anxiety_avoidance", "interest_debt"], signal: "one avoided balance opened before several due dates converge" },
  { pattern: /비상금|불황|위기/, subtopics: ["crisis_risk", "anxiety_avoidance"], signal: "essential expenses consuming a finite emergency runway month by month" },
  { pattern: /노후|은퇴|연금/, subtopics: ["time_retirement"], signal: "a transfer started today feeding a future-income stream across time" },
  { pattern: /숫자\s*[13]|3개|1개/, signal: "one to three separate physical markers that can be compared without written labels" },
  { pattern: /뉴스|경제\s*공부/, subtopics: ["economy_literacy"], signal: "an unlabeled news tile traced into one concrete household-money consequence" },
  { pattern: /의지|습관|순서/, subtopics: ["success_habits"], signal: "a repeated payment order changed before the next payday cycle begins" },
];

const NARRATION_VISUAL_RULES: ReadonlyArray<SubtopicScopedRule<{ pattern: RegExp; signal: string }>> = [
  { pattern: /월급|급여|연봉|수입|소득/, subtopics: ["labor_income", "success_habits"], signal: "a payday deposit entering a tray divided into obligations, spending and retained cash" },
  { pattern: /자동이체/, subtopics: ["labor_income", "success_habits", "interest_debt"], signal: "scheduled transfer tokens being physically reordered before discretionary spending" },
  { pattern: /저축|적금|비상금/, subtopics: ["success_habits", "crisis_risk", "anxiety_avoidance"], signal: "a protected savings compartment receiving money before the spending compartment" },
  { pattern: /소비|결제|카드값|신용카드/, subtopics: ["consumption_psychology", "interest_debt", "inflation_living_cost"], signal: "a real checkout or card-payment moment connected to the remaining monthly budget" },
  { pattern: /고정비|구독|정기결제/, subtopics: ["consumption_psychology", "crisis_risk"], signal: "recurring payment tokens leaving on separate dates of one monthly calendar" },
  { pattern: /대출|이자|원금|상환|빚/, subtopics: ["interest_debt"], signal: "principal, interest and payoff time separated along one repayment timeline" },
  { pattern: /할부/, subtopics: ["interest_debt", "consumption_psychology"], signal: "one purchase extending into several future card-payment slots" },
  { pattern: /장바구니|마트|식비|물가|생필품/, subtopics: ["inflation_living_cost"], signal: "the same grocery essentials consuming a visibly larger share of the household budget" },
  { pattern: /할인|쿠폰|세일|대용량/, subtopics: ["inflation_living_cost", "consumption_psychology"], signal: "a discount cue adding an unplanned object beside the planned purchase" },
  { pattern: /배달|야식|음식\s*주문/, subtopics: ["inflation_living_cost", "consumption_psychology"], signal: "a one-tap food order repeating against a bounded meal budget" },
  { pattern: /원클릭|간편결제|저장된 결제/, subtopics: ["consumption_psychology"], signal: "a hand reaching checkout before a deliberate pause barrier" },
  { pattern: /집값|월세|전세|주거비|관리비/, subtopics: ["housing_asset_gap"], signal: "a full-scale home interior opened into mortgage or rent, management and commute cost zones" },
  { pattern: /주식|투자|매수|매도|종목|수익률/, subtopics: ["investing_assets"], signal: "an order decision beside its written-reason marker, loss boundary and household cash buffer" },
  { pattern: /뉴스|금리|환율|고용|실업|경기/, subtopics: ["economy_literacy"], signal: "one external news signal traced into a household expense, debt payment or paycheck" },
  { pattern: /앱|명세서|잔고|청구서|계좌/, signal: "one opened financial record beside the exact balance or due-date object being checked" },
  { pattern: /친구|모임|관계|체면|비교/, subtopics: ["sns_comparison"], signal: "a group-spending moment pressing against one protected personal budget boundary" },
  { pattern: /노후|연금|은퇴/, subtopics: ["time_retirement"], signal: "a transfer starting today and feeding a future-income stream across a calendar timeline" },
  { pattern: /보험|위기|불황|해고/, subtopics: ["crisis_risk"], signal: "essential expenses consuming a finite emergency runway month by month" },
  { pattern: /목표|의지|결심/, subtopics: ["success_habits"], signal: "a large goal marker left unchanged while the small recurring payment order continues below it" },
  { pattern: /습관|순서|반복/, subtopics: ["success_habits"], signal: "the same monthly sequence repeating until one payment token is moved ahead of another" },
  { pattern: /한도|예산|비율/, signal: "a hard spending boundary separating the protected amount from the available amount" },
  { pattern: /기록|적어|작성|표시/, signal: "a hand placing one blank marker beside the money object being tracked, without readable text" },
  { pattern: /시간|늦|미루|다음 달/, signal: "calendar pages advancing while the required monthly amount or cost grows" },
  { pattern: /남는|남아|자산/, subtopics: ["labor_income", "success_habits", "time_retirement"], signal: "the retained-cash compartment staying visible after every other payment leaves" },
];

const ACTION_VISUAL_RULES: ReadonlyArray<SubtopicScopedRule<{ pattern: RegExp; action: string }>> = [
  { pattern: /옮겨|앞 순서|먼저\s*(?:옮겨|보내|빼|이체)/, subtopics: ["labor_income", "success_habits"], action: "a hand moves the protected transfer token physically ahead of the spending token" },
  { pattern: /분리|나눠|따로/, action: "hands separate mixed money objects into clearly bounded compartments" },
  { pattern: /열어|열고|확인|봐/, action: "a hand opens one statement or account object and checks one concrete condition" },
  { pattern: /계산|합쳐|총액/, action: "hands assemble all cost pieces into one complete monthly total" },
  { pattern: /해지|끊어|결제\s*경로를?\s*꺼/, subtopics: ["consumption_psychology"], action: "a hand removes one recurring charge or closes one payment path" },
  { pattern: /기록|적어|작성|표시/, action: "a hand places one tracking marker beside the measured money object" },
  { pattern: /비교/, action: "two real alternatives are placed side by side under the same protected boundary" },
  { pattern: /기다려|멈춰|미뤄/, subtopics: ["consumption_psychology", "inflation_living_cost"], action: "the payment hand stops behind a physical pause barrier before checkout" },
  { pattern: /정해|설정|한도/, action: "a hand fixes a hard boundary before the tempting choice enters the frame" },
];

const SCENE_SETTING_VARIANTS: Record<FinanceEditorialSubtopicId, readonly string[]> = {
  economy_literacy: ["a kitchen table with one household bill and an unlabeled news tile", "a commute-side coffee counter with a paycheck object and news alert tile", "a small office break area where a news signal reaches one real expense", "a home entry console holding one bill, one grocery object and one folded news tile", "a bright neighborhood market counter where one news signal reaches a real household purchase"],
  inflation_living_cost: ["a neighborhood grocery checkout with the same essential basket", "a home pantry counter beside a bounded weekly food tray", "a convenience-store basket beside a small household spending compartment", "a kitchen table comparing planned essentials with one tempting extra", "a sunlit local market stall where planned essentials sit inside one clear budget boundary"],
  interest_debt: ["a quiet home desk with a repayment calendar and separated principal markers", "a bank consultation table focused on one loan statement", "a kitchen counter where card installments meet the monthly paycheck", "a small study desk with due-date slots and an emergency-cash compartment", "a bright dining counter where principal, interest and payoff time occupy separate tactile lanes"],
  consumption_psychology: ["a sofa-side phone checkout beside unopened parcels", "a late-night kitchen counter with a one-tap order and a budget boundary", "a store checkout where the hand pauses before payment", "a bedroom side table with a cart object, stress cue and saved-payment path", "a daylight cafe counter where an impulse cue stops before the payment boundary"],
  sns_comparison: ["a cafe group table beside one protected personal budget", "a home desk where a glossy feed tile faces a real wallet", "an event entrance with a group-spending choice and private limit", "a dressing-area counter where a comparison feed presses against planned expenses", "a bright weekend gathering space where a social choice remains outside the protected budget lane"],
  labor_income: ["a payday kitchen table divided into fixed costs, spending and retained cash", "a small office desk just after a deposit arrives", "a home entry console where a new paycheck meets recurring obligations", "a side-income workspace with tax, living-cost and savings compartments", "a sunlit coworking counter where new income is divided before lifestyle spending begins"],
  investing_assets: ["a calm home investment desk separated from the household cash buffer", "a small study table with one order ticket and three risk markers", "a living-room side desk where price movement stops at a loss boundary", "a compact workspace with portfolio position, exit condition and emergency cash", "a bright window-side planning counter where an order marker stops before protected household cash"],
  housing_asset_gap: ["a full-scale dining and entry area opened into separate monthly housing-cost zones", "a rental viewing counter with deposit, commute and management-cost objects", "a home-planning desk where mortgage cost meets the paycheck", "a contract table with the visible home price separated from recurring drains", "a sunlit apartment entry where housing cost, commute and emergency cash occupy separate full-scale zones"],
  anxiety_avoidance: ["a bedside table with one closed account object and approaching due dates", "a kitchen counter with unopened bills and one chosen next action", "a home desk where one avoided balance is finally opened", "an entryway console where several due dates converge around one bill", "a bright morning table where one opened balance sits beside one manageable next step"],
  success_habits: ["a payday kitchen table where saving and spending compete for first position", "a home desk with an automatic-transfer sequence before checkout", "an entry console showing the same payment order repeating each month", "a small office desk where one retained-cash compartment survives payday", "a sunny breakfast counter where the protected transfer moves ahead of everyday spending"],
  crisis_risk: ["a kitchen table with essential expenses and a finite emergency runway", "a home desk where an income interruption reaches debt and cards", "a pantry counter showing removable costs beside protected essentials", "a small living room setup with runway months and switchable optional costs", "a bright utility area where protected essentials remain while optional costs are switched off"],
  time_retirement: ["a home desk where today's transfer begins a long calendar timeline", "a kitchen table connecting current spending to a future-income compartment", "a quiet study with monthly contribution markers advancing across years", "a payday counter where a small present transfer feeds a distant income stream", "a sunlit hallway of calendar windows where one present contribution reaches a future income zone"],
};

const STAGE_CAUSAL_COMPOSITIONS: Record<FinanceVisualStage, string> = {
  hook: "compose the contradiction left-to-right so the viewer sees the tempting or familiar choice before its hidden result",
  problem: "use a three-step causal depth: trigger in front, mechanism in the middle, financial consequence behind",
  situation: "use an eye-level lived-in scene with the decision hand, the real object and the budget boundary all physically connected",
  consequence: "use a clean before-and-after or protected-versus-cost split with an unmistakable transfer of money, time or choice",
  psychology: "place the emotional trigger nearest the person, the ignored condition just outside their attention and the consequence still visible",
  mindset: "show the old order being physically rearranged into the new rule within the same coherent space",
  habit: "center the acting hands and show the completed state immediately beside the action, not as a distant symbol",
  recommendation: "show one repeatable system with its success condition already protected",
  save: "carry the changed system forward and show why the viewer would need to recall it in the same future situation",
};

const STAGE_VISUAL_FORMS: Record<FinanceVisualStage, string> = {
  hook: "a bright human-scale 3D story moment with one foreground decision and one clearly connected household consequence behind it",
  problem: "a lived-in room scene where trigger, decision object and consequence remain readable across three natural depth planes",
  situation: "an environmental 3D story scene where the recurring adult completes one small action inside a recognizable everyday place",
  consequence: "a clean everyday before-and-after or protected-versus-cost arrangement with the changed value physically legible",
  psychology: "an intimate lived-in scene where a restrained gaze, ignored condition and nearby consequence remain visible without fantasy symbolism",
  mindset: "a forward-looking everyday reorganization where the old order is calmly replaced by one clear protective standard",
  habit: "a tactile hands-on 3D action moment with the completed result immediately beside the action",
  recommendation: "an organized repeatable household or work routine with the success condition already protected",
  save: "a warm future recall scene that carries the changed rule into a new everyday situation with open directional depth",
};

const STAGE_CAMERA_PLANS: Record<FinanceVisualStage, string> = {
  hook: "candid eye-level three-quarter medium-wide view with off-center character placement and clear foreground-to-background separation",
  problem: "natural side three-quarter view that reveals cause, action and result across three lived-in depth layers",
  situation: "eye-level environmental medium-wide view with the person, decision object and surrounding place all readable",
  consequence: "gentle split-depth comparison or close evidence view, clearly unlike the situation scene",
  psychology: "intimate eye-level or over-shoulder view with room around the ignored condition and no theatrical body pose",
  mindset: "eye-level forward-looking view with a clear opening direction and more breathing room than the psychology scene",
  habit: "close 45-degree action view centered on naturally grounded hands and the changed state",
  recommendation: "clean eye-level or soft three-quarter routine view with tactile caption space and no diagram-like machine geometry",
  save: "wide resolved side or rear three-quarter view with a relaxed silhouette and visible everyday destination",
};

const STAGE_LIGHTING_PLANS: Record<FinanceVisualStage, string> = {
  hook: "bright natural daylight with warm color bounce, open facial shadows and one restrained topic accent",
  problem: "clear window or practical side light with open shadows separating cause, action and result",
  situation: "warm-neutral daylight or practical 3D light appropriate to the everyday setting",
  consequence: "clean bright evidence light with one gentle accent marking the changed result",
  psychology: "soft reflective daylight with clear facial exposure and restrained contrast around the emotional trigger",
  mindset: "brighter transitional daylight entering from the direction of the new standard",
  habit: "clear warm task light that makes the action and completed state immediately legible",
  recommendation: "bright natural or practical light with calm, even depth and warm material response",
  save: "hopeful daylight or soft golden bounce that resolves the sequence without repeating the hook lighting",
};

const STAGE_MOTION_PLANS: Record<FinanceVisualStage, string> = {
  hook: "a brief gaze shift toward the topic object, one small hand decision and a slow lateral camera drift across the foreground",
  problem: "one object or hand completes the cause-to-result transfer while the camera makes a restrained side move through three depth planes",
  situation: "a natural eye movement, one purposeful hand action, a gentle weight shift and subtle fabric or nearby-object response",
  consequence: "the changed object state settles while the camera makes a short evidence-focused push and the background remains calm",
  psychology: "a restrained eye or head turn toward the ignored condition, quiet breathing and a nearly still camera with slight depth parallax",
  mindset: "one calm reordering gesture, a small posture release and a gentle camera move toward the newly opened direction",
  habit: "fingers complete one concrete step, the story prop settles and the camera holds a tactile close-action drift",
  recommendation: "one repeatable placement or check finishes, followed by a small confirming gaze and a stable camera push",
  save: "a measured head or eye turn toward the open next step, one settled story prop and a slow forward camera drift through room depth",
};

const CONTINUATION_FORM_VARIANTS = [
  "focus this continuation beat on the initiating choice in the foreground",
  "focus this continuation beat on the moving mechanism in the middle depth",
  "focus this continuation beat on the resulting condition in open background depth",
] as const;

function continuationVariant(partIndex: number, partCount: number): string {
  if (partCount <= 1) return "single semantic beat";
  return CONTINUATION_FORM_VARIANTS[Math.min(partIndex, CONTINUATION_FORM_VARIANTS.length - 1)];
}

export function financeVisualDifferenceCount(
  previous: FinanceVisualEvidence,
  current: FinanceVisualEvidence,
): number {
  const fields: Array<keyof Pick<FinanceVisualEvidence,
    "sceneSetting" | "visualForm" | "cameraPlan" | "lightingPlan" | "motionPlan" | "heroSubject" | "visibleAction" | "causalComposition"
  >> = ["sceneSetting", "visualForm", "cameraPlan", "lightingPlan", "motionPlan", "heroSubject", "visibleAction", "causalComposition"];
  return fields.reduce((count, field) => count + (previous[field] !== current[field] ? 1 : 0), 0);
}

export function financeVisualSequencePass(items: readonly FinanceVisualEvidence[]): boolean {
  return items.every((item, index) =>
    item.visualStyle === FINANCE_VISUAL_STYLE_CONTRACT &&
    (index === 0 || financeVisualDifferenceCount(items[index - 1], item) >= FINANCE_VISUAL_MIN_ADJACENT_DIFFERENCES));
}

const LANE_VISUAL_PROOFS: Record<FinanceEditorialLane, string> = {
  psychology_gap: "contrast the emotional trigger with the financial condition that was skipped",
  reversal: "make the expected outcome and the actual opposite outcome visible in the same causal frame",
  wealth_standard: "show the protected boundary or retained share that defines success, not a luxury symbol",
  number_gap: "show one to three directly comparable quantities through physical size, count or spacing without written labels",
  action_one: "center one observable hand action that changes the money outcome immediately",
  habit_exposure: "show the repeated monthly cycle and the exact point where the harmful order repeats",
  warning: "show a concrete boundary being crossed and the cost that appears immediately after it",
  recovery: "show the current disorder becoming one feasible first step, without a miraculous jump",
  economic_signal: "trace one external signal through a visible path into one household expense, debt or income result",
};

function compact(value: string, max = 240): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}...`;
}

function ruleAppliesToSubtopic(
  rule: SubtopicScopedRule<object>,
  financeSubtopic: FinanceEditorialSubtopicId,
): boolean {
  return !rule.subtopics || rule.subtopics.includes(financeSubtopic);
}

function titleSpecificSignal(
  title: string,
  narration: string,
  kit: DomainVisualKit,
  financeSubtopic: FinanceEditorialSubtopicId,
): string {
  const text = `${title} ${narration}`;
  const matched = TITLE_SIGNAL_RULES
    .filter((rule) => ruleAppliesToSubtopic(rule, financeSubtopic) && rule.pattern.test(text))
    .map((rule) => rule.signal);
  return [...new Set(matched)].slice(0, 2).join("; ") || kit.context;
}

function sceneSpecificSignals(
  title: string,
  narration: string,
  fallback: string,
  financeSubtopic: FinanceEditorialSubtopicId,
): string {
  const text = `${title} ${narration}`;
  const matched = NARRATION_VISUAL_RULES
    .filter((rule) => ruleAppliesToSubtopic(rule, financeSubtopic) && rule.pattern.test(text))
    .map((rule) => rule.signal);
  const fallbackSignals = fallback.split(";").map((signal) => signal.trim()).filter(Boolean);
  return [...new Set([...fallbackSignals, ...matched])].slice(0, 2).join("; ");
}

function narrationAction(
  narration: string,
  financeSubtopic: FinanceEditorialSubtopicId,
): string | null {
  return ACTION_VISUAL_RULES.find((rule) =>
    ruleAppliesToSubtopic(rule, financeSubtopic) && rule.pattern.test(narration))?.action ?? null;
}

function deterministicChoice(values: readonly string[], key: string): string {
  const hash = createHash("sha1").update(key).digest();
  return values[hash.readUInt32BE(0) % values.length];
}

const STAGE_SETTING_OFFSET: Record<FinanceVisualStage, number> = {
  hook: 0,
  problem: 2,
  situation: 4,
  consequence: 6,
  psychology: 8,
  mindset: 9,
  habit: 10,
  recommendation: 12,
  save: 14,
};

function stageDistinctSetting(
  values: readonly string[],
  title: string,
  stage: FinanceVisualStage,
  partIndex: number,
): string {
  const base = values.indexOf(deterministicChoice(values, title));
  return values[(base + STAGE_SETTING_OFFSET[stage] + partIndex) % values.length];
}

function continuityState(stage: FinanceVisualStage, partIndex: number, partCount: number): string {
  if (stage === "save") {
    return partIndex >= partCount - 1
      ? "the continuity marker repeats forward in a stable rhythm, proving the new system continues"
      : "the continuity marker is now upright and protected beside the recall condition";
  }
  const states: Record<Exclude<FinanceVisualStage, "save">, string> = {
    hook: "the continuity marker appears displaced or unprotected beside the opening contradiction",
    problem: "the same small marker is pulled into the harmful mechanism without becoming the hero",
    situation: "the marker sits inside the real household setting under pressure from the ordinary choice",
    consequence: "the marker has visibly lost space, time or value on the cost side of the comparison",
    psychology: "the marker remains ignored behind the emotional trigger and the person's decision gesture",
    mindset: "the marker is repositioned as a protective boundary ahead of the costly choice",
    habit: "the acting hand secures the marker in the new order and leaves the completed state visible",
    recommendation: "the marker remains protected inside the repeatable system",
  };
  return states[stage];
}

function stageEvidence(
  stage: FinanceVisualStage,
  signal: string,
  kit: DomainVisualKit,
  partIndex: number,
  partCount: number,
): Pick<FinanceVisualEvidence, "heroSubject" | "mustShow" | "visibleAction"> {
  const [primarySignal, secondarySignal] = signal.split(";").map((item) => item.trim()).filter(Boolean);
  const causalResult = secondarySignal || kit.result;
  switch (stage) {
    case "hook":
      return {
        heroSubject: `the title-specific money event: ${primarySignal}`,
        mustShow: `the title's contradiction in one frame: ${primarySignal}, visibly and directly changing ${causalResult}`,
        visibleAction: "freeze the exact decision moment that creates the contradiction",
      };
    case "problem":
      return {
        heroSubject: `the hidden title-specific mechanism: ${primarySignal}`,
        mustShow: `the hidden cause operating step by step: ${primarySignal}, then ${causalResult}`,
        visibleAction: "show the cause moving value from the starting object into the later consequence",
      };
    case "situation":
      return {
        heroSubject: `the recognizable everyday decision: ${primarySignal}`,
        mustShow: `a recognizable everyday moment where ${primarySignal}; keep ${causalResult} as the one supporting condition`,
        visibleAction: "show a hand or faceless figure making the ordinary choice described by the narration",
      };
    case "consequence":
      return {
        heroSubject: `the measurable title-specific result: ${primarySignal}`,
        mustShow: `a before-and-after or split comparison proving how ${primarySignal} changes ${causalResult}`,
        visibleAction: "make money, time or choice visibly move from the protected side to the cost side",
      };
    case "psychology":
      return {
        heroSubject: kit.trigger,
        mustShow: `one faceless person caught between ${kit.trigger} and ${kit.control}`,
        visibleAction: "show the emotional trigger pulling the decision before the financial condition is checked",
      };
    case "mindset":
      return {
        heroSubject: kit.control,
        mustShow: `the old confusion reorganized into this new success standard: ${kit.control}`,
        visibleAction: "place the protective condition before the tempting or costly choice",
      };
    case "habit":
    case "recommendation":
      return {
        heroSubject: kit.action,
        mustShow: `hands completing the narration's concrete action with the real domain objects: ${kit.action}`,
        visibleAction: kit.action,
      };
    case "save": {
      const finalBeat = partIndex >= partCount - 1;
      return finalBeat
        ? {
            heroSubject: kit.future,
            mustShow: `the completed action continuing into a distinct future result: ${kit.future}`,
            visibleAction: "leave one small continuity marker leading forward, without repeating the opening hero",
          }
        : {
            heroSubject: kit.control,
            mustShow: `a recall trigger placed beside the changed environment: ${kit.control}`,
            visibleAction: "place a small bookmark-like token beside the condition the viewer should revisit",
          };
    }
  }
}

const CAPTION_SAFE_ZONE_BY_STAGE: Record<FinanceVisualStage, string> = {
  hook: "upper-middle clear textured area",
  problem: "lower-middle clear textured area",
  situation: "lower-middle clear textured area",
  consequence: "upper-middle clear textured area",
  psychology: "upper or side-middle area away from the person's decision gesture",
  mindset: "upper-middle area above the reorganized system",
  habit: "lower-middle area away from the acting hands",
  recommendation: "upper-middle area above the completed action",
  save: "alternating upper-middle or lower-middle area away from the continuity object",
};

export function buildFinanceVisualEvidence(input: {
  title: string;
  narration: string;
  stage: FinanceVisualStage;
  financeSubtopic: FinanceEditorialSubtopicId;
  editorialLane: FinanceEditorialLane;
  partIndex?: number;
  partCount?: number;
  problemStatement?: string;
  twist?: string;
  takeawayAction?: string;
}): FinanceVisualEvidence {
  const override = topicVisualOverride(input.title);
  const kit = override
    ? { ...DOMAIN_VISUAL_KITS[input.financeSubtopic], ...override.kit }
    : DOMAIN_VISUAL_KITS[input.financeSubtopic];
  const partIndex = Math.max(0, Number(input.partIndex) || 0);
  const partCount = Math.max(1, Number(input.partCount) || 1);
  const claim = compact(input.narration, 320);
  const titleSignal = titleSpecificSignal(input.title, claim, kit, input.financeSubtopic);
  const specificSignal = sceneSpecificSignals(input.title, claim, titleSignal, input.financeSubtopic);
  const stagePlan = stageEvidence(input.stage, specificSignal, kit, partIndex, partCount);
  const actionSignal = (["mindset", "habit", "recommendation", "save"] as FinanceVisualStage[]).includes(input.stage)
    ? narrationAction(claim, input.financeSubtopic)
    : null;
  const explicitStageSettings = override?.stageSettings?.[input.stage];
  const setting = explicitStageSettings?.length
    ? explicitStageSettings[partIndex % explicitStageSettings.length]
    : stageDistinctSetting(
        override?.settings ?? SCENE_SETTING_VARIANTS[input.financeSubtopic],
        input.title,
        input.stage,
        partIndex,
      );
  const continuation = continuationVariant(partIndex, partCount);
  const visualForm = `${STAGE_VISUAL_FORMS[input.stage]}; ${continuation}`;
  const cameraPlan = `${STAGE_CAMERA_PLANS[input.stage]}; ${continuation}`;
  const lightingPlan = STAGE_LIGHTING_PLANS[input.stage];
  const motionPlan = `${STAGE_MOTION_PLANS[input.stage]}; ${FINANCE_VISUAL_MOTION_CONTRACT}`;
  const splitBeatHero = partCount > 1
    ? `${stagePlan.heroSubject}; beat ${partIndex + 1} isolates ${
        partIndex === 0 ? "the initiating choice" : partIndex === partCount - 1 ? "the resulting condition" : "the intermediate mechanism"
      }`
    : stagePlan.heroSubject;
  const sceneIdentity = createHash("sha1").update([
    FINANCE_VISUAL_EVIDENCE_VERSION,
    input.title,
    input.financeSubtopic,
    input.editorialLane,
    input.stage,
    partIndex,
    claim,
  ].join("|")).digest("hex").slice(0, 12);
  const editorialContext = [input.problemStatement, input.twist, input.takeawayAction]
    .filter(Boolean).map((value) => compact(String(value), 90)).join(" -> ");
  return {
    version: FINANCE_VISUAL_EVIDENCE_VERSION,
    sceneIdentity,
    stage: input.stage,
    financeSubtopic: input.financeSubtopic,
    editorialLane: input.editorialLane,
    claim,
    visualStyle: FINANCE_VISUAL_STYLE_CONTRACT,
    titleSpecificSignal: titleSignal,
    sceneSpecificSignal: specificSignal,
    sceneSetting: `${setting}; arrange this place specifically for ${visualForm}`,
    visualForm,
    cameraPlan,
    lightingPlan,
    sceneIntegrationPlan: FINANCE_VISUAL_SCENE_INTEGRATION_CONTRACT,
    motionPlan,
    differenceContract: "keep the same bright integrated 3D animation language, but change at least four of setting, visual form, camera, lighting, motion, hero, action and causal layout from the adjacent scene",
    heroSubject: `${splitBeatHero}; grounded by ${specificSignal}`,
    mustShow: `${stagePlan.mustShow}; stage it in ${setting}; make the claim-specific objects physically interact rather than pose as symbols`,
    visibleAction: actionSignal ? `${stagePlan.visibleAction}; specifically, ${actionSignal}` : stagePlan.visibleAction,
    economicMeaning: compact(editorialContext || claim, 260),
    editorialProof: LANE_VISUAL_PROOFS[input.editorialLane],
    causalComposition: STAGE_CAUSAL_COMPOSITIONS[input.stage],
    continuityAnchor: kit.continuity,
    continuityState: continuityState(input.stage, partIndex, partCount),
    captionSafeZone: CAPTION_SAFE_ZONE_BY_STAGE[input.stage],
    mustNotShow: [
      kit.forbidden,
      "generic stairs or forked paths used as a substitute for the actual mechanism",
      "floating receipt fragments, envelopes, coins, cards or charts unless the narration requires them",
      "an image that could be reused unchanged for the previous or next scene",
      "a set of relevant finance props merely posed together without the narration's cause, decision and result",
      "photography, live action, documentary realism, a photorealistic room or a photorealistic person",
      "a miniature, dollhouse, diorama, cutaway toy room or repeated isometric tabletop scene",
      "a laboratory, vault, factory, machine room, black-metal architecture or industrial finance apparatus",
      "a lunging pose, reaching toward the camera, superhero stance, fantasy energy effect or exaggerated shock",
      "a showroom-perfect advertising set, catalog portrait, cutout character, pasted-on subject, green-screen edge or composited look",
      "a person whose face, age, hairstyle, hair color, body proportions or fixed wardrobe differs from the selected character reference, or a copied multi-view identity-board layout",
      "readable text, numbers, logos, UI or a photorealistic face",
    ].join("; "),
  };
}

export function financeVisualEvidenceToCue(evidence: FinanceVisualEvidence): string {
  return [
    `Visual evidence contract: ${evidence.version}.`,
    `Scene identity: ${evidence.sceneIdentity}.`,
    `Claim: "${evidence.claim}".`,
    `Visual style contract: ${evidence.visualStyle}.`,
    `Character continuity contract ${FINANCE_VISUAL_CHARACTER_CONTINUITY_VERSION}: ${FINANCE_VISUAL_CHARACTER_CONTINUITY}.`,
    `Title-specific signal: ${evidence.titleSpecificSignal}.`,
    `Scene-specific signal: ${evidence.sceneSpecificSignal}.`,
    `Scene setting: ${evidence.sceneSetting}.`,
    `Visual form: ${evidence.visualForm}.`,
    `Camera plan: ${evidence.cameraPlan}.`,
    `Lighting plan: ${evidence.lightingPlan}.`,
    `Scene integration plan: ${evidence.sceneIntegrationPlan}.`,
    `Motion contract ${FINANCE_VISUAL_MOTION_CONTRACT_VERSION}: ${evidence.motionPlan}.`,
    `Difference contract: ${evidence.differenceContract}.`,
    `Hero subject: ${evidence.heroSubject}.`,
    `Must show: ${evidence.mustShow}.`,
    `Visible action: ${evidence.visibleAction}.`,
    `Economic meaning: ${evidence.economicMeaning}.`,
    `Editorial proof: ${evidence.editorialProof}.`,
    `Causal composition: ${evidence.causalComposition}.`,
    `Continuity anchor only: ${evidence.continuityAnchor}.`,
    `Continuity state: ${evidence.continuityState}.`,
    `Caption safe zone: ${evidence.captionSafeZone}.`,
    `Must not show: ${evidence.mustNotShow}.`,
  ].join(" ");
}
