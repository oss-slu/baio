from __future__ import annotations
from typing import List, Optional, Any, Dict
from .dataio import load_sequences
from .models import load_model


class ClassifierInference:
    def __init__(self, model_path: str) -> None:
        self.model_path = model_path
        self.model = load_model(model_path)

    def predict(self, sequences: List[str]) -> List[int]:
        preds = self.model.predict(sequences)
        return [int(p) for p in preds]

    def predict_proba(self, sequences: List[str]) -> Optional[List[List[float]]]:
        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba(sequences)
            if proba is None:
                return None

            # Handle different return types from predict_proba
            if hasattr(proba, "tolist"):
                result = proba.tolist()
            else:
                result = list(proba)

            # Ensure we have the correct type
            if isinstance(result, list) and all(
                isinstance(item, list) for item in result
            ):
                return result
            else:
                # Fallback: wrap single predictions in a list
                return [[float(p)] for p in result]
        return None

    def predict_file(self, path: str) -> List[int]:
        seqs = load_sequences(path)
        X: List[str] = [s for _, s in seqs]
        result: List[int] = self.predict(X)
        return result


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(
        description="Run inference with a saved binary classifier"
    )
    parser.add_argument("--model", required=True, help="Path to saved joblib model")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--seq", nargs="*", help="DNA sequences to classify")
    group.add_argument("--file", help="FASTA/FASTQ file with sequences")
    parser.add_argument(
        "--proba", action="store_true", help="Return probabilities as well"
    )

    args = parser.parse_args()

    clf = ClassifierInference(args.model)

    if args.seq:
        X = args.seq
    else:
        from .dataio import load_sequences as _ls

        seq_data = _ls(args.file)
        X = [s for _, s in seq_data]

    # Fix the main issue: use proper typing for the output dictionary
    out: Dict[str, Any] = {"pred": clf.predict(X)}
    if args.proba:
        proba_result = clf.predict_proba(X)
        out["proba"] = proba_result
    print(json.dumps(out))
