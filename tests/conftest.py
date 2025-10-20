"""Configuration for pytest tests."""

import sys
from pathlib import Path

import pytest

# Add the project root to Python path so we can import our modules
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Add the app directory to the path for imports
app_path = project_root / "app"
sys.path.insert(0, str(app_path))


@pytest.fixture(autouse=True)
def mock_streamlit():
    """Mock streamlit components for testing."""
    import unittest.mock

    # Mock streamlit module
    with unittest.mock.patch.dict(
        "sys.modules",
        {
            "streamlit": unittest.mock.MagicMock(),
        },
    ):
        # Create mock streamlit with common attributes
        import streamlit as st

        st.session_state = {}
        st.subheader = unittest.mock.MagicMock()
        st.info = unittest.mock.MagicMock()
        st.error = unittest.mock.MagicMock()
        st.success = unittest.mock.MagicMock()
        st.warning = unittest.mock.MagicMock()
        st.text_area = unittest.mock.MagicMock()
        st.file_uploader = unittest.mock.MagicMock()
        st.selectbox = unittest.mock.MagicMock()
        st.radio = unittest.mock.MagicMock()
        st.slider = unittest.mock.MagicMock()
        st.checkbox = unittest.mock.MagicMock()
        st.button = unittest.mock.MagicMock()
        st.columns = unittest.mock.MagicMock()
        st.metric = unittest.mock.MagicMock()
        st.progress = unittest.mock.MagicMock()
        st.empty = unittest.mock.MagicMock()
        st.container = unittest.mock.MagicMock()
        st.expander = unittest.mock.MagicMock()
        st.multiselect = unittest.mock.MagicMock()
        st.dataframe = unittest.mock.MagicMock()
        st.bar_chart = unittest.mock.MagicMock()
        st.json = unittest.mock.MagicMock()
        st.markdown = unittest.mock.MagicMock()
        st.chat_message = unittest.mock.MagicMock()
        st.chat_input = unittest.mock.MagicMock()
        st.spinner = unittest.mock.MagicMock()
        st.download_button = unittest.mock.MagicMock()
        st.caption = unittest.mock.MagicMock()
        st.divider = unittest.mock.MagicMock()
        st.tabs = unittest.mock.MagicMock()
        st.title = unittest.mock.MagicMock()
        st.rerun = unittest.mock.MagicMock()

        yield st


@pytest.fixture
def sample_fasta_sequences():
    """Provide sample FASTA sequences for testing."""
    return [
        ("sequence_1", "ATCGATCGATCGATCG"),
        ("sequence_2", "GCTAGCTAGCTAGCTA"),
        ("sequence_3", "TTTTAAAACCCCGGGG"),
    ]


@pytest.fixture
def sample_classification_results():
    """Provide sample classification results for testing."""
    return {
        "total_sequences": 3,
        "virus_count": 1,
        "host_count": 2,
        "novel_count": 0,
        "detailed_results": [
            {
                "sequence_id": "seq1",
                "length": 16,
                "prediction": "Virus",
                "confidence": "0.85",
                "gc_content": "0.50",
                "sequence_preview": "ATCGATCGATCGATCG",
            },
            {
                "sequence_id": "seq2",
                "length": 16,
                "prediction": "Host",
                "confidence": "0.92",
                "gc_content": "0.50",
                "sequence_preview": "GCTAGCTAGCTAGCTA",
            },
            {
                "sequence_id": "seq3",
                "length": 16,
                "prediction": "Host",
                "confidence": "0.78",
                "gc_content": "0.50",
                "sequence_preview": "TTTTAAAACCCCGGGG",
            },
        ],
        "source": "test_file.fasta",
        "processing_time": 1.5,
        "timestamp": "2025-10-20T10:30:00",
    }


@pytest.fixture
def mock_uploaded_file():
    """Mock uploaded file object."""
    import unittest.mock

    mock_file = unittest.mock.MagicMock()
    mock_file.name = "test.fasta"
    mock_file.size = 1024
    mock_file.read.return_value.decode.return_value = (
        ">seq1\nATCGATCGATCG\n>seq2\nGCTAGCTAGCTA"
    )

    return mock_file
