#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runAuth } from "./auth.mjs";
import { getAuthedClient, failJson } from "./client.mjs";

function loadDotenv() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
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

function usage() {
  return `grok-x-poster

  auth                         Connect an X account
  whoami                       Print the connected username
  post --text "..."            Publish a post
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

  if (cmd === "auth") {
    const result = await runAuth();
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  if (cmd === "whoami") {
    const client = await getAuthedClient();
    const me = await client.v2.me();
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
    if (!text) throw new Error("Usage: grok-x-poster post --text \"...\"");
    const client = await getAuthedClient();
    const posted = await client.v2.tweet(text);
    const me = await client.v2.me();
    const id = posted.data?.id;
    const username = me.data?.username;
    console.log(JSON.stringify({
      ok: true,
      tweet_id: id,
      username,
      url: id && username ? `https://x.com/${username}/status/${id}` : null,
      text,
    }));
    process.exit(0);
  }

  if (cmd === "thread") {
    const texts = argsAll("--texts").filter(Boolean);
    if (texts.length < 2) throw new Error("Usage: grok-x-poster thread --texts \"one\" --texts \"two\"");
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
    const me = await client.v2.me();
    const username = me.data?.username;
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
