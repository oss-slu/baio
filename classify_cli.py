#!/usr/bin/env python3
import argparse
import json
import sys
from binary_classifiers.predict_class import PredictClass


def main():
    parser = argparse.ArgumentParser(
        description="Classify DNA sequences as Virus or Host"
    )
    parser.add_argument(
        "--model",
        choices=["RandomForest", "SVM"],
        default="RandomForest",
        help="Model to use",
    )
    parser.add_argument("--sequence", "-s", help="DNA sequence to classify")
    parser.add_argument("--file", "-f", help="File with sequences (one per line)")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    predictor = PredictClass(model_name=args.model)

    sequences = []
    if args.sequence:
        sequences = [("input", args.sequence)]
    elif args.file:
        with open(args.file, "r") as f:
            sequences = [
                (f"line_{i + 1}", line.strip())
                for i, line in enumerate(f)
                if line.strip()
            ]
    else:
        seq = sys.stdin.read().strip()
        if seq:
            sequences = [("stdin", seq)]

    if not sequences:
        print(
            "Error: Provide --sequence, --file, or pipe sequence via stdin",
            file=sys.stderr,
        )
        sys.exit(1)

    results = []
    for seq_id, seq in sequences:
        label, confidence = predictor.predict_with_confidence(seq)
        results.append(
            {
                "id": seq_id,
                "sequence": seq[:50] + "..." if len(seq) > 50 else seq,
                "prediction": label,
                "confidence": round(confidence, 4),
                "length": len(seq),
            }
        )

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for r in results:
            print(f"ID: {r['id']}")
            print(f"Sequence: {r['sequence']}")
            print(f"Prediction: {r['prediction']}")
            print(f"Confidence: {r['confidence']}")
            print("-" * 40)


if __name__ == "__main__":
    main()
