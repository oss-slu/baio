# BAIO: LLM-Based Taxonomy Profiling & Open-Set Pathogen Detection

## Overview

BAIO (Bioinformatics AI for Open-set detection) is a cutting-edge metagenomic analysis platform that leverages foundation models for DNA sequence analysis. Unlike traditional reference-based pipelines (e.g., Kraken2, MetaPhlAn), BAIO can detect novel and divergent pathogens through open-set recognition methods, making it crucial for pandemic preparedness and surveillance.

## Key Features

- **Taxonomy Profiling**: Classifies sequencing reads or contigs into known classes (viral families, bacterial groups, host)
- **Open-Set Detection**: Flags sequences that don't fit known classes as "novel/unknown"
- **Sample-Level Reporting**: Aggregates read-level predictions into intuitive reports for surveillance
- **Interpretability**: Visualizes embeddings, attention patterns, and clusters of novel reads
- **End-to-End Pipeline**: FASTQ → Evo2 embeddings → classifier + OOD detection → GUI report (JSON + PDF)

## Technology Stack

### Frontend
- **Streamlit**: Simple, fast GUI with support for file upload, plots, and dashboards

### Model Runtime
- **PyTorch + Hugging Face Transformers**: Core ML framework
- **Evo2**: Nucleotide model for embeddings
- **Custom Heads**: MLP for taxonomy classification; OOD scores (Max Softmax, Energy, Mahalanobis)

### Bioinformatics Utilities
- **Biopython**: FASTA/FASTQ parsing
- **HDBSCAN**: Clustering novel reads

### Data Processing
- **NumPy/Pandas**: Embedding manipulation
- **Scikit-learn**: Model calibration and evaluation

### DevOps
- **GitHub Actions**: CI/CD pipeline
- **pytest**: Testing framework
- **Conda/Poetry**: Environment management

## Project Structure

```
metaseq-detector/
├─ app/                     # Streamlit GUI
│   └─ streamlit_app.py
├─ metaseq/                 # Core library
│   ├─ dataio.py            # FASTA/FASTQ loaders, filters
│   ├─ evo2_embed.py        # Evo2 embedding wrapper
│   ├─ models.py            # Classifier heads
│   ├─ ood.py               # MSP/Energy/Mahalanobis
│   ├─ agg.py               # Sample-level aggregation
│   ├─ cluster.py           # HDBSCAN for OOD reads
│   └─ viz.py               # Plots: ROC, UMAP, attention
├─ configs/                 # YAMLs for experiments
├─ notebooks/               # Exploratory notebooks
├─ tests/                   # Pytest unit tests
├─ runs/                    # Saved reports/metrics
├─ weights/                 # Trained classifier heads
├─ examples/                # Demo FASTQ/FASTA
├─ environment.yml
├─ pyproject.toml
└─ docs/
    ├─ weekly_report.md
    ├─ design.md            # System architecture
    └─ dataset_card.md      # Data sources and splits
```

## Installation

### Prerequisites
- Python 3.8+
- CUDA-compatible GPU (recommended for Evo2 model)

### Setup
```bash
# Clone the repository
git clone https://github.com/your-org/baio.git
cd baio

# Create and activate conda environment
conda env create -f environment.yml
conda activate baio

# Or using Poetry
poetry install
```

## Quick Start

### Running the GUI
```bash
# Using conda
conda activate baio
streamlit run app/streamlit_app.py

# Using Poetry
poetry run streamlit run app/streamlit_app.py
```

### Basic Usage
1. Upload your FASTQ/FASTA files through the Streamlit interface
2. Configure analysis parameters (sequence length filters, confidence thresholds)
3. Run the analysis pipeline
4. View results including:
   - Taxonomy classifications
   - Novel sequence detection
   - Embedding visualizations
   - Sample-level reports

## Evaluation Metrics

### Closed-Set Taxonomy
- Accuracy, macro-F1
- Per-class Precision/Recall

### Open-Set Detection
- AUROC, AUPR-Out
- FPR@95%TPR

### Sample-Level Analysis
- OSCR matrix
- Confusion across {Known-Correct, Known-Wrong, Unknown-Correct, Unknown-Wrong}

### Performance
- Reads/second processing rate
- Memory footprint

## Development

### Running Tests
```bash
pytest tests/
```

### Code Quality
```bash
# Format code
black metaseq/ app/

# Lint code
flake8 metaseq/ app/

# Type checking
mypy metaseq/ app/
```

## Contributing

We welcome contributions! Please see our contributing guidelines and code of conduct.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Research Applications

BAIO is designed for:
- **Pandemic Preparedness**: Early detection of novel pathogens
- **Metagenomic Surveillance**: Monitoring environmental and clinical samples
- **Research**: Comparative analysis with traditional methods like Kraken2
- **Clinical Diagnostics**: Supporting pathogen identification in complex samples

## Citation

If you use BAIO in your research, please cite:

```bibtex
@software{baio2024,
  title={BAIO: LLM-Based Taxonomy Profiling & Open-Set Pathogen Detection},
  author={Farhan, Tanzim and Hashami, Mustafa and Gujja, Sahana and Burns, Eric and Gaikwad, Manali},
  year={2024},
  url={https://github.com/your-org/baio}
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributors

- **Tanzim Farhan** - Tech Lead
- **Mustafa Hashami** - Developer
- **Sahana Gujja** - Developer
- **Eric Burns** - Developer
- **Manali Gaikwad** - Developer

## Acknowledgments

- Built on the Evo2 foundation model (Science, 2024)
- Inspired by the need for improved metagenomic surveillance capabilities
- Thanks to the open-source bioinformatics community

## Support

For questions, issues, or contributions, please:
- Open an issue on GitHub
- Contact the development team
- Check our documentation in the `docs/` directory

---

**Note**: This is a research prototype. For production use in clinical settings, additional validation and regulatory approval may be required.