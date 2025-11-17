from typing import List, Any, Dict
from sklearn.base import BaseEstimator, TransformerMixin  # type: ignore[import-untyped]
from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore[import-untyped]
from sklearn.pipeline import Pipeline  # type: ignore[import-untyped]
from sklearn.svm import SVC  # type: ignore[import-untyped]
from sklearn.ensemble import RandomForestClassifier  # type: ignore[import-untyped]
from sklearn.neural_network import MLPClassifier  # type: ignore[import-untyped]
import joblib  # type: ignore[import-untyped]


class KmerTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, k: int = 6) -> None:
        self.k = k

    def fit(self, X: Any, y: Any = None) -> "KmerTransformer":
        return self

    def transform(self, X: List[str]) -> List[str]:
        return [self._kmers(s) for s in X]

    def _kmers(self, seq: str) -> str:
        s = seq.upper().replace("N", "")
        k = self.k
        if len(s) < k:
            return ""
        return " ".join(s[i : i + k] for i in range(len(s) - k + 1))


def build_pipeline(model_name: str, params: Dict[str, Any] | None = None) -> Pipeline:
    params = params or {}
    k = int(params.get("k", 6))
    vectorizer = TfidfVectorizer(analyzer="word", token_pattern=r"\S+", lowercase=False)

    if model_name.lower() in ["svm", "svc"]:
        clf = SVC(probability=True, **{k: v for k, v in params.items() if k != "k"})
    elif model_name.lower() in ["rf", "randomforest", "random_forest"]:
        clf = RandomForestClassifier(**{k: v for k, v in params.items() if k != "k"})
    elif model_name.lower() in ["mlp", "mlpclassifier"]:
        clf = MLPClassifier(**{k: v for k, v in params.items() if k != "k"})
    else:
        raise ValueError(f"Unknown model: {model_name}")

    pipe = Pipeline(
        [
            ("kmers", KmerTransformer(k=k)),
            ("tfidf", vectorizer),
            ("clf", clf),
        ]
    )
    return pipe


def save_model(model: Pipeline, path: str) -> None:
    joblib.dump(model, path)


def load_model(path: str) -> Pipeline:
    return joblib.load(path)
