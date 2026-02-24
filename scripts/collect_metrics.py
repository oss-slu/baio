#!/usr/bin/env python3
"""Collect sprint engineering metrics for BAIO.

This script gathers:
- Local git activity metrics (commits, churn, contributors)
- Optional GitHub issue/PR metrics (via GH_TOKEN)
- Optional pytest baseline metrics

Example:
    python scripts/collect_metrics.py \
      --sprint-name sprint_2 \
      --start 2026-02-10 \
      --end 2026-02-23 \
      --repo oss-slu/baio \
      --include-tests \
      --output runs/metrics/sprint_2_baseline.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import statistics
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence
from urllib.parse import quote_plus
from urllib.request import Request, urlopen


def run_cmd(cmd: Sequence[str]) -> str:
    return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)


def run_shell(cmd: str) -> str:
    return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT, shell=True)


def parse_git_metrics(start: str, end: str) -> Dict[str, Any]:
    until = f"{end} 23:59:59"
    log_cmd = [
        "git",
        "log",
        f"--since={start}",
        f"--until={until}",
        "--pretty=format:%h|%ad|%an|%s",
        "--date=short",
    ]
    log_output = run_cmd(log_cmd).strip()
    log_rows = (
        [row for row in log_output.splitlines() if row.strip()] if log_output else []
    )

    commits_by_day: Counter[str] = Counter()
    commits_by_author: Counter[str] = Counter()
    commit_subjects: List[Dict[str, str]] = []
    for row in log_rows:
        commit_hash, day, author, subject = row.split("|", 3)
        commits_by_day[day] += 1
        commits_by_author[author] += 1
        commit_subjects.append(
            {"hash": commit_hash, "date": day, "author": author, "subject": subject}
        )

    numstat_cmd = (
        f"git log --since='{start}' --until='{until}' --numstat --pretty=tformat:"
    )
    numstat_output = run_shell(numstat_cmd)
    added = 0
    deleted = 0
    file_change_records = 0
    unique_files: set[str] = set()
    for line in numstat_output.splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        add_raw, del_raw, file_path = parts[0], parts[1], parts[2]
        if add_raw.isdigit() and del_raw.isdigit():
            added += int(add_raw)
            deleted += int(del_raw)
            file_change_records += 1
            unique_files.add(file_path)

    return {
        "commit_count": len(log_rows),
        "contributors": len(commits_by_author),
        "commits_by_author": dict(sorted(commits_by_author.items())),
        "commits_by_day": dict(sorted(commits_by_day.items())),
        "lines_added": added,
        "lines_deleted": deleted,
        "net_lines": added - deleted,
        "file_change_records": file_change_records,
        "unique_files_changed": len(unique_files),
        "commits": commit_subjects,
    }


def gh_get_json(url: str, token: Optional[str]) -> Dict[str, Any]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "baio-metrics-script",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = Request(url, headers=headers)
    with urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def gh_search(
    repo: str, query: str, token: Optional[str], per_page: int = 100
) -> Dict[str, Any]:
    full_query = f"repo:{repo} {query}"
    url = (
        "https://api.github.com/search/issues"
        f"?q={quote_plus(full_query)}&per_page={per_page}"
    )
    return gh_get_json(url, token)


def grouped_by_day(items: List[Dict[str, Any]], field: str) -> Dict[str, int]:
    counts: Counter[str] = Counter()
    for item in items:
        value = item.get(field)
        if not value:
            continue
        counts[value[:10]] += 1
    return dict(sorted(counts.items()))


def parse_github_metrics(
    repo: str, start: str, end: str, token: Optional[str]
) -> Dict[str, Any]:
    created_issues = gh_search(
        repo, f"is:issue -is:pr created:{start}..{end}", token=token
    )
    closed_issues = gh_search(
        repo, f"is:issue -is:pr is:closed closed:{start}..{end}", token=token
    )
    bug_issues = gh_search(
        repo, f"is:issue -is:pr label:bug created:{start}..{end}", token=token
    )
    created_prs = gh_search(repo, f"is:pr created:{start}..{end}", token=token)
    merged_prs = gh_search(repo, f"is:pr is:merged merged:{start}..{end}", token=token)
    open_prs = gh_search(repo, "is:pr is:open", token=token)
    open_issues = gh_search(repo, "is:issue -is:pr is:open", token=token)
    open_bug_issues = gh_search(repo, "is:issue -is:pr is:open label:bug", token=token)
    open_question_issues = gh_search(
        repo, "is:issue -is:pr is:open label:question", token=token
    )

    issues_created_count = int(created_issues.get("total_count", 0))
    issues_closed_count = int(closed_issues.get("total_count", 0))
    prs_created_count = int(created_prs.get("total_count", 0))
    prs_merged_count = int(merged_prs.get("total_count", 0))

    goal_completion = (
        round((issues_closed_count / issues_created_count) * 100.0, 1)
        if issues_created_count
        else 0.0
    )
    pr_merge_rate = (
        round((prs_merged_count / prs_created_count) * 100.0, 1)
        if prs_created_count
        else 0.0
    )

    cycle_hours: List[float] = []
    for item in merged_prs.get("items", []):
        created_at = item.get("created_at")
        closed_at = item.get("closed_at")
        if not created_at or not closed_at:
            continue
        c_dt = dt.datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        m_dt = dt.datetime.fromisoformat(closed_at.replace("Z", "+00:00"))
        cycle_hours.append((m_dt - c_dt).total_seconds() / 3600.0)

    cycle_stats: Dict[str, Any] = {"count": len(cycle_hours)}
    if cycle_hours:
        cycle_stats.update(
            {
                "median_hours": round(statistics.median(cycle_hours), 2),
                "mean_hours": round(statistics.mean(cycle_hours), 2),
                "min_hours": round(min(cycle_hours), 2),
                "max_hours": round(max(cycle_hours), 2),
            }
        )

    return {
        "issues_created": issues_created_count,
        "issues_closed": issues_closed_count,
        "issue_goal_completion_pct": goal_completion,
        "bug_issues_created": int(bug_issues.get("total_count", 0)),
        "prs_created": prs_created_count,
        "prs_merged": prs_merged_count,
        "pr_merge_rate_pct": pr_merge_rate,
        "open_prs_now": int(open_prs.get("total_count", 0)),
        "open_issues_now": int(open_issues.get("total_count", 0)),
        "open_bug_issues_now": int(open_bug_issues.get("total_count", 0)),
        "open_question_issues_now": int(open_question_issues.get("total_count", 0)),
        "issue_created_by_day": grouped_by_day(
            created_issues.get("items", []), "created_at"
        ),
        "issue_closed_by_day": grouped_by_day(
            closed_issues.get("items", []), "closed_at"
        ),
        "pr_cycle_time": cycle_stats,
        "issue_numbers_created": [i["number"] for i in created_issues.get("items", [])],
        "issue_numbers_closed": [i["number"] for i in closed_issues.get("items", [])],
        "pr_numbers_created": [i["number"] for i in created_prs.get("items", [])],
        "pr_numbers_merged": [i["number"] for i in merged_prs.get("items", [])],
    }


def parse_pytest_metrics() -> Dict[str, Any]:
    """Run pytest and extract collected/pass/fail summary.

    We split collection and execution because repo-level addopts can hide
    collected/pass lines in quiet mode output.
    """
    collect_cmd = ["pytest", "--collect-only", "-q"]
    collect_proc = subprocess.run(collect_cmd, capture_output=True, text=True)
    collect_out = f"{collect_proc.stdout}\n{collect_proc.stderr}"
    collect_out = re.sub(r"\x1b\[[0-9;]*m", "", collect_out).replace("\r", "\n")

    run_cmd = ["pytest", "-o", "addopts="]
    run_proc = subprocess.run(run_cmd, capture_output=True, text=True)
    run_out = f"{run_proc.stdout}\n{run_proc.stderr}"
    run_out = re.sub(r"\x1b\[[0-9;]*m", "", run_out).replace("\r", "\n")

    collected = None
    passed = None
    failed = None
    warnings = None
    duration_s = None

    m = re.search(r"(\d+)\s+tests?\s+collected", collect_out)
    if m:
        collected = int(m.group(1))
    else:
        file_level_counts = re.findall(
            r"^tests/.+?:\s+(\d+)\s*$", collect_out, re.MULTILINE
        )
        if file_level_counts:
            collected = sum(int(x) for x in file_level_counts)

    m = re.search(r"(\d+)\s+failed", run_out)
    if m:
        failed = int(m.group(1))
    elif run_proc.returncode == 0:
        failed = 0

    m = re.search(r"(\d+)\s+warnings?", run_out)
    if m:
        warnings = int(m.group(1))

    m = re.search(r"in\s+([\d.]+)s", run_out)
    if m:
        duration_s = float(m.group(1))

    if collected is not None and failed is not None and failed <= collected:
        passed = collected - failed

    pass_rate = None
    if collected and passed is not None:
        pass_rate = round((passed / collected) * 100.0, 1)

    return {
        "collection_command": "pytest --collect-only -q",
        "test_command": "pytest -o addopts=''",
        "collection_exit_code": collect_proc.returncode,
        "exit_code": run_proc.returncode,
        "collected": collected,
        "passed": passed,
        "failed": failed,
        "warnings": warnings,
        "duration_seconds": duration_s,
        "pass_rate_pct": pass_rate,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect sprint metrics.")
    parser.add_argument("--sprint-name", required=True, help="Label for the sprint.")
    parser.add_argument("--start", required=True, help="Sprint start date YYYY-MM-DD.")
    parser.add_argument("--end", required=True, help="Sprint end date YYYY-MM-DD.")
    parser.add_argument(
        "--repo",
        default="oss-slu/baio",
        help="GitHub repo slug in owner/name format.",
    )
    parser.add_argument(
        "--output",
        default="runs/metrics/sprint_metrics.json",
        help="Output JSON path.",
    )
    parser.add_argument(
        "--include-tests",
        action="store_true",
        help="Run pytest and include test baseline metrics.",
    )
    parser.add_argument(
        "--skip-github",
        action="store_true",
        help="Skip GitHub API metrics even if GH_TOKEN is present.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    # Basic date validation early for clearer errors.
    try:
        dt.date.fromisoformat(args.start)
        dt.date.fromisoformat(args.end)
    except ValueError:
        print("ERROR: --start and --end must be YYYY-MM-DD", file=sys.stderr)
        return 2

    metrics: Dict[str, Any] = {
        "sprint_name": args.sprint_name,
        "sprint_window": {"start": args.start, "end": args.end},
        "collected_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "sources": {
            "git": "local repository history",
            "github": f"https://github.com/{args.repo}",
            "tests": "local pytest run",
        },
    }

    metrics["git"] = parse_git_metrics(args.start, args.end)

    token = os.getenv("GH_TOKEN")
    if args.skip_github:
        metrics["github"] = {"status": "skipped_by_flag"}
    elif token:
        try:
            metrics["github"] = parse_github_metrics(
                args.repo, args.start, args.end, token
            )
            metrics["github"]["status"] = "ok"
        except Exception as exc:  # pragma: no cover - defensive path
            metrics["github"] = {"status": "error", "error": str(exc)}
    else:
        metrics["github"] = {
            "status": "missing_auth",
            "note": "Set GH_TOKEN to collect GitHub API metrics.",
        }

    if args.include_tests:
        metrics["tests"] = parse_pytest_metrics()
    else:
        metrics["tests"] = {"status": "skipped"}

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(metrics, indent=2))
    print(f"Wrote metrics to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
