from metaseq.models import build_pipeline, save_model
from metaseq.inference import ClassifierInference


def test_inference_predict(tmp_path):
    X = ["ACGTACGT", "TTTTTTTT", "ACACACAC"]
    y = [1, 0, 1]
    pipe = build_pipeline("svm", {"k": 3, "C": 1.0, "kernel": "linear"})
    pipe.fit(X, y)

    model_path = tmp_path / "model.joblib"
    save_model(pipe, str(model_path))

    inf = ClassifierInference(str(model_path))
    preds = inf.predict(["ACGTACGT", "TTTTTTTT"])  # expect ints
    assert isinstance(preds[0], int) and isinstance(preds[1], int)


def test_inference_predict_file(tmp_path):
    # Train and save model
    X = ["AAAAAAAATTTT", "GGGGGGGGCCCC"]
    y = [0, 1]
    pipe = build_pipeline("rf", {"k": 3, "n_estimators": 10, "random_state": 0})
    pipe.fit(X, y)
    model_path = tmp_path / "rf.joblib"
    save_model(pipe, str(model_path))

    # Create a small FASTA file
    fasta = ">a\nAAAAAAAATTTT\n>b\nGGGGGGGGCCCC\n"
    fpath = tmp_path / "toy.fasta"
    fpath.write_text(fasta)

    inf = ClassifierInference(str(model_path))
    preds = inf.predict_file(str(fpath))
    assert len(preds) == 2
