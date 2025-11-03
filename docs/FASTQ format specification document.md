# FASTQ Format Deep Dive

**Intro to FASTQ format**  
**Definition**   
Standard format file for storing sequences with their quality scores.  
**Why it's important for metagenomics:**

- The fastq files contain   
  - raw sequencing reads from the different microbial communities  
  - the quality scores  
  - Metadata about sequencing position  
  - Critical information

---

**Structure:**  
**Basic Structure** → 4 lines

| @SEQ\_ID  Sequence \+ Quality  |
| :---- |

**Description or structure breakdown :**

1. ‘@SEQ-ID’   
   → Header/identifier line  
   → Contains the sequence identifier (and optional description)  
   → an unique identifier of the read  
2. Sequence  
   → the dna sequence  (A, T, G, C)  
3. ‘+’    
   → to repeat the identifier (optional)  
   → Separates sequence and quality score  
4. Quality   
   → its ASCII encoded   
   → same length as the sequence

   → each of the characters is a representation of the quality of the corresponding letter in line 2 (sequence)

---

**Header Line**  
**Base Structure**   
@ Instrument ID : Run\# :  Flowcell ID :  lane\#  :  tile\# : x coord. : y coord. : read\#: status  : control\# : index   
**Why:**

1. To detect duplicates → x/y coordinates identify  
2. Quality → title/lane info helps with quality issues  
3. Sample → index helps identify samples  
4. Read pairings → read \# links R1 and R2 files  
5. Troubleshooting → run/flowcell info traces problems back to its origin

---

**Quality Score:**  
**Basic Understanding** 

- quality scores (q-score) represent the probability that its incorrect base cell

**The Phred Quality Score:**  
Formula →  Q \= \-10 log10(P)   
	Q \= quality score  
	P \= probability of incorrect base cell   
**Interpretation of Qscore:**

| Q score | Error Probability | Accuracy →  meaning |
| :---- | :---- | :---- |
| 10 | 1 in 10 | 90% → low quality |
| 20  | 1 in 100 | 99% → acceptable |
| 30  | 1 in 1000 | 99.9% → good quality |
| 40  | 1 in 10,000 | 99.99% → excellent |
| 50  | 1 in 100,000 | 99.999% → spectacular |

**ASCII Encoding (Quality scores)**  
Quality scores as encoding as ASCII characters  
Format → Q \= ASCII value \- ASCII base  
	             \= ASCII value \- 33  		//33 is the most common base  
Range → ASCII characters range from \! to J which covers Q0 to Q41   
             → Phred scores also range from 0 to 41   
	  
---

**Paired-end considerations:**  
**Basic Understanding**   
Paired-end sequencing reads both ends of a dna segment, which produces two files: R1 (forwards reads) and R2 (reverse reads)  
**Structure:**

**Some Rules:**

- R1 and 2 must be in the same order  
- Both files must have the same number of reads  
- The compared reads should have the same ID (followed by /1 or /2)  
- Both files should be processing similarly/simultaneously

**Pairing in Metagenomics:**  
Pros:

+ Two reads per fragment decreases errors  
+ Paired reeds help with connecting contigs  
+ There's more context for classification

---

**Quality Issues:**  
**\#1 \- Decrease in quality**   
**Description**: The quality scores typically decrease at the end of the dreads  
**Why:** 

- Signal decay over cycles  
- Phasing (loss of sync between the paired dna fragments)  
  **Solution:** removing the low quality ends

**\#2 \- Areas of low complexity**   
**Description**: lower sequence diversity \+ homopolymer runs i.e. repetitive sequences   
**Why:** 

- The fragment is shorter than the read length  
- Adapter dimers (formed when the short fragments accidentally join with each other )  
  **Impact:** quality score drops, there's going to be issues with alignment, and possible formation of sequencing artifacts (non-biological variations)  
  **Solution:** Filtering out the Low complexity fragments

**\#3 \- N bases**   
**Description**: its an ambiguous case \- represents uncertainty regarding specific positions  in a sequence  
**Why/causes:** 

- Technical issues  
- Low signal intensity  
- Repetitiveness   
  **Pointers:** Reads with \>5% N are discarded; N bases quality score → 2 (\!)

# FASTQ Parsing

**FATSQ Parsing**  
*(parsing refresher)*  
**Definition:** process of reading and interpreting a FASTQ file (primarily the biological sequence and its quality score)  
**Process:** A parser..

1. reads the file  
2. identifies the 4 lines  
3. Extracts the relevant information from each line

**Why:** important for data extraction → fastq files have sequences and quality information combined  
---

**Examples**   
**Example 1: Simple/Basic**

| def read\_fastq\_simple (filename): 	“”” *\#\# This function opens the file, reads 4 lines at a time, prints the information, and repeats until the file ends.* 	“”” 	with open(filename, ‘r’) as file: 		read\_counter \= 0 		while True: 			*\# Line 1* header\_line \= file.readline() 			If not header\_line: 				break *\#exit the loop \# Line 2* 			sequence\_line \= file.readline() *\# Line 3* 			plus\_line \= file.readline() *\# Line 4* 			quality\_line \= file.readline() 			header \= header\_line.strip() 			sequence \= sequence\_line.strip() 			quality \= quality\_line.strip() 			 			read\_counter \+=1 			 			*\#Print statements …….* | What's happening: with open(filename, ‘r’) → opens file file.readline() → reads one line from the fle .strip() → removes the whitespaces \+ newlines Loop continues until readline() returns an empty string (which means its at the end of file) |
| :---- | :---- |

**Example 2: Reading compressed files (quite common with fastq files)**

| import gzip  def read\_fastq\_smart (filename): 	“”” *\#\# This function opens automatically checks if the file compressed* 	“”” 	if filename.endsswith(‘.gz’): *\#\# makes sure we can find the compressed files for which we use gzip to open* File\_unzip \= gzip.open(filename, ‘rt’) *\#Print statement* 	else: File\_handle \= open(filename, ‘rt’) *\#regular txt file \- print statement* 	read\_counter \= 0 	 	Try: 		While true: 			*\#read all 4 lines* 			header \= file\_handle.readline().strip() 			 			if not header:  break  sequence \= file\_handle.readline().strip()  plus \= file\_handle.readline().strip()  quality \= file\_handle.readline().strip()  read\_counter \+= 1 			*\#Print statements …….*                   Finally:                                       file\_handle.close() | What's happening: gzip.open() \- opens the compressed files ‘Rt’ \- is a read text mode (we don’t want binary) try/finally \- makes sure the file closes even if there's an error .endswith(‘.gz’) \- checks for files named ending with .gz |
| :---- | :---- |

# Tool Comparison

**Kraken2 vs MetaPhlAn**

|  | Kraken 2 | MetaPhlAn |
| :---- | :---- | :---- |
| Speed | Very fast (optimized for large datasets) | Moderate (minutes to hours) Slower due to marker search, but efficient for profiling |
| Database | K-mer based (bacterial, viral, fungal genomes) \- whole genome database | Marker gene based (smaller, pre-built) |
| Input Data | Raw FASTQ reads  | Raw FASTQ reads |
| Accuracy | High sensitivity → may include false positives due to similar k-mers | High precision → low false positives Recommended (quality filtering, adapter trimming) |
| Use Cases | Metagenomics, read-level classification, detecting rare taxa Quick screening, real-time analysis | Species-level profiling, Microbiome profiling, community composition analysis, comparative studies |
| Database Setup | build/download k-mer database (8-200GB) | Download marker database (\~1GB) |
| Customization | Custom database can be built easily | Database updates are less flexible (predefined) |
| Classification | Exact k-mer matching against database | Map reads to marker genes |
| Output Generation | Read classification \+ taxonomic report | Relative abundance tables, species-level summaries |

