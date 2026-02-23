from pathlib import Path
from typing import Any, List, Literal, Sequence, Tuple

import joblib  # type: ignore[import-untyped] # noqa: E402

try:
    from baio_transformers.kmers_transformer import (  # type: ignore[import-not-found]
        KmerTransformer,
    )  # noqa: E402
except ModuleNotFoundError:
    from binary_classifiers.transformers.kmers_transformer import (  # noqa: E402
        KmerTransformer,
    )


LABEL_MAP = {0: "Host", 1: "Virus"}
MODEL_FILE_MAP = {
    "RandomForest": ("random_forest_best_model.pkl", "random_forest_vectorizer.pkl"),
    "SVM": (
        "support_vector_machine_best_model.pkl",
        "support_vector_machine_vectorizer.pkl",
    ),
}


class PredictClass:
    def __init__(
        self, model_name: Literal["RandomForest", "SVM"] = "RandomForest"
    ) -> None:
        """Initialize the predictor class."""

        self.model_name = model_name
        if self.model_name not in MODEL_FILE_MAP:
            raise ValueError(
                f"Unsupported model_name '{self.model_name}'. Expected one of: {tuple(MODEL_FILE_MAP)}"
            )

        base_dir = Path(__file__).resolve().parent
        model_file, vectorizer_file = MODEL_FILE_MAP[self.model_name]
        self.model = joblib.load(base_dir / "models" / model_file)
        self.vectorizer = joblib.load(base_dir / "transformers" / vectorizer_file)

        self.kmer_tranformer = KmerTransformer()

    def predict(self, sequence: str) -> Literal["Virus", "Host"]:
        features = self._preprocess(sequence)
        prediction = self.model.predict(features)[0]
        return self._prediction_to_label(prediction)

    def batch_predict(self, sequences: List[str]) -> List[Literal["Virus", "Host"]]:
        features = self._preprocess_batch(sequences)
        predictions = self.model.predict(features)
        return [self._prediction_to_label(pred) for pred in predictions]

    def predict_with_confidence(
        self, sequence: str
    ) -> Tuple[Literal["Virus", "Host"], float]:
        features = self._preprocess(sequence)
        prediction = self.model.predict(features)[0]
        proba = self.model.predict_proba(features)[0]
        print(
            f"DEBUG predict_class: prediction={prediction}, proba={proba}", flush=True
        )
        confidence = self._confidence_for_prediction(features, prediction)
        print(f"DEBUG predict_class: final confidence={confidence}", flush=True)
        return self._prediction_to_label(prediction), confidence

    def batch_predict_with_confidence(
        self, sequences: List[str]
    ) -> List[Tuple[Literal["Virus", "Host"], float]]:
        features = self._preprocess_batch(sequences)
        predictions = self.model.predict(features)
        confidences = self._batch_confidence_for_predictions(features, predictions)
        return [
            (self._prediction_to_label(prediction), confidence)
            for prediction, confidence in zip(predictions, confidences)
        ]

    def _preprocess(self, sequence: str) -> object:
        kmers = self.kmer_tranformer.transform([sequence])
        features = self.vectorizer.transform(kmers)
        return features

    def _preprocess_batch(self, sequences: List[str]) -> object:
        kmers = self.kmer_tranformer.transform(sequences)
        features = self.vectorizer.transform(kmers)
        return features

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
        if not hasattr(self.model, "predict_proba"):
            return 1.0

        proba = self.model.predict_proba(features)[0]
        return self._extract_predicted_class_confidence(
            prediction=prediction,
            classes=getattr(self.model, "classes_", []),
            probabilities=proba,
        )

    def _batch_confidence_for_predictions(
        self, features: object, predictions: Sequence[Any]
    ) -> List[float]:
        if not hasattr(self.model, "predict_proba"):
            return [1.0] * len(predictions)

        all_proba = self.model.predict_proba(features)
        model_classes = getattr(self.model, "classes_", [])
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
        if len(classes) == len(probabilities):
            class_to_prob = {
                cls: float(prob) for cls, prob in zip(classes, probabilities)
            }
            if prediction in class_to_prob:
                return class_to_prob[prediction]

        return float(max(probabilities))


if __name__ == "__main__":
    predict_class = PredictClass(model_name="SVM")
    print(
        predict_class.predict(
            "TAATATTACTGGTTTCGCTGTGGGCCCCACACGGGGCCCCCGACAAATAAAAAAGCGAATAACGCGTTGTCGGTTACTTTTGACCACTTTAAGTGCTTTTGATTGCGTGTTTGACACGTCACAATATTCTATATAAACAGCAGGATCTGAATGTTATGGAACATGTCATTGGGAAGCGTGTTTATGGAATATTGTGCTGCTTGGATATTTTGGTGGCAAAATATTGTTTTAATATTCTTATTTACCATTTTATTTTGGATAAATGGAAAGTCGTTTATACTTGCTAGAGGAATTGCCCGCAACGTACGGGAAATTACAGGGCTTTTGTACGGATCTGTTCTTAGCGGAACAGATTCGGAAGGCCTCCGAGTTAAAGATGTTCAAAGAGGCCCAAATGTACATGGTCCTCAGACAGGCCTTCAGACGATCACAGAGGAATAAGGCCCCATGGCCTTCAAAGGTGGCCCAATTCAATATGGACTTGGCACTTACTATAAGTAGGGCCAAGCAGATATCGGAGGAGGCCCAATTGTTAGTTGATTACAAAAAAAAAATTGAAGATGGTTCGCACGAGATCCGGGAGAACGTATGGATCGGCCCAGGCCCTTTCTTGGGGTCGGAAGAGGGCGAGAACGACAGTTCGCTCTCGACCAACACTACTTGGGCCGATTCGGAGGCCCAGTTATCAAGTGAAGACCCGATATGCTCCTCATAGACCTCAGACTAAGATTCATTCGCTCGCTAACACTAGAGTTGTTAGTGGGGCGAACGAGGGCTACGGATGGCATGTATCGGGAGTACCTATTGGTTCTGGGTTTGAAGATAGACATAGTGATAAGATTAAAATTAATTCTTTAAATTTTAAGATGCAGATGATGACATCAGATGCTGGGACCCAAACGACTCTTTGGCACAATGTGTATATGTTTTTAGTAAAAGATAATTCTGGTGGAGCACAAGTCCCAAAATTCAATTCAATATGTATGATGGATAATTCAAACCCGGCAACTGCTGAAATAGACCACGATTCAAAGGATCGTTTTCAGATAATTCGAAGGTGGAGATTTCAATTCAAAGGAAACTCCACGAGGAATGGAGTTGCTTATGATTGTGCAAAAAATAGACATGATTTTAGGGCTAACGTCAAATTAAATTCAATTAGTGAATTTAAGTCTGCGACTGATGGGTCATATGCAAATACCCAGAAGAACGCATACACTATGTATTTCGTACCCCAGACTTATGATATGGTCGTAGACGGTCATTGTACAATGAAATATACGTCAATAGTTTGACCGAAGATACTTACGAAATATTGTTGTGGGAAAATCATTATTTTTATGAATGAATTAAAGGCCGAAGGCCGTGAACAATTGTAAATTGTAATAAATATTGATCAATAAATATTTATCAATAAAATTTATCATTAATACAAACATGGATTACATTTAATTCACTCCATTCATACATATCACTACTAGACAGAGCAGTCTTATAAGACTGATCTGGATTACATAATACAATTGTTGGGATCCCCCCAGGCACTCTAGTTTTTTTACGGTATTTTTCATTAACCGTAAAATCTCTTTGAGATCCTAACAATTCTTTTTTACAAGGTAAAAACTGAAAAGGGATATCATCTATTACATTATAAGACGCGTGATTATCCCAAAAACTAAAATCTACACCCCCACAAAAGTAGTTATGACGCCCTAGACTTCTCGCCCACGCAGTTTTCCCAGTTTTACTGGGTCCTTCAATGATTAATGTCAGTGGGCGATCCGGTTTCTGGTCCTGCATCATCAATAACATTAATATTATTAATATTATAAGCATCGTTGATTTGATCTGCAGTAAGATCTTGTGCCCAGATCAAATCATCTATAGAAATAGACGGTTCAGTTAACTGGACCGCGAAGAGACTTACGGTGAAGATGTTCTCATCTGCCCATTGTTTAATGGACTCCGGTACGCTAGGAAAATGCGTCCATCTGGGTTGATACACAGTTGGGGGTTCAGGCCATTCTCTACTGGCCATGTACTCCAGGTTACGCAACTGGGTTGCGTACGTGTACGGTTGTTCAGTTCTACATCTGGAGAGGAATTCGGACTTGGATGTAGACTCCGTGAGGATTGTTGTCCAGATGGAATCCCTAGACTTCTTAGGACTTCTTCTTGAAGCTCTAAGTAATCCTCGTTCCTCAAATACCCCTCCCTTGGAGATGTAGTCGGCGACATCTGCATCCCTTCGGGGAATCTGGGTATTTGGGTGATAGGTTGAGAGGCCATTTGGGTCCTTGATGTCGAAGAACCTCGGATCCTTGATGTCAATCTTCTTGTCCATCTGGACAAGACAGTGGAGGTGCGGCTCTCCTGATTGGTGTTCCTCCCTGCAGACTCTTGCGTAAGTAGGATCCCAGTTCTTTAATAATTGATAGAGGTAATCGATTAAAAACATTGGGATTAAAGGGCACTGCGGGTAAGTTAAAAAAATAGACTTACCCTGAAGTCTGAAGTTTGAAGCACGTCTAGGCATGTTGACCAGAAGTCAAGGGGAATGAAAAATGCGTTTTAGAGAGGGTTTTCTCAAACTTCTTTCTCTACTATGGTTTTGCGGAGGAACGGAGGAACGGAGGATATAATATAATAATAGAGGACCGTTAGATGAATGACACGTTTCATTCCATCCTACGGTCCACGCGCCATAGCGCGTGGAATGTCGGCCGGCTTTTCAGCGAAACCATA"
        )
    )
