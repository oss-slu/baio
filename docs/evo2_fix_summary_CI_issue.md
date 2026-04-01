# Fix: Stabilize Evo2 Dependency Handling — Issue #169

## Overview

This document summarizes the work done to fix issue [#169](https://github.com/oss-slu/baio/issues/169) in the BAIO project. The goal was to isolate the optional Evo2 path from the core developer workflow so that `pytest -q` no longer crashes on a standard CPU-only machine.

---

## Problem

When a contributor cloned the repo and ran `pytest -q`, Python **aborted during test collection** before a single test could run. This happened because:

1. pytest collected `tests/test_evo2_embedder.py`
2. That file unconditionally imported `binary_classifiers.evo2_embedder`
3. Which triggered imports of `torch` and `transformers` — heavy GPU libraries
4. On machines without a GPU, this crashed the entire Python process
5. Contributors working on unrelated code (API, frontend, k-mer classifier) were completely blocked from testing their changes

Additionally, `pyproject.toml` listed `torch`, `transformers`, `tokenizers`, `accelerate`, and `datasets` as **base dependencies**, meaning every contributor was expected to have a full GPU stack installed.

---

## Root Cause

Even though `evo2_embedder.py` already used safe lazy imports with a `TRANSFORMERS_AVAILABLE` flag, the **test file itself** imported the module unconditionally at the top level. pytest's collection phase triggered this import on every run — crashing the interpreter before any tests executed.

---

## Files Changed

### 1. `tests/test_evo2_embedder.py`

Added a module-level `pytestmark` skip guard at the top of the file. It checks whether `torch` and `transformers` are installed before pytest collects the tests. If either is missing, all 4 Evo2 tests are **skipped gracefully** instead of crashing.

```python
from __future__ import annotations

from types import SimpleNamespace

import numpy as np
import pytest

_evo2_deps_available = False
try:
    import torch  # noqa: F401
    import transformers  # noqa: F401
    _evo2_deps_available = True
except ImportError:
    pass

pytestmark = pytest.mark.skipif(
    not _evo2_deps_available,
    reason="Evo2 dependencies not installed — run: pip install baio[evo2]",
)

import binary_classifiers.evo2_embedder as evo2_module  # noqa: E402
```

**Before:** missing torch → Python aborts, 0 tests run  
**After:** missing torch → 4 Evo2 tests skipped, all other tests run normally

---

### 2. `pyproject.toml`

Removed `torch`, `transformers`, `tokenizers`, `accelerate`, and `datasets` from the base `dependencies` list. Added a new `evo2` optional extra:

```toml
# Removed from base dependencies:
# "torch==2.8.0",
# "transformers==4.56.1",
# "tokenizers==0.22.0",
# "accelerate>=0.30",
# "datasets>=2.19",

# Added as optional extra:
[project.optional-dependencies]
evo2 = [
    "torch==2.8.0",
    "transformers==4.56.1",
    "tokenizers==0.22.0",
    "accelerate>=0.30",
    "datasets>=2.19",
]
```

**Core install:** `pip install -e .` — no GPU libraries required  
**Evo2 install:** `pip install -e ".[evo2]"` — opt in explicitly

---

### 3. `.github/workflows/ci.yml`

Split the single CI job into two separate jobs:

- **Core job** (`lint-and-test`): always runs on every PR and push, uses `--ignore=tests/test_evo2_embedder.py` so Evo2 never blocks the pipeline
- **Evo2 job** (`test-evo2`): only runs when the `evo2` label is added to a PR or triggered manually via `workflow_dispatch`

Also added an explicit `permissions` block as recommended by CodeQL:

```yaml
permissions:
  contents: read
```

---

### 4. `binary_classifiers/evo2_embedder.py`

Updated the warning message in `__init__` to point contributors to the correct new install command:

```python
# Before
"WARNING: transformers library not installed. Install with: pip install transformers torch"

# After
"WARNING: Evo2 dependencies not installed. Install with: pip install baio[evo2]"
```

---

## Verification

All fixes were verified locally before pushing:

| Check | Command | Result |
|-------|---------|--------|
| Core suite passes | `pytest --ignore=tests/test_evo2_embedder.py --tb=no --no-header -p no:warnings` | ✅ 87 passed |
| Evo2 tests pass when deps present | `pytest tests/test_evo2_embedder.py -v` | ✅ 4 passed |
| torch removed from base deps | `python -c "import tomllib; ..."` | ✅ `torch in base deps: False` |
| evo2 optional extra exists | `python -c "import tomllib; ..."` | ✅ confirmed |
| evo2_embedder imports cleanly | `python -c "import binary_classifiers.evo2_embedder; print('module imported cleanly')"` | ✅ clean |

---

## CI Issues Encountered & Fixed

### Issue 1: `black` formatting failure
CI failed because `black` reformatted `test_evo2_embedder.py`. Fixed by running black locally and committing the result:
```bash
black tests/test_evo2_embedder.py
git add tests/test_evo2_embedder.py
git commit -m "style: apply black formatting to test_evo2_embedder"
```

### Issue 2: `flake8 E402` — module level import not at top of file
The `import binary_classifiers.evo2_embedder` line appeared after the skip guard, triggering an E402 warning. Fixed by adding `# noqa: E402`:
```python
import binary_classifiers.evo2_embedder as evo2_module  # noqa: E402
```

### Issue 3: CodeQL permissions warning
GitHub's CodeQL flagged missing permissions on the CI workflow. Fixed by adding:
```yaml
permissions:
  contents: read
```

---

## How to Test

**Core suite — works on any machine:**
```bash
pip install -e .
pytest --ignore=tests/test_evo2_embedder.py --tb=no --no-header -p no:warnings
# Expected: 87 passed
```

**Evo2 suite — requires torch and transformers:**
```bash
pip install -e ".[evo2]"
pytest tests/test_evo2_embedder.py -v
# Expected: 4 passed
```

---

## Branch & PR

- **Branch:** `fix/stabilize-evo2-dependency-handling`
- **PR:** Fixes #169
