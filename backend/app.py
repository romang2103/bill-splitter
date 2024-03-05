from flask import Flask, request, jsonify
from PIL import Image
import pytesseract

app = Flask(__name__)


@app.route("/api/ocr", methods=["POST"])
def ocr():
    try:
        # Assuming the image is sent as form data with the key 'image'
        print(request.files)
        image_file = request.files["image"]
        print("image file:", image_file)
        image = Image.open(image_file)

        # Perform OCR using pytesseractr
        text_result = pytesseract.image_to_string(image)
        print("text: ", text_result)

        return jsonify({"text_result": text_result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
