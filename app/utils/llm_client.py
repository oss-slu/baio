"""LLM client wrapper for BAIO chat functionality."""

import os
import time
from typing import List, Dict


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
            if any(
                keyword in user_query
                for keyword in ["analyze", "analyse", "detect", "identify", "classify"]
            ) and any(base in user_query.upper() for base in ["ATCG", "GCTA", "TACG"]):
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

            elif (
                "upload" in user_query
                or "file" in user_query
                or "how do i" in user_query
            ):
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


# System prompts for different assistant modes
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

Use precise technical language and cite relevant papers when appropriate.""",
}
