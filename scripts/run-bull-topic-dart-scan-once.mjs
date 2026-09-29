#!/usr/bin/env node
/**
 * 황소특보 공급계약/수주 공시 스캔 — 수동 실행용(cron 없음).
 *
 * DART list.json을 corpCode 생략(전체 시장 대상)으로 조회해서, 오늘 나온 전체
 * 공시 중 제목에 "공급계약"/"수주" 관련 키워드가 들어간 것만 걸러 보여준다.
 *
 * ★종목명은 이 스크립트가 자동으로 대본에 넣어도 된다고 판단하지 않는다★ —
 * DART 공시의 corp_name은 정확한 회사명이지만, 그 회사가 소재 선정 기준의
 * "종목명 언급 허용리스트"에 있는지는 bull-topic-threshold-scanner.ts의
 * isNameableStock()으로 별도 확인해야 한다(대부분의 공급계약 공시는 허용
 * 리스트 밖 종목일 가능성이 높음 — 그 경우 섹터/테마명으로만 언급).
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-dart-scan --arm
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

if (!process.env.DART_API_KEY && !process.env.IROS_OPENDART_API_KEY) {
  console.error("ABORT: DART API 키가 없습니다(DART_API_KEY 또는 IROS_OPENDART_API_KEY). no-log 래퍼로 실행하세요.");
  process.exit(2);
}

// 조회 범위: 오늘 하루(어제~오늘로 살짝 여유를 둠 — 장 마감 후 늦게 올라오는
// 공시나 timezone 경계 문제 대비). DART 날짜 포맷은 YYYYMMDD.
const now = new Date();
const toYyyymmdd = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
const endDate = toYyyymmdd(now);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const beginDate = toYyyymmdd(yesterday);

// 공급계약/수주 관련 공시 제목에서 흔히 쓰이는 키워드. report_nm 전체가 아니라
// 부분 일치로 필터링한다(정확한 공시서식명은 회사마다 조금씩 다름).
const SUPPLY_CONTRACT_KEYWORDS = ["공급계약", "수주", "판매계약", "공급 계약"];

const probe = `
import { buildDartDisclosureSearchRequest, collectDartDisclosures, normalizeDartDisclosureItems } from "./dart-connector.js";
import { createDartLiveTransport } from "./dart-live-transport.js";

const fetchedAt = new Date().toISOString();
const request = buildDartDisclosureSearchRequest({
  beginDate: ${JSON.stringify(beginDate)},
  endDate: ${JSON.stringify(endDate)},
  disclosureType: "B", // 주요사항보고 — 공급계약/수주는 대부분 이 범주
  pageNo: 1,
  pageCount: 100,
  description: "황소특보 공급계약/수주 공시 스캔",
});
const transport = createDartLiveTransport(fetchedAt);
const outcome = await collectDartDisclosures(request, transport, "provider-dart");

if (!outcome.ok) {
  process.stdout.write(JSON.stringify({ status: "FAILED", reason: outcome.reason }));
} else {
  process.stdout.write(JSON.stringify({
    status: "OK",
    documents: outcome.documents.map((d) => ({
      companyName: d.companyName,
      stockCode: d.stockCode ?? null,
      documentTitle: d.documentTitle,
      publishedAt: d.publishedAt,
      sourceUrl: d.sourceUrl,
    })),
  }));
}
`;

let result;
try {
  result = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["dart-connector.js", "dart-live-transport.js"],
  });
} catch (error) {
  console.error(`ABORT: ${error.message}`);
  process.exit(1);
}

if (result.status === "FAILED") {
  console.error(`ABORT: ${result.reason}`);
  process.exit(1);
}

const matched = result.documents.filter((doc) =>
  SUPPLY_CONTRACT_KEYWORDS.some((kw) => doc.documentTitle.includes(kw)),
);

console.log("");
console.log("=== 황소특보 공급계약/수주 공시 스캔 결과 ===");
console.log(`조회 범위: ${beginDate} ~ ${endDate} (DART 주요사항보고, 전체 시장)`);
console.log(`전체 공시 ${result.documents.length}건 중 키워드 매칭 ${matched.length}건`);
console.log("");

if (matched.length === 0) {
  console.log("오늘은 공급계약/수주 관련 공시가 없습니다.");
} else {
  for (const doc of matched) {
    console.log(`${doc.companyName}${doc.stockCode ? ` (${doc.stockCode})` : "(비상장)"}`);
    console.log(`  ${doc.documentTitle}`);
    console.log(`  발행: ${doc.publishedAt}`);
    console.log(`  링크: ${doc.sourceUrl}`);
    console.log("");
  }
}

console.log(
  "참고: 이 회사가 종목명 언급 허용리스트에 있는지는 별도 확인이 필요합니다" +
    "(대부분 허용리스트 밖 종목이므로 대본에서는 섹터/테마명으로만 언급).",
);
