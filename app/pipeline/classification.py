"""DNA classification pipeline implementation."""

import time
import random
from datetime import datetime
from typing import List, Tuple, Dict, Any
import streamlit as st
from app.components.status_display import update_processing_status


def run_classification_pipeline(
    sequences: List[Tuple[str, str]], source: str
) -> Dict[str, Any]:
    """
    Run the DNA classification pipeline.

    Args:
        sequences: List of (sequence_id, sequence) tuples
        source: Source description for the sequences

    Returns:
        Dictionary containing classification results
    """
    update_processing_status("Processing")

    # Initialize results structure
    results: Dict[str, Any] = {
        "total_sequences": len(sequences),
        "virus_count": 0,
        "host_count": 0,
        "novel_count": 0,
        "detailed_results": [],
        "source": source,
        "timestamp": datetime.now().isoformat(),
        "processing_time": 0,
    }

    start_time = time.time()

    # Create progress containers
    progress_container = st.container()
    status_container = st.container()

    with progress_container:
        progress_bar = st.progress(0)
        status_text = st.empty()

    try:
        for i, (seq_id, seq) in enumerate(sequences):
            # Update progress
            progress = (i + 1) / len(sequences)
            progress_bar.progress(progress)
            status_text.text(f"Processing sequence {i+1}/{len(sequences)}: {seq_id}")

            # Mock classification (replace with actual model inference)
            time.sleep(0.1)  # Simulate processing time

            # Get classification result
            result = classify_sequence(seq_id, seq)

            # Count classifications
            prediction = result["prediction"]
            if prediction == "Virus":
                results["virus_count"] = int(results["virus_count"]) + 1
            elif prediction == "Host":
                results["host_count"] = int(results["host_count"]) + 1
            else:
                results["novel_count"] = int(results["novel_count"]) + 1

            # Store detailed result
            results["detailed_results"].append(result)

        # Calculate processing time
        results["processing_time"] = time.time() - start_time

        # Store results in session state
        st.session_state.analysis_results = results
        update_processing_status("Complete")

        # Clear progress indicators
        progress_bar.empty()
        status_text.empty()

        with status_container:
            st.success(
                f"✅ Classification complete! Processed {len(sequences)} sequences in {results['processing_time']:.1f}s"
            )
            st.info("📊 View detailed results in the Results tab.")

        return results

    except Exception as e:
        update_processing_status("Error", error_msg=str(e))
        st.error(f"❌ Pipeline failed: {str(e)}")
        raise


def classify_sequence(seq_id: str, sequence: str) -> Dict[str, Any]:
    """
    Classify a single DNA sequence.

    Args:
        seq_id: Sequence identifier
        sequence: DNA sequence string

    Returns:
        Dictionary with classification results
    """
    # Mock classification logic - replace with actual model inference

    # Simulate different classification probabilities based on sequence characteristics
    gc_content = (sequence.count("G") + sequence.count("C")) / len(sequence)

    # Simple heuristic for demonstration
    if gc_content > 0.6:
        # High GC content - more likely to be viral
        predictions = ["Virus"] * 60 + ["Host"] * 30 + ["Novel"] * 10
    elif gc_content < 0.3:
        # Low GC content - more likely to be host
        predictions = ["Host"] * 70 + ["Virus"] * 20 + ["Novel"] * 10
    else:
        # Balanced GC content
        predictions = ["Virus"] * 40 + ["Host"] * 50 + ["Novel"] * 10

    prediction = random.choice(predictions)
    confidence = random.uniform(0.6, 0.95)

    # Generate additional metrics
    result = {
        "sequence_id": seq_id,
        "length": len(sequence),
        "gc_content": f"{gc_content:.3f}",
        "prediction": prediction,
        "confidence": f"{confidence:.3f}",
        "sequence_preview": sequence[:50] + "..." if len(sequence) > 50 else sequence,
    }

    # Add mock embedding metrics if novel detection is enabled
    model_config = st.session_state.get("model_config", {})
    if model_config.get("enable_ood", True):
        result.update(
            {
                "mahalanobis_distance": f"{random.uniform(1.0, 5.0):.3f}",
                "energy_score": f"{random.uniform(-5.0, -1.0):.3f}",
                "ood_score": f"{random.uniform(0.0, 1.0):.3f}",
            }
        )

    return result


def get_classification_summary(results: Dict[str, Any]) -> str:
    """
    Generate a text summary of classification results.

    Args:
        results: Results dictionary from classification pipeline

    Returns:
        Formatted summary string
    """
    total = results["total_sequences"]
    virus_pct = (results["virus_count"] / total * 100) if total > 0 else 0
    host_pct = (results["host_count"] / total * 100) if total > 0 else 0
    novel_pct = (results["novel_count"] / total * 100) if total > 0 else 0

    summary = f"""**BAIO Classification Summary**

**Input:** {results["source"]}
**Total Sequences:** {total}
**Processing Time:** {results.get("processing_time", 0):.1f}s

**Results:**
- 🦠 Virus: {results["virus_count"]} ({virus_pct:.1f}%)
- 🧬 Host: {results["host_count"]} ({host_pct:.1f}%)
- ❓ Novel/Unknown: {results["novel_count"]} ({novel_pct:.1f}%)

**Timestamp:** {results["timestamp"]}"""

    return summary
