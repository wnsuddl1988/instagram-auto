import { createHash, randomBytes } from "node:crypto";
import * as nodeFs from "node:fs";
import { basename, dirname, join } from "node:path";

export const YOUTUBE_REFRESH_TOKEN_RENEWAL_VERSION =
  "youtube_refresh_token_renewal_v1";
export const YOUTUBE_REFRESH_TOKEN_RENEWAL_APPROVAL =
  "APPROVE_YOUTUBE_REFRESH_TOKEN_RENEWAL_V1";
export const YOUTUBE_REFRESH_TOKEN_RENEWAL_REDIRECT_URI =
  "http://localhost:8080/oauth2callback";
export const YOUTUBE_REFRESH_TOKEN_RENEWAL_TIMEOUT_MS =
  5 * 60 * 1000;
export const YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES =
  Object.freeze([
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ]);

const TOKEN_ENDPOINT =
  "https://oauth2.googleapis.com/token";
const CHANNEL_ENDPOINT =
  "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true";
const AUTH_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const REFRESH_TOKEN_RE = /^[^\s\r\n]+$/;
const CLIENT_ENV_KEYS = Object.freeze([
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
]);

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function stripOneQuotePair(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fixedFailure(reason, externalRequestCount = 0) {
  return {
    ok: false,
    reason,
    externalRequestCount,
    refreshTokenSaved: false,
    youtubeUploadCount: 0,
    instagramActionCount: 0,
    blobMutationCount: 0,
    databaseMutationCount: 0,
  };
}

export function validateYoutubeRefreshTokenRenewalAuthorization({
  armed,
  approval,
  expectedChannelId,
}) {
  if (
    armed !== true ||
    approval !==
      YOUTUBE_REFRESH_TOKEN_RENEWAL_APPROVAL
  ) {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_EXACT_APPROVAL_REQUIRED",
    };
  }
  if (
    typeof expectedChannelId !== "string" ||
    !CHANNEL_ID_RE.test(expectedChannelId)
  ) {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_EXPECTED_CHANNEL_INVALID",
    };
  }
  return {
    ok: true,
    expectedChannelId,
  };
}

/**
 * Parses only the two OAuth client keys. Other env values are never retained
 * in the returned object, derived, measured, printed, hashed, or masked.
 */
export function parseYoutubeOAuthClientCredentials(
  envText,
) {
  if (typeof envText !== "string") {
    return {
      ok: false,
      reason: "YOUTUBE_OAUTH_ENV_UNREADABLE",
      missingKeyNames: [...CLIENT_ENV_KEYS],
    };
  }
  const values = Object.create(null);
  const seen = new Set();
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const withoutExport = trimmed.startsWith("export ")
      ? trimmed.slice(7).trim()
      : trimmed;
    const equalsIndex = withoutExport.indexOf("=");
    if (equalsIndex <= 0) continue;
    const key = withoutExport
      .slice(0, equalsIndex)
      .trim();
    if (!CLIENT_ENV_KEYS.includes(key)) continue;
    if (seen.has(key)) {
      return {
        ok: false,
        reason: "YOUTUBE_OAUTH_ENV_DUPLICATE_KEY",
        missingKeyNames: [],
      };
    }
    seen.add(key);
    const value = stripOneQuotePair(
      withoutExport.slice(equalsIndex + 1).trim(),
    );
    if (value !== "") values[key] = value;
  }
  const missingKeyNames = CLIENT_ENV_KEYS.filter(
    (key) => typeof values[key] !== "string",
  );
  if (missingKeyNames.length > 0) {
    return {
      ok: false,
      reason: "YOUTUBE_OAUTH_CLIENT_KEYS_MISSING",
      missingKeyNames,
    };
  }
  return {
    ok: true,
    clientId: values.YOUTUBE_CLIENT_ID,
    clientSecret: values.YOUTUBE_CLIENT_SECRET,
    loadedKeyNames: [...CLIENT_ENV_KEYS],
  };
}

export function createYoutubeOAuthSession(
  randomBytesImpl = randomBytes,
) {
  const state = base64Url(randomBytesImpl(32));
  const codeVerifier = base64Url(randomBytesImpl(64));
  const codeChallenge = base64Url(
    createHash("sha256").update(codeVerifier).digest(),
  );
  return {
    state,
    codeVerifier,
    codeChallenge,
  };
}

export function buildYoutubeOAuthAuthorizationUrl({
  clientId,
  state,
  codeChallenge,
  redirectUri =
    YOUTUBE_REFRESH_TOKEN_RENEWAL_REDIRECT_URI,
}) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES.join(" "),
  );
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function validateYoutubeOAuthCallback({
  callbackUrl,
  expectedState,
  redirectUri =
    YOUTUBE_REFRESH_TOKEN_RENEWAL_REDIRECT_URI,
}) {
  let parsed;
  let expected;
  try {
    parsed = new URL(callbackUrl);
    expected = new URL(redirectUri);
  } catch {
    return {
      ok: false,
      reason: "YOUTUBE_OAUTH_CALLBACK_URL_INVALID",
    };
  }
  if (
    parsed.protocol !== expected.protocol ||
    parsed.hostname !== expected.hostname ||
    parsed.port !== expected.port ||
    parsed.pathname !== expected.pathname
  ) {
    return {
      ok: false,
      reason: "YOUTUBE_OAUTH_CALLBACK_ROUTE_MISMATCH",
    };
  }
  if (parsed.searchParams.has("error")) {
    return {
      ok: false,
      reason: "YOUTUBE_OAUTH_OWNER_DENIED_OR_GOOGLE_ERROR",
    };
  }
  if (
    parsed.searchParams.getAll("state").length !== 1 ||
    parsed.searchParams.get("state") !== expectedState
  ) {
    return {
      ok: false,
      reason: "YOUTUBE_OAUTH_STATE_MISMATCH",
    };
  }
  const codes = parsed.searchParams.getAll("code");
  const code = codes[0];
  if (codes.length !== 1 || !code) {
    return {
      ok: false,
      reason: "YOUTUBE_OAUTH_CODE_MISSING",
    };
  }
  return {
    ok: true,
    code,
  };
}

async function readBoundedJson(response) {
  try {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > 64 * 1024) {
      return null;
    }
    const parsed = JSON.parse(text);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function validateTokenResponse(value) {
  const scopes =
    typeof value?.scope === "string"
      ? new Set(value.scope.split(/\s+/).filter(Boolean))
      : new Set();
  if (
    typeof value?.access_token !== "string" ||
    value.access_token === "" ||
    typeof value?.refresh_token !== "string" ||
    !REFRESH_TOKEN_RE.test(value.refresh_token) ||
    !YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES.every((scope) =>
      scopes.has(scope),
    )
  ) {
    return {
      ok: false,
      reason:
        "YOUTUBE_OAUTH_TOKEN_OR_REQUIRED_SCOPE_MISSING",
    };
  }
  return {
    ok: true,
    accessToken: value.access_token,
    refreshToken: value.refresh_token,
  };
}

function validateExpectedChannelResponse(
  value,
  expectedChannelId,
) {
  if (
    !Array.isArray(value?.items) ||
    value.items.length !== 1 ||
    value.items[0]?.id !== expectedChannelId
  ) {
    return {
      ok: false,
      reason: "YOUTUBE_CHANNEL_ID_MISMATCH",
    };
  }
  return {
    ok: true,
  };
}

/**
 * Completes one already-authorized loopback callback. All network and storage
 * effects are dependency-injected for fake-only tests.
 */
export async function completeYoutubeRefreshTokenRenewal({
  callbackUrl,
  expectedState,
  codeVerifier,
  clientId,
  clientSecret,
  expectedChannelId,
  fetchImpl,
  persistRefreshToken,
  redirectUri =
    YOUTUBE_REFRESH_TOKEN_RENEWAL_REDIRECT_URI,
}) {
  const callback = validateYoutubeOAuthCallback({
    callbackUrl,
    expectedState,
    redirectUri,
  });
  if (!callback.ok) return fixedFailure(callback.reason);

  let tokenResponse;
  try {
    tokenResponse = await fetchImpl(TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: callback.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
      }),
    });
  } catch {
    return fixedFailure(
      "YOUTUBE_OAUTH_TOKEN_EXCHANGE_NETWORK_FAILED",
      1,
    );
  }
  const tokenJson = await readBoundedJson(tokenResponse);
  if (!tokenResponse?.ok || !tokenJson) {
    return fixedFailure(
      "YOUTUBE_OAUTH_TOKEN_EXCHANGE_FAILED",
      1,
    );
  }
  const token = validateTokenResponse(tokenJson);
  if (!token.ok) return fixedFailure(token.reason, 1);

  let channelResponse;
  try {
    channelResponse = await fetchImpl(CHANNEL_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });
  } catch {
    return fixedFailure(
      "YOUTUBE_CHANNEL_VERIFICATION_NETWORK_FAILED",
      2,
    );
  }
  const channelJson =
    await readBoundedJson(channelResponse);
  if (!channelResponse?.ok || !channelJson) {
    return fixedFailure(
      "YOUTUBE_CHANNEL_VERIFICATION_FAILED",
      2,
    );
  }
  const channel = validateExpectedChannelResponse(
    channelJson,
    expectedChannelId,
  );
  if (!channel.ok) return fixedFailure(channel.reason, 2);

  let persisted;
  try {
    persisted = persistRefreshToken(
      token.refreshToken,
    );
  } catch {
    return fixedFailure(
      "YOUTUBE_REFRESH_TOKEN_ATOMIC_SAVE_FAILED",
      2,
    );
  }
  if (persisted?.ok !== true) {
    if (persisted?.refreshTokenSaved === true) {
      return {
        ...fixedFailure(
          persisted?.reason ??
            "YOUTUBE_REFRESH_TOKEN_POST_COMMIT_READBACK_FAILED",
          2,
        ),
        expectedChannelId,
        expectedChannelMatched: true,
        refreshTokenSaved: true,
        postCommitReadbackFailed: true,
      };
    }
    return fixedFailure(
      persisted?.reason ??
        "YOUTUBE_REFRESH_TOKEN_ATOMIC_SAVE_FAILED",
      2,
    );
  }
  return {
    ok: true,
    schemaVersion:
      YOUTUBE_REFRESH_TOKEN_RENEWAL_VERSION,
    expectedChannelId,
    expectedChannelMatched: true,
    refreshTokenSaved: true,
    externalRequestCount: 2,
    youtubeUploadCount: 0,
    instagramActionCount: 0,
    blobMutationCount: 0,
    databaseMutationCount: 0,
  };
}

function normalizeFileIdentity(stat) {
  return {
    dev: String(stat?.dev ?? ""),
    ino: String(stat?.ino ?? ""),
    size: String(stat?.size ?? ""),
    mtimeMs: String(stat?.mtimeMs ?? ""),
    ctimeMs: String(stat?.ctimeMs ?? ""),
  };
}

function sameFileIdentity(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs
  );
}

function getRenewalLockPath(envPath) {
  return join(
    dirname(envPath),
    `.${basename(
      envPath,
    )}.youtube-refresh-renewal.lock`,
  );
}

function validateOwnedRenewalLock({
  envPath,
  renewalLock,
  fsImpl,
}) {
  if (
    !isPlainObject(renewalLock) ||
    renewalLock.owned !== true ||
    renewalLock.envPath !== envPath ||
    renewalLock.lockPath !== getRenewalLockPath(envPath) ||
    !isPlainObject(renewalLock.fileIdentity)
  ) {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_NOT_HELD",
    };
  }
  try {
    const currentLockIdentity = normalizeFileIdentity(
      fsImpl.statSync(renewalLock.lockPath),
    );
    if (
      !sameFileIdentity(
        currentLockIdentity,
        renewalLock.fileIdentity,
      )
    ) {
      return {
        ok: false,
        reason:
          "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_CHANGED",
      };
    }
  } catch {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_UNREADABLE",
    };
  }
  return { ok: true };
}

/**
 * Creates one adjacent, stable single-flight lock before any env read. A
 * pre-existing lock is never deleted automatically because it may represent
 * another active process or a crash orphan that requires Owner review.
 */
export function acquireYoutubeRefreshTokenRenewalLock({
  envPath,
  fsImpl = nodeFs,
}) {
  if (typeof envPath !== "string" || envPath === "") {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_INPUT_INVALID",
    };
  }
  const lockPath = getRenewalLockPath(envPath);
  let descriptor = null;
  let ownedByThisCall = false;
  try {
    descriptor = fsImpl.openSync(
      lockPath,
      "wx",
      0o600,
    );
    ownedByThisCall = true;
    fsImpl.fsyncSync(descriptor);
    const lockStat =
      typeof fsImpl.fstatSync === "function"
        ? fsImpl.fstatSync(descriptor)
        : fsImpl.statSync(lockPath);
    return {
      ok: true,
      owned: true,
      envPath,
      lockPath,
      descriptor,
      fileIdentity: normalizeFileIdentity(lockStat),
    };
  } catch {
    if (descriptor !== null) {
      try {
        fsImpl.closeSync(descriptor);
      } catch {}
    }
    cleanupOwnedTemp(
      fsImpl,
      lockPath,
      ownedByThisCall,
    );
    return {
      ok: false,
      reason: ownedByThisCall
        ? "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_CREATE_FAILED"
        : "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_ACTIVE_OR_ORPHANED",
    };
  }
}

export function releaseYoutubeRefreshTokenRenewalLock({
  renewalLock,
  fsImpl = nodeFs,
}) {
  if (
    !isPlainObject(renewalLock) ||
    renewalLock.owned !== true
  ) {
    return {
      ok: true,
      released: false,
    };
  }
  try {
    fsImpl.closeSync(renewalLock.descriptor);
  } catch {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_RELEASE_FAILED",
    };
  }
  const validation = validateOwnedRenewalLock({
    envPath: renewalLock.envPath,
    renewalLock,
    fsImpl,
  });
  if (!validation.ok) {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_RELEASE_FAILED",
    };
  }
  try {
    fsImpl.unlinkSync(renewalLock.lockPath);
  } catch {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_RELEASE_FAILED",
    };
  }
  renewalLock.owned = false;
  renewalLock.descriptor = null;
  return {
    ok: true,
    released: true,
  };
}

export function mergeYoutubeRefreshTokenLockRelease({
  result,
  lockRelease,
}) {
  if (lockRelease?.ok !== false) return result;
  const refreshTokenSaved =
    result?.refreshTokenSaved === true;
  return {
    ...result,
    ok: false,
    reason:
      result?.ok === true
        ? "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_RELEASE_FAILED_AFTER_SAVE"
        : result?.reason ??
          "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_RELEASE_FAILED",
    refreshTokenSaved,
    lockCleanupFailed: true,
  };
}

export function readYoutubeOAuthClientFile({
  envPath,
  fsImpl = nodeFs,
}) {
  try {
    const identity = normalizeFileIdentity(
      fsImpl.statSync(envPath),
    );
    const envText = fsImpl.readFileSync(envPath, "utf8");
    const parsed =
      parseYoutubeOAuthClientCredentials(envText);
    if (!parsed.ok) return parsed;
    return {
      ok: true,
      clientId: parsed.clientId,
      clientSecret: parsed.clientSecret,
      fileIdentity: identity,
    };
  } catch {
    return {
      ok: false,
      reason: "YOUTUBE_OAUTH_ENV_UNREADABLE",
      missingKeyNames: [...CLIENT_ENV_KEYS],
    };
  }
}

function replaceRefreshTokenValue(text, refreshToken) {
  const key = "YOUTUBE_REFRESH_TOKEN";
  const matcher =
    /^[ \t]*(?:export[ \t]+)?YOUTUBE_REFRESH_TOKEN[ \t]*=.*$/gm;
  const matches = [...text.matchAll(matcher)];
  if (matches.length > 1) {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_ENV_DUPLICATE_KEY",
    };
  }
  const line = `${key}=${refreshToken}`;
  if (matches.length === 1) {
    return {
      ok: true,
      text: text.replace(matcher, () => line),
    };
  }
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const prefix = text.replace(/\s*$/, "");
  return {
    ok: true,
    text: `${prefix}${prefix ? newline : ""}${line}${newline}`,
  };
}

function cleanupOwnedTemp(
  fsImpl,
  tempPath,
  ownedByThisCall,
) {
  if (ownedByThisCall !== true) return;
  try {
    if (fsImpl.existsSync(tempPath)) {
      fsImpl.unlinkSync(tempPath);
    }
  } catch {
    // A failed cleanup never permits the target env file to be replaced.
  }
}

/**
 * Rechecks the env file identity, writes one same-directory prepared file with
 * wx + fsync, rechecks drift, then atomically replaces the target.
 */
export function writeYoutubeRefreshTokenAtomically({
  envPath,
  expectedFileIdentity,
  refreshToken,
  renewalLock,
  shouldCommit,
  fsImpl = nodeFs,
}) {
  if (
    typeof envPath !== "string" ||
    envPath === "" ||
    !isPlainObject(expectedFileIdentity) ||
    typeof refreshToken !== "string" ||
    !REFRESH_TOKEN_RE.test(refreshToken) ||
    typeof shouldCommit !== "function"
  ) {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_ATOMIC_SAVE_INPUT_INVALID",
    };
  }
  const initialLock = validateOwnedRenewalLock({
    envPath,
    renewalLock,
    fsImpl,
  });
  if (!initialLock.ok) return initialLock;
  let currentIdentity;
  let currentText;
  try {
    currentIdentity = normalizeFileIdentity(
      fsImpl.statSync(envPath),
    );
    if (
      !sameFileIdentity(
        currentIdentity,
        expectedFileIdentity,
      )
    ) {
      return {
        ok: false,
        reason:
          "YOUTUBE_REFRESH_TOKEN_ENV_CHANGED_DURING_OAUTH",
      };
    }
    currentText = fsImpl.readFileSync(envPath, "utf8");
  } catch {
    return {
      ok: false,
      reason: "YOUTUBE_REFRESH_TOKEN_ENV_REREAD_FAILED",
    };
  }
  const updated = replaceRefreshTokenValue(
    currentText,
    refreshToken,
  );
  if (!updated.ok) return updated;

  const tempPath = join(
    dirname(envPath),
    `.${basename(
      envPath,
    )}.youtube-refresh-renewal.prepared`,
  );
  if (fsImpl.existsSync(tempPath)) {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_PREPARED_ORPHAN_REQUIRES_MANUAL_REVIEW",
    };
  }
  let descriptor = null;
  let tempOwnedByThisCall = false;
  try {
    descriptor = fsImpl.openSync(
      tempPath,
      "wx",
      0o600,
    );
    tempOwnedByThisCall = true;
    fsImpl.writeFileSync(
      descriptor,
      updated.text,
      "utf8",
    );
    fsImpl.fsyncSync(descriptor);
  } catch {
    if (descriptor !== null) {
      try {
        fsImpl.closeSync(descriptor);
      } catch {}
      descriptor = null;
    }
    cleanupOwnedTemp(
      fsImpl,
      tempPath,
      tempOwnedByThisCall,
    );
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_PREPARED_WRITE_FAILED",
    };
  } finally {
    if (descriptor !== null) {
      try {
        fsImpl.closeSync(descriptor);
      } catch {}
    }
  }

  let commitDecision;
  try {
    commitDecision = shouldCommit();
  } catch {
    commitDecision = {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_COMMIT_GUARD_FAILED",
    };
  }
  if (commitDecision?.ok !== true) {
    cleanupOwnedTemp(
      fsImpl,
      tempPath,
      tempOwnedByThisCall,
    );
    return {
      ok: false,
      reason:
        commitDecision?.reason ??
        "YOUTUBE_REFRESH_TOKEN_COMMIT_GUARD_REJECTED",
    };
  }

  const finalLock = validateOwnedRenewalLock({
    envPath,
    renewalLock,
    fsImpl,
  });
  if (!finalLock.ok) {
    cleanupOwnedTemp(
      fsImpl,
      tempPath,
      tempOwnedByThisCall,
    );
    return finalLock;
  }

  try {
    const finalTargetIdentity = normalizeFileIdentity(
      fsImpl.statSync(envPath),
    );
    if (
      !sameFileIdentity(
        finalTargetIdentity,
        expectedFileIdentity,
      )
    ) {
      cleanupOwnedTemp(
        fsImpl,
        tempPath,
        tempOwnedByThisCall,
      );
      return {
        ok: false,
        reason:
          "YOUTUBE_REFRESH_TOKEN_ENV_CHANGED_DURING_OAUTH",
      };
    }
    // Keep this rename immediately after the final target identity comparison.
    // The adjacent lock is the sanctioned-writer boundary; non-cooperating
    // local processes remain part of the documented local filesystem trust
    // boundary because Node has no portable compare-and-swap rename primitive.
    fsImpl.renameSync(tempPath, envPath);
  } catch {
    cleanupOwnedTemp(
      fsImpl,
      tempPath,
      tempOwnedByThisCall,
    );
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_ATOMIC_REPLACE_FAILED",
    };
  }

  try {
    const readback = fsImpl.readFileSync(envPath, "utf8");
    const target = readback
      .split(/\r?\n/)
      .filter((line) =>
        /^[ \t]*(?:export[ \t]+)?YOUTUBE_REFRESH_TOKEN[ \t]*=/.test(
          line,
        ),
      );
    if (
      target.length !== 1 ||
      target[0].replace(
        /^[ \t]*(?:export[ \t]+)?YOUTUBE_REFRESH_TOKEN[ \t]*=/,
        "",
      ) !== refreshToken
    ) {
      return {
        ok: false,
        reason:
          "YOUTUBE_REFRESH_TOKEN_ATOMIC_READBACK_FAILED",
        refreshTokenSaved: true,
        postCommitReadbackFailed: true,
      };
    }
  } catch {
    return {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_ATOMIC_READBACK_FAILED",
      refreshTokenSaved: true,
      postCommitReadbackFailed: true,
    };
  }
  return {
    ok: true,
    savedKeyName: "YOUTUBE_REFRESH_TOKEN",
    refreshTokenSaved: true,
  };
}
