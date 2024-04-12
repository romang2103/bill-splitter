from flask import Flask, request, jsonify
import json
from google.api_core.client_options import ClientOptions
from google.cloud import documentai
from google.oauth2 import service_account
import os
import io
import base64
import logging

# Initialize Flask app
app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()


def get_documentai_client():
    # Decode the base64 credentials
    try:
        creds_json = base64.b64decode(os.environ["GOOGLE_CREDENTIALS_BASE64"]).decode(
            "utf-8"
        )
        logger.info("creds_json: " + creds_json)

        creds = service_account.Credentials.from_service_account_info(
            json.loads(creds_json)
        )
        logger.info("creds: " + creds)

        # Create a Document AI client with the decoded credentials
        client = documentai.DocumentProcessorServiceClient(credentials=creds)
        return client
    except Exception as e:
        logger.error(f"Failed to get Document AI client: {str(e)}")
        raise


@app.route("/process-document", methods=["POST"])
def process_document():
    if "document" not in request.files:
        return jsonify({"error": "No document part"}), 400

    file = request.files["document"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        LOCATION = os.environ.get("LOCATION")
        PROCESSOR_ID = os.environ.get("PROCESSOR_ID")
        MIME_TYPE = os.environ.get("MIME_TYPE")  # Adjust based on the actual file type

        if not all([PROJECT_ID, LOCATION, PROCESSOR_ID, MIME_TYPE]):
            raise ValueError("One or more environment variables are missing.")

        docai_client = get_documentai_client()
        logger.info("Doc AI client: " + docai_client)

        RESOURCE_NAME = docai_client.processor_path(PROJECT_ID, LOCATION, PROCESSOR_ID)

        # Read the file from the POST request
        image_content = file.read()

        raw_document = documentai.RawDocument(
            content=image_content, mime_type=MIME_TYPE
        )
        docai_request = documentai.ProcessRequest(
            name=RESOURCE_NAME, raw_document=raw_document
        )

        result = docai_client.process_document(request=docai_request)
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
        logger.error(f"Error processing document: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health_check():
    return "OK", 200


if __name__ == "__main__":
    app.run(debug=True)
