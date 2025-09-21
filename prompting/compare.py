"""Simple comparison framework."""

import json
import time
from pathlib import Path
from typing import Dict, Any
from .techniques import get_all_techniques


def run_all(evidence: Dict[str, Any], out_dir: str = "/data/runs/prompts") -> str:
    """Run all techniques and compare results."""
    Path(out_dir).mkdir(parents=True, exist_ok=True)
    
    techniques = get_all_techniques()
    results = {
        'evidence': evidence,
        'timestamp': time.time(),
        'technique_results': {}
    }
    
    print(f"Running {len(techniques)} techniques...")
    
    for name, technique in techniques.items():
        print(f"  {name}...", end='')
        try:
            result = technique.run(evidence)
            results['technique_results'][name] = dict(result)
            print(f" ✓ ({result['latency_s']:.1f}s)")
        except Exception as e:
            print(f" ✗ {e}")
            results['technique_results'][name] = {
                'technique': name,
                'valid': False,
                'errors': [str(e)]
            }
    
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