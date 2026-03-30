# BAIO: DNA Sequence Classification & Open-Set Pathogen Detection

BAIO (Bioinformatics AI for Open-set detection) is a web-based metagenomic analysis platform that classifies DNA sequences using machine learning. It uses 6-mer sequence features with trained SVM and RandomForest models to distinguish viral and host DNA, with an optional novelty flag for low-confidence predictions.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
  - [macOS Setup](#macos-setup)
  - [Windows Setup](#windows-setup)
- [Get the Code](#get-the-code)
- [Get a Google API Key](#get-a-google-api-key)
- [Running the Project](#running-the-project)
  - [Option A: Docker (Easiest — Mac & Windows)](#option-a-docker-easiest--mac--windows)
  - [Option B: Local Development (Mac)](#option-b-local-development-mac)
  - [Option C: Local Development (Windows)](#option-c-local-development-windows)
- [Using the App](#using-the-app)
- [Project Structure](#project-structure)
- [Common Issues & Fixes](#common-issues--fixes)
- [Testing](#testing)
- [Contributors](#contributors)
- [License](#license)

---

## Features

- **Sequence Classification** — Classifies DNA sequences as Virus or Host
- **K-mer Analysis** — Uses 6-mer frequency features for sequence representation
- **Confidence Visualization** — Color-coded confidence bars per prediction
- **GC Content Analysis** — Heatmap showing GC content distribution
- **Risk Assessment** — Color-coded risk indicators (Low / Moderate / High)
- **Dark Mode** — Toggle between light and dark themes
- **Export Options** — Download results as JSON, CSV, or PDF
- **AI Assistant** — Gemini-powered chat for sequence analysis questions
- **Novelty Flagging** — Optional flag for low-confidence / out-of-distribution sequences

---

## Prerequisites

Before you can run BAIO, you need to install a few tools. Follow the section for your operating system.

### macOS Setup

#### 1. Install Homebrew (macOS package manager)

Open **Terminal** (press `Cmd + Space`, type "Terminal", press Enter) and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow the on-screen prompts. This may take a few minutes.

#### 2. Install Git

```bash
brew install git
```

Verify it works:

```bash
git --version
```

You should see something like `git version 2.x.x`.

#### 3. Install Python (via Conda — recommended)

Download and install **Miniconda** for macOS from:
https://docs.conda.io/en/latest/miniconda.html

Choose the **macOS** installer for your chip:
- Apple Silicon (M1/M2/M3) → pick the `arm64` version
- Intel Mac → pick the `x86_64` version

After installing, close and reopen Terminal, then verify:

```bash
conda --version
```

#### 4. Install Node.js

```bash
brew install node
```

Verify:

```bash
node --version   # should be 18 or higher
npm --version
```

#### 5. (Optional) Install Docker Desktop

Docker lets you run the whole app with a single command — no manual Python/Node setup required.

Download **Docker Desktop for Mac** from: https://www.docker.com/products/docker-desktop

After installing, open Docker Desktop and wait until the whale icon in the menu bar says "Docker Desktop is running."

---

### Windows Setup

#### 1. Install Git for Windows

Download and install from: https://git-scm.com/download/win

During installation, keep all defaults. This also installs **Git Bash**, which you will use to run commands.

After installation, open **Git Bash** (search for it in the Start menu) and verify:

```bash
git --version
```

> **Note for Windows users:** Use **Git Bash** (not Command Prompt or PowerShell) for all commands in this guide unless stated otherwise.

#### 2. Install Python (via Conda — recommended)

Download **Miniconda** for Windows from:
https://docs.conda.io/en/latest/miniconda.html

Run the `.exe` installer and follow the prompts. When asked, check **"Add Miniconda3 to my PATH environment variable"**.

After installing, open a new **Git Bash** window and verify:

```bash
conda --version
```

#### 3. Install Node.js

Download the **LTS** installer from: https://nodejs.org/

Run the `.msi` installer and keep all defaults.

Open a new **Git Bash** window and verify:

```bash
node --version   # should be 18 or higher
npm --version
```

#### 4. (Optional) Install Docker Desktop

Download **Docker Desktop for Windows** from: https://www.docker.com/products/docker-desktop

> Docker Desktop on Windows requires **WSL 2** (Windows Subsystem for Linux). The installer will guide you through enabling it if it is not already active.

After installing, open Docker Desktop and wait until it says "Docker Desktop is running."

---

## Get the Code

Open Terminal (macOS) or Git Bash (Windows) and run:

```bash
git clone https://github.com/oss-slu/baio.git
cd baio
```

This downloads the project to a folder called `baio` and moves you into it.

---

## Get a Google API Key

BAIO uses Google Gemini AI for the chat assistant. You need a free API key.

1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with a Google account
3. Click **"Create API Key"**
4. Copy the key

Now create a file called `.env` in the `baio` folder:

**macOS / Git Bash (Windows):**
```bash
echo "GOOGLE_API_KEY=paste_your_key_here" > .env
```

Or open any text editor, create a file named `.env` in the `baio` folder, and add:
```
GOOGLE_API_KEY=paste_your_key_here
```

> Replace `paste_your_key_here` with the actual key you copied.

---

## Running the Project

Choose the option that works best for you.

---

### Option A: Docker (Easiest — Mac & Windows)

This runs everything with one command. No need to set up Python or Node manually.

**Requirements:** Docker Desktop must be running.

```bash
docker compose up --build
```

The first time this runs, it will download and build everything — this may take 5–10 minutes.

Once you see log lines like `uvicorn running` and the frontend is ready, open your browser:

| Service | URL |
|---------|-----|
| Frontend (App) | http://localhost:4173 |
| Backend API | http://localhost:8080 |
| API Docs | http://localhost:8080/docs |

**To stop the app:**
```bash
docker compose down
```

**To run in the background:**
```bash
docker compose up -d --build
```

---

### Option B: Local Development (Mac)

This runs the backend and frontend separately. You need two Terminal windows open at the same time.

#### Step 1: Set up the Python environment

```bash
conda env create -f environment.yml
conda activate baio
```

> If you see `conda: command not found`, close and reopen Terminal after installing Miniconda.

#### Step 2: Start the Backend (Terminal 1)

```bash
conda activate baio
uvicorn api.main:app --reload --port 8080
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8080
```

Leave this terminal running.

#### Step 3: Start the Frontend (Terminal 2)

Open a second Terminal window:

```bash
cd baio/frontend
npm install       # only needed the first time
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

#### Step 4: Open the App

Go to http://localhost:5173 in your browser.

---

### Option C: Local Development (Windows)

Use **Git Bash** for all commands below.

#### Step 1: Set up the Python environment

```bash
conda env create -f environment.yml
conda activate baio
```

> If `conda activate` does not work in Git Bash, try running this once:
> ```bash
> conda init bash
> ```
> Then close and reopen Git Bash.

#### Step 2: Start the Backend (Git Bash Window 1)

```bash
conda activate baio
uvicorn api.main:app --reload --port 8080
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8080
```

Leave this window open.

#### Step 3: Start the Frontend (Git Bash Window 2)

Open a second Git Bash window:

```bash
cd baio/frontend
npm install       # only needed the first time
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
```

#### Step 4: Open the App

Go to http://localhost:5173 in your browser.

---

## Using the App

Once the app is open in your browser:

1. **Enter DNA Sequences**
   - Paste sequences directly into the text box, OR
   - Click "Upload FASTA file" to upload a `.fasta` file

2. **Configure Settings** (optional)
   - Confidence threshold (default: 0.75)
   - Enable/disable open-set (novelty) detection
   - Select model type (K-mer or Evo 2 if available)

3. **Click "Classify Sequences"**

4. **View Results**
   - Each sequence gets a Virus or Host classification
   - Confidence bar shows how certain the model is
   - Risk indicator: Low / Moderate / High
   - GC content shown per sequence

5. **Expand a Row**
   - Click any result row to see a detailed explanation, confidence breakdown, and sequence preview

6. **Export Results**
   - Download as JSON, CSV, or PDF using the buttons at the top of the results table

7. **AI Assistant**
   - Click the chat icon to open the AI assistant
   - Ask questions about your sequences or the classification results

---

## Project Structure

```
baio/
├── api/                        # FastAPI backend
│   ├── main.py                 # API endpoints (/classify, /chat, /health)
│   ├── llm_client.py           # Google Gemini AI client
│   └── Dockerfile              # Docker config for the backend
│
├── frontend/                   # React + Vite frontend (what you see in the browser)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx       # Top navigation bar
│   │   │   ├── SequenceInput.tsx # DNA input form
│   │   │   ├── ConfigPanel.tsx   # Settings panel
│   │   │   └── ResultsDashboard.tsx # Results table and charts
│   │   ├── App.tsx              # Main React component
│   │   ├── api.ts               # Functions to call the backend
│   │   └── types.ts             # TypeScript type definitions
│   └── package.json             # Node.js dependencies
│
├── binary_classifiers/         # ML classification core
│   ├── predict_class.py        # Takes DNA sequence, returns Virus/Host prediction
│   ├── evaluation.py           # Computes model metrics
│   └── models/                 # Saved model files (.pkl)
│
├── data/                       # Sample FASTA files for testing
├── tests/                      # Unit tests
├── scripts/                    # Evaluation and utility scripts
├── .env                        # Your API key (you create this)
├── environment.yml             # Conda environment definition
├── docker-compose.yml          # Docker setup
├── requirements.txt            # Python dependencies reference
└── README.md                   # This file
```

---

## Common Issues & Fixes

### "conda: command not found"
Miniconda was not added to your PATH. Close and reopen your terminal after installing. If the issue persists on macOS, run:
```bash
export PATH="$HOME/miniconda3/bin:$PATH"
```

### "python command not found" (macOS)
macOS uses `python3` by default. Try:
```bash
python3 --version
```

### Port 8080 already in use
Another process is using that port.

**macOS:**
```bash
lsof -i :8080
kill -9 <PID shown in output>
```

**Windows (Git Bash):**
```bash
netstat -ano | grep 8080
taskkill /PID <PID shown> /F
```

### "ModuleNotFoundError" when starting backend
Your Conda environment is not activated. Run:
```bash
conda activate baio
```

### "npm install" fails
Your Node.js version may be too old. Check with `node --version` — it must be 18 or higher. Re-download from https://nodejs.org/ if needed.

### Gemini API error / chat not working
Your `.env` file is missing or the key is wrong. Make sure the file is in the root `baio/` folder and contains:
```
GOOGLE_API_KEY=your_actual_key
```

### Docker build fails
Try clearing Docker's cache:
```bash
docker system prune -a
docker compose up --build
```

### Frontend shows "Cannot connect to API"
The backend is not running. Make sure Terminal 1 (uvicorn) is still active and showing no errors.

---

## Testing

```bash
# Make sure the environment is active
conda activate baio

# Run all tests
pytest tests/

# Run a specific test file
pytest tests/test_api_classification.py

# Run with coverage report
pytest --cov=. tests/
```

---   

## Contributors

- **Mainuddin** — Tech Lead
- **Luis Palmejar** — Developer
- **Kevin Yang** — Developer
- **Vrinda Thakur** — Developer

---

## License

MIT License — see [LICENSE](LICENSE)

---

> **Note:** This is a research prototype. For use in clinical or production settings, additional validation and regulatory approval are required.
