# Reflective Lantern

[![Bump Version](https://github.com/Mallika56/Reflective-Lantern/actions/workflows/bump-version.yml/badge.svg)](https://github.com/Mallika56/Reflective-Lantern/actions/workflows/bump-version.yml)
[![Publish Package](https://github.com/Mallika56/Reflective-Lantern/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/Mallika56/Reflective-Lantern/actions/workflows/npm-publish.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An autonomous software-improvement agent that runs Monday–Friday inside a Claude Code Cloud
Routine. This repository holds no application logic — it holds the agent's instructions, its
tool permissions, and its run history.

## What it does

Each weekday the routine wakes on cron, reads `prompts/system_prompt.md`, and executes it:

1. **Determines mode.** `INNOVATION` on the 2nd and 4th Wednesday of the month, `IMPROVEMENT`
   on every other weekday.
2. **Computes a commit target** from `history/commit_schedule.json`, so no phase ever hard-codes
   a number.
3. **Runs pre-flight** across every owned, non-archived, non-fork repo: repairs failing CI,
   merges stray branches into the default branch, and backfills a `v1.0.0` release where none
   exists.
4. **Improvement mode** — picks one repo (date-seeded, so the choice is stable within a day and
   rotates across days), reads its history file so past work is never repeated, then plans
   improvements across five tiers: security & correctness, tests, code quality, developer
   experience, performance. One file change = one commit.
5. **Innovation mode** — surveys the most-starred repositories, extracts a domain, designs an
   original project in that space, and scaffolds it end to end with a mandatory stack.
6. **Tests, gates, and pushes.** A hard commit-count gate runs before any push.
7. **Reports.** Generates a PDF digest, emails it over SMTP, and appends the run to
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
| Scheduler | Claude Code Cloud Routine, cron `0 14 * * 1-5` (9 AM CDT, Mon–Fri) |
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

Shared logs: `history/commit_schedule.json` (targets), `history/innovation_log.json` (new
projects), `history/email_status.json` (SMTP failures, recorded rather than raised).

## Configuration

The commit target is the sharpest knob in the system. It lives in
`history/commit_schedule.json`:

```json
{
  "base_commits_per_week": 25,
  "increment_per_week": 0
}
```

This ships at a flat **25 commits/week (~5/day)**. A hard commit-count gate rewards volume, so
raising this causes the agent to reach for the fill-up list once genuinely useful work runs
out — which produces padding, not progress. Raise it only if you have verified there is that
much real work to do.

## Setup

See [`SECURITY.md`](SECURITY.md) for secret handling. Required routine secrets: `GH_PAT`,
`SMTP_USER`, `SMTP_PASS`. None of these are ever committed.

## License

MIT
