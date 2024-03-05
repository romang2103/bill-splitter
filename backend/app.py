from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image
import os

app = Flask(__name__)

# Configure the path to the Tesseract binary on Heroku
pytesseract.pytesseract.tesseract_cmd = "/app/.apt/usr/bin/tesseract"


@app.route("/api/ocr", methods=["POST"])
def upload_file():
    if "image" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join("/tmp", filename)
        file.save(filepath)
        try:
            text = pytesseract.image_to_string(Image.open(filepath))
        except Exception as e:
            os.remove(filepath)  # Clean up after processing
            return jsonify({"error": f"OCR processing failed: {str(e)}"}), 500
        os.remove(filepath)  # Clean up after processing
        return jsonify({"text": text})


@app.route("/health")
def health_check():
    return "OK", 200


if __name__ == "__main__":
    app.run(debug=True)
