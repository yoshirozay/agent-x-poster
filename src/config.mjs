import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

export const SCOPES = [
  "tweet.read",
  "tweet.write",
  "users.read",
  "offline.access",
];

export function credsDir() {
  const next = join(homedir(), ".config", "agent-x-poster");
  const prev = join(homedir(), ".config", "grok-x-poster");
  if (existsSync(join(next, "credentials.json"))) return next;
  if (existsSync(join(prev, "credentials.json"))) return prev;
  return next;
}

export function credsPath() {
  return join(credsDir(), "credentials.json");
}

export function callbackPort() {
  return Number(
    process.env.AGENT_X_POSTER_CALLBACK_PORT
    || process.env.GROK_X_POSTER_CALLBACK_PORT
    || 8787
  );
}

export function callbackUrl() {
  return `http://127.0.0.1:${callbackPort()}/callback`;
}

export function appCredsState() {
  const clientId = (process.env.X_CLIENT_ID || "").trim();
  const clientSecret = (process.env.X_CLIENT_SECRET || "").trim();
  return {
    clientId,
    clientSecret,
    clientIdSet: Boolean(clientId),
    clientSecretSet: Boolean(clientSecret),
  };
}

export function appCreds() {
  const { clientId, clientSecret, clientIdSet, clientSecretSet } = appCredsState();
  if (!clientIdSet || !clientSecretSet) {
    throw new Error(
      "X_CLIENT_ID and X_CLIENT_SECRET are empty. Put them in .env from the X developer console, then run auth. Do not open X until both are set."
    );
  }
  return { clientId, clientSecret };
}

export function loadStored() {
  const p = credsPath();
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

export function saveStored(data) {
  const dir = credsDir();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(credsPath(), JSON.stringify(data, null, 2), { mode: 0o600 });
}
