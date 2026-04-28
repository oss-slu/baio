# BAIO — Tech Lead Metrics Report
**Sprint 4 | Due: April 6, 2026**
**Tech Lead:** Mainuddin Sarker | **Project:** BAIO (Bioinformatics AI Organism) | **Course:** OSS at Saint Louis University

---

## 1. Team Composition

| Role | Name | GitHub Handle |
|------|------|---------------|
| Tech Lead | Mainuddin | @mainuddinMains |
| Developer | Kevin Yang | @TommySailami |
| Developer | Luis Palmejar | @LuisPalmejar21 |

---

## 2. Metrics Selection

### What We Chose to Track and Why

After reviewing our team's workflow and current iteration goals, we selected the following metrics for Sprint 4:

| # | Metric | Rationale |
|---|--------|-----------|
| 1 | **Velocity** (PRs merged / commits per sprint) | PRs are our primary unit of completed, reviewed work. Commits show day-to-day activity. |
| 2 | **Goal Achievement** (sprint goals met vs. planned) | We commit to explicit iteration milestones; tracking completion reveals planning accuracy. |
| 3 | **Defect Rate** (bug-fix PRs per sprint) | We've had recurring CI and API stability issues; tracking bugs keeps regressions visible. |
| 4 | **WIP (Work in Progress)** (open issues at sprint end) | High WIP has historically caused context-switching; keeping it visible helps us pull rather than push work. |

We chose **not** to track code coverage percentage as a primary metric this sprint because our CI coverage configuration has been actively changing (#126, #149), making the baseline unreliable. We will re-introduce it next sprint once the configuration stabilizes.

### Alignment With Team Goals

Our Iteration 2 milestone targets three pillars: (1) database-backed persistence, (2) Evo2 model integration, and (3) an AI assistant chatbot. Each metric above directly informs whether those pillars are on track.

---

## 3. Baseline Establishment

### 3.1 Sprint 4 Date Range

**March 1, 2026 – April 5, 2026** (approximately 5 weeks; this is the first formal metrics collection point).

---

### 3.2 Velocity

#### Pull Requests Merged (Sprint 4)

| Author | PRs Merged | Notable Work |
|--------|-----------|--------------|
| Mainuddin (Tech Lead) | **17** | Chatbot LLM integration, Gemini fallback, chat widget fixes, architecture docs, Evo2 CI stabilization, Docker fixes |
| Kevin Yang | **3** | Database models, user methods, routes, AI assistant |
| Luis Palmejar | **1** | Frontend sidebar layout revision |
| Vrinda Thakur (contributor) | **1** | Evo2 dependency stabilization |
| **Total (human)** | **22** | — |

*6 additional Dependabot security bumps were merged automatically and are excluded from velocity.*

#### Daily Commit Activity (March 2026)

```
Mar 01 ████████░░░░░░░░░░░░  7
Mar 02 █████░░░░░░░░░░░░░░░  5
Mar 03 ██████░░░░░░░░░░░░░░  6
Mar 06 ████░░░░░░░░░░░░░░░░  4
Mar 07 █░░░░░░░░░░░░░░░░░░░  1
Mar 08 █████░░░░░░░░░░░░░░░  5
Mar 09 ███████░░░░░░░░░░░░░  7
Mar 10 ██░░░░░░░░░░░░░░░░░░  2
Mar 15 ███░░░░░░░░░░░░░░░░░  3
Mar 17 █░░░░░░░░░░░░░░░░░░░  1
Mar 18 ██████░░░░░░░░░░░░░░  6
Mar 19 ████░░░░░░░░░░░░░░░░  4
Mar 21 █░░░░░░░░░░░░░░░░░░░  1
Mar 23 ███░░░░░░░░░░░░░░░░░  3
Mar 24 █████░░░░░░░░░░░░░░░  5
Mar 25 ███████░░░░░░░░░░░░░  7
Mar 26 █████░░░░░░░░░░░░░░░  5
Mar 27 █████░░░░░░░░░░░░░░░  5
Mar 28 ██████░░░░░░░░░░░░░░  6
Mar 30 ████████████████████  20
Mar 31 ██░░░░░░░░░░░░░░░░░░  2
```

**Total commits (Sprint 4): ~100** across 21 active days.

The spike on March 30 (20 commits) reflects the merge of four large feature branches in a single day — the chatbot, database, architecture checkpoint, and chat widget fix PRs all landed simultaneously.

---

### 3.3 Goal Achievement

#### Iteration 2 Milestone Targets vs. Actual

| Goal | Status | Evidence |
|------|--------|----------|
| AI chatbot with LLM backend | ✅ Done | PR #151, #161, #173 — OpenRouter + Gemini fallback integrated |
| Database models & persistence layer | ⚠️ Partial | PR #170 — models and user methods added; full auth/session persistence still open (#162) |
| Evo2 model integration | ⚠️ Partial | PR #159, #176 — scaffolded and dependency-stabilized; full inference pipeline still open (#179) |
| Frontend sidebar / UI cleanup | ✅ Done | PR #155, #167, #165 — chat widget relocated, layout revised |
| Architecture documentation | ✅ Done | PR #172 — architecture checkpoint submitted |
| Docker / local dev setup | ✅ Done | PR #177 — Docker build and run fixed |

**Sprint goal achievement: 4 of 6 goals fully met (67%), 2 partially met.**

---

### 3.4 Defect Rate

| # | Bug | Severity | PR / Issue | Resolved? |
|---|-----|----------|------------|-----------|
| 1 | Duplicate chat widget rendered in DOM | Medium | PR #153, #165, #174 | ✅ Yes |
| 2 | API router path mismatch | High | PR cb9baf6 | ✅ Yes |
| 3 | Docker build failures (wrong Dockerfile path) | High | PR #177 | ✅ Yes |
| 4 | CI coverage regex breaking pipeline | High | PR #142, #144, #147, #149 | ✅ Yes |
| 5 | Evo2 import failures in CI | Medium | PR #176 | ✅ Yes |
| 6 | API tests broken after route refactor | Medium | Commit c06e935 | ✅ Yes (tests removed temporarily) |

**Defect rate: 6 bugs identified and resolved this sprint.**

The duplicate chat widget bug required 4 separate PRs to fully resolve, indicating insufficient upfront code review — a process gap we should address.

---

### 3.5 WIP (Work in Progress) at Sprint End

**Open issues at April 5, 2026: 15**

Key items in-flight:

| Issue | Assignee | Priority |
|-------|----------|----------|
| #162 — Database-backed persistence | Kevin Yang | High |
| #179 — Complete Evo2 model integration | Unassigned | High |
| #182 — Google OAuth login | Luis Palmejar | High |
| #181 — Show model used + accuracy in results | Unassigned | Medium |
| #171 — Backend API testing | Unassigned | Medium |
| #156 — Improve classifier accuracy | Vrinda Thakur | Medium |
| #154 — UI cleanup (sidebar) | Unassigned | Low |

**WIP score: 15 open issues, 7 of which have no assignee.** The lack of assignees on several high-priority items is a risk.

---

## 4. Analysis

### What Trends Do We Observe?

- **High individual concentration:** The Tech Lead (Mainuddin) is responsible for 17 of 22 PRs (77%) in the sprint. This is unsustainable and represents a single point of failure. Kevin Yang contributed meaningfully (database, AI assistant), but Luis Palmejar had only 1 PR this sprint.

- **End-of-sprint compression:** 20 of ~100 commits landed on a single day (March 30). This is a classic sign of work piling up before a deadline rather than being distributed steadily. It increases review quality risk and creates merge conflicts.

- **Recurring bug patterns:** The chat widget duplication bug required 4 PRs and spanned multiple weeks. The CI coverage pipeline required 6+ PRs. These recurring patches suggest root causes were not fully diagnosed before merging fixes.

- **Unassigned high-priority issues:** Issues #179 (Evo2) and #181 (model accuracy display) are unowned. Unowned issues tend to slip.

### What Surprised Us?

The database feature (#162, #170) moved from zero to models + routes in a single sprint, which is faster than anticipated. However, it did not reach full persistence because tests were temporarily removed to unblock the merge — a technical debt we must repay immediately.

The Docker setup fix (#177) was completed the day after a Docker-related blocker was discovered. Fast turnaround, but it suggests we lacked a working local container setup as a team standard earlier in the sprint.

### Is Important Context Missing From the Numbers?

Yes. The raw PR count for Mainuddin includes several PRs that were largely scaffolding, documentation, or re-fixes of the same bug (duplicate chat widget). Raw PR count overstates individual output. A more honest picture: the chatbot, Evo2 scaffolding, and CI work were genuinely complex; the duplicate widget fixes were churn.

---

## 5. Action Items

| Priority | Action | Owner | Success Signal |
|----------|--------|-------|----------------|
| 🔴 High | Assign owners to all open high-priority issues before next sprint start | Mainuddin | Every issue #162, #171, #179, #181 has an assignee |
| 🔴 High | Re-add and expand backend API tests removed in c06e935 | Kevin Yang | CI passes with full route test coverage |
| 🟡 Medium | Distribute PR authorship — aim for each dev to submit ≥2 PRs next sprint | Mainuddin (review/coaching) | Luis: ≥2 PRs, Kevin: ≥3 PRs |
| 🟡 Medium | Enforce PR review before merge to catch repeated bugs | All | Zero PRs merged same-day they were opened |
| 🟡 Medium | Complete Evo2 inference pipeline (not just scaffolding) | Unassigned → assign next sprint | Issue #179 closed |
| 🟢 Low | Introduce code coverage as a tracked metric once CI config stabilizes | Mainuddin | Coverage badge appearing in README |

---

## 6. Process Reflection

### How Difficult Was Data Collection?

Moderately easy. GitHub's PR list, issue tracker, and `git log` provided most of the data. The main friction was that our GitHub issues are not consistently labeled (e.g., no "bug" vs. "feature" labels), making automated filtering harder. We also don't use GitHub Milestones or Projects to track sprint scope, so the "planned vs. actual" comparison required manual reconstruction from commit messages and the Iteration 2 milestone document.

**Improvement:** Next sprint, we will open a GitHub Milestone for the sprint and tag all planned issues to it. This will make burndown calculation trivial.

### Most Valuable Metrics

- **Goal achievement** (planned vs. actual) was most informative — it immediately surfaced that two of our three core iteration goals are still incomplete.
- **WIP count** was a close second — seeing 7 unowned open issues in one table was a clear call to action.

### Least Valuable Metrics

- **Raw commit count** produced noise. Merge commits, dependabot bumps, and documentation commits inflate the count without reflecting engineering effort.

### What We Would Track Differently

- Use **story points** or a consistent t-shirt sizing on issues to measure velocity in terms of complexity, not just count.
- Track **PR cycle time** (time from PR open to merge) — we suspect the average is too long for some PRs and too short (insufficient review) for others.
- Add **code coverage %** as soon as CI config is stable.

---

## 7. Summary Table

| Metric | Sprint 4 Value | Target (Next Sprint) |
|--------|---------------|----------------------|
| PRs merged (human) | 22 | ≥22, better distributed |
| Commits | ~100 | ~100, more evenly spread |
| Sprint goals fully met | 4 / 6 (67%) | 5 / 6 (83%) |
| Bugs identified | 6 | ≤3 |
| Open issues (WIP) | 15 | ≤10 |
| Unassigned open issues | 7 | 0 |
| PR distribution (Tech Lead %) | 77% | ≤50% |

---

*Report compiled April 5, 2026 by Mainuddin Sarker, Tech Lead — BAIO OSS Project, Saint Louis University.*
*Data sources: GitHub PR history (`oss-slu/baio`), git log, GitHub Issues tracker.*
