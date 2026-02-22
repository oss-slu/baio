from __future__ import annotations

import argparse
from functools import lru_cache
from typing import Literal

from binary_classifiers.predict_class import PredictClass


@lru_cache(maxsize=2)
def _get_predictor(model_name: Literal["RandomForest", "SVM"]) -> PredictClass:
    return PredictClass(model_name=model_name)


def predict_class(
    dna_sequence: str, model_name: Literal["RandomForest", "SVM"] = "SVM"
) -> Literal["Virus", "Host"]:
    if not isinstance(dna_sequence, str):
        raise ValueError("Input must be a string.")

    cleaned = dna_sequence.strip().upper()
    if not cleaned:
        raise ValueError("DNA sequence cannot be empty.")

    return _get_predictor(model_name).predict(cleaned)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Predict whether a DNA sequence is Virus or Host."
    )
    parser.add_argument("sequence", help="DNA sequence to classify")
    parser.add_argument(
        "--model",
        choices=["RandomForest", "SVM"],
        default="SVM",
        help="Classifier model to use",
    )
    args = parser.parse_args()

    print(predict_class(args.sequence, args.model))
