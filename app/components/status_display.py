"""Processing status display components."""

import streamlit as st


def processing_status_display() -> None:
    """Display real-time processing status."""
    st.subheader("⏳ Processing Status")

    if "processing_status" not in st.session_state:
        st.session_state.processing_status = "Ready"

    status = st.session_state.processing_status

    if status == "Ready":
        st.success("🟢 Ready to process sequences")
    elif status == "Processing":
        st.info("🔄 Processing sequences...")
        progress = st.session_state.get("progress", 0)
        st.progress(progress)

        # Show current step if available
        current_step = st.session_state.get("current_step", "")
        if current_step:
            st.text(current_step)

    elif status == "Complete":
        st.success("✅ Processing complete!")
    elif status == "Error":
        st.error("❌ Processing failed")
        error_msg = st.session_state.get("error_message", "Unknown error")
        st.error(error_msg)


def update_processing_status(
    status: str, progress: float = 0, step: str = "", error_msg: str = ""
) -> None:
    """
    Update processing status in session state.

    Args:
        status: Status string ("Ready", "Processing", "Complete", "Error")
        progress: Progress value between 0 and 1
        step: Description of current processing step
        error_msg: Error message if status is "Error"
    """
    st.session_state.processing_status = status
    st.session_state.progress = progress
    st.session_state.current_step = step
    if error_msg:
        st.session_state.error_message = error_msg


def show_progress_bar(current: int, total: int, description: str = "") -> None:
    """
    Show progress bar with current/total information.

    Args:
        current: Current item number
        total: Total number of items
        description: Description of what's being processed
    """
    progress = current / total if total > 0 else 0
    st.progress(progress)

    if description:
        st.text(f"{description} ({current}/{total})")
    else:
        st.text(f"Progress: {current}/{total}")


def clear_processing_status() -> None:
    """Clear all processing status from session state."""
    st.session_state.processing_status = "Ready"
    st.session_state.progress = 0
    st.session_state.current_step = ""
    if "error_message" in st.session_state:
        del st.session_state.error_message
