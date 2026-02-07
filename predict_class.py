# Updated predict_class.py with closed DNA sequence string

def predict_class(dna_sequence):
    # Function implementation
    if not isinstance(dna_sequence, str):
        raise ValueError('Input must be a string')

    if len(dna_sequence) == 0:
        return 'No sequence provided'
    
    # Assuming some logic to predict class based on the provided DNA sequence
    # For this example, let's say we check for certain features
    if 'ATG' in dna_sequence:
        return 'Start Codon Detected'
    else:
        return 'No Start Codon Detected'