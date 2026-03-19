from __future__ import annotations

import pandas as pd

from binary_classifiers.transformers.kmers_transformer import KmerTransformer


def test_kmer_transformer_handles_series_and_fit_returns_self() -> None:
    transformer = KmerTransformer(k=3)

    assert transformer.fit(["ATGC"]) is transformer

    result = transformer.transform(pd.Series(["ATGN"]))

    assert result.tolist() == ["ATG"]
