#!/bin/bash
#SBATCH --job-name=baio_classify
#SBATCH --partition=gpu               # GPU partition on Libra — adjust if needed
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8             # I/O + tokenisation workers
#SBATCH --mem=64G                     # Host RAM (model weights + data buffers)
#SBATCH --gres=gpu:1                  # 1 GPU; change to gpu:h100:1 for H100
#SBATCH --time=04:00:00               # 4 h for a typical full FASTA file
#SBATCH --output=logs/%x_%j.out      # stdout  (create logs/ first)
#SBATCH --error=logs/%x_%j.err       # stderr
#SBATCH --mail-type=END,FAIL
#SBATCH --mail-user=YOUR_EMAIL@slu.edu   # <-- replace with your SLU email

# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------
# · If H100s are available, change --gres to gpu:h100:1 and the script will
#   automatically load evo2_40b (80+ GB VRAM detected).
# · For very large FASTA files (> 100 k sequences) increase --time accordingly.
# · Scratch paths: replace /scratch/$USER with your actual Libra scratch dir.
# ---------------------------------------------------------------------------

set -euo pipefail

# ---------------------------------------------------------------------------
# Paths — edit before submitting
# ---------------------------------------------------------------------------
PROJECT_DIR="$HOME/baio"
FASTA_IN="/scratch/$USER/data/sequences.fasta"
RESULTS_DIR="/scratch/$USER/results"
CONDA_ENV="baio"                          # conda env with evo2 + biopython

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
echo "==============================="
echo "Job:   $SLURM_JOB_ID"
echo "Node:  $(hostname)"
echo "Start: $(date)"
echo "==============================="

# Load modules available on Libra (adjust versions as needed)
module purge
module load cuda/12.2          # or cuda/12.4 — whichever is on Libra
module load python/3.12
# If your lab uses conda via module:
# module load anaconda3

# Activate conda environment
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate "$CONDA_ENV"

# Verify GPU
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
echo ""

# ---------------------------------------------------------------------------
# Create output directories
# ---------------------------------------------------------------------------
mkdir -p "$RESULTS_DIR" logs

# ---------------------------------------------------------------------------
# Run classification
# ---------------------------------------------------------------------------
python "$PROJECT_DIR/scripts/classify_fasta_cluster.py" \
    --fasta        "$FASTA_IN" \
    --output       "$RESULTS_DIR/classified_$(date +%Y%m%d_%H%M%S).csv" \
    --batch-size   8 \
    --threshold    -2.5 \
    --max-length   8192 \
    --save-embeddings

# ---------------------------------------------------------------------------
# Optional: copy results back to home directory
# ---------------------------------------------------------------------------
# cp -r "$RESULTS_DIR" "$HOME/results_$(date +%Y%m%d)"

echo ""
echo "Finished: $(date)"

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------
# sbatch scripts/libra_submit.sh
#
# Monitor:
#   squeue -u $USER
#   tail -f logs/baio_classify_<JOBID>.out
#
# Cancel:
#   scancel <JOBID>
# ---------------------------------------------------------------------------
