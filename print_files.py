import os
import pyperclip
import argparse

def print_file_contents(directory, file_extension, output, exclude_files=[], exclude_directories=[]):
    for root, dirs, files in os.walk(directory):
        # Exclude specified directories
        dirs[:] = [d for d in dirs if d not in ['__pycache__', '.serverless', 'venv', 'node_modules', '.venv']]
        for directory in exclude_directories:
            if directory in dirs:
                dirs.remove(directory)
        
        for file in files:
            if file in exclude_files:
                print(f"excluding file: {file}")
                continue
        
            if file.endswith(file_extension) or file == 'serverless.yml':
                print(f"file: {file}")
                file_path = os.path.join(root, file)
                output += f"<{file_path}>:\n"
                output += "File Content:\n"
                with open(file_path, 'r') as f:
                    content = f.read()
                    output += content
                output += "\n"
    return output

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process project directory files.')
    parser.add_argument('project_directory', nargs='?', default='src', help='Project directory to search (default: src)')
    args = parser.parse_args()

    output = ""
    project_directory = args.project_directory
    output += "Here is my files' content:\n"
    # Print the contents of all .js, .jsx, .css, .json files and the serverless.yml file
    output = print_file_contents(project_directory, '.js', output, exclude_files=['main.js', ".DS_Store"], exclude_directories=['node_modules'])
    output = print_file_contents(project_directory, '.jsx', output, exclude_files=[], exclude_directories=['node_modules'])
    output = print_file_contents(project_directory, '.css', output, exclude_files=['main.js', ".DS_Store"], exclude_directories=['node_modules'])
    output = print_file_contents(project_directory, '.json', output, exclude_files=[], exclude_directories=['node_modules'])
    pyperclip.copy(output)