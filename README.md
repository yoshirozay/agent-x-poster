# grok-x-poster

Give your Grok Bot (or any agent) the ability to post to X on your behalf.

No frontend. No calendar. No daemon. You connect an X account once; the bot runs a tiny CLI when you tell it to post.

## Install

```bash
git clone https://github.com/yoshirozay/grok-x-poster.git
cd grok-x-poster
npm install
```

## 1. Create an X app

1. Open [developer.x.com](https://developer.x.com) and create a project + app.
2. User authentication: **Web App / Automated App or Bot** (confidential client).
3. Callback URL: `http://127.0.0.1:8787/callback`
4. Website URL: any `https://` URL you own.
5. Copy the OAuth 2.0 **Client ID** and **Client Secret**.

```bash
cp .env.example .env
```

Fill `X_CLIENT_ID` and `X_CLIENT_SECRET`. X API calls use pay-per-use credits. An empty balance returns HTTP 402.

## 2. Connect your account

```bash
npx grok-x-poster auth
```

Approve the X page in the browser. Tokens are stored in `~/.config/grok-x-poster/credentials.json` (mode 0600), not in this repo.

## 3. Post

```bash
npx grok-x-poster whoami
npx grok-x-poster post --text "hello from my agent"
npx grok-x-poster thread --texts "first" --texts "second"
```

## Grok Bot / agents

See [SKILL.md](SKILL.md). The agent should always confirm the exact text with you before posting, and must never print secrets.

Scheduling is a routine or cron that later runs `post`. This package does not keep a process running.

## License

MIT
