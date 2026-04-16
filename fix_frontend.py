import os
import glob

base_dir = "d:\\Hust\\project.2\\frontend\\src\\app"

# 1. Rename files from .component.html to .html
for filepath in glob.glob(f"{base_dir}/**/*.component.*", recursive=True):
    new_filepath = filepath.replace(".component.", ".")
    os.replace(filepath, new_filepath)

# 2. Add CommonModule and RouterModule to imports in all .ts files
for filepath in glob.glob(f"{base_dir}/**/*.ts", recursive=True):
    if filepath.endswith("app.routes.ts") or filepath.endswith("app.component.ts") or filepath.endswith("app.config.ts") or "spec" in filepath:
        continue
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "imports: []" in content:
        content = content.replace("imports: []", "imports: [CommonModule, RouterModule]")
        content = "import { CommonModule } from '@angular/common';\nimport { RouterModule } from '@angular/router';\n" + content
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

# Fix sidebar properties
sidebar_file = os.path.join(base_dir, "components", "sidebar", "sidebar.ts")
if os.path.exists(sidebar_file):
    with open(sidebar_file, "r", encoding="utf-8") as f:
        content = f.read()
    if "collapsed = false;" not in content:
        content = content.replace("export class Sidebar {", "export class Sidebar {\n  collapsed = false;\n")
        with open(sidebar_file, "w", encoding="utf-8") as f:
            f.write(content)

print("Frontend files fixed!")
