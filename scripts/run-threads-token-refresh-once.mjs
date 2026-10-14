#!/usr/bin/env node
/**
 * 스레드 토큰 상태 점검·연장 (2026-10-13, Owner "토큰 유효기간은 네가 문제없도록 관리해").
 * 래퍼로만: threads-token-refresh [--force] --arm. --force 없으면 마지막 갱신 7일 이상일 때만 연장.
 * 값은 출력하지 않는다. 결과는 C:/tmp/money-shorts-os/threads/token-state.json(만료 예정만).
 */
import { ensureFreshToken, readState } from "./_threads-common.mjs";
const ARM = process.argv.includes("--arm"), FORCE = process.argv.includes("--force");
const st = readState();
console.log(`[threads-token] 현재 기록: 마지막 갱신 ${st.lastRefreshedAt ?? "없음"}, 만료 예정 ${st.expiresAt ?? "미확인"}${st.lastRefreshError ? `, 최근 실패 ${st.lastRefreshError.at}` : ""}`);
if (!ARM) { console.log("[threads-token] --arm 없음 — 상태만 표시"); process.exit(0); }
const t = process.env.THREADS_ACCESS_TOKEN;
if (!t) { console.error("ABORT: THREADS_ACCESS_TOKEN 없음"); process.exit(2); }
await ensureFreshToken(t, (m) => console.log(`[threads-token] ${m}`), { force: FORCE });
