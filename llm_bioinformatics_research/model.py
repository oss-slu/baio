import sys
import json
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM

# Load the model and tokenizer
tokenizer = AutoTokenizer.from_pretrained("Salesforce/codet5-base")
model = AutoModelForSeq2SeqLM.from_pretrained("Salesforce/codet5-base")
pipe = pipeline("text2text-generation", model=model, tokenizer=tokenizer)

# Read input from stdin
def main():
    input_text = json.loads(sys.stdin.read()).get("input_text", "")
    if input_text:
        result = pipe(input_text, max_length=50, num_return_sequences=1)
        print(json.dumps({"output": result[0]["generated_text"]}))
    else:
        print(json.dumps({"error": "No input text provided"}))

if __name__ == "__main__":
    main()
