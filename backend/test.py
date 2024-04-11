#!/usr/bin/env python3
from google.api_core.client_options import ClientOptions
from google.cloud import documentai
import os
import re


def main():
    PROJECT_ID = "evensteven"
    LOCATION = "eu"  # Format is 'us' or 'eu'
    PROCESSOR_ID = "9f4ba5473e27e98f"  # Create processor in Cloud Console

    # credential_path = "C:\Users\Roman\AppData\Roaming\gcloud\application_default_credentials.json"
    # # credential_path = "C:\\Users\\roman\\AppData\\Roaming\\gcloud\\application_default_credentials.json"
    # os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credential_path

    # The local file in your current working directory
    # FILE_PATH = "E:\\GitHub\\bill-splitter\\assets\\bill2.jpg"

    FILE_PATH = "E:\\GitHub\\bill-splitter\\assets\\bill4.jpg"
    # FILE_PATH = "C:\\Users\\roman\\Documents\\GitHub\\bill-splitter\\assets\\bill2.jpg"

    # Refer to https://cloud.google.com/document-ai/docs/file-types
    # for supported file types
    MIME_TYPE = "image/jpeg"

    # Instantiates a client
    docai_client = documentai.DocumentProcessorServiceClient(
        client_options=ClientOptions(
            api_endpoint=f"{LOCATION}-documentai.googleapis.com"
        )
    )

    # The full resource name of the processor, e.g.:
    # projects/project-id/locations/location/processor/processor-id
    # You must create new processors in the Cloud Console first
    RESOURCE_NAME = docai_client.processor_path(PROJECT_ID, LOCATION, PROCESSOR_ID)

    # Read the file into memory
    with open(FILE_PATH, "rb") as image:
        image_content = image.read()

    # Load Binary Data into Document AI RawDocument Object
    raw_document = documentai.RawDocument(content=image_content, mime_type=MIME_TYPE)

    # Configure the process request
    request = documentai.ProcessRequest(name=RESOURCE_NAME, raw_document=raw_document)

    # Use the Document AI client to process the sample form
    result = docai_client.process_document(request=request)

    document_object = result.document
    print("Document processing complete.")

    # Write form fields to a separate file
    # with open("form_fields.txt", "w") as output_file:
    #     for page_num, page in enumerate(document_object.pages):
    #         # output_file.write(f"Page {page_num + 1} Form Fields:\n")
    #         for form_field_num, form_field in enumerate(page.form_fields):
    #             output_file.write(f"Form Field {form_field_num + 1}\n")
    #             output_file.write(f"Name: {form_field.field_name.text_anchor.content}")
    #             output_file.write(
    #                 f"Value: {form_field.field_value.text_anchor.content}\n"
    #             )
    #             output_file.write("\n")

    entities = [
        {
            "Type": entity.type_,
            "Properties": [
                {
                    "Type": prop.type_,
                    "Content": prop.text_anchor.content,  # Adjust as necessary to match your actual data structure
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

    with open("response_invoice.txt", "w") as output_file:
        for entity_num, entity in enumerate(entities):
            # output_file.write(f"Entity {entity_num + 1}\n")
            # output_file.write(f"Type: {entity["Type"]}\n")
            output_file.write(f"Properties: {entity["Properties"]}\n\n")
        output_file.write(f"Tax: {total_tax_amount}\n")
        output_file.write(f"Total: {total_amount}")

if __name__ == "__main__":
    main()
