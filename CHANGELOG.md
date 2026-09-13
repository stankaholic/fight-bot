# Changelog

All notable changes to this project are documented here. Format loosely
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- `/fight-event` no longer lists voice channels the bot can't see or
  join. A channel-level permission overwrite that hides a channel from
  `@everyone` blocked event creation even when the bot had guild-wide
  `Manage Events`; the channel picker now filters those out instead of
  failing after selection.
- The channel select menu is capped at Discord's 25-option limit, and
  `handleFightEvent` now catches errors and replies with a message
  instead of leaving the interaction unanswered.

### Added

- `docs/environments.md` — maps each Fly.io app to its env file and
  Discord bot identity.
- `docs/known-issues.md` — index of tracked GitHub issues.

## [0.1.0] - 2026-09-08

### Fixed

- `/fight` and `/fights` were crashing. ufc.com started rejecting
  scraper requests with a 403 via TLS fingerprinting (not an IP block —
  confirmed across Fly.io, a Raspberry Pi, and a local Mac). Switched
  the HTTP client from axios to
  [`got-scraping`](https://github.com/apify/got-scraping), which mimics
  a real browser's TLS/HTTP2 fingerprint.
- `getEvent` now throws a clear error instead of crashing on an
  undefined event link.
- `handleFight`/`handleFights` catch errors and reply with a friendly
  message instead of crashing the process.
- Added a process-level `unhandledRejection` handler as a safety net.
- `npm start`/`register` no longer depend on `env-cmd` finding a
  `.env` file, which doesn't exist in hosted environments (Fly secrets
  arrive as real env vars). `dotenv/config` already handles local
  `.env` loading and no-ops when absent.

### Added

- Deployed to Fly.io (`fight-bot.fly.dev`); see
  `docs/fly-deployment.md` for setup and hosting notes.
