---
name: pr-workflow
description: Branch, commit, and PR conventions for this repo, including gh CLI usage. Use when creating branches, commits, or pull requests, or when checking CI.
---

# PR workflow for Emirati_Pathways

## Tooling
- `gh` CLI is installed at `~/.local/bin/gh`, authenticated as abdulaziz-alfalahi (keyring). Use it for PRs, checks, issues.
- Fallback if gh auth breaks: token via `printf "protocol=https\nhost=github.com\n" | git credential fill` (7-day cache), then the REST API with curl.

## Conventions (match the git log)
- Branch: `fix/<slug>`, `feat/<slug>`, or `design/<slug>` off `main`.
- One issue = one branch = one PR. Stacked PRs are fine when one fix depends on another — base the second branch on the first and say "Stacked on #N — merge #N first" at the top of the body.
- Commit subject: `fix(scope): imperative lowercase summary` — scopes in use: companies, growth, auth, db, gate, ci. Body explains the issue number, the root cause, and each change as a bullet.
- PR body: `Fixes #N`, the bug story in one paragraph, **Changes** bullets, **Tests** line, and whether any migration already RAN on the live DB.

## CI
- Checks are `docker-build` and `lint-and-test`; they trigger on PRs targeting `main` only — a stacked PR shows "no checks" until retargeted after its base merges.
- Check with `gh pr checks <n>` or `gh api repos/{owner}/{repo}/commits/<branch>/check-runs`.

## Definition of done for a fix
Merged to main → backend redeployed to APPQA (deploy-appqa skill) → live-verified through the WAF → memory status ledger updated (the employer-onboarding-review memory holds the per-issue ledger). A fix that is merged but not deployed/verified is not done — say so explicitly.
