"""Main Streamlit application for BAIO DNA classification pipeline."""

import streamlit as st
from dotenv import load_dotenv  # type: ignore

# Import modular components
from app.utils.session_utils import initialize_session_state
from app.components.input_forms import (
    input_method_selector,
    sequence_text_input,
    sequence_file_upload,
    batch_sequence_upload,
)
from app.components.model_selection import model_selection_interface
from app.components.status_display import processing_status_display
from app.components.sidebar import chat_sidebar
from app.pipeline.classification import run_classification_pipeline
from app.visualization.dashboard import results_dashboard
from app.data_processing.validators import validate_input

# Load environment variables
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="BAIO - DNA Classification Pipeline",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown(
    """
<style>
    .stChatMessage {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }

    .stChatMessage[data-testid="user-message"] {
        background-color: #e3f2fd;
    }

    .stChatMessage[data-testid="assistant-message"] {
        background-color: #f5f5f5;
    }

    .stTextInput input {
        border-radius: 20px;
        padding: 10px 15px;
    }

    .stButton button {
        border-radius: 20px;
        padding: 0.5rem 2rem;
        font-weight: 500;
    }

    .css-1d391kg {
        padding-top: 2rem;
    }

    h1 {
        color: #1976d2;
        font-weight: 600;
    }

    .stAlert {
        border-radius: 10px;
    }
</style>
""",
    unsafe_allow_html=True,
)


def main() -> None:
    """Main application entry point."""
    # Initialize session state
    initialize_session_state()

    # Main application tabs
    tab1, tab2, tab3 = st.tabs(["🧬 DNA Analysis", "💬 Chat Assistant", "📊 Results"])

    with tab1:
        dna_analysis_interface()

    with tab2:
        chat_assistant_interface()

    with tab3:
        results_dashboard()


def dna_analysis_interface() -> None:
    """DNA classification pipeline interface."""
    st.title("🧬 DNA Classification Pipeline")
    st.markdown("Upload DNA sequences for Virus vs Host classification")

    # Create two columns for layout
    col1, col2 = st.columns([2, 1])

    with col1:
        st.subheader("📁 Input Sequences")

        # Input method selection
        input_method = input_method_selector()

        sequences = None
        if input_method == "Text Input":
            sequences = sequence_text_input()
        elif input_method == "File Upload":
            sequences = sequence_file_upload()
        else:
            sequences = batch_sequence_upload()

        # Analysis button
        if sequences and st.button("🔬 Analyze Sequences", type="primary"):
            source = (
                f"{input_method.lower().replace(' ', '_')}_{len(sequences)}_sequences"
            )
            run_classification_pipeline(sequences, source)

    with col2:
        st.subheader("⚙️ Analysis Settings")
        model_selection_interface()
        processing_status_display()


def chat_assistant_interface() -> None:
    """Chat assistant interface."""
    # Display sidebar
    chat_sidebar()

    # Main chat content
    st.title("💬 BAIO Assistant")
    st.markdown(
        "Ask questions about metagenomic analysis, pathogen detection, and using BAIO."
    )

    # Display conversation history
    for message in st.session_state.messages:
        display_chat_message(message["role"], message["content"])

    # Chat input
    if prompt := st.chat_input(
        "Ask about DNA classification, pathogen detection, or BAIO usage..."
    ):
        # Validate input
        is_valid, error_message = validate_input(prompt)
        if not is_valid:
            st.error(error_message)
            return

        # Add user message to conversation
        st.session_state.messages.append({"role": "user", "content": prompt})
        display_chat_message("user", prompt)

        # Generate and display response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    response = st.session_state.llm_client.generate_response(
                        st.session_state.messages, st.session_state.system_prompt
                    )

                    # Display response
                    st.markdown(response)

                    # Add to conversation history
                    st.session_state.messages.append(
                        {"role": "assistant", "content": response}
                    )

                except Exception as e:
                    st.session_state.error_count += 1
                    error_message = f"⚠️ Error generating response: {str(e)}"

                    # Show retry option for transient errors
                    if st.session_state.error_count < 3:
                        st.error(error_message)
                        st.info("Please try rephrasing your question or try again.")
                    else:
                        st.error(error_message)
                        st.error(
                            "Multiple errors detected. Please check your API configuration."
                        )

                    # Log error (in production, use proper logging)
                    print(f"[ERROR] {str(e)}")


def display_chat_message(role: str, content: str) -> None:
    """Display a chat message with appropriate styling."""
    with st.chat_message(role):
        st.markdown(content)


if __name__ == "__main__":
    main()
