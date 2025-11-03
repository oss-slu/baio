"""Results dashboard for displaying classification results."""

import streamlit as st
from datetime import datetime
from typing import Dict, Any
from visualization.charts import create_results_visualizations, create_sequence_table
from pipeline.classification import get_classification_summary


def results_dashboard() -> None:
    """Main results visualization and export interface."""
    st.title("📊 Analysis Results")

    if (
        "analysis_results" not in st.session_state
        or not st.session_state.analysis_results
    ):
        st.info(
            "🔬 No analysis results yet. Run DNA classification in the Analysis tab first."
        )
        return

    results = st.session_state.analysis_results

    # Results summary metrics
    display_results_summary(results)

    # Detailed results table
    st.divider()
    create_sequence_table(results)

    # Export options
    st.divider()
    display_export_options(results)

    # Visualizations
    st.divider()
    st.subheader("📊 Visualizations")
    create_results_visualizations(results)


def display_results_summary(results: Dict[str, Any]) -> None:
    """Display summary metrics for the results."""
    st.subheader("📈 Results Summary")

    # Main metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Total Sequences", results.get("total_sequences", 0))
    with col2:
        st.metric("Virus Sequences", results.get("virus_count", 0))
    with col3:
        st.metric("Host Sequences", results.get("host_count", 0))
    with col4:
        st.metric("Novel/Unknown", results.get("novel_count", 0))

    # Additional info
    col1, col2, col3 = st.columns(3)

    with col1:
        processing_time = results.get("processing_time", 0)
        st.metric("Processing Time", f"{processing_time:.1f}s")

    with col2:
        total_seqs = results.get("total_sequences", 0)
        throughput = total_seqs / processing_time if processing_time > 0 else 0
        st.metric("Throughput", f"{throughput:.1f} seq/s")

    with col3:
        source = results.get("source", "Unknown")
        st.metric("Source", source)

    # Show timestamp
    timestamp = results.get("timestamp", "")
    if timestamp:
        st.caption(f"Analysis completed: {timestamp}")


def display_export_options(results: Dict[str, Any]) -> None:
    """Display export options for results."""
    st.subheader("💾 Export Results")

    col1, col2, col3 = st.columns(3)

    with col1:
        # CSV Export
        if st.button("📄 Export CSV", use_container_width=True):
            csv_data = export_to_csv(results)
            st.download_button(
                "Download CSV",
                csv_data,
                file_name=f"baio_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv",
                use_container_width=True,
            )

    with col2:
        # JSON Export
        if st.button("📋 Export JSON", use_container_width=True):
            json_data = export_to_json(results)
            st.download_button(
                "Download JSON",
                json_data,
                file_name=f"baio_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json",
                use_container_width=True,
            )

    with col3:
        # Summary Report
        if st.button("📝 Export Summary", use_container_width=True):
            summary_text = get_classification_summary(results)
            st.download_button(
                "Download Summary",
                summary_text,
                file_name=f"baio_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
                mime="text/plain",
                use_container_width=True,
            )


def export_to_csv(results: Dict[str, Any]) -> str:
    """Export results to CSV format."""
    try:
        import pandas as pd

        if "detailed_results" in results and results["detailed_results"]:
            df = pd.DataFrame(results["detailed_results"])
            csv_string: str = df.to_csv(index=False)
            return csv_string
        else:
            # Create summary CSV if no detailed results
            summary_data = {
                "metric": [
                    "total_sequences",
                    "virus_count",
                    "host_count",
                    "novel_count",
                ],
                "value": [
                    results.get("total_sequences", 0),
                    results.get("virus_count", 0),
                    results.get("host_count", 0),
                    results.get("novel_count", 0),
                ],
            }
            df = pd.DataFrame(summary_data)
            summary_csv: str = df.to_csv(index=False)
            return summary_csv

    except ImportError:
        # Fallback to manual CSV creation
        if "detailed_results" in results and results["detailed_results"]:
            lines = []
            # Get headers from first result
            if results["detailed_results"]:
                headers = list(results["detailed_results"][0].keys())
                lines.append(",".join(headers))

                # Add data rows
                for result in results["detailed_results"]:
                    row = [str(result.get(header, "")) for header in headers]
                    lines.append(",".join(row))

            return "\n".join(lines)

        return "No detailed results available"


def export_to_json(results: Dict[str, Any]) -> str:
    """Export results to JSON format."""
    import json

    return json.dumps(results, indent=2)


def clear_results() -> None:
    """Clear stored results from session state."""
    if "analysis_results" in st.session_state:
        del st.session_state.analysis_results
    st.success("Results cleared!")
    st.rerun()
