# Checkpoint Artifact Submission — Sprint 6

**Project:** BAIO (Bioinformatics AI for Open-Set Detection)
**Course:** Open Source Software — Saint Louis University
**Sprint:** 6
**Tech Lead:** Mainuddin Sarker
**Team:** Mainuddin Sarker, Luis Palmejar, Kevin Yang
**Repository:** https://github.com/oss-slu/baio

---

## Artifact Identification

**Checkpoint Catalog Item:** Tech Lead Metrics Report

**Primary Artifact:** `docs/metrics/sprint_6_metrics_report.md`
**Format:** Markdown document with data tables, trend visualizations, and action items

---

## Rationale

We selected the Tech Lead Metrics Report checkpoint for Sprint 6 because BAIO is now past its architectural foundation phase and actively shipping features — which means the team needs measurement, not just momentum. By Sprint 6 we have merged 30+ pull requests, integrated a database layer, scaffolded the Evo2 model pipeline, built an HPC submission workflow, and iterated the frontend three times. At this scale, decisions about what to prioritize next cannot rely on intuition alone. A metrics report gives the team a data-backed view of where throughput is strong, where it is stalling, and what structural patterns — such as contributor concentration or a growing issue backlog — need to be corrected before the final sprint.

This checkpoint also contributes directly to both the final product and the community strategy. For the final product, the report surfaces two concrete risks: an Evo2 inference blocker on the Libra HPC cluster and a 13-issue open backlog with no triage labels. Addressing these in Sprint 7 is only possible because the metrics made them visible now. For the community strategy, the contributor spread metric — which showed all Sprint 6 commits came from the Tech Lead — creates an explicit, documented call-to-action for Kevin and Luis to take ownership in the final sprint. Sustainable open-source projects require distributed ownership; this report names the gap and sets a measurable target to close it.
