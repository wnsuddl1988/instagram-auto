/**
 * 스레드 공통 모듈 (2026-10-13, Owner 승인: 규칙 34 배포 확장 + "토큰 유효기간은 네가 문제없도록 관리해").
 * - 토큰 상태: C:/tmp/money-shorts-os/threads/token-state.json (값 없음, 갱신 시각·만료 예정만)
 * - 토큰 연장: 장기 토큰은 60일 유효, 발급 24시간 뒤부터 연장 가능. 마지막 갱신이 REFRESH_AFTER_DAYS를 넘으면 연장하고
 *   새 값을 .env.local의 THREADS_ACCESS_TOKEN 한 줄만 바꿔 쓴다(다른 줄은 그대로, 값은 출력·기록하지 않음).
 */
import fs from "node:fs";
import path from "node:path";

export const ENV_FILE = "C:/Users/PC/jjy/instagram-auto/.env.local";
export const STATE_DIR = "C:/tmp/money-shorts-os/threads";
export const STATE_FILE = `${STATE_DIR}/token-state.json`;
export const REFRESH_AFTER_DAYS = 7;
const API = "https://graph.threads.net";

export const readState = () => { try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return {}; } };
export const writeState = (s) => { fs.mkdirSync(STATE_DIR, { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); };
const daysSince = (iso) => (iso ? (Date.now() - Date.parse(iso)) / 86400000 : Infinity);

function replaceEnvLine(key, value) {
  const raw = fs.readFileSync(ENV_FILE, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);
  let hit = 0;
  const out = lines.map((l) => (new RegExp(`^\\s*${key}\\s*=`).test(l) ? (hit += 1, `${key}=${value}`) : l));
  if (hit !== 1) throw new Error(`.env.local에서 ${key} 줄이 ${hit}개 — 자동 교체 중단(수동 확인 필요)`);
  const tmp = path.join(path.dirname(ENV_FILE), `.env.local.tmp-${process.pid}`);
  fs.writeFileSync(tmp, out.join(eol));
  fs.renameSync(tmp, ENV_FILE);
}

/** 필요하면 토큰을 연장한다. 반환: 사용할 토큰(연장됐으면 새 토큰). 값은 절대 출력하지 않는다. */
export async function ensureFreshToken(token, log = console.log, { force = false } = {}) {
  const st = readState();
  const age = daysSince(st.lastRefreshedAt ?? st.firstSeenAt);
  if (!st.firstSeenAt) { st.firstSeenAt = new Date().toISOString(); writeState(st); }
  if (!force && age < REFRESH_AFTER_DAYS) {
    log(`토큰 상태: 마지막 갱신 ${Number.isFinite(age) ? age.toFixed(1) : "?"}일 전, 만료 예정 ${st.expiresAt ?? "미확인"}`);
    return token;
  }
  const u = new URL(`${API}/refresh_access_token`);
  u.searchParams.set("grant_type", "th_refresh_token");
  u.searchParams.set("access_token", token);
  const r = await fetch(u);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error || !j.access_token) {
    const msg = String(j.error?.message ?? r.status).split(token).join("***");
    log(`토큰 연장 실패(기존 토큰 계속 사용): ${msg.slice(0, 160)}`);
    st.lastRefreshError = { at: new Date().toISOString(), message: msg.slice(0, 200) };
    writeState(st);
    return token;
  }
  replaceEnvLine("THREADS_ACCESS_TOKEN", j.access_token);
  const now = new Date();
  st.lastRefreshedAt = now.toISOString();
  st.expiresAt = new Date(now.getTime() + Number(j.expires_in ?? 5184000) * 1000).toISOString();
  delete st.lastRefreshError;
  writeState(st);
  log(`토큰 연장 완료 — 새 만료 예정 ${st.expiresAt} (.env.local 한 줄 교체, 값 미출력)`);
  return j.access_token;
}

/** 콘텐츠 유닛 → 스레드 글(500자 한도, 이모지는 UTF-8 바이트로 셈). 해시태그 줄은 뺀다(스레드는 주제 태그 1개 문화). */
export function threadsLength(s) {
  let n = 0;
  for (const ch of s) n += /\p{Extended_Pictographic}/u.test(ch) ? Buffer.byteLength(ch, "utf8") : 1;
  return n;
}
export function buildThreadsText(unit, { link } = {}) {
  if (typeof unit.threadsText === "string" && unit.threadsText.trim()) return unit.threadsText.trim();
  const lines = String(unit.instagramCaption ?? "").split("\n").map((l) => l.trim());
  const body = lines.filter((l) => l && !/^#/.test(l) && !/^(출처|※)/.test(l) && !/팔로우/.test(l));
  const tail = link ? `\n\n${link}` : "";
  const out = [];
  for (const l of body) {
    const next = [...out, l].join("\n\n") + tail;
    if (threadsLength(next) > 480) break;
    out.push(l);
  }
  return out.join("\n\n") + tail;
}
