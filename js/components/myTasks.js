/**
 * KARYA - My Tasks (Daily Reporting & Effort Tracking Component)
 * Implements FR-RPT-01 to FR-RPT-08, FR-TA-12 (Self-logging).
 */
const MyTasksComponent = (function () {
  let selectedDate = new Date().toISOString().split('T')[0];
  let filterProject = '';
  let filterMainKra = '';
  let filterStatus = '';
  let showHold = false;

  return {
    render: function () {
      const currentUser = State.getUser();
      if (!currentUser) return `<div class="p-8 text-center text-slate-500">Please sign in to view your tasks.</div>`;

      const allTasks = State.get().data.tasks || [];
      // Filter tasks assigned to current user
      let myTasks = allTasks.filter(t => t.assignedToId === currentUser.id);

      // Filters
      if (filterProject) myTasks = myTasks.filter(t => t.projectId === filterProject);
      if (filterMainKra) myTasks = myTasks.filter(t => t.mainKraId === filterMainKra);
      if (filterStatus) myTasks = myTasks.filter(t => t.status === filterStatus);
      if (!showHold) myTasks = myTasks.filter(t => t.status !== 'Hold');

      // Sort newest first
      myTasks.sort((a, b) => new Date(b.createdAt || b.dateGiven) - new Date(a.createdAt || a.dateGiven));

      const projects = State.get().data.projects || [];
      const mainKras = State.get().data.mainKras || [];

      return `
        <div class="space-y-6">
          <!-- Header Bar with Reporting Date & Action Buttons -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-list-check text-blue-600"></i>
                <span>My Tasks & Daily Reporting</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Log daily minutes, answer KRA variable fields, and submit deliverables.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <i class="fa-regular fa-calendar text-slate-400 text-sm"></i>
                <span class="text-xs font-semibold text-slate-600 uppercase">Log Date:</span>
                <input 
                  type="date" 
                  id="reporting-date-picker" 
                  value="${selectedDate}" 
                  class="bg-transparent text-sm font-medium text-slate-800 outline-none cursor-pointer"
                  onchange="MyTasksComponent.handleDateChange(this.value)"
                />
              </div>

              <button 
                onclick="MyTasksComponent.openSelfLogModal()" 
                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
              >
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Self-log Task</span>
              </button>
            </div>
          </div>

          <!-- Filter Toolbar -->
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-3">
              <select onchange="MyTasksComponent.handleFilterProject(this.value)" class="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none font-medium">
                <option value="">All Projects</option>
                ${projects.map(p => `<option value="${p.id}" ${filterProject === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>

              <select onchange="MyTasksComponent.handleFilterMainKra(this.value)" class="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none font-medium">
                <option value="">All Main KRAs</option>
                ${mainKras.map(m => `<option value="${m.id}" ${filterMainKra === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
              </select>

              <select onchange="MyTasksComponent.handleFilterStatus(this.value)" class="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 outline-none font-medium">
                <option value="">All Statuses</option>
                <option value="Pending" ${filterStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="WIP" ${filterStatus === 'WIP' ? 'selected' : ''}>WIP</option>
                <option value="Completed" ${filterStatus === 'Completed' ? 'selected' : ''}>Completed</option>
                <option value="Hold" ${filterStatus === 'Hold' ? 'selected' : ''}>Hold</option>
              </select>

              <label class="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input type="checkbox" ${showHold ? 'checked' : ''} onchange="MyTasksComponent.toggleHold(this.checked)" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                <span>Show On-Hold tasks</span>
              </label>
            </div>

            <div class="text-xs text-slate-500 font-medium">
              Showing <strong>${myTasks.length}</strong> task(s)
            </div>
          </div>

          <!-- Tasks List -->
          ${myTasks.length === 0 ? `
            <div class="bg-white rounded-2xl p-12 border border-slate-200 text-center">
              <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <i class="fa-solid fa-inbox text-2xl"></i>
              </div>
              <h3 class="text-base font-bold text-slate-700">No tasks found</h3>
              <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No tasks assigned matching your filters. You can create a self-logged task using the "Self-log Task" button above.
              </p>
            </div>
          ` : `
            <div class="space-y-4">
              ${myTasks.map(task => this.renderTaskCard(task)).join('')}
            </div>
          `}
        </div>
      `;
    },

    renderTaskCard: function (task) {
      const kraPath = State.getKraFullPath(task.kraNodeId) || State.getMainKraById(task.mainKraId)?.name || 'Direct Task';
      const project = State.getProjectById(task.projectId);
      const effectiveVars = State.resolveEffectiveVariableFields(task.kraNodeId);

      // Parse dailyLog map
      let dailyLog = {};
      try {
        dailyLog = typeof task.dailyLog === 'string' ? JSON.parse(task.dailyLog) : (task.dailyLog || {});
      } catch (e) {
        dailyLog = {};
      }
      const todayMinutes = dailyLog[selectedDate] || 0;
      const totalMinutes = task.timeSpentTotal || 0;

      // Status badge styling
      const statusClass = `badge-${task.status.toLowerCase()}`;

      // Approval state info
      let approvalBadge = '';
      if (task.approvalFlowId) {
        if (task.approvalState === 'rework') {
          approvalBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold badge-rework"><i class="fa-solid fa-rotate-left mr-1"></i>Rework Required</span>`;
        } else if (task.approvalState === 'pending') {
          approvalBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold badge-pending"><i class="fa-solid fa-clock mr-1"></i>Awaiting Approval</span>`;
        } else if (task.approvalState === 'approved') {
          approvalBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold badge-completed"><i class="fa-solid fa-check-double mr-1"></i>Approved</span>`;
        } else {
          approvalBadge = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Draft</span>`;
        }
      }

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-200 transition space-y-4" id="task-card-${task.id}">
          <!-- Top Row: KRA Path, Project & Status -->
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div class="space-y-1 max-w-2xl">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                  ${project ? project.name : 'General Project'}
                </span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs font-medium text-slate-500">Date: ${task.dateGiven || 'N/A'}</span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Priority: ${task.priority || 'Normal'}</span>
              </div>
              <h3 class="text-base font-bold text-slate-900">${kraPath}</h3>
              ${task.details ? `<p class="text-xs text-slate-600 mt-1">${task.details}</p>` : ''}
            </div>

            <div class="flex items-center gap-2">
              ${approvalBadge}
              <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}">
                ${task.status}
              </span>
            </div>
          </div>

          <!-- Rework Reason Alert (if returned for rework) -->
          ${task.approvalState === 'rework' ? `
            <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-3 text-rose-800 text-xs">
              <i class="fa-solid fa-triangle-exclamation text-base text-rose-600 mt-0.5"></i>
              <div>
                <strong class="font-bold block">Correction Required:</strong>
                <p class="mt-0.5">${task.reason || task.remarks || 'Please revise the deliverable and resubmit.'}</p>
              </div>
            </div>
          ` : ''}

          <!-- Variable Fields Section (Prompted per KRA node) -->
          ${effectiveVars.length > 0 ? `
            <div class="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
              <span class="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                <i class="fa-solid fa-clipboard-question text-blue-500 mr-1"></i> KRA Variable Questions
              </span>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${effectiveVars.map((vLabel, idx) => {
                  const varKey = `var${idx + 1}`;
                  const currentVal = task[varKey] || '';
                  return `
                    <div>
                      <label class="block text-xs text-slate-600 font-medium mb-1">${vLabel}:</label>
                      <input 
                        type="text" 
                        id="input-${task.id}-${varKey}" 
                        value="${currentVal}" 
                        placeholder="Enter answer..." 
                        class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Bottom Action Controls: Time, Status, Remarks, Save -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <!-- Minutes for today -->
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">
                Minutes Logged (${selectedDate}):
              </label>
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0" 
                  id="input-${task.id}-minutes" 
                  value="${todayMinutes}" 
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
                <span class="text-xs text-slate-400 font-medium whitespace-nowrap">
                  Total: <strong>${totalMinutes}m</strong>
                </span>
              </div>
            </div>

            <!-- Status Dropdown -->
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Update Status:</label>
              <select id="input-${task.id}-status" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium">
                <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="WIP" ${task.status === 'WIP' ? 'selected' : ''}>WIP (In Progress)</option>
                <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                <option value="Hold" ${task.status === 'Hold' ? 'selected' : ''}>Hold</option>
              </select>
            </div>

            <!-- Remarks / Reason -->
            <div class="md:col-span-1">
              <label class="block text-xs font-semibold text-slate-600 mb-1">Remarks / Reason (if WIP):</label>
              <input 
                type="text" 
                id="input-${task.id}-remarks" 
                value="${task.remarks || ''}" 
                placeholder="Remarks..." 
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Action Buttons -->
            <div class="flex items-end gap-2">
              <button 
                onclick="MyTasksComponent.saveTaskReport('${task.id}')" 
                id="btn-save-${task.id}" 
                class="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <i class="fa-solid fa-floppy-disk"></i>
                <span>Save Report</span>
              </button>

              ${task.approvalFlowId ? `
                <button 
                  onclick="MyTasksComponent.openSubmitApprovalModal('${task.id}')" 
                  title="Submit Deliverable for Approval" 
                  class="bg-blue-50 hover:bg-blue-100 text-blue-700 p-2.5 rounded-xl border border-blue-200 text-xs font-semibold transition flex items-center gap-1"
                >
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                  <span>Deliverable</span>
                </button>
              ` : ''}

              <button 
                onclick="MyTasksComponent.openReassignModal('${task.id}')" 
                title="Reassign Task" 
                class="bg-slate-50 hover:bg-slate-100 text-slate-600 p-2.5 rounded-xl border border-slate-200 text-xs transition"
              >
                <i class="fa-solid fa-share-nodes"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    },

    handleDateChange: function (date) {
      selectedDate = date;
      App.renderCurrentTab();
    },

    handleFilterProject: function (val) {
      filterProject = val;
      App.renderCurrentTab();
    },

    handleFilterMainKra: function (val) {
      filterMainKra = val;
      App.renderCurrentTab();
    },

    handleFilterStatus: function (val) {
      filterStatus = val;
      App.renderCurrentTab();
    },

    toggleHold: function (checked) {
      showHold = checked;
      App.renderCurrentTab();
    },

    saveTaskReport: async function (taskId) {
      const minutes = Number(document.getElementById(`input-${taskId}-minutes`)?.value || 0);
      const status = document.getElementById(`input-${taskId}-status`)?.value;
      const remarks = document.getElementById(`input-${taskId}-remarks`)?.value || '';

      const varAnswers = {
        var1: document.getElementById(`input-${taskId}-var1`)?.value,
        var2: document.getElementById(`input-${taskId}-var2`)?.value,
        var3: document.getElementById(`input-${taskId}-var3`)?.value,
        var4: document.getElementById(`input-${taskId}-var4`)?.value
      };

      const btn = document.getElementById(`btn-save-${taskId}`);
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
      }

      try {
        await API.updateTaskDailyLog(taskId, selectedDate, minutes, varAnswers, status, remarks);
        App.showToast('Daily effort log saved successfully!', 'success');
        // Refresh local tasks
        await App.loadTasks();
      } catch (err) {
        App.showToast(err.message || 'Failed to save log', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span>Save Report</span>`;
        }
      }
    },

    // Self-logging modal (FR-TA-12)
    openSelfLogModal: function () {
      const mainKras = State.get().data.mainKras || [];
      const kraNodes = State.get().data.kraNodes || [];
      const projects = State.get().data.projects || [];
      const locations = State.get().data.locations || [];
      const departments = State.get().data.departments || [];
      const currentUser = State.getUser();

      const modalHtml = `
        <div id="self-log-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-lg font-bold text-slate-800">Self-log a Task</h3>
              <button onclick="document.getElementById('self-log-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="MyTasksComponent.handleSelfLogSubmit(event)" class="space-y-4 mt-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Project</label>
                <select id="self-project" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                  <option value="">-- Choose Project --</option>
                  ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Main KRA</label>
                <select id="self-main-kra" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                  <option value="">-- Choose Main KRA --</option>
                  ${mainKras.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">KRA Node (Sub-level)</label>
                <select id="self-kra-node" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <option value="">-- Main KRA Direct / Top Level --</option>
                  ${kraNodes.map(n => `<option value="${n.id}">${State.getKraFullPath(n.id)}</option>`).join('')}
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Location</label>
                  <select id="self-location" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                    ${locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Department</label>
                  <select id="self-department" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                    ${departments.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Task Instructions / Description</label>
                <textarea id="self-details" rows="2" placeholder="What activity are you performing?" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select id="self-priority" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Initial Minutes</label>
                  <input type="number" id="self-minutes" value="30" min="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                </div>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('self-log-modal').remove()" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-medium">Cancel</button>
                <button type="submit" id="self-log-submit-btn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium shadow">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleSelfLogSubmit: async function (e) {
      e.preventDefault();
      const currentUser = State.getUser();
      const btn = document.getElementById('self-log-submit-btn');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Creating...`;

      try {
        const projectId = document.getElementById('self-project').value;
        const mainKraId = document.getElementById('self-main-kra').value;
        const kraNodeId = document.getElementById('self-kra-node').value || null;
        const locationId = document.getElementById('self-location').value;
        const departmentId = document.getElementById('self-department').value;
        const details = document.getElementById('self-details').value;
        const priority = document.getElementById('self-priority').value;
        const minutes = Number(document.getElementById('self-minutes').value || 0);

        const flowId = kraNodeId ? State.resolveEffectiveApprovalFlowId(kraNodeId) : State.getMainKraById(mainKraId)?.approvalFlowId;

        const newTask = {
          dateGiven: selectedDate,
          locationId: locationId,
          departmentId: departmentId,
          projectId: projectId,
          mainKraId: mainKraId,
          kraNodeId: kraNodeId,
          assignedToId: currentUser.id,
          assignedBy: currentUser.id,
          priority: priority,
          details: details,
          status: 'WIP',
          approvalFlowId: flowId || '',
          dailyLog: JSON.stringify({ [selectedDate]: minutes }),
          timeSpentTotal: minutes
        };

        await API.assignTasks([newTask]);
        document.getElementById('self-log-modal').remove();
        App.showToast('Self-logged task created!', 'success');
        await App.loadTasks();
      } catch (err) {
        App.showToast(err.message || 'Error creating self-logged task', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Task';
      }
    },

    // Reassignment modal (FR-RPT-07)
    openReassignModal: function (taskId) {
      const users = State.get().data.users || [];
      const currentUser = State.getUser();

      const modalHtml = `
        <div id="reassign-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <h3 class="text-base font-bold text-slate-800 mb-1">Reassign Task</h3>
            <p class="text-xs text-slate-500 mb-4">Transfer this task with handover remarks.</p>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Reassign To:</label>
                <select id="reassign-user-select" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                  ${users.filter(u => u.active && u.id !== currentUser.id).map(u => `
                    <option value="${u.id}">${u.name} [${u.role.toUpperCase()}]</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Hand-over Remarks (Mandatory):</label>
                <textarea id="reassign-remarks" rows="3" placeholder="Explain reason for handover..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required></textarea>
              </div>

              <div class="pt-3 flex gap-2">
                <button onclick="document.getElementById('reassign-modal').remove()" class="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium">Cancel</button>
                <button onclick="MyTasksComponent.handleReassignSubmit('${taskId}')" id="btn-reassign-submit" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium shadow">Confirm Hand-over</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleReassignSubmit: async function (taskId) {
      const toUserId = document.getElementById('reassign-user-select').value;
      const remarks = document.getElementById('reassign-remarks').value.trim();
      const currentUser = State.getUser();

      if (!remarks) {
        App.showToast('Please provide handover remarks', 'warning');
        return;
      }

      const btn = document.getElementById('btn-reassign-submit');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Reassigning...`;

      try {
        await API.reassignTask(taskId, toUserId, remarks, currentUser.id);
        document.getElementById('reassign-modal').remove();
        App.showToast('Task reassigned successfully!', 'success');
        await App.loadTasks();
      } catch (err) {
        App.showToast(err.message || 'Failed to reassign', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Confirm Hand-over';
      }
    },

    // Submit Deliverable for Approval modal (FR-APR-06, FR-APR-07)
    openSubmitApprovalModal: function (taskId) {
      const task = (State.get().data.tasks || []).find(t => t.id === taskId);
      if (!task) return;

      const modalHtml = `
        <div id="submit-approval-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">Submit Deliverable for Approval</h3>
              <button onclick="document.getElementById('submit-approval-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div class="space-y-4 mt-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Remarks for Approver:</label>
                <textarea id="approval-remarks" rows="2" placeholder="Add any comments or context..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"></textarea>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">
                  Upload Deliverable File (Images, PDF, Video - max 20MB):
                </label>
                <input 
                  type="file" 
                  id="deliverable-file-input" 
                  accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.pdf" 
                  class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 cursor-pointer"
                />
                <p class="text-[11px] text-slate-400 mt-1">File will be securely stored in Google Drive.</p>
              </div>

              <div id="upload-status" class="hidden text-blue-600 font-medium text-xs flex items-center gap-2">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Uploading file to Google Drive...</span>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('submit-approval-modal').remove()" class="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium">Cancel</button>
                <button type="button" onclick="MyTasksComponent.handleSubmitApprovalAction('${taskId}')" id="btn-submit-approval" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium shadow">Submit Deliverable</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleSubmitApprovalAction: async function (taskId) {
      const fileInput = document.getElementById('deliverable-file-input');
      const remarks = document.getElementById('approval-remarks').value;
      const currentUser = State.getUser();
      const statusDiv = document.getElementById('upload-status');
      const btn = document.getElementById('btn-submit-approval');

      btn.disabled = true;
      let newAttachments = [];

      try {
        if (fileInput.files.length > 0) {
          const file = fileInput.files[0];
          if (file.size > 20 * 1024 * 1024) {
            throw new Error('File exceeds 20MB limit.');
          }

          statusDiv.classList.remove('hidden');
          // Convert to Base64
          const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Upload to Google Drive
          const uploadedAsset = await API.uploadFile(file.name, base64Data, file.type);
          newAttachments.push(uploadedAsset);
        }

        await API.submitApproval(taskId, currentUser.id, remarks, newAttachments);
        document.getElementById('submit-approval-modal').remove();
        App.showToast('Deliverable submitted for approval!', 'success');
        await App.loadTasks();
      } catch (err) {
        App.showToast(err.message || 'Submission failed', 'error');
        statusDiv.classList.add('hidden');
        btn.disabled = false;
      }
    }
  };
})();
