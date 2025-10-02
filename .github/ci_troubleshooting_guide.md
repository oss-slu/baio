# GitHub Actions CI Troubleshooting Guide

This guide helps you quickly diagnose and fix failures in the project’s CI workflow.

> **Scope**: Tailored to the repository’s `CI Pipeline` workflow, which:
- checks out the code
- sets up **Conda (Miniforge + mamba)** via `setup-miniconda`
- caches Conda packages
- prints tool versions
- `pip install`s CI tools (pre-commit, mypy, pytest, build)
- runs **pre-commit** (format/lint)
- runs **mypy** on `metaseq` and `app`
- runs **pytest** if tests exist
- builds the package with `python -m build` if `pyproject.toml` is present

---

## 0) Fast triage checklist

1. **Open the failing step’s logs** and copy the _first_ error message (often above the summary).
2. **Map the failing step** → _Pre-commit? mypy? pytest? packaging? environment setup?_
3. **Reproduce locally** (see commands below) with a clean environment if possible.
4. **Fix the smallest thing first** (e.g., a single file’s lint or a missing type stub).
5. **Re-run only the job** (or push a small commit) to verify the fix.

---

## 1) Pre-commit failures (formatting & lint)

Common causes:
- **Black** reformatting needed (files modified by hook).
- **Flake8**: line length (`E501`), whitespace (`E203`), line break rules (`W503`), unused imports, etc.
- **Trailing whitespace / end-of-file newline** issues.

How to reproduce & fix locally:
```bash
# from repo root
pre-commit run --all-files
# or install hooks for local commits
pre-commit install
# auto-fix formatting
black .
# show flake8 issues locally (optional)
flake8
```
Tips:
- If CI shows *“files were modified by this hook”*, run `black .` locally and commit the changes.
- For `E501 line too long`, either wrap lines or confirm your Flake8 config allows longer lines.
- Keep `extend-ignore = ["E203", "W503"]` if you follow Black’s defaults.

---

## 2) Mypy failures (type checking)

Frequent patterns & quick fixes:

- **Missing library stubs** (e.g., `requests`, `boto3`, etc.):
  ```bash
  python -m pip install types-requests types-boto3  # as needed
  ```
- **Missing packages at runtime** (e.g., `fastapi` not found): add to your environment (Conda/pip) and to project dependency files.
- **Untyped decorator makes function untyped**:
  Use explicit `Callable[..., Any]` signatures in decorators and annotate functions:
  ```python
  from typing import Any, Callable
  from functools import wraps

  def typed_decorator(func: Callable[..., Any]) -> Callable[..., Any]:
      @wraps(func)
      def wrapper(*args: Any, **kwargs: Any) -> Any:
          return func(*args, **kwargs)
      return wrapper

  @typed_decorator
  def run_pipeline() -> None:
      ...
  ```
- **“object has no attribute …”**: avoid `object`-typed variables; give concrete types:
  ```python
  from typing import List, Dict, Any
  items: List[str] = []
  meta: Dict[str, Any] = {}
  ```
- **Unreachable code**: remove/guard code after `return`/`raise`, or refactor conditionals.

Reproduce locally:
```bash
mypy metaseq app
```

---

## 3) Pytest failures (unit tests)

- Read the first failing test’s **assert** and **stack trace**.
- Ensure test dependencies and fixtures are available.
- Run locally with more detail:
  ```bash
  pytest -q --maxfail=1 --disable-warnings
  # or with verbose output
  pytest -vv
  ```
- If CI reports “No tests found”, confirm your tests are named `test_*.py` or `*_test.py` in a `tests/` directory.

---

## 4) Packaging failures (`python -m build`)

Common errors & remedies:
- **`tool.setuptools.packages` misconfigured**: prefer automatic discovery:
  ```toml
  [tool.setuptools.packages.find]
  where = ["."]
  include = ["your_top_level_package*"]
  exclude = ["tests*", "docs*"]
  ```
- Missing `pyproject.toml` fields or build backend pins—confirm a minimal valid config.
- Include non-code files via `package-data` or MANIFEST settings if required.
- Verify the wheel builds locally:
  ```bash
  python -m build
  ls -lah dist
  ```

---

## 5) Environment & Conda issues

Symptoms:
- Env fails to solve or packages conflict.
- Missing deps available only via `pip`.

Fixes:
- Ensure all **runtime and typing deps** exist in `environment.yml` (Conda) or install via pip post-creation.
- If caching causes stale environments, **bump the cache key** (e.g., change/format `environment.yml` or include a version pin).
- Print env details in CI step logs: Python version, `conda info`, `conda list`.
- Match local Python version to CI’s.

Repro locally (suggestion):
```bash
conda env create -f environment.yml -n baio
conda activate baio
python --version && pip --version
pre-commit run --all-files && mypy metaseq app && pytest -q || true
python -m build
```

---

## 6) Runner/Actions specifics

- **Timeouts**: default job timeout here is 45 minutes. If solving is slow, trim dependencies, pin channels, or move heavy installs to Conda.
- **Concurrency**: a new push to the same ref **cancels in-progress** jobs. If jobs stop unexpectedly, check if another push preempted them.
- **Reruns**: Use “Re-run jobs” in the Actions UI after pushing a fix or when flakiness is suspected.

---

## 7) Reproduce CI locally

- **Pre-commit / mypy / pytest**: run the same commands shown above.
- **`act` (optional)**: simulate Actions locally with Docker. You’ll need Docker installed; then:
  ```bash
  act -j lint-and-test --container-architecture linux/amd64
  ```
  If images are missing, act will prompt for an image size; pick **Medium** unless you specifically need Large.

> _Note_: Some macOS systems need `--container-architecture linux/amd64` for compatibility.

---

## 8) When to change CI vs code

- **Change code** for formatting, lint, typing, and failing tests—it’s the source of truth.
- **Change CI** when the pipeline is too slow (caching, pinning), uses wrong tool paths, or fails due to environment setup—not due to code logic.

---

## 9) Pull Request checklist (before pushing)

- [ ] `black .` and `pre-commit run --all-files` pass
- [ ] `mypy metaseq app` passes (or justified ignores)
- [ ] `pytest -q` passes locally (if tests exist)
- [ ] `python -m build` succeeds locally
- [ ] Dependencies declared (`environment.yml`, `pyproject.toml`) and consistent

---

## 10) Getting help

If you’re stuck, paste the **exact error** (first 20–30 lines) and specify **which CI step** failed. Include:
- Current branch & last commit SHA
- OS/Python version locally
- Whether the issue reproduces locally
- Any recent changes to `environment.yml` / `pyproject.toml` / pre-commit config
