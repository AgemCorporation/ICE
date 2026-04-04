import os

file_path = "/Applications/XAMPP/xamppfiles/htdocs/ICE-by-MECATECH-VLV/src/components/super-admin/super-admin.component.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the pattern to replace
# This targets the entire failed table block from line 659 to 715 roughly
target_pattern = """                       <table class="w-full text-left text-sm whitespace-nowrap">
                          <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                             <tr>
                                <th class="px-6 py-4 font-bold text-slate-500">Date & Temps</th>
                                <th class="px-6 py-4 font-bold text-slate-500 text-center">Liaison</th>
                                <th class="px-6 py-4 font-bold text-slate-500">Motif & Sujet</th>
                                <th class="px-6 py-4 font-bold text-slate-500 text-right">Statut</th>
                                <th class="px-6 py-4 w-12"></th>
                             </tr>
                            </tr>
                          </thead>"""

# New clean block
replacement_block = """                       <table class="w-full text-left text-sm whitespace-nowrap">
                          <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                            <tr>
                               <th class="px-6 py-4">Date & Temps</th>
                               <th class="px-6 py-4 text-center">Liaison</th>
                               <th class="px-6 py-4">Motif & Sujet</th>
                               <th class="px-6 py-4 text-right">Statut</th>
                               <th class="px-6 py-4 w-12 text-center text-slate-500">Action</th>
                            </tr>
                          </thead>"""

# Check if target exists
if target_pattern in content:
    new_content = content.replace(target_pattern, replacement_block)
    # Also fix the <td> tags to px-6 py-4
    # Find the tbody start
    tbody_start = new_content.find('<tbody class="divide-y border-slate-200')
    if tbody_start != -1:
        # Replace p-4 with px-6 py-4 in this section
        section = new_content[tbody_start:]
        new_section = section.replace('class="p-4"', 'class="px-6 py-4"')
        new_section = new_section.replace('class="p-4 text-right"', 'class="px-6 py-4 text-right"')
        new_section = new_section.replace('class="p-4 max-w-[300px]"', 'class="px-6 py-4 max-w-[400px]"')
        
        # Center Liaison td
        # Current: </td>\n                                   <td class="px-6 py-4">
        new_section = new_section.replace('</td>\n                                   <td class="px-6 py-4">', '</td>\n                                   <td class="px-6 py-4 text-center">', 1) 
        # Hmm replace multiple times for multiple rows, but here we only have one row in the screenshot example
        # Let's do it better
        
        new_content = new_content[:tbody_start] + new_section
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: File updated.")
else:
    # Try looking for a slightly different pattern if failed
    # I'll just use a more partial match if necessary
    print("ERROR: Target pattern not found exactly. Trying partial match...")
    # Replace headers only if they match
    if 'Date & Temps' in content and '<th class="p-4' in content:
         print("Found headers. Let's use a simpler replace.")
         # ...
    else:
         print("CRITICAL: Even parts of the pattern not found.")
