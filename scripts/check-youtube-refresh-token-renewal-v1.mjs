import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  YOUTUBE_REFRESH_TOKEN_RENEWAL_APPROVAL,
  YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES,
  acquireYoutubeRefreshTokenRenewalLock,
  buildYoutubeOAuthAuthorizationUrl,
  completeYoutubeRefreshTokenRenewal,
  createYoutubeOAuthSession,
  mergeYoutubeRefreshTokenLockRelease,
  parseYoutubeOAuthClientCredentials,
  readYoutubeOAuthClientFile,
  releaseYoutubeRefreshTokenRenewalLock,
  validateYoutubeOAuthCallback,
  validateYoutubeRefreshTokenRenewalAuthorization,
  writeYoutubeRefreshTokenAtomically,
} from "../lib/youtube-refresh-token-renewal.mjs";

const ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
const CLI_PATH = join(
  ROOT,
  "scripts",
  "run-youtube-refresh-token-renewal-v1.mjs",
);
const CORE_PATH = join(
  ROOT,
  "lib",
  "youtube-refresh-token-renewal.mjs",
);
const cliSource = readFileSync(CLI_PATH, "utf8");
const coreSource = readFileSync(CORE_PATH, "utf8");
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8"),
);

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(
      `FAIL  ${name}${detail ? ` - ${detail}` : ""}`,
    );
  }
}

const EXPECTED_CHANNEL_ID =
  "UCR23z78qDtyhHIaV29rSB9A";
const DUMMY_CLIENT_ID =
  "dummy-client.apps.googleusercontent.com";
const DUMMY_CLIENT_SECRET = "dummy-client-secret";
const DUMMY_ACCESS_TOKEN = "dummy-access-token";
const DUMMY_REFRESH_TOKEN = "dummy-refresh-token";

const blockedAuthorization =
  validateYoutubeRefreshTokenRenewalAuthorization({
    armed: false,
    approval:
      YOUTUBE_REFRESH_TOKEN_RENEWAL_APPROVAL,
    expectedChannelId: EXPECTED_CHANNEL_ID,
  });
check(
  "missing --arm blocks before any OAuth authority",
  blockedAuthorization.ok === false,
);

const wrongApproval =
  validateYoutubeRefreshTokenRenewalAuthorization({
    armed: true,
    approval: "APPROVE_SOMETHING_ELSE",
    expectedChannelId: EXPECTED_CHANNEL_ID,
  });
check(
  "wrong approval token blocks renewal",
  wrongApproval.ok === false,
);

const invalidChannel =
  validateYoutubeRefreshTokenRenewalAuthorization({
    armed: true,
    approval:
      YOUTUBE_REFRESH_TOKEN_RENEWAL_APPROVAL,
    expectedChannelId: "not-a-channel",
  });
check(
  "invalid expected channel blocks renewal",
  invalidChannel.ok === false,
);

const allowedAuthorization =
  validateYoutubeRefreshTokenRenewalAuthorization({
    armed: true,
    approval:
      YOUTUBE_REFRESH_TOKEN_RENEWAL_APPROVAL,
    expectedChannelId: EXPECTED_CHANNEL_ID,
  });
check(
  "exact arm, approval, and public channel pass the pure gate",
  allowedAuthorization.ok === true,
);

const parsedCredentials =
  parseYoutubeOAuthClientCredentials(
    [
      "INSTAGRAM_ACCESS_TOKEN=must-not-be-retained",
      `YOUTUBE_CLIENT_ID=${DUMMY_CLIENT_ID}`,
      "UNRELATED_PRIVATE_KEY=must-not-be-retained",
      `YOUTUBE_CLIENT_SECRET='${DUMMY_CLIENT_SECRET}'`,
      "YOUTUBE_REFRESH_TOKEN=old-refresh-token",
    ].join("\n"),
  );
check(
  "env parser retains only the two OAuth client keys",
  parsedCredentials.ok === true &&
    parsedCredentials.clientId === DUMMY_CLIENT_ID &&
    parsedCredentials.clientSecret ===
      DUMMY_CLIENT_SECRET &&
    JSON.stringify(parsedCredentials).includes(
      "must-not-be-retained",
    ) === false &&
    JSON.stringify(parsedCredentials).includes(
      "old-refresh-token",
    ) === false,
);

const duplicateClientKey =
  parseYoutubeOAuthClientCredentials(
    [
      `YOUTUBE_CLIENT_ID=${DUMMY_CLIENT_ID}`,
      "YOUTUBE_CLIENT_ID=duplicate",
      `YOUTUBE_CLIENT_SECRET=${DUMMY_CLIENT_SECRET}`,
    ].join("\n"),
  );
check(
  "duplicate OAuth client keys fail closed",
  duplicateClientKey.ok === false &&
    duplicateClientKey.reason ===
      "YOUTUBE_OAUTH_ENV_DUPLICATE_KEY",
);

let randomCall = 0;
const session = createYoutubeOAuthSession((size) => {
  randomCall += 1;
  return Buffer.alloc(size, randomCall);
});
const authorizationUrl =
  buildYoutubeOAuthAuthorizationUrl({
    clientId: DUMMY_CLIENT_ID,
    state: session.state,
    codeChallenge: session.codeChallenge,
  });
const parsedAuthorizationUrl = new URL(authorizationUrl);
const requestedScopes = new Set(
  parsedAuthorizationUrl.searchParams
    .get("scope")
    .split(" "),
);
check(
  "authorization URL binds state and PKCE S256",
  parsedAuthorizationUrl.searchParams.get("state") ===
      session.state &&
    parsedAuthorizationUrl.searchParams.get(
      "code_challenge",
    ) === session.codeChallenge &&
    parsedAuthorizationUrl.searchParams.get(
      "code_challenge_method",
    ) === "S256",
);
check(
  "authorization URL requests offline consent and exact scopes",
  parsedAuthorizationUrl.searchParams.get(
    "access_type",
  ) === "offline" &&
    parsedAuthorizationUrl.searchParams.get("prompt") ===
      "consent" &&
    YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES.every(
      (scope) => requestedScopes.has(scope),
    ) &&
    requestedScopes.size ===
      YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES.length,
);

const validCallback = validateYoutubeOAuthCallback({
  callbackUrl:
    `http://localhost:8080/oauth2callback?code=dummy-code&state=${encodeURIComponent(
      session.state,
    )}`,
  expectedState: session.state,
});
const wrongStateCallback =
  validateYoutubeOAuthCallback({
    callbackUrl:
      "http://localhost:8080/oauth2callback?code=dummy-code&state=wrong",
    expectedState: session.state,
  });
check(
  "callback accepts only the exact state-bound route",
  validCallback.ok === true &&
    wrongStateCallback.ok === false &&
    wrongStateCallback.reason ===
      "YOUTUBE_OAUTH_STATE_MISMATCH",
);

function fakeResponse(ok, body) {
  return {
    ok,
    async text() {
      return JSON.stringify(body);
    },
  };
}

const fetchCalls = [];
let persistedToken = null;
const completed =
  await completeYoutubeRefreshTokenRenewal({
    callbackUrl:
      `http://localhost:8080/oauth2callback?code=dummy-code&state=${encodeURIComponent(
        session.state,
      )}`,
    expectedState: session.state,
    codeVerifier: session.codeVerifier,
    clientId: DUMMY_CLIENT_ID,
    clientSecret: DUMMY_CLIENT_SECRET,
    expectedChannelId: EXPECTED_CHANNEL_ID,
    fetchImpl: async (url, options) => {
      fetchCalls.push({ url, options });
      if (fetchCalls.length === 1) {
        return fakeResponse(true, {
          access_token: DUMMY_ACCESS_TOKEN,
          refresh_token: DUMMY_REFRESH_TOKEN,
          token_type: "Bearer",
          scope:
            YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES.join(
              " ",
            ),
        });
      }
      return fakeResponse(true, {
        items: [{ id: EXPECTED_CHANNEL_ID }],
      });
    },
    persistRefreshToken(token) {
      persistedToken = token;
      return { ok: true };
    },
  });
check(
  "fake OAuth success verifies channel before one persistence",
  completed.ok === true &&
    completed.expectedChannelMatched === true &&
    completed.externalRequestCount === 2 &&
    fetchCalls.length === 2 &&
    persistedToken === DUMMY_REFRESH_TOKEN,
);
check(
  "safe result contains no access, refresh, or client secret value",
  !JSON.stringify(completed).includes(
    DUMMY_ACCESS_TOKEN,
  ) &&
    !JSON.stringify(completed).includes(
      DUMMY_REFRESH_TOKEN,
    ) &&
    !JSON.stringify(completed).includes(
      DUMMY_CLIENT_SECRET,
    ),
);
check(
  "token exchange includes PKCE verifier and channel uses bearer in-memory",
  fetchCalls[0].options.body.get("code_verifier") ===
      session.codeVerifier &&
    fetchCalls[1].options.headers.Authorization ===
      `Bearer ${DUMMY_ACCESS_TOKEN}`,
);
check(
  "successful renewal grants no publish, Instagram, Blob, or DB action",
  completed.youtubeUploadCount === 0 &&
    completed.instagramActionCount === 0 &&
    completed.blobMutationCount === 0 &&
    completed.databaseMutationCount === 0,
);

let mismatchPersistCount = 0;
const mismatchedChannel =
  await completeYoutubeRefreshTokenRenewal({
    callbackUrl:
      `http://localhost:8080/oauth2callback?code=dummy-code&state=${encodeURIComponent(
        session.state,
      )}`,
    expectedState: session.state,
    codeVerifier: session.codeVerifier,
    clientId: DUMMY_CLIENT_ID,
    clientSecret: DUMMY_CLIENT_SECRET,
    expectedChannelId: EXPECTED_CHANNEL_ID,
    fetchImpl: async () =>
      mismatchPersistCount === -1
        ? null
        : fakeResponse(true, {
            access_token: DUMMY_ACCESS_TOKEN,
            refresh_token: DUMMY_REFRESH_TOKEN,
            token_type: "Bearer",
            scope:
              YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES.join(
                " ",
              ),
            items: [],
          }),
    persistRefreshToken() {
      mismatchPersistCount += 1;
      return { ok: true };
    },
  });
// The fake returns token-shaped JSON for both requests, so the channel payload
// has no items and must fail before persistence.
check(
  "wrong or unreadable channel identity never persists a token",
  mismatchedChannel.ok === false &&
    mismatchedChannel.reason ===
      "YOUTUBE_CHANNEL_ID_MISMATCH" &&
    mismatchPersistCount === 0,
);

let missingScopePersistCount = 0;
const missingScope =
  await completeYoutubeRefreshTokenRenewal({
    callbackUrl:
      `http://localhost:8080/oauth2callback?code=dummy-code&state=${encodeURIComponent(
        session.state,
      )}`,
    expectedState: session.state,
    codeVerifier: session.codeVerifier,
    clientId: DUMMY_CLIENT_ID,
    clientSecret: DUMMY_CLIENT_SECRET,
    expectedChannelId: EXPECTED_CHANNEL_ID,
    fetchImpl: async () =>
      fakeResponse(true, {
        access_token: DUMMY_ACCESS_TOKEN,
        refresh_token: DUMMY_REFRESH_TOKEN,
        token_type: "Bearer",
        scope:
          "https://www.googleapis.com/auth/youtube.upload",
      }),
    persistRefreshToken() {
      missingScopePersistCount += 1;
      return { ok: true };
    },
  });
check(
  "missing readonly scope blocks channel verification and persistence",
  missingScope.ok === false &&
    missingScope.reason ===
      "YOUTUBE_OAUTH_TOKEN_OR_REQUIRED_SCOPE_MISSING" &&
    missingScopePersistCount === 0,
);

let fetchThrowPersistCount = 0;
const fetchThrown =
  await completeYoutubeRefreshTokenRenewal({
    callbackUrl:
      `http://localhost:8080/oauth2callback?code=dummy-code&state=${encodeURIComponent(
        session.state,
      )}`,
    expectedState: session.state,
    codeVerifier: session.codeVerifier,
    clientId: DUMMY_CLIENT_ID,
    clientSecret: DUMMY_CLIENT_SECRET,
    expectedChannelId: EXPECTED_CHANNEL_ID,
    fetchImpl: async () => {
      throw new Error("dummy network failure");
    },
    persistRefreshToken() {
      fetchThrowPersistCount += 1;
      return { ok: true };
    },
  });
check(
  "token fetch throw is sanitized and never persists",
  fetchThrown.ok === false &&
    fetchThrown.reason ===
      "YOUTUBE_OAUTH_TOKEN_EXCHANGE_NETWORK_FAILED" &&
    fetchThrowPersistCount === 0,
);

const postCommitAmbiguous =
  await completeYoutubeRefreshTokenRenewal({
    callbackUrl:
      `http://localhost:8080/oauth2callback?code=dummy-code&state=${encodeURIComponent(
        session.state,
      )}`,
    expectedState: session.state,
    codeVerifier: session.codeVerifier,
    clientId: DUMMY_CLIENT_ID,
    clientSecret: DUMMY_CLIENT_SECRET,
    expectedChannelId: EXPECTED_CHANNEL_ID,
    fetchImpl: async (_url, options) =>
      options.method === "POST"
        ? fakeResponse(true, {
            access_token: DUMMY_ACCESS_TOKEN,
            refresh_token: DUMMY_REFRESH_TOKEN,
            token_type: "Bearer",
            scope:
              YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES.join(
                " ",
              ),
          })
        : fakeResponse(true, {
            items: [{ id: EXPECTED_CHANNEL_ID }],
          }),
    persistRefreshToken() {
      return {
        ok: false,
        reason:
          "YOUTUBE_REFRESH_TOKEN_ATOMIC_READBACK_FAILED",
        refreshTokenSaved: true,
        postCommitReadbackFailed: true,
      };
    },
  });
check(
  "post-commit readback failure truthfully reports possible saved state",
  postCommitAmbiguous.ok === false &&
    postCommitAmbiguous.refreshTokenSaved === true &&
    postCommitAmbiguous.postCommitReadbackFailed ===
      true &&
    postCommitAmbiguous.expectedChannelMatched === true,
);

class FakeFs {
  constructor(initialPath, initialText) {
    this.files = new Map([
      [initialPath, Buffer.from(initialText, "utf8")],
    ]);
    this.metadata = new Map([
      [
        initialPath,
        {
          dev: 1,
          ino: 10,
          size: Buffer.byteLength(initialText),
          mtimeMs: 100,
          ctimeMs: 100,
        },
      ],
    ]);
    this.handles = new Map();
    this.nextFd = 20;
    this.fsyncCount = 0;
    this.failFsync = false;
    this.readCount = 0;
    this.renameCount = 0;
  }
  existsSync(path) {
    return this.files.has(path);
  }
  statSync(path) {
    if (!this.metadata.has(path)) {
      const error = new Error("missing");
      error.code = "ENOENT";
      throw error;
    }
    return { ...this.metadata.get(path) };
  }
  readFileSync(path) {
    if (!this.files.has(path)) throw new Error("missing");
    this.readCount += 1;
    return this.files.get(path).toString("utf8");
  }
  openSync(path, flag) {
    if (flag !== "wx" || this.files.has(path)) {
      throw new Error("exclusive open failed");
    }
    const fd = this.nextFd++;
    this.files.set(path, Buffer.alloc(0));
    this.metadata.set(path, {
      dev: 1,
      ino: fd,
      size: 0,
      mtimeMs: 200,
      ctimeMs: 200,
    });
    this.handles.set(fd, path);
    return fd;
  }
  writeFileSync(fd, value) {
    const path = this.handles.get(fd);
    const bytes = Buffer.from(String(value), "utf8");
    this.files.set(path, bytes);
    this.metadata.get(path).size = bytes.length;
  }
  fsyncSync() {
    if (this.failFsync) throw new Error("fsync failed");
    this.fsyncCount += 1;
  }
  fstatSync(fd) {
    const path = this.handles.get(fd);
    if (!path) throw new Error("closed");
    return this.statSync(path);
  }
  closeSync(fd) {
    this.handles.delete(fd);
  }
  renameSync(source, destination) {
    if (!this.files.has(source)) throw new Error("missing");
    this.renameCount += 1;
    const bytes = this.files.get(source);
    const sourceMeta = this.metadata.get(source);
    this.files.set(destination, bytes);
    this.metadata.set(destination, {
      ...sourceMeta,
      ino: 99,
      mtimeMs: 300,
      ctimeMs: 300,
    });
    this.files.delete(source);
    this.metadata.delete(source);
  }
  unlinkSync(path) {
    this.files.delete(path);
    this.metadata.delete(path);
  }
  touch(path) {
    this.metadata.get(path).mtimeMs += 1;
  }
}

const fakeEnvPath =
  "C:\\repo\\instagram-auto\\.env.local";
const fakeEnvText = [
  "INSTAGRAM_ACCESS_TOKEN=untouched-instagram",
  `YOUTUBE_CLIENT_ID=${DUMMY_CLIENT_ID}`,
  `YOUTUBE_CLIENT_SECRET=${DUMMY_CLIENT_SECRET}`,
  "YOUTUBE_REFRESH_TOKEN=old-refresh-token",
  "BLOB_READ_WRITE_TOKEN=untouched-blob",
  "",
].join("\r\n");
const allowCommit = () => ({ ok: true });
const fakeFs = new FakeFs(fakeEnvPath, fakeEnvText);
const fakeLock =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: fakeFs,
  });
const fakeClient = readYoutubeOAuthClientFile({
  envPath: fakeEnvPath,
  fsImpl: fakeFs,
});
const atomicWrite = writeYoutubeRefreshTokenAtomically({
  envPath: fakeEnvPath,
  expectedFileIdentity: fakeClient.fileIdentity,
  refreshToken: DUMMY_REFRESH_TOKEN,
  renewalLock: fakeLock,
  shouldCommit: allowCommit,
  fsImpl: fakeFs,
});
const finalEnvText = fakeFs.readFileSync(fakeEnvPath);
check(
  "lock and atomic writer fsync and change only the target key",
  atomicWrite.ok === true &&
    fakeFs.fsyncCount === 2 &&
    finalEnvText.includes(
      `YOUTUBE_REFRESH_TOKEN=${DUMMY_REFRESH_TOKEN}`,
    ) &&
    finalEnvText.includes(
      "INSTAGRAM_ACCESS_TOKEN=untouched-instagram",
    ) &&
    finalEnvText.includes(
      "BLOB_READ_WRITE_TOKEN=untouched-blob",
    ),
);
check(
  "atomic writer leaves no owned prepared file after success",
  [...fakeFs.files.keys()].every(
    (path) => !path.endsWith(".prepared"),
  ),
);
const fakeLockRelease =
  releaseYoutubeRefreshTokenRenewalLock({
    renewalLock: fakeLock,
    fsImpl: fakeFs,
  });
check(
  "owned renewal lock is released after the commit boundary",
  fakeLockRelease.ok === true &&
    [...fakeFs.files.keys()].every(
      (path) => !path.endsWith(".lock"),
    ),
);

const replacementMetaFs = new FakeFs(
  fakeEnvPath,
  fakeEnvText.replace(
    "YOUTUBE_REFRESH_TOKEN=old-refresh-token",
    "export YOUTUBE_REFRESH_TOKEN=old-refresh-token",
  ),
);
const replacementMetaLock =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: replacementMetaFs,
  });
const replacementMetaClient =
  readYoutubeOAuthClientFile({
    envPath: fakeEnvPath,
    fsImpl: replacementMetaFs,
  });
const replacementMetaToken = "dummy-$&-$`-$'-token";
const replacementMetaWrite =
  writeYoutubeRefreshTokenAtomically({
    envPath: fakeEnvPath,
    expectedFileIdentity:
      replacementMetaClient.fileIdentity,
    refreshToken: replacementMetaToken,
    renewalLock: replacementMetaLock,
    shouldCommit: allowCommit,
    fsImpl: replacementMetaFs,
  });
const replacementMetaReadback =
  replacementMetaFs.readFileSync(fakeEnvPath);
check(
  "export syntax and replacement metacharacters remain byte-exact",
  replacementMetaWrite.ok === true &&
    replacementMetaReadback.includes(
      `YOUTUBE_REFRESH_TOKEN=${replacementMetaToken}`,
    ) &&
    (
      replacementMetaReadback.match(
        /YOUTUBE_REFRESH_TOKEN/g,
      ) ?? []
    ).length === 1,
);

const staleFs = new FakeFs(fakeEnvPath, fakeEnvText);
const staleLock =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: staleFs,
  });
const staleClient = readYoutubeOAuthClientFile({
  envPath: fakeEnvPath,
  fsImpl: staleFs,
});
staleFs.touch(fakeEnvPath);
const staleWrite = writeYoutubeRefreshTokenAtomically({
  envPath: fakeEnvPath,
  expectedFileIdentity: staleClient.fileIdentity,
  refreshToken: DUMMY_REFRESH_TOKEN,
  renewalLock: staleLock,
  shouldCommit: allowCommit,
  fsImpl: staleFs,
});
check(
  "env drift during OAuth blocks before prepared write",
  staleWrite.ok === false &&
    staleWrite.reason ===
      "YOUTUBE_REFRESH_TOKEN_ENV_CHANGED_DURING_OAUTH" &&
    [...staleFs.files.keys()].every(
      (path) => !path.endsWith(".prepared"),
    ),
);

const fsyncFailFs = new FakeFs(
  fakeEnvPath,
  fakeEnvText,
);
const fsyncFailLock =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: fsyncFailFs,
  });
fsyncFailFs.failFsync = true;
const fsyncFailClient = readYoutubeOAuthClientFile({
  envPath: fakeEnvPath,
  fsImpl: fsyncFailFs,
});
const fsyncFailed =
  writeYoutubeRefreshTokenAtomically({
    envPath: fakeEnvPath,
    expectedFileIdentity:
      fsyncFailClient.fileIdentity,
    refreshToken: DUMMY_REFRESH_TOKEN,
    renewalLock: fsyncFailLock,
    shouldCommit: allowCommit,
    fsImpl: fsyncFailFs,
  });
check(
  "prepared fsync failure preserves original env and cleans owned temp",
  fsyncFailed.ok === false &&
    fsyncFailFs.readFileSync(fakeEnvPath) ===
      fakeEnvText &&
    [...fsyncFailFs.files.keys()].every(
      (path) => !path.endsWith(".prepared"),
    ),
);

const orphanFs = new FakeFs(fakeEnvPath, fakeEnvText);
const orphanLock =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: orphanFs,
  });
const orphanClient = readYoutubeOAuthClientFile({
  envPath: fakeEnvPath,
  fsImpl: orphanFs,
});
const preparedPath = join(
  dirname(fakeEnvPath),
  `.${basename(
    fakeEnvPath,
  )}.youtube-refresh-renewal.prepared`,
);
orphanFs.files.set(
  preparedPath,
  Buffer.from("prior-owned-secret-copy", "utf8"),
);
orphanFs.metadata.set(preparedPath, {
  dev: 1,
  ino: 77,
  size: 23,
  mtimeMs: 250,
  ctimeMs: 250,
});
const orphanBlocked =
  writeYoutubeRefreshTokenAtomically({
    envPath: fakeEnvPath,
    expectedFileIdentity: orphanClient.fileIdentity,
    refreshToken: DUMMY_REFRESH_TOKEN,
    renewalLock: orphanLock,
    shouldCommit: allowCommit,
    fsImpl: orphanFs,
  });
check(
  "pre-existing prepared orphan blocks and is never deleted",
  orphanBlocked.ok === false &&
    orphanBlocked.reason ===
      "YOUTUBE_REFRESH_TOKEN_PREPARED_ORPHAN_REQUIRES_MANUAL_REVIEW" &&
    orphanFs.existsSync(preparedPath),
);

const lateMutationFs = new FakeFs(
  fakeEnvPath,
  fakeEnvText,
);
const lateMutationLock =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: lateMutationFs,
  });
const lateMutationClient =
  readYoutubeOAuthClientFile({
    envPath: fakeEnvPath,
    fsImpl: lateMutationFs,
  });
const lateMutationWrite =
  writeYoutubeRefreshTokenAtomically({
    envPath: fakeEnvPath,
    expectedFileIdentity:
      lateMutationClient.fileIdentity,
    refreshToken: DUMMY_REFRESH_TOKEN,
    renewalLock: lateMutationLock,
    shouldCommit: () => {
      lateMutationFs.touch(fakeEnvPath);
      return { ok: true };
    },
    fsImpl: lateMutationFs,
  });
check(
  "late target mutation after prepared fsync blocks before rename",
  lateMutationWrite.ok === false &&
    lateMutationWrite.reason ===
      "YOUTUBE_REFRESH_TOKEN_ENV_CHANGED_DURING_OAUTH" &&
    lateMutationFs.renameCount === 0 &&
    lateMutationFs.readFileSync(fakeEnvPath) ===
      fakeEnvText &&
    [...lateMutationFs.files.keys()].every(
      (path) => !path.endsWith(".prepared"),
    ),
);

const commitRejectedFs = new FakeFs(
  fakeEnvPath,
  fakeEnvText,
);
const commitRejectedLock =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: commitRejectedFs,
  });
const commitRejectedClient =
  readYoutubeOAuthClientFile({
    envPath: fakeEnvPath,
    fsImpl: commitRejectedFs,
  });
const commitRejectedWrite =
  writeYoutubeRefreshTokenAtomically({
    envPath: fakeEnvPath,
    expectedFileIdentity:
      commitRejectedClient.fileIdentity,
    refreshToken: DUMMY_REFRESH_TOKEN,
    renewalLock: commitRejectedLock,
    shouldCommit: () => ({
      ok: false,
      reason:
        "YOUTUBE_OAUTH_OWNER_TIMEOUT_BEFORE_SAVE",
    }),
    fsImpl: commitRejectedFs,
  });
check(
  "deadline commit rejection preserves the original and cleans prepared bytes",
  commitRejectedWrite.ok === false &&
    commitRejectedWrite.reason ===
      "YOUTUBE_OAUTH_OWNER_TIMEOUT_BEFORE_SAVE" &&
    commitRejectedFs.renameCount === 0 &&
    commitRejectedFs.readFileSync(fakeEnvPath) ===
      fakeEnvText &&
    [...commitRejectedFs.files.keys()].every(
      (path) => !path.endsWith(".prepared"),
    ),
);

const commitThrowFs = new FakeFs(
  fakeEnvPath,
  fakeEnvText,
);
const commitThrowLock =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: commitThrowFs,
  });
const commitThrowClient = readYoutubeOAuthClientFile({
  envPath: fakeEnvPath,
  fsImpl: commitThrowFs,
});
const commitThrowWrite =
  writeYoutubeRefreshTokenAtomically({
    envPath: fakeEnvPath,
    expectedFileIdentity:
      commitThrowClient.fileIdentity,
    refreshToken: DUMMY_REFRESH_TOKEN,
    renewalLock: commitThrowLock,
    shouldCommit: () => {
      throw new Error("dummy guard throw");
    },
    fsImpl: commitThrowFs,
  });
check(
  "throwing commit guard fails closed without rename or prepared orphan",
  commitThrowWrite.ok === false &&
    commitThrowWrite.reason ===
      "YOUTUBE_REFRESH_TOKEN_COMMIT_GUARD_FAILED" &&
    commitThrowFs.renameCount === 0 &&
    commitThrowFs.readFileSync(fakeEnvPath) ===
      fakeEnvText &&
    [...commitThrowFs.files.keys()].every(
      (path) => !path.endsWith(".prepared"),
    ),
);

const preExistingLockFs = new FakeFs(
  fakeEnvPath,
  fakeEnvText,
);
const renewalLockPath = join(
  dirname(fakeEnvPath),
  `.${basename(
    fakeEnvPath,
  )}.youtube-refresh-renewal.lock`,
);
preExistingLockFs.files.set(
  renewalLockPath,
  Buffer.alloc(0),
);
preExistingLockFs.metadata.set(renewalLockPath, {
  dev: 1,
  ino: 88,
  size: 0,
  mtimeMs: 500,
  ctimeMs: 500,
});
const preExistingLockResult =
  acquireYoutubeRefreshTokenRenewalLock({
    envPath: fakeEnvPath,
    fsImpl: preExistingLockFs,
  });
check(
  "pre-existing renewal lock blocks without env read and is never deleted",
  preExistingLockResult.ok === false &&
    preExistingLockResult.reason ===
      "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_ACTIVE_OR_ORPHANED" &&
    preExistingLockFs.readCount === 0 &&
    preExistingLockFs.existsSync(renewalLockPath),
);

const postCommitLockFailure =
  mergeYoutubeRefreshTokenLockRelease({
    result: {
      ok: true,
      refreshTokenSaved: true,
      expectedChannelMatched: true,
    },
    lockRelease: {
      ok: false,
      reason:
        "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_RELEASE_FAILED",
    },
  });
check(
  "post-commit lock cleanup failure never rewrites saved token fact to false",
  postCommitLockFailure.ok === false &&
    postCommitLockFailure.reason ===
      "YOUTUBE_REFRESH_TOKEN_RENEWAL_LOCK_RELEASE_FAILED_AFTER_SAVE" &&
    postCommitLockFailure.refreshTokenSaved === true &&
    postCommitLockFailure.lockCleanupFailed === true,
);

const realDummyDir = mkdtempSync(
  join(tmpdir(), "youtube-refresh-renewal-v1-"),
);
try {
  const realDummyEnvPath = join(
    realDummyDir,
    ".env.local",
  );
  writeFileSync(
    realDummyEnvPath,
    fakeEnvText,
    "utf8",
  );
  const realDummyLock =
    acquireYoutubeRefreshTokenRenewalLock({
      envPath: realDummyEnvPath,
    });
  const realDummyClient = readYoutubeOAuthClientFile({
    envPath: realDummyEnvPath,
  });
  const realDummyWrite =
    writeYoutubeRefreshTokenAtomically({
      envPath: realDummyEnvPath,
      expectedFileIdentity:
        realDummyClient.fileIdentity,
      refreshToken: DUMMY_REFRESH_TOKEN,
      renewalLock: realDummyLock,
      shouldCommit: allowCommit,
    });
  const realDummyReadback = readFileSync(
    realDummyEnvPath,
    "utf8",
  );
  check(
    "real same-directory atomic replace works on the current OS with dummy values",
    realDummyWrite.ok === true &&
      realDummyReadback.includes(
        `YOUTUBE_REFRESH_TOKEN=${DUMMY_REFRESH_TOKEN}`,
      ) &&
      realDummyReadback.includes(
        "INSTAGRAM_ACCESS_TOKEN=untouched-instagram",
      ),
  );
  const realDummyLockRelease =
    releaseYoutubeRefreshTokenRenewalLock({
      renewalLock: realDummyLock,
    });
  check(
    "real same-directory lock releases on the current OS",
    realDummyLockRelease.ok === true,
  );
} finally {
  rmSync(realDummyDir, {
    recursive: true,
    force: true,
  });
}

const gateIndex = cliSource.indexOf(
  "if (!authorization.ok)",
);
const serverStartIndex = cliSource.indexOf(
  "const server = createServer",
);
const lockAcquireIndex = cliSource.indexOf(
  "acquireYoutubeRefreshTokenRenewalLock({",
);
const envReadIndex = cliSource.indexOf(
  "readYoutubeOAuthClientFile({",
);
const browserInvokeIndex = cliSource.indexOf(
  "openDefaultBrowser(authorizationUrl)",
);
check(
  "CLI exact approval, server, and renewal lock precede env and browser authority",
  gateIndex >= 0 &&
    gateIndex < serverStartIndex &&
    serverStartIndex < lockAcquireIndex &&
    lockAcquireIndex < envReadIndex &&
    lockAcquireIndex < browserInvokeIndex,
);
const persistGuardIndex = cliSource.indexOf(
  "renewalAbortController.signal.aborted",
);
const atomicWriteIndex = cliSource.indexOf(
  "writeYoutubeRefreshTokenAtomically({",
);
check(
  "global monotonic deadline aborts fetches and is rechecked at commit",
  cliSource.includes(
    "const renewalAbortController = new AbortController()",
  ) &&
    cliSource.includes("AbortSignal.any([") &&
    cliSource.includes("closeAllConnections") &&
    cliSource.includes("performance.now()") &&
    cliSource.includes("shouldCommit: () => {") &&
    persistGuardIndex >= 0 &&
    persistGuardIndex < atomicWriteIndex,
);
const shouldCommitIndex = coreSource.indexOf(
  "commitDecision = shouldCommit();",
);
const finalIdentityIndex = coreSource.indexOf(
  "const finalTargetIdentity = normalizeFileIdentity(",
);
const renameIndex = coreSource.indexOf(
  "fsImpl.renameSync(tempPath, envPath);",
);
check(
  "commit sequence is guard then final target identity then immediate rename",
  shouldCommitIndex >= 0 &&
    shouldCommitIndex < finalIdentityIndex &&
    finalIdentityIndex < renameIndex,
);
check(
  "browser async errors and callback throws use the idempotent finalizer",
  cliSource.includes(
    'browserChild.once("error", () => {',
  ) &&
    cliSource.includes(
      "async function handleOAuthCallback",
    ) &&
    cliSource.includes(
      "function finalizeOnce(",
    ) &&
    cliSource.includes(
      'failureResult("YOUTUBE_OAUTH_CALLBACK_FAILED_SAFE")',
    ),
);
check(
  "CLI/core contain no video upload, Instagram, Blob, DB, shell, or parent-env authority",
  !/videos\.insert|media_publish|@vercel\/blob|supabase|process\.env|shell:\s*true/.test(
    `${cliSource}\n${coreSource}`,
  ),
);
check(
  "CLI browser open is argument-array based and never logs the authorization URL",
  cliSource.includes('"rundll32.exe"') &&
    cliSource.includes(
      '["url.dll,FileProtocolHandler", url]',
    ) &&
    !/console\.(?:log|error)\([^)]*authorizationUrl/.test(
      cliSource,
    ),
);

const inertRun = spawnSync(process.execPath, [CLI_PATH], {
  cwd: ROOT,
  encoding: "utf8",
  shell: false,
  env: {
    SystemRoot: process.env.SystemRoot,
    PATH: process.env.PATH,
  },
});
let inertSummary = null;
try {
  inertSummary = JSON.parse(
    inertRun.stdout.slice(
      inertRun.stdout.indexOf("{"),
      inertRun.stdout.lastIndexOf("}") + 1,
    ),
  );
} catch {}
check(
  "inert CLI run exits blocked with zero side effects",
  inertRun.status === 2 &&
    inertSummary?.status === "BLOCKED" &&
    inertSummary?.externalRequestCount === 0 &&
    inertSummary?.refreshTokenSaved === false &&
    inertSummary?.youtubeUploadCount === 0 &&
    inertSummary?.instagramActionCount === 0,
);

check(
  "package scripts expose explicit Owner run and fake-only guard",
  packageJson.scripts[
    "owner:youtube-refresh-token-renewal"
  ] ===
    "node scripts/run-youtube-refresh-token-renewal-v1.mjs" &&
    packageJson.scripts[
      "check:youtube-refresh-token-renewal-v1"
    ] ===
      "node scripts/check-youtube-refresh-token-renewal-v1.mjs",
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
