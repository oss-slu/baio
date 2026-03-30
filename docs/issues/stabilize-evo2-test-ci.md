# [Feature/Enhancement]: Stabilize Evo2 dependency handling for local development and CI

## Summary
BAIO's Evo2 integration is intended to be optional, but the current import path makes `transformers` and `torch` part of normal test collection. On a standard local environment, `pytest -q` aborts the Python interpreter while importing `binary_classifiers.evo2_embedder`, which prevents contributors from validating unrelated parts of the project. The lightweight unit suite still passes when Evo2 is excluded, so this looks like an isolation problem rather than a repo-wide test failure.

## Evidence
- Local `pytest -q` aborted during collection while importing `torch` from `binary_classifiers/evo2_embedder.py`.
- A lightweight subset passed successfully:
  - `pytest -q tests/test_data_processing.py tests/test_models.py tests/test_prompting_schemas.py`
- `binary_classifiers/evo2_embedder.py` imports `transformers` and `torch` at module import time instead of lazily at runtime.
- `pyproject.toml` currently treats the Evo2 stack (`torch`, `transformers`, `tokenizers`, `accelerate`, `datasets`) as base dependencies instead of an optional extra.
- CI runs the full pytest suite by default, so one unstable optional dependency path can block the whole pipeline.

## Problem
- `binary_classifiers/evo2_embedder.py` imports heavyweight ML libraries at module import time, which can crash the interpreter before BAIO can fall back gracefully.
- `tests/test_evo2_embedder.py` imports the module directly during collection, so the optional path is exercised even when contributors are only trying to run the normal unit suite.
- Base installation and project metadata do not clearly separate the core k-mer pipeline from the optional Evo2 path.
- README testing instructions imply that `pytest tests/` is a reliable default validation step for all contributors, which is not true today.

## Proposed Scope
- Refactor Evo2 runtime loading so `transformers` and `torch` are imported lazily inside a dedicated loader instead of at module import time.
- Handle runtime initialization failures defensively so unsupported environments degrade to a clear "Evo2 unavailable" path rather than aborting Python.
- Move Evo2-specific dependencies behind an optional extra such as `baio[evo2]`, or otherwise isolate them from the default install path.
- Mark Evo2-specific tests as `integration` or `slow`, and skip them by default unless the required runtime is explicitly available.
- Update CI so the default unit-test job validates the main app without requiring Evo2, with a separate Evo2 job if that path needs coverage.
- Update README and troubleshooting docs to describe the difference between base setup and optional Evo2 setup.

## Acceptance Criteria
- `pytest -q` no longer aborts during test collection on a standard CPU-only developer setup.
- Importing the Evo2 module without a supported runtime fails gracefully and predictably.
- Default CI can validate the repo's core functionality without depending on Evo2-specific runtime support.
- Evo2 tests are still runnable in an explicitly provisioned environment.
- Developer docs clearly explain how to install and validate the optional Evo2 path.

## Why This Matters
- Restores confidence in the default developer workflow.
- Keeps the optional foundation-model path from blocking work on the core classifier, API, and frontend.
- Reduces CI brittleness and shortens feedback loops for contributors.
