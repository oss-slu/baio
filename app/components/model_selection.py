"""Model selection and configuration components."""

import streamlit as st
from typing import Dict, Any, cast


def model_selection_interface() -> Dict[str, Any]:
    """
    Model selection and configuration interface.

    Returns:
        Dictionary with model configuration settings
    """
    st.subheader("🤖 Model Configuration")

    # Model type selection
    model_type = st.selectbox(
        "Classification Type:",
        ["Binary (Virus vs Host)", "Multi-class (Detailed Taxonomy)"],
        help="Choose between binary classification or detailed taxonomic classification",
    )

    # Confidence threshold
    confidence_threshold = st.slider(
        "Confidence Threshold:",
        min_value=0.1,
        max_value=0.9,
        value=0.5,
        step=0.05,
        help="Minimum confidence score for predictions",
    )

    # Advanced settings
    with st.expander("⚙️ Advanced Settings"):
        batch_size = st.number_input(
            "Batch Size:", min_value=1, max_value=100, value=16
        )
        enable_ood = st.checkbox(
            "Enable Novel Detection", value=True, help="Detect unknown/novel sequences"
        )
        ood_threshold = st.slider("Novel Detection Sensitivity:", 0.1, 0.9, 0.3, 0.05)

    config = {
        "type": model_type,
        "confidence_threshold": confidence_threshold,
        "batch_size": batch_size,
        "enable_ood": enable_ood,
        "ood_threshold": ood_threshold,
    }

    # Store in session state
    st.session_state.model_config = config
    return config


def get_model_config() -> Dict[str, Any]:
    """Get current model configuration from session state."""
    default_config: Dict[str, Any] = {
        "type": "Binary (Virus vs Host)",
        "confidence_threshold": 0.5,
        "batch_size": 16,
        "enable_ood": True,
        "ood_threshold": 0.3,
    }
    return cast(Dict[str, Any], st.session_state.get("model_config", default_config))
