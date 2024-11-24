import re
from file_collector import collect_all_file_contents
import json


def extract_description(content, match_start):
    """
    Extract the comment immediately preceding a function or class declaration.
    """
    lines = content[:match_start].split("\n")
    description = []
    in_comment_block = False

    # Traverse lines in reverse to find the closest preceding comment
    for line in reversed(lines):
        stripped = line.strip()
        if stripped.startswith("*/"):  # End of a JSDoc block
            in_comment_block = True
            continue
        if in_comment_block:
            if stripped.startswith("/**"):  # Start of a JSDoc block
                in_comment_block = False
                description.insert(0, stripped.lstrip("/**").rstrip("*/").strip())
                break
            description.insert(0, stripped.lstrip("*").strip())
        elif stripped.startswith("//"):  # Single-line comment
            description.insert(0, stripped.lstrip("//").strip())
        elif stripped:  # Stop when hitting non-comment code
            break

    return " ".join(description) if description else "No description provided."


def extract_from_js(content, file_path):
    """
    Extract functions, classes, and their descriptions from JavaScript or JSX content.
    """
    definitions = []

    try:
        function_matches = re.finditer(r'(.*function\s+(\w+)|(\w+)\s*=\s*(function|[(]))', content)
        class_matches = re.finditer(r'.*class\s+(\w+)', content)
        arrow_function_matches = re.finditer(r'\b(const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>', content)

        for match in function_matches:
            func_name = match.group(2) or match.group(3)
            if func_name:
                description = extract_description(content, match.start())
                definitions.append({
                    "name": func_name,
                    "type": "Function",
                    "description": description,
                    "line_number": content[:match.start()].count("\n") + 1,
                })

        for match in class_matches:
            cls_name = match.group(1)
            description = extract_description(content, match.start())
            definitions.append({
                "name": cls_name,
                "type": "Class",
                "description": description,
                "line_number": content[:match.start()].count("\n") + 1,
            })

        for match in arrow_function_matches:
            var_name = match.group(2)
            description = extract_description(content, match.start())
            definitions.append({
                "name": var_name,
                "type": "Arrow Function",
                "description": description,
                "line_number": content[:match.start()].count("\n") + 1,
            })

    except Exception as e:
        print(f"Error parsing JS/JSX file {file_path}: {e}")

    return definitions


def extract_from_css(content):
    """
    Extract CSS selectors or rules.
    """
    definitions = []
    matches = re.finditer(r'([.#]?[a-zA-Z0-9_-]+)\s*{', content)

    for match in matches:
        selector = match.group(1)
        definitions.append({
            "name": selector,
            "type": "CSS Selector",
        })

    return definitions


def extract_from_json(content):
    """
    Extract top two levels of keys and values from JSON.
    """
    definitions = []
    try:
        data = json.loads(content)

        for key, value in data.items():
            if isinstance(value, dict):
                sub_items = ", ".join(value.keys())
                definitions.append({
                    "name": key,
                    "type": "JSON Object",
                    "sub_keys": sub_items,
                })
            else:
                definitions.append({
                    "name": key,
                    "type": "JSON Key",
                    "value": value,
                })
    except json.JSONDecodeError:
        print("Invalid JSON content. Skipping file.")

    return definitions


def scan_project(directory):
    """
    Scan all files in the project and extract function/class definitions with descriptions.
    """
    print(f"Scanning project directory: {directory}")
    files_content = collect_all_file_contents(directory)
    project_definitions = {}

    for file_path, content in files_content.items():
        if file_path.endswith((".js", ".jsx")):
            print(f"Analyzing JS/JSX file: {file_path}")
            definitions = extract_from_js(content, file_path)
            if definitions:
                project_definitions[file_path] = definitions
        elif file_path.endswith(".css"):
            print(f"Analyzing CSS file: {file_path}")
            definitions = extract_from_css(content)
            if definitions:
                project_definitions[file_path] = [{"type": "CSS"}]
        elif file_path.endswith(".json"):
            project_definitions[file_path] = [{"type": "JSON"}]

    return project_definitions


def save_results_to_file(results, output_file="project_definitions.json"):
    """
    Save the extracted definitions to a JSON file.
    """
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {output_file}")


if __name__ == "__main__":
    project_directory = "."
    project_definitions = scan_project(project_directory)

    for file_path, definitions in project_definitions.items():
        print(f"\nFile: {file_path}")
        for definition in definitions:
            if definition["type"] == "JSON Object":
                print(f"  - {definition['type']} '{definition['name']}': Sub-keys [{definition['sub_keys']}]")
            elif definition["type"] == "JSON Key":
                print(f"  - {definition['type']} '{definition['name']}': Value [{definition['value']}]")
            else:
                print(f"  - {definition['type']} : {definition.get('description', '')}")

    save_results_to_file(project_definitions)