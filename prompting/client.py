import os
import json
import time
import random


class LLMClient:
    def __init__(self):
        # example env will have actual keys when available
        self.api_key = os.getenv('LLM_API_KEY') or os.getenv('GROK_API_KEY')
        self.base_url = os.getenv('LLM_BASE_URL', 'https://api.openai.com/v1')
        self.model = os.getenv('LLM_MODEL', 'gpt-4')
        self.mock_mode = not bool(self.api_key)
        
        if self.mock_mode:
            print("Running in mock mode (no API key found)")
    
    def chat(self, messages, temperature=0.3, max_tokens=1000):
        """Send chat request or return mock response."""
        start_time = time.time()
        
        if self.mock_mode:
            response = self._mock_response(messages)
        else:
            response = self._real_response(messages, temperature, max_tokens)
        
        return {
            'content': response,
            'latency_s': time.time() - start_time,
            'mock': self.mock_mode
        }
    
    def _real_response(self, messages, temperature, max_tokens):
        """TODO: Implement actual API call when keys available."""
        import requests
        
        # Placeholder for real API implementation
        headers = {'Authorization': f'Bearer {self.api_key}'}
        payload = {
            'model': self.model,
            'messages': messages,
            'temperature': temperature,
            'max_tokens': max_tokens
        }
        
        response = requests.post(f'{self.base_url}/chat/completions', 
                               headers=headers, json=payload)
        return response.json()['choices'][0]['message']['content']
    
    def _mock_response(self, messages):
        """Generate mock response for testing."""
        time.sleep(random.uniform(0.1, 0.3))  # Simulate latency
        
        # Simple mock based on content
        content = ' '.join(msg.get('content', '') for msg in messages).lower()
        
        if 'sars-cov-2' in content:
            return self._mock_covid_response()
        elif 'inconclusive' in content or 'low' in content:
            return self._mock_inconclusive()
        else:
            return self._mock_generic()
    
    def _mock_covid_response(self):
        return json.dumps({
            "summary": "SARS-CoV-2 detected with moderate confidence",
            "known_pathogens": [{"taxon": "SARS-CoV-2", "confidence": 0.65}],
            "ood_rate": 0.04,
            "caveats": ["Single sample", "Confirmation needed"]
        })
    
    def _mock_inconclusive(self):
        return json.dumps({
            "summary": "Inconclusive - insufficient evidence",
            "known_pathogens": [],
            "ood_rate": 0.20,
            "caveats": ["Low confidence scores", "High OOD rate"]
        })
    
    def _mock_generic(self):
        return json.dumps({
            "summary": "Mock analysis result",
            "known_pathogens": [{"taxon": "Test pathogen", "confidence": 0.4}],
            "ood_rate": 0.08,
            "caveats": ["Mock response", "Replace with real analysis"]
        })