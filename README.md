# BAIO: DNA Sequence Classification & Open-Set Pathogen Detection

BAIO (Bioinformatics AI for Open-set detection) is a web-based metagenomic analysis platform that classifies DNA sequences using machine learning. It distinguishes between viral (e.g., COVID-19) and host genomic sequences, with optional open-set detection for identifying novel pathogens.

---

## Features

- **Sequence Classification**: Classifies DNA sequences into Virus or Host categories
- **K-mer Analysis**: Uses 6-mer frequency features for sequence representation
- **Confidence Visualization**: Color-coded confidence bars for each prediction
- **GC Content Analysis**: Heatmap showing GC content distribution
- **Risk Assessment**: Color-coded risk level indicators (Low/Moderate/High)
- **Explainable AI**: Per-sequence explanations with probability distributions and feature importance
- **Dark Mode**: Toggle between light and dark themes
- **Export Options**: Download results as JSON, CSV, or PDF
- **AI Assistant**: Gemini-powered chat for sequence analysis questions
- **Open-Set Detection**: Flags sequences that don't fit known classes (optional)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python 3.12 |
| ML | PyTorch + Scikit-learn (RandomForest) |
| AI | Google Gemini API |
| DevOps | Docker, GitHub Actions, pytest |

---

## Project Structure

```
baio/
│
├── api/                          # FastAPI backend
│   ├── main.py                   # API endpoints (classify, chat, health)
│   ├── llm_client.py             # Google Gemini AI client
│   └── Dockerfile                # Docker container config
│
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx        # App header with model version
│   │   │   ├── SequenceInput.tsx # FASTA input form
│   │   │   ├── ConfigPanel.tsx  # Classification settings
│   │   │   ├── ResultsDashboard.tsx  # Results table & visualizations
│   │   │   └── ChatWidget.tsx   # AI assistant chat
│   │   ├── App.tsx              # Main application component
│   │   ├── App.css               # Global styles
│   │   ├── api.ts               # API client functions
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── index.css            # Tailwind imports
│   │   └── main.tsx             # React entry point
│   ├── public/                  # Static assets
│   ├── package.json             # Node.js dependencies
│   ├── tailwind.config.js       # Tailwind configuration
│   ├── vite.config.ts           # Vite configuration
│   └── Dockerfile               # Docker container config
│
├── binary_classifiers/           # ML classification core
│   ├── predict_class.py         # Classification logic & LABEL_MAP
│   ├── retrain_model.py        # Model retraining script
│   ├── train_model.py           # Training utilities
│   ├── models/                  # Saved model files (*.pkl)
│   ├── training_scripts/        # Model training code
│   ├── data_extraction_scripts/ # Data processing for training
│   ├── feature_extraction_scripts/ # K-mer extraction
│   ├── evaluation_visualizations/ # Model evaluation plots
│   └── evo2_embeddings_scripts/  # Legacy Evo2 embedding code
│
├── metaseq/                     # Core metagenomics library
│   ├── __init__.py
│   ├── dataio.py               # FASTA/FASTQ loaders
│   ├── evo2_client.py         # Evo2 embedding client
│   ├── models.py              # Model definitions
│   ├── inference.py           # Inference logic
│   ├── train.py               # Training script
│   └── types.py               # Type definitions
│
├── prompting/                  # LLM prompting utilities
│   ├── __init__.py
│   ├── base.py                # Base prompt classes
│   ├── client.py              # Prompt client
│   ├── compare.py             # Prompt comparison
│   ├── techniques.py         # Prompting techniques
│   ├── schemas.py             # Response schemas
│   ├── types.py               # Type definitions
│   └── logging.py             # Logging utilities
│
├── data_processing/           # Data processing utilities
│
├── configs/
│   └── binary_classifier.yaml # Model configuration
│
├── scripts/
│   ├── collect_metrics.py    # Metrics collection
│   └── prompt_compare.py     # Prompt comparison script
│
├── tests/                     # Unit & integration tests
│   ├── conftest.py           # Pytest configuration
│   ├── test_api_classification.py
│   ├── test_data_processing.py
│   ├── test_dataio.py
│   ├── test_inference.py
│   ├── test_integration_pipeline.py
│   ├── test_models.py
│   ├── test_prompting_*.py   # Various prompting tests
│
├── docs/                      # Documentation
│   ├── Technical documentation BAIO.md
│   ├── FASTQ format specification document.md
│   ├── metrics/              # Evaluation metrics
│   └── retro_artifacts/      # Legacy documentation
│
├── data/                      # Sample data
│   ├── covid_reads5.fasta    # Sample COVID sequences
│   └── human_reads5.fasta   # Sample human sequences
│
├── weights/                   # Trained model weights (git-ignored)
│
├── examples/                  # Demo files
│
├── runs/                      # Output directories
│
├── .env                       # Environment variables (API keys)
├── .env.example              # Environment template
│
├── environment.yml           # Conda environment config
├── requirements.txt         # Python pip dependencies
├── pyproject.toml           # Project metadata & tool config
├── docker-compose.yml       # Docker Compose config
├── package-lock.json        # npm lock file
│
├── classify_cli.py          # CLI classification tool
├── predict_class.py         # Standalone prediction script
├── retrain_model.py        # Model retraining script
│
├── .github/                  # GitHub Actions workflows
├── .gitignore
├── .pre-commit-config.yaml  # Pre-commit hooks
├── SECURITY.md
└── README.md
```

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.10+ (3.12 recommended) | Required for backend |
| Node.js | 18+ | Required for frontend |
| Git | Any recent version | For cloning |
| Conda | Optional | Recommended for Python env |
| Docker | Optional | For containerized deployment |

---

## Dependencies

### Python Dependencies (Backend)

**Core:**
- python-dotenv>=1.0
- numpy>=2.2
- pandas>=2.2
- scikit-learn>=1.5
- matplotlib>=3.9
- seaborn>=0.13
- plotly>=5.20
- tqdm>=4.67
- pyyaml>=6.0
- requests>=2.32

**Bioinformatics:**
- biopython>=1.85
- hdbscan>=0.8.39
- umap-learn==0.5.7

**ML/AI:**
- torch>=2.8.0
- transformers==4.56.1
- tokenizers==0.22.0
- accelerate>=0.30
- datasets>=2.19
- joblib>=1.3

**API:**
- fastapi>=0.115.0
- uvicorn

**Testing/Dev:**
- pytest
- pytest-cov
- black
- flake8
- mypy

### Node.js Dependencies (Frontend)

**Dependencies:**
- react^18.3.1
- react-dom^18.3.1
- lucide-react^0.562.0
- clsx^2.1.1
- tailwind-merge^3.4.0
- jspdf^4.2.0

**Dev Dependencies:**
- vite^6.0.5
- typescript^5.7.3
- tailwindcss^3.4.17
- postcss^8.4.49
- autoprefixer^10.4.20
- eslint^9.17.0
- @vitejs/plugin-react^4.3.3

---

## Installation

### Option 1: Conda (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/oss-slu/baio.git
cd baio

# 2. Create conda environment
conda env create -f environment.yml
conda activate baio

# 3. Verify installation
python --version
conda list | head -20
```

### Option 2: Virtual Environment

```bash
# 1. Clone the repository
git clone https://github.com/oss-slu/baio.git
cd baio

# 2. Create virtual environment
python3 -m venv baio-env

# 3. Activate
# macOS/Linux:
source baio-env/bin/activate
# Windows:
baio-env\Scripts\activate

# 4. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install fastapi uvicorn

# 5. Verify
python --version
pip list
```

### Option 3: Docker

```bash
# Build and run
docker compose up --build
```

---

## Environment Setup

### 1. Create .env File

Create a `.env` file in the project root:

```bash
# .env
GOOGLE_API_KEY=your_google_api_key_here
```

### 2. Get Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env` file

---

## Running the Project

### Development Mode (Recommended)

**Terminal 1 - Backend:**

```bash
# Activate environment
conda activate baio
# OR (venv):
source baio-env/bin/activate

# Start FastAPI server
python -m uvicorn api.main:app --reload --port 8080
```

**Terminal 2 - Frontend:**

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- API: http://localhost:8080
- API Docs: http://localhost:8080/docs

### Production Mode (Docker)

```bash
# Build and start
docker compose up --build

# Or run in background
docker compose up -d --build
```

**Access:**
- Frontend: http://localhost:4173
- API: http://localhost:8080

---

## Usage Guide

1. **Open Browser**: Navigate to http://localhost:5173

2. **Enter Sequences**:
   - Paste DNA sequences directly, OR
   - Upload a FASTA file

3. **Configure Settings** (optional):
   - Confidence threshold (default: 0.5)
   - Enable/disable open-set detection
   - Select model type

4. **Classify**: Click "Classify Sequences"

5. **View Results**:
   - Classification (Virus/Host)
   - Confidence bars
   - Risk indicators (Low/Moderate/High)
   - GC content

6. **Expand Row**: Click any row to see:
   - Probability distribution
   - Feature importance (top k-mers)
   - Decision path

7. **Export**: Download as JSON, CSV, or PDF

8. **AI Assistant**: Use the chat widget to ask questions about your sequences

---

## Testing

```bash
# Activate environment first
conda activate baio

# Run all tests
pytest tests/

# Run specific test
pytest tests/test_api_classification.py

# With coverage
pytest --cov=. tests/
```

---

## Code Quality

```bash
# Format code
black .

# Lint
ruff check .

# Type check
mypy .

# All at once
black . && ruff check . && mypy .
```

---

## Model Training

If you need to retrain the model:

```bash
python retrain_model.py
```

This will:
1. Load training data from `data/`
2. Extract k-mer features
3. Train RandomForest classifier
4. Save model to `binary_classifiers/models/`

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `python` command not found | Python not in PATH | Use `python3` |
| Port 8080 in use | Another process | `lsof -i :8080` then `kill -9 <PID>` |
| ModuleNotFoundError | Environment not activated | `conda activate baio` |
| npm install fails | Node version | Upgrade to Node.js 18+ |
| Gemini API error | Invalid API key | Check `.env` file |
| Model returns "Novel" | Bug in LABEL_MAP | Run `python retrain_model.py` |
| Docker build fails | Cache issue | `docker system prune -a` |
| Conda env fails | Conflict | Use `mamba env create -f environment.yml` |

---

## Project URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |
| API Docs | http://localhost:8080/docs |
| Health Check | http://localhost:8080/health |

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Contributors

- **Mainuddin** - Tech Lead
- **Luis Palmejar** - Developer
- **Kevin Yang** - Developer

---

**Note**: This is a research prototype. For production use in clinical settings, additional validation and regulatory approval may be required.
