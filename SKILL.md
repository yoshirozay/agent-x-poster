---
name: Grok X poster
description: Post to X on the user behalf via grok-x-poster CLI.
---

# Grok X poster

Confirm exact text before posting. Never print secrets. Run auth if not connected. 402 means credits are empty.

npx grok-x-poster auth
npx grok-x-poster whoami
npx grok-x-poster post --text "exact text"
npx grok-x-poster thread --texts "one" --texts "two"
