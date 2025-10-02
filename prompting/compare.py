"""Simple comparison framework."""

import json
import time
from pathlib import Path
from typing import Dict, Any, Iterable, Tuple
from .techniques import get_all_techniques


def run_all(evidence: Dict[str, Any], out_dir: str = "/data/runs/prompts") -> str:
    """Run every registered technique and persist comparison results.

    Returns the path to the saved JSON file. Keeps console output brief.
    """
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    
        # Prepare results container with concrete types so mypy knows how we use it.
    results: Dict[str, Any] = {
        "evidence": evidence,
        "runs": [],        # List[Dict[str, Any]]
        "summary": {},     # Dict[str, Any]
    }

    # Resolve techniques; support both dict[name->tech] and iterable[tech].
    techniques = get_all_techniques()
    if isinstance(techniques, dict):
        technique_items: Iterable[Tuple[str, Any]] = techniques.items()
    else:
        technique_items = (
            (getattr(t, "name", t.__class__.__name__), t) for t in techniques  # type: ignore[call-arg]
        )

    total_count: int = 0
    valid_count: int = 0

    # Keep a typed reference to the runs list for safe appends.
    runs_list = results["runs"]
    assert isinstance(runs_list, list)

    for name, tech in technique_items:
        total_count += 1
        try:
            out = tech.run(evidence)  # expected to be dict-like
            if not isinstance(out, dict):
                out = {"output": out}
            ok = bool(out.get("valid", True))
            if ok:
                valid_count += 1
            run_record: Dict[str, Any] = {"name": str(name), "result": out}
            runs_list.append(run_record)
        except Exception as exc:
            runs_list.append({"name": str(name), "error": str(exc)})

    
    # Simple metrics
    valid_count = sum(1 for r in results['technique_results'].values() if r.get('valid', False))
    total_count = len(results['technique_results'])
    
    results['summary'] = {
        'valid_techniques': valid_count,
        'total_techniques': total_count,
        'success_rate': valid_count / total_count if total_count > 0 else 0
    }
    
    # Save results
    timestamp = int(time.time())
    output_file = Path(out_dir) / f"comparison_{timestamp}.json"
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\nResults: {valid_count}/{total_count} techniques succeeded")
    print(f"Saved to: {output_file}")
    
    return str(output_file)