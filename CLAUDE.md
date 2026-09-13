# Rules

- Always say more with less words.
- Always let me commit changes to git.
- Never put environment variables, Discord tokens/keys, or IDs (guild,
  channel, role, etc.) in files or output. Exception: a bot's Client ID
  is fine to keep where it's inherently public, e.g. in an OAuth invite
  link — it has to be exposed there to work.
- When filing a bug found outside the current PR's scope, create it as
  a GitHub issue (`gh issue create`) and add a one-line link to it in
  `docs/known-issues.md` — don't duplicate the description there, so it
  can't go stale when the issue is closed.
