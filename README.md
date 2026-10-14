# Reflective Lantern

[![Bump Version](https://github.com/Mallika56/Reflective-Lantern/actions/workflows/bump-version.yml/badge.svg)](https://github.com/Mallika56/Reflective-Lantern/actions/workflows/bump-version.yml)
[![Publish Package](https://github.com/Mallika56/Reflective-Lantern/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Mallika56/Reflective-Lantern/actions/workflows/npm-publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An autonomous software-improvement agent that runs Monday–Friday inside a Claude Code Cloud
Routine. This repository holds no application logic — it holds the agent's instructions, its
tool permissions, and its run history.

## What it does

Each weekday the routine wakes on cron, reads `prompts/system_prompt.md`, and executes it:

1. **Determines mode.** `PORTFOLIO` on every Wednesday, `IMPROVEMENT` on every other weekday.
2. **Runs pre-flight** across every owned, non-archived, non-fork repo: repairs failing CI,
   merges stray branches into the default branch (never `lantern/*` or `dependabot/*` — those
   wait for review), and backfills a `v1.0.0` release where none exists.
3. **Improvement mode** — picks one repo (date-seeded, so the choice is stable within a day and
   rotates across days), reads its history file so past work is never repeated, then plans
   improvements across five tiers: security & correctness, tests, code quality, developer
   experience, performance. One file change = one commit, and no commit target: a run ships
   only the real work it finds.
4. **Portfolio mode** — reads every project repo and keeps `projects.html` on
   [mallika56.github.io](https://mallika56.github.io) in sync: adds a card for any project
   missing from the site and corrects cards that no longer match their repo. Every claim on a
   card is traceable to the repo; it never writes the personal "Why this one" lines.
5. **Tests and pushes.** Repos listed in `history/pr_only_repos.json` (including the portfolio
   site) get a `lantern/<date>` branch and a pull request instead of a direct push.
6. **Reports.** Generates a PDF digest, emails it over SMTP, and appends the run to
   `history/`.

## Directory layout

```
Reflective-Lantern/
├── .claude/settings.json          # tool allowlist for the routine
├── .github/
│   ├── workflows/bump-version.yml # manual semver bump → tag → GitHub Release
│   ├── workflows/npm-publish.yml  # publish to GitHub Packages on release
│   └── dependabot.yml             # weekly npm + github-actions updates
├── prompts/system_prompt.md       # the agent brain
├── history/                       # one JSON file per managed repo + shared logs
├── index.js                       # loader that exports the prompts
├── package.json
├── SECURITY.md
└── README.md
```

## Tech stack

| Piece | Choice |
|---|---|
| Scheduler | Claude Code Cloud Routine, cron `0 6 * * 1-5` UTC (1 AM CDT, Mon–Fri) |
| Model | Claude Sonnet with prompt caching |
| Git / GitHub | `gh` CLI + `git`, authenticated by `GH_PAT` |
| Reporting | `fpdf2` → PDF, delivered over SMTP |

## Token efficiency

`prompts/system_prompt.md` is deliberately written as one large, **stable** file. It clears the
2048-token minimum for prompt caching, so every run after the first reads it from cache at
roughly 10% of the input cost. This only holds if the file stays unchanged — editing it daily
re-pays full input cost on every run.

The prompt also encodes hard read rules that keep each run cheap: glob before reading, grep
instead of full-file reads, `-q` on every install, test output piped through `tail`, and six
directories (`node_modules/`, `venv/`, `__pycache__/`, `.git/`, `dist/`, `build/`) never walked.

## Run history

Each managed repo gets `history/<repo>.json`, appended once per run:

```json
[
  {
    "date": "2026-08-31",
    "mode": "IMPROVEMENT",
    "improvements": [
      "Replaced hardcoded API key with os.environ.get, added .env.example",
      "Added pytest suite with 7 tests and mocked external calls",
      "Converted print() calls to logging.getLogger(__name__)"
    ],
    "tests_passed": true,
    "commits": 5,
    "notes": "Tier 1 and 2 complete; performance work deferred to next run."
  }
]
```

Portfolio runs log to `history/Mallika56.github.io.json` with `"mode": "PORTFOLIO"`. Shared logs:
`history/email_status.json` (SMTP failures, recorded rather than raised) and
`history/innovation_log.json` (record of the retired Wednesday new-project mode).

## Configuration

| File | Controls |
|---|---|
| `history/pr_only_repos.json` | Repos that get a pull request instead of a direct push to `main`. |
| `history/portfolio_exclude.json` | Repos portfolio mode leaves off the site. Add a repo name here to keep it off `projects.html`. |

There is deliberately no commit target. An earlier version had a hard commit-count gate; it
rewarded volume, so runs reached for filler once the real work ran out.

## Setup

See [`SECURITY.md`](SECURITY.md) for secret handling. Required routine secrets: `GH_PAT`,
`SMTP_USER`, `SMTP_PASS`. None of these are ever committed.

## License

MIT
