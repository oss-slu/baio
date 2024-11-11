from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS

# Load model
model = pipeline("text2text-generation", model="Salesforce/codet5-base")

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    input_text = data['input']
    outputs = model(input_text)
    return jsonify(outputs[0])

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
