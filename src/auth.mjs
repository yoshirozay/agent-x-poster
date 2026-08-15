import http from "node:http";
import { TwitterApi } from "twitter-api-v2";
import { appCreds, callbackPort, callbackUrl, saveStored, SCOPES } from "./config.mjs";

export async function runAuth() {
  const { clientId, clientSecret } = appCreds();
  const redirectUri = callbackUrl();
  const app = new TwitterApi({ clientId, clientSecret });
  const { url, codeVerifier, state } = app.generateOAuth2AuthLink(redirectUri, {
    scope: SCOPES,
  });

  return await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const u = new URL(req.url, `http://127.0.0.1:${callbackPort()}`);
        if (u.pathname !== "/callback") {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        const code = u.searchParams.get("code");
        const st = u.searchParams.get("state");
        if (!code || st !== state) {
          res.writeHead(400);
          res.end("Invalid callback");
          server.close();
          reject(new Error("Invalid callback"));
          return;
        }
        const { accessToken, refreshToken, expiresIn } = await app.loginWithOAuth2({
          code,
          codeVerifier,
          redirectUri,
        });
        const userClient = new TwitterApi(accessToken);
        const me = await userClient.v2.me();
        saveStored({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresIn ? Date.now() + expiresIn * 1000 : null,
          user_id: me.data?.id,
          username: me.data?.username,
        });
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<html><body style="font-family:system-ui;padding:2rem"><h1>Connected</h1><p>@${me.data?.username || "user"} is connected. You can close this tab.</p></body></html>`);
        setTimeout(() => server.close(), 200);
        resolve({
          ok: true,
          username: me.data?.username,
          user_id: me.data?.id,
        });
      } catch (err) {
        res.writeHead(500);
        res.end("Connect failed");
        server.close();
        reject(err);
      }
    });

    server.listen(callbackPort(), "127.0.0.1", () => {
      console.log(JSON.stringify({ ok: true, stage: "waiting", authorize_url: url }));
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting (5 minutes)"));
    }, 5 * 60 * 1000);
  });
}
