# FightBot

Discord bot for getting upcoming UFC events directly in your Discord

**Status:** ✅ Working (v0.1.0) — ufc.com started blocking scraper requests
via TLS fingerprinting, which broke `/fight` and `/fights`. Fixed by
switching the HTTP client to [`got-scraping`](https://github.com/apify/got-scraping),
which mimics a real browser's TLS/HTTP2 fingerprint. See
[`docs/fly-deployment.md`](docs/fly-deployment.md) for the full story and
hosting notes.

[Add to your Server](https://discord.com/api/oauth2/authorize?client_id=931732347219492904&permissions=125952&scope=bot%20applications.commands)

![Example](docs/example.jpg)

## Version

Current version: `0.1.0` (see [`package.json`](package.json)). This
project doesn't yet publish a changelog file — check `git log` for
history.

## Commands

`/fights` - Posts links to all upcoming events listed on the UFC's website in the current channel

`/fight` - Generates and posts a rich embed of the closest upcoming fight card in the current channel

`/fight-event` - Creates an event for the main card of the closest upcoming fight. Queries user for the host channel for the event in the current channel.
