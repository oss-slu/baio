#!/usr/bin/env python3
"""
Retrain binary classifier with COVID (Virus) and Human (Host) data.
"""

import os
import sys
import warnings
from pathlib import Path

import joblib
import numpy as np
from metaseq.dataio import load_fasta
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.svm import SVC

from binary_classifiers.transformers.kmers_transformer import KmerTransformer

warnings.filterwarnings("ignore")

LABEL_MAP = {0: "Host", 1: "Virus"}


def load_training_data(data_dir: str = "data"):
    """Load COVID (virus) and Human (host) sequences."""
    virus_file = os.path.join(data_dir, "covid_reads5.fasta")
    host_file = os.path.join(data_dir, "human_reads5.fasta")

    sequences = []
    labels = []

    if os.path.exists(virus_file):
        virus_seqs = load_fasta(virus_file)
        for seq_id, seq in virus_seqs:
            sequences.append(seq)
            labels.append(1)
        print(f"Loaded {len(virus_seqs)} virus sequences from {virus_file}")

    if os.path.exists(host_file):
        host_seqs = load_fasta(host_file)
        for seq_id, seq in host_seqs:
            sequences.append(seq)
            labels.append(0)
        print(f"Loaded {len(host_seqs)} host sequences from {host_file}")

    return sequences, labels


def train_model(sequences, labels, model_type="random_forest"):
    """Train a binary classifier."""
    kmer_transformer = KmerTransformer()
    kmers = kmer_transformer.transform(sequences)

    vectorizer = CountVectorizer()
    X = vectorizer.fit_transform(kmers)
    y = np.array(labels)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    if model_type == "random_forest":
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=None,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )
    else:
        model = SVC(kernel="rbf", C=1.0, probability=True, random_state=42)

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n=== {model_type.upper()} Model Results ===")
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Host", "Virus"]))

    return model, vectorizer, kmer_transformer


def save_model(model, vectorizer, model_type="random_forest"):
    """Save trained model and vectorizer."""
    base_dir = Path(__file__).parent / "binary_classifiers"
    models_dir = base_dir / "models"
    transformers_dir = base_dir / "transformers"

    models_dir.mkdir(exist_ok=True)
    transformers_dir.mkdir(exist_ok=True)

    if model_type == "random_forest":
        model_path = models_dir / "random_forest_best_model.pkl"
        vectorizer_path = transformers_dir / "random_forest_vectorizer.pkl"
    else:
        model_path = models_dir / "support_vector_machine_best_model.pkl"
        vectorizer_path = transformers_dir / "support_vector_machine_vectorizer.pkl"

    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vectorizer_path)
    print(f"\nModel saved to: {model_path}")
    print(f"Vectorizer saved to: {vectorizer_path}")


def test_model(model, vectorizer, kmer_transformer):
    """Test the trained model on sample sequences."""
    test_sequences = [
        (
            "COVID",
            "CAAGTGCTTTTGTGGAAACTGTGAAAGGTTTGGATTATAAAGCATTCAAACAAATTGTTGAATCCTGTGGTAATTTTAAAGTTACAAAAGGAAAAGCTAAAAAAGGTGCCTGGAATATTGGTGAACAGAAATCAATACTGAGTCCTCTTT",
        ),
        (
            "Human",
            "CCAAACTTCGGGCGGCGGCTGAGGCGGCGGCCGAGGAGCGGCGGACTCGGGGCGCGGGGAGTCGAGGCATTTGCGCCTGTGCTTCGGACCGTAGCGCCAGGGCCTGAGCCTTTGAAGCAGGAGGAGGGGAGGAGAGAGTG",
        ),
    ]

    print("\n=== Testing Model ===")
    for name, seq in test_sequences:
        kmers = kmer_transformer.transform([seq])
        features = vectorizer.transform(kmers)
        pred = model.predict(features)[0]
        proba = model.predict_proba(features)[0]
        label = LABEL_MAP[pred]
        confidence = proba[pred]
        print(f"{name}: {label} (confidence: {confidence:.2%})")


def main():
    print("Loading training data...")
    sequences, labels = load_training_data()

    if len(sequences) == 0:
        print("Error: No training data found!")
        sys.exit(1)

    print(f"\nTotal sequences: {len(sequences)}")
    print(f"Virus (1): {sum(labels)}")
    print(f"Host (0): {len(labels) - sum(labels)}")

    print("\nTraining RandomForest model...")
    rf_model, rf_vectorizer, kmer_transformer = train_model(
        sequences, labels, "random_forest"
    )
    save_model(rf_model, rf_vectorizer, "random_forest")
    test_model(rf_model, rf_vectorizer, kmer_transformer)

    print("\nTraining SVM model...")
    svm_model, svm_vectorizer, _ = train_model(sequences, labels, "svm")
    save_model(svm_model, svm_vectorizer, "svm")
    test_model(svm_model, svm_vectorizer, kmer_transformer)

    print("\nDone! Models retrained successfully.")


if __name__ == "__main__":
    main()
