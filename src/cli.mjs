#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAuth } from "./auth.mjs";
import { runSetup } from "./setup.mjs";
import { getAuthedClient, getUsername, fetchMe, failJson } from "./client.mjs";
import { appCredsState, loadStored } from "./config.mjs";

function loadDotenv() {
  const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const paths = [...new Set([resolve(process.cwd(), ".env"), resolve(pkgRoot, ".env")])];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (process.env[k] == null) process.env[k] = v;
    }
  }
}

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function argsAll(name) {
  const out = [];
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === name && process.argv[i + 1]) out.push(process.argv[i + 1]);
  }
  return out;
}

function quoteId(raw) {
  if (!raw) return null;
  const fromUrl = String(raw).match(/status\/(\d+)/);
  if (fromUrl) return fromUrl[1];
  const digits = String(raw).match(/^(\d+)$/);
  return digits ? digits[1] : null;
}

function usage() {
  return `agent-x-poster

  setup                        Open a local page to save Client ID and Secret
  status                       Check .env and whether an account is connected
  auth                         Connect an X account
  whoami                       Print the connected username
  post --text "..."            Publish a post
  post --text "..." --quote <id-or-url>
  thread --texts "a" --texts "b"
  help                         This message
`;
}

loadDotenv();
const cmd = process.argv[2] || "help";

try {
  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(usage());
    process.exit(0);
  }

  if (cmd === "setup") {
    const saved = await runSetup();
    const result = await runAuth();
    console.log(JSON.stringify({ ...saved, ...result }));
    process.exit(0);
  }

  if (cmd === "status") {
    const { clientIdSet, clientSecretSet } = appCredsState();
    const stored = loadStored();
    const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    console.log(JSON.stringify({
      ok: true,
      env_file: existsSync(resolve(process.cwd(), ".env")) || existsSync(resolve(pkgRoot, ".env")),
      client_id_set: clientIdSet,
      client_secret_set: clientSecretSet,
      connected: Boolean(stored?.refresh_token),
      username: stored?.username || null,
    }));
    process.exit(0);
  }

  if (cmd === "auth") {
    const result = await runAuth();
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  if (cmd === "whoami") {
    const client = await getAuthedClient();
    const me = await fetchMe(client);
    console.log(JSON.stringify({
      ok: true,
      username: me.data?.username,
      user_id: me.data?.id,
      name: me.data?.name,
    }));
    process.exit(0);
  }

  if (cmd === "post") {
    const text = arg("--text");
    if (!text) throw new Error("Usage: agent-x-poster post --text \"...\" [--quote <id-or-url>]");
    const quote = quoteId(arg("--quote"));
    if (arg("--quote") && !quote) throw new Error("--quote needs a status id or x.com status URL");
    const client = await getAuthedClient();
    const posted = await client.v2.tweet(quote ? { text, quote_tweet_id: quote } : text);
    const username = await getUsername(client);
    const id = posted.data?.id;
    console.log(JSON.stringify({
      ok: true,
      tweet_id: id,
      username,
      url: id && username ? `https://x.com/${username}/status/${id}` : null,
      text,
      quote_id: quote,
    }));
    process.exit(0);
  }

  if (cmd === "thread") {
    const texts = argsAll("--texts").filter(Boolean);
    if (texts.length < 2) throw new Error("Usage: agent-x-poster thread --texts \"one\" --texts \"two\"");
    const client = await getAuthedClient();
    let replyTo = null;
    const ids = [];
    for (const text of texts) {
      const posted = await client.v2.tweet(
        replyTo ? { text, reply: { in_reply_to_tweet_id: replyTo } } : { text }
      );
      replyTo = posted.data?.id;
      ids.push(replyTo);
    }
    const username = await getUsername(client);
    console.log(JSON.stringify({
      ok: true,
      tweet_ids: ids,
      username,
      url: ids[0] && username ? `https://x.com/${username}/status/${ids[0]}` : null,
    }));
    process.exit(0);
  }

  throw new Error("Unknown command: " + cmd + "\n" + usage());
} catch (err) {
  console.log(JSON.stringify(failJson(err)));
  process.exit(1);
}
