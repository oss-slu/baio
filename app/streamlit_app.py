import streamlit as st
import time
from typing import List, Dict, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="BAIO - Pathogen Detection Assistant",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    /* Main chat container */
    .stChatMessage {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
    }
    
    /* User message styling */
    .stChatMessage[data-testid="user-message"] {
        background-color: #e3f2fd;
    }
    
    /* Assistant message styling */
    .stChatMessage[data-testid="assistant-message"] {
        background-color: #f5f5f5;
    }
    
    /* Input box styling */
    .stTextInput input {
        border-radius: 20px;
        padding: 10px 15px;
    }
    
    /* Button styling */
    .stButton button {
        border-radius: 20px;
        padding: 0.5rem 2rem;
        font-weight: 500;
    }
    
    /* Sidebar styling */
    .css-1d391kg {
        padding-top: 2rem;
    }
    
    /* Header styling */
    h1 {
        color: #1976d2;
        font-weight: 600;
    }
    
    /* Error message styling */
    .stAlert {
        border-radius: 10px;
    }
</style>
""", unsafe_allow_html=True)


class LLMClient:
    """
    Wrapper class for LLM API calls. 
    Replace the mock implementation with your actual LLM provider.
    """
    
    def __init__(self, provider: str = "openai", model: str = "gpt-4"):
        self.provider = provider
        self.model = model
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        
    def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        system_prompt: str,
    ) -> str:
        """
        Generate response from LLM.
        
        Args:
            messages: List of conversation messages
            system_prompt: System prompt for the LLM
            
        Returns:
            Generated response text
        """
        try:
            # ============================================
            # TODO: Replace this with actual LLM API call
            # ============================================
            
            # OPTION 1: OpenAI
            # from openai import OpenAI
            # client = OpenAI(api_key=self.api_key)
            # response = client.chat.completions.create(
            #     model=self.model,
            #     messages=[{"role": "system", "content": system_prompt}] + messages,
            # )
            # return response.choices[0].message.content
            
            # OPTION 2: Anthropic Claude
            # import anthropic
            # client = anthropic.Anthropic(api_key=self.api_key)
            # response = client.messages.create(
            #     model=self.model,
            #     system=system_prompt,
            #     messages=messages,
            # )
            # return response.content[0].text
            
            # MOCK IMPLEMENTATION (Remove when adding real LLM)
            time.sleep(1)  # Simulate API call delay
            user_query = messages[-1]["content"].lower()
            
            # Check if user is asking for sequence analysis
            if any(keyword in user_query for keyword in ["analyze", "analyse", "detect", "identify", "classify"]) and \
               any(base in user_query.upper() for base in ["ATCG", "GCTA", "TACG"]):
                return """**🧬 BAIO Sequence Analysis Report**

**Sequence Information:**
- Length: 13 nucleotides (partial sequence provided)
- GC Content: 46.2%
- Input: ATGCGTACGTTAG

**⚠️ Mock Analysis Mode**
*Note: This is a demonstration. Real analysis requires:*
1. Full sequence upload via Analysis tab
2. Evo2 embedding generation
3. Classifier + OOD detection pipeline

**Mock Classification Results:**
- **Primary Classification**: Bacterial (Confidence: 78.3%)
- **Taxonomic Assignment**: Likely *Escherichia coli* K-12
- **Novel Detection Score**: 0.23 (Known sequence)

**Embedding Analysis:**
- Mahalanobis Distance: 2.1 (within normal range)
- Energy Score: -3.45
- Max Softmax Probability: 0.783

**Interpretation:**
This short sequence fragment shows patterns consistent with bacterial DNA, specifically matching E. coli reference sequences. The low novelty score indicates this is a known pathogen type. For accurate results, please:

1. Upload complete FASTQ/FASTA file
2. Use the Analysis tab for full pipeline
3. Review comprehensive report with visualizations

**Next Steps:**
- Upload full sequence data for complete analysis
- Check for contamination in sample
- Review quality scores if available"""
            
            elif "what is baio" in user_query or "what's baio" in user_query:
                return """**BAIO (Bioinformatics AI for Open-set detection)** is a cutting-edge metagenomic analysis platform that uses foundation models for pathogen detection.

**Key Capabilities:**
• **Taxonomy Profiling**: Classifies sequences into viral families, bacterial groups, and host DNA
• **Novel Pathogen Detection**: Identifies unknown or divergent pathogens using open-set recognition
• **Foundation Model**: Uses Evo2 for deep sequence understanding
• **Real-time Surveillance**: Supports pandemic preparedness and biosurveillance

**Why BAIO is Different:**
Unlike traditional tools (Kraken2, MetaPhlAn) that only match known databases, BAIO can flag sequences that don't fit any known category - crucial for detecting emerging pathogens.

**How would you like to use BAIO?** Upload sequences for analysis or ask more questions!"""
            
            elif "novel" in user_query or "unknown" in user_query:
                return """BAIO uses **open-set detection methods** to identify novel pathogens. When a sequence doesn't match known taxonomic classes, it's flagged as "novel/unknown" using:

**Detection Methods:**
• **Maximum Softmax Probability (MSP)**: Measures classifier confidence
• **Energy-based OOD scoring**: Analyzes activation patterns
• **Mahalanobis distance**: Measures distance from known class distributions

**How It Works:**
1. Evo2 generates sequence embeddings
2. Classifier attempts taxonomy assignment
3. OOD detectors analyze the embedding space
4. If distance/energy exceeds thresholds → flagged as novel
5. Novel sequences are clustered for investigation

**Why This Matters:**
Traditional methods miss novel pathogens. BAIO's open-set approach was designed for pandemic preparedness - detecting threats before they're in databases.

Want to see how to interpret novel detection results?"""
            
            elif "evo2" in user_query or "embedding" in user_query:
                return """**Evo2** is a foundation model for DNA sequences that generates rich embeddings. Think of it as "GPT for genomics."

**In BAIO:**
1. **Input**: Raw sequences (FASTQ/FASTA) → Evo2
2. **Processing**: Evo2 produces dense embeddings capturing sequence patterns
3. **Classification**: Embeddings → classifier heads → taxonomy predictions
4. **OOD Detection**: Algorithms analyze embedding space for anomalies

**Advantages over K-mer Methods:**
• Captures long-range dependencies
• Understands context and motifs
• Pre-trained on massive genomic datasets
• Transfer learning for pathogen detection

**Technical Details:**
- Model: Transformer-based architecture
- Embedding dimension: 512-1024 (configurable)
- Context window: Up to 8K nucleotides
- Pre-training: Billions of DNA sequences

This deep understanding enables BAIO to detect novel pathogens that k-mer methods would miss."""
            
            elif "upload" in user_query or "file" in user_query or "how do i" in user_query:
                return """**How to Analyze Sequences with BAIO:**

**Step-by-Step:**
1. **Navigate to Analysis Tab** (in main BAIO interface)
2. **Upload Files**: 
   - Supported: FASTQ, FASTA, FASTQ.GZ
   - Single or multiple files
   - Raw sequencing data or assembled contigs
3. **Configure Parameters**:
   - Sequence length filters
   - Confidence thresholds
   - OOD detection sensitivity
4. **Run Analysis** → Processing takes 2-5 minutes
5. **Review Results**:
   - Taxonomy classifications
   - Novel sequence detections
   - Embedding visualizations
   - Sample-level reports

**Pro Tips:**
• Quality-filter reads first (Q>20 recommended)
• Check for adapter contamination
• Use appropriate controls
• Compare with traditional pipelines (Kraken2)

**Current Location:**
You're in the Chat Assistant - I can answer questions but can't process files directly. For sequence analysis, use the main BAIO interface."""
            
            else:
                return f"""I'm the BAIO assistant for metagenomic pathogen detection. I can help with:

• **System Usage**: How to upload and analyze sequences
• **Understanding Results**: Interpreting classifications and novelty scores
• **Technical Questions**: Evo2 embeddings, OOD detection methods
• **Best Practices**: Sample prep, quality control, validation

**You asked:** "{messages[-1]['content']}"

**Suggestions:**
- Want to analyze a sequence? → Use the Analysis tab or paste the full sequence
- Questions about results? → Share your report and I'll interpret it
- Technical details? → Ask about specific methods (Evo2, Mahalanobis, etc.)
- Getting started? → I can walk you through the workflow

What would you like to know more about?"""
                
        except Exception as e:
            raise Exception(f"LLM API call failed: {str(e)}")

# ============================================================================
# SYSTEM PROMPTS
# ============================================================================

SYSTEM_PROMPTS = {
    "default": """You are an expert bioinformatics assistant for BAIO (Bioinformatics AI for Open-set detection), a metagenomic pathogen detection system. 

Your role is to:
- Explain how BAIO's open-set detection works
- Help users interpret taxonomy classifications and novel sequence detections
- Provide guidance on using the platform
- Answer questions about metagenomic surveillance and pathogen detection

Be clear, concise, and technical when appropriate. Always prioritize accuracy and safety in clinical contexts.""",
    
    "analysis_helper": """You are analyzing metagenomic sequencing data with BAIO. Help the user understand:
- Taxonomy classifications (viral families, bacterial groups, host sequences)
- Novel/unknown sequence detections and their significance
- Confidence scores and quality metrics
- Recommended next steps based on findings

Focus on actionable insights and clinical relevance.""",
    
    "technical_expert": """You are a technical expert on BAIO's architecture. Explain:
- The Evo2 embedding model and its advantages
- Open-set detection methods (MSP, Energy, Mahalanobis)
- Model training and evaluation metrics
- Integration with traditional pipelines like Kraken2

Use precise technical language and cite relevant papers when appropriate."""
}

# ============================================================================
# SESSION STATE INITIALIZATION
# ============================================================================

def initialize_session_state():
    """Initialize session state variables."""
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    if "llm_client" not in st.session_state:
        st.session_state.llm_client = LLMClient()
    
    if "system_prompt" not in st.session_state:
        st.session_state.system_prompt = SYSTEM_PROMPTS["default"]
    
    if "conversation_id" not in st.session_state:
        st.session_state.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if "error_count" not in st.session_state:
        st.session_state.error_count = 0

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def display_chat_message(role: str, content: str):
    """Display a chat message with appropriate styling."""
    with st.chat_message(role):
        st.markdown(content)

def clear_conversation():
    """Clear the conversation history."""
    st.session_state.messages = []
    st.session_state.error_count = 0
    st.session_state.conversation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    st.rerun()

def export_conversation():
    """Export conversation history as text."""
    if not st.session_state.messages:
        return None
    
    export_text = f"BAIO Conversation Export\n"
    export_text += f"Conversation ID: {st.session_state.conversation_id}\n"
    export_text += f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
    export_text += "="*60 + "\n\n"
    
    for msg in st.session_state.messages:
        role = msg["role"].upper()
        content = msg["content"]
        export_text += f"{role}:\n{content}\n\n"
    
    return export_text

def validate_input(user_input: str) -> tuple[bool, Optional[str]]:
    """
    Validate user input.
    
    Returns:
        (is_valid, error_message)
    """
    if not user_input or user_input.strip() == "":
        return False, "Please enter a message."
    
    if len(user_input) > 2000:
        return False, "Message is too long. Please keep it under 2000 characters."
    
    return True, None


def main():
    """Main application entry point."""
    
    # Initialize session state
    initialize_session_state()
    
    # Sidebar
    with st.sidebar:
        st.title("⚙️ Settings")
        
        # System prompt selection
        st.subheader("Assistant Mode")
        prompt_choice = st.selectbox(
            "Select mode:",
            options=list(SYSTEM_PROMPTS.keys()),
            format_func=lambda x: x.replace("_", " ").title()
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
                    use_container_width=True
                )
        
        # Stats
        if st.session_state.messages:
            st.divider()
            st.subheader("Statistics")
            st.metric("Messages", len(st.session_state.messages))
            st.metric("Errors", st.session_state.error_count)
        
        # Info
        st.divider()
        st.info("""
        **BAIO Assistant**
        
        Ask questions about:
        - Open-set pathogen detection
        - Taxonomy classification
        - Analysis interpretation
        - System usage
        """)
    
    # Main content area
    st.title("🧬 BAIO - Pathogen Detection Assistant")
    st.markdown("Ask questions about metagenomic analysis, pathogen detection, and using BAIO.")
    
    # Display chat history
    for message in st.session_state.messages:
        display_chat_message(message["role"], message["content"])
    
    # Chat input
    if prompt := st.chat_input("Ask a question about pathogen detection..."):
        
        # Validate input
        is_valid, error_msg = validate_input(prompt)
        if not is_valid:
            st.error(error_msg)
            return
        
        # Add user message to chat
        st.session_state.messages.append({"role": "user", "content": prompt})
        display_chat_message("user", prompt)
        
        # Generate response
        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                try:
                    # Call LLM
                    response = st.session_state.llm_client.generate_response(
                        messages=st.session_state.messages,
                        system_prompt=st.session_state.system_prompt,
                    )
                    
                    # Display response
                    st.markdown(response)
                    
                    # Add to conversation history
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": response
                    })
                    
                except Exception as e:
                    st.session_state.error_count += 1
                    error_message = f"⚠️ Error generating response: {str(e)}"
                    
                    # Show retry option for transient errors
                    if st.session_state.error_count < 3:
                        st.error(error_message)
                        st.info("Please try rephrasing your question or try again.")
                    else:
                        st.error(error_message)
                        st.error("Multiple errors detected. Please check your API configuration.")
                    
                    # Log error (in production, use proper logging)
                    print(f"[ERROR] {datetime.now()}: {str(e)}")

if __name__ == "__main__":
    main()