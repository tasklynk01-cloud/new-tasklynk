# Release Payout Automation

This document explains how the scheduled GitHub Action (`.github/workflows/release-payouts.yml`) triggers the reserved balance release flow via `scripts/run-release-payouts.ts`.

## Workflow Summary
- **Schedule:** Daily at 01:30 UTC (configure in the workflow `cron` expression).
- **Health gate:** Performs a `curl` request against `${APP_URL}${APP_HEALTH_PATH:-/api/health}` before touching payouts.
- **Execution:** Runs `npx tsx scripts/run-release-payouts.ts --dryRun=$RELEASE_DRY_RUN --minHours=$RELEASE_MIN_HOURS`.
- **Manual runs:** Available via the `workflow_dispatch` trigger in GitHub Actions.

## Required Secrets
Add these repository secrets (⚙️ → *Settings → Secrets and variables → Actions → New repository secret*):

| Secret | Purpose |
| --- | --- |
| `APP_URL` | Base URL for the deployed app (used for the health check and as fallback for the release endpoint). |
| `RELEASE_PAYOUTS_URL` | Optional override for the payout endpoint host (leave blank to reuse `APP_URL`). |
| `RELEASE_CRON_ADMIN_EMAIL` | Email of an admin account used to generate the JWT for the script. |
| `JWT_SECRET` | Same secret used by the app for JWT signing (required by the script). |
| `TURSO_CONNECTION_URL` | Database connection URL so the script can query users. |
| `TURSO_AUTH_TOKEN` | Turso auth token. |

> ℹ️ The script falls back to `ADMIN_EMAIL` if `RELEASE_CRON_ADMIN_EMAIL` is missing, but keeping a dedicated secret avoids ambiguity.

## Optional Variables
Add repository **variables** (Settings → *Secrets and variables → Actions → Variables*) to fine-tune the job without editing YAML:

| Variable | Default | Description |
| --- | --- | --- |
| `RELEASE_MIN_HOURS` | `24` | Minimum hours since `paidAt` before releasing funds. |
| `RELEASE_DRY_RUN` | `false` | Set to `true` to keep the scheduled run in preview mode. Handy while validating. |
| `APP_HEALTH_PATH` | `/api/health` | Override if your deployment exposes a different health endpoint. |

## Local / Manual Runs
You can reproduce the automation locally with:

```bash
npx tsx scripts/run-release-payouts.ts --dryRun=true --minHours=24
```

Make sure the same environment variables used in the workflow are exported in your shell.

## Troubleshooting
1. **Health check fails** – confirm `APP_URL` + `APP_HEALTH_PATH` point to a reachable endpoint and that networking/IP allow GitHub Actions traffic.
2. **Unauthorized errors** – ensure `RELEASE_CRON_ADMIN_EMAIL` belongs to an active admin and that `JWT_SECRET` matches the deployed environment.
3. **Database errors** – verify `TURSO_CONNECTION_URL` and `TURSO_AUTH_TOKEN` secrets are valid for the production database.
4. **Dry-run stuck** – switch the `RELEASE_DRY_RUN` variable to `false` once confident the job is returning the expected order set.
