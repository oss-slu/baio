"""Visualization components for results display."""

import streamlit as st
from typing import Dict, Any
import pandas as pd


def create_results_visualizations(results: Dict[str, Any]) -> None:
    """
    Create visualizations for classification results.
    
    Args:
        results: Results dictionary from classification pipeline
    """
    try:
        import plotly.express as px
        import pandas as pd
        
        # Classification distribution pie chart
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Classification Distribution")
            labels = ["Virus", "Host", "Novel/Unknown"]
            values = [results.get("virus_count", 0), results.get("host_count", 0), results.get("novel_count", 0)]
            
            if sum(values) > 0:
                fig_pie = px.pie(
                    values=values, 
                    names=labels, 
                    title="Sequence Classifications",
                    color_discrete_map={
                        "Virus": "#ff6b6b",
                        "Host": "#4ecdc4", 
                        "Novel/Unknown": "#ffa726"
                    }
                )
                st.plotly_chart(fig_pie, use_container_width=True)
        
        with col2:
            st.subheader("Confidence Score Distribution")
            if "detailed_results" in results and results["detailed_results"]:
                df = pd.DataFrame(results["detailed_results"])
                df["confidence_numeric"] = df["confidence"].astype(float)
                
                fig_hist = px.histogram(
                    df, 
                    x="confidence_numeric", 
                    color="prediction",
                    title="Confidence Score Distribution",
                    nbins=20,
                    color_discrete_map={
                        "Virus": "#ff6b6b",
                        "Host": "#4ecdc4", 
                        "Novel": "#ffa726"
                    }
                )
                fig_hist.update_layout(
                    xaxis_title="Confidence Score",
                    yaxis_title="Count"
                )
                st.plotly_chart(fig_hist, use_container_width=True)
        
        # Additional visualizations
        if "detailed_results" in results and results["detailed_results"]:
            create_additional_plots(pd.DataFrame(results["detailed_results"]))
            
    except ImportError:
        st.warning("📊 Plotly not installed. Install with: `pip install plotly` for advanced visualizations.")
        create_simple_visualizations(results)


def create_additional_plots(df: pd.DataFrame) -> None:
    """Create additional visualization plots."""
    try:
        import plotly.express as px
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Sequence Length Distribution")
            fig_length = px.box(
                df, 
                x="prediction", 
                y="length",
                title="Sequence Length by Classification",
                color="prediction",
                color_discrete_map={
                    "Virus": "#ff6b6b",
                    "Host": "#4ecdc4", 
                    "Novel": "#ffa726"
                }
            )
            st.plotly_chart(fig_length, use_container_width=True)
        
        with col2:
            if "gc_content" in df.columns:
                st.subheader("GC Content Distribution")
                df["gc_content_numeric"] = df["gc_content"].astype(float)
                fig_gc = px.violin(
                    df,
                    x="prediction",
                    y="gc_content_numeric",
                    title="GC Content by Classification",
                    color="prediction",
                    color_discrete_map={
                        "Virus": "#ff6b6b",
                        "Host": "#4ecdc4", 
                        "Novel": "#ffa726"
                    }
                )
                fig_gc.update_layout(yaxis_title="GC Content")
                st.plotly_chart(fig_gc, use_container_width=True)
                
    except Exception as e:
        st.warning(f"Could not create additional plots: {str(e)}")


def create_simple_visualizations(results: Dict[str, Any]) -> None:
    """Create simple text-based visualizations when plotly is not available."""
    st.subheader("📊 Results Overview")
    
    total = results.get("total_sequences", 0)
    if total == 0:
        st.info("No sequences to visualize.")
        return
    
    # Create simple bar chart using st.bar_chart
    chart_data = {
        "Virus": results.get("virus_count", 0),
        "Host": results.get("host_count", 0),
        "Novel/Unknown": results.get("novel_count", 0)
    }
    
    st.bar_chart(chart_data)
    
    # Show percentages
    col1, col2, col3 = st.columns(3)
    
    with col1:
        virus_pct = (chart_data["Virus"] / total * 100) if total > 0 else 0
        st.metric("🦠 Virus", f"{chart_data['Virus']} ({virus_pct:.1f}%)")
    
    with col2:
        host_pct = (chart_data["Host"] / total * 100) if total > 0 else 0
        st.metric("🧬 Host", f"{chart_data['Host']} ({host_pct:.1f}%)")
    
    with col3:
        novel_pct = (chart_data["Novel/Unknown"] / total * 100) if total > 0 else 0
        st.metric("❓ Novel", f"{chart_data['Novel/Unknown']} ({novel_pct:.1f}%)")


def create_sequence_table(results: Dict[str, Any]) -> None:
    """
    Create a detailed table of sequence results.
    
    Args:
        results: Results dictionary from classification pipeline
    """
    if "detailed_results" not in results or not results["detailed_results"]:
        st.info("No detailed results to display.")
        return
    
    try:
        import pandas as pd
        df = pd.DataFrame(results["detailed_results"])
        
        # Format columns for better display
        display_columns = [
            "sequence_id", "length", "prediction", "confidence", 
            "gc_content", "sequence_preview"
        ]
        
        # Only show columns that exist
        available_columns = [col for col in display_columns if col in df.columns]
        display_df = df[available_columns]
        
        # Format numeric columns
        if "confidence" in display_df.columns:
            display_df["confidence"] = display_df["confidence"].astype(float).round(3)
        if "gc_content" in display_df.columns:
            display_df["gc_content"] = display_df["gc_content"].astype(float).round(3)
        
        # Display with filtering options
        st.subheader("🔍 Detailed Results")
        
        # Add filters
        col1, col2 = st.columns(2)
        with col1:
            prediction_filter = st.multiselect(
                "Filter by prediction:",
                options=display_df["prediction"].unique(),
                default=display_df["prediction"].unique()
            )
        
        with col2:
            min_confidence = st.slider(
                "Minimum confidence:",
                min_value=0.0,
                max_value=1.0,
                value=0.0,
                step=0.1
            )
        
        # Apply filters
        if prediction_filter:
            display_df = display_df[display_df["prediction"].isin(prediction_filter)]
        
        if "confidence" in display_df.columns:
            display_df = display_df[display_df["confidence"] >= min_confidence]
        
        # Display table
        st.dataframe(display_df, use_container_width=True, height=400)
        
    except ImportError:
        st.warning("⚠️ Pandas not installed. Showing results as JSON:")
        st.json(results["detailed_results"])