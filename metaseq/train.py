from __future__ import annotations
from typing import List, Tuple, Optional, Dict, Any
import os
import json
import yaml  # type: ignore[import-untyped]
import pandas as pd  # type: ignore[import-untyped]
from sklearn.model_selection import train_test_split  # type: ignore[import-untyped]
from sklearn.metrics import classification_report  # type: ignore[import-untyped]
from .dataio import load_sequences
from .models import build_pipeline, save_model


def _ensure_dir(path: str) -> None:
    d = os.path.dirname(path)
    if d:
        os.makedirs(d, exist_ok=True)


def load_dataset(
    csv_path: Optional[str] = None,
    seq_file: Optional[str] = None,
    label_map_json: Optional[str] = None,
) -> Tuple[List[str], List[int]]:
    if csv_path:
        df = pd.read_csv(csv_path)
        if not {"sequence", "label"}.issubset(df.columns):
            raise ValueError("CSV must contain 'sequence' and 'label' columns")
        X = df["sequence"].astype(str).tolist()
        y = df["label"].astype(int).tolist()
        return X, y
    if seq_file and label_map_json:
        seqs = load_sequences(seq_file)
        with open(label_map_json, "r", encoding="utf-8") as f:
            label_map: Dict[str, int] = json.load(f)
        X = [s for _, s in seqs]
        y = [label_map.get(sid, 0) for sid, _ in seqs]
        return X, y
    raise ValueError("Provide either csv_path or (seq_file and label_map_json)")


def train_from_config(config_path: str) -> Dict[str, Any]:
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    data_cfg = cfg.get("data", {})
    model_cfg = cfg.get("model", {})
    train_cfg = cfg.get("train", {})
    out_cfg = cfg.get("output", {})

    X, y = load_dataset(
        csv_path=data_cfg.get("csv"),
        seq_file=data_cfg.get("seq_file"),
        label_map_json=data_cfg.get("label_map_json"),
    )

    test_size = float(train_cfg.get("test_size", 0.2))
    random_state = int(train_cfg.get("random_state", 42))
    stratify = y if bool(train_cfg.get("stratify", True)) and len(set(y)) > 1 else None

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=stratify
    )

    model_name = model_cfg.get("name", "svm")
    params = model_cfg.get("params", {})
    pipe = build_pipeline(model_name, params)
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_val)
    report = classification_report(y_val, y_pred, output_dict=True)

    model_path = out_cfg.get("model_path", "weights/binary_classifier.joblib")
    _ensure_dir(model_path)
    save_model(pipe, model_path)

    return {
        "model_path": model_path,
        "report": report,
        "n_train": len(X_train),
        "n_val": len(X_val),
        "model_name": model_name,
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Train binary classifier from YAML config"
    )
    parser.add_argument("--config", required=True, help="Path to YAML config")
    args = parser.parse_args()

    stats = train_from_config(args.config)
    print(json.dumps(stats, indent=2))
