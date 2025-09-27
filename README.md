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

pip install streamlit torch transformers biopython numpy pandas scikit-learn hdbscan plotly
```

#### 4. Verify Installation
```bash
# Check Python version
python --version

# Check installed packages
pip list

# Test Streamlit installation
streamlit hello
```

### Option 3: Poetry
```bash
# Clone and install with Poetry
git clone https://github.com/your-org/baio.git
cd baio
poetry install
```

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
OPENAI_API_KEY=your_api_key_here
HUGGINGFACE_TOKEN=your_hf_token_here
DEBUG=True
STREAMLIT_SERVER_PORT=8501
CUDA_VISIBLE_DEVICES=0
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

#### Issue: Evo2 Model Download Fails
**Solution:**
- Ensure stable internet connection
- Check Hugging Face token permissions
- Use `huggingface-cli login` for authentication

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

3. **Run Development Server:**
   ```bash
   streamlit run app/streamlit_app.py
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

### Running the GUI
```bash
# Using conda
conda activate baio
streamlit run app/streamlit_app.py

# Using venv
source baio-env/bin/activate  # Windows: baio-env\Scripts\activate
streamlit run app/streamlit_app.py

# Using Poetry
poetry run streamlit run app/streamlit_app.py
```
## 🐳 Running BAIO with Docker & Docker Compose

You can run the full BAIO stack—FastAPI backend and Streamlit UI—without installing Python or dependencies locally.

### 1. Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop) or Docker Engine with Compose v2.
* Git to clone the repository.

### 2. Environment file
Copy the template and adjust if needed:

### 3. Build and Start the stack
docker compose build
docker compose up

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