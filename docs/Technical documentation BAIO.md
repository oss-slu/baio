# Intro to Metagenomics

**Metagenomics Definition:**

- Is the study of genetic material directly from environmental or clinical samples, which allows for analysis of entire microbial communities  
- Containing DNA from multiple organisms simultaneously  
  - Often used to study a specific community of microorganisms

  (It gets complicated because the genes could come from various different organisms, may get contaminated, or is simply from an unknown organism)

**Traditional genomics vs metagenomics CS analogy:**  
Traditional genomics → analyzing one application's source code  
Metagenomics → analyzing all code running on a server simultaneously

**Key Applications:**

* Human microbiome research (gut, skin, oral)  
* Environmental monitoring (soil, water, air)  
* \*\* Clinical diagnostics (infection identification)  
* Food safety and quality control  
* biotechnology  
  - The relatively small size of virus genomes causes them to be excellent systems to work with for any sequencing based project

**Core Concepts:**  
Taxonomic Ranks: Domain → phylum → class → order → family → genus → species

* Operational taxonomic Units (OTUs): Clusters of similar sequences representing species-level groups  
* Amplicon Sequence Variants (ASVs): single-nucleotide resolution units  
* Coverage depth: \# of reads mapping to specific regions  
* Rarefaction: normalization for unequal sequencing depths

# Mixed Community Analysis

**Mixed Community Analysis**

**Challenge:** A single sample contains DNA from hundreds or thousands of different organisms.  
**Example of Clinical Sample:**

1) Host (human) DNA: 60-90%  
2) Bacterial DNA: 5-30%  
3) Viral DNA: 0.1-5%  
4) Fungal DNA: 0.1-2%  
5) Unknown organisms: variable

**Key Concepts:**

1) Abundance/coverage: how much of each organism is present  
2) Diversity metrics:  
- Alpha: measures species diversity within a single community or sample 

  → like counting unique processes

- Beta: measures the difference in species composition between 2 or more communities

  → like comparing two servers’ running processes 

3) Contamination Sources:  
- Lab contamination  
- Human handling (skin bacteria)  
- Environmental sources

# Taxonomic Profiling Approaches

**Taxonomic Profiling:** The process of figuring out which organisms are present  
Example: classifying emails into separate folders → instead of “work” vs “spam,” 

- Similarly, the DNA fragments are categorized into “bacteria \_\_,” “virus \_\_,” etc..  
  * A sequence is read and compared with the database → helps us check for pathogens and detect contamination 


OPTIONS FOR TAXONOMIC PROFILING:

1. **K.mer Based classification (Kraken2, Kaiju)**  
   **How it works:**  
1. Break each DNA into many small pieces of length k (called k-mers)  
2. Look up each k-mer in database  
3. Find lowest common ancestor (LCA) of all matches  
4. Use this LCA to assign read to a taxonomic group (species, genus, etc.)

	**Advantages:**

* Extremely fast  
* Use smart data structure (like hash tables) to save memory   
* Good for known organisms (i.e. already in the database)

	**Limitations/Cons:**

* Requires exact or near-exact matches \- so can’t handle mutations well  
* Struggles with novel organisms  
* Accuracy depends entirely on how good and complete the database is.

2. **Alignment-Based Classification (BLAST, DIAMOND)**  
   **How it works:**  
1. Compare each read to a reference database by trying to align it with known sequences   
2. Score alignment quality based on how well it matches  
3. Assign taxonomy based on best alignments/matches  
4. If there’s multiple good matches, again use LCA to assign the read

	**Advantages:**

* More sensitive to distant/imperfect matches  
* Gives detailed alignment information (i.e. info on exactly how the read matches the reference)  
* Better at detecting less common or unusual organisms

	**Limitations/Cons:**

* Much slower  
* Computationally expensive (uses a lot of CPU and memory)  
* Still database dependent 

3. **Marker Gene Approaches (MetaPhIAn, mOTUs)**  
   **How it works:**  
1. Search for specific genes that are unique to certain species (marker genes)  
2. Check how many reads match each marker gene  
3. Use that to estimate how abundant each species is in the sample  
4. Build community profile (contains which organisms are present and in what proportions)

	**Advantages:**

* Highly specific (which means there’s low false positives)  
* Good for estimating relative abundance   
* Less affected by database size which makes it faster than alignment

	**Limitations/Cons:**

* Only detects organisms with known markers  
* Misses novel organisms entirely  
* May not tell apart closely related species well  
* Only uses a small part of the genome (marker genes) which means theres lowe coverage

4. **Machine Learning Approaches \*\*OUR PROJECT\*\***  
   **How it works:**  
1. Converts DNA sequences into numerical representations (called embeddings) using a pre-trained model like Evo2)  
2. Train classifier on known classes using those embeddings  
3. Use confidence scores for open-set detection  
4. Flag low-confidence predictions as “novel”

	**Advantages:**

* Can detect novel organisms (open-set recognition)  
* Learns complex sequence patterns  
* Potentially more robust to mutations (i.e. has the capacity to maintain a certain characteristic, function, or fitness level despite genetic changes)

	**Limitations/Cons:**

* Requires a good amount of training data  
* Can be computationally intensive to train and run  
* Acts like a black box (hard to interpret how it made a decision → high complexity)

# Assembly vs Read-Based Methods

**Assembly-Based Methods**  
**Process:**  
Raw reads → assembly → contigs → gene prediction → classification

- Starts with raw reads  
- Assembles these reads into longer sequences called contigs   
- Predicts genes without those contigs  
- Classifies the contigs or predicted genes using alignment tools/databases (this info is used both for taxonomy and function)

**Characteristics:**

* Slower  
* Requires higher coverage (lots of data) to assemble properly  
* Provides functional information regarding gene and pathways (can tell you what organisms are doing \+ who they are)  
* Can help identify novel organism because it doesn’t rely entirely on short read matches

**Use Cases:**

* Discovering new species  
* Doing functional metagenomics (understanding what genes are active or present)  
* Genome reconstruction 

**Limitations:**

* Resource heavy  
* Assembly might be incomplete or fragmented if coverage is low  
* Harder to use for low-abundance organisms

---

**Read-Based Methods \*\*OUR PROJECT\*\***  
**Process:**  
Raw reads → classification → taxonomic profile

- Starts with raw sequencing dreads (short fragments of DNA)  
- Classified using model  
- Based on classifications of all reads, a taxonomic profile is built

**Characteristics:**

* Fast turnaround  
* Works with short reads  
* Good for estimating species abundance (how many of each organism is there)  
* There’s limited/incomplete understanding of how a system operates

**Use Cases:**

* Rapid pathogen screening  
* Community composition analysis  
* Real-time surveillance 

# Common Challenges and Solutions

**Challenges:**  
**\#1 \- Host Contamination**  
**Problem:** 60-90% of reads unusable  
**What this means:** when sequencing a sample, most of the DNA comes from the host (not the microbe we’re trying to find)  
**Solution**: Pre-filter host reads  
	Simple explanation

- What it does → removes all human DNA before analyzing microbes  
- How it works → it compares every DNA sequence to the human genome (if it matches, then it gets thrown away)  
- Example: its like sorting m\&ms → removing all the red ones (host DNA) so you can count the other colors  (microbes)

**Process:**

1. Take your DNA sequences  
2. Compare each one to the human genome database  
3. If it matches → delete it (its host DNA)  
4. If it doesn't match → keep it (its microbial DNA)

---

**\#2 \- Low Abundance Pathogens**  
**Problem:** Missed detections  
**What this means:** some bacteria/viruses are rare in our sample which makes them very hard to find  
**Solution:**  
	Option 1: Enrichment

- What it does → increases the amount of target dna before sequencing  
- How it works →  special techniques are used to multiply the dna that we care about/focusing on  
- Example: using a magnet to pull out all the metal pieces from a pile of sand  
- How:  
  - Add a probe that sticks to the dna that we are targeting  
  - Grow the target organism in culture  
  - Remove the other organisms to make the rare ones more visible

	Option 2: Deeper Sequencing

- What it does → it essentially means looking harder, so we sequence more dna from the sample  
- How it works → we increase the chance of finding the rare organisms by generating millions more sequences  
- Example: buying more and more packs of pokemon cards in hope of getting the rare card  
- Con: it is more expensive (but more thorough as well)

---

**\#3 \- Novel Organisms**  
**Problem:** Traditional tools failed  
**What this means:** the standard tools only recognize microbes that are in their database. So new/unknown organisms get missed completely.  
**Solution:** ML based open-set detection  
Machine Learning (ML)

- What it does →  it learns patterns from known organisms, then recognizes when something doesn’t fit any known patterns  
- How its different from traditional tools → ML approach doesn't need an exact match because it understands the biological patterns  
- Example: we recognize a new type of apples even if never seen/heard of before because its still characteristically an apple  
  	Open-set detection:  
- Means it recognizes that this is something new instead of forcing it into a wrong category  
- Learns the characteristics of the organism and its families which helps it makes educated guess about the novel organisms

**Approach:**

1. Train AI on the known microbes  
2. AI then learns to distinguish between the different viruses, fungi, etc  
3. Now when given an unknown dna, it can say something like “this is a novel organism, but looks like a new type of \_\_\_” even without an exact match

---

**\#4 \- Sequencing Errors**  
**Problem:** false classifications  
**Solution:**   
	Option 1: Quality Filtering

- What it means → deleting sequences that are very likely wrong  
- How it works → each dna letter has a “confidence score,” so we would throw away the low confidence ones   
  	Option 2: Error Correction  
- What it does → uses statistics to fix the errors instead of deleting them  
- How it works:   
  - example:

    If we see the same sequence 50 times and 1 version has a different letter, the 1 is probably wrong, so we fix it to match the other 49

- Process or best method:  
  - Start by comparing the similar sequences  
  - Use coverage depth (which is a count of how many times a specific part of a genome is read)  
    - If most say “A” and one says “G,” it's probably “A”  
  - Look for impossible patterns (like stop codons in the middle of genes)

Approach:

1. Remove the poor quality sequences (extremes)  
2. Make an attempt of correcting the more minor errors   
3. Don’t make changes to the high quality sequences

---

**\#5 \- Database Bias**  
**Problem:** Results are skewed  
**What this means:** the database contains more information about the well known organisms than the rare/novel organisms which creates unfair comparisons  
**Solution:** Utilizing a ML approach with multiple databases  
		Option 1: Multiple Databases

- This way the sequences get checked against multiple different genome collections (different databases have different strengths)  
- Pro: if an organism shows up in multiple databases → there's more confidence in its accuracy/credibility

		Option 2: ML approach

- As mentioned above, ML models would learn the biological patterns instead of memoizing the exact sequence → organisms can be identified even without a perfect database match → can handle genetic variation better

Combined Approach:

1. For the initial classification, use 2-3 different databases  
2. Apply the ML models  
3. Report the confidence levels and flag down the organisms found only in one database as uncertain

---

**\#6 \- Chimeric Reads**  
**Problem:** wrong classifications  
**What this means:** likely that during sample preparation, DNA from two different organisms can stick together, which creates a fake “hybrid” sequence that doesn't actually exist  
	How they form (in detail):

- Dna piece from organism 1 starts copying  
- Stops midway through  
- Jumps to dna from organism 2 and continues copying   
- Result \= chimera \= sequence formed from half org 1 and half org 2 

**Solution:** chimeric detection tools and filters for length  
		Option 1: Chimera Detection tools

- What they do → recognize sequences that look like combinations of other sequences  
- How they work: (basically the opposite of how a chimera is formed)  
  - Split sequences into parts  
  - Check if the parts match different organisms  
  - If front matches one organism, and the back matches another, it is very likely its chimeric

		Option 2: Length filters

- What it does → removes sequences that are at a wrong length  
- Why it helps → characteristically chimeras are either unusually long or short, so this way it would be easier to spot them

---

| Summary |  |  |
| ----- | :---- | :---- |
| **Challenge** | **Solution** | **Why \+ how it works** |
| **Host Contamination** | Recognize, match, and remove the host dna | Gets rid of the useless data early on |
| **Low abundance pathogens** | Get more dna or sequence more | Increases chances of detection |
| **Novel organisms** | Use AI pattern recognition | Perfect database match isn’t required |
| **Sequencing errors** | Delete bad quality and fix the minor errors | Removes the mistakes and also fixes the mistakes |
| **Database bias** | Compare or check multiple databases and use ML approach | Reduces the reliance on one source and expands our research |
| **Chimeric reads** | Detect the hybrids and filter out the extreme lengths | Identifies and removes the fake sequences |

