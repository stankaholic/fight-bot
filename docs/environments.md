# Environments

Which Fly.io app runs which code, using which env file, logged in as
which Discord bot. Machine IDs can change if a machine is destroyed and
recreated — treat them as "current as of the last check," and confirm
with `flyctl status --app <name>` if in doubt.

## Production

| | |
|---|---|
| Fly app | `fight-bot` |
| Env file (local) | `.env` |
| Discord bot | `fight-bot` (Client ID `931732347219492904`) |
| Primary machine | `683562ef6474e8` (region `dfw`) |
| Standby machine | `890179a649d918` (region `dfw`) — keep **stopped** |
| Invite target | live Discord servers (e.g. "Stankypanky") |

Deploy: `flyctl deploy --app fight-bot`
Secrets: `flyctl secrets set --app fight-bot KEY="value" ...` (values come from `.env`)

## Test

| | |
|---|---|
| Fly app | `fight-bot-test` |
| Env file (local) | `.env.test` (gitignored, never commit) |
| Discord bot | `fight-bot-test` (Client ID `1548475879469097010`) |
| Primary machine | `d891e370b1ed98` (region `ord`) |
| Standby machine | `d89575ec722258` (region `ord`) — keep **stopped** |
| Invite target | a separate test server, using the test bot's own invite link |

Deploy: `flyctl deploy --app fight-bot-test`
Secrets: `flyctl secrets set --app fight-bot-test KEY="value" ...` (values come from `.env.test`)
Register slash commands to the test guild: `npx env-cmd -f .env.test node ./dist/deploy-commands.js`

## Shared `GUILD_ID`

Both `.env` and `.env.test` currently point `GUILD_ID` at the same guild
(`1305714536304738405`, "bot-dev"). This only affects `npm run
register` — it controls where slash commands show up *instantly*
instead of waiting ~1 hour for global propagation. It has nothing to do
with which servers the bot actually operates in day to day, so it's
fine for both environments to share it, but worth knowing if commands
seem to register somewhere unexpected.

## Standby-machine gotcha

Every Fly deploy here creates a primary + a standby machine (Fly's
default redundancy for apps without HTTP health checks). The bot has no
leader-election logic, so if both machines are ever `started`
simultaneously, **both** log into Discord with the same token and
**both** answer every interaction — users see duplicate replies.

After any deploy or machine restart, check:

```
flyctl status --app <app-name>
```

Exactly one machine should show `started`. If both do, stop one:

```
flyctl machine stop <machine-id> --app <app-name>
```
