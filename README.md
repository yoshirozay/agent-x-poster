# grok-x-poster

Tell your bot what to post. It posts as you.

You type in chat. The bot shows the exact text. You say yes. It goes out.

While you work, it can also stop and say this would be a good post, with a draft. Wave it off, or tell it to send.

Under the hood it is a tiny CLI. After the one-time X setup, you should not have to run commands.

You need an X developer account and a credit balance first. A zero balance returns 402.

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

Fill `X_CLIENT_ID` and `X_CLIENT_SECRET`.

## 2. Load credits

Open Billing in the [Developer Console](https://console.x.com). Add a payment method and buy credits.

There is no free posting tier for new apps. If the balance is empty, every call fails with `402` and nothing posts. Buy a small amount to start. Each post and each `whoami` spends credits.

## 3. Connect your account

```bash
npx grok-x-poster auth
```

Approve the X page in the browser. Tokens are stored in `~/.config/grok-x-poster/credentials.json` (mode 0600), not in this repo.

## 4. Post from chat

Talk to the bot the way you talk to a person.

- Post that we shipped the lounge.
- Thread these two lines for me.
- Yeah, send that.

It writes the exact text back to you and waits. Nothing goes to X until you confirm that wording.

If credits are empty it says so (402) and stops. Load more in Billing. Do not have it retry in a loop.

## Radar

The other skill is [RADAR.md](RADAR.md). While you are in the middle of work, the bot flags a moment that would make a good post. One short beat. Easy to wave off.

Same rule: it never posts, or quote-replies, until you confirm the exact text.

Drop both `SKILL.md` and `RADAR.md` into the agent's skills folder.

## Under the hood

The agent runs a CLI after you say yes. You can run it yourself. Most people never do.

    npx grok-x-poster whoami
    npx grok-x-poster post --text "exact text"
    npx grok-x-poster thread --texts "first" --texts "second"

Scheduling is a routine or cron that later asks the bot to post. This package does not keep a process running.

## License

MIT
