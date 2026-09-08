# FightBot

Discord bot for getting upcoming UFC events directly in your Discord

**Status:** ✅ Working (v0.1.0) — ufc.com started blocking scraper requests
via TLS fingerprinting, which broke `/fight` and `/fights`. Fixed by
switching the HTTP client to [`got-scraping`](https://github.com/apify/got-scraping),
which mimics a real browser's TLS/HTTP2 fingerprint. See
[`docs/fly-deployment.md`](docs/fly-deployment.md) for the full story and
hosting notes.

[Add to your Server](https://discord.com/api/oauth2/authorize?client_id=931732347219492904&permissions=17600775998464&scope=bot%20applications.commands)

![Example](docs/example.jpg)

## Version

Current version: `0.1.0` (see [`package.json`](package.json)). This
project doesn't yet publish a changelog file — check `git log` for
history.

## Commands

`/fights` - Posts links to all upcoming events listed on the UFC's website in the current channel

`/fight` - Generates and posts a rich embed of the closest upcoming fight card in the current channel

`/fight-event` - Creates an event for the main card of the closest upcoming fight. Queries user for the host channel for the event in the current channel.

## Permissions

The invite link above grants `View Channels`, `Send Messages`, `Embed
Links`, and `Manage Events` — everything the bot needs at the server
level.

`/fight-event` additionally needs `View Channel` and `Connect` on
whichever voice channel you pick in its menu. A channel-level permission
overwrite that hides a channel from `@everyone` blocks the bot too,
regardless of its server-wide permissions, unless the bot's role has its
own allow overwrite on that channel. If `/fight-event` fails with
"Missing Permissions," check that first.
