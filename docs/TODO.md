# Docs — outstanding work

Items left after the April 2026 docs reorg.

## External broken-link audit

The reorg renamed and moved files inside this repo. Anywhere **outside** the repo that referenced the old paths now 404s. Grep your inbox / Slack / GitHub PRs / issue tickets / SLU submission system for the following and redirect to the new locations:

| Old path | New path |
|---|---|
| `docs/auth.md` | `docs/AUTHENTICATION.md` |
| `docs/design.md` | `docs/ARCHITECTURE.md` |
| `docs/community_guide_checkpoint_submission.md` | `docs/COMMUNITY.md` |
| `docs/MODEL_TRAINING_GUIDE.md` | `docs/models/CLASSICAL_ML.md` |
| `docs/transformer_classification_guide.md` | `docs/models/TRANSFORMERS.md` |
| `docs/evo2_fasta_pipeline.md` | `docs/models/EVO2_INFERENCE.md` |
| `docs/Technical documentation BAIO.md` | `docs/guides/METAGENOMICS.md` |
| `docs/FASTQ format specification document.md` | `docs/guides/FASTQ.md` |
| `docs/evo2_fix_summary_CI_issue.md` | `docs/infrastructure/EVO2_CI_FIX.md` |
| `docs/metrics/tracking_system.md` | `docs/METRICS_FRAMEWORK.md` |
| `docs/MILESTONE_2.md` | `docs/archive/MILESTONE_2.md` |
| `docs/checkpoints/architecture_checkpoint_submission.md` | `docs/archive/architecture_checkpoint_submission.md` |
| `docs/metrics/sprint_2_report.md` | `docs/archive/sprint_2_report.md` |

## Open decisions

### `docs/issues/`
Left untouched. Contents: `add-database-support.md`, `stabilize-evo2-test-ci.md`. These are issue snapshots; the audit recommended archiving since GitHub issues are the source of truth. Decide: archive to `docs/archive/issues/`, or leave in place.

### `docs/community_guide_checkpoint_submission.pdf`
Left untouched despite the corresponding markdown being renamed to `COMMUNITY.md`. PDFs are usually submitted artifacts with external references — renaming could break a previously-submitted deliverable link. Decide: rename to `COMMUNITY.pdf`, regenerate from the current `COMMUNITY.md`, or leave as-is.

### `docs/archive/MILESTONE_2.md`
Archived as-is. It was a Sprint 2 planning doc — aspirational, partially shipped. Could be rewritten as `ITERATION_2_RETROSPECTIVE.md` ("what we planned vs. what shipped") if you want the historical record to be useful instead of just preserved. Low priority.

### `docs/models/TRANSFORMERS.md`
Now has a "design proposal, not yet implemented" disclaimer. If the transformer path is dead (no plans to ship DNABERT-2 integration), move to `docs/archive/`. If it's still on the roadmap, leave in place.

## Deferred work (non-docs)

- **Browser E2E smoke test for auth** — blocked until the frontend wires a login UI + `credentials: 'include'` on fetch calls.
