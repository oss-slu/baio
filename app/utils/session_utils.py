"""Session state management utilities."""

import streamlit as st
from datetime import datetime
from utils.llm_client import LLMClient, SYSTEM_PROMPTS


def initialize_session_state() -> None:
    """Initialize all session state variables."""
    # Chat-related session state
    if "messages" not in st.session_state:
        st.session_state.messages = []

    if "llm_client" not in st.session_state:
        st.session_state.llm_client = LLMClient()

    if "system_prompt" not in st.session_state:
        st.session_state.system_prompt = SYSTEM_PROMPTS["default"]

    if "conversation_id" not in st.session_state:
        st.session_state.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")

    if "error_count" not in st.session_state:
        st.session_state.error_count = 0

    # Processing-related session state
    if "processing_status" not in st.session_state:
        st.session_state.processing_status = "Ready"

    if "progress" not in st.session_state:
        st.session_state.progress = 0

    if "current_step" not in st.session_state:
        st.session_state.current_step = ""

    # Model configuration
    if "model_config" not in st.session_state:
        st.session_state.model_config = {
            "type": "Binary (Virus vs Host)",
            "confidence_threshold": 0.5,
            "batch_size": 16,
            "enable_ood": True,
            "ood_threshold": 0.3
        }

    # Results storage
    if "analysis_results" not in st.session_state:
        st.session_state.analysis_results = None


def reset_session_state() -> None:
    """Reset all session state variables to defaults."""
    keys_to_keep = ["model_config"]  # Keep some settings
    
    for key in list(st.session_state.keys()):
        if key not in keys_to_keep:
            del st.session_state[key]
    
    initialize_session_state()


def get_session_info() -> dict:
    """Get information about current session state."""
    return {
        "messages_count": len(st.session_state.get("messages", [])),
        "conversation_id": st.session_state.get("conversation_id", ""),
        "processing_status": st.session_state.get("processing_status", "Ready"),
        "has_results": st.session_state.get("analysis_results") is not None,
        "model_config": st.session_state.get("model_config", {}),
        "error_count": st.session_state.get("error_count", 0)
    }