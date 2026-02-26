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

---

## Prerequisites

### Required Software
- **Python**: 3.10+ (3.12 recommended)
- **Node.js**: 18+ (for frontend)
- **Git**: For version control

### Optional (for conda installation)
- **Miniforge** (recommended for macOS ARM/Apple Silicon)
- **Anaconda** or **Miniconda** (for other platforms)

### Optional (for Docker)
- **Docker Desktop** or **Docker Engine with Compose v2**

---

## Installation

### Option 1: Conda Environment (Recommended)

#### 1. Clone the repository
```bash
git clone https://github.com/oss-slu/baio.git
cd baio
```

#### 2. Create and activate conda environment
```bash
# Using environment.yml
conda env create -f environment.yml
conda activate baio
```

Or using mamba (faster on Apple Silicon):
```bash
mamba env create -f environment.yml
conda activate baio
```

#### 3. Verify installation
```bash
python --version
conda list | head -20
```

---

### Option 2: Python Virtual Environment

#### 1. Clone the repository
```bash
git clone https://github.com/oss-slu/baio.git
cd baio
```

#### 2. Create virtual environment
```bash
# macOS/Linux
python3 -m venv baio-env

# Windows
python -m venv baio-env
```

#### 3. Activate the environment
```bash
# macOS/Linux
source baio-env/bin/activate

# Windows (Command Prompt)
baio-env\Scripts\activate

# Windows (PowerShell)
baio-env\Scripts\Activate.ps1
```

#### 4. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 5. Install FastAPI (if not in requirements)
```bash
pip install fastapi uvicorn
```

#### 6. Verify installation
```bash
python --version
pip list
```

---

### Option 3: Docker (Backend + Frontend)

#### 1. Clone the repository
```bash
git clone https://github.com/oss-slu/baio.git
cd baio
```

#### 2. Build and start containers
```bash
docker compose up --build
```

This starts:
- API at http://localhost:8080
- Frontend at http://localhost:4173

---

## Environment Variables

### Required: Google API Key

To use the AI Assistant feature, you need a Google API key:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env` file

### Setup .env file

Create a `.env` file in the project root:

```bash
# .env file
GOOGLE_API_KEY=your_google_api_key_here
```

Or copy from example:
```bash
cp .env.example .env
# Edit .env with your API key
```

### Optional Environment Variables

```bash
# API configuration
DEBUG=True
API_PORT=8080
FRONTEND_PORT=5173
VITE_API_BASE=http://localhost:8080
```

---

## Running the Project

### Option 1: Development Mode (Recommended)

#### 1. Start the FastAPI backend
```bash
# Activate your environment first
conda activate baio
# OR (for virtual env)
source baio-env/bin/activate

# Start the API server
python -m uvicorn api.main:app --reload --port 8080
```

The API will be available at http://localhost:8080

- API documentation: http://localhost:8080/docs
- Health check: http://localhost:8080/health

#### 2. Start the React frontend (in a new terminal)
```bash
cd frontend
npm install  # First time only

npm run dev -- --host --port 5173
```

The frontend will be available at http://localhost:5173

---

### Option 2: Using npm scripts

#### 1. Install frontend dependencies
```bash
cd frontend
npm install
```

#### 2. Run both servers with npm (requires concurrent or separate terminals)

Terminal 1 - Backend:
```bash
conda activate baio
python -m uvicorn api.main:app --reload --port 8080
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

---

### Option 3: Docker Production Mode

```bash
# Build and start containers
docker compose up --build

# Or run in background
docker compose up -d --build
```

Access:
- Frontend: http://localhost:4173
- API: http://localhost:8080

---

## Quick Start Guide

### 1. Start the servers
```bash
# Terminal 1 - Backend
conda activate baio
python -m uvicorn api.main:app --reload --port 8080

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Open the browser
Navigate to http://localhost:5173

### 3. Enter sequences
- Paste DNA sequences directly, OR
- Upload a FASTA file

### 4. Configure settings (optional)
- Adjust confidence threshold
- Toggle open-set detection
- Select model

### 5. Classify
Click "Classify Sequences" to run the classification.

### 6. View results
- See classification results in the table
- View confidence bars and risk indicators
- Expand rows for detailed explanations

### 7. Export (optional)
Download results as JSON, CSV, or PDF.

### 8. Ask the AI Assistant (optional)
Use the chat widget to ask questions about your sequences.

---

## Testing

### Run all tests
```bash
pytest tests/
```

### Run specific test file
```bash
pytest tests/test_api_classification.py
```

### Run with coverage
```bash
pytest --cov=. tests/
```

---

## Code Quality

### Format code
```bash
black .
```

### Lint code
```bash
ruff check .
# OR
flake8 .
```

### Type checking
```bash
mypy .
```

### Pre-commit hooks (recommended)
```bash
pip install pre-commit
pre-commit install
```

---

## Common Issues & Solutions

### Issue: `python` command not found

**Solution:**
- Use `python3` instead of `python`, OR
- Ensure Python is in your system PATH
- On macOS: `brew install python3`

---

### Issue: Permission denied on Windows PowerShell

**Solution:**
Run PowerShell as administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Issue: `pip` command not found

**Solution:**
```bash
# Use python -m pip instead
python3 -m pip install package-name
```

---

### Issue: Conda environment fails to create

**Solution:**
```bash
# Update conda first
conda update conda

# Or use mamba (faster)
mamba env create -f environment.yml
```

---

### Issue: Node.js version error

**Solution:**
Check Node.js version:
```bash
node --version
```

If below 18, update:
```bash
# macOS (using nvm)
nvm install 20
nvm use 20

# Windows
# Download from nodejs.org
```

---

### Issue: Frontend fails to start

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: API returns 500 error on /classify

**Solution:**
1. Check if model files exist in `binary_classifiers/models/`
2. If not, retrain the model:
```bash
python retrain_model.py
```

3. Check logs for specific error:
```bash
python -m uvicorn api.main:app --reload --port 8080 --log-level debug
```

---

### Issue: Gemini API errors

**Solution:**
1. Verify your API key in `.env`:
```bash
cat .env
```

2. Check API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)

3. Check quota usage:
- Free tier: 60 requests/minute
- If quota exceeded, wait or upgrade to paid plan

4. If using wrong key format, ensure it starts with `AIzaSy...`

---

### Issue: ModuleNotFoundError for dependencies

**Solution:**
```bash
# Activate your environment
conda activate baio
# OR
source baio-env/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

---

### Issue: Port already in use

**Solution:**
```bash
# Find process using the port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process
kill -9 <PID>
```

Or use a different port:
```bash
python -m uvicorn api.main:app --reload --port 8081
```

---

### Issue: Docker container fails to build

**Solution:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker compose build --no-cache
docker compose up
```

---

### Issue: Model classification always returns "Novel"

**Solution:**
This was a known bug (fixed). If still occurring:

1. Check `binary_classifiers/predict_class.py` has correct LABEL_MAP:
```python
LABEL_MAP = {0: "Host", 1: "Virus"}  # NOT inverted
```

2. Check default model is RandomForest (not SVM):
```python
DEFAULT_MODEL = "random_forest"
```

3. Retrain model:
```bash
python retrain_model.py
```

---

### Issue: CI Pipeline Formatting Error

**Solution:**
```bash
# Install pre-commit
pip install pre-commit

# Apply formatting
black .
ruff check --fix .

# Commit changes
git add .
git commit -m "Apply formatting fixes"
git push
```

---

### Issue: macOS Apple Silicon (M1/M2/M3) issues

**Solution:**
Use Miniforge instead of Anaconda:
```bash
# Install Miniforge
brew install miniforge

# Create environment
mamba env create -f environment.yml
conda activate baio
```

If PyTorch fails:
```bash
# Install PyTorch for Apple Silicon
pip install torch torchvision torchaudio
```

---

## Development Workflow

### Daily Development

1. **Activate environment:**
```bash
conda activate baio
# OR
source baio-env/bin/activate
```

2. **Update dependencies (if needed):**
```bash
conda env update -f environment.yml
# OR
pip install -r requirements.txt
```

3. **Start servers:**
```bash
# Terminal 1 - API
python -m uvicorn api.main:app --reload --port 8080

# Terminal 2 - Frontend
cd frontend
npm run dev
```

4. **Make changes and test**

5. **Run tests before committing:**
```bash
pytest tests/
black .
mypy .
```

6. **Deactivate when done:**
```bash
deactivate
```

---

## Troubleshooting Checklist

If you encounter issues, verify:

- [ ] Python version is 3.10+ (`python --version`)
- [ ] Node.js version is 18+ (`node --version`)
- [ ] Environment is activated (`which python`)
- [ ] Dependencies installed (`pip list`)
- [ ] `.env` file exists with API key
- [ ] Ports 8080 and 5173 are available
- [ ] Model files exist in `binary_classifiers/models/`

---

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
  url={https://github.com/oss-slu/baio}
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
