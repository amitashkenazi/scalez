import os
import requests
import json

# Set up Twilio credentials (replace with your actual credentials)
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', 'your_account_sid')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', 'your_auth_token')

# Function to create the list picker template dynamically
def create_dynamic_list_picker_template(item_count):
    if not 1 <= item_count <= 10:
        raise ValueError("Item count must be between 1 and 10.")

    items = []
    variables = {}
    
    for i in range(1, item_count + 1):
        item_name_var = f"{{{{item{i}_name}}}}"
        item_id_var = f"{{{{item{i}_id}}}}"
        item_desc_var = f"{{{{item{i}_description}}}}"
        
        # Add variables to the dictionary
        variables[f"item{i}_name"] = f"Default Item {i} Name"
        variables[f"item{i}_id"] = f"item_{i}_id"
        variables[f"item{i}_description"] = f"Default Description for Item {i}"

        # Create list item
        item = {
            "item": item_name_var,
            "description": item_desc_var,
            "id": item_id_var
        }
        items.append(item)

    # Define the entire template payload
    template = {
        "friendly_name": f"dynamic_list_picker_{item_count}_items",
        "language": "en",
        "variables": variables,
        "types": {
            "twilio/list-picker": {
                "body": "Please choose an option from the list below:",
                "button": "Select an option",
                "items": items
            },
            "twilio/text": {
                "body": "Please choose an option from the list below: {{item1_name}}"
            }
        }
    }
    return template

def create_quick_reply_template(item_count):
    if not 1 <= item_count <= 10:
        raise ValueError("Item count must be between 1 and 10.")

    actions = []
    variables = {}

    for i in range(1, item_count + 1):
        title_var = f"{{{{item{i}_title}}}}"
        id_var = f"{{{{item{i}_id}}}}"

        # Add variables for default values
        variables[f"item{i}_title"] = f"Option {i}"
        variables[f"item{i}_id"] = f"option_{i}_id"

        # Create quick reply action
        action = {
            "title": title_var,
            "id": id_var
        }
        actions.append(action)

    # Define the template payload
    template = {
        "friendly_name": f"dynamic_quick_reply_{item_count}_items",
        "language": "en",
        "variables": variables,
        "types": {
            "twilio/quick-reply": {
                "body": "Please choose an option from the list below:",
                "actions": actions
            },
            "twilio/text": {
                "body": "Please choose an option from the list below: {{item1_title}}"
            }
        }
    }
    return template

# Function to send the API request
def send_template_creation_request(template):
    url = 'https://content.twilio.com/v1/Content'
    headers = {
        'Content-Type': 'application/json'
    }

    response = requests.post(
        url,
        headers=headers,
        auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
        data=json.dumps(template)
    )
    return response


# Main execution block
if __name__ == "__main__":
    try:
        # Define the number of items (between 1 and 10)
        item_count = 5  # Change this value as needed
        for item_count in range(1, 10):
        # Create template and send API request
            template = create_quick_reply_template(item_count)
            print("aaaaatemplate")
            response = send_template_creation_request(template)
            # template = create_dynamic_list_picker_template(item_count)
            # response = send_template_creation_request(template)

            if response.status_code == 201:
                print("Template created successfully.")
                print("Content SID:", response.json().get('sid'))
            else:
                print("Failed to create template.")
                print("Status Code:", response.status_code)
                print("Response:", response.json())

    except Exception as e:
        print(f"An error occurred: {e}")