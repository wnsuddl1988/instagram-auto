/**
 * Live upload FIRST-RUN runner (v1) — YouTube Shorts + Instagram Reels.
 *
 * 안전 원칙 (Opus-level 판단, Owner가 upload first-run 승인함):
 * - 실제 업로드는 preflight가 100% 통과한 플랫폼에 대해서만, 플랫폼별 최대 1회 시도한다.
 * - 자동 재시도/자동 수정 루프 없음. 실패 시 그대로 기록하고 멈춘다.
 * - credential은 read-only resolution만. 값/토큰 원문은 절대 출력/기록하지 않는다(masked identifier만).
 * - env 파일 수정 없음. DB/Supabase 접근 없음. 임의 public hosting/Supabase 업로드 없음.
 * - Instagram Graph API는 public video_url을 요구한다. 승인된 public URL이 없으면
 *   blocked_public_video_url_required로 기록하고 실행하지 않는다.
 * - YouTube는 accessToken/refreshToken이 없으면 실행하지 않고 blocked로 기록한다(자동 OAuth flow 금지).
 * - 결과 record는 repo 밖 C:\tmp\money-shorts-os\live-upload-first-run-v1\ 에만 쓴다.
 *   repo 안에는 mp4/token/큰 산출물을 절대 쓰지 않는다.
 *
 * 이 runner는 --arm 플래그가 명시된 경우에만 실제 업로드 시도를 활성화한다.
 * --arm 없이 실행하면 preflight만 수행하고 어떤 플랫폼도 업로드하지 않는다(dry preflight).
 *
 * Usage:
 *   node scripts/run-premium-editorial-live-upload-first-run-v1.mjs \
 *     --video   <accepted mp4 path> \
 *     --metadata scripts/fixtures/provider-candidate-upload-metadata.local-mock.json \
 *     --out-dir C:\tmp\money-shorts-os\live-upload-first-run-v1 \
 *     [--public-video-url <https url for instagram>] \
 *     [--arm]   (실제 업로드 활성화; 없으면 preflight-only)
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, createReadStream } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── .env.local read-only loader (값 원문은 절대 로그/기록하지 않는다) ───────────
function loadEnvLocal() {
  const p = join(REPO_ROOT, ".env.local");
  if (!existsSync(p)) return {};
  let content;
  try { content = readFileSync(p, "utf-8"); } catch { return {}; }
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (k) out[k] = v;
  }
  return out;
}
function resolveEnv(key, envLocal) {
  return process.env[key] ?? envLocal[key] ?? undefined;
}
function present(v) {
  return typeof v === "string" && v.trim().length > 0;
}
// masked identifier: 값 원문 노출 없이 존재/길이/앞뒤 일부만.
function maskSecret(v) {
  if (!present(v)) return null;
  const s = v.trim();
  if (s.length < 8) return "***";
  return `${s.slice(0, 3)}***${s.slice(-2)} (len=${s.length})`;
}

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1]) return args[i + 1];
  return null;
}
const videoArg = getArg("--video");
const metadataArg = getArg("--metadata");
const outDir = getArg("--out-dir");
const publicVideoUrl = getArg("--public-video-url");
const armed = args.includes("--arm");

// 플랫폼 필터: 실수로 YouTube가 중복 업로드되는 것을 구조적으로 방지한다.
// 허용값: youtube_shorts | instagram_reels | all. default는 기존 동작 보존을 위해 all.
const onlyPlatform = getArg("--only-platform") ?? "all";
const VALID_ONLY_PLATFORMS = ["youtube_shorts", "instagram_reels", "all"];
if (!VALID_ONLY_PLATFORMS.includes(onlyPlatform)) {
  console.error(`ABORT: --only-platform must be one of ${VALID_ONLY_PLATFORMS.join(", ")} (got: ${onlyPlatform})`);
  process.exit(1);
}
const youtubeAllowedByFilter = onlyPlatform === "all" || onlyPlatform === "youtube_shorts";
const instagramAllowedByFilter = onlyPlatform === "all" || onlyPlatform === "instagram_reels";

if (!videoArg || !metadataArg || !outDir) {
  console.error("Usage: node run-premium-editorial-live-upload-first-run-v1.mjs --video <path> --metadata <path> --out-dir <path> [--public-video-url <url>] [--only-platform youtube_shorts|instagram_reels|all] [--arm]");
  process.exit(1);
}

const videoAbs = resolve(videoArg);
const metadataAbs = resolve(REPO_ROOT, metadataArg);
const outDirAbs = resolve(outDir);

if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
  process.exit(1);
}
if ([videoAbs, metadataAbs, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

const envLocal = loadEnvLocal();
mkdirSync(outDirAbs, { recursive: true });

console.log(`\n[live-upload-first-run] video:    ${videoAbs}`);
console.log(`[live-upload-first-run] metadata: ${metadataAbs}`);
console.log(`[live-upload-first-run] out-dir:  ${outDirAbs}`);
console.log(`[live-upload-first-run] armed:    ${armed ? "YES (실제 업로드 시도 활성화)" : "NO (preflight-only, 업로드 안 함)"}`);
console.log(`[live-upload-first-run] only-platform: ${onlyPlatform} (youtube=${youtubeAllowedByFilter ? "allowed" : "SKIPPED"}, instagram=${instagramAllowedByFilter ? "allowed" : "SKIPPED"})\n`);

// ── PREFLIGHT ──────────────────────────────────────────────────────────────────
const preflight = { checks: [], allPass: true };
function pf(label, ok, detail = "") {
  preflight.checks.push({ label, pass: !!ok, detail });
  if (!ok) preflight.allPass = false;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  [${detail}]` : ""}`);
}

console.log("[preflight 1/4] accepted video + ffprobe...");
pf("accepted mp4 exists", existsSync(videoAbs), videoAbs);
let mediaProbe = null;
if (existsSync(videoAbs)) {
  const probe = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", videoAbs], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });
  if ((probe.status ?? -1) === 0) {
    try {
      const j = JSON.parse(probe.stdout);
      const v = (j.streams ?? []).find((s) => s.codec_type === "video");
      const a = (j.streams ?? []).find((s) => s.codec_type === "audio");
      mediaProbe = {
        containerFormat: j.format?.format_name ?? "unknown",
        videoCodec: v?.codec_name ?? "unknown",
        widthPx: v?.width ?? 0, heightPx: v?.height ?? 0,
        audioCodec: a?.codec_name ?? "none",
        durationSec: parseFloat(j.format?.duration ?? "0"),
      };
    } catch { /* ignore */ }
  }
}
pf("ffprobe container mp4", /mp4/.test(mediaProbe?.containerFormat ?? ""), mediaProbe?.containerFormat);
pf("ffprobe video codec h264", mediaProbe?.videoCodec === "h264");
pf("ffprobe resolution 1080x1920", mediaProbe?.widthPx === 1080 && mediaProbe?.heightPx === 1920);
pf("ffprobe audio codec aac", mediaProbe?.audioCodec === "aac");
pf("ffprobe duration ~30s (±0.5)", Math.abs((mediaProbe?.durationSec ?? 0) - 30) <= 0.5, String(mediaProbe?.durationSec));

console.log("\n[preflight 2/4] metadata sourceFact + category...");
let metadata = null;
try { metadata = JSON.parse(readFileSync(metadataAbs, "utf-8")); } catch (e) {
  pf("metadata readable JSON", false, e.message);
}
const metaText = metadata ? JSON.stringify(metadata) : "";
pf("metadata readable JSON", !!metadata);
pf("no stale '2025.01'", !metaText.includes("2025.01"));
pf("no 'pink noise' placeholder", !metaText.toLowerCase().includes("pink noise"));
pf("no 'ElevenLabs final-pass required'", !metaText.includes("ElevenLabs final-pass required"));
pf("youtube categoryId === '27'", metadata?.youtube_shorts?.categoryId === "27");
pf("youtube title/description present", present(metadata?.youtube_shorts?.title) && present(metadata?.youtube_shorts?.description));
pf("instagram caption present", present(metadata?.instagram_reels?.caption));

console.log("\n[preflight 3/4] credential presence (read-only, masked)...");
// YouTube: lib/youtube.ts는 YOUTUBE_CLIENT_ID/SECRET + accessToken/refreshToken을 요구.
const ytClientId = resolveEnv("YOUTUBE_CLIENT_ID", envLocal) ?? resolveEnv("GOOGLE_CLIENT_ID", envLocal);
const ytClientSecret = resolveEnv("YOUTUBE_CLIENT_SECRET", envLocal) ?? resolveEnv("GOOGLE_CLIENT_SECRET", envLocal);
const ytAccessToken = resolveEnv("YOUTUBE_ACCESS_TOKEN", envLocal);
const ytRefreshToken = resolveEnv("YOUTUBE_REFRESH_TOKEN", envLocal);
const ytReady = present(ytClientId) && present(ytClientSecret) && present(ytAccessToken) && present(ytRefreshToken);

// Instagram: lib/instagram.ts는 INSTAGRAM_BUSINESS_ACCOUNT_ID + INSTAGRAM_ACCESS_TOKEN + public video_url을 요구.
const igAccountId = resolveEnv("INSTAGRAM_BUSINESS_ACCOUNT_ID", envLocal) ?? resolveEnv("INSTAGRAM_USER_ID", envLocal);
const igAccessToken = resolveEnv("INSTAGRAM_ACCESS_TOKEN", envLocal);
const igCredReady = present(igAccountId) && present(igAccessToken);
const igPublicUrlReady = present(publicVideoUrl) && /^https:\/\//.test(publicVideoUrl ?? "");

const credentialStatus = {
  youtube: {
    clientIdPresent: present(ytClientId), clientSecretPresent: present(ytClientSecret),
    accessTokenPresent: present(ytAccessToken), refreshTokenPresent: present(ytRefreshToken),
    accessTokenMasked: maskSecret(ytAccessToken), refreshTokenMasked: maskSecret(ytRefreshToken),
    ready: ytReady,
  },
  instagram: {
    accountIdPresent: present(igAccountId), accessTokenPresent: present(igAccessToken),
    accessTokenMasked: maskSecret(igAccessToken),
    publicVideoUrlProvided: igPublicUrlReady,
    credReady: igCredReady,
    ready: igCredReady && igPublicUrlReady,
  },
};
console.log(`  YouTube: clientId=${credentialStatus.youtube.clientIdPresent} secret=${credentialStatus.youtube.clientSecretPresent} accessToken=${credentialStatus.youtube.accessTokenPresent} refreshToken=${credentialStatus.youtube.refreshTokenPresent} → ready=${ytReady}`);
console.log(`  Instagram: accountId=${credentialStatus.instagram.accountIdPresent} accessToken=${credentialStatus.instagram.accessTokenPresent} publicVideoUrl=${igPublicUrlReady} → ready=${credentialStatus.instagram.ready}`);

console.log("\n[preflight 4/4] dry-run payload presence...");
const dryRunPayloadPath = join("C:\\tmp\\money-shorts-os\\final-video-upload-payload-category-27-v1", "provider-candidate-upload-payload.local-mock.json");
pf("category-27 dry-run payload exists", existsSync(dryRunPayloadPath), dryRunPayloadPath);

// ── platform-level 실행 결정 ────────────────────────────────────────────────────
const baseReady = preflight.allPass; // media/metadata/dry-run 등 공통 전제
const results = {
  youtube: { platform: "youtube_shorts", status: "pending", videoId: null, url: null, blocker: null },
  instagram: { platform: "instagram_reels", status: "pending", mediaId: null, url: null, blocker: null },
};

// YouTube 결정 — 플랫폼 필터가 최우선. 필터로 제외되면 ready_to_attempt에 절대 도달하지 않는다.
if (!youtubeAllowedByFilter) {
  results.youtube.status = "skipped_platform_filter";
  results.youtube.blocker = `--only-platform=${onlyPlatform}: youtube_shorts excluded; videos.insert not entered`;
} else if (!baseReady) {
  results.youtube.status = "blocked";
  results.youtube.blocker = "base_preflight_failed";
} else if (!ytReady) {
  results.youtube.status = "blocked";
  results.youtube.blocker = "blocked_youtube_oauth_credentials_missing (need YOUTUBE_CLIENT_ID/SECRET + accessToken + refreshToken; auto OAuth flow forbidden)";
} else if (!armed) {
  results.youtube.status = "skipped_not_armed";
  results.youtube.blocker = "runner not --arm'd; preflight-only";
} else {
  results.youtube.status = "ready_to_attempt";
}

// Instagram 결정 — 플랫폼 필터가 최우선.
if (!instagramAllowedByFilter) {
  results.instagram.status = "skipped_platform_filter";
  results.instagram.blocker = `--only-platform=${onlyPlatform}: instagram_reels excluded; media/publish not entered`;
} else if (!baseReady) {
  results.instagram.status = "blocked";
  results.instagram.blocker = "base_preflight_failed";
} else if (!igCredReady) {
  results.instagram.status = "blocked";
  results.instagram.blocker = "blocked_instagram_credentials_missing (need INSTAGRAM_BUSINESS_ACCOUNT_ID + INSTAGRAM_ACCESS_TOKEN)";
} else if (!igPublicUrlReady) {
  results.instagram.status = "blocked";
  results.instagram.blocker = "blocked_public_video_url_required (Instagram Graph API needs a public https video_url; local C:\\tmp mp4 not accepted; arbitrary hosting/Supabase upload forbidden)";
} else if (!armed) {
  results.instagram.status = "skipped_not_armed";
  results.instagram.blocker = "runner not --arm'd; preflight-only";
} else {
  results.instagram.status = "ready_to_attempt";
}

// ── 실제 업로드 실행 (armed + ready인 플랫폼만, 각 1회) ─────────────────────────
let anyUploadExecuted = false;

// 이중 안전장치: 필터가 YouTube를 허용하지 않으면 status와 무관하게 insert 경로에 진입하지 않는다.
if (youtubeAllowedByFilter && results.youtube.status === "ready_to_attempt") {
  console.log("\n[upload] YouTube Shorts 실제 업로드 시도 (1회)...");
  try {
    anyUploadExecuted = true;
    const { google } = await import("googleapis");
    const oauth2 = new google.auth.OAuth2(ytClientId, ytClientSecret, resolveEnv("YOUTUBE_OAUTH_REDIRECT_URI", envLocal) ?? "http://localhost:3000/api/auth/youtube/callback");
    oauth2.setCredentials({ access_token: ytAccessToken, refresh_token: ytRefreshToken });
    const youtube = google.youtube({ version: "v3", auth: oauth2 });
    const yt = metadata.youtube_shorts;
    const resp = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: yt.title,
          description: yt.description,
          tags: yt.hashtags,
          categoryId: yt.categoryId, // "27" from metadata, NOT hardcoded
          defaultLanguage: yt.defaultLanguage ?? "ko",
        },
        status: {
          privacyStatus: "public", // upload-first-run: 공개 게시
          selfDeclaredMadeForKids: yt.madeForKids ?? false,
        },
      },
      media: { mimeType: "video/mp4", body: createReadStream(videoAbs) },
    });
    if (resp.data?.id) {
      results.youtube.status = "uploaded";
      results.youtube.videoId = resp.data.id;
      results.youtube.url = `https://www.youtube.com/shorts/${resp.data.id}`;
      console.log(`  uploaded videoId=${resp.data.id}`);
    } else {
      results.youtube.status = "failed";
      results.youtube.blocker = "youtube insert returned no id";
    }
  } catch (e) {
    results.youtube.status = "failed";
    results.youtube.blocker = `youtube upload error: ${e.message}`;
    console.error(`  FAILED: ${e.message}`);
  }
}

// 이중 안전장치: 필터가 Instagram을 허용하지 않으면 status와 무관하게 media/publish 경로에 진입하지 않는다.
if (instagramAllowedByFilter && results.instagram.status === "ready_to_attempt") {
  console.log("\n[upload] Instagram Reels 실제 업로드 시도 (1회)...");
  try {
    anyUploadExecuted = true;
    const GRAPH = "https://graph.facebook.com/v19.0";
    const ig = metadata.instagram_reels;
    const captionFull = `${ig.caption}`;
    const containerRes = await fetch(`${GRAPH}/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_type: "REELS", video_url: publicVideoUrl, caption: captionFull, share_to_feed: true, access_token: igAccessToken }),
    });
    const container = await containerRes.json();
    if (!container.id) throw new Error(`container create failed: ${JSON.stringify(container).slice(0, 200)}`);
    const containerId = container.id;
    // 최소 polling (처리 대기). 실패 시 재시도 없음.
    let finished = false;
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const stRes = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${igAccessToken}`);
      const st = await stRes.json();
      if (st.status_code === "FINISHED") { finished = true; break; }
      if (st.status_code === "ERROR") throw new Error("instagram container processing ERROR");
    }
    if (!finished) throw new Error("instagram container not FINISHED within polling window");
    const pubRes = await fetch(`${GRAPH}/${igAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: containerId, access_token: igAccessToken }),
    });
    const published = await pubRes.json();
    if (!published.id) throw new Error(`publish failed: ${JSON.stringify(published).slice(0, 200)}`);
    results.instagram.status = "uploaded";
    results.instagram.mediaId = published.id;
    results.instagram.url = `https://www.instagram.com/reel/${published.id}/`;
    console.log(`  uploaded mediaId=${published.id}`);
  } catch (e) {
    results.instagram.status = "failed";
    results.instagram.blocker = `instagram upload error: ${e.message}`;
    console.error(`  FAILED: ${e.message}`);
  }
}

// ── record 작성 (repo 밖, credential/token 원문 없음) ────────────────────────────
const record = {
  schemaVersion: "money_shorts_live_upload_first_run_v1",
  status: anyUploadExecuted ? "live_upload_attempted" : "preflight_only_no_upload",
  armed,
  onlyPlatform,
  platformFilter: { youtubeAllowedByFilter, instagramAllowedByFilter },
  acceptedVideoPath: videoAbs,
  mediaProbe,
  preflightAllPass: preflight.allPass,
  preflightChecks: preflight.checks,
  credentialStatus,      // masked identifiers only, no raw tokens
  results,
  uploadExecuted: anyUploadExecuted,
  publishExecuted: results.instagram.status === "uploaded",
  generatedAt: new Date().toISOString(),
  notes: [
    "credential values/tokens are never written to this record — masked identifiers only.",
    "no auto-retry, no auto metadata/credential mutation loop.",
    "Instagram requires a public https video_url; local C:\\tmp mp4 is not accepted by Graph API.",
    armed ? "runner was armed: upload attempted for platforms that passed preflight." : "runner was NOT armed: preflight-only, no upload attempted.",
    `--only-platform=${onlyPlatform}: youtube ${youtubeAllowedByFilter ? "allowed" : "SKIPPED (videos.insert never entered)"}, instagram ${instagramAllowedByFilter ? "allowed" : "SKIPPED (media/publish never entered)"}.`,
  ],
};
const recordPath = join(outDirAbs, "live-upload-first-run-record.json");
writeFileSync(recordPath, JSON.stringify(record, null, 2), "utf-8");

console.log("\n── SUMMARY ─────────────────────────────────────────────");
console.log(`  armed: ${armed} | only-platform: ${onlyPlatform}`);
console.log(`  YouTube:   ${results.youtube.status}${results.youtube.videoId ? ` (${results.youtube.videoId})` : ""}${results.youtube.blocker ? ` — ${results.youtube.blocker}` : ""}`);
console.log(`  Instagram: ${results.instagram.status}${results.instagram.mediaId ? ` (${results.instagram.mediaId})` : ""}${results.instagram.blocker ? ` — ${results.instagram.blocker}` : ""}`);
console.log(`  uploadExecuted: ${anyUploadExecuted}, publishExecuted: ${record.publishExecuted}`);
console.log(`  record: ${recordPath}`);
console.log("────────────────────────────────────────────────────────\n");
