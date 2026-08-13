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
  return join(homedir(), ".config", "grok-x-poster");
}

export function credsPath() {
  return join(credsDir(), "credentials.json");
}

export function callbackPort() {
  return Number(process.env.GROK_X_POSTER_CALLBACK_PORT || 8787);
}

export function callbackUrl() {
  return `http://127.0.0.1:${callbackPort()}/callback`;
}

export function appCreds() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Set X_CLIENT_ID and X_CLIENT_SECRET (see .env.example)");
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
