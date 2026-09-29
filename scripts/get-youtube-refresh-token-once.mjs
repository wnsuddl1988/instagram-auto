import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";

const ENV_PATH = ".env.local";
const REDIRECT_URI = "http://localhost:8080/oauth2callback";
const SCOPE = "https://www.googleapis.com/auth/youtube.upload";

function parseEnv(text) {
  const env = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (match) env.set(match[1], match[2].trim());
  }
  return env;
}

function setEnvValue(text, key, value) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^\\s*${escaped}\\s*=.*$`, "m");
  if (re.test(text)) return text.replace(re, `${key}=${value}`);

  // 새 키를 파일 끝에 붙인다. .env.local 이 CRLF 로 저장돼 있으면 마지막 줄 뒤에
  // \r 이 남아 새 줄이 이전 줄과 이어붙는다 — 그러면 파서가 두 키를 모두 놓친다.
  // 파일이 쓰는 개행을 따라가고, 끝 공백을 개행까지 포함해 정리한다.
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const trimmed = text.replace(/[\s\r\n]*$/, "");
  return `${trimmed}${eol}${key}=${value}${eol}`;
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("powershell.exe", ["-NoProfile", "-Command", "Start-Process", url], {
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }
  spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
}

const envText = readFileSync(ENV_PATH, "utf8");
const env = parseEnv(envText);
const clientId = env.get("YOUTUBE_CLIENT_ID");
const clientSecret = env.get("YOUTUBE_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  console.error("ABORT: YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET missing.");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? "/", REDIRECT_URI);
    if (requestUrl.pathname !== "/oauth2callback") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const error = requestUrl.searchParams.get("error");
    if (error) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Google OAuth error: ${error}`);
      console.error(`ABORT: Google OAuth error: ${error}`);
      server.close();
      process.exitCode = 1;
      return;
    }

    const code = requestUrl.searchParams.get("code");
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Missing code.");
      console.error("ABORT: missing OAuth code.");
      server.close();
      process.exitCode = 1;
      return;
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.refresh_token) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Token exchange failed. Return to Codex.");
      console.error("ABORT: token exchange failed or refresh_token missing.");
      server.close();
      process.exitCode = 1;
      return;
    }

    const latestEnv = readFileSync(ENV_PATH, "utf8");
    writeFileSync(ENV_PATH, setEnvValue(latestEnv, "YOUTUBE_REFRESH_TOKEN", tokenJson.refresh_token), "utf8");

    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("YouTube refresh token saved to .env.local. You can close this tab.");
    console.log("YOUTUBE_REFRESH_TOKEN=saved");
    server.close();
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Unexpected error. Return to Codex.");
    console.error(`ABORT: ${error instanceof Error ? error.message : String(error)}`);
    server.close();
    process.exitCode = 1;
  }
});

server.listen(8080, "127.0.0.1", () => {
  console.log("Opening Google OAuth login...");
  console.log("After approval, YOUTUBE_REFRESH_TOKEN will be saved without printing it.");
  // 브라우저 자동 실행이 막히는 환경이 있어 URL도 함께 출력한다.
  // 이 URL에는 client_id(공개 식별자)만 들어가고 secret은 포함되지 않는다.
  console.log("");
  console.log("브라우저가 자동으로 열리지 않으면 아래 주소를 직접 여세요:");
  console.log(authUrl.toString());
  console.log("");
  openBrowser(authUrl.toString());
});
