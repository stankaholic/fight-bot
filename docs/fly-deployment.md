# Deploying to Fly.io

## Prerequisites

- `flyctl` installed (`curl -L https://fly.io/install.sh | sh`, then add
  `~/.fly/bin` to `PATH`).
- Logged in: `flyctl auth login` (interactive, opens a browser). Fly also
  requires payment info on the account before it will create an app, even
  on the free allowance.

## One-time app setup

```
flyctl apps create fight-bot
```

`fly.toml` already defines the app name, region, and build settings, so
`flyctl apps create` just registers the name on your Fly account — it
doesn't deploy anything yet.

### Why `heroku/builder:24` instead of a Dockerfile

`fly.toml` sets `builder = "heroku/builder:24"`, a Cloud Native Buildpack.
Fly detects it's a Node project from `package.json`, installs
dependencies, and runs `npm run build` automatically — no Dockerfile
needed. It also prunes dev dependencies and picks a start command from
the `start` script.

## Secrets

Discord token and related config are pushed as Fly secrets rather than
committed to the repo or baked into the image:

```
flyctl secrets set --app fight-bot \
  DISCORD_TOKEN="..." \
  CLIENT_ID="..." \
  GUILD_ID="..." \
  LOGGING_LEVEL="..." \
  REDIS_URL="..."
```

Secrets become real environment variables inside the machine at runtime.
This is why `npm start` must not depend on `env-cmd` finding a `.env`
file (see below) — there is no `.env` file on Fly, only injected env vars.

## Deploying

```
flyctl deploy --app fight-bot
```

This builds the image via the buildpack, pushes it to Fly's registry, and
rolls it out to existing machines (or creates new ones on first deploy).

### `npm start` had to drop `env-cmd`

The original `start` script was `npx env-cmd node ./dist/app.js`.
`env-cmd` throws and exits non-zero if it can't find a `.env` file at the
default paths — which is guaranteed on Fly, since secrets arrive as real
env vars, not a dotenv file. `app.ts` already imports `dotenv/config`,
which loads `.env` when present and is a silent no-op when it's absent,
so `env-cmd` was redundant locally and actively broke production. The
scripts now run `node` directly:

```json
"start": "node ./dist/app.js",
"register": "node ./dist/deploy-commands.js"
```

## Machines: primary + standby

A fresh deploy creates two machines (visible via `flyctl status`), both
marked `app†` ("Standby machine — it will take over only in case of host
hardware failure"). Fly's intent is for only one to run at a time.

**Watch out:** starting both machines manually (e.g. after they were
stopped) makes both run the bot process simultaneously. Since this bot
has no leader-election logic, both instances log into Discord with the
same token and both respond to every interaction — users see duplicate
replies. Keep exactly one `started`; leave the other `stopped`:

```
flyctl status --app fight-bot
flyctl machine stop <standby-machine-id> --app fight-bot
```

## Stopping / resuming the app

Stop without deleting the app, image, or secrets (reversible):

```
flyctl machine stop <machine-id> --app fight-bot
```

Resume later:

```
flyctl machine start <machine-id> --app fight-bot
```

## Useful commands

```
flyctl status --app fight-bot        # machine states/regions
flyctl logs --app fight-bot          # tail logs (Ctrl+C to stop)
flyctl logs --app fight-bot --no-tail  # recent logs, non-streaming
flyctl ssh console --app fight-bot   # shell into a running machine
```

Inside an `flyctl ssh console` session, buildpack images don't put
`node` on `PATH` by default — it lives at
`/layers/heroku_nodejs/dist/bin/node`.

## Debugging note: TLS fingerprinting, not IP blocking

Early on it looked like ufc.com was blocking Fly's datacenter IPs (403
on every request). That turned out to be wrong — it was TLS
fingerprinting: Node (and Linux's OpenSSL-based `curl`) present a TLS
handshake signature that ufc.com's bot protection flags, regardless of
which machine or network makes the request. This was confirmed by
testing from a Raspberry Pi on a residential connection, which got the
same 403. The fix was switching the HTTP client (`got-scraping`
instead of axios), not the hosting platform.
