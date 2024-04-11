from flask import Flask, request, jsonify
import json
from google.api_core.client_options import ClientOptions
from google.cloud import documentai
from google.oauth2 import service_account

# from dotenv import load_dotenv
import os
import io
import base64

# load_dotenv()

app = Flask(__name__)


def get_documentai_client():
    # Decode the base64 credentials
    creds_json = base64.b64decode(os.environ["GOOGLE_CREDENTIALS_BASE64"]).decode(
        "utf-8"
    )
    creds = service_account.Credentials.from_service_account_info(
        json.loads(creds_json)
    )

    # Create a Document AI client with the decoded credentials
    client = documentai.DocumentProcessorServiceClient(credentials=creds)
    return client


@app.route("/process-document", methods=["POST"])
def process_document():
    if "document" not in request.files:
        return jsonify({"error": "No document part"}), 400

    file = request.files["document"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        PROJECT_ID = os.environ["PROJECT_ID"]
        LOCATION = os.environ["LOCATION"]
        PROCESSOR_ID = os.environ["PROCESSOR_ID"]

        # Adjust based on the actual file type
        MIME_TYPE = os.environ["MIME_TYPE"]

        docai_client = get_documentai_client()

        RESOURCE_NAME = docai_client.processor_path(PROJECT_ID, LOCATION, PROCESSOR_ID)

        # Read the file from the POST request
        image_content = file.read()

        raw_document = documentai.RawDocument(
            content=image_content, mime_type=MIME_TYPE
        )
        request = documentai.ProcessRequest(
            name=RESOURCE_NAME, raw_document=raw_document
        )

        result = docai_client.process_document(request=request)
        document_object = result.document

        # Extracted data transformation (simplified for example purposes)
        entities = [
            {
                "Type": entity.type_,
                "Properties": [
                    {"Type": prop.type_, "Content": prop.text_anchor.content}
                    for prop in entity.properties
                ],
            }
            for entity in document_object.entities
        ]

        return jsonify({"entities": entities})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health_check():
    return "OK", 200


if __name__ == "__main__":
    app.run(debug=True)
