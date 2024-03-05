from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import pytesseract
from PIL import Image
import os

app = Flask(__name__)


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
        text = pytesseract.image_to_string(Image.open(filepath))
        os.remove(filepath)  # Clean up after processing
        return jsonify({"text": text})


if __name__ == "__main__":
    app.run(debug=True)
