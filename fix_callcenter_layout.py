import os

file_path = "/Applications/XAMPP/xamppfiles/htdocs/ICE-by-MECATECH-VLV/src/components/super-admin/super-admin.component.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace wrapper
old_wrapper = """         @if (activeTab() === 'callcenter') {
             <div class="space-y-6">"""
new_wrapper = """         @if (activeTab() === 'callcenter') {
             <div class="p-6 h-full flex flex-col">"""
content = content.replace(old_wrapper, new_wrapper)

# Update the action bar 
old_action_bar = """                 <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <!-- Search / stats -->"""
new_action_bar = """                 <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                    <!-- Search / stats -->"""
content = content.replace(old_action_bar, new_action_bar)

# Update KPIs grid
old_grid = """                 <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">"""
new_grid = """                 <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">"""
content = content.replace(old_grid, new_grid)

# Update table container
old_container = """                 <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">"""
new_container = """                 <div class="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden">"""
content = content.replace(old_container, new_container)

# Add sticky header and flex-1 overflow-y-auto layout to table

# 1. Update the overflow-x-auto to flex-1 overflow-y-auto
old_overflow = """                       <div class="overflow-x-auto">
                       <table class="w-full text-left text-sm whitespace-nowrap">"""
new_overflow = """                       <div class="flex-1 overflow-y-auto">
                       <table class="w-full text-left text-sm whitespace-nowrap">"""
content = content.replace(old_overflow, new_overflow)

# 2. Add sticky header
old_thead = """                          <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">"""
new_thead = """                          <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 sticky top-0 z-20">"""
content = content.replace(old_thead, new_thead)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Call Center layout fully updated (margins, flex-1 container, sticky table headers).")
