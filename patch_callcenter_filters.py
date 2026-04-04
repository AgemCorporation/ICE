import os

file_path = "/Applications/XAMPP/xamppfiles/htdocs/ICE-by-MECATECH-VLV/src/components/super-admin/super-admin.component.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Filter Signals
old_signals = """   callCenterKPIs = computed(() => {"""
new_signals = """   callCenterFilterTerm = signal('');
   callCenterFilterStatus = signal('ALL');
   callCenterFilterType = signal('ALL');

   filteredCallCenterTickets = computed(() => {
       let tickets = this.dataService.callCenterTickets();
       const term = this.callCenterFilterTerm().toLowerCase().trim();
       const status = this.callCenterFilterStatus();
       const type = this.callCenterFilterType();

       if (status !== 'ALL') {
          tickets = tickets.filter(t => t.status === status);
       }
       if (type !== 'ALL') {
          tickets = tickets.filter(t => t.type === type);
       }
       if (term) {
           tickets = tickets.filter(t => 
               t.subject.toLowerCase().includes(term) ||
               t.notes.toLowerCase().includes(term) ||
               this.getRef(t.quoteRequestId).toLowerCase().includes(term)
           );
       }
       
       // Trier du plus récent au plus ancien
       return tickets.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   });

   callCenterKPIs = computed(() => {"""
content = content.replace(old_signals, new_signals)

# 2. Add Filter UI
old_ui = """                 </div>

                 <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">"""
new_ui = """                 </div>

                 <!-- FILTRES CALL CENTER -->
                 <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 shrink-0">
                    <div class="flex-1 relative">
                       <svg xmlns="http://www.w3.org/2000/svg" class="size-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                       <input type="text" [ngModel]="callCenterFilterTerm()" (ngModelChange)="callCenterFilterTerm.set($event)" placeholder="Rechercher par sujet, UR, numéro, notes..." class="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow">
                    </div>
                    <div class="flex gap-4">
                       <select [ngModel]="callCenterFilterStatus()" (ngModelChange)="callCenterFilterStatus.set($event)" class="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="ALL">Statut: Tous</option>
                          <option value="Ouvert">Ouvert</option>
                          <option value="En attente client">En attente client</option>
                          <option value="A rappeler">A rappeler</option>
                          <option value="Résolu">Résolu</option>
                       </select>
                       <select [ngModel]="callCenterFilterType()" (ngModelChange)="callCenterFilterType.set($event)" class="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="ALL">Canal: Tous</option>
                          <option value="Appel Entrant">Appel Entrant</option>
                          <option value="Appel Sortant">Appel Sortant</option>
                          <option value="WhatsApp / SMS">WhatsApp / SMS</option>
                       </select>
                    </div>
                 </div>

                 <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">"""
content = content.replace(old_ui, new_ui)

# 3. Use filtered tickets in ngFor and empty check
old_empty = """                    @if (dataService.callCenterTickets().length === 0) {"""
new_empty = """                    @if (filteredCallCenterTickets().length === 0) {"""
content = content.replace(old_empty, new_empty)

old_for = """                            @for (ticket of dataService.callCenterTickets(); track ticket.id) {"""
new_for = """                            @for (ticket of filteredCallCenterTickets(); track ticket.id) {"""
content = content.replace(old_for, new_for)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Search and Filter logic injected into SuperAdminComponent")
