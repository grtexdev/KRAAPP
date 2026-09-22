/**
 * KARYA - Task Assignment & Fan-out Component
 * Implements FR-TA-01 to FR-TA-11 (Multi-select, searchable KRA table, fan-out, recurrence, register).
 */
const TaskAssignmentComponent = (function () {
  let selectedNodeIds = [];
  let selectedUserIds = [];
  let kraSearchQuery = '';

  return {
    render: function () {
      const kraNodes = State.get().data.kraNodes || [];
      const mainKras = State.get().data.mainKras || [];
      const users = (State.get().data.users || []).filter(u => u.active);
      const projects = State.get().data.projects || [];
      const locations = State.get().data.locations || [];
      const departments = State.get().data.departments || [];

      // Filtered KRA items for searchable picker
      const filteredNodes = kraNodes.filter(n => {
        if (!kraSearchQuery) return true;
        const fullPath = State.getKraFullPath(n.id).toLowerCase();
        const main = State.getMainKraById(n.mainKraId)?.name.toLowerCase() || '';
        const q = kraSearchQuery.toLowerCase();
        return fullPath.includes(q) || main.includes(q) || n.name.toLowerCase().includes(q);
      });

      return `
        <div class="space-y-6">
          <!-- Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-user-plus text-blue-600"></i>
                <span>Task Allotment & Assignment</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Search KRA hierarchy, select multiple nodes & people for automatic fan-out.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl font-semibold">
                Fan-out: ${selectedNodeIds.length} node(s) × ${selectedUserIds.length} assignee(s) = <strong>${selectedNodeIds.length * selectedUserIds.length}</strong> tasks
              </span>
            </div>
          </div>

          <form onsubmit="TaskAssignmentComponent.handleSubmit(event)" class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <!-- Left Column: Searchable KRA Picker (FR-TA-02, FR-TA-04) -->
              <div class="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-magnifying-glass text-blue-500"></i>
                    <span>1. Select KRA Nodes (Multi-Select)</span>
                  </h3>
                  <span class="text-xs text-blue-600 font-semibold">${selectedNodeIds.length} selected</span>
                </div>

                <div class="relative">
                  <input 
                    type="text" 
                    placeholder="Search by Main KRA, path, or task name..." 
                    value="${kraSearchQuery}" 
                    oninput="TaskAssignmentComponent.handleKraSearch(this.value)" 
                    class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                  />
                  <i class="fa-solid fa-search text-slate-400 absolute left-3 top-3 text-xs"></i>
                </div>

                <div class="max-h-72 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
                  ${filteredNodes.length === 0 ? `
                    <div class="p-6 text-center text-xs text-slate-400">No matching KRA nodes found</div>
                  ` : filteredNodes.map(node => {
                    const isChecked = selectedNodeIds.includes(node.id);
                    const path = State.getKraFullPath(node.id);
                    const vars = State.resolveEffectiveVariableFields(node.id);

                    return `
                      <label class="p-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer text-xs block transition select-none ${isChecked ? 'bg-blue-50/50' : ''}">
                        <input 
                          type="checkbox" 
                          value="${node.id}" 
                          ${isChecked ? 'checked' : ''} 
                          onchange="TaskAssignmentComponent.toggleNodeSelection('${node.id}', this.checked)" 
                          class="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div class="flex-1 space-y-0.5">
                          <strong class="text-slate-800 block text-xs font-semibold">${path}</strong>
                          <span class="text-[11px] text-slate-500 block">Owner: ${State.getUserById(State.resolveEffectiveOwnerId(node.id))?.name || 'Root'}</span>
                          ${vars.length > 0 ? `
                            <span class="text-[10px] text-slate-400 italic block">Questions: ${vars.join(', ')}</span>
                          ` : ''}
                        </div>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Right Column: Assignee Picker (Multi-Select) -->
              <div class="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-users text-blue-500"></i>
                    <span>2. Select Assignees (Multi-Select)</span>
                  </h3>
                  <span class="text-xs text-blue-600 font-semibold">${selectedUserIds.length} selected</span>
                </div>

                <div class="max-h-80 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
                  ${users.map(u => {
                    const isChecked = selectedUserIds.includes(u.id);
                    return `
                      <label class="p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer text-xs transition select-none ${isChecked ? 'bg-blue-50/50' : ''}">
                        <div class="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            value="${u.id}" 
                            ${isChecked ? 'checked' : ''} 
                            onchange="TaskAssignmentComponent.toggleUserSelection('${u.id}', this.checked)" 
                            class="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <strong class="text-slate-800 font-semibold block">${u.name}</strong>
                            <span class="text-[11px] text-slate-500">${u.designation || 'Staff'}</span>
                          </div>
                        </div>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full badge-role-${u.role}">
                          ${u.role}
                        </span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>

            <!-- Task Parameters Card -->
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 class="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                3. Assignment Parameters & Recurrence
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Date Given</label>
                  <input type="date" id="assign-date" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required />
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Project</label>
                  <select id="assign-project" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                    <option value="">-- Select Project --</option>
                    ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select id="assign-priority" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Location</label>
                  <select id="assign-location" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                    ${locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Department</label>
                  <select id="assign-department" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                    ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Allotted Minutes</label>
                  <input type="number" id="assign-minutes" value="60" min="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                </div>
              </div>

              <!-- Targets: Qty, Quality, Cost -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Quantity Target</label>
                  <input type="number" id="assign-qty" placeholder="Optional numeric target" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Quality Target (0-100%)</label>
                  <input type="number" id="assign-quality" min="0" max="100" placeholder="Optional" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Cost Budget (₹)</label>
                  <input type="number" id="assign-cost" placeholder="Optional" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" />
                </div>
              </div>

              <!-- Instructions -->
              <div>
                <label class="block font-semibold text-slate-700 text-xs mb-1">Instructions for Assignees</label>
                <textarea id="assign-instructions" rows="2" placeholder="Specific deliverables, references, guidelines..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"></textarea>
              </div>

              <!-- Recurrence details (FR-TA-06) -->
              <div class="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
                <label class="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                  <input type="checkbox" id="assign-recurring-check" onchange="TaskAssignmentComponent.toggleRecurring(this.checked)" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>This is a Recurring Task</span>
                </label>

                <div id="recurring-fields" class="hidden grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Frequency</label>
                    <select id="assign-recur-freq" class="w-full bg-white border border-slate-200 rounded-xl p-2.5">
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Start Date</label>
                    <input type="date" id="assign-recur-start" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-white border border-slate-200 rounded-xl p-2.5" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">End Date</label>
                    <input type="date" id="assign-recur-end" class="w-full bg-white border border-slate-200 rounded-xl p-2.5" />
                  </div>
                </div>
              </div>

              <!-- Submission Bar -->
              <div class="pt-3 flex justify-end gap-3">
                <button 
                  type="submit" 
                  id="btn-assign-submit" 
                  class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center gap-2"
                >
                  <i class="fa-solid fa-paper-plane text-xs"></i>
                  <span>Create Batch Assignments (${selectedNodeIds.length * selectedUserIds.length} Tasks)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      `;
    },

    handleKraSearch: function (q) {
      kraSearchQuery = q;
      App.renderCurrentTab();
    },

    toggleNodeSelection: function (nodeId, checked) {
      if (checked && !selectedNodeIds.includes(nodeId)) {
        selectedNodeIds.push(nodeId);
      } else if (!checked) {
        selectedNodeIds = selectedNodeIds.filter(id => id !== nodeId);
      }
      App.renderCurrentTab();
    },

    toggleUserSelection: function (userId, checked) {
      if (checked && !selectedUserIds.includes(userId)) {
        selectedUserIds.push(userId);
      } else if (!checked) {
        selectedUserIds = selectedUserIds.filter(id => id !== userId);
      }
      App.renderCurrentTab();
    },

    toggleRecurring: function (checked) {
      const fields = document.getElementById('recurring-fields');
      if (fields) fields.classList.toggle('hidden', !checked);
    },

    handleSubmit: async function (e) {
      e.preventDefault();

      if (selectedNodeIds.length === 0) {
        App.showToast('Please select at least one KRA node.', 'warning');
        return;
      }
      if (selectedUserIds.length === 0) {
        App.showToast('Please select at least one assignee.', 'warning');
        return;
      }

      const btn = document.getElementById('btn-assign-submit');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Creating Tasks...`;

      try {
        const dateGiven = document.getElementById('assign-date').value;
        const projectId = document.getElementById('assign-project').value;
        const priority = document.getElementById('assign-priority').value;
        const locationId = document.getElementById('assign-location').value;
        const departmentId = document.getElementById('assign-department').value;
        const estMinutes = Number(document.getElementById('assign-minutes').value || 0);
        const qty = Number(document.getElementById('assign-qty').value || 0);
        const quality = Number(document.getElementById('assign-quality').value || 0);
        const cost = Number(document.getElementById('assign-cost').value || 0);
        const details = document.getElementById('assign-instructions').value;

        const isRecurring = document.getElementById('assign-recurring-check')?.checked || false;
        const recurFreq = isRecurring ? document.getElementById('assign-recur-freq').value : '';
        const recurStart = isRecurring ? document.getElementById('assign-recur-start').value : '';
        const recurEnd = isRecurring ? document.getElementById('assign-recur-end').value : '';

        const currentUser = State.getUser();
        const sharedGroupId = 'grp_' + new Date().getTime().toString(36);
        const tasksToCreate = [];

        // Fan-out: 1 task per (node × assignee)
        selectedNodeIds.forEach(nodeId => {
          const node = State.getKraNodeById(nodeId);
          const flowId = State.resolveEffectiveApprovalFlowId(nodeId);

          selectedUserIds.forEach(userId => {
            tasksToCreate.push({
              dateGiven: dateGiven,
              locationId: locationId,
              departmentId: departmentId,
              projectId: projectId,
              mainKraId: node.mainKraId,
              kraNodeId: nodeId,
              assignedToId: userId,
              assignedBy: currentUser.id,
              groupId: sharedGroupId,
              priority: priority,
              details: details,
              qty: qty,
              quality: quality,
              cost: cost,
              estMinutes: estMinutes,
              recurring: isRecurring,
              recurFrequency: recurFreq,
              recurStartDate: recurStart,
              recurEndDate: recurEnd,
              approvalFlowId: flowId || '',
              status: 'Pending'
            });
          });
        });

        await API.assignTasks(tasksToCreate, sharedGroupId);

        // Reset selections
        selectedNodeIds = [];
        selectedUserIds = [];
        App.showToast(`Successfully created ${tasksToCreate.length} tasks!`, 'success');
        await App.loadTasks();
        App.switchTab('myTasks');
      } catch (err) {
        App.showToast(err.message || 'Failed to assign tasks', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Batch Assignments';
      }
    }
  };
})();
