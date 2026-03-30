ORGANISM_PATTERNS = {
    "human": "Human (Homo sapiens)",
    "homo sapiens": "Human (Homo sapiens)",
    "chr": "Human (Homo sapiens)",
    "sars-cov-2": "SARS-CoV-2 (Coronavirus)",
    "coronavirus": "SARS-CoV-2 (Coronavirus)",
    "covid": "SARS-CoV-2 (Coronavirus)",
    "nc_045512": "SARS-CoV-2 (Coronavirus)",
    "hiv": "HIV-1 (Human Immunodeficiency Virus)",
    "influenza": "Influenza Virus",
    "ebola": "Ebola Virus",
    "e. coli": "E. coli (Escherichia coli)",
    "escherichia": "E. coli (Escherichia coli)",
    "mouse": "Mouse (Mus musculus)",
    "mus musculus": "Mouse (Mus musculus)",
    "rat": "Rat (Rattus norvegicus)",
    "dog": "Dog (Canis familiaris)",
    "cat": "Cat (Felis catus)",
    "yeast": "Yeast (Saccharomyces cerevisiae)",
    "drosophila": "Fruit Fly (Drosophila melanogaster)",
    "zebrafish": "Zebrafish (Danio rerio)",
}


def detect_organism(seq_id: str, sequence: str) -> str:
    seq_id_lower = seq_id.lower()
    for pattern, name in ORGANISM_PATTERNS.items():
        if pattern in seq_id_lower:
            return name
    return "Unknown organism"
