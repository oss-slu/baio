# BAIO Architecture

This document reflects the current code path in the repository, not older project descriptions. The production system today is a web app with a React frontend, a FastAPI backend, and a classical ML inference layer based on k-mer features plus saved scikit-learn models.

## 1. High-Level System Architecture

```mermaid
flowchart LR
    U[Researcher / Analyst] --> B[Browser]

    subgraph FE[Frontend]
        APP[React + Vite SPA<br/>frontend/src/App.tsx]
        H[Header + health + chat UI]
        SI[SequenceInput<br/>paste FASTA / upload file]
        CP[ConfigPanel<br/>thresholds / model controls]
        RD[ResultsDashboard<br/>tables / risk / exports]
        APP --> H
        APP --> SI
        APP --> CP
        APP --> RD
    end

    subgraph API[Backend API]
        FASTAPI[FastAPI app<br/>api/main.py]
        VAL[DNA validation<br/>length / charset / GC / AT rules]
        POST[Post-processing<br/>confidence / uncertainty / heuristic OOD / explanation]
        CHAT[LLM chat adapter<br/>api/llm_client.py]
    end

    subgraph ML[Inference Layer]
        PRED[PredictClass<br/>binary_classifiers/predict_class.py]
        KMER[KmerTransformer<br/>6-mer tokenization]
        VEC[Saved vectorizer<br/>.pkl artifact]
        MOD[Saved model<br/>RandomForest or SVM]
    end

    subgraph EXT[External Services]
        OR[OpenRouter chat API]
    end

    B --> APP
    APP -->|GET /health| FASTAPI
    APP -->|POST /classify| FASTAPI
    APP -->|POST /chat| FASTAPI

    FASTAPI --> VAL
    VAL --> PRED
    PRED --> KMER
    KMER --> VEC
    VEC --> MOD
    MOD --> POST
    POST --> FASTAPI

    FASTAPI --> CHAT
    CHAT --> OR

    FASTAPI -->|JSON response| APP
```

## 2. Production Classification Request Flow

```mermaid
flowchart TD
    A[User submits FASTA text or file] --> B[frontend/src/App.tsx parses FASTA]
    B --> C[POST /classify]
    C --> D[api/main.py validates each sequence]
    D --> E[Select model<br/>RandomForest or SVM]
    E --> F[PredictClass loads cached artifacts]
    F --> G[Convert DNA to overlapping 6-mers]
    G --> H[Vectorizer transforms k-mers to numeric features]
    H --> I[scikit-learn model predicts Host or Virus]
    I --> J[Compute confidence]
    J --> K[Apply threshold]
    K --> L[Optional heuristic novelty flag<br/>ood_score = 1 - confidence]
    L --> M[Add GC content, organism hint, explanation]
    M --> N[Return ClassificationResponse JSON]
    N --> O[ResultsDashboard renders counts, risk, exports]
```

## 3. Training And Research Architecture

```mermaid
flowchart LR
    subgraph PROD[Production Artifact Path]
        DATA[data/*.fasta]
        RETRAIN[retrain_model.py]
        KM1[KmerTransformer]
        CV[CountVectorizer]
        CLS[RandomForest / SVM training]
        ART[(binary_classifiers/models + transformers)]

        DATA --> RETRAIN
        RETRAIN --> KM1 --> CV --> CLS --> ART
    end

    subgraph EXP[Experimental / metaseq Path]
        CFG[configs/binary_classifier.yaml]
        SEQ[CSV or FASTA/FASTQ]
        DIO[metaseq/dataio.py]
        TRAIN[metaseq/train.py]
        PIPE[metaseq/models.py<br/>K-mers + TF-IDF + clf]
        W[(weights/binary_classifier.joblib)]

        CFG --> TRAIN
        SEQ --> DIO --> TRAIN
        TRAIN --> PIPE --> W
    end

    subgraph EVO[Foundation Model Experiments]
        EVO2[metaseq/evo2_client.py]
        NV[NVIDIA Evo2 hosted API]
        EVO2 --> NV
    end

    ART -->|loaded at runtime by API| PRODAPI[FastAPI classification path]
```

## 4. Repository Responsibilities

| Area | Responsibility | On production request path? |
|---|---|---|
| `frontend/` | Browser UI, FASTA input, controls, chat panel, results rendering | Yes |
| `api/` | REST endpoints, validation, orchestration, chat integration | Yes |
| `binary_classifiers/` | Production inference code and saved model/vectorizer artifacts | Yes |
| `metaseq/` | Experimental training/inference utilities and Evo2 integration | No, separate research path |
| `data_processing/` | Shared parsing/validation helpers | Not used by `api/main.py` today |
| `prompting/` | General LLM prompting utilities and comparisons | Not wired into the FastAPI request flow today |
| `scripts/` | Evaluation and metrics utilities | No |
| `tests/` | Unit and integration coverage | No |

## 5. Deployment View

```mermaid
flowchart TB
    DC[docker-compose.yml]

    DC --> FE[frontend container<br/>Nginx serves built React app<br/>port 4173 -> 80]
    DC --> API[api container<br/>Uvicorn + FastAPI<br/>port 8080]

    USER[User browser] --> FE
    FE -->|HTTP API calls| API
    API --> R[(runs_data volume)]
    API --> W[(weights_data volume)]
```

## 6. Presenter Notes

- BAIO is split into three layers: presentation, API orchestration, and ML inference.
- The current production classifier is classical ML, not the Evo2 research path.
- DNA flows through validation, 6-mer feature extraction, vectorization, then an SVM or RandomForest classifier.
- The "Novel" result is currently a heuristic OOD flag derived from low confidence, not a full open-set model.
- Chat is handled separately from classification through the `/chat` endpoint and an external LLM API.
- Training and experimentation are isolated from the user-facing inference path, which keeps deployment simpler.

## 7. Short Talk Track

Use this if you need a 30 to 45 second explanation:

> BAIO is organized as a three-layer system. The React frontend collects FASTA sequences and configuration from the user, then sends them to a FastAPI backend. The backend validates each DNA sequence and calls the production classifier, which converts sequences into 6-mers, vectorizes them, and runs a saved RandomForest or SVM model. The backend then adds confidence, uncertainty, and a heuristic novelty flag before returning the results to the dashboard. Separately, the repository also contains retraining scripts and a `metaseq` research pipeline for future models such as Evo2, but those are not the main production inference path today.
