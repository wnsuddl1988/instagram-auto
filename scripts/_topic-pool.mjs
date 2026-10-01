/**
 * 소재 후보 풀 생성기 (2026-10-01, Owner "자꾸 찾아달라고 할 때마다 몇 개 안 나오냐 / 누락 없이 다 보고").
 *
 * 부엉·황소 뉴스 러너(제목+링크 형식)의 결과 파일을 파싱해 **중복을 뺀 전체 기사 목록**을 날짜순 표로 만든다.
 * 오케스트레이터가 자동으로 호출해 `CANDIDATE_POOL_*.md`를 남긴다. 보고하는 쪽(Claude)은 이 풀을 처음부터 끝까지
 * 읽고 후보로 묶어야 한다 — 눈으로 몇 개만 고르면 후보가 10개 안팎으로 줄어든다(2026-10-01 사고).
 *
 * 입력 형식(러너 출력):
 *   ──────── ① 제도 변경·시행 ────────
 *   [검색어] 제목
 *     발행: 2026-10-01T09:50:00.000Z | 매체 (T2)
 *     링크: https://...
 *
 * 비밀값·네트워크 없음.
 */
import fs from "node:fs";
import path from "node:path";

const KST_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 러너 출력 텍스트 → 항목 배열 */
export function parseNewsRunnerText(text, sourceLabel = "") {
  const items = [];
  let group = "";
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const g = /^─{2,}\s*(.+?)\s*─{2,}\s*$/.exec(line);
    if (g) {
      group = g[1];
      continue;
    }
    const head = /^\[([^\]]+)\]\s+(.+)$/.exec(line);
    if (!head) continue;
    const meta = /^\s*발행:\s*(\S+)\s*\|\s*(.+?)\s*(?:\(T\d\))?\s*$/.exec(lines[i + 1] ?? "");
    if (!meta) continue;
    const link = /^\s*링크:\s*(\S+)/.exec(lines[i + 2] ?? "")?.[1] ?? "";
    const published = Date.parse(meta[1]);
    items.push({
      keyword: head[1],
      title: head[2].trim(),
      publishedMs: Number.isFinite(published) ? published : null,
      outlet: meta[2].trim(),
      link,
      group,
      source: sourceLabel,
    });
  }
  return items;
}

const normTitle = (t) => t.toLowerCase().replace(/[^0-9a-z가-힣]/g, "").slice(0, 40);

/** 제목(정규화)·링크가 같은 항목을 합친다. 합쳐진 검색어는 모아 둔다. */
export function dedupeItems(items) {
  const byKey = new Map();
  for (const it of items) {
    const key = it.link ? it.link.split("?")[0] : normTitle(it.title);
    const titleKey = normTitle(it.title);
    const hit = byKey.get(key) ?? [...byKey.values()].find((x) => normTitle(x.title) === titleKey);
    if (hit) {
      hit.keywords.add(it.keyword);
      continue;
    }
    byKey.set(key, { ...it, keywords: new Set([it.keyword]) });
  }
  return [...byKey.values()];
}

export function buildPoolMarkdown({ items, nowMs = Date.now(), title }) {
  const rows = dedupeItems(items)
    .map((x) => ({ ...x, ageDays: x.publishedMs == null ? null : (nowMs - x.publishedMs) / DAY_MS }))
    .sort((a, b) => (b.publishedMs ?? 0) - (a.publishedMs ?? 0));
  const kst = (ms) => (ms == null ? "?" : new Date(ms + KST_MS).toISOString().slice(0, 16).replace("T", " "));
  const age = (d) => (d == null ? "?" : d < 1 ? "오늘" : `${Math.floor(d)}일`);
  const buckets = { today: 0, d1_3: 0, d4_14: 0, old: 0, unknown: 0 };
  for (const r of rows) {
    if (r.ageDays == null) buckets.unknown += 1;
    else if (r.ageDays < 1) buckets.today += 1;
    else if (r.ageDays < 4) buckets.d1_3 += 1;
    else if (r.ageDays <= 14) buckets.d4_14 += 1;
    else buckets.old += 1;
  }
  const md = [
    `# ${title}`,
    "",
    `기사 ${rows.length}건(중복 제외) — 오늘(24h 이내) ${buckets.today} · 1~3일 ${buckets.d1_3} · 4~14일 ${buckets.d4_14} · 14일 초과 ${buckets.old}${buckets.unknown ? ` · 날짜 불명 ${buckets.unknown}` : ""}`,
    "",
    "★ 이 표는 러너가 가져온 기사 **전부**다. 후보는 여기서 소재(사건·제도·통계) 단위로 묶어 신선한 것을 하나도 빼지 않고 올린다.",
    "★ 기사 날짜 ≠ 소식 최초일: 후속 기사일 수 있으니 상위 후보는 원문에서 \"처음 발표된 날\"을 확인하고, 오래된 소식은 후보에서 뺀다.",
    "",
    "| # | 날짜(KST) | 경과 | 그룹 | 검색어 | 제목 | 매체 | 링크 |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map((r, i) => {
      const old = r.ageDays != null && r.ageDays > 14 ? " ⚠오래됨" : "";
      const t = r.title.replace(/\|/g, "/");
      return `| ${i + 1} | ${kst(r.publishedMs)} | ${age(r.ageDays)}${old} | ${r.group} | ${[...r.keywords].join(", ")} | ${t} | ${r.outlet} | ${r.link} |`;
    }),
    "",
  ].join("\n");
  return { md, count: rows.length, buckets };
}

/** files: [{ path, label }] — 존재하는 파일만 읽는다. */
export function writeCandidatePool({ files, outPath, title, nowMs }) {
  const items = [];
  const used = [];
  for (const f of files) {
    if (!fs.existsSync(f.path)) continue;
    const parsed = parseNewsRunnerText(fs.readFileSync(f.path, "utf8"), f.label ?? path.basename(f.path));
    items.push(...parsed);
    used.push(`${f.label ?? path.basename(f.path)}(${parsed.length}건)`);
  }
  const { md, count, buckets } = buildPoolMarkdown({ items, nowMs, title });
  fs.writeFileSync(outPath, md, "utf8");
  return { count, buckets, used, outPath, rawCount: items.length };
}
