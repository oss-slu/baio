# BAIO Tech Lead Metrics Tracking System

## Scope
This document defines how our team tracks engineering performance each sprint.

- Sprint cadence for this report: `Sprint 2` (`2026-02-10` to `2026-02-23`)
- Metrics artifact location: `runs/metrics/sprint_2_baseline.json`
- Automation entry point: `scripts/collect_metrics.py`

## Metrics We Track
We selected metrics that map directly to delivery, flow, and quality.

1. Velocity (delivery throughput)
- `commit_count` per sprint
- `prs_merged` per sprint
- `issues_closed` per sprint

2. WIP (work in progress)
- `open_prs_now`
- `open_issues_now`

3. Goal Achievement
- `issue_goal_completion_pct = issues_closed / issues_created * 100`

4. Defect Rate
- `bug_issues_created` per sprint (GitHub issues labeled `bug`)

5. Quality Gate Baseline
- `tests.pass_rate_pct` from local pytest run

6. Flow Efficiency
- PR cycle time from creation to merge:
  - median/mean/min/max hours

## Why These Metrics
- They are actionable for sprint planning and daily execution.
- They are mostly automatable from git + GitHub + test output.
- They create a baseline now and allow trend comparisons in later reports.

## Data Sources
- Local git history (`git log`, `git numstat`)
- GitHub Search API (issues/PR status and timing)
- Local pytest execution

## Automation
Run this command at sprint end:

```bash
token="$(printf 'protocol=https\nhost=github.com\n' | git credential fill | awk -F= '$1=="password"{print $2}')"
GH_TOKEN="$token" python scripts/collect_metrics.py \
  --sprint-name sprint_2 \
  --start 2026-02-10 \
  --end 2026-02-23 \
  --repo oss-slu/baio \
  --include-tests \
  --output runs/metrics/sprint_2_baseline.json
```

Alternative (without GitHub metrics):

```bash
python scripts/collect_metrics.py \
  --sprint-name sprint_2 \
  --start 2026-02-10 \
  --end 2026-02-23 \
  --skip-github \
  --include-tests \
  --output runs/metrics/sprint_2_baseline.json
```

## Known Gaps (to add in future sprints)
- Code coverage percentage (requires `pytest-cov` setup in local environment)
- Team satisfaction (quick 1-5 survey at retro)
- Customer satisfaction (client feedback score per demo)

