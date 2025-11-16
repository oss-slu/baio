from __future__ import annotations
from typing import List, Optional
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
            # Convert to list if it's a numpy array or similar
            if hasattr(proba, "tolist"):
                return proba.tolist()
            return list(proba)  # type: ignore[arg-type]
        return None

    def predict_file(self, path: str) -> List[int]:
        seqs = load_sequences(path)
        # Remove redundant cast - let type inference handle it
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

    out = {"pred": clf.predict(X)}
    if args.proba:
        proba_result = clf.predict_proba(X)
        out["proba"] = proba_result
    print(json.dumps(out))
