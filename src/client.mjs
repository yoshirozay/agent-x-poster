import { TwitterApi } from "twitter-api-v2";
import { appCreds, loadStored, saveStored } from "./config.mjs";

export async function getAuthedClient() {
  const stored = loadStored();
  if (!stored?.refresh_token) {
    throw new Error("Not connected. Run: npx agent-x-poster auth");
  }
  // X rotates refresh tokens on every refresh, so only refresh near expiry.
  if (stored.access_token && stored.expires_at && Date.now() < stored.expires_at - 60 * 1000) {
    return new TwitterApi(stored.access_token);
  }
  const { clientId, clientSecret } = appCreds();
  const app = new TwitterApi({ clientId, clientSecret });
  const refreshed = await app.refreshOAuth2Token(stored.refresh_token);
  saveStored({
    ...stored,
    access_token: refreshed.accessToken,
    refresh_token: refreshed.refreshToken || stored.refresh_token,
    expires_at: refreshed.expiresIn ? Date.now() + refreshed.expiresIn * 1000 : null,
  });
  return refreshed.client;
}

export async function fetchMe(client) {
  const me = await client.v2.me();
  const stored = loadStored();
  if (stored && (stored.username !== me.data?.username || stored.user_id !== me.data?.id)) {
    saveStored({ ...stored, username: me.data?.username, user_id: me.data?.id });
  }
  return me;
}

export async function getUsername(client) {
  const stored = loadStored();
  if (stored?.username) return stored.username;
  const me = await fetchMe(client);
  return me.data?.username;
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
