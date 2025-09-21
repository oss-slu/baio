#!/usr/bin/env python3
"""Simple script to run prompt comparisons."""

import sys
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from prompting.compare import run_all


def main():
    # Simple test evidence
    evidence = {
        "known_taxa": [["SARS-CoV-2", 0.65], ["Human", 0.25]],
        "ood_rate": 0.05,
        "sample_meta": "Test wastewater sample"
    }
    
    print("Running prompt technique comparison...")
    result_path = run_all(evidence)
    print(f"Complete! Results: {result_path}")


if __name__ == "__main__":
    main()