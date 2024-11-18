import json
import socket
from flask import Flask, request, jsonify
from flask_cors import CORS 
from transformers import pipeline
import os

app = Flask(__name__)
CORS(app)  

# loads the HuggingFace model
model = pipeline("text2text-generation", model="Salesforce/codet5-base")
print("Model loaded successfully.")

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def update_config_json(port):
    config_path = os.path.join(os.path.dirname(__file__), "public", "config.json")
    try:
        with open(config_path, "w") as config_file:
            json.dump({"backendPort": port}, config_file)
            print(f"Updated config.json with port: {port}")
    except Exception as e:
        print(f"Error updating config.json: {e}")

# defines an API endpoint to send input and request output from the model
@app.route('/predict', methods=['POST'])
def predict():
    """Handle prediction requests."""
    try:
        data = request.json
        input_text = data.get('input', '')

        print(f"Received input: {input_text}")

        outputs = model(input_text)

        print(f"Prediction output: {outputs}")
        return jsonify({"success": True, "output": outputs[0]['generated_text']})
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"success": False, "message": str(e)})

if __name__ == "__main__":
    port = find_free_port()
    
    update_config_json(port)

    print(f"Starting Flask server on port {port}")
    app.run(host="0.0.0.0", port=port)
