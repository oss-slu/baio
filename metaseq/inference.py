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
            return proba.tolist()  # type: ignore[no-any-return]
        return None

    def predict_file(self, path: str) -> List[int]:
        seqs = load_sequences(path)
        X = [s for _, s in seqs]
        return self.predict(X)


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

        X = [s for _, s in _ls(args.file)]

    out = {"pred": clf.predict(X)}
    if args.proba:
        out["proba"] = clf.predict_proba(X)
    print(json.dumps(out))
