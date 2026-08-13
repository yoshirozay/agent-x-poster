---
name: Grok X poster
description: Post to X on the user's behalf via the grok-x-poster CLI. Use when they ask to tweet, post to X, or publish a thread.
---

# Grok X poster

This repo is a CLI. Run it on the user's machine. Do not put secrets in chat.

## Rules

1. Always confirm the exact post text (and that it should go out now) before posting.
2. Never print access tokens, refresh tokens, client secrets, `.env`, or `~/.config/grok-x-poster/credentials.json`.
3. If not connected, run `auth` and tell the user to approve the X page. Do not ask them to paste secrets into chat.
4. HTTP 402 / credits depleted: tell them to top up X API credits. Do not retry in a loop.
5. After a successful post, give them the `url` from the JSON output.

## Setup (once)

```bash
npx grok-x-poster auth
npx grok-x-poster whoami
```

## Commands

```bash
npx grok-x-poster post --text "exact text"
npx grok-x-poster thread --texts "one" --texts "two"
npx grok-x-poster whoami
```

Parse stdout JSON. On `ok: false`, report `error` and stop.

## Scheduling

Do not start a long-running scheduler. If they want a time, use a routine that runs `post` at that time.
