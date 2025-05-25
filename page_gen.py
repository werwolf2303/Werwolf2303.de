from pathlib import Path
import os
import re
import shutil

SOURCE_DIRECTORY = "src"
PUBLIC_DIRECTORY = "public"
OUT_DIRECTORY = "out"
OUT_FILE = "index.js"
MAIN_FILE = "main.js"
OTHER_JS_DIRECTORY = "deps"
IMPORTS = []
OPTIMIZE = False


def copy_files(source_dir, destination_dir):
    try:
        os.makedirs(destination_dir, exist_ok=True)
        for item in os.listdir(source_dir):
            source_item = os.path.join(source_dir, item)
            destination_item = os.path.join(destination_dir, item)
            if os.path.isfile(source_item):
                shutil.copy2(source_item, destination_item)
            elif os.path.isdir(source_item):
                copy_files(source_item, destination_item)
    except FileNotFoundError:
        print(f"Error: Source directory '{source_dir}' not found.")
    except Exception as e:
        print(f"An error occurred: {e}")


def work_on_file(basepath) -> str:
    out = ""
    file_open = open(basepath, "r")
    last_line = ""
    dont_strip_comment = False
    for line in file_open.read().splitlines(False):
        if OPTIMIZE:
            if line.strip().startswith("/*!") or line.strip().__contains__("/*!"):
                dont_strip_comment = True
            if line.strip().startswith("//") and not dont_strip_comment:
                continue
            if line.strip().startswith("/**") and not dont_strip_comment:
                continue
            if line.strip().startswith("/*") and not dont_strip_comment:
                continue
            if line.strip().startswith("*") and not dont_strip_comment:
                continue
            if line.strip().startswith("**/") and not dont_strip_comment:
                continue
            if line.strip().startswith("*/"):
                if not dont_strip_comment:
                    continue
                dont_strip_comment = False
        if line.startswith("import"):
            foundpath = re.search(r"from\s+['\"](.*?)['\"]", line).group(1)
            if foundpath.startswith("./"):
                foundpath = foundpath.replace(".", "")
            if not foundpath.startswith("/"):
                foundpath = "/" + foundpath
            path = os.path.realpath("{}{}".format(Path(basepath).parent, foundpath + ".js"))
            if not IMPORTS.__contains__(path):
                out += work_on_file(path)
                if not OPTIMIZE:
                    out += "\n"
                IMPORTS.append(path)
        elif line.__contains__("export "):
            line = line.replace("export ", "")
            out += line
            if not OPTIMIZE:
                out += "\n"
        elif line.__contains__("export default"):
            line = ""
            out += line
            if not OPTIMIZE:
                out += "\n"
        elif line.strip().__eq__(""):
            continue
        else:
            out += line
            if not OPTIMIZE:
                out += "\n"
        if OPTIMIZE:
            if not last_line.endswith(","):
                if (not line.endswith(";")
                    and line.endswith("}")) \
                        or line.endswith(")"):
                    out += ";"
            last_line = line.strip()

    file_open.close()
    return out


def strip_comments(string) -> str:
    out = ""
    dont_strip_comment = False
    for line in string.splitlines():
        if OPTIMIZE:
            if line.strip().startswith("/*!") or line.strip().__contains__("/*!"):
                dont_strip_comment = True
            if line.strip().startswith("//") and not dont_strip_comment:
                continue
            if line.strip().startswith("/**") and not dont_strip_comment:
                continue
            if line.strip().startswith("/*") and not dont_strip_comment:
                continue
            if line.strip().startswith("*") and not dont_strip_comment:
                continue
            if line.strip().startswith("**/") and not dont_strip_comment:
                continue
            if line.strip().startswith("*/"):
                if not dont_strip_comment:
                    continue
                dont_strip_comment = False
        out += line
    return out


def strip_whitespace(string) -> str:
    if not OPTIMIZE: return string
    out = ""
    for line in string.splitlines():
        modified_line = re.sub(r'^\s+|\s+$', '', line)
        parts = []
        in_single_quotes = False
        in_double_quotes = False
        current_part = ""

        for char in modified_line:
            if char == "'" and not in_double_quotes:
                in_single_quotes = not in_single_quotes
                current_part += char
            elif char == '"' and not in_single_quotes:
                in_double_quotes = not in_double_quotes
                current_part += char
            elif not in_single_quotes and not in_double_quotes and char.isspace():
                if current_part:
                    parts.append(current_part)
                    current_part = ""
            else:
                current_part += char

        if current_part:
            parts.append(current_part)

        out += " ".join(parts) + '\n'
    return out


index_content = work_on_file(SOURCE_DIRECTORY + "/" + MAIN_FILE)

for file in os.listdir(OTHER_JS_DIRECTORY):
    fopen = open(OTHER_JS_DIRECTORY + "/" + file, "r")
    index_content += strip_comments(fopen.read())
    fopen.close()

copy_files(PUBLIC_DIRECTORY, OUT_DIRECTORY)

index_file = open(OUT_DIRECTORY + "/" + OUT_FILE, "w")
index_file.write(strip_whitespace(index_content))
index_file.close()
