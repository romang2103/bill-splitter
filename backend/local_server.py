#!/usr/bin/env python3
from flask import Flask, request, jsonify
from google.api_core.client_options import ClientOptions
from google.cloud import documentai
import os

app = Flask(__name__)


@app.route("/process-document", methods=["POST"])
def process_document():
    # Check if the 'document' key is in the request files
    if "document" not in request.files:
        return jsonify({"error": "No file provided with key 'document'"}), 400

    # Get the file object
    file = request.files["document"]

    PROJECT_ID = "evensteven"
    LOCATION = "eu"
    PROCESSOR_ID = "9f4ba5473e27e98f"
    MIME_TYPE = "image/jpeg"

    # Assuming credentials are already set in the environment or via a config
    # This script expects GOOGLE_APPLICATION_CREDENTIALS environment variable to be set

    # Instantiates a client
    docai_client = documentai.DocumentProcessorServiceClient(
        client_options=ClientOptions(
            api_endpoint=f"{LOCATION}-documentai.googleapis.com"
        )
    )

    # The full resource name of the processor
    RESOURCE_NAME = docai_client.processor_path(PROJECT_ID, LOCATION, PROCESSOR_ID)

    # Read the file content
    image_content = file.read()

    # Load Binary Data into Document AI RawDocument Object
    raw_document = documentai.RawDocument(content=image_content, mime_type=MIME_TYPE)

    # Configure the process request
    doc_request = documentai.ProcessRequest(
        name=RESOURCE_NAME, raw_document=raw_document
    )

    # Process the document
    result = docai_client.process_document(request=doc_request)
    document_object = result.document
    print("Document processing complete.")

    # Extract entities
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

    # Return the extracted information as JSON
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
    app.run(debug=True)
