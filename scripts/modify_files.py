import json
import os
import re
from typing import List, Dict, Tuple
from anthropic import Anthropic

class CodeTransformer:
    def __init__(self, source_path: str, target_path: str):
        self.source_path = source_path
        self.target_path = target_path
        self.source_lines = []
        self.target_lines = []
        self.load_files()

    def load_files(self):
        """Load source and target files with line numbers."""
        with open(self.source_path, 'r') as f:
            self.source_lines = f.readlines()
        with open(self.target_path, 'r') as f:
            self.target_lines = f.readlines()

    def generate_numbered_content(self, lines: List[str]) -> List[str]:
        """Generate numbered version of the content."""
        return [f"{i+1:4d} | {line}" for i, line in enumerate(lines)]

    def get_indent_level(self, line: str) -> int:
        """Get the indentation level of a line."""
        return len(line) - len(line.lstrip())

    def adjust_indentation(self, lines: List[str], target_indent: int) -> List[str]:
        """Adjust indentation of a block of code."""
        if not lines:
            return lines

        # Get the base indentation of the first non-empty line
        base_indent = None
        for line in lines:
            if line.strip():
                base_indent = self.get_indent_level(line)
                break
        
        if base_indent is None:
            return lines

        # Adjust all lines to the target indentation
        adjusted_lines = []
        for line in lines:
            if line.strip():
                current_indent = self.get_indent_level(line)
                relative_indent = current_indent - base_indent
                new_indent = target_indent + relative_indent
                adjusted_lines.append(" " * new_indent + line.lstrip())
            else:
                adjusted_lines.append(line)

        return adjusted_lines

    def find_matching_source_block(self, target_line: str, start_idx: int) -> Tuple[int, int]:
        """Find the corresponding block in source file."""
        # Remove comments and whitespace for comparison
        clean_line = re.sub(r'//.*$', '', target_line).strip()
        
        # Look for matching line in source
        for i, source_line in enumerate(self.source_lines[start_idx:], start_idx):
            if re.sub(r'//.*$', '', source_line).strip() == clean_line:
                # Found matching start, now find the block end
                block_level = 0
                for j, line in enumerate(self.source_lines[i:], i):
                    if '{' in line:
                        block_level += 1
                    if '}' in line:
                        block_level -= 1
                        if block_level == 0:
                            return i, j + 1
                break
        return -1, -1

    def generate_llm_prompt(self) -> str:
        """Generate the prompt for the LLM."""
        operations_doc = """
Available operations:
1. COPY_FROM_SOURCE: Use when target file indicates code should remain unchanged
   {
     "operation": "COPY_FROM_SOURCE",
     "start_line": int,    # First line to copy from source
     "end_line": int,      # Last line to copy from source
     "target_line": int    # Line after which to insert (0 for start)
   }

2. COPY_FROM_TARGET: Use for modified/new code sections
   {
     "operation": "COPY_FROM_TARGET",
     "start_line": int,    # First line to copy from target
     "end_line": int,      # Last line to copy from target
     "target_line": int    # Line after which to insert (0 for start)
   }

IMPORTANT:
- When you see comments like "// this function should remain the same" in target file:
  * Find the matching function in source file
  * Use COPY_FROM_SOURCE for that entire block
- For modified sections in target file:
  * Use COPY_FROM_TARGET to include the new code
- Keep proper order of operations to maintain code structure
- Make sure to include all necessary code sections
- Pay attention to any additional comments in target file about keeping code unchanged
"""

        numbered_source = self.generate_numbered_content(self.source_lines)
        numbered_target = self.generate_numbered_content(self.target_lines)

        prompt = f"""Compare these files and generate operations to create the output, following these rules:
1. When target file has comments about keeping code unchanged, copy that section from source
2. For modified sections, copy from target
3. Ensure all necessary code is included

Source File:
{''.join(numbered_source)}

Target File:
{''.join(numbered_target)}

{operations_doc}

Return only a valid JSON object with the operations array. Example:
{{
  "operations": [
    {{
      "operation": "COPY_FROM_TARGET",
      "start_line": 1,
      "end_line": 10,
      "target_line": 0
    }},
    {{
      "operation": "COPY_FROM_SOURCE",
      "start_line": 15,
      "end_line": 25,
      "target_line": 10
    }}
  ]
}}
"""
        return prompt

    def _execute_single_operation(self, operation: Dict, current_lines: List[str]) -> List[str]:
        """Execute a single operation while maintaining proper indentation."""
        op_type = operation['operation']
        
        if op_type == 'COPY_FROM_SOURCE':
            start = operation['start_line'] - 1
            end = operation['end_line']
            target = operation['target_line']
            content = self.source_lines[start:end]
            
            # Get target indentation if there are existing lines
            target_indent = 0
            if current_lines and target < len(current_lines):
                target_indent = self.get_indent_level(current_lines[target])
            
            content = self.adjust_indentation(content, target_indent)
            return current_lines[:target] + content + current_lines[target:]
            
        elif op_type == 'COPY_FROM_TARGET':
            start = operation['start_line'] - 1
            end = operation['end_line']
            target = operation['target_line']
            content = self.target_lines[start:end]
            
            # Get target indentation if there are existing lines
            target_indent = 0
            if current_lines and target < len(current_lines):
                target_indent = self.get_indent_level(current_lines[target])
            
            content = self.adjust_indentation(content, target_indent)
            return current_lines[:target] + content + current_lines[target:]
            
        else:
            raise ValueError(f"Unknown operation type: {op_type}")

    def execute_operations(self, operations_json: str) -> str:
        """Execute a sequence of operations."""
        try:
            print("\nExecuting transformation operations...")
            data = json.loads(operations_json)
            operations = data['operations']
            
            current_lines = []
            
            for i, op in enumerate(operations, 1):
                print(f"\nOperation {i}:")
                print(json.dumps(op, indent=2))
                
                try:
                    current_lines = self._execute_single_operation(op, current_lines)
                    if current_lines is None:
                        raise ValueError("Operation returned None")
                    print(f"Operation {i} completed successfully")
                except Exception as e:
                    print(f"Error executing operation {i}: {e}")
                    continue

            return ''.join(current_lines)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {e}")
        except KeyError as e:
            raise ValueError(f"Missing required field: {e}")

    def process_with_anthropic(self, api_key: str) -> str:
        """Process the files using Anthropic's API."""
        client = Anthropic(api_key=api_key)
        
        prompt = self.generate_llm_prompt()
        print("Sending prompt to Anthropic...")
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )
        
        print("Received response from Anthropic")
        print(message.content[0].text)
        
        try:
            print("Processing LLM response...")
            operations_json = message.content[0].text
            result = self.execute_operations(operations_json)
            return result
        except Exception as e:
            raise Exception(f"Error processing LLM response: {e}")

def main():
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)

    # Initialize transformer
    transformer = CodeTransformer('data/source.txt', 'data/target.txt')
    
    # Get API key from environment
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable is required")
    
    try:
        # Process the files
        result = transformer.process_with_anthropic(api_key)
        
        # Save result
        with open('data/output.txt', 'w') as f:
            f.write(result)
        print("\nTransformation complete - results saved to output.txt")
        
    except Exception as e:
        print(f"Error during transformation: {e}")
        raise

if __name__ == "__main__":
    main()