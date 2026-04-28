# Tech Lead Metrics Report — Sprint 6

**Team:** BAIO (Bioinformatics AI Organism classifier)
**Tech Lead:** Mainuddin Sarker
**Sprint:** 6
**Reporting window:** 2026-04-13 → 2026-04-27
**Report type:** Trend analysis (comparing against Sprint 2 baseline and Sprint 5)

---

## 1. Metrics Selection

We continue tracking the same five metrics established in Sprint 2, now with two full sprints of trend data:

| Metric | Why We Track It |
|---|---|
| **Velocity** (commits, PRs, issues closed) | Primary throughput signal — are we shipping? |
| **WIP** (open PRs + issues snapshot) | Flags overload and stale work |
| **Goal Achievement** (closed/total issues touched) | Did we finish what we started? |
| **PR Cycle Time** (create → merge) | Reveals review bottlenecks and merge discipline |
| **Contributor Spread** (unique authors per sprint) | Tracks whether delivery depends on one person |

Contributor spread is new this sprint as a tracked metric after Sprint 5 showed an uneven load pattern.

---

## 2. Sprint 6 Data

### Raw Metrics

| Metric | Sprint 2 (Baseline) | Sprint 5 | Sprint 6 |
|---|---:|---:|---:|
| Commits | 9 | 43 | 34 |
| Contributors (unique) | 2 | 5 | 1* |
| Merged PRs | 9 | 6 | 4 |
| Issues closed | 3 | 5 | 3 |
| Issues created | 6 | ~4 | 1 |
| Goal achievement | 50% | ~80% | **75%** |
| Open PRs (snapshot) | 1 | ~3 | 3 |
| Open issues (snapshot) | 4 | ~10 | 13 |
| PR median cycle time | 4.2h | — | **0.15h** |
| PR max cycle time | 269.7h | — | 6.3h |

*Sprint 6 commits are attributed to Tech Lead (mainuddinMAins) only.

### What Was Delivered (Sprint 6 PRs)

| PR | Description |
|---|---|
| #189 | Database persistence, Evo2 schema integration, pyproject.toml fix, SequenceInput schema |
| #190 | Evo2 FASTA pipeline scripts, Libra HPC SLURM submission script, community guide PDF |
| #191 | Frontend UI refresh, temperature scaling, dynamic confidence thresholds, GC content fix |
| #192 | NVIDIA NIM fallback LLM, full_sequence in results, corrected Evo2 model IDs, BAIO logo |

### Issues Closed

- **#162** — Database-backed persistence for BAIO
- **#182** — Google OAuth login/sign-up
- **#171** — Backend API testing

### Commit Activity by Day

```
Apr 14 |█                          (1)
Apr 17 |████                       (4)
Apr 18 |█████                      (5)
Apr 21 |███████████                (11)
Apr 23 |█████████████              (13)
```

Work is still back-loaded (65% of commits in the last 4 days).

### PR Cycle Times

| PR | Cycle Time |
|---|---:|
| #189 | 0.1h |
| #190 | 0.2h |
| #191 | 6.3h |
| #192 | 0.1h |
| **Median** | **0.15h** |

Cycle times are extremely short because Tech Lead is self-merging. This is not a team review signal — it means PRs are not waiting for peer review.

---

## 3. Trend Analysis

### Velocity

```
Commits per sprint:
Sprint 2:  ████████                         9
Sprint 5:  ███████████████████████████████  43
Sprint 6:  ████████████████████████         34
```

Throughput remains strong relative to baseline (+278% over Sprint 2), but dropped 21% from Sprint 5. The drop reflects reduced team participation in Sprint 6, not a slowdown in the core work.

### Goal Achievement

```
Sprint 2:  50%  [███████░░░░░░░░]
Sprint 5: ~80%  [████████████░░░]
Sprint 6:  75%  [███████████░░░░]
```

Trending upward from baseline (50% → 75%). Target is ≥80%. We are close but not consistently there. The 1 open issue created this sprint (#193 — expired token cleanup) was not closed, pulling the rate slightly below target.

### WIP / Open Issues

```
Open issues snapshot:
Sprint 2:   4
Sprint 5:  ~10
Sprint 6:  13  ← growing backlog
```

Open issue count is growing sprint over sprint. This is not alarming — it partly reflects better issue creation habits — but 13 open issues without triage priority labels is a risk entering the final sprint.

### Contributor Spread (NEW metric)

```
Sprint 2:  2 contributors
Sprint 5:  5 contributors (Luis, Mainuddin, Tommy, Vrinda, dependabot)
Sprint 6:  1 contributor  ← regression
```

This is the most significant finding of Sprint 6. All 34 commits came from the Tech Lead. Luis and Kevin had no merged commits this sprint, though Luis has an open PR (#195) as of sprint close. This creates a bus-factor risk and an unsustainable workload distribution entering the final sprint.

---

## 4. What Surprised Us

- **PR cycle time collapsed to minutes.** The 0.1h median looks great but it means PRs are not receiving peer review. In Sprint 2 the 4.2h median was closer to healthy team review behavior.
- **Issue backlog grew while we shipped more.** We closed 3 issues but opened 1 new one, and 13 remain open — many with no sprint/milestone label. The backlog is growing faster than we can close it.
- **Evo2 on Libra is still blocked.** Despite delivering the HPC scripts and pipeline documentation, the actual model inference is blocked by a CUDA/compiler mismatch on the cluster. This is not captured in any issue metric currently.

---

## 5. Action Items

### Priority for Sprint 7 (Final Sprint)

1. **Rebalance contributor load**
   - Luis and Kevin must each have at least one merged PR in Sprint 7.
   - Tech Lead should review but not be the sole committer.
   - How we will know: contributor spread ≥ 3 unique authors at sprint close.

2. **Triage the 13 open issues**
   - Label each issue: `sprint-7`, `backlog`, or `wont-fix`.
   - Target ≤ 5 unresolved issues at project close.
   - How we will know: issue snapshot drops below 5 by end of Sprint 7.

3. **Restore peer review discipline**
   - Each PR should wait for at least one reviewer approval before merge.
   - Target: PR median cycle time ≥ 2h (indicates actual review happened).
   - How we will know: no PR merged in < 30 minutes unless it is a hotfix.

4. **Open a tracking issue for the Libra/Evo2 blocker**
   - Create a labeled issue `bug` / `blocked` for the CUDA 12.8 vs PyTorch 13.0 mismatch.
   - Either resolve it or document the workaround path in Sprint 7.

5. **Reach ≥ 80% goal achievement**
   - Close #179 (Evo2 integration), #181 (show model used in results), and #193 (token cleanup).
   - Freeze new scope after Sprint 7 day 3.

---

## 6. Process Reflection

**Data collection difficulty:** Low. Git log and GitHub CLI (`gh`) provide everything needed for all five metrics in under 5 minutes. The Sprint 2 report took longer; this one was faster.

**Most valuable metrics this sprint:**
- **Contributor spread** — immediately surfaced the team load imbalance
- **Goal achievement** — clear signal against the 80% target

**Least valuable metrics this sprint:**
- **PR cycle time** — lost its signal value because self-merges dominate. It needs a "reviewed by ≥1 person" filter to be meaningful.

**What we would track differently:**
- Add a `blocked` label and count blocked issues separately from open issues.
- Add a per-contributor issue/PR assignment view so load imbalance is visible weekly, not just at report time.
- Track whether Evo2 inference actually ran on Libra (binary: yes/no) as a milestone-level metric.
