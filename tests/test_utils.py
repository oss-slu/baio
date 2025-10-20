"""Tests for utility functions."""

import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime


class TestLLMClient:
    """Test LLM client functionality."""
    
    def test_llm_client_initialization(self):
        """Test LLM client initialization."""
        from app.utils.llm_client import LLMClient
        
        client = LLMClient()
        assert client.provider == "openai"
        assert client.model == "gpt-4"
    
    def test_llm_client_custom_initialization(self):
        """Test LLM client with custom parameters."""
        from app.utils.llm_client import LLMClient
        
        client = LLMClient(provider="anthropic", model="claude-3")
        assert client.provider == "anthropic"
        assert client.model == "claude-3"
    
    @patch('os.getenv')
    def test_llm_client_api_key_loading(self, mock_getenv):
        """Test API key loading from environment variables."""
        mock_getenv.side_effect = lambda key: {
            "OPENAI_API_KEY": "test-openai-key",
            "ANTHROPIC_API_KEY": "test-anthropic-key"
        }.get(key)
        
        from app.utils.llm_client import LLMClient
        client = LLMClient()
        
        assert client.api_key == "test-openai-key"
    
    def test_generate_response_sequence_analysis(self):
        """Test response generation for sequence analysis queries."""
        from app.utils.llm_client import LLMClient
        
        client = LLMClient()
        messages = [{"role": "user", "content": "analyze this sequence ATCGATCG"}]
        system_prompt = "You are a bioinformatics assistant."
        
        response = client.generate_response(messages, system_prompt)
        
        assert "BAIO Sequence Analysis Report" in response
        assert "Mock Analysis Mode" in response
    
    def test_generate_response_baio_info(self):
        """Test response generation for BAIO information queries."""
        from app.utils.llm_client import LLMClient
        
        client = LLMClient()
        messages = [{"role": "user", "content": "what is BAIO?"}]
        system_prompt = "You are a bioinformatics assistant."
        
        response = client.generate_response(messages, system_prompt)
        
        assert "Bioinformatics AI for Open-set detection" in response
        assert "metagenomic analysis platform" in response
    
    def test_generate_response_novel_detection(self):
        """Test response generation for novel detection queries."""
        from app.utils.llm_client import LLMClient
        
        client = LLMClient()
        messages = [{"role": "user", "content": "how does novel pathogen detection work?"}]
        system_prompt = "You are a bioinformatics assistant."
        
        response = client.generate_response(messages, system_prompt)
        
        assert "open-set detection methods" in response
        assert "Maximum Softmax Probability" in response
        assert "Mahalanobis distance" in response
    
    def test_generate_response_generic_query(self):
        """Test response generation for generic queries."""
        from app.utils.llm_client import LLMClient
        
        client = LLMClient()
        messages = [{"role": "user", "content": "hello, how are you?"}]
        system_prompt = "You are a bioinformatics assistant."
        
        response = client.generate_response(messages, system_prompt)
        
        assert "BAIO assistant" in response
        assert "System Usage" in response or "Understanding Results" in response
    
    def test_system_prompts_exist(self):
        """Test that system prompts are properly defined."""
        from app.utils.llm_client import SYSTEM_PROMPTS
        
        assert "default" in SYSTEM_PROMPTS
        assert "analysis_helper" in SYSTEM_PROMPTS
        assert "technical_expert" in SYSTEM_PROMPTS
        
        # Check prompts have content
        assert len(SYSTEM_PROMPTS["default"]) > 0
        assert "bioinformatics" in SYSTEM_PROMPTS["default"].lower()



    
    @patch('streamlit.session_state', {
        "messages": [1, 2, 3],
        "conversation_id": "test123",
        "processing_status": "Complete",
        "analysis_results": {"test": "data"},
        "model_config": {"type": "binary"},
        "error_count": 2
    })
    def test_get_session_info(self):
        """Test getting session information."""
        from app.utils.session_utils import get_session_info
        
        info = get_session_info()
        
        assert info["messages_count"] == 3
        assert info["conversation_id"] == "test123"
        assert info["processing_status"] == "Complete"
        assert info["has_results"] is True
        assert info["model_config"]["type"] == "binary"
        assert info["error_count"] == 2


class TestComponentIntegration:
    """Test integration between components."""
    
    def test_model_config_integration(self):
        """Test model configuration integration."""
        from app.components.model_selection import get_model_config
        
        with patch('streamlit.session_state', {"model_config": {"type": "Multi-class"}}):
            config = get_model_config()
            assert config["type"] == "Multi-class"
    
    def test_model_config_defaults(self):
        """Test model configuration defaults."""
        from app.components.model_selection import get_model_config
        
        with patch('streamlit.session_state', {}):
            config = get_model_config()
            assert config["type"] == "Binary (Virus vs Host)"
            assert config["confidence_threshold"] == 0.5
            assert config["enable_ood"] is True


if __name__ == "__main__":
    pytest.main([__file__])