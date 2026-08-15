import http from "node:http";
import { writeFileSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { callbackPort } from "./config.mjs";

const SETUP_PORT = Number(process.env.AGENT_X_POSTER_SETUP_PORT || 8788);

function envPath() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env");
}

function page() {
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Connect agent-x-poster</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #0b0b0c; color: #f4f4f5; }
  main { width: min(28rem, calc(100% - 2rem)); }
  h1 { font-size: 1.25rem; font-weight: 650; margin: 0 0 .4rem; }
  p { color: #a1a1aa; line-height: 1.45; margin: 0 0 1.25rem; }
  a { color: #e4e4e7; }
  label { display: block; font-size: .8rem; color: #a1a1aa; margin: 0 0 .35rem; }
  input { width: 100%; box-sizing: border-box; border: 1px solid #3f3f46; background: #18181b; color: #fafafa; border-radius: 10px; padding: .7rem .8rem; font: inherit; margin-bottom: .9rem; }
  button { width: 100%; border: 0; border-radius: 999px; padding: .75rem 1rem; font: inherit; font-weight: 600; background: #fafafa; color: #111; cursor: pointer; }
  button:disabled { opacity: .5; cursor: default; }
  .ok { color: #d4d4d8; }
  .err { color: #fca5a5; }
</style>
<main>
  <h1>Add your X app keys</h1>
  <p>From the <a href="https://developer.x.com" target="_blank" rel="noreferrer">X developer console</a>: create a Web App / Automated App or Bot. Callback URL must be <code>http://127.0.0.1:${callbackPort()}/callback</code>. Paste the OAuth 2.0 Client ID and Client Secret here. They stay on this computer.</p>
  <form id="f">
    <label for="id">Client ID</label>
    <input id="id" name="client_id" autocomplete="off" spellcheck="false" required>
    <label for="secret">Client Secret</label>
    <input id="secret" name="client_secret" type="password" autocomplete="off" required>
    <button type="submit">Save on this computer</button>
  </form>
  <p id="msg" hidden></p>
</main>
<script>
  const f = document.getElementById("f");
  const msg = document.getElementById("msg");
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = f.querySelector("button");
    btn.disabled = true;
    msg.hidden = true;
    const body = new URLSearchParams({
      client_id: document.getElementById("id").value.trim(),
      client_secret: document.getElementById("secret").value.trim(),
    });
    try {
      const res = await fetch("/save", { method: "POST", body });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      f.hidden = true;
      msg.className = "ok";
      msg.textContent = "Saved. You can close this tab. Approve X next if a new page opens.";
      msg.hidden = false;
    } catch (err) {
      msg.className = "err";
      msg.textContent = err.message || "Save failed";
      msg.hidden = false;
      btn.disabled = false;
    }
  });
</script>
</html>`;
}

function writeEnv(clientId, clientSecret) {
  const text = `X_CLIENT_ID=${clientId}\nX_CLIENT_SECRET=${clientSecret}\n# AGENT_X_POSTER_CALLBACK_PORT=8787\n`;
  const p = envPath();
  writeFileSync(p, text, { encoding: "utf8", mode: 0o600 });
  chmodSync(p, 0o600);
  process.env.X_CLIENT_ID = clientId;
  process.env.X_CLIENT_SECRET = clientSecret;
  return p;
}

function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  execFile(cmd, args, () => {});
}

export async function runSetup() {
  const url = `http://127.0.0.1:${SETUP_PORT}/`;
  return await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const u = new URL(req.url, url);
        if (req.method === "GET" && u.pathname === "/") {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(page());
          return;
        }
        if (req.method === "POST" && u.pathname === "/save") {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const params = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
          const clientId = (params.get("client_id") || "").trim();
          const clientSecret = (params.get("client_secret") || "").trim();
          if (!clientId || !clientSecret) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: "Both fields are required." }));
            return;
          }
          writeEnv(clientId, clientSecret);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
          setTimeout(() => {
            server.close();
            resolve({ ok: true, saved: true });
          }, 200);
          return;
        }
        res.writeHead(404);
        res.end("Not found");
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Save failed" }));
        server.close();
        reject(err);
      }
    });

    server.listen(SETUP_PORT, "127.0.0.1", () => {
      console.log(JSON.stringify({ ok: true, stage: "waiting", setup_url: url }));
      openBrowser(url);
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting (5 minutes)"));
    }, 5 * 60 * 1000);
  });
}
