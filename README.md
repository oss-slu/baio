# BAIO: DNA Sequence Classification & Open-Set Pathogen Detection

## Overview

BAIO (Bioinformatics AI for Open-set detection) is a web-based metagenomic analysis platform that classifies DNA sequences using k-mer frequency analysis. It can distinguish between viral (e.g., COVID-19) and host genomic sequences, with optional open-set detection for identifying novel or unknown pathogens.

## Key Features

- **Sequence Classification**: Classifies DNA sequences into Virus or Host categories
- **K-mer Analysis**: Uses 6-mer frequency features for sequence representation
- **Confidence Visualization**: Color-coded confidence bars for each prediction
- **GC Content Analysis**: Heatmap visualization showing GC content distribution
- **Risk Assessment**: Color-coded risk level indicators (Low/Moderate/High)
- **Explainable AI**: Per-sequence explanations with probability distributions, feature importance, and decision paths
- **Dark Mode**: Toggle between light and dark themes
- **Downloadable Reports**: Export results as JSON, CSV, or PDF
- **AI Assistant**: Gemini-powered chat for sequence analysis questions
- **Open-Set Detection** (optional): Flags sequences that don't fit known classes

## Technology Stack

### Frontend
- **React + Vite**: Single-page UI with Tailwind CSS
- **TypeScript**: Type-safe frontend development

### Backend
- **FastAPI**: Python web framework for API endpoints
- **PyTorch + Scikit-learn**: ML model training and inference
- **Google Gemini**: AI assistant integration

### Bioinformatics
- **Biopython**: FASTA/FASTQ parsing
- **NumPy/Pandas**: Data manipulation

### DevOps
- **GitHub Actions**: CI/CD pipeline
- **pytest**: Testing framework
- **Docker Compose**: Containerized deployment

## Project Structure

```
baio/
├── api/                      # FastAPI backend
│   ├── main.py              # API endpoints (classify, chat, health)
│   ├── llm_client.py         # Gemini AI client
│   └── Dockerfile
├── frontend/                 # React + Vite UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx          # Header with model info
│   │   │   ├── SequenceInput.tsx   # FASTA input form
│   │   │   ├── ConfigPanel.tsx     # Classification settings
│   │   │   ├── ResultsDashboard.tsx # Results table & visualizations
│   │   │   └── ChatWidget.tsx      # AI assistant chat
│   │   ├── App.tsx           # Main application
│   │   ├── types.ts          # TypeScript types
│   │   └── api.ts            # API client
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── binary_classifiers/       # ML classification core
│   ├── predict_class.py      # Classification logic
│   ├── retrain_model.py      # Model retraining script
│   ├── train_model.py        # Training utilities
│   ├── models/               # Saved model weights
│   ├── training_scripts/
│   ├── data_extraction_scripts/
│   └── evaluation_visualizations/
├── metaseq/                  # Legacy metagenomics library
│   ├── dataio.py            # FASTA/FASTQ loaders
│   ├── evo2_client.py       # Evo2 embedding client (unused)
│   ├── models.py            # Model definitions
│   ├── inference.py         # Inference logic
│   └── train.py             # Training script
├── prompting/               # LLM prompting utilities
│   ├── client.py            # Prompt client
│   ├── techniques.py        # Prompting techniques
│   └── schemas.py           # Response schemas
├── configs/
│   └── binary_classifier.yaml
├── scripts/
│   └── collect_metrics.py
├── tests/                    # Pytest unit tests
│   ├── test_api_classification.py
│   ├── test_data_processing.py
│   ├── test_inference.py
│   └── test_prompting_*.py
├── docs/                     # Documentation
│   ├── Technical documentation BAIO.md
│   ├── FASTQ format specification document.md
│   └── metrics/             # Evaluation metrics
├── data/                    # Sample data
│   ├── covid_reads5.fasta
│   └── human_reads5.fasta
├── weights/                 # Trained model weights
├── examples/                # Demo files
├── .env                     # API keys (not committed)
├── environment.yml          # Conda environment
├── requirements.txt        # Python dependencies
├── pyproject.toml          # Project metadata
├── docker-compose.yml      # Docker configuration
└── README.md
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js 18+ (for frontend)

### Option 1: Conda Environment
```bash
# Clone the repository
git clone https://github.com/your-org/baio.git
cd baio

# Create and activate conda environment
conda env create -f environment.yml
conda activate baio
```

### Option 2: Python Virtual Environment
```bash
# Navigate to project directory
cd baio

# Create virtual environment
python3 -m venv baio-env

# Activate (macOS/Linux)
source baio-env/bin/activate

# Windows (Command Prompt)
baio-env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### macOS (Apple Silicon / arm64) Setup Notes
If you are using an Apple Silicon Mac (M1 / M2 / M3), we recommend using **Miniforge (arm64)** instead of Anaconda:
```bash
mamba env create -f environment.yml
conda activate baio
```

## Environment Variables

Create a `.env` file in the project root:
```bash
# .env file
GOOGLE_API_KEY=your_google_api_key_here
DEBUG=True
API_PORT=8080
FRONTEND_PORT=5173
```

## Quick Start

### Run FastAPI backend
```bash
python -m uvicorn api.main:app --reload --port 8080
```

### Run React + Vite frontend
```bash
cd frontend
npm install   # first run only
npm run dev -- --host --port 5173
```

Then open http://localhost:5173 to upload sequences, configure settings, view results, and chat with the AI assistant.

## UI Features

### Sequence Input
- Paste DNA sequences directly or upload FASTA files
- Batch processing for multiple sequences

### Classification Results
- **Confidence Visualization**: Color-coded confidence bars
- **GC Content Heatmap**: GC distribution visualization
- **Risk Level Indicators**: Color-coded badges (Low/Moderate/High)
- **Expandable Explanations**: Click each row to see:
  - Probability distribution
  - Feature importance (top k-mers)
  - Decision path analysis

### Model Information
- Display of current model version (e.g., baio-v1.2)

### Dark Mode
- Toggle between light and dark themes

### Export Options
- **JSON**: Raw classification results
- **CSV**: Tabular format for analysis
- **PDF**: Formatted report with visualizations

### AI Assistant
- Gemini-powered chat for sequence analysis questions

## Running with Docker

```bash
docker compose up --build
```

This starts:
- API at http://localhost:8080
- Frontend at http://localhost:4173

## Development

### Running Tests
```bash
pytest tests/
```

### Code Quality
```bash
# Format code
black .

# Lint code
ruff check .

# Type checking
mypy .
```

## Research Applications

BAIO is designed for:
- **Pandemic Preparedness**: Early detection of novel pathogens
- **Metagenomic Surveillance**: Monitoring environmental and clinical samples
- **Pathogen Identification**: Distinguishing viral from host DNA

## Citation

If you use BAIO in your research, please cite:

```bibtex
@software{baio2024,
  title={BAIO: DNA Sequence Classification & Open-Set Pathogen Detection},
  author={Farhan, Tanzim and Hashami, Mustafa and Gujja, Sahana and Burns, Eric and Gaikwad, Manali},
  year={2025},
  url={https://github.com/your-org/baio}
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributors

- **Mainuddin** - Tech Lead
- **Luis Palmejar** - Developer
- **Kevin Yang** - Developer

## Acknowledgments

- Built on k-mer frequency analysis with RandomForest classifier
- Inspired by the need for improved metagenomic surveillance capabilities
- Thanks to the open-source bioinformatics community

## Support

For questions, issues, or contributions, please:
- Open an issue on GitHub
- Contact the development team
- Check our documentation in the `docs/` directory

---

**Note**: This is a research prototype. For production use in clinical settings, additional validation and regulatory approval may be required.
