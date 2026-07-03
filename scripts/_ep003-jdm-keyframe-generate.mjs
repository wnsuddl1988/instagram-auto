/**
 * 자동문 면접 (ep003) 4씬 키프레임 이미지 생성
 *
 * 승인: ALLOW_CHATGPT_IMAGE=1 (fail-closed 표준화 — 구 =true 표기는 폐기)
 * 상한: 씬당 2회 / 총 8회 / $0.40
 * 금지: 자동 재시도, Boss 얼굴/전신/어깨 등장 즉시 ABORT
 *
 * 가드 규칙:
 *   - ref attach 실패 시 해당 try 즉시 skip, 절대 send 금지
 *   - refAttached=true 확인 없이 전송 진입 불가
 *   - S3 핵심 키워드(grips the door handle + opens) 누락 시 ABORT
 *   - 이미지 수집: intercept 우선 (gen 필터 의존 제거)
 *
 * 실행:
 *   ALLOW_CHATGPT_IMAGE=1 node scripts/_ep003-jdm-keyframe-generate.mjs
 */

import { chromium }  from "playwright";
import fs            from "fs";
import path          from "path";
import crypto        from "crypto";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1, CHROME_EXE, USER_DATA_GPT1,
  isCDPOpen, ensureChrome, checkLogin, detectStop,
  activateImageTool, attachRef, typePrompt,
  isAssistantDone, collectLastAssistantImages, interceptRecover,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const KF_DIR    = path.join(ROOT, "output/v2/ep003_jdm/keyframes");
const QA_DIR    = path.join(ROOT, "output/v2/ep003_jdm/qa");

// ── fail-closed ChatGPT image allow guard: output write/browser·CDP 전에 반드시 통과 ──
// Owner decision: image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts.
// 이 guard 통과가 이미지 생성 실행 승인을 의미하지 않는다 (no-live 기본).
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ChatGPT image 경로 차단 (fail-closed). 필요한 env: ALLOW_CHATGPT_IMAGE=1 — browser/CDP/output write 전에 중단.");
  process.exit(2);
}

fs.mkdirSync(KF_DIR, { recursive: true });
fs.mkdirSync(QA_DIR, { recursive: true });

// ── 카운터 (절대 상한 초과 금지) ─────────────────────────────────────────────
let TOTAL_SEND    = 0;
const TOTAL_MAX   = 8;
const PER_SCENE   = 2;

// ── 캐릭터 IP / ref 이미지 (upload_002 준 고정) ───────────────────────────────
const REF_IMG = path.join(ROOT,
  "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes/kf_s3_tapping_relief_v3_bag.png"
);
if (!fs.existsSync(REF_IMG)) {
  console.error(`ABORT: ref 이미지 없음 — ${REF_IMG}`);
  process.exit(1);
}

// ── 씬 프롬프트 검증 게이트 ──────────────────────────────────────────────────
// S3: 반전 장면 핵심 키워드 필수
const SCENE_REQUIRED_KEYWORDS = {
  S3: ["grips the door handle", "The door is beginning to open"],
};

// S1: 센서/전자패널 금지 키워드 — 있으면 ABORT (수동문 코미디 전제 훼손)
const SCENE_BANNED_KEYWORDS = {
  S1: ["sensor", "WAVE OPEN", "wave open", "card reader", "electronic panel",
       "automatic door icon", "motion detector", "access panel", "keypad",
       "scanner", "proximity"],
};

function validateScenePrompt(sceneId, prompt) {
  // 필수 키워드 검증
  const required = SCENE_REQUIRED_KEYWORDS[sceneId];
  if (required) {
    const missing = required.filter(kw => !prompt.includes(kw));
    if (missing.length > 0) {
      return `PROMPT_MISMATCH — ${sceneId} 필수 키워드 누락: ${missing.join(" / ")}`;
    }
  }
  // 금지 키워드 검증 (S1: 센서/전자패널 표현이 묘사로 쓰이면 AI가 그릴 수 있음)
  // "STRICT BANS:" 절 이후는 금지 선언문이므로 검사 제외
  const banned = SCENE_BANNED_KEYWORDS[sceneId];
  if (banned) {
    const descOnly = prompt.split(/STRICT BANS:/i)[0];
    const found = banned.filter(kw => descOnly.toLowerCase().includes(kw.toLowerCase()));
    if (found.length > 0) {
      return `PROMPT_BANNED_KEYWORD — ${sceneId} 묘사 영역에 금지 키워드 포함: ${found.join(" / ")}`;
    }
  }
  return null;
}

// ── 씬 프롬프트 (3D semi-deformed / upload_002 준 IP 고정) ───────────────────
const SCENES = [
  {
    id: "S1",
    prompt: `Draw a new scene in the same style as the attached reference image. Keep Jun's character design exactly: round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: Jun stands about half a step away from a glass meeting room door in a modern office corridor. He is waving his hand in the air in front of the door, waiting for it to open automatically. The door is a plain manual swing door with only a simple metal pull handle — nothing else on or near the door frame. The door remains completely closed. Jun has not touched the door or the handle. His expression: cheerfully expectant, slightly puzzled that it hasn't opened yet. Cute comedic semi-deformed 3D animated style, office lighting. Vertical 9:16 format. STRICT BANS: white shirt, realistic human photo, any sensor or electronic device on or near door, WAVE OPEN label, automatic door icon, card reader, keypad, Jun touching or gripping the handle, door open, any other person or Boss.`,
    failIf: ["실사 인물", "white shirt", "센서/전자패널 등장", "WAVE OPEN 표시", "손잡이 잡음", "문 열림", "Boss 또는 다른 인물"],
  },
  {
    id: "S2",
    prompt: `Draw a new scene in the same style as the attached reference image. Keep Jun's character design exactly: round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: Jun is pressing his palm flat against the glass meeting room door, leaning close, searching for a motion sensor. His body is slightly tilted sideways. Expression: concentrated, slightly embarrassed, almost comedic. The door handle is clearly visible in frame but he is ignoring it entirely. The door remains closed. Cute comedic semi-deformed 3D animated style, office lighting. Vertical 9:16 format. STRICT BANS: white shirt, realistic human photo, Jun touching or gripping the handle, Jun looking at the handle, door open.`,
    failIf: ["실사 인물", "white shirt", "손잡이 잡음", "문 열림", "시선이 손잡이", "Boss 신체"],
  },
  {
    id: "S3",
    prompt: `Draw a new scene in the same style as the attached reference image. Keep Jun's character design exactly: round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: glass meeting room door. From the inside, only a business sleeve (suit cuff visible, NO face, NO body above wrist) grips the door handle. The door is beginning to open — a slight gap, door moving outward. On the outside, Jun is frozen mid-motion, his hand still raised slightly, expression: stunned realization. The moment of reversal. Cute comedic semi-deformed 3D animated style. Vertical 9:16 format. STRICT BANS: white shirt, realistic human photo, Boss face/shoulders/body, Jun gripping the handle, door fully open.`,
    failIf: ["실사 인물", "white shirt", "Boss 얼굴", "Boss 전신/어깨", "손잡이 불명확", "문 완전히 열림", "Jun이 손잡이 잡음"],
  },
  {
    id: "S4",
    prompt: `Draw a new scene in the same style as the attached reference image. Keep Jun's character design exactly: round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: the glass door is now open. Jun stands in the doorway, shoulders slightly slumped, expression: resigned and embarrassed — the look of someone who just realized they were obviously wrong. He is not touching the door. His posture is slightly deflated but composed. Background: inside of meeting room softly blurred. No other character's face or body visible. Cute comedic semi-deformed 3D animated style, soft office lighting. Vertical 9:16 format. STRICT BANS: white shirt, realistic human photo, Boss face/body, door closed.`,
    failIf: ["실사 인물", "white shirt", "Boss 신체/얼굴", "문 닫힘"],
  },
];

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function ts()   { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][EP003] ${m}`); }
function warn(m){ console.warn(`[WARN][EP003] ${m}`); }

function md5(buf) {
  return crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
}

// ── 알려진 중복/FAIL md5 (S3가 S2 clone이면 FAIL 처리) ────────────────────────
// S2 동작이 S3 슬롯에서 다시 나오면 안 됨. 동일 hash → clone → FAIL.
const KNOWN_DUP_MD5 = new Set([
  "4a69bed3", // S2_3D / s3_kf_try1 동작(손바닥) — S3 반전 아님
  "8bdb9b66", // S4 PASS
  "5a5d209c", // S2 실사 FAIL
]);

// ── intercept 기반 이미지 수집 (전송 전 route 설정, gen 필터 의존 제거) ───────
// interceptBufs: 전송 전 page.route()로 미리 설정해 둔 Map에서 꺼냄
async function collectFromIntercept(interceptBufs, refSizeKB, savePath) {
  // ref 이미지 크기(KB) ±10% 범위를 제외한 가장 큰 이미지
  const candidates = [...interceptBufs.values()]
    .filter(buf => {
      const kb = Math.round(buf.length / 1024);
      const isRef = Math.abs(kb - refSizeKB) / refSizeKB < 0.10;
      return buf.length > 100_000 && !isRef;
    })
    .sort((a, b) => b.length - a.length);

  if (candidates.length === 0) return null;

  const buf = candidates[0];
  fs.writeFileSync(savePath, buf);
  return buf;
}

// ── 이미지 다운로드 fallback (fetch → DOM) ───────────────────────────────────
async function downloadImageFallback(page, savePath) {
  // DOM에서 마지막 assistant 이미지 src 수집
  const imgs = await collectLastAssistantImages(page);
  const large = imgs.filter(i => i.w >= 400).sort((a, b) => b.w - a.w);
  if (large.length === 0) return null;

  for (const img of large) {
    try {
      const resp = await page.evaluate(async (src) => {
        const r = await fetch(src, { credentials: "include" });
        if (!r.ok) return null;
        const buf = await r.arrayBuffer();
        return Array.from(new Uint8Array(buf));
      }, img.src);
      if (resp && resp.length > 100_000) {
        const buf = Buffer.from(resp);
        fs.writeFileSync(savePath, buf);
        return buf;
      }
    } catch {}
  }
  return null;
}

// ── 이미지 도구 활성화 (UI 변경 대응: "이미지 만들기" 칩 우선) ────────────────
// ChatGPT UI 변경: plus 버튼 aria-label "파일 추가 및 기타" → "파일 등 추가".
// composer 하단 "이미지 만들기" 칩을 직접 클릭하는 경로가 더 안정적.
async function activateImageToolChip(page, logFn, warnFn) {
  // 1차: composer 하단 "이미지 만들기" 칩 직접 클릭
  const chip = page.getByRole("button", { name: /^이미지 만들기$|^Create image$/i }).first();
  if (await chip.count() > 0 && await chip.isVisible().catch(() => false)) {
    await chip.click();
    await page.waitForTimeout(1200);
    logFn("이미지 만들기 칩 클릭 ✅");
    return true;
  }

  // 2차: plus 메뉴 경로 (aria-label 변경 반영)
  const plus = page.locator(
    'button[aria-label="파일 등 추가"], button[aria-label="파일 추가 및 기타"], ' +
    'button[aria-label*="Attach"], button[aria-label*="Add"]'
  ).first();
  if (await plus.count() === 0) {
    throw new Error("이미지 도구 진입 불가 (칩 + plus 버튼 모두 없음)");
  }
  await plus.click();
  await page.waitForTimeout(1000);
  const item = page.getByRole("menuitemradio", { name: /이미지 만들기|Create image/i }).first();
  const itemAlt = page.getByRole("menuitem", { name: /이미지 만들기|Create image/i }).first();
  const target = (await item.count() > 0) ? item : itemAlt;
  if (await target.count() === 0) {
    await page.keyboard.press("Escape");
    throw new Error("'이미지 만들기' 메뉴 항목 없음");
  }
  await target.click();
  await page.waitForTimeout(1000);
  logFn("plus 메뉴 → 이미지 만들기 ✅");
  return true;
}

// ── 생성 완료 대기 (최대 120s) ───────────────────────────────────────────────
async function waitForDone(page, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isAssistantDone(page)) return true;
    await page.waitForTimeout(2000);
  }
  return false;
}

// ── QA 리포트 ─────────────────────────────────────────────────────────────────
const report = {
  started_at: new Date().toISOString(),
  total_send: 0,
  scenes: {},
  result: null,
};

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function run() {
  log("=== EP003 자동문면접 키프레임 생성 시작 ===");
  log(`TOTAL_MAX=${TOTAL_MAX} / PER_SCENE=${PER_SCENE}`);

  // Chrome 연결
  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await (await import("playwright")).chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx     = browser.contexts()[0];

  // ── 대상 씬 제한 (Owner 승인 범위만 — 미승인 씬 절대 생성 금지) ───────────────
  // ONLY_SCENES="S1,S3" 형태. 미지정 시 전체. 승인 범위 외 씬은 전송 자체 차단.
  const onlyScenes = (process.env.ONLY_SCENES || "")
    .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
  if (onlyScenes.length > 0) {
    log(`ONLY_SCENES 게이트 활성 — 대상: ${onlyScenes.join(", ")}`);
  }

  for (const scene of SCENES) {
    // 승인 범위 외 씬 → 건너뜀 (전송 0회)
    if (onlyScenes.length > 0 && !onlyScenes.includes(scene.id)) {
      log(`${scene.id} 승인 범위 외 — 건너뜀 (전송 0)`);
      report.scenes[scene.id] = { status: "skipped_not_approved", tries: 0 };
      continue;
    }

    log(`\n──────── ${scene.id} 시작 ────────`);
    report.scenes[scene.id] = { status: "pending", tries: 0 };

    // 상한 체크
    if (TOTAL_SEND >= TOTAL_MAX) {
      log(`ABORT: 총 ${TOTAL_MAX}회 상한 도달 — ${scene.id} 생성 불가`);
      report.scenes[scene.id].status = "skipped_budget";
      continue;
    }

    // ── §0 씬 프롬프트 정합성 검증 (전송 전 게이트) ──────────────────────────
    const promptError = validateScenePrompt(scene.id, scene.prompt);
    if (promptError) {
      log(`ABORT — ${promptError}`);
      report.scenes[scene.id].status = "abort_prompt_mismatch";
      report.scenes[scene.id].reason = promptError;
      continue;
    }

    // ── 씬당 최대 PER_SCENE 회 ──────────────────────────────────────────────
    let tries = 0;
    let scenePass = false;

    while (tries < PER_SCENE && TOTAL_SEND < TOTAL_MAX) {
      tries++;
      log(`${scene.id} 시도 ${tries}/${PER_SCENE} (총 ${TOTAL_SEND + 1}/${TOTAL_MAX})`);

      // 새 탭에서 ChatGPT
      const page = await ctx.newPage();

      try {
        await checkLogin(page, log);
        await detectStop(page);
      } catch (e) {
        warn(`로그인/중단 체크 실패: ${e.message}`);
        await page.close();
        report.scenes[scene.id].status = "fail_login";
        break;
      }

      // composer UI 하이드레이션 대기 — "이미지 만들기" 칩 또는 plus 버튼
      try {
        await page.locator(
          'button[aria-label="파일 등 추가"], button[aria-label="파일 추가 및 기타"], ' +
          'button[aria-label*="Attach"], button[aria-label*="Add"]'
        ).first().waitFor({ state: "visible", timeout: 20000 });
      } catch {
        warn(`composer 하이드레이션 대기 타임아웃 — ${scene.id} try ${tries}`);
        await page.screenshot({ path: `${QA_DIR}/${scene.id}_no_plus_try${tries}.png` }).catch(() => {});
      }

      // 이미지 모드 활성화 (칩 우선 → plus 메뉴 fallback)
      try {
        await activateImageToolChip(page, log, warn);
      } catch (e) {
        warn(`이미지 도구 활성화 실패: ${e.message}`);
        await page.close();
        report.scenes[scene.id].status = "fail_tool";
        break;
      }

      // ── ref 이미지 첨부 (필수 — 실패 시 이 try만 skip, 전송 절대 금지) ──
      let refAttached = false;
      try {
        await attachRef(page, REF_IMG, log);
        refAttached = true;
      } catch (e) {
        warn(`ref 첨부 실패 (try ${tries}): ${e.message}`);
        await page.screenshot({ path: `${QA_DIR}/${scene.id}_ref_fail_try${tries}.png` }).catch(() => {});
        await page.close();
        // tries 소비 없이 다음 try에서 재시도 (tries-- 보정)
        tries--;
        // 단, 재시도 전 1회만 허용 — 이미 2회 실패했으면 포기
        if (tries >= PER_SCENE - 1) {
          warn(`ref 첨부 ${PER_SCENE}회 모두 실패 — ${scene.id} ABORT`);
          report.scenes[scene.id].status = "fail_ref";
          break;
        }
        await new Promise(r => setTimeout(r, 2000));
        continue; // ref 재첨부 재시도
      }

      // ── 전송 전 최종 가드: refAttached 반드시 true ───────────────────────
      if (!refAttached) {
        warn(`SAFETY_GATE: refAttached=false — ${scene.id} 전송 차단`);
        await page.close();
        report.scenes[scene.id].status = "blocked_no_ref";
        break;
      }

      // ── intercept 설정 (전송 전) ─────────────────────────────────────────
      const interceptBufs = new Map();
      await page.route("**/*", async (route) => {
        const req = route.request();
        const url = req.url();
        if (/oaiusercontent|backend-api.*estuary|dalle/.test(url) && req.resourceType() === "image") {
          try {
            const resp = await route.fetch();
            const body = await resp.body();
            if (body && body.length > 50_000) interceptBufs.set(url, body);
            await route.fulfill({ response: resp, body });
          } catch { await route.continue().catch(() => {}); }
        } else {
          await route.continue().catch(() => {});
        }
      });

      // 프롬프트 입력
      await typePrompt(page, scene.prompt, log);

      // 전송 버튼 활성화 확인
      const sendBtn = page.locator(
        '#composer-submit-button, button[data-testid="send-button"], ' +
        'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
      ).first();

      if (!(await sendBtn.isEnabled().catch(() => false))) {
        warn(`전송 버튼 비활성 — ${scene.id} try ${tries} skip`);
        await page.unroute("**/*").catch(() => {});
        await page.close();
        tries--; // 버튼 비활성은 예산 미소비
        if (tries >= PER_SCENE - 1) break;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      // 전송 (refAttached 확인 후에만 도달)
      TOTAL_SEND++;
      report.total_send = TOTAL_SEND;
      log(`전송 ${TOTAL_SEND}/${TOTAL_MAX} — ${scene.id} (ref ✅)`);
      await sendBtn.click();
      log(`전송 클릭 완료 — 생성 대기...`);

      // 생성 완료 대기
      const done = await waitForDone(page, 120000);
      await page.waitForTimeout(2000);

      if (!done) {
        warn(`${scene.id} 생성 타임아웃 120s`);
        await page.screenshot({ path: `${QA_DIR}/${scene.id}_timeout_try${tries}.png` }).catch(() => {});
        await page.unroute("**/*").catch(() => {});
        await page.close();
        report.scenes[scene.id].status = "timeout";
        break;
      }

      await page.unroute("**/*").catch(() => {});

      // ── 이미지 수집: intercept 우선 → DOM fallback ────────────────────
      const refSizeKB = Math.round(fs.statSync(REF_IMG).size / 1024);
      const savePath  = `${KF_DIR}/${scene.id.toLowerCase()}_kf_try${tries}.png`;

      log(`intercept 수집: ${interceptBufs.size}개`);
      let buf = await collectFromIntercept(interceptBufs, refSizeKB, savePath);

      if (!buf) {
        log("intercept 미수집 — DOM fallback 시도");
        buf = await downloadImageFallback(page, savePath);
      }

      await page.screenshot({ path: `${QA_DIR}/${scene.id}_result_try${tries}.png`, fullPage: false }).catch(() => {});

      if (!buf) {
        warn(`${scene.id} 이미지 수집 실패 (intercept + DOM 모두)`);
        await page.close();
        report.scenes[scene.id].status = "no_image";
        break;
      }

      const kb   = Math.round(buf.length / 1024);
      const hash = md5(buf);
      log(`저장 완료: ${savePath} (${kb}KB, md5=${hash})`);

      // ── S3 clone 가드: 알려진 S2/S4/FAIL md5와 동일하면 FAIL ──────────────
      if (KNOWN_DUP_MD5.has(hash)) {
        warn(`CLONE_DETECTED — ${scene.id} 결과 md5=${hash}가 알려진 중복(S2/S4/FAIL)과 동일. FAIL 처리.`);
        const dupPath = `${KF_DIR}/_FAIL_${scene.id.toLowerCase()}_clone_try${tries}.png`;
        fs.renameSync(savePath, dupPath);
        report.scenes[scene.id] = {
          status: "fail_clone",
          tries,
          file: dupPath,
          size_kb: kb,
          md5: hash,
          note: `S2/S4 clone (md5=${hash}) — 재생성 실패. 재사용 금지.`,
        };
        await page.close();
        // 잔여 시도 있으면 재시도, 없으면 종료
        if (tries < PER_SCENE && TOTAL_SEND < TOTAL_MAX) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        break;
      }

      report.scenes[scene.id] = {
        status: "candidate_owner_qa_pending",
        tries,
        file: savePath,
        size_kb: kb,
        md5: hash,
        fail_conditions: scene.failIf,
        note: "육안 QA 필요 — Owner 확인 전 PASS 처리 금지",
      };
      scenePass = true;

      await page.close();
      break; // 1장 성공 → 씬 완료
    }

    const abortStatuses = ["skipped_budget", "timeout", "no_image", "download_fail",
      "fail_tool", "fail_ref", "fail_login", "blocked_no_ref", "abort_prompt_mismatch"];
    if (!scenePass && !abortStatuses.includes(report.scenes[scene.id].status)) {
      report.scenes[scene.id].status = "fail_unknown";
    }

    log(`${scene.id} 완료 → status=${report.scenes[scene.id].status} (총 전송=${TOTAL_SEND})`);

    // 씬 간 딜레이
    if (SCENES.indexOf(scene) < SCENES.length - 1) {
      log("씬 간 대기 3s...");
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // ── 최종 리포트 ──────────────────────────────────────────────────────────
  report.finished_at  = new Date().toISOString();
  report.total_send   = TOTAL_SEND;
  report.remaining    = TOTAL_MAX - TOTAL_SEND;
  report.result       = Object.values(report.scenes).every(s => s.status === "candidate")
    ? "ALL_CANDIDATE" : "PARTIAL";

  const reportPath = `${QA_DIR}/ep003_keyframe_report.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log("\n=== 최종 결과 ===");
  log(`총 전송: ${TOTAL_SEND}/${TOTAL_MAX} / 잔여: ${TOTAL_MAX - TOTAL_SEND}`);
  for (const [id, s] of Object.entries(report.scenes)) {
    log(`${id}: ${s.status}${s.file ? ` → ${path.basename(s.file)} (${s.size_kb}KB, ${s.md5})` : ""}`);
  }
  log(`리포트: ${reportPath}`);
  log("⚠️  각 씬 이미지는 Owner 육안 QA 전 PASS 처리 금지");

  await browser.close().catch(() => {});
}

run().catch(e => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});
