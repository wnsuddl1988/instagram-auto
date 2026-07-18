/**
 * Owner-run YouTube refresh-token renewal.
 *
 * This command is inert unless BOTH --arm and the exact approval token are
 * present. An armed run opens Google OAuth in the default browser, validates
 * state + PKCE, verifies the authenticated YouTube channel, then atomically
 * replaces only YOUTUBE_REFRESH_TOKEN in .env.local.
 *
 * It never uploads a video, calls Instagram/Blob/DB, prints or derives a token,
 * or enables the existing dual-platform publish runner.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

import {
  YOUTUBE_REFRESH_TOKEN_RENEWAL_APPROVAL,
  YOUTUBE_REFRESH_TOKEN_RENEWAL_REDIRECT_URI,
  YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES,
  YOUTUBE_REFRESH_TOKEN_RENEWAL_TIMEOUT_MS,
  acquireYoutubeRefreshTokenRenewalLock,
  buildYoutubeOAuthAuthorizationUrl,
  completeYoutubeRefreshTokenRenewal,
  createYoutubeOAuthSession,
  mergeYoutubeRefreshTokenLockRelease,
  readYoutubeOAuthClientFile,
  releaseYoutubeRefreshTokenRenewalLock,
  validateYoutubeRefreshTokenRenewalAuthorization,
  writeYoutubeRefreshTokenAtomically,
} from "../lib/youtube-refresh-token-renewal.mjs";

const REPO_ROOT = join(
  import.meta.dirname,
  "..",
);
const ENV_PATH = join(REPO_ROOT, ".env.local");
const args = process.argv.slice(2);

function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 && index + 1 < args.length
    ? args[index + 1]
    : null;
}

function safeResult(result) {
  const externalRequestCount =
    result.externalRequestCount ?? 0;
  const oauthBrowserOpenCount =
    result.oauthBrowserOpenCount ?? 0;
  const refreshTokenSaved =
    result.refreshTokenSaved === true;
  return {
    status: result.ok === true ? "SUCCESS" : "BLOCKED",
    reason: result.reason ?? null,
    noLive:
      externalRequestCount === 0 &&
      oauthBrowserOpenCount === 0 &&
      refreshTokenSaved === false,
    expectedChannelId:
      result.expectedChannelId ?? null,
    expectedChannelMatched:
      result.expectedChannelMatched === true,
    refreshTokenSaved,
    postCommitReadbackFailed:
      result.postCommitReadbackFailed === true,
    lockCleanupFailed:
      result.lockCleanupFailed === true,
    externalRequestCount,
    oauthBrowserOpenCount,
    youtubeUploadCount:
      result.youtubeUploadCount ?? 0,
    instagramActionCount:
      result.instagramActionCount ?? 0,
    blobMutationCount:
      result.blobMutationCount ?? 0,
    databaseMutationCount:
      result.databaseMutationCount ?? 0,
    credentialValuesPrinted: false,
    credentialValueDerivativesPrinted: false,
  };
}

function printSafeResult(result) {
  console.log(JSON.stringify(safeResult(result), null, 2));
}

function openDefaultBrowser(url) {
  let child;
  if (process.platform === "win32") {
    child = spawn(
      "rundll32.exe",
      ["url.dll,FileProtocolHandler", url],
      {
        detached: true,
        stdio: "ignore",
        shell: false,
        windowsHide: true,
      },
    );
  } else if (process.platform === "darwin") {
    child = spawn("open", [url], {
      detached: true,
      stdio: "ignore",
      shell: false,
    });
  } else {
    child = spawn("xdg-open", [url], {
      detached: true,
      stdio: "ignore",
      shell: false,
    });
  }
  child.unref();
  return child;
}

const authorization =
  validateYoutubeRefreshTokenRenewalAuthorization({
    armed: args.includes("--arm"),
    approval: getArg("--approval"),
    expectedChannelId: getArg(
      "--expected-channel-id",
    ),
  });

// Critical gate: no env read, server, browser, or network exists above this.
if (!authorization.ok) {
  printSafeResult({
    ok: false,
    reason: authorization.reason,
    refreshTokenSaved: false,
    externalRequestCount: 0,
    youtubeUploadCount: 0,
    instagramActionCount: 0,
    blobMutationCount: 0,
    databaseMutationCount: 0,
  });
  console.log(
    `Required approval: --arm --approval ${YOUTUBE_REFRESH_TOKEN_RENEWAL_APPROVAL} --expected-channel-id <UC...>`,
  );
  process.exit(2);
}

const redirect = new URL(
  YOUTUBE_REFRESH_TOKEN_RENEWAL_REDIRECT_URI,
);
let callbackHandled = false;
let timeoutHandle = null;
let oauthClient = null;
let session = null;
let deadlineAtMs = null;
let finalized = false;
let externalRequestCount = 0;
let oauthBrowserOpenCount = 0;
let renewalLock = null;
const renewalAbortController = new AbortController();
const openSockets = new Set();

function failureResult(reason) {
  return {
    ok: false,
    reason,
    expectedChannelId:
      authorization.expectedChannelId,
    refreshTokenSaved: false,
    externalRequestCount,
    oauthBrowserOpenCount,
    youtubeUploadCount: 0,
    instagramActionCount: 0,
    blobMutationCount: 0,
    databaseMutationCount: 0,
  };
}

function closeServer(forceConnections) {
  try {
    server.close();
  } catch {}
  if (forceConnections === true) {
    if (
      typeof server.closeAllConnections === "function"
    ) {
      server.closeAllConnections();
    } else {
      for (const socket of openSockets) {
        socket.destroy();
      }
    }
  }
}

function finalizeOnce(
  result,
  {
    response = null,
    forceConnections = false,
  } = {},
) {
  if (finalized) return false;
  finalized = true;
  callbackHandled = true;
  if (timeoutHandle) clearTimeout(timeoutHandle);
  renewalAbortController.abort();

  const lockRelease =
    releaseYoutubeRefreshTokenRenewalLock({
      renewalLock,
    });
  renewalLock = null;
  const finalResult =
    mergeYoutubeRefreshTokenLockRelease({
      result,
      lockRelease,
    });

  try {
    if (response && response.headersSent !== true) {
      response.writeHead(finalResult.ok ? 200 : 400, {
        "Content-Type": "text/plain; charset=utf-8",
      });
    }
    if (response && response.writableEnded !== true) {
      response.end(
        finalResult.ok
          ? "YouTube channel verified and refresh token saved. You can close this tab."
          : `Refresh-token renewal stopped safely: ${finalResult.reason}`,
      );
    }
  } catch {}
  printSafeResult(finalResult);
  if (oauthClient) {
    oauthClient.clientId = null;
    oauthClient.clientSecret = null;
    oauthClient.fileIdentity = null;
    oauthClient = null;
  }
  if (session) {
    session.state = null;
    session.codeVerifier = null;
    session.codeChallenge = null;
    session = null;
  }
  closeServer(forceConnections);
  process.exitCode = finalResult.ok ? 0 : 1;
  return true;
}

const fetchWithTimeout = (url, options) => {
  externalRequestCount += 1;
  return fetch(url, {
    ...options,
    signal: AbortSignal.any([
      renewalAbortController.signal,
      AbortSignal.timeout(30_000),
    ]),
  });
};

async function handleOAuthCallback(request, response) {
  try {
    const requestUrl = new URL(
      request.url ?? "/",
      YOUTUBE_REFRESH_TOKEN_RENEWAL_REDIRECT_URI,
    );
    if (requestUrl.pathname !== redirect.pathname) {
      response.writeHead(404, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("Not found.");
      return;
    }
    if (callbackHandled) {
      response.writeHead(409, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end(
        "This OAuth callback was already handled.",
      );
      return;
    }
    if (!oauthClient || !session) {
      response.writeHead(503, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("OAuth session is not ready.");
      return;
    }
    callbackHandled = true;

    const result =
      await completeYoutubeRefreshTokenRenewal({
        callbackUrl: requestUrl.toString(),
        expectedState: session.state,
        codeVerifier: session.codeVerifier,
        clientId: oauthClient.clientId,
        clientSecret: oauthClient.clientSecret,
        expectedChannelId:
          authorization.expectedChannelId,
        fetchImpl: fetchWithTimeout,
        persistRefreshToken: (refreshToken) => {
          if (
            renewalAbortController.signal.aborted ||
            deadlineAtMs === null ||
            performance.now() >= deadlineAtMs
          ) {
            return {
              ok: false,
              reason:
                "YOUTUBE_OAUTH_OWNER_TIMEOUT_BEFORE_SAVE",
              refreshTokenSaved: false,
            };
          }
          return writeYoutubeRefreshTokenAtomically({
            envPath: ENV_PATH,
            expectedFileIdentity:
              oauthClient.fileIdentity,
            refreshToken,
            renewalLock,
            shouldCommit: () => {
              if (
                finalized ||
                renewalAbortController.signal.aborted ||
                deadlineAtMs === null ||
                performance.now() >= deadlineAtMs
              ) {
                return {
                  ok: false,
                  reason:
                    "YOUTUBE_OAUTH_OWNER_TIMEOUT_BEFORE_SAVE",
                };
              }
              return { ok: true };
            },
          });
        },
      });
    finalizeOnce(result, { response });
  } catch {
    finalizeOnce(
      failureResult("YOUTUBE_OAUTH_CALLBACK_FAILED_SAFE"),
      {
        response,
        forceConnections: true,
      },
    );
  }
}

const server = createServer((request, response) => {
  void handleOAuthCallback(request, response);
});

server.on("connection", (socket) => {
  openSockets.add(socket);
  socket.once("close", () => {
    openSockets.delete(socket);
  });
});

server.on("error", (error) => {
  finalizeOnce(
    failureResult(
      error?.code === "EADDRINUSE"
        ? "YOUTUBE_OAUTH_SINGLE_FLIGHT_PORT_IN_USE"
        : "YOUTUBE_OAUTH_LOOPBACK_SERVER_FAILED",
    ),
    { forceConnections: true },
  );
});

server.listen(
  Number(redirect.port),
  "127.0.0.1",
  () => {
    try {
      const acquiredLock =
        acquireYoutubeRefreshTokenRenewalLock({
          envPath: ENV_PATH,
        });
      if (!acquiredLock.ok) {
        finalizeOnce(failureResult(acquiredLock.reason), {
          forceConnections: true,
        });
        return;
      }
      renewalLock = acquiredLock;

      const loadedClient = readYoutubeOAuthClientFile({
        envPath: ENV_PATH,
      });
      if (!loadedClient.ok) {
        finalizeOnce(failureResult(loadedClient.reason), {
          forceConnections: true,
        });
        return;
      }
      oauthClient = loadedClient;
      session = createYoutubeOAuthSession();
      const authorizationUrl =
        buildYoutubeOAuthAuthorizationUrl({
          clientId: oauthClient.clientId,
          state: session.state,
          codeChallenge: session.codeChallenge,
        });

      deadlineAtMs =
        performance.now() +
        YOUTUBE_REFRESH_TOKEN_RENEWAL_TIMEOUT_MS;
      timeoutHandle = setTimeout(() => {
        finalizeOnce(
          failureResult("YOUTUBE_OAUTH_OWNER_TIMEOUT"),
          { forceConnections: true },
        );
      }, YOUTUBE_REFRESH_TOKEN_RENEWAL_TIMEOUT_MS);
      timeoutHandle.unref();

      console.log(
        "Opening Google OAuth for an Owner-confirmed YouTube refresh-token renewal.",
      );
      console.log(
        `Expected public YouTube channel: ${authorization.expectedChannelId}`,
      );
      console.log(
        `Requested scopes: ${YOUTUBE_REFRESH_TOKEN_RENEWAL_SCOPES.join(
          ", ",
        )}`,
      );
      console.log(
        "No video upload, Instagram action, Blob mutation, or database action is enabled.",
      );
      try {
        const browserChild =
          openDefaultBrowser(authorizationUrl);
        oauthBrowserOpenCount += 1;
        browserChild.once("error", () => {
          finalizeOnce(
            failureResult(
              "YOUTUBE_OAUTH_BROWSER_OPEN_FAILED",
            ),
            { forceConnections: true },
          );
        });
      } catch {
        finalizeOnce(
          failureResult(
            "YOUTUBE_OAUTH_BROWSER_OPEN_FAILED",
          ),
          { forceConnections: true },
        );
      }
    } catch {
      finalizeOnce(
        failureResult(
          "YOUTUBE_OAUTH_SESSION_START_FAILED_SAFE",
        ),
        { forceConnections: true },
      );
    }
  },
);
