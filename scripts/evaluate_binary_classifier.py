#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Any, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from binary_classifiers.evaluation import (  # noqa: E402
    evaluate_predictor,
    load_labeled_sequences,
)
from binary_classifiers.predict_class import PredictClass  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate the deployed BAIO binary classifier on labeled FASTA/FASTQ files."
    )
    parser.add_argument(
        "--model",
        choices=["RandomForest", "SVM"],
        default="RandomForest",
        help="Saved model artifact to evaluate",
    )
    parser.add_argument(
        "--virus-file",
        default="data/covid_reads5.fasta",
        help="Path to FASTA/FASTQ file containing virus sequences",
    )
    parser.add_argument(
        "--host-file",
        default="data/human_reads5.fasta",
        help="Path to FASTA/FASTQ file containing host sequences",
    )
    parser.add_argument(
        "--output",
        help="Optional JSON output path for the evaluation report",
    )
    return parser.parse_args()


def build_report(args: argparse.Namespace) -> Dict[str, Any]:
    labeled_sequences = load_labeled_sequences(
        virus_file=args.virus_file,
        host_file=args.host_file,
    )
    predictor = PredictClass(model_name=args.model)
    metrics = evaluate_predictor(predictor, labeled_sequences)

    return {
        "model_name": args.model,
        "virus_file": args.virus_file,
        "host_file": args.host_file,
        "metrics": metrics,
    }


def main() -> None:
    args = parse_args()
    report = build_report(args)
    report_json = json.dumps(report, indent=2)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(report_json + "\n", encoding="utf-8")

    print(report_json)


if __name__ == "__main__":
    main()
