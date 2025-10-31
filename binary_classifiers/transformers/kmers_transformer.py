from typing import Union, List, Any
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin  # type: ignore[import-untyped]


class KmerTransformer(BaseEstimator, TransformerMixin):
    """
    A scikit-learn compatible transformer for converting DNA sequences to k-mers.
    """

    def __init__(self, k: int = 6) -> None:
        self.k = k

    def fit(self, X: Any, y: Any = None) -> "KmerTransformer":
        """Fit method (does nothing, but required for sklearn compatibility)"""
        return self

    def transform(self, X: Union[pd.Series, List[str]]) -> Union[pd.Series, List[str]]:
        """
        Transform sequences to k-mers.

        Parameters:
        -----------
        X : array-like or Series
            DNA sequences to transform

        Returns:
        --------
        Series or list of k-mer strings
        """
        if isinstance(X, pd.Series):
            return X.apply(self._get_kmers)
        else:
            return [self._get_kmers(seq) for seq in X]

    def _get_kmers(self, seq: str) -> str:
        """Convert a single sequence to k-mers"""
        seq = seq.upper().replace("N", "")  # clean ambiguous bases
        return " ".join([seq[i : i + self.k] for i in range(len(seq) - self.k + 1)])
