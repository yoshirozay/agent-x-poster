---
name: Agent X poster
description: Post to X from chat on the user's behalf. Use when they ask to tweet, post to X, or publish a thread.
---

# Agent X poster

The user talks in chat. They do not run the CLI. You do, after they confirm.

Do not put secrets in chat.

## Rules

1. Treat chat as the interface. If they say what to post, draft the exact text in chat and wait.
2. Always confirm the exact post text (and that it should go out now) before posting.
3. Never print access tokens, refresh tokens, client secrets, `.env`, or `~/.config/agent-x-poster/credentials.json`.
4. First run `npx agent-x-poster status`. If `client_id_set` or `client_secret_set` is false, run `npx agent-x-poster setup` and tell them a local page opened. They paste Client ID and Client Secret there, not in chat. Do not run `auth` until `status` shows both set. Do not ask them to paste secrets into chat.
5. If those are set and `connected` is false, run `auth` and tell the user to approve the X page.
6. HTTP 402 / credits depleted: tell them to top up X API credits. Do not retry in a loop.
7. After a successful post, give them the `url` from the JSON output.

## Chat

They might say:

- Post that we shipped the lounge.
- Thread these two lines.
- Yeah, send that.

Write the exact text back. Wait for a yes. Then run the CLI.

## Commands (you run these, not them)

    npx agent-x-poster status
    npx agent-x-poster setup
    npx agent-x-poster auth
    npx agent-x-poster whoami
    npx agent-x-poster post --text "exact text"
    npx agent-x-poster post --text "exact text" --quote <id-or-url>
    npx agent-x-poster thread --texts "one" --texts "two"

Parse stdout JSON. On `ok: false`, report `error` and stop.

## Scheduling

Do not start a long-running scheduler. If they want a time, use a routine that later posts the confirmed text.
