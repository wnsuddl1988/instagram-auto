/**
 * 부엉이 쇼츠 게시 메타데이터 생성 — 캡션, 해시태그, 제목.
 *
 * 조립 스펙(제목·나레이션·출처)에서 게시용 텍스트를 만든다. 사람이 매번 쓰지 않고
 * 영상 내용에서 자동으로 뽑아내되, 알고리즘에 노출되기 좋은 형태로 구성한다.
 *
 * 캡션 구조(위에서부터 중요도 순):
 *   1. 훅 — 첫 두 줄이 "더 보기" 전에 노출된다. 여기서 안 잡으면 안 읽힌다.
 *   2. 핵심 요약 — 영상을 안 봐도 알 수 있게. 검색·추천 알고리즘이 읽는 부분.
 *   3. 행동 유도 — 저장/팔로우
 *   4. 출처 — 신뢰도
 *   5. 해시태그 — 탐색 탭 유입
 *
 * 해시태그 전략:
 *   - 대형(경쟁 치열, 노출 총량 큼) + 중형(주제 적합) + 소형(전환율 높음)을 섞는다.
 *   - 한 태그에 몰지 않고 3층으로 나누는 게 도달에 유리하다는 게 일반적 통념이다.
 *   - 인스타그램 권장은 3~5개지만 실무에서는 10~15개가 흔하다. 15개로 맞춘다.
 *   - 영상 주제에서 자동 추출한 태그 + 채널 고정 태그를 합친다.
 */

/** 주제 키워드 → 해시태그 매핑. 새 주제가 나오면 여기에 추가한다. */
const TOPIC_TAG_MAP = Object.freeze({
  기준금리: ["기준금리", "한국은행", "금리인상"],
  금리: ["금리", "금리인상", "이자"],
  카드론: ["카드론", "카드대출", "대출금리"],
  리볼빙: ["리볼빙", "신용카드", "카드값"],
  여전채: ["여신전문금융채", "채권금리"],
  대출: ["대출", "대출금리", "빚테크"],
  마이너스통장: ["마이너스통장", "마통"],
  예금: ["예금", "적금", "예적금"],
  환율: ["환율", "달러"],
  물가: ["물가", "인플레이션"],
  부동산: ["부동산", "전세", "월세"],
  전세난: ["전세난", "전세사기", "전세보증금"],
  안심신탁: ["전세보증", "HUG", "전세계약"],
  갱신청구권: ["전세갱신", "임대차보호법"],
  주식: ["주식", "투자"],
  가계부채: ["가계부채", "가계대출", "부채관리"],
  변동금리: ["변동금리", "고정금리", "대출갈아타기"],
  "총량 규제": ["대출규제", "가계부채규제"],
});

/** 채널 정체성 태그 — 모든 편에 공통으로 붙는다. */
const CHANNEL_TAGS = Object.freeze([
  "경제번역소",
  "경제뉴스",
  "경제상식",
  "재테크",
  "돈공부",
]);

/** 포맷 태그 — 플랫폼마다 다르다. 유튜브에 "릴스"를 붙이면 어색하다. */
const FORMAT_TAGS_INSTAGRAM = Object.freeze(["릴스", "릴스추천", "economy"]);
const FORMAT_TAGS_YOUTUBE = Object.freeze(["Shorts", "쇼츠", "economy"]);

const MAX_HASHTAGS = 15;

/** 나레이션 전체에서 주제 키워드를 찾아 해시태그를 모은다. */
function topicTagsFrom(scenes) {
  const text = scenes.map((scene) => scene.narration).join(" ");
  const tags = [];
  for (const [keyword, mapped] of Object.entries(TOPIC_TAG_MAP)) {
    if (text.includes(keyword)) {
      for (const tag of mapped) if (!tags.includes(tag)) tags.push(tag);
    }
  }
  return tags;
}

/** 화면 오버레이에 쓰인 출처를 중복 없이 모은다. */
function sourcesFrom(scenes) {
  const sources = [];
  for (const scene of scenes) {
    for (const overlay of scene.overlays ?? []) {
      if (overlay.kind === "source" && !sources.includes(overlay.text)) {
        sources.push(overlay.text);
      }
    }
  }
  return sources;
}

/**
 * 나레이션에서 핵심 문장을 고른다.
 * hook은 훅으로 따로 쓰고, 본문 요약에는 사실·전개·행동 장면을 쓴다.
 */
function summaryLinesFrom(scenes) {
  const pickRoles = ["evidence_card", "twist", "impact", "action"];
  return scenes
    .filter((scene) => pickRoles.includes(scene.role))
    .map((scene) => scene.narration.replace(/\s+/g, " ").trim());
}

/** 문장 끝을 정리한다. 캡션에서는 반말 종결이 자연스럽다. */
function tidy(text) {
  return String(text).replace(/\s+/g, " ").trim();
}

/**
 * 조립 매니페스트의 timeline 으로 YouTube 챕터 목록을 만든다.
 *
 * YouTube 챕터 인식 조건이 까다롭다:
 *   - 첫 챕터는 반드시 00:00
 *   - 최소 3개
 *   - 각 챕터 10초 이상
 * 장면이 8개여도 대부분 10초 미만이라 그대로 쓰면 인식되지 않는다. 인접 장면을
 * 10초 넘을 때까지 묶어서 만든다.
 */
function buildChapters(timeline, chapterLabels, sceneRoleByKey) {
  if (!Array.isArray(timeline) || timeline.length === 0) return [];
  const MIN_CHAPTER_SEC = 10;
  const chapters = [];
  let pending = null;

  for (const entry of timeline) {
    const role = sceneRoleByKey.get(entry.key);
    const label = chapterLabels[role] ?? role ?? entry.key;
    if (!pending) {
      pending = { start: entry.start, duration: entry.duration, label };
    } else {
      pending.duration += entry.duration;
    }
    if (pending.duration >= MIN_CHAPTER_SEC) {
      chapters.push(pending);
      pending = null;
    }
  }
  // 남은 조각은 마지막 챕터에 붙인다(따로 두면 10초 미만이라 무효).
  if (pending) {
    if (chapters.length > 0) chapters[chapters.length - 1].duration += pending.duration;
    else chapters.push(pending);
  }
  if (chapters.length < 3) return []; // 조건 미달이면 아예 넣지 않는다
  return chapters.map((chapter) => ({
    ...chapter,
    timestamp: formatTimestamp(chapter.start),
  }));
}

function formatTimestamp(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(1, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 게시 메타데이터를 만든다.
 * @param {object} spec OWL_ASSEMBLY_SPEC
 * @param {object} [options]
 * @param {Array}  [options.timeline] 조립 매니페스트의 timeline (챕터 생성용)
 */
export function buildOwlPublishMetadata(spec, options = {}) {
  const scenes = spec.scenes ?? [];
  const hook = tidy(scenes.find((scene) => scene.role === "hook")?.narration ?? "");
  const summary = summaryLinesFrom(scenes);
  const sources = sourcesFrom(scenes);
  const channel = spec.channelName ?? "";

  // Instagram 캡션 전용 후킹 문구(2026-09-18 Owner: "대본을 그대로 써놨다,
  // 후킹내용으로 써달라"). 스펙에 없으면 훅 나레이션으로 폴백하되, 없는 편이
  // 새로 나올 때마다 반드시 instagramCaptionHook/instagramCaptionPoints를
  // 채워야 한다는 뜻이므로 조용히 넘어가지 않고 경고를 남긴다.
  const igHook = tidy(spec.instagramCaptionHook ?? hook);
  const igPoints = Array.isArray(spec.instagramCaptionPoints) && spec.instagramCaptionPoints.length > 0
    ? spec.instagramCaptionPoints.map(tidy)
    : null;
  if (!igPoints) {
    console.error("WARN: instagramCaptionPoints 가 스펙에 없어 대본 나레이션을 그대로 씁니다 — 후킹형 캡션이 아닙니다.");
  }

  // 층별로 자리를 미리 배분한다. 단순히 이어붙여 자르면 주제 태그가 전부
  // 차지해서 채널 브랜딩 태그가 잘려나간다 — 그러면 편이 쌓여도 채널 검색에
  // 걸리지 않는다.
  // topicTagsFrom은 나레이션 키워드 매칭이라 부수적으로 등장한 단어(3편의
  // "실거주 유도 규제"에 걸린 "대출")가 실제 주제(전세난)보다 앞자리를 차지할
  // 수 있다. spec.instagramPriorityTags가 있으면 그걸 먼저 두고, 자동 추출
  // 결과는 그 뒤를 채운다(2026-09-18, Owner 후킹 캡션 지적과 같은 맥락).
  const priorityTags = Array.isArray(spec.instagramPriorityTags) ? spec.instagramPriorityTags : [];
  const autoTopicTags = topicTagsFrom(scenes).filter((tag) => !priorityTags.includes(tag));
  const topicTags = [...priorityTags, ...autoTopicTags].slice(0, MAX_HASHTAGS - CHANNEL_TAGS.length - 3);
  const composeTags = (formatTags) => [
    ...topicTags,
    ...CHANNEL_TAGS,
    ...formatTags,
  ].filter((tag, index, all) => all.indexOf(tag) === index).slice(0, MAX_HASHTAGS);

  const hashtags = composeTags(FORMAT_TAGS_INSTAGRAM);
  const youtubeHashtags = composeTags(FORMAT_TAGS_YOUTUBE);

  // 첫 두 줄이 피드에서 잘리지 않고 보인다. 후킹 문구를 맨 위에 둔다 — 대본을
  // 그대로 옮기지 않고, 그 편의 가장 놀라운 반전/포인트만 짧게 압축한다
  // (igPoints, 스펙에서 직접 작성). 없으면 대본 나레이션으로 폴백(WARN 발생).
  const captionParts = [
    igHook,
    "",
    ...(igPoints ?? summary.map((line) => `· ${line}`)),
    "",
    `어려운 경제 뉴스, 내 지갑 얘기로 번역해주는 ${channel}`,
    "저장해두고 다음에 또 보기 👉 팔로우",
  ];
  if (sources.length > 0) {
    captionParts.push("", `출처: ${sources.join(", ")}`);
  }
  captionParts.push("", hashtags.map((tag) => `#${tag}`).join(" "));

  // 유튜브 제목은 검색 노출이 중요해 핵심 키워드를 앞에 둔다.
  const title = tidy(spec.title ?? spec.headerTitle?.join(" ") ?? "");

  return {
    caption: captionParts.join("\n"),
    hashtags,
    title,
    youtubeHashtags,
    ...buildYoutubeMetadata({
      spec, hook, igHook, igPoints, summary, sources, channel,
      hashtags: youtubeHashtags,
      timeline: options.timeline ?? null,
    }),
  };
}

/**
 * YouTube 메타데이터 — Instagram보다 공들여야 한다.
 *
 * YouTube는 검색 엔진이다. 설명란 전체가 색인되고, 첫 3줄만 접히지 않고 보이며,
 * 타임스탬프가 있으면 검색 결과에 챕터로 노출된다. Instagram 캡션을 그대로 쓰면
 * 이 지면을 다 버리는 셈이다.
 *
 * 구성:
 *   1~3줄  — 훅 + 핵심 답. 접히기 전에 보이는 유일한 부분
 *   챕터    — 00:00 형식. 자동 챕터 생성 + 검색 결과 노출
 *   본문    — 장면별 내용 전개(검색 색인 대상)
 *   수치    — 숫자를 따로 모아둔다. "기준금리 3%" 같은 검색어에 걸리게
 *   출처    — 신뢰도 + 팩트체크 가능성
 *   채널 소개 — 구독 전환
 *   해시태그 — 제목 위에 3개까지 노출된다
 */
function buildYoutubeMetadata({ spec, hook, igHook, igPoints, summary, sources, hashtags, channel, timeline }) {
  const scenes = spec.scenes ?? [];

  // 챕터: 장면 역할을 사람이 읽을 이름으로 바꾼다. 첫 챕터는 반드시 00:00 이어야
  // YouTube가 챕터로 인식한다. 다만 각 장면 길이는 조립 시점에만 알 수 있어,
  // 실제 타임스탬프는 게시 러너가 manifest 의 timeline 으로 채운다(없으면 생략).
  const chapterLabels = {
    hook: "왜 봐야 하나",
    loss_aversion: "내 지갑에 미치는 영향",
    evidence_card: "팩트 확인",
    background: "배경 설명",
    twist: "핵심 연결고리",
    impact: "특히 조심할 것",
    action: "오늘 할 일",
    closing_cta: "정리",
  };

  // 화면에 띄운 수치를 검색용으로 모은다. 숫자가 들어간 것만 — "카드론"이나
  // "팔로우" 같은 라벨은 수치가 아니라 이 목록에 들어가면 안 된다.
  const figures = [];
  for (const scene of scenes) {
    for (const overlay of scene.overlays ?? []) {
      const isFigure = ["value", "accent", "alert"].includes(overlay.kind) &&
        /[0-9]/.test(overlay.text);
      if (isFigure && !figures.includes(overlay.text)) figures.push(overlay.text);
    }
  }

  // 접히기 전 3줄이 가장 중요한 지면이라 후킹 문구를 그대로 쓴다(Instagram과
  // 동일 기준, Owner 2026-09-18: "유튜브도 이 기준으로 해" — 대본을 그대로
  // 옮기지 않고 궁금증을 유발하는 카피 + 압축 포인트, 장식 이모지 없음).
  const lines = [];
  lines.push(igHook ?? hook);
  lines.push("");
  lines.push(`${channel}가 어려운 경제 뉴스를 내 지갑 얘기로 번역해드립니다.`);
  lines.push("");

  // 챕터는 요약보다 위에 둔다 — 검색 결과에 노출되는 구간이라 우선순위가 높다.
  const chapters = buildChapters(
    timeline,
    chapterLabels,
    new Map(scenes.map((scene) => [scene.key, scene.role])),
  );
  if (chapters.length > 0) {
    lines.push("챕터");
    for (const chapter of chapters) lines.push(`${chapter.timestamp} ${chapter.label}`);
    lines.push("");
  }

  lines.push("이 영상 포인트");
  for (const line of (igPoints ?? summary.map((line) => `· ${line}`))) lines.push(line.startsWith("·") ? line : `· ${line}`);
  lines.push("");

  if (figures.length > 0) {
    lines.push("영상에 나온 숫자");
    for (const figure of figures) lines.push(`· ${figure}`);
    lines.push("");
  }

  if (sources.length > 0) {
    lines.push("출처");
    for (const source of sources) lines.push(`· ${source}`);
    lines.push("");
  }

  lines.push(channel);
  lines.push("기준금리, 물가, 환율 같은 경제 뉴스가 내 통장에 어떻게 닿는지");
  lines.push("매번 숫자 하나까지 확인해서 쉽게 풀어드립니다.");
  lines.push("구독해두시면 다음 소식도 가장 먼저 받아보실 수 있습니다.");
  lines.push("");

  // 해시태그는 설명 맨 위 3개가 제목 위에 표시된다. 가장 중요한 것부터.
  lines.push(hashtags.map((tag) => `#${tag}`).join(" "));

  return {
    youtubeDescription: lines.join("\n"),
    youtubeChapterLabels: chapterLabels,
    // videos.insert 의 tags 필드용. 설명란 해시태그와 별개로 검색에 쓰인다.
    youtubeTags: buildYoutubeTags(hashtags, spec),
  };
}

/**
 * videos.insert 의 tags — 해시태그와 다르다.
 * 해시태그는 표시용이고 이쪽은 순수 검색용이라, 사람이 실제로 검색창에 칠 법한
 * 말을 넣는다. 500자 제한이 있어 길이도 관리한다.
 */
function buildYoutubeTags(hashtags, spec) {
  const searchPhrases = [];
  const text = (spec.scenes ?? []).map((scene) => scene.narration).join(" ");

  // 검색어는 단어보다 구(句)로 친다. 주제에서 자동 조합한다.
  if (text.includes("기준금리")) {
    searchPhrases.push("기준금리 인상", "기준금리 뜻", "한국은행 기준금리");
  }
  if (text.includes("카드론")) {
    searchPhrases.push("카드론 금리", "카드론 이자");
  }
  if (text.includes("리볼빙")) {
    searchPhrases.push("리볼빙 위험", "리볼빙 해지");
  }
  if (text.includes("여전채")) searchPhrases.push("여전채 금리");
  if (text.includes("가계부채")) searchPhrases.push("가계부채 비율", "가계부채 전망");
  if (text.includes("변동금리")) searchPhrases.push("변동금리 고정금리 전환", "대출 갈아타기");
  if (text.includes("총량 규제")) searchPhrases.push("대출 총량규제", "가계대출 규제");

  const all = [...hashtags, ...searchPhrases, "경제 쉽게", "경제 뉴스 요약"];
  const unique = all.filter((tag, index) => all.indexOf(tag) === index);

  // YouTube tags 총합 500자 제한. 넘지 않게 잘라낸다.
  const picked = [];
  let total = 0;
  for (const tag of unique) {
    const cost = tag.length + 1;
    if (total + cost > 480) break;
    picked.push(tag);
    total += cost;
  }
  return picked;
}
