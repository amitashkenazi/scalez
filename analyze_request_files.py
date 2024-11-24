import openai
import json
from extract_files_descriptions import scan_project
import pyperclip
client = openai.Client()

def parse_model_response(response_content):
    """Parse the JSON response from the model."""
    try:
        print("Parsing the model's response...")
        if response_content.startswith("```json"):
            response_content = response_content.strip("```json").strip()
        elif response_content.startswith("```"):
            response_content = response_content.strip("```")
        
        json_start = response_content.find("{")
        json_end = response_content.rfind("}") + 1

        if json_start == -1 or json_end == -1:
            raise ValueError("No JSON block found in the response.")

        json_string = response_content[json_start:json_end]
        result = json.loads(json_string)

        print(f"Parsed response successfully. Result: {result}")
        return result
    except Exception as e:
        print("Failed to parse the model's response:", str(e))
        print("Response content:", response_content)
        return {"files_to_check": []}
    

def collect_project_data(directory):
    """
    Collect all files, methods, and classes from the project directory.
    """
    print(f"Scanning project directory: {directory}")
    project_definitions = scan_project(directory)
    return project_definitions

def prepare_openai_request(project_definitions, user_request):
    """
    Prepare the content to send to OpenAI.
    """
    files_data = []
    prompt = "Here are the files and definitions in your project:\n"
    for file_path, definitions in project_definitions.items():
        prompt += f"File: {file_path}\n"
        for definition in definitions:
            print(f"{file_path} definition 1: {definition} {list(definition.keys())} | {definition.get('description')} |  {definition.get('description') is not None}")  
            prompt += f" - {definition.get('name', '')} {definition.get('type', '')} - {definition.get('description', '')}\n"
    prompt += f"User Request: {user_request}\n"
    prompt += "suggest which files should be changed according to the user request and project files. return the file name in the following json format:"
    prompt += """
    {
        "files_to_change": [
        {
            "file": "file_name",
            "description": "description of changes"
        }
    ],
    "files_to_add": [
        {
            "file": "file_name",
            "description": "description of new file"
        }
    ]
    }
    """
    return prompt

def send_request_to_openai(prompt): 
    """
    Send the prepared prompt to OpenAI and return the response.
    """
    try:
        """Send the first prompt to the model to get relevant files."""
        print("Sending the first prompt to the model...")
        response = client.chat.completions.create(
            model="o1-preview-2024-09-12",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        message_content = response.choices[0].message.content
        return message_content
    except Exception as e:
        print(f"Error communicating with OpenAI: {e}")
        return None

def main():
    # Directory to scan
    project_directory = "."

    # Collect project data
    project_definitions = collect_project_data(project_directory)

    # Get user request
    print("Enter your request for the project changes (e.g., 'Add login functionality'): ")
    user_request = input("> ")

    # Prepare the prompt for OpenAI
    prompt = prepare_openai_request(project_definitions, user_request)
    print(f"\nPrompt to send to OpenAI:\n{prompt}")
    # Send the prompt to OpenAI
    print("Sending request to OpenAI...")
    response = send_request_to_openai(prompt)
    parsed_res = parse_model_response(response)
    
    files_to_change = parsed_res.get("files_to_change", [])
    files_to_add = parsed_res.get("files_to_add", [])
    
    prompt = "here are the files that I think should be changed:\n"
    for file in files_to_change:
        # get file content
        with open(file['file'], 'r') as f:
            file_content = f.read()
        prompt += f"File: {file['file']}\nDescription: {file['description']}\n Content: {file_content}\n"
        
    prompt += "here are the files that I think should be added:\n"
    for file in files_to_add:
        prompt += f"File: {file['file']}\nDescription: {file['description']}\n"
    
    prompt += f"I want to {user_request}.\n"
    
    prompt += "implement the changes. write all the changed files and any new files needed to implement the requirement. write the entire content of the revised files."
    
    print(prompt)
    pyperclip.copy(prompt)
    
if __name__ == "__main__":
    main()