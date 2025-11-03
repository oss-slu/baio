"""Input form components for sequence upload and text entry."""

import streamlit as st
from typing import List, Tuple, Optional, cast
from data_processing.parsers import parse_fasta_text, parse_uploaded_file
from data_processing.validators import validate_fasta_format


def sequence_text_input() -> Optional[List[Tuple[str, str]]]:
    """
    Text area for manual sequence input.

    Returns:
        List of parsed sequences or None if invalid
    """
    sequence_input = st.text_area(
        "Enter DNA sequence(s):",
        height=200,
        placeholder="Paste FASTA format sequences here...\n\n>sequence_1\nATGCGTACGTTAGCCGAATTCGCGATCGATC...\n>sequence_2\nGCTAGCTAGCTAGCTAGCTAG...",
        help="Supports FASTA format. Multiple sequences allowed.",
    )

    if sequence_input:
        # Validate format
        is_valid, error_msg = validate_fasta_format(sequence_input)
        if not is_valid:
            st.error(f"❌ {error_msg}")
            return None

        # Parse sequences
        sequences = List[Tuple[str, str]](parse_fasta_text(sequence_input))
        if sequences:
            st.success(f"✅ Parsed {len(sequences)} sequence(s)")
            return sequences
        else:
            st.error("❌ Could not parse sequences. Please check your input.")
            return None

    return None


def sequence_file_upload() -> Optional[List[Tuple[str, str]]]:
    """
    Single file upload interface.

    Returns:
        List of parsed sequences or None if invalid
    """
    uploaded_file = st.file_uploader(
        "Upload sequence file:",
        type=["fasta", "fa", "fastq", "fq", "fas"],
        help="Supported formats: FASTA (.fasta, .fa, .fas), FASTQ (.fastq, .fq)",
    )

    if uploaded_file is not None:
        # Display file info
        st.info(f"📄 **File:** {uploaded_file.name} ({uploaded_file.size} bytes)")

        # Parse uploaded file
        sequences = List[Tuple[str, str]](parse_uploaded_file(uploaded_file))
        if sequences:
            st.success(f"✅ Loaded {len(sequences)} sequence(s)")

            # Show sequence preview
            with st.expander("👀 Preview sequences"):
                for i, (seq_id, seq) in enumerate(sequences[:3]):  # Show first 3
                    st.code(f">{seq_id}\n{seq[:100]}{'...' if len(seq) > 100 else ''}")
                if len(sequences) > 3:
                    st.write(f"... and {len(sequences) - 3} more sequences")

            return sequences
        else:
            st.error("❌ Could not parse file. Please check format.")
            return None

    return None


def batch_sequence_upload() -> Optional[List[Tuple[str, str]]]:
    """
    Batch file upload interface.

    Returns:
        List of parsed sequences from all files or None if invalid
    """
    uploaded_files = st.file_uploader(
        "Upload multiple sequence files:",
        type=["fasta", "fa", "fastq", "fq", "fas"],
        accept_multiple_files=True,
        help="Upload multiple files for batch processing",
    )

    if uploaded_files:
        st.info(f"📄 **Files:** {len(uploaded_files)} file(s) selected")

        total_sequences = 0
        all_sequences = []

        for file in uploaded_files:
            sequences = parse_uploaded_file(file)
            if sequences:
                all_sequences.extend(
                    [(f"{file.name}_{seq_id}", seq) for seq_id, seq in sequences]
                )
                total_sequences += len(sequences)

        if total_sequences > 0:
            st.success(
                f"✅ Loaded {total_sequences} sequence(s) from {len(uploaded_files)} file(s)"
            )
            return all_sequences
        else:
            st.error("❌ Could not parse any files. Please check formats.")
            return None

    return None


def input_method_selector() -> str:
    """
    Radio button selector for input method.

    Returns:
        Selected input method
    """
    return str(
        st.radio(
            "Choose input method:",
            ["Text Input", "File Upload", "Batch Upload"],
            horizontal=True,
        )
    )
