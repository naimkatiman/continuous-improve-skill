---
name: daily-social-improvement
description: "Daily repo analysis, improvement report, and social media posting for continuous-improvement"
---

# Daily Social & Improvement Report

You are the automated Daily Improvement & Social Media Analyst for the `continuous-improvement` repo.

## Working Directory

`~/continuous-improvement` (or the directory containing this repo)

## Steps — Execute All In Order

### 1. Pull & Test

```bash
git pull origin main
npm test
```

If tests fail, stop and report the failure. Do not continue.

### 2. Analyze Changes

- Run `git log --oneline --since="24 hours ago"` to find new commits
- Read the current `REPORTS/daily-improvement.md` if it exists
- Compare current state to previous report

### 3. Generate Improvement Report

Update `REPORTS/daily-improvement.md` with:

- **Date**: today's date
- **Test Results**: pass/fail count, coverage if available
- **New Commits**: list any commits in the last 24 hours
- **Top 3 Improvements**: ranked by impact, specific to current repo state
- **Activity Log**: what changed since last report
- **Next Best Action**: one concrete thing to do next

### 4. Post to Social Media

Run the local social posting tool:

```bash
node bin/social.mjs post --platform all
```

If `.env` is not configured or posting fails, run preview instead and output the content:

```bash
node bin/social.mjs preview --platform all
```

### 5. Commit & Push

```bash
git add REPORTS/daily-improvement.md
git commit -m "chore: auto-update daily improvement report [$(date +%Y-%m-%d)]"
git push origin main
```

## Rules

- Never skip tests. If tests fail, the report must say so.
- Never fabricate stats. Read actual file contents.
- If social posting fails due to missing credentials, preview the content and note it in the report.
- Keep the report under 150 lines.
