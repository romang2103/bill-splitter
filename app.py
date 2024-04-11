#!/usr/bin/env python3
from flask import Flask, request, jsonify
from google.cloud import documentai
from google.oauth2 import service_account
from google.api_core.client_options import ClientOptions
import os
import json

app = Flask(__name__)


@app.route("/process-document", methods=["POST"])
def process_document():
    if "document" not in request.files:
        return jsonify({"error": "No file provided with key 'document'"}), 400

    file = request.files["document"]

    PROJECT_ID = "evensteven"
    LOCATION = "eu"
    PROCESSOR_ID = "9f4ba5473e27e98f"
    MIME_TYPE = "image/jpeg"

    # Directly use credentials from environment variables
    credentials_json = json.loads(
        os.environ.get("GOOGLE_CREDENTIALS")
    )  # Assumes JSON in string format
    credentials = service_account.Credentials.from_service_account_info(
        credentials_json
    )

    docai_client = documentai.DocumentProcessorServiceClient(
        credentials=credentials,
        client_options=ClientOptions(
            api_endpoint=f"{LOCATION}-documentai.googleapis.com"
        ),
    )

    RESOURCE_NAME = docai_client.processor_path(PROJECT_ID, LOCATION, PROCESSOR_ID)

    image_content = file.read()

    raw_document = documentai.RawDocument(content=image_content, mime_type=MIME_TYPE)

    doc_request = documentai.ProcessRequest(
        name=RESOURCE_NAME, raw_document=raw_document
    )

    result = docai_client.process_document(request=doc_request)
    document_object = result.document
    print("Document processing complete.")

    entities = [
        {
            "Type": entity.type_,
            "Properties": [
                {
                    "Type": prop.type_,
                    "Content": prop.text_anchor.content,
                }
                for prop in entity.properties
            ],
        }
        for entity in document_object.entities
        if entity.type_ == "line_item"
    ]
    total_amount = 0
    total_tax_amount = 0

    for entity in document_object.entities:
        if entity.type_ == "total_amount":
            total_amount = entity.mention_text
        elif entity.type_ == "total_tax_amount":
            total_tax_amount = entity.mention_text

    return jsonify(
        {
            "entities": entities,
            "total_tax_amount": total_tax_amount,
            "total_amount": total_amount,
        }
    )


@app.route("/health")
def health_check():
    return "OK", 200


if __name__ == "__main__":
    # Use Heroku's PORT environment variable if it's set, otherwise default to 5000 for local development.
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)  # Set debug=False for production
