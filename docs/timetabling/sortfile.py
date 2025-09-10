def sort_script_lines(input_file_path, output_file_path=None, case_sensitive=True, remove_empty_lines=False):
    """
    Sorts every line in a script file and writes the result to a new file.
    
    Args:
        input_file_path (str): Path to the input script file
        output_file_path (str, optional): Path for the output file. 
                                        If None, appends '_sorted' to input filename
        case_sensitive (bool): Whether to sort case-sensitively (default: True)
        remove_empty_lines (bool): Whether to remove empty lines before sorting (default: False)
    
    Returns:
        str: Path to the output file
    
    Raises:
        FileNotFoundError: If the input file doesn't exist
        IOError: If there's an error reading or writing files
    """
    import os
    
    try:
        # Read the input file
        with open(input_file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        
        # Strip newline characters while preserving the original line endings
        processed_lines = []
        for line in lines:
            stripped_line = line.rstrip('\n\r')
            if remove_empty_lines and not stripped_line.strip():
                continue
            processed_lines.append(stripped_line)
        
        # Sort the lines
        if case_sensitive:
            sorted_lines = sorted(processed_lines)
        else:
            sorted_lines = sorted(processed_lines, key=str.lower)
        
        # Determine output file path
        if output_file_path is None:
            base_name, ext = os.path.splitext(input_file_path)
            output_file_path = f"{base_name}_sorted{ext}"
        
        # Write sorted lines to output file
        with open(output_file_path, 'w', encoding='utf-8') as file:
            for line in sorted_lines:
                file.write(line + '\n')
        
        print(f"Successfully sorted {len(sorted_lines)} lines from '{input_file_path}' to '{output_file_path}'")
        return output_file_path
        
    except FileNotFoundError:
        raise FileNotFoundError(f"Input file '{input_file_path}' not found")
    except IOError as e:
        raise IOError(f"Error processing files: {e}")


# Example usage and helper function
def sort_script_lines_simple(input_file_path):
    """
    Simple version that just sorts lines and creates output file with '_sorted' suffix.
    """
    return sort_script_lines(input_file_path)


# Example usage:
if __name__ == "__main__":
    # Example 1: Basic usage
    # sort_script_lines("my_script.py")
    
    # Example 2: Custom output file
    # sort_script_lines("my_script.py", "sorted_script.py")
    
    # Example 3: Case-insensitive sorting
    sort_script_lines("/Users/maxfergie/Documents/projects/eddi/docs/timetabling/HK_SAMPLE.fet", case_sensitive=False)
    
    # Example 4: Remove empty lines and sort
    # sort_script_lines("my_script.py", remove_empty_lines=True)
    
    pass