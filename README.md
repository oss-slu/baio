# BAIO: DNA Sequence Classification & Open-Set Pathogen Detection

BAIO (Bioinformatics AI for Open-set detection) is a web-based metagenomic analysis platform that classifies DNA sequences with machine learning. The current deployed inference path uses 6-mer sequence features with saved scikit-learn SVM and RandomForest models to distinguish viral and host DNA, with an optional novelty flag based on low-confidence predictions.

---

## ⚡ Quick Start (2 Minutes)

### Option A: Docker (Easiest)
```bash
docker compose up
# Frontend: http://localhost:4173
# Backend: http://localhost:8080
```

### Option B: Local Development
```bash
# Terminal 1 - Backend
source .venv/bin/activate
uvicorn api.main:app --reload --port 8080

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
# Frontend: http://localhost:5173
# API: http://localhost:8080
```

⚠️ **First time?** Make sure `.env` has `GOOGLE_API_KEY` set. [Get API Key](https://makersuite.google.com/app/apikey)

---

## Features

- **Sequence Classification**: Classifies DNA sequences into Virus or Host categories
- **K-mer Analysis**: Uses 6-mer frequency features for sequence representation
- **Confidence Visualization**: Color-coded confidence bars for each prediction
- **GC Content Analysis**: Heatmap showing GC content distribution
- **Risk Assessment**: Color-coded risk level indicators (Low/Moderate/High)
- **Sequence Explanations**: Per-sequence summaries based on prediction, confidence, GC content, and organism-name heuristics
- **Dark Mode**: Toggle between light and dark themes
- **Export Options**: Download results as JSON, CSV, or PDF
- **AI Assistant**: Gemini-powered chat for sequence analysis questions
- **Novelty Flagging**: Optional heuristic flag for low-confidence or out-of-distribution-looking sequences

---

## Project Structure

```
baio/
│
├── api/                          # FastAPI backend
│   ├── main.py                   # API endpoints (classify, chat, health)
│   ├── llm_client.py             # Google Gemini AI client
│   └── Dockerfile                 # Docker container config
│
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx        # App header with AI Assistant & model info
│   │   │   ├── SequenceInput.tsx  # FASTA input form
│   │   │   ├── ConfigPanel.tsx    # Classification settings
│   │   │   ├── ResultsDashboard.tsx # Results table & visualizations
│   │   │   └── ChatWidget.tsx     # AI chat widget (legacy)
│   │   ├── App.tsx               # Main application component
│   │   ├── api.ts                # API client functions
│   │   └── types.ts              # TypeScript interfaces
│   ├── package.json              # Node.js dependencies
│   └── tailwind.config.js        # Tailwind configuration
│
├── binary_classifiers/           # ML classification core used by the API
│   ├── predict_class.py          # Loads saved models, predicts labels and probabilities
│   ├── evaluation.py             # Evaluation helpers and metric generation
│   ├── transformers/             # K-mer transformer + saved vectorizers
│   └── models/                   # Saved model files (*.pkl)
│
├── metaseq/                      # Experimental/research ML utilities
│   ├── dataio.py                 # FASTA/FASTQ file loaders
│   ├── models.py                 # Alternative pipeline definitions
│   └── train.py                  # Config-driven training entry point
│
├── prompting/                     # LLM prompting utilities
│
├── tests/                        # Unit tests
│
├── data/                         # Sample FASTA data
│
├── .env                          # API keys (GOOGLE_API_KEY)
│
├── requirements.txt              # Python dependencies
├── environment.yml              # Conda environment
├── docker-compose.yml            # Docker setup
└── README.md                     # This file
```

---

## 🔬 Advanced Features & Workflows

### How The ML Pipeline Works

1. **Validate input DNA**
   The API checks sequence length, allowed nucleotide characters, GC/AT extremes, and ambiguous-base ratio before classification.

2. **Convert sequence to 6-mers**
   Each sequence is split into overlapping substrings of length 6. This turns DNA into a text-like representation the model can vectorize.

3. **Vectorize and classify**
   The saved vectorizer converts 6-mers into numeric features, then a saved SVM or RandomForest predicts `Virus` or `Host`.

4. **Estimate confidence**
   Confidence is derived from model probabilities plus prediction margin and entropy. The frontend shows that confidence directly.

5. **Apply novelty heuristic**
   If novelty mode is enabled, BAIO computes `ood_score = 1 - confidence`. This is a heuristic flag, not a full open-set model such as Mahalanobis distance or energy-based OOD detection.

6. **Generate a human-readable explanation**
   The API adds GC content, organism-name pattern matching, and a short explanation string for the UI.

---

## Evo 2 Integration (Optional)

BAIO supports **Evo 2** - a state-of-the-art DNA language model from Arc Institute for higher accuracy classification.

### Requirements

| Component | Requirement |
|-----------|-------------|
| GPU | NVIDIA GPU with 16GB+ VRAM (7B) or 80GB+ (40B) |
| CUDA | 12.0+ |
| Memory | 32GB+ RAM recommended |

### Hardware Recommendations

| Model Size | VRAM | Use Case |
|------------|------|----------|
| **7B** | 16GB | Single GPU, good accuracy |
| **40B** | 80GB | Maximum accuracy, multi-GPU |

### Enable Evo 2

To use Evo 2 embeddings instead of k-mer features:

1. **Install dependencies:**
   ```bash
   pip install transformers torch
   ```

2. **Check requirements:**
   ```bash
   python binary_classifiers/evo2_embedder.py
   ```

3. **Update frontend settings** - Select "Evo 2" model type in the configuration panel

### How Evo 2 Works

1. **DNA Tokenization**: Converts DNA sequences into tokens
2. **Transformer Processing**: Uses StripedHyena 2 architecture
3. **Contextual Embeddings**: Generates 4096-dimensional embeddings
4. **Classification**: Uses embeddings for Virus/Host classification

### Performance Comparison

| Method | Accuracy | Speed | GPU Required |
|--------|----------|-------|-------------|
| K-mer + RandomForest | ~85% | Fast | No |
| **Evo 2 7B + Classifier** | ~95% | Medium | Yes (16GB) |
| **Evo 2 40B + Classifier** | ~98% | Slow | Yes (80GB) |

---

## 📚 Technical Documentation

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | FastAPI + Python 3.12 |
| ML | Scikit-learn (SVM, RandomForest) + optional research dependencies for embedding experiments |
| AI | Google Gemini API |
| DevOps | Docker, GitHub Actions, pytest |

---

### Code File Guide

This guide explains what each main file does - easy to understand for developers.

#### Backend (API)

| File | What it does |
|------|--------------|
| `api/main.py` | Main FastAPI server - handles all API requests like `/classify`, `/chat`, `/health` |
| `api/llm_client.py` | Connects to Google Gemini AI for the chat assistant |

#### Frontend (React UI)

| File | What it does |
|------|--------------|
| `frontend/src/App.tsx` | Main React component - ties everything together |
| `frontend/src/components/Header.tsx` | Top navigation bar with AI Assistant, dark mode, health status |
| `frontend/src/components/SequenceInput.tsx` | Input form for pasting DNA sequences or uploading FASTA files |
| `frontend/src/components/ConfigPanel.tsx` | Settings panel (threshold, model selection, OOD toggle) |
| `frontend/src/components/ResultsDashboard.tsx` | Shows classification results, tables, charts, export options |
| `frontend/src/components/ChatWidget.tsx` | AI Assistant floating chat window (legacy - now in Header) |
| `frontend/src/api.ts` | Functions to call backend API endpoints |

#### Machine Learning

| File | What it does |
|------|--------------|
| `binary_classifiers/predict_class.py` | Core classification logic - takes DNA sequence, returns Virus/Host prediction |
| `binary_classifiers/transformers/kmers_transformer.py` | Converts raw DNA into overlapping 6-mers |
| `binary_classifiers/evaluation.py` | Loads labeled data and computes classifier metrics |
| `retrain_model.py` | Retrains saved SVM and RandomForest artifacts from local FASTA files |
| `metaseq/train.py` | Separate configurable training pipeline for experiments and future consolidation |

#### Root Scripts

| File | What it does |
|------|--------------|
| `retrain_model.py` | Standalone script to retrain the ML model |
| `predict_class.py` | Quick prediction script for testing |
| `scripts/evaluate_binary_classifier.py` | Evaluates the deployed model on labeled host/virus FASTA or FASTQ data |

---

## Installation & Setup

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.10+ (3.12 recommended) | Required for backend |
| Node.js | 18+ | Required for frontend |
| Git | Any recent version | For cloning |
| Docker | Optional | For containerized deployment |

### Step 1: Clone Repository

```bash
git clone https://github.com/oss-slu/baio.git
cd baio
```

### Step 2: Set Up Environment

**Option A: Conda (Recommended)**
```bash
conda env create -f environment.yml
conda activate baio
```

**Option B: Python venv**
```bash
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### Step 3: Configure API Keys

Create `.env` in project root:
```
GOOGLE_API_KEY=your_google_api_key_here
```

[Get Google API Key](https://makersuite.google.com/app/apikey)

---

## 🚀 Running the Project

### Method 1: Docker (Production-Like)

```bash
# Build and run both frontend and backend
docker compose up --build

# Run in background
docker compose up -d --build

# Stop
docker compose down
```

**Access:**
- 🌐 Frontend: http://localhost:4173
- 📊 Backend API: http://localhost:8080
- 📖 API Docs: http://localhost:8080/docs

---

### Method 2: Local Development (Recommended for Development)

#### Terminal 1: Start Backend
```bash
# Activate environment
conda activate baio
# OR: source .venv/bin/activate

# Start API server
uvicorn api.main:app --reload --port 8080
```

**Backend ready at:** http://localhost:8080

#### Terminal 2: Start Frontend
```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Frontend ready at:** http://localhost:5173

---

### Verify Everything Works

```bash
# Check backend health
curl http://localhost:8080/health

# Frontend should load automatically
# Open: http://localhost:5173
```

---

## Usage Guide

1. **Open Browser**: Navigate to http://localhost:5173

2. **Enter Sequences**:
   - Paste DNA sequences directly, OR
   - Upload a FASTA file

3. **Configure Settings** (optional):
   - Confidence threshold (default: 0.75)
   - Enable/disable open-set detection
   - Select model type

4. **Classify**: Click "Classify Sequences"

5. **View Results**:
   - Classification (Virus/Host)
   - Confidence bars
   - Risk indicators (Low/Moderate/High)
   - GC content

6. **Expand Row**: Click any row to see:
   - Prediction explanation
   - Confidence and novelty indicators
   - Sequence preview and organism-name heuristic

7. **Export**: Download as JSON, CSV, or PDF

8. **AI Assistant**: Use the chat widget to ask questions about your sequences

---

### Model Training & Retraining

If you need to retrain the model:

```bash
python retrain_model.py
```

This will:
1. Load training data from `data/`
2. Extract k-mer features
3. Train both RandomForest and SVM classifiers
4. Save model and vectorizer artifacts under `binary_classifiers/`

The default training data in `data/covid_reads5.fasta` and `data/human_reads5.fasta` is only a tiny demo dataset. It is useful for development, but not enough for a robust biological classifier.

**To evaluate the current saved models on labeled files:**

```bash
python scripts/evaluate_binary_classifier.py --model RandomForest
python scripts/evaluate_binary_classifier.py --model SVM --output runs/metrics/svm_eval.json
```

The evaluation script reports:
- accuracy, precision, recall, F1, and ROC-AUC
- confusion matrix
- per-class report
- misclassified sequence IDs with confidence and virus probability

---

### Testing & Code Quality

**Run Tests:**
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

**Code Quality:**
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

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `python` command not found | Python not in PATH | Use `python3` |
| Port 8080 in use | Another process | `lsof -i :8080` then `kill -9 <PID>` |
| ModuleNotFoundError | Environment not activated | `conda activate baio` |
| npm install fails | Node version | Upgrade to Node.js 18+ |
| Gemini API error | Invalid API key | Check `.env` file |
| Model returns "Novel" | Low confidence or heuristic novelty threshold triggered | Inspect `confidence_threshold` and `ood_threshold`, then evaluate/retrain with broader data |
| Docker build fails | Cache issue | `docker system prune -a` |
| Conda env fails | Conflict | Use `mamba env create -f environment.yml` |

---

## ⚠️ Current Limitations

- **Small Demo Dataset**: The default demo retraining data in `data/` is very small: 5 virus reads and 5 host reads.
- **Heuristic Novelty Score**: The novelty score is heuristic-based, so "Novel" should be treated as "needs further validation," not proof of a new pathogen.
- **Limited Scope**: Current models distinguish only Virus vs Host. Multi-class classification coming in future versions.

---

## Project URLs & Resources

| Service | URL |
|---------|-----|
| Frontend (Dev) | http://localhost:5173 |
| Frontend (Docker) | http://localhost:4173 |
| API Docs | http://localhost:8080/docs |
| API Health | http://localhost:8080/health |
| GitHub Repository | https://github.com/oss-slu/baio |

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
