"""
@file app.py
@description A Flask API for interacting with a HuggingFace model to perform text-to-text generation.

Purpose:
- This Flask application exposes an endpoint `/predict` where users can send input text, 
  and receive generated text as output from a pre-trained HuggingFace model (`Salesforce/codet5-base`).
- The HuggingFace model is used to generate predictions based on provided input text.

Key Functions:
- `find_free_port()`: Detects and returns an available port for the Flask application to bind to.
- `update_config_json(port)`: Updates the `config.json` file in the `public` directory with the new port number, 
  allowing the frontend to dynamically adjust to the backend port.
- `/predict` (POST): An API endpoint that takes input text in the request body, 
  sends it to the HuggingFace model for text generation, and returns the generated text in the response.

Dependencies:
- `Flask`: Web framework to create and manage the API.
- `Flask-CORS`: Middleware to handle cross-origin requests, allowing the API to be consumed by frontend applications hosted on different domains.
- `transformers`: HuggingFace library used to load and interact with pre-trained models.
- `socket`: Used to find an available port for the Flask app to bind to dynamically.
- `json`: Used to handle configuration data stored in `config.json`.
- `os`: Used for path manipulations and file handling.

"""

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

