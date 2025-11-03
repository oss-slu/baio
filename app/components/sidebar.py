"""Sidebar components for chat assistant."""

import streamlit as st
from app.utils.llm_client import SYSTEM_PROMPTS
from datetime import datetime
from typing import Optional


def chat_sidebar() -> None:
    """Display chat assistant sidebar with settings and controls."""
    with st.sidebar:
        st.title("⚙️ Chat Settings")

        # System prompt selection
        st.subheader("Assistant Mode")
        prompt_choice = st.selectbox(
            "Select mode:",
            options=list(SYSTEM_PROMPTS.keys()),
            format_func=lambda x: x.replace("_", " ").title(),
        )
        st.session_state.system_prompt = SYSTEM_PROMPTS[prompt_choice]

        st.divider()

        # Conversation management
        st.subheader("Conversation")
        col1, col2 = st.columns(2)

        with col1:
            if st.button("🗑️ Clear", use_container_width=True):
                clear_conversation()

        with col2:
            export_text = export_conversation()
            if export_text:
                st.download_button(
                    label="💾 Export",
                    data=export_text,
                    file_name=f"baio_chat_{st.session_state.conversation_id}.txt",
                    mime="text/plain",
                    use_container_width=True,
                )

        # Stats
        if st.session_state.messages:
            st.divider()
            st.subheader("Statistics")
            st.metric("Messages", len(st.session_state.messages))
            st.metric("Errors", st.session_state.error_count)

        # Info
        st.divider()
        st.info(
            """
        **BAIO Assistant**

        Ask questions about:
        - Open-set pathogen detection
        - Taxonomy classification
        - Analysis interpretation
        - System usage
        """
        )


def clear_conversation() -> None:
    """Clear the conversation history."""
    st.session_state.messages = []
    st.session_state.error_count = 0
    st.session_state.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    st.rerun()


def export_conversation() -> Optional[str]:
    """Export conversation history as text."""
    if not st.session_state.messages:
        return None

    export_text = "BAIO Conversation Export\n"
    export_text += f"Conversation ID: {st.session_state.conversation_id}\n"
    export_text += f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    export_text += "=" * 60 + "\n\n"

    for msg in st.session_state.messages:
        role = msg["role"].upper()
        content = msg["content"]
        export_text += f"{role}:\n{content}\n\n"

    return export_text
