import os
import openai
import json
import pyperclip
from file_collector import collect_all_file_contents

client = openai.Client()

def estimate_tokens(text):
    """Estimate token count based on text length (1 token ≈ 4 characters for plain text)."""
    return len(text) // 4

def calculate_prompt_token_usage(user_request, chat_history, file_text):
    """Calculate the total token usage for a prompt with given inputs."""
    fixed_prompt = f"""
You are an expert programmer and code reviewer. Below is the user's request and chat history. Your goal is to analyze the request in the context of the provided file contents and return a list of files that might need changes. Only include the files that require updates and explain why.

User Request:
{user_request}

Chat History:
{chat_history}

File Contents:
"""
    return estimate_tokens(fixed_prompt) + estimate_tokens(file_text)

def get_all_file_names_and_sizes(directory="."):
    """Collect all file names and their sizes in the specified directory."""
    print(f"Collecting all files from directory: {directory}")
    files = collect_all_file_contents(directory)
    file_info_list = [{"file_path": file_path, "file_size": len(content)} for file_path, content in files.items()]
    print(f"Total files collected: {len(file_info_list)}")
    for file in file_info_list:
        print(f"- {file['file_path']}: {file['file_size']} bytes")
    return file_info_list

def prepare_first_prompt(user_request, chat_history, file_info_list):
    """Prepare the first prompt to identify relevant files."""
    print("Preparing the first prompt to identify relevant files...")
    files_info_str = '\n'.join([f"{file['file_path']}: {file['file_size']} bytes" for file in file_info_list])
    prompt = f"""
You are an expert programmer and code reviewer. Below is the user's request and chat history. Your goal is to analyze the request in the context of the provided files and return a list of files that are relevant and need further analysis.

User Request:
{user_request}

Chat History:
{chat_history}

Files:
{files_info_str}

Return the results as a JSON object with the structure:
{{
    "files_to_check": [
        "path/to/file1",
        "path/to/file2",
        ...
    ]
}}
"""
    print(f"First prompt prepared. Length: {len(prompt)} characters.")
    return prompt

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

def get_files_to_check_from_model(prompt):
    """Send the first prompt to the model to get relevant files."""
    print("Sending the first prompt to the model...")
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    message_content = response.choices[0].message.content
    return parse_model_response(message_content).get("files_to_check", [])

def collect_file_contents(files_to_check, directory=".", max_total_size=1000000):
    """Collect file contents for analysis while respecting size limits."""
    print(f"Collecting file contents for {len(files_to_check)} files...")
    all_file_contents = collect_all_file_contents(directory)
    file_contents = {}
    total_size = 0
    skipped_files = []

    for file_path in files_to_check:
        content = all_file_contents.get(file_path)
        if content:
            content_size = len(content.encode('utf-8'))
            if total_size + content_size <= max_total_size:
                file_contents[file_path] = content
                total_size += content_size
                print(f"Included file: {file_path}, size: {content_size} bytes, total accumulated size: {total_size} bytes.")
            else:
                print(f"Skipped file {file_path} due to size limit. File size: {content_size} bytes.")
                skipped_files.append(file_path)
        else:
            print(f"File {file_path} not found in the directory.")
            skipped_files.append(file_path)

    print(f"Total files included: {len(file_contents)}. Total files skipped: {len(skipped_files)}.")
    return file_contents, skipped_files

def prepare_batched_prompts(user_request, chat_history, file_contents, max_tokens=128000):
    """Split file contents into manageable batches within token limits."""
    print("Preparing batched prompts with strict token limits...")
    batched_prompts = []
    current_batch = []
    current_tokens = calculate_prompt_token_usage(user_request, chat_history, "")

    for file_path, content in file_contents.items():
        file_text = f"File: {file_path}\n{content}\n"
        file_tokens = estimate_tokens(file_text)

        if current_tokens + file_tokens > max_tokens:
            # Batch is full; finalize and start a new one
            print(f"Batch full with {current_tokens} tokens. Starting a new batch...")
            batched_prompts.append("\n".join(current_batch))
            current_batch = []
            current_tokens = calculate_prompt_token_usage(user_request, chat_history, "")

        # Add file to the current batch
        current_batch.append(file_text)
        current_tokens += file_tokens

    # Add the last batch
    if current_batch:
        batched_prompts.append("\n".join(current_batch))

    print(f"Prepared {len(batched_prompts)} batches for processing.")
    return [
        f"""
You are an expert programmer and code reviewer. Below is the user's request and chat history. Your goal is to analyze the request in the context of the provided file contents and return a list of files that might need changes. Only include the files that require updates and explain why.

User Request:
{user_request}

Chat History:
{chat_history}

File Contents:
{batch}

Return the results as a JSON object with the structure:
{{
    "files_to_change": [
        {{
            "file_path": "path/to/file",
            "reason": "reason for including the file"
        }}
    ]
}}
"""
        for batch in batched_prompts
    ]

def get_files_to_change_from_batched_prompts(prompts):
    """Process each batch of prompts and aggregate the results."""
    print("Processing batched prompts...")
    all_files_to_change = []

    for i, prompt in enumerate(prompts):
        print(f"Processing batch {i + 1}/{len(prompts)}...")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        message_content = response.choices[0].message.content
        files_to_change = parse_model_response(message_content).get("files_to_change", [])
        print(f"Batch {i + 1} suggested {len(files_to_change)} files for changes.")
        all_files_to_change.extend(files_to_change)

    print(f"Total files suggested for changes: {len(all_files_to_change)}")
    return all_files_to_change

def analyze_files_and_requests(user_request, chat_history, directory="."):
    """Main function to analyze files and requests."""
    print("Starting analysis of files and requests...")
    file_info_list = get_all_file_names_and_sizes(directory)
    first_prompt = prepare_first_prompt(user_request, chat_history, file_info_list)
    files_to_check = get_files_to_check_from_model(first_prompt)

    if not files_to_check:
        print("No files to check based on the initial model response.")
        return []

    files_to_change = []
    files_already_analyzed = []
    remaining_files = files_to_check
    iteration = 1

    while remaining_files:
        print(f"\n--- Iteration {iteration} ---")
        file_contents, skipped_files = collect_file_contents(remaining_files, directory)
        if not file_contents:
            break

        batched_prompts = prepare_batched_prompts(user_request, chat_history, file_contents)
        files_changed_in_this_batch = get_files_to_change_from_batched_prompts(batched_prompts)
        files_to_change.extend(files_changed_in_this_batch)

        files_already_analyzed.extend(file_contents.keys())
        remaining_files = [f for f in skipped_files if f not in files_already_analyzed]
        iteration += 1

    print("Analysis complete.")
    return files_to_change

def copy_to_clipboard(files_to_change, file_contents):
    """Copy selected files and their content to clipboard."""
    print("Copying selected files and their content to clipboard...")
    content_to_copy = "\n\n".join(
        [f"File:{file['file_path']}\n{file_contents[file['file_path']]}" 
         for file in files_to_change if file['file_path'] in file_contents]
    )
    pyperclip.copy(content_to_copy)
    print("Files and their content copied to clipboard successfully.")

if __name__ == "__main__":
    user_request = "I want that all the google maps api calls will be throught the server. only the get map will be directly to the google api"
    chat_history = ""
    directory = "."
    
    # Analyze files and requests
    files_to_change = analyze_files_and_requests(user_request, chat_history, directory)
    
    # Collect content of files that need changes
    file_contents, _ = collect_file_contents(
        [file['file_path'] for file in files_to_change], directory
    )

    # Copy to clipboard
    copy_to_clipboard(files_to_change, file_contents)

    # Print results
    print("\nGPT Analysis Results:")
    print(json.dumps(files_to_change, indent=2))