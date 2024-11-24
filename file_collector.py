import os
import pyperclip
import argparse
import json


def get_file_contents(directory, file_extension, exclude_files=[], exclude_directories=[]):
    files_content = {}
    for root, dirs, files in os.walk(directory):
        # Exclude specified directories
        dirs[:] = [d for d in dirs if d not in ['__pycache__', '.serverless', 'venv', 'node_modules', '.venv', '.git']]
        for directory in exclude_directories:
            if directory in dirs:
                dirs.remove(directory)
        
        for file in files:
            if file in exclude_files:
                continue
        
            if file.endswith(file_extension) or file == 'serverless.yml':
                print(f"file_extension: {file_extension} file: {file}")
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        files_content[file_path] = content
                except UnicodeDecodeError:
                    print(f"Skipping file (encoding issue): {file_path}")
                except Exception as e:
                    print(f"Skipping file ({e}): {file_path}")
    return files_content


def print_file_contents(directory):
    files_content = collect_all_file_contents(directory)
    output = "Here is my files' content:\n"
    for file_path, content in files_content.items():
        output += f"<{file_path}>:\n"
        output += "File Content:\n"
        output += content
        output += "\n"
    return output


def collect_all_file_contents(directory="."):
    all_files_content = {}
    all_files_content.update(get_file_contents(directory, '.js', exclude_files=['main.js', ".DS_Store"], exclude_directories=['node_modules', 'build']))
    all_files_content.update(get_file_contents(directory, '.jsx', exclude_files=[], exclude_directories=['node_modules', 'build']))
    all_files_content.update(get_file_contents(directory, '.css', exclude_files=['main.js', ".DS_Store"], exclude_directories=['node_modules', 'build']))
    all_files_content.update(get_file_contents(directory, '.json', exclude_files=[], exclude_directories=['node_modules', 'build']))
    return all_files_content


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process project directory files.')
    parser.add_argument('project_directory', nargs='?', default='src', help='Project directory to search (default: src)')
    args = parser.parse_args()
    project_directory = args.project_directory
    file_contents = collect_all_file_contents(project_directory)
    # print file names
    print("Files:")
    for file in file_contents:
        print(file)
    
    # Print contents as a formatted string
    output = print_file_contents(project_directory)
    # print(output)
    
    # Copy to clipboard
    pyperclip.copy(output)