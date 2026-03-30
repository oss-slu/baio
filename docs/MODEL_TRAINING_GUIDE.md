# Model Training & Accuracy Improvement Guide

## Overview

This guide provides comprehensive strategies for improving the accuracy of BAIO's binary classification models used to distinguish between viral and host DNA sequences. The current implementation uses scikit-learn pipelines with k-mer features, TF-IDF vectorization, and multiple classifier options (Random Forest, SVM, MLP, and Evo2 embeddings).

---

## Current Architecture

### Training Pipeline

```
DNA Sequences → K-mer Extraction (k=6) → TF-IDF Vectorization → Classifier
```

### Supported Classifiers
- **Random Forest** - Ensemble learning with k-mer features
- **Support Vector Machine (SVM)** - Classical ML with TF-IDF vectorization
- **Multi-Layer Perceptron (MLP)** - Neural network approach
- **Evo2 Embedder** - Large language model-based embeddings (7B or 40B parameters)

### Current Configuration
- **K-mer size**: k=6 (default, configurable)
- **Train/Test split**: 80/20 (stratified)
- **Feature vectorization**: TF-IDF
- **Evaluation metrics**: Accuracy, Precision, Recall, F1-Score, ROC-AUC

### Relevant Code Files
- **Main training**: [metaseq/train.py](../metaseq/train.py)
- **Feature extraction**: [binary_classifiers/transformers/kmers_transformer.py](../binary_classifiers/transformers/kmers_transformer.py)
- **Models**: [metaseq/models.py](../metaseq/models.py)
- **Configuration**: [configs/binary_classifier.yaml](../configs/binary_classifier.yaml)
- **Evaluation**: [binary_classifiers/evaluation.py](../binary_classifiers/evaluation.py)
- **Data I/O**: [metaseq/dataio.py](../metaseq/dataio.py)

---

## 1. Feature Engineering Improvements

Feature engineering is critical for model performance. Better features lead to better predictive power.

### 1.1 K-mer Size Optimization

The current implementation uses k=6 (hexamers). Experimenting with different k values can significantly impact performance.

**Strategy:**
- Test k values: 4, 5, 6, 7, 8
- k=4: Captures short patterns, more features, faster to compute
- k=6: Current default, balanced trade-off
- k=8: Captures longer patterns, fewer features, more specific

**Implementation:**
```python
# Modify binary_classifiers/transformers/kmers_transformer.py
# or configs/binary_classifier.yaml

# Test different k-mer sizes
for k in [4, 5, 6, 7, 8]:
    config['model']['params']['k'] = k
    model, metrics = train_from_config(config)
    print(f"K={k}: F1-Score={metrics['f1_score']}")
```

**Expected outcome:** 2-5% improvement in F1-score by finding optimal k value for your dataset

---

### 1.2 Multi-K Features

Instead of using a single k-mer size, combine features from multiple k values.

**Rationale:**
- Small k values (4, 5) capture common subsequences
- Large k values (7, 8) capture specific patterns
- Combination captures phenomena at multiple scales

**Implementation:**
```python
# Create a custom transformer that combines multiple k values
from sklearn.pipeline import FeatureUnion

def build_multi_k_pipeline(k_values=[4, 5, 6, 7]):
    transformers = [
        (f'kmers_k{k}', KmerTransformer(k=k))
        for k in k_values
    ]
    feature_union = FeatureUnion(transformers)
    return Pipeline([
        ('features', feature_union),
        ('tfidf', TfidfVectorizer()),
        ('svm', SVC(probability=True, kernel='rbf'))
    ])
```

**Expected outcome:** 5-10% improvement with minimal computational overhead

---

### 1.3 Advanced Vectorization

Replace or supplement TF-IDF with more sophisticated embeddings.

#### Option A: Word2Vec/FastText Embeddings

```python
from gensim.models import Word2Vec, FastText

# Train embeddings on k-mers
kmers = [extract_kmers(seq, k=6) for seq in sequences]
w2v_model = Word2Vec(kmers, vector_size=100, window=5, min_count=1)

# Use embeddings as features
def seq_to_embedding(seq, model):
    kmers = extract_kmers(seq, k=6)
    vectors = [model.wv[kmer] for kmer in kmers if kmer in model.wv]
    return np.mean(vectors, axis=0)  # Average pooling
```

**Advantages:**
- Captures semantic relationships between k-mers
- Smaller feature space than one-hot encoding
- Transfer learning capabilities

#### Option B: Position-Aware Features

```python
def extract_position_aware_kmers(seq, k=6):
    """K-mers with position weights (beginning, middle, end of sequence)"""
    kmers = extract_kmers(seq, k=k)
    positions = np.linspace(0, 1, len(kmers))
    
    # Weight k-mers based on position (viral patterns may be biased)
    return [(kmer, pos) for kmer, pos in zip(kmers, positions)]
```

**Expected outcome:** 3-8% improvement (depends on whether patterns are position-specific)

---

## 2. Dataset Quality & Augmentation

The quality and quantity of training data directly determines model accuracy.

### 2.1 Data Expansion

**Current Status:** Training data appears limited (covid_reads5.fasta, human_reads5.fasta)

**Action Items:**
1. **Collect more sequences**
   - Use public databases: NCBI GenBank, SRA (Sequence Read Archive)
   - Ensure diverse viral and host representatives
   - Target: Minimum 10,000 sequences per class (more is better)

2. **Source diversity**
   - Multiple viral species (not just COVID-19)
   - Multiple host species (not just human)
   - Different sequencing platforms (Illumina, Oxford Nanopore, PacBio)
   - Different read lengths and quality levels

**Impact:** More diverse data typically yields 10-20% improvement in generalization

---

### 2.2 Data Augmentation

Augment existing sequences while preserving biological meaning.

#### Strategy 1: Reverse Complement Augmentation

Every DNA sequence has a complementary strand. Augmenting with reverse complements doubles training data.

```python
def reverse_complement(seq):
    """Generate reverse complement of DNA sequence"""
    complement = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G', 'N': 'N'}
    return ''.join(complement[base] for base in seq[::-1])

def augment_with_reverse_complement(sequences, labels):
    """Augment dataset with reverse complements"""
    aug_sequences = sequences + [reverse_complement(seq) for seq in sequences]
    aug_labels = labels + labels  # Same labels for reverse complements
    return aug_sequences, aug_labels
```

**Expected outcome:** 2-5% improvement (free data augmentation)

#### Strategy 2: Subsequence Extraction

```python
def augment_with_subsequences(sequences, labels, window_size=100, stride=50):
    """Extract overlapping subsequences from longer reads"""
    aug_sequences = []
    aug_labels = []
    
    for seq, label in zip(sequences, labels):
        if len(seq) > window_size:
            for start in range(0, len(seq) - window_size, stride):
                aug_sequences.append(seq[start:start + window_size])
                aug_labels.append(label)
        else:
            aug_sequences.append(seq)
            aug_labels.append(label)
    
    return aug_sequences, aug_labels
```

**Expected outcome:** 3-7% improvement (trades off sequence length for data quantity)

#### Strategy 3: Controlled Mutation Augmentation

```python
import random

def mutate_sequence(seq, mutation_rate=0.02):
    """Introduce random mutations (1-2% of bases)"""
    nucleotides = ['A', 'T', 'G', 'C']
    seq_list = list(seq)
    
    for i in range(len(seq_list)):
        if random.random() < mutation_rate:
            seq_list[i] = random.choice(nucleotides)
    
    return ''.join(seq_list)

def augment_with_mutations(sequences, labels, n_augmentations=2, mutation_rate=0.02):
    """Create mutated copies of sequences for augmentation"""
    aug_sequences = sequences.copy()
    aug_labels = labels.copy()
    
    for _ in range(n_augmentations):
        mutated = [mutate_sequence(seq, mutation_rate) for seq in sequences]
        aug_sequences.extend(mutated)
        aug_labels.extend(labels)
    
    return aug_sequences, aug_labels
```

**Expected outcome:** 2-5% improvement (simulates sequencing noise)

---

### 2.3 Data Quality Assurance

#### Remove Low-Quality Sequences
```python
def filter_low_quality_sequences(sequences, labels, min_length=30, max_ambiguous=0.1):
    """Remove sequences below quality threshold"""
    filtered_seqs = []
    filtered_labels = []
    
    for seq, label in zip(sequences, labels):
        # Length check
        if len(seq) < min_length:
            continue
        
        # Ambiguous base check (N's)
        ambiguous_count = seq.count('N')
        if ambiguous_count / len(seq) > max_ambiguous:
            continue
        
        # Valid nucleotides only
        if not all(base in 'ATGCN' for base in seq):
            continue
        
        filtered_seqs.append(seq)
        filtered_labels.append(label)
    
    return filtered_seqs, filtered_labels
```

#### Balance Classes
```python
from sklearn.utils import shuffle

def balance_dataset(sequences, labels):
    """Ensure equal representation of both classes"""
    unique_labels = list(set(labels))
    min_class_count = min(sum(1 for l in labels if l == ulab) for ulab in unique_labels)
    
    balanced_seqs = []
    balanced_labels = []
    
    for label in unique_labels:
        indices = [i for i, l in enumerate(labels) if l == label]
        selected_indices = random.sample(indices, min_class_count)
        
        balanced_seqs.extend([sequences[i] for i in selected_indices])
        balanced_labels.extend([label for _ in selected_indices])
    
    return shuffle(balanced_seqs, balanced_labels)
```

#### Remove Duplicates
```python
def remove_duplicates(sequences, labels):
    """Remove duplicate sequences (prevents data leakage)"""
    seen = set()
    unique_seqs = []
    unique_labels = []
    
    for seq, label in zip(sequences, labels):
        if seq not in seen:
            seen.add(seq)
            unique_seqs.append(seq)
            unique_labels.append(label)
    
    return unique_seqs, unique_labels
```

**Expected outcome:** 3-8% improvement from cleaner, more representative data

---

## 3. Model Architecture Improvements

### 3.1 Ensemble Methods

Combine multiple models to leverage their individual strengths.

#### Voting Classifier

```python
from sklearn.ensemble import VotingClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier

def build_ensemble_pipeline():
    """Create ensemble of multiple classifiers"""
    
    # Individual pipelines for each classifier
    rf_pipeline = Pipeline([
        ('kmers', KmerTransformer(k=6)),
        ('tfidf', TfidfVectorizer(max_features=5000)),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    svm_pipeline = Pipeline([
        ('kmers', KmerTransformer(k=6)),
        ('tfidf', TfidfVectorizer(max_features=5000)),
        ('clf', SVC(kernel='rbf', C=10, probability=True, random_state=42))
    ])
    
    mlp_pipeline = Pipeline([
        ('kmers', KmerTransformer(k=6)),
        ('tfidf', TfidfVectorizer(max_features=5000)),
        ('clf', MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=42))
    ])
    
    # Voting ensemble
    ensemble = VotingClassifier(
        estimators=[
            ('rf', rf_pipeline),
            ('svm', svm_pipeline),
            ('mlp', mlp_pipeline)
        ],
        voting='soft'  # Use probability predictions
    )
    
    return ensemble
```

**Expected outcome:** 5-15% improvement by combining diverse model perspectives

#### Stacking Ensemble

```python
from sklearn.ensemble import StackingClassifier

def build_stacking_ensemble():
    """Create stacking ensemble with meta-classifier"""
    
    base_learners = [
        ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
        ('svm', SVC(kernel='rbf', C=10, probability=True, random_state=42)),
        ('mlp', MLPClassifier(hidden_layer_sizes=(100,), max_iter=500, random_state=42))
    ]
    
    meta_learner = LogisticRegression(random_state=42)
    
    stacking = StackingClassifier(
        estimators=base_learners,
        final_estimator=meta_learner,
        cv=5
    )
    
    return Pipeline([
        ('kmers', KmerTransformer(k=6)),
        ('tfidf', TfidfVectorizer(max_features=5000)),
        ('ensemble', stacking)
    ])
```

**Expected outcome:** 8-15% improvement with more sophisticated ensemble

---

### 3.2 Leverage Evo2 Embedder

Your codebase includes an advanced Evo2 large language model for generating sequence embeddings.

#### Current Integration

Evo2 is already integrated in [binary_classifiers/evo2_embedder.py](../binary_classifiers/evo2_embedder.py) with fallback to Random Forest.

#### Usage

```python
from binary_classifiers.evo2_embedder import Evo2Embedder

# Initialize Evo2 embedder
embedder = Evo2Embedder(model_size='7b')  # or '40b' for better accuracy

# Generate embeddings for sequences
embeddings = embedder.embed(sequences)

# Train classifier on Evo2 embeddings
from sklearn.svm import SVC

classifier = SVC(kernel='rbf', probability=True)
classifier.fit(embeddings, labels)
```

**Advantages:**
- 7B or 40B parameter models trained on vast genomic data
- Captures biological meaning beyond k-mers
- GPU-accelerated inference

**Requirements:**
- 16GB VRAM for 7B model
- 80GB VRAM for 40B model

**Expected outcome:** 15-30% improvement (state-of-the-art embeddings)

---

### 3.3 Advanced Classifier Options

#### Gradient Boosting (XGBoost)

```python
from xgboost import XGBClassifier

def build_xgboost_pipeline():
    """Create pipeline with XGBoost classifier"""
    return Pipeline([
        ('kmers', KmerTransformer(k=6)),
        ('tfidf', TfidfVectorizer(max_features=5000)),
        ('xgb', XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            tree_method='gpu_hist'  # GPU acceleration if available
        ))
    ])
```

**Advantages:**
- Often outperforms Random Forest
- Built-in feature importance
- Fast training and inference

**Expected outcome:** 5-10% improvement over Random Forest

#### Deep Learning with PyTorch

```python
import torch
import torch.nn as nn

class DNAClassifier(nn.Module):
    """Deep neural network for DNA sequence classification"""
    
    def __init__(self, input_dim=5000, hidden_dim=256):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.dropout1 = nn.Dropout(0.3)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim // 2)
        self.dropout2 = nn.Dropout(0.3)
        self.fc3 = nn.Linear(hidden_dim // 2, 2)  # Binary classification
        
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.dropout1(x)
        x = torch.relu(self.fc2(x))
        x = self.dropout2(x)
        x = self.fc3(x)
        return x
```

**Advantages:**
- Highly flexible architecture
- Can learn complex patterns
- Transfer learning from pre-trained models

**Expected outcome:** 10-20% improvement with proper training

---

## 4. Hyperparameter Tuning

Systematic hyperparameter optimization can yield significant improvements.

### 4.1 Grid Search

```python
from sklearn.model_selection import GridSearchCV

def tune_svm_hyperparameters(X_train, y_train):
    """Find optimal SVM hyperparameters"""
    
    pipeline = Pipeline([
        ('kmers', KmerTransformer(k=6)),
        ('tfidf', TfidfVectorizer()),
        ('svm', SVC())
    ])
    
    param_grid = {
        'tfidfvectorizer__max_features': [1000, 5000, 10000],
        'tfidfvectorizer__min_df': [1, 2, 5],
        'tfidfvectorizer__max_df': [0.8, 0.9, 0.95],
        'svc__C': [0.1, 1, 10, 100],
        'svc__gamma': ['scale', 'auto', 0.001, 0.01],
        'svc__kernel': ['rbf', 'linear', 'poly']
    }
    
    grid_search = GridSearchCV(
        pipeline, 
        param_grid, 
        cv=5, 
        scoring='f1',
        n_jobs=-1,  # Use all cores
        verbose=2
    )
    
    grid_search.fit(X_train, y_train)
    
    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best F1-score: {grid_search.best_score_}")
    
    return grid_search.best_estimator_
```

### 4.2 Random Search

For large parameter spaces, random search is more efficient:

```python
from sklearn.model_selection import RandomizedSearchCV

def tune_with_random_search(X_train, y_train):
    """Random search for hyperparameter tuning"""
    
    pipeline = Pipeline([
        ('kmers', KmerTransformer(k=6)),
        ('tfidf', TfidfVectorizer()),
        ('rf', RandomForestClassifier())
    ])
    
    param_dist = {
        'tfidfvectorizer__max_features': [500, 1000, 5000, 10000],
        'tfidfvectorizer__min_df': [1, 2, 5],
        'rf__n_estimators': [50, 100, 200, 500],
        'rf__max_depth': [5, 10, 20, None],
        'rf__min_samples_split': [2, 5, 10],
        'rf__min_samples_leaf': [1, 2, 4]
    }
    
    random_search = RandomizedSearchCV(
        pipeline,
        param_dist,
        n_iter=20,
        cv=5,
        scoring='f1',
        n_jobs=-1,
        random_state=42,
        verbose=2
    )
    
    random_search.fit(X_train, y_train)
    
    return random_search.best_estimator_
```

### 4.3 Key Parameters by Classifier

#### TF-IDF Vectorizer
- `max_features`: 1000-10000 (higher = more features, slower)
- `min_df`: 1-5 (minimum document frequency)
- `max_df`: 0.8-0.95 (maximum document frequency, remove too-common terms)
- `ngram_range`: (1,1) to (1,3) (unigrams vs bigrams/trigrams)

#### SVM
- `C`: 0.1-100 (regularization strength, higher = stricter)
- `kernel`: 'linear', 'rbf', 'poly' (rbf usually best)
- `gamma`: 'scale', 'auto', 0.001-0.1 (kernel coefficient)

#### Random Forest
- `n_estimators`: 50-500 (more trees = better but slower)
- `max_depth`: 5-30 (prevent overfitting)
- `min_samples_split`: 2-10 (minimum samples to split node)
- `min_samples_leaf`: 1-5 (minimum samples in leaf)

#### MLP Neural Network
- `hidden_layer_sizes`: (50,), (100, 50), (200, 100, 50) (architecture)
- `learning_rate`: 0.001-0.1 (step size for optimization)
- `alpha`: 0.0001-0.01 (L2 regularization)
- `max_iter`: 300-1000 (training iterations)

**Expected outcome:** 5-15% improvement by finding optimal parameter combinations

---

## 5. Training & Validation Strategy

### 5.1 K-Fold Cross-Validation

Replace simple train/test split with k-fold cross-validation:

```python
from sklearn.model_selection import cross_validate

def evaluate_with_cross_validation(pipeline, X, y, cv=5):
    """Evaluate model using k-fold cross-validation"""
    
    scoring = {
        'accuracy': 'accuracy',
        'precision': 'precision',
        'recall': 'recall',
        'f1': 'f1',
        'roc_auc': 'roc_auc'
    }
    
    scores = cross_validate(
        pipeline, 
        X, y,
        cv=cv,
        scoring=scoring,
        return_train_score=True
    )
    
    print("Cross-Validation Results:")
    for metric, values in scores.items():
        print(f"{metric}: {values['test_' + metric.split('_')[0]].mean():.4f} "
              f"(+/- {values['test_' + metric.split('_')[0]].std():.4f})")
    
    return scores
```

**Advantages:**
- More robust performance estimates
- Better utilization of limited data
- Detects overfitting (large train/test gap)

**Expected outcome:** More reliable model assessment

### 5.2 Stratified Train/Test Split

Ensure balanced class distribution:

```python
from sklearn.model_selection import train_test_split

def stratified_split(sequences, labels, test_size=0.2):
    """Stratified train/test split ensuring class balance"""
    
    X_train, X_test, y_train, y_test = train_test_split(
        sequences, labels,
        test_size=test_size,
        stratify=labels,  # Maintain class proportions
        random_state=42
    )
    
    return X_train, X_test, y_train, y_test
```

### 5.3 Class Weighting

Handle imbalanced datasets automatically:

```python
# For imbalanced classes, use class_weight
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier

# SVM with balanced class weights
svm = SVC(kernel='rbf', class_weight='balanced', probability=True)

# Random Forest with balanced class weights
rf = RandomForestClassifier(class_weight='balanced', n_estimators=100)
```

**Expected outcome:** 5-10% improvement if classes are imbalanced

### 5.4 Validation Curves

Diagnose bias-variance trade-off:

```python
from sklearn.model_selection import validation_curve
import matplotlib.pyplot as plt

def plot_validation_curve(pipeline, X, y, param_name, param_range):
    """Plot training vs validation performance as hyperparameter varies"""
    
    train_scores, val_scores = validation_curve(
        pipeline, X, y,
        param_name=param_name,
        param_range=param_range,
        cv=5,
        scoring='f1'
    )
    
    train_mean = train_scores.mean(axis=1)
    train_std = train_scores.std(axis=1)
    val_mean = val_scores.mean(axis=1)
    val_std = val_scores.std(axis=1)
    
    plt.figure(figsize=(10, 6))
    plt.plot(param_range, train_mean, label='Training score', marker='o')
    plt.fill_between(param_range, train_mean - train_std, train_mean + train_std, alpha=0.2)
    plt.plot(param_range, val_mean, label='Validation score', marker='s')
    plt.fill_between(param_range, val_mean - val_std, val_mean + val_std, alpha=0.2)
    plt.xlabel(param_name)
    plt.ylabel('F1-Score')
    plt.legend()
    plt.show()
```

---

## 6. Implementation Priority

### Phase 1: Quick Wins (Weeks 1-2)

1. **Increase training data**
   - Collect more sequences from public databases
   - Target: 2-3x current dataset size
   - Expected improvement: +10-20%

2. **K-mer size tuning**
   - Test k=4, 5, 6, 7, 8
   - Single parameter optimization
   - Expected improvement: +2-5%

3. **Class balancing**
   - Apply `class_weight='balanced'` to classifiers
   - Add stratified cross-validation
   - Expected improvement: +3-8%

### Phase 2: Medium Effort (Weeks 3-4)

4. **Data augmentation**
   - Implement reverse complement augmentation
   - Add quality filtering
   - Expected improvement: +3-10%

5. **Hyperparameter tuning**
   - Grid or random search on SVM/RF parameters
   - Focus on TF-IDF and classifier parameters
   - Expected improvement: +5-15%

6. **Feature engineering**
   - Try position-aware k-mers
   - Experiment with multi-k features
   - Expected improvement: +3-8%

### Phase 3: Maximum Accuracy (Weeks 5-8)

7. **Ensemble methods**
   - Combine RF + SVM + MLP
   - Implement voting or stacking
   - Expected improvement: +8-15%

8. **Evo2 embeddings**
   - Leverage existing Evo2 integration
   - Combine with traditional classifiers
   - Expected improvement: +15-30%

9. **Advanced models**
   - Try XGBoost or LightGBM
   - Experiment with deep learning
   - Expected improvement: +10-20%

---

## 7. Monitoring & Validation

### 7.1 Key Metrics to Track

Your evaluation pipeline ([binary_classifiers/evaluation.py](../binary_classifiers/evaluation.py)) already tracks these, but ensure monitoring includes:

**Primary Metrics:**
- **F1-Score**: Balanced measure of precision and recall
- **ROC-AUC**: Threshold-independent performance assessment
- **Precision**: Important when false positives are costly
- **Recall**: Important when false negatives are costly

**Secondary Metrics:**
- **Confusion Matrix**: Detailed breakdown of true/false positives/negatives
- **Per-Class Metrics**: Identify if one class is harder to classify
- **Accuracy**: Overall correctness rate

### 7.2 Performance Tracking Template

Create a tracking spreadsheet for each training run:

```
Date | K-Value | Model | Features | Data Size | F1-Score | ROC-AUC | Notes
--------------------------------------------------------------------------
...
```

### 7.3 Error Analysis

Systematically analyze misclassifications:

```python
def analyze_errors(model, X_test, y_test):
    """Analyze and categorize classification errors"""
    
    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)
    
    errors = []
    for i, (true, pred) in enumerate(zip(y_test, predictions)):
        if true != pred:
            confidence = max(probabilities[i])
            errors.append({
                'sequence': X_test[i],
                'true_label': true,
                'predicted_label': pred,
                'confidence': confidence,
                'sequence_length': len(X_test[i])
            })
    
    # Group errors by characteristics
    low_confidence = [e for e in errors if e['confidence'] < 0.7]
    short_sequences = [e for e in errors if e['sequence_length'] < 50]
    
    print(f"Total errors: {len(errors)}")
    print(f"Low confidence errors: {len(low_confidence)}")
    print(f"Short sequence errors: {len(short_sequences)}")
    
    return errors
```

### 7.4 Iterative Improvement Loop

1. **Establish baseline** (current F1-score)
2. **Implement improvement strategy**
3. **Measure impact** on key metrics
4. **Analyze failures** and error patterns
5. **Identify next bottleneck**
6. **Repeat steps 2-5**

---

## 8. Quick Reference: Expected Improvements

| Strategy | Implementation Time | Expected Improvement | Difficulty |
|----------|-------------------|----------------------|------------|
| More training data | Days-Weeks | 10-20% | Easy |
| K-mer optimization | Hours | 2-5% | Easy |
| Class balancing | Hours | 3-8% | Easy |
| Data augmentation | Days | 3-10% | Easy |
| Hyperparameter tuning | Days-Weeks | 5-15% | Medium |
| Feature engineering | Weeks | 3-8% | Medium |
| Ensemble methods | Days-Weeks | 8-15% | Medium |
| Evo2 embeddings | Days | 15-30% | Medium |
| Advanced models (XGB, DL) | Weeks | 10-20% | Hard |
| Transformer models | Weeks | 20-30% | Hard |

---

## 9. Resources

### Documentation Links
- [metaseq/train.py](../metaseq/train.py) - Main training script
- [binary_classifiers/evaluation.py](../binary_classifiers/evaluation.py) - Evaluation metrics
- [configs/binary_classifier.yaml](../configs/binary_classifier.yaml) - Configuration
- [tests/test_metaseq_train.py](../tests/test_metaseq_train.py) - Training tests

### Scientific References
- **K-mer feature importance**: https://academic.oup.com/bioinformatics/article/33/2/161/2525686
- **DNA sequence classification**: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6129267/
- **Ensemble methods**: https://scikit-learn.org/stable/modules/ensemble.html
- **Hyperparameter optimization**: https://scikit-learn.org/stable/modules/grid_search.html

### External Datasets
- **NCBI GenBank**: https://www.ncbi.nlm.nih.gov/genbank/
- **SRA (Sequence Read Archive)**: https://www.ncbi.nlm.nih.gov/sra
- **Kaggle Genomics**: https://www.kaggle.com/datasets?q=genomics
- **GitHub genomics datasets**: Search for "viral sequences" or "host sequences"

---

## 10. Troubleshooting Common Issues

### Issue: Model accuracy plateaus
**Solutions:**
1. Collect more diverse training data
2. Try Evo2 embeddings for better feature representation
3. Verify data quality and remove duplicates
4. Use ensemble methods to combine model strengths

### Issue: Overfitting (high train accuracy, low test accuracy)
**Solutions:**
1. Reduce model complexity (smaller hidden layers, lower n_estimators)
2. Increase regularization (higher C for SVM, more dropout)
3. Add more training data
4. Use cross-validation for better assessment

### Issue: Underfitting (both train and test accuracies low)
**Solutions:**
1. Increase model complexity
2. Reduce regularization
3. Engineer better features (try Evo2, positional features)
4. Increase training iterations/epochs

### Issue: Class imbalance (one class much rarer)
**Solutions:**
1. Use `class_weight='balanced'`
2. Oversample minority class or undersample majority class
3. Use stratified cross-validation
4. Focus on F1-score rather than accuracy

---

## 11. Success Checklist for Iteration 2

- [ ] Expanded training dataset (at least 2x current size)
- [ ] K-mer size tuning (tested k=4-8)
- [ ] Class balancing implemented
- [ ] Basic hyperparameter tuning completed
- [ ] Data augmentation pipeline added
- [ ] Ensemble model tested
- [ ] Model F1-score improved by ≥5% vs Iteration 1
- [ ] Evaluation metrics documented and tracked
- [ ] Error analysis completed
- [ ] Documentation updated with new approaches

---

For questions or contributions to this guide, please contact the ML team or submit a pull request.
