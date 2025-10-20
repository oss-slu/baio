"""Tests for visualization components."""

import pytest
from unittest.mock import patch, MagicMock
import json


class TestResultsVisualization:
    """Test visualization functions."""
    
    def test_create_simple_visualizations_with_data(self):
        """Test simple visualizations with valid data."""
        results = {
            "total_sequences": 10,
            "virus_count": 4,
            "host_count": 5,
            "novel_count": 1
        }
        
        # Mock streamlit components
        with patch('streamlit.subheader'), \
             patch('streamlit.bar_chart') as mock_bar_chart, \
             patch('streamlit.columns') as mock_columns, \
             patch('streamlit.metric') as mock_metric:
            
            mock_columns.return_value = [MagicMock(), MagicMock(), MagicMock()]
            
            from app.visualization.charts import create_simple_visualizations
            create_simple_visualizations(results)
            
            # Check bar chart was called with correct data
            mock_bar_chart.assert_called_once()
            chart_data = mock_bar_chart.call_args[0][0]
            assert chart_data["Virus"] == 4
            assert chart_data["Host"] == 5
            assert chart_data["Novel/Unknown"] == 1
            
            # Check metrics were created
            assert mock_metric.call_count == 3
    
    def test_create_simple_visualizations_empty_data(self):
        """Test simple visualizations with empty data."""
        results = {"total_sequences": 0}
        
        with patch('streamlit.subheader'), \
             patch('streamlit.info') as mock_info:
            
            from app.visualization.charts import create_simple_visualizations
            create_simple_visualizations(results)
            
            mock_info.assert_called_once_with("No sequences to visualize.")
    
    def test_create_sequence_table_without_pandas(self):
        """Test sequence table creation without pandas."""
        results = {
            "detailed_results": [
                {"sequence_id": "seq1", "prediction": "Virus"}
            ]
        }
        
        with patch('streamlit.subheader'), \
             patch('streamlit.warning') as mock_warning, \
             patch('streamlit.json') as mock_json, \
             patch('pandas.DataFrame', side_effect=ImportError):
            
            from app.visualization.charts import create_sequence_table
            create_sequence_table(results)
            
            mock_warning.assert_called_once()
            mock_json.assert_called_once_with(results["detailed_results"])
    
    def test_create_sequence_table_no_results(self):
        """Test sequence table with no results."""
        results = {"detailed_results": []}
        
        with patch('streamlit.info') as mock_info:
            from app.visualization.charts import create_sequence_table
            create_sequence_table(results)
            
            mock_info.assert_called_once_with("No detailed results to display.")


class TestResultsDashboard:
    """Test results dashboard functions."""
    
    def test_export_to_csv_with_pandas(self):
        """Test CSV export with pandas available."""
        results = {
            "detailed_results": [
                {"sequence_id": "seq1", "prediction": "Virus", "confidence": "0.85"},
                {"sequence_id": "seq2", "prediction": "Host", "confidence": "0.92"}
            ]
        }
        
        with patch('pandas.DataFrame') as mock_pd_df:
            mock_df = MagicMock()
            mock_df.to_csv.return_value = "sequence_id,prediction,confidence\nseq1,Virus,0.85\nseq2,Host,0.92"
            mock_pd_df.return_value = mock_df
            
            from app.visualization.dashboard import export_to_csv
            csv_data = export_to_csv(results)
            
            assert "sequence_id,prediction,confidence" in csv_data
            assert "seq1,Virus,0.85" in csv_data
    
    def test_export_to_csv_without_pandas(self):
        """Test CSV export without pandas."""
        results = {
            "detailed_results": [
                {"sequence_id": "seq1", "prediction": "Virus"},
                {"sequence_id": "seq2", "prediction": "Host"}
            ]
        }
        
        with patch('pandas.DataFrame', side_effect=ImportError):
            from app.visualization.dashboard import export_to_csv
            csv_data = export_to_csv(results)
            
            lines = csv_data.split('\n')
            assert "sequence_id,prediction" in lines[0]
            assert "seq1,Virus" in lines[1]
            assert "seq2,Host" in lines[2]
    
    def test_export_to_csv_no_detailed_results(self):
        """Test CSV export with no detailed results."""
        results = {
            "total_sequences": 5,
            "virus_count": 2,
            "host_count": 3,
            "novel_count": 0
        }
        
        with patch('pandas.DataFrame') as mock_pd_df:
            mock_df = MagicMock()
            mock_df.to_csv.return_value = "metric,value\ntotal_sequences,5\nvirus_count,2"
            mock_pd_df.return_value = mock_df
            
            from app.visualization.dashboard import export_to_csv
            csv_data = export_to_csv(results)
            
            assert "metric,value" in csv_data
            assert "total_sequences,5" in csv_data
    
    def test_export_to_json(self):
        """Test JSON export."""
        results = {
            "total_sequences": 2,
            "virus_count": 1,
            "host_count": 1,
            "detailed_results": [
                {"sequence_id": "seq1", "prediction": "Virus"}
            ]
        }
        
        from app.visualization.dashboard import export_to_json
        json_data = export_to_json(results)
        
        # Parse JSON to verify it's valid
        parsed = json.loads(json_data)
        assert parsed["total_sequences"] == 2
        assert parsed["virus_count"] == 1
        assert len(parsed["detailed_results"]) == 1
    

if __name__ == "__main__":
    pytest.main([__file__])