# Evo2 Model Setup via NVIDIA Hosted API

## Overview
Evo2 is a state-of-the-art DNA language model for genome modeling and long-context sequence generation, supporting up to **1 million base pairs**.  
The model can be accessed via the **NVIDIA Hosted API**, enabling:

- Sequence generation  
- Likelihood scoring  
- Variant effect prediction  
- DNA embeddings  

All directly from Python — no local installation required.

---

## Prerequisites
- **NVIDIA Hosted API Key**: Required to authenticate API requests.  
- **Python 3.7+**  
- **requests** library:  
  ```bash
  pip install requests
  ```

---

## Configuration
1. Obtain your NVIDIA API key (“Run Key”) from the NVIDIA NIM or Hosted API platform.  
2. Set the API key as an environment variable in your shell:

   ```bash
   export NVCF_RUN_KEY=<your-key-here>
   ```

   Alternatively, you can set the variable inside your Python code, but storing it in your environment is recommended for security.

---

## Evo2 Client Usage
The Evo2 model is accessed via a dedicated client (`Evo2Client`) in the **llm_clients** module.

### Initialization
```python
from llm_clients.evo2_client import Evo2Client

client = Evo2Client()
```
The `Evo2Client` reads the API key from the environment and sets up the endpoint for **Evo2-40b** hosted by NVIDIA.

---

### Generating DNA Sequence
```python
response = client.chat(
    sequence="ACGT",        # DNA sequence prompt
    temperature=0.5,        # Sampling temperature (optional)
    max_tokens=400          # Number of tokens to generate (optional)
)
print(response.content)     # Generated DNA sequence
print(response.latency_s)   # Request latency (seconds)
```

**Parameters:**
- `sequence (str)`: The DNA prompt for generation/modeling.  
- `temperature (float)`: Controls randomness (default `0.3`).  
- `max_tokens (int)`: Number of output tokens (default `1000`).  

---

## What Can Evo2 Do Through This API?
- **DNA Sequence Generation**: Produces realistic DNA sequences based on input prompts.  
- **Likelihood Scoring**: Estimates the likelihood of nucleotide sequences.  
- **Variant Effect Prediction**: Predicts effects of genome variants (see example notebooks in the main Evo2 repo).  
- **Embeddings**: Returns vector representations of DNA for downstream ML tasks.  
- **Massive Context Support**: Handles up to **1 million bases per request** using Evo2-40b.  

---

## References
- [ArcInstitute/Evo2 GitHub](https://github.com/ArcInstitute/Evo2)  
- [NVIDIA NIM Evo2 Docs](https://developer.nvidia.com/nim)  
- `llm_clients/evo2_client.py` and `llm_clients/types.py` in this repository  

---

## Troubleshooting
- **API Key Missing**: If you forget to set `NVCF_RUN_KEY`, initialization or requests will fail.  
- **Latency**: Typical requests resolve within seconds; latency is included in responses.  
- **Sequence Limits**: Evo2-40b supports very long sequences, but requests may be slower for high context sizes.  
