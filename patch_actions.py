import os

file_path = "/Applications/XAMPP/xamppfiles/htdocs/ICE-by-MECATECH-VLV/src/components/super-admin/super-admin.component.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add ticketActions signal
old_signal = """   ticketTimer = signal(0);
   currentEditingTicketId = signal<string | null>(null);"""
new_signal = """   ticketTimer = signal(0);
   currentEditingTicketId = signal<string | null>(null);
   ticketActions = signal<{id:string, text:string, completed:boolean}[]>([]);
   newActionText = signal('');"""
content = content.replace(old_signal, new_signal)

# 2. Update openNewTicketModal
old_new = """   openNewTicketModal() {
      this.currentEditingTicketId.set(null);
      this.ticketForm.reset({ type: 'Appel Entrant', status: 'Ouvert', durationSecs: 0 });
      this.ticketSearchTerm.set('');
      this.ticketTimer.set(0);"""
new_new = """   openNewTicketModal() {
      this.currentEditingTicketId.set(null);
      this.ticketForm.reset({ type: 'Appel Entrant', status: 'Ouvert', durationSecs: 0 });
      this.ticketSearchTerm.set('');
      this.ticketTimer.set(0);
      this.ticketActions.set([]);
      this.newActionText.set('');"""
content = content.replace(old_new, new_new)

# 3. Update openTicketDetails
old_details = """         clientId: ticket.clientId
      });
      this.ticketSearchTerm.set('');
      this.ticketTimer.set(ticket.durationSecs || 0);"""
new_details = """         clientId: ticket.clientId
      });
      this.ticketSearchTerm.set('');
      this.ticketTimer.set(ticket.durationSecs || 0);
      this.ticketActions.set(ticket.actions ? JSON.parse(JSON.stringify(ticket.actions)) : []);
      this.newActionText.set('');"""
content = content.replace(old_details, new_details)

# 4. Update saveTicket
old_save = """      if (id) {
          // Si édition de ticket (on garde la durée manuelle fixée ?)
          val.durationSecs = this.ticketTimer();
          this.dataService.updateCallCenterTicket(id, val);"""
new_save = """      if (id) {
          // Si édition de ticket (on garde la durée manuelle fixée ?)
          val.durationSecs = this.ticketTimer();
          val.actions = this.ticketActions();
          this.dataService.updateCallCenterTicket(id, val);"""
content = content.replace(old_save, new_save)

old_save_2 = """      } else {
          val.durationSecs = this.ticketTimer();
          this.dataService.createCallCenterTicket(val);"""
new_save_2 = """      } else {
          val.durationSecs = this.ticketTimer();
          val.actions = this.ticketActions();
          this.dataService.createCallCenterTicket(val);"""
content = content.replace(old_save_2, new_save_2)

# Add class methods for actions
action_methods = """
   addAction(event: Event) {
      event.preventDefault();
      const text = this.newActionText().trim();
      if (!text) return;
      this.ticketActions.update(actions => [...actions, { id: crypto.randomUUID(), text, completed: false }]);
      this.newActionText.set('');
   }

   toggleAction(id: string) {
      this.ticketActions.update(actions => actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
   }

   removeAction(id: string) {
      this.ticketActions.update(actions => actions.filter(a => a.id !== id));
   }
"""
content = content.replace("   // --- MODERATION LOGIC ---", action_methods + "\n   // --- MODERATION LOGIC ---")

# 5. Add UI in Modal
old_ui = """                       <div>
                           <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes & Résumé</label>
                           <textarea formControlName="notes" rows="6" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"></textarea>
                       </div>
                   </form>
                </div>"""
new_ui = """                       <div>
                           <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes & Résumé</label>
                           <textarea formControlName="notes" rows="4" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white"></textarea>
                       </div>
                       
                       <div class="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
                           <div class="flex items-center gap-2 mb-3">
                               <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                               <h3 class="font-bold text-slate-900 dark:text-white">Plan d'Actions / À faire</h3>
                           </div>
                           
                           <div class="space-y-2 mb-3">
                               @for (action of ticketActions(); track action.id) {
                                   <div class="flex items-center gap-3 p-2 rounded-lg transition-colors" [class.bg-slate-50]="!action.completed" [class.dark:bg-slate-900]="!action.completed" [class.bg-emerald-50]="action.completed" [class.dark:bg-emerald-900/10]="action.completed" [class.opacity-60]="action.completed">
                                       <button type="button" (click)="toggleAction(action.id)" class="shrink-0 flex items-center justify-center w-5 h-5 rounded border transition-colors" [class.border-slate-300]="!action.completed" [class.border-emerald-500]="action.completed" [class.bg-emerald-500]="action.completed" [class.text-white]="action.completed">
                                           @if (action.completed) {
                                               <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                                           }
                                       </button>
                                       <span class="flex-1 text-sm font-medium transition-all" [class.text-slate-700]="!action.completed" [class.dark:text-slate-300]="!action.completed" [class.text-emerald-700]="action.completed" [class.dark:text-emerald-400]="action.completed" [class.line-through]="action.completed">{{ action.text }}</span>
                                       <button type="button" (click)="removeAction(action.id)" class="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                           <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                       </button>
                                   </div>
                               }
                               @if (ticketActions().length === 0) {
                                   <div class="text-xs text-slate-500 italic py-2">Aucune action planifiée.</div>
                               }
                           </div>
                           
                           <div class="relative flex items-center gap-2">
                               <input type="text" [ngModel]="newActionText()" (ngModelChange)="newActionText.set($event)" [ngModelOptions]="{standalone: true}" (keydown.enter)="addAction($event)" placeholder="Ajouter une tâche et appuyer sur Entrée..." class="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 shadow-sm">
                               <button type="button" (click)="addAction($event)" class="absolute right-2 p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors disabled:opacity-50" [disabled]="!newActionText().trim()">
                                   <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" /></svg>
                               </button>
                           </div>
                       </div>
                   </form>
                </div>"""
content = content.replace(old_ui, new_ui)

# 6. Add badge to table
old_td = """                                  <td class="px-6 py-4 max-w-[400px]">
                                     <div class="font-bold text-slate-900 dark:text-white truncate">{{ ticket.subject }}</div>
                                     <div class="text-xs text-slate-500 truncate mt-0.5">{{ ticket.type }}</div>
                                  </td>"""
new_td = """                                  <td class="px-6 py-4 max-w-[400px]">
                                     <div class="flex items-center gap-2">
                                         <div class="font-bold text-slate-900 dark:text-white truncate">{{ ticket.subject }}</div>
                                         @if (ticket.actions && ticket.actions.length > 0) {
                                            <span class="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded" [class.bg-emerald-100]="ticket.actions.filter($any).length" [class.dark:bg-emerald-900/30]="true">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                                {{ ticket.actions | filterCompletedActionsCount }}/{{ ticket.actions.length }}
                                            </span>
                                         }
                                     </div>
                                     <div class="text-xs text-slate-500 truncate mt-0.5">{{ ticket.type }}</div>
                                  </td>"""

# Wait, we can't use an undefined pipe filterCompletedActionsCount. I'll just write a function or evaluate it.
new_td_no_pipe = """                                  <td class="px-6 py-4 max-w-[400px]">
                                     <div class="flex items-center gap-2">
                                         <div class="font-bold text-slate-900 dark:text-white truncate">{{ ticket.subject }}</div>
                                         @if (ticket.actions && ticket.actions.length > 0) {
                                            @let completed = getCompletedActionsCount(ticket.actions);
                                            <span class="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors" [class.bg-emerald-100]="completed === ticket.actions.length" [class.text-emerald-700]="completed === ticket.actions.length" [class.dark:bg-emerald-900/30]="completed === ticket.actions.length" [class.dark:text-emerald-400]="completed === ticket.actions.length" [class.bg-slate-100]="completed !== ticket.actions.length" [class.text-slate-600]="completed !== ticket.actions.length" [class.dark:bg-slate-800]="completed !== ticket.actions.length" [class.dark:text-slate-400]="completed !== ticket.actions.length">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                                {{ completed }}/{{ ticket.actions.length }}
                                            </span>
                                         }
                                     </div>
                                     <div class="text-xs text-slate-500 truncate mt-0.5">{{ ticket.type }}</div>
                                  </td>"""
content = content.replace(old_td, new_td_no_pipe)

# Add getCompletedActionsCount class method
method2 = """
   getCompletedActionsCount(actions: any[]) {
       if (!actions) return 0;
       return actions.filter(a => a.completed).length;
   }

   // --- MODERATION LOGIC ---"""
content = content.replace("   // --- MODERATION LOGIC ---", method2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Component patched.")
