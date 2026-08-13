import { TwitterApi } from "twitter-api-v2";
import { appCreds, loadStored, saveStored } from "./config.mjs";

export async function getAuthedClient() {
  const stored = loadStored();
  if (!stored?.refresh_token) {
    throw new Error("Not connected. Run: npx grok-x-poster auth");
  }
  const { clientId, clientSecret } = appCreds();
  const app = new TwitterApi({ clientId, clientSecret });
  const refreshed = await app.refreshOAuth2Token(stored.refresh_token);
  saveStored({
    ...stored,
    access_token: refreshed.accessToken,
    refresh_token: refreshed.refreshToken || stored.refresh_token,
  });
  return refreshed.client;
}

export function failJson(err) {
  const data = err?.data || null;
  return {
    ok: false,
    error: err?.message || String(err),
    code: err?.code || data?.status || null,
    detail: data?.detail || data?.title || null,
  };
}
