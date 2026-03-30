from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Literal, Sequence, Tuple

import joblib  # type: ignore[import-untyped] # noqa: E402

from .transformers.kmers_transformer import (
    KmerTransformer,
)  # noqa: E402

LABEL_MAP = {0: "Host", 1: "Virus"}
MODEL_FILE_MAP = {
    "RandomForest": ("random_forest_best_model.pkl", "random_forest_vectorizer.pkl"),
    "SVM": (
        "support_vector_machine_best_model.pkl",
        "support_vector_machine_vectorizer.pkl",
    ),
    "Evo2": ("evo2_classifier.pkl", None),  # Evo2 uses its own embeddings
}


class PredictClass:
    def __init__(
        self, model_name: Literal["RandomForest", "SVM", "Evo2"] = "RandomForest"
    ) -> None:
        """Initialize the predictor class."""

        self.model_name = model_name
        if self.model_name not in MODEL_FILE_MAP:
            raise ValueError(
                f"Unsupported model_name '{self.model_name}'. Expected one of: {tuple(MODEL_FILE_MAP)}"
            )

        self.model: Any | None = None
        self.vectorizer: Any | None = None
        self.kmer_tranformer: KmerTransformer | None = None
        self.evo2_embedder: Any | None = None

        if self.model_name == "Evo2":
            self._configure_evo2()
        else:
            self._load_kmer_pipeline(self.model_name)

    def _configure_evo2(self) -> None:
        base_dir = Path(__file__).resolve().parent
        evo2_model_path = base_dir / "models" / MODEL_FILE_MAP["Evo2"][0]

        try:
            from .evo2_embedder import Evo2Embedder
        except ImportError:
            print("Evo 2 embedder not available, using k-mer fallback")
            self._fallback_to_random_forest()
            return

        self.evo2_embedder = Evo2Embedder(model_size="7b")
        if not self.evo2_embedder.is_available():
            print("Evo 2 not available, using k-mer fallback")
            self._fallback_to_random_forest()
            return

        if not evo2_model_path.exists():
            print("Evo 2 classifier artifact not found, using k-mer fallback")
            self._fallback_to_random_forest()
            return

        self.model = joblib.load(evo2_model_path)
        print("Evo 2 embedder loaded successfully!")

    def _fallback_to_random_forest(self) -> None:
        self.model_name = "RandomForest"
        self.evo2_embedder = None
        self._load_kmer_pipeline(self.model_name)

    def _load_kmer_pipeline(
        self,
        model_name: Literal["RandomForest", "SVM"],
    ) -> None:
        base_dir = Path(__file__).resolve().parent
        model_file, vectorizer_file = MODEL_FILE_MAP[model_name]
        self.model = joblib.load(base_dir / "models" / model_file)
        self.kmer_tranformer = KmerTransformer()

        if vectorizer_file is None:
            raise ValueError(f"Expected vectorizer artifact for model '{model_name}'")

        self.vectorizer = joblib.load(base_dir / "transformers" / vectorizer_file)

    def _require_model(self) -> Any:
        if self.model is None:
            raise RuntimeError(f"Model '{self.model_name}' is not loaded")
        return self.model

    def _preprocess_with_evo2(self, sequence: str) -> object:
        if self.evo2_embedder is None:
            raise RuntimeError("Evo 2 embedder is not available")

        embedding = self.evo2_embedder.get_embedding(sequence)
        if embedding is None:
            raise RuntimeError("Evo 2 embedding generation failed")

        return [embedding]

    def predict(self, sequence: str) -> Literal["Virus", "Host"]:
        features = self._preprocess(sequence)
        model = self._require_model()
        prediction = model.predict(features)[0]
        return self._prediction_to_label(prediction)

    def batch_predict(self, sequences: List[str]) -> List[Literal["Virus", "Host"]]:
        features = self._preprocess_batch(sequences)
        model = self._require_model()
        predictions = model.predict(features)
        return [self._prediction_to_label(pred) for pred in predictions]

    def predict_probabilities(
        self, sequence: str
    ) -> Dict[Literal["Host", "Virus"], float]:
        features = self._preprocess(sequence)
        return self._probability_mapping_for_features(features)

    def batch_predict_probabilities(
        self, sequences: List[str]
    ) -> List[Dict[Literal["Host", "Virus"], float]]:
        features = self._preprocess_batch(sequences)
        return self._batch_probability_mappings_for_features(features)

    def predict_with_confidence(
        self, sequence: str
    ) -> Tuple[Literal["Virus", "Host"], float]:
        features = self._preprocess(sequence)
        model = self._require_model()
        prediction = model.predict(features)[0]
        confidence = self._confidence_for_prediction(features, prediction)
        return self._prediction_to_label(prediction), confidence

    def batch_predict_with_confidence(
        self, sequences: List[str]
    ) -> List[Tuple[Literal["Virus", "Host"], float]]:
        features = self._preprocess_batch(sequences)
        model = self._require_model()
        predictions = model.predict(features)
        confidences = self._batch_confidence_for_predictions(features, predictions)
        return [
            (self._prediction_to_label(prediction), confidence)
            for prediction, confidence in zip(predictions, confidences)
        ]

    def _preprocess(self, sequence: str) -> object:
        if self.model_name == "Evo2":
            return self._preprocess_with_evo2(sequence)

        if self.kmer_tranformer is None or self.vectorizer is None:
            raise RuntimeError(
                f"Model '{self.model_name}' does not have a k-mer preprocessing pipeline"
            )

        kmers = self.kmer_tranformer.transform([sequence])
        return self.vectorizer.transform(kmers)

    def _preprocess_batch(self, sequences: List[str]) -> object:
        if self.model_name == "Evo2":
            if self.evo2_embedder is None:
                raise RuntimeError("Evo 2 embedder is not available")

            embeddings = self.evo2_embedder.get_embeddings_batch(sequences)
            if embeddings is None:
                raise RuntimeError("Evo 2 batch embedding generation failed")
            return embeddings

        if self.kmer_tranformer is None or self.vectorizer is None:
            raise RuntimeError(
                f"Model '{self.model_name}' does not have a k-mer preprocessing pipeline"
            )

        kmers = self.kmer_tranformer.transform(sequences)
        return self.vectorizer.transform(kmers)

    def _prediction_to_label(self, prediction: Any) -> Literal["Virus", "Host"]:
        if isinstance(prediction, str):
            normalized = prediction.strip().lower()
            if normalized == "virus":
                return "Virus"
            if normalized == "host":
                return "Host"

        pred_int = int(prediction)
        if pred_int not in LABEL_MAP:
            raise ValueError(
                f"Model predicted unexpected class '{prediction}'. Supported labels are {tuple(LABEL_MAP)}"
            )
        return LABEL_MAP[pred_int]  # type: ignore[return-value]

    def _confidence_for_prediction(self, features: object, prediction: Any) -> float:
        model = self._require_model()
        if not hasattr(model, "predict_proba"):
            return 1.0

        proba = model.predict_proba(features)[0]
        return self._extract_predicted_class_confidence(
            prediction=prediction,
            classes=getattr(model, "classes_", []),
            probabilities=proba,
        )

    def _batch_confidence_for_predictions(
        self, features: object, predictions: Sequence[Any]
    ) -> List[float]:
        model = self._require_model()
        if not hasattr(model, "predict_proba"):
            return [1.0] * len(predictions)

        all_proba = model.predict_proba(features)
        model_classes = getattr(model, "classes_", [])
        return [
            self._extract_predicted_class_confidence(
                prediction=prediction,
                classes=model_classes,
                probabilities=proba,
            )
            for prediction, proba in zip(predictions, all_proba)
        ]

    def _extract_predicted_class_confidence(
        self, prediction: Any, classes: Sequence[Any], probabilities: Sequence[float]
    ) -> float:
        # Return the maximum probability from model
        return max(probabilities)

    def _probability_mapping_for_features(
        self, features: object
    ) -> Dict[Literal["Host", "Virus"], float]:
        model = self._require_model()
        if not hasattr(model, "predict_proba"):
            raise ValueError(
                f"Model '{self.model_name}' does not expose predict_proba and cannot return probabilities"
            )

        probabilities = model.predict_proba(features)[0]
        predicted_label = self._prediction_to_label(model.predict(features)[0])
        return self._map_probabilities_to_labels(
            classes=getattr(model, "classes_", []),
            probabilities=probabilities,
            predicted_label=predicted_label,
        )

    def _batch_probability_mappings_for_features(
        self, features: object
    ) -> List[Dict[Literal["Host", "Virus"], float]]:
        model = self._require_model()
        if not hasattr(model, "predict_proba"):
            raise ValueError(
                f"Model '{self.model_name}' does not expose predict_proba and cannot return probabilities"
            )

        probabilities = model.predict_proba(features)
        model_classes = getattr(model, "classes_", [])
        predictions = model.predict(features)
        return [
            self._map_probabilities_to_labels(
                classes=model_classes,
                probabilities=row_probabilities,
                predicted_label=self._prediction_to_label(prediction),
            )
            for prediction, row_probabilities in zip(predictions, probabilities)
        ]

    def _map_probabilities_to_labels(
        self,
        classes: Sequence[Any],
        probabilities: Sequence[float],
        predicted_label: Literal["Host", "Virus"] | None = None,
    ) -> Dict[Literal["Host", "Virus"], float]:
        if len(classes) != len(probabilities):
            raise ValueError(
                "Model class metadata does not align with the returned probability vector"
            )

        probability_map: Dict[Literal["Host", "Virus"], float] = {
            "Host": 0.0,
            "Virus": 0.0,
        }
        for model_class, probability in zip(classes, probabilities):
            label = self._prediction_to_label(model_class)
            probability_map[label] = float(probability)

        if predicted_label is not None:
            most_likely_label = max(
                probability_map, key=lambda label: probability_map[label]
            )
            if most_likely_label != predicted_label:
                probability_map = {
                    "Host": probability_map["Virus"],
                    "Virus": probability_map["Host"],
                }

        return probability_map


if __name__ == "__main__":
    predict_class = PredictClass(model_name="SVM")
    print(
        predict_class.predict(
            "TAATATTACTGGTTTCGCTGTGGGCCCCACACGGGGCCCCCGACAAATAAAAAAGCGAATAACGCGTTGTCGGTTACTTTTGACCACTTTAAGTGCTTTTGATTGCGTGTTTGACACGTCACAATATTCTATATAAACAGCAGGATCTGAATGTTATGGAACATGTCATTGGGAAGCGTGTTTATGGAATATTGTGCTGCTTGGATATTTTGGTGGCAAAATATTGTTTTAATATTCTTATTTACCATTTTATTTTGGATAAATGGAAAGTCGTTTATACTTGCTAGAGGAATTGCCCGCAACGTACGGGAAATTACAGGGCTTTTGTACGGATCTGTTCTTAGCGGAACAGATTCGGAAGGCCTCCGAGTTAAAGATGTTCAAAGAGGCCCAAATGTACATGGTCCTCAGACAGGCCTTCAGACGATCACAGAGGAATAAGGCCCCATGGCCTTCAAAGGTGGCCCAATTCAATATGGACTTGGCACTTACTATAAGTAGGGCCAAGCAGATATCGGAGGAGGCCCAATTGTTAGTTGATTACAAAAAAAAAATTGAAGATGGTTCGCACGAGATCCGGGAGAACGTATGGATCGGCCCAGGCCCTTTCTTGGGGTCGGAAGAGGGCGAGAACGACAGTTCGCTCTCGACCAACACTACTTGGGCCGATTCGGAGGCCCAGTTATCAAGTGAAGACCCGATATGCTCCTCATAGACCTCAGACTAAGATTCATTCGCTCGCTAACACTAGAGTTGTTAGTGGGGCGAACGAGGGCTACGGATGGCATGTATCGGGAGTACCTATTGGTTCTGGGTTTGAAGATAGACATAGTGATAAGATTAAAATTAATTCTTTAAATTTTAAGATGCAGATGATGACATCAGATGCTGGGACCCAAACGACTCTTTGGCACAATGTGTATATGTTTTTAGTAAAAGATAATTCTGGTGGAGCACAAGTCCCAAAATTCAATTCAATATGTATGATGGATAATTCAAACCCGGCAACTGCTGAAATAGACCACGATTCAAAGGATCGTTTTCAGATAATTCGAAGGTGGAGATTTCAATTCAAAGGAAACTCCACGAGGAATGGAGTTGCTTATGATTGTGCAAAAAATAGACATGATTTTAGGGCTAACGTCAAATTAAATTCAATTAGTGAATTTAAGTCTGCGACTGATGGGTCATATGCAAATACCCAGAAGAACGCATACACTATGTATTTCGTACCCCAGACTTATGATATGGTCGTAGACGGTCATTGTACAATGAAATATACGTCAATAGTTTGACCGAAGATACTTACGAAATATTGTTGTGGGAAAATCATTATTTTTATGAATGAATTAAAGGCCGAAGGCCGTGAACAATTGTAAATTGTAATAAATATTGATCAATAAATATTTATCAATAAAATTTATCATTAATACAAACATGGATTACATTTAATTCACTCCATTCATACATATCACTACTAGACAGAGCAGTCTTATAAGACTGATCTGGATTACATAATACAATTGTTGGGATCCCCCCAGGCACTCTAGTTTTTTTACGGTATTTTTCATTAACCGTAAAATCTCTTTGAGATCCTAACAATTCTTTTTTACAAGGTAAAAACTGAAAAGGGATATCATCTATTACATTATAAGACGCGTGATTATCCCAAAAACTAAAATCTACACCCCCACAAAAGTAGTTATGACGCCCTAGACTTCTCGCCCACGCAGTTTTCCCAGTTTTACTGGGTCCTTCAATGATTAATGTCAGTGGGCGATCCGGTTTCTGGTCCTGCATCATCAATAACATTAATATTATTAATATTATAAGCATCGTTGATTTGATCTGCAGTAAGATCTTGTGCCCAGATCAAATCATCTATAGAAATAGACGGTTCAGTTAACTGGACCGCGAAGAGACTTACGGTGAAGATGTTCTCATCTGCCCATTGTTTAATGGACTCCGGTACGCTAGGAAAATGCGTCCATCTGGGTTGATACACAGTTGGGGGTTCAGGCCATTCTCTACTGGCCATGTACTCCAGGTTACGCAACTGGGTTGCGTACGTGTACGGTTGTTCAGTTCTACATCTGGAGAGGAATTCGGACTTGGATGTAGACTCCGTGAGGATTGTTGTCCAGATGGAATCCCTAGACTTCTTAGGACTTCTTCTTGAAGCTCTAAGTAATCCTCGTTCCTCAAATACCCCTCCCTTGGAGATGTAGTCGGCGACATCTGCATCCCTTCGGGGAATCTGGGTATTTGGGTGATAGGTTGAGAGGCCATTTGGGTCCTTGATGTCGAAGAACCTCGGATCCTTGATGTCAATCTTCTTGTCCATCTGGACAAGACAGTGGAGGTGCGGCTCTCCTGATTGGTGTTCCTCCCTGCAGACTCTTGCGTAAGTAGGATCCCAGTTCTTTAATAATTGATAGAGGTAATCGATTAAAAACATTGGGATTAAAGGGCACTGCGGGTAAGTTAAAAAAATAGACTTACCCTGAAGTCTGAAGTTTGAAGCACGTCTAGGCATGTTGACCAGAAGTCAAGGGGAATGAAAAATGCGTTTTAGAGAGGGTTTTCTCAAACTTCTTTCTCTACTATGGTTTTGCGGAGGAACGGAGGAACGGAGGATATAATATAATAATAGAGGACCGTTAGATGAATGACACGTTTCATTCCATCCTACGGTCCACGCGCCATAGCGCGTGGAATGTCGGCCGGCTTTTCAGCGAAACCATA"
        )
    )
