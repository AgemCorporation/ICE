import os

file_path = "/Applications/XAMPP/xamppfiles/htdocs/ICE-by-MECATECH-VLV/src/components/super-admin/super-admin.component.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines 670 to 715 (0-indexed: 669 to 714)
for i in range(669, 714):
    if i >= len(lines): break
    line = lines[i]
    
    # 1. Date column
    if '672' in str(i+1) or '<td class="p-4">' in line:
        if i+1 == 672:
            lines[i] = line.replace('class="p-4"', 'class="px-6 py-4"')
    
    # 2. Liaison column
    if i+1 == 679:
        lines[i] = line.replace('class="p-4"', 'class="px-6 py-4 text-center"')
        
    # 3. Motif column
    if i+1 == 694:
        lines[i] = line.replace('class="p-4 max-w-[300px]"', 'class="px-6 py-4 max-w-[400px]"')
        
    # 4. Status column
    if i+1 == 698:
        lines[i] = line.replace('class="p-4 text-right"', 'class="px-6 py-4 text-right"')
        
    # 5. Action column
    if i+1 == 709:
        lines[i] = line.replace('class="p-4 text-right"', 'class="px-6 py-4 text-center"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("SUCCESS: Body cells updated via line-indexed script.")
