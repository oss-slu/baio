from metaseq.models import build_pipeline

TOY_X = [
    "ACGTACGTACGT",
    "TTTTTTTTTTTT",
    "ACACACACACAC",
    "GGGGGGGGGGGG",
]
TOY_Y = [1, 0, 1, 0]


def _fit_and_predict(name: str):
    model = build_pipeline(name, {"k": 3})
    model.fit(TOY_X, TOY_Y)
    preds = model.predict(TOY_X)
    assert len(preds) == len(TOY_X)
    return preds


def test_svm_pipeline():
    _fit_and_predict("svm")


def test_rf_pipeline():
    _fit_and_predict("rf")


def test_mlp_pipeline():
    _fit_and_predict("mlp")
