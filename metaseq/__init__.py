"""
BAIO: LLM-Based Taxonomy Profiling & Open-Set Pathogen Detection

Core library for metagenomic sequence analysis using foundation models.
"""

__version__ = "0.1.0"
__author__ = "BAIO Development Team"

from . import dataio
from . import evo2_embed
from . import models
from . import ood
from . import agg
from . import cluster
from . import viz

__all__ = [
    "dataio",
    "evo2_embed", 
    "models",
    "ood",
    "agg",
    "cluster",
    "viz"
]
