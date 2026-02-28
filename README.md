# BAIO: LLM-Based Taxonomy Profiling & Open-Set Pathogen Detection

## Overview

BAIO (Bioinformatics AI for Open-set detection) is a cutting-edge metagenomic analysis platform that leverages foundation models for DNA sequence analysis. Unlike traditional reference-based pipelines (e.g., Kraken2, MetaPhlAn), BAIO can detect novel and divergent pathogens through open-set recognition methods, making it crucial for pandemic preparedness and surveillance.

## Key Features

- **Taxonomy Classification**: Classifies DNA sequences into Virus or Host using k-mer frequency analysis
- **Confidence Visualization**: Displays prediction confidence with visual bars and color-coded indicators
- **GC Content Analysis**: Heatmap visualization showing GC content distribution
- **Risk Assessment**: Color-coded risk level indicators (Low/Moderate/High)
- **Explainable AI**: Per-sequence explanations with probability distributions, feature importance, and decision paths
- **Sample-Level Reporting**: Aggregates read-level predictions into intuitive reports
- **Dark Mode**: Toggle between light and dark themes
- **Downloadable Reports**: Export results as JSON, CSV, or PDF
- **AI Assistant**: Built-in Gemini-powered chat for sequence analysis questions
- **Open-Set Detection** (optional): Flags sequences that don't fit known classes as "novel/unknown"

## Technology Stack

### Frontend
- **React + Vite**: Lightweight single-page UI for uploads, configuration, results, and chat (replaces the legacy Streamlit view)

### Model Runtime
- **PyTorch + Scikit-learn**: Core ML framework
- **K-mer Frequency Analysis**: 6-mer frequency features for sequence classification
- **RandomForest Classifier**: Trained on COVID-19 and Human genomic data
- **Custom Heads**: MLP for taxonomy classification; OOD scores (Max Softmax, Energy, Mahalanobis)

### Bioinformatics Utilities
- **Biopython**: FASTA/FASTQ parsing
- **Scikit-learn**: Model training, evaluation, and feature extraction

### Data Processing
- **NumPy/Pandas**: Embedding manipulation
- **Scikit-learn**: Model calibration and evaluation

### DevOps
- **GitHub Actions**: CI/CD pipeline
- **pytest**: Testing framework
- **Conda/Poetry**: Environment management

## Project Structure

```
baio/
- api/                    (FastAPI backend)
- frontend/               (React + Vite UI)
- binary_classifiers/     (Core ML library)
  - predict_class.py      Classification logic
  - retrain_model.py      Model training script
  - train_model.py        Model utilities
- weights/               (Trained classifier weights)
- examples/              (Demo FASTA files)
- environment.yml
- pyproject.toml
- requirements.txt
- .env                   (API keys configuration)
```

## Installation

### Prerequisites
- Python 3.8+

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
If you prefer using Python's built-in virtual environment instead of conda:

#### 1. Create Virtual Environment

**Windows:**
```bash
# Navigate to project directory
cd baio

# Create virtual environment
python -m venv baio-env

# Alternative if python3 is your command
python3 -m venv baio-env
```

**macOS/Linux:**
```bash
# Navigate to project directory
cd baio

# Create virtual environment
python3 -m venv baio-env
```

#### 2. Activate Virtual Environment
**Windows (Command Prompt):**
```bash
baio-env\Scripts\activate
```

**Windows (PowerShell):**
```bash
baio-env\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source baio-env/bin/activate
```

#### 3. Install Dependencies
```bash
# Upgrade pip first
pip install --upgrade pip

# Install project dependencies
pip install -r requirements.txt

```

#### 4. Verify Installation
```bash
# Check Python version
python --version

# Check installed packages
pip list

# Test Streamlit installation
```

### Option 3: Poetry
```bash
# Clone and install with Poetry
git clone https://github.com/your-org/baio.git
cd baio
poetry install
```

### macOS (Apple Silicon / arm64) Setup Notes

If you are using an Apple Silicon Mac (M1 / M2 / M3), we recommend using
**Miniforge (arm64)** instead of Anaconda. Anaconda (x86) can cause
architecture conflicts when resolving scientific and ML dependencies.

### Recommended Conda Setup (macOS arm64)

1. Install **Miniforge (arm64)**  
   https://github.com/conda-forge/miniforge

2. Create and activate the environment:
   ```bash
   mamba env create -f environment.yml
   conda activate baio


## Development Environment Setup

### IDE Configuration

#### Visual Studio Code
1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Select "Python: Select Interpreter"
3. Choose the Python executable from your virtual environment:
   - **Conda**: Usually in `~/miniconda3/envs/baio/bin/python`
   - **venv**: `baio-env/Scripts/python.exe` (Windows) or `baio-env/bin/python` (macOS/Linux)

#### PyCharm
1. Go to File → Settings → Project → Python Interpreter
2. Click gear icon → Add
3. Select "Existing Environment"
4. Browse to your environment's Python executable

#### Jupyter Notebook Integration
```bash
# For conda environment
conda activate baio
conda install ipykernel
python -m ipykernel install --user --name=baio --display-name="BAIO Project"

# For venv environment
source baio-env/bin/activate  # or activate script for Windows
pip install ipykernel
python -m ipykernel install --user --name=baio-env --display-name="BAIO Project"
```

### Environment Variables

Create a `.env` file in your project root for API keys and configuration:
```bash
# .env file
GOOGLE_API_KEY=your_google_api_key_here
DEBUG=True
API_PORT=8080
FRONTEND_PORT=5173
```

Load environment variables in your Python code:
```python
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv('OPENAI_API_KEY')
```

### Common Setup Issues & Solutions

#### Issue: `python` command not found
**Solution:** Use `python3` instead of `python`, or ensure Python is in your system PATH.

#### Issue: Permission denied on Windows PowerShell
**Solution:** Run PowerShell as administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Issue: `pip` command not found
**Solution:** 
```bash
# Use python -m pip instead
python -m pip install package-name
```

#### Issue: CUDA/GPU Setup Problems
**Solution:** 
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"

# Install CPU-only version if needed
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

#### Issue: CI Pipeline Formatting Error
**Solution**
- black .
- git add .
- git commit -m “Apply black formatting”
- git push

Recommended to install precommit to autoapply formatting before a commit
- pip install pre-commit

### Daily Development Workflow

1. **Activate Environment:**
   ```bash
   # Conda
   conda activate baio
   
   # venv (Linux/Mac)
   source baio-env/bin/activate
   
   # venv (Windows)
   baio-env\Scripts\activate
   ```

2. **Update Dependencies:**
   ```bash
   # Conda
   conda env update -f environment.yml
   
   # venv
   pip install -r requirements.txt
   ```

3. **Run Development Servers (API + React UI):**
   ```bash
   # FastAPI backend
   python -m uvicorn api.main:app --reload --port 8080

   # React frontend (uses Vite)
   cd frontend
   npm install
   npm run dev -- --host --port 5173
   ```

4. **Deactivate When Done:**
   ```bash
   # Both conda and venv
   deactivate
   ```

### Dependency Management

#### Adding New Packages

**For Conda:**
```bash
conda activate baio
conda install new-package
conda env export > environment.yml
```

**For venv:**
```bash
source baio-env/bin/activate  # Windows: baio-env\Scripts\activate
pip install new-package
pip freeze > requirements.txt
```

**For Poetry:**
```bash
poetry add new-package
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
# Set VITE_API_BASE if your API is not on http://localhost:8080
npm run dev -- --host --port 5173
```

Then open http://localhost:5173 to upload sequences, tune thresholds, and chat.

## UI Features

The BAIO frontend provides an intuitive interface with the following capabilities:

### Sequence Input
- Paste DNA sequences directly or upload FASTA files
- Support for batch processing multiple sequences

### Classification Results
- **Confidence Visualization**: Color-coded confidence bars for each prediction
- **GC Content Heatmap**: Visual representation of GC distribution across sequences
- **Risk Level Indicators**: Color-coded badges (Low/Moderate/High) based on classification confidence
- **Expandable Explanations**: Click each row to see:
  - Probability distribution
  - Feature importance (top k-mers)
  - Decision path analysis
  - Risk assessment details

### Model Information
- Display of current model version (e.g., baio-v1.2)
- Model information tooltip with details

### Dark Mode
- Toggle between light and dark themes for comfortable viewing

### Export Options
- **JSON**: Raw classification results
- **CSV**: Tabular format for spreadsheet analysis
- **PDF**: Formatted report with visualizations

### AI Assistant
- Built-in Gemini-powered chat for questions about your sequences
- Ask follow-up questions about classification results
- Get explanations of predictions in natural language
## Running BAIO with Docker & Docker Compose

You can run the full BAIO stack - FastAPI backend and React UI - without installing Python locally.

### 1. Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop) or Docker Engine with Compose v2.
* Git to clone the repository.

### 2. Build and start
```bash
docker compose up --build
```

This starts:
- API at http://localhost:8080 (health at `/health`, classification at `/classify`, chat at `/chat`)
- Frontend at http://localhost:4173 (set `FRONTEND_PORT` if you want a different host port)

### 3. Environment overrides (optional)
- `API_PORT`: host port for FastAPI (default 8080)
- `FRONTEND_PORT`: host port for React UI (default 4173)
- `VITE_API_BASE`: API base URL baked into the frontend at build time (defaults to http://localhost:8080 so the browser can reach the API)

### Basic Usage
1. Open the React UI at the frontend port and paste/upload FASTA.
2. Configure thresholds (confidence, batch size, novelty sensitivity).
3. Run the classification pipeline.
4. Review classifications, novelty counts, and chat with the built-in assistant.

## Evaluation Metrics

### Classification
- Accuracy, macro-F1
- Per-class Precision/Recall
- Confidence threshold analysis

### Open-Set Detection (optional)
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
# Activate your environment first
conda activate baio  # or source baio-env/bin/activate

# Run tests
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
3. Set up your development environment (see Installation section)
4. Make your changes and test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

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
