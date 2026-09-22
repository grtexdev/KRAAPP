/**
 * KARYA - Projects & Bulk Task Matrix Builder Component
 * Implements FR-PRJ-01 to FR-PRJ-06.
 */
const ProjectsComponent = (function () {
  let selectedProjectId = '';
  let builderRows = [];

  return {
    render: function () {
      const projects = State.get().data.projects || [];
      const tasks = State.get().data.tasks || [];
      const users = State.get().data.users || [];

      if (!selectedProjectId && projects.length > 0) {
        selectedProjectId = projects[0].id;
      }

      const activeProject = State.getProjectById(selectedProjectId);
      const projectTasks = tasks.filter(t => t.projectId === selectedProjectId);

      // Project Metrics
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
      const wipTasks = projectTasks.filter(t => t.status === 'WIP').length;
      const pendingApprovalTasks = projectTasks.filter(t => t.approvalState === 'pending').length;
      
      let totalMinutes = 0;
      let totalCost = 0;
      projectTasks.forEach(t => {
        const mins = Number(t.timeSpentTotal || 0);
        totalMinutes += mins;
        const assignee = State.getUserById(t.assignedToId);
        const monthlySalary = assignee ? (assignee.salaryMonthly || 0) : 0;
        const dailyRate = monthlySalary / 30;
        const cost = (mins / 480) * dailyRate;
        totalCost += cost;
      });

      return `
        <div class="space-y-6">
          <!-- Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-diagram-project text-blue-600"></i>
                <span>Projects & Bulk Matrix Builder</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Track project execution, team effort, and bulk create multiple task rows.
              </p>
            </div>

            <div class="flex items-center gap-3">
              <select 
                onchange="ProjectsComponent.selectProject(this.value)" 
                class="bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                ${projects.map(p => `
                  <option value="${p.id}" ${p.id === selectedProjectId ? 'selected' : ''}>
                    📁 ${p.name}
                  </option>
                `).join('')}
              </select>

              ${(State.canManageKra()) ? `
                <button 
                  onclick="ProjectsComponent.openCreateProjectModal()" 
                  class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
                  title="Create a new Project"
                >
                  <i class="fa-solid fa-plus text-xs"></i>
                  <span>New Project</span>
                </button>
              ` : ''}
            </div>
          </div>

          ${activeProject ? `
            <!-- Project Performance Overview Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Tasks</span>
                <span class="text-2xl font-bold text-slate-900">${totalTasks}</span>
                <div class="mt-2 text-xs text-slate-400 flex justify-between">
                  <span>Completed: ${completedTasks}</span>
                  <span>WIP: ${wipTasks}</span>
                </div>
              </div>

              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Pending Approval</span>
                <span class="text-2xl font-bold text-amber-600">${pendingApprovalTasks}</span>
                <span class="text-xs text-slate-400 block mt-2">Awaiting decision</span>
              </div>

              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Total Effort</span>
                <span class="text-2xl font-bold text-blue-600">${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m</span>
                <span class="text-xs text-slate-400 block mt-2">${totalMinutes} total minutes</span>
              </div>

              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Derived Cost</span>
                <span class="text-2xl font-bold text-emerald-600">₹${Math.round(totalCost).toLocaleString('en-IN')}</span>
                <span class="text-xs text-slate-400 block mt-2">Priced at actual salary</span>
              </div>

              <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Designated Team</span>
                <span class="text-2xl font-bold text-purple-600">
                  ${(activeProject.memberIds && Array.isArray(activeProject.memberIds)) ? activeProject.memberIds.length : 1}
                </span>
                <span class="text-xs text-slate-400 block mt-2">Manager: ${State.getUserById(activeProject.managerId)?.name || 'Admin'}</span>
              </div>
            </div>

            <!-- Bulk Task Matrix Builder (FR-PRJ-03 to FR-PRJ-05) -->
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 class="text-base font-bold text-slate-800">Bulk Task Matrix Builder</h3>
                  <p class="text-xs text-slate-500 mt-0.5">
                    Define multiple tasks at once and allot them in a single operation.
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    onclick="ProjectsComponent.addBuilderRow()" 
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                  >
                    <i class="fa-solid fa-plus text-xs"></i>
                    <span>Add Row</span>
                  </button>
                  <button 
                    onclick="ProjectsComponent.submitBulkBuilder()" 
                    id="btn-bulk-submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <i class="fa-solid fa-paper-plane text-xs"></i>
                    <span>Allot Bulk Tasks</span>
                  </button>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th class="p-2.5">KRA Node</th>
                      <th class="p-2.5">Assignee(s)</th>
                      <th class="p-2.5">Priority</th>
                      <th class="p-2.5">Date Given</th>
                      <th class="p-2.5">Minutes</th>
                      <th class="p-2.5">Instructions</th>
                      <th class="p-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="builder-table-body" class="divide-y divide-slate-100">
                    ${this.renderBuilderRows()}
                  </tbody>
                </table>
              </div>
            </div>
          ` : `
            <div class="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No projects available.
            </div>
          `}
        </div>
      `;
    },

    selectProject: function (id) {
      selectedProjectId = id;
      App.renderCurrentTab();
    },

    renderBuilderRows: function () {
      if (builderRows.length === 0) {
        // Initialize with 1 default row
        builderRows = [{
          id: 'row_' + Math.random().toString(36).substr(2, 5),
          kraNodeId: '',
          assigneeIds: [],
          priority: 'Normal',
          dateGiven: new Date().toISOString().split('T')[0],
          estMinutes: 60,
          details: ''
        }];
      }

      const kraNodes = State.get().data.kraNodes || [];
      const project = State.getProjectById(selectedProjectId);
      const teamIds = (project && project.memberIds && Array.isArray(project.memberIds)) ? project.memberIds : [];
      const allUsers = (State.get().data.users || []).filter(u => u.active);

      return builderRows.map((row, idx) => `
        <tr class="hover:bg-slate-50/50 transition">
          <td class="p-2 w-48">
            <select onchange="ProjectsComponent.updateRow('${row.id}', 'kraNodeId', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs">
              <option value="">-- Choose KRA --</option>
              ${kraNodes.map(n => `<option value="${n.id}" ${row.kraNodeId === n.id ? 'selected' : ''}>${State.getKraFullPath(n.id)}</option>`).join('')}
            </select>
          </td>

          <td class="p-2 w-48">
            <select onchange="ProjectsComponent.updateRowAssignee('${row.id}', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs">
              <option value="">-- Select Person --</option>
              ${allUsers.map(u => {
                const isTeam = teamIds.includes(u.id);
                return `<option value="${u.id}" ${row.assigneeIds.includes(u.id) ? 'selected' : ''}>${u.name} ${isTeam ? '(Team)' : ''}</option>`;
              }).join('')}
            </select>
          </td>

          <td class="p-2 w-28">
            <select onchange="ProjectsComponent.updateRow('${row.id}', 'priority', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium">
              <option value="Normal" ${row.priority === 'Normal' ? 'selected' : ''}>Normal</option>
              <option value="High" ${row.priority === 'High' ? 'selected' : ''}>High</option>
              <option value="Urgent" ${row.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
              <option value="Low" ${row.priority === 'Low' ? 'selected' : ''}>Low</option>
            </select>
          </td>

          <td class="p-2 w-32">
            <input type="date" value="${row.dateGiven}" onchange="ProjectsComponent.updateRow('${row.id}', 'dateGiven', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs" />
          </td>

          <td class="p-2 w-24">
            <input type="number" min="0" value="${row.estMinutes}" onchange="ProjectsComponent.updateRow('${row.id}', 'estMinutes', Number(this.value))" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs" />
          </td>

          <td class="p-2">
            <input type="text" value="${row.details}" placeholder="Instructions..." onchange="ProjectsComponent.updateRow('${row.id}', 'details', this.value)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs" />
          </td>

          <td class="p-2 text-center w-24">
            <div class="flex items-center justify-center gap-1">
              <button onclick="ProjectsComponent.duplicateRow('${row.id}')" title="Duplicate row" class="p-1.5 text-slate-400 hover:text-blue-600 rounded">
                <i class="fa-regular fa-copy"></i>
              </button>
              <button onclick="ProjectsComponent.removeRow('${row.id}')" title="Remove row" class="p-1.5 text-slate-400 hover:text-rose-600 rounded">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    },

    addBuilderRow: function () {
      builderRows.push({
        id: 'row_' + Math.random().toString(36).substr(2, 5),
        kraNodeId: '',
        assigneeIds: [],
        priority: 'Normal',
        dateGiven: new Date().toISOString().split('T')[0],
        estMinutes: 60,
        details: ''
      });
      App.renderCurrentTab();
    },

    duplicateRow: function (rowId) {
      const original = builderRows.find(r => r.id === rowId);
      if (original) {
        builderRows.push({
          ...original,
          id: 'row_' + Math.random().toString(36).substr(2, 5)
        });
        App.renderCurrentTab();
      }
    },

    removeRow: function (rowId) {
      if (builderRows.length <= 1) {
        App.showToast('At least one builder row is required.', 'warning');
        return;
      }
      builderRows = builderRows.filter(r => r.id !== rowId);
      App.renderCurrentTab();
    },

    updateRow: function (rowId, field, val) {
      const row = builderRows.find(r => r.id === rowId);
      if (row) row[field] = val;
    },

    updateRowAssignee: function (rowId, userId) {
      const row = builderRows.find(r => r.id === rowId);
      if (row) {
        row.assigneeIds = userId ? [userId] : [];
      }
    },

    submitBulkBuilder: async function () {
      const currentUser = State.getUser();
      const locations = State.get().data.locations || [];
      const departments = State.get().data.departments || [];
      const defaultLocId = locations[0]?.id || '';
      const defaultDeptId = departments[0]?.id || '';

      const tasksToCreate = [];
      for (const row of builderRows) {
        if (!row.kraNodeId) {
          App.showToast('Please select a KRA node for all rows.', 'warning');
          return;
        }
        if (!row.assigneeIds || row.assigneeIds.length === 0) {
          App.showToast('Please select an assignee for all rows.', 'warning');
          return;
        }

        const node = State.getKraNodeById(row.kraNodeId);
        const flowId = State.resolveEffectiveApprovalFlowId(row.kraNodeId);

        row.assigneeIds.forEach(userId => {
          tasksToCreate.push({
            dateGiven: row.dateGiven,
            locationId: defaultLocId,
            departmentId: defaultDeptId,
            projectId: selectedProjectId,
            mainKraId: node.mainKraId,
            kraNodeId: row.kraNodeId,
            assignedToId: userId,
            assignedBy: currentUser.id,
            priority: row.priority,
            details: row.details,
            estMinutes: row.estMinutes,
            approvalFlowId: flowId || '',
            status: 'Pending'
          });
        });
      }

      const btn = document.getElementById('btn-bulk-submit');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Creating Tasks...`;

      try {
        await API.assignTasks(tasksToCreate);
        builderRows = [];
        App.showToast(`Successfully created ${tasksToCreate.length} bulk tasks!`, 'success');
        await App.loadTasks();
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Bulk creation failed', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Allot Bulk Tasks';
      }
    },

    openCreateProjectModal: function () {
      const bus = State.get().data.businessUnits || [];
      const users = (State.get().data.users || []).filter(u => u.active);
      const currentUser = State.getUser();

      const modalHtml = `
        <div id="create-project-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="modal-panel max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <i class="fa-solid fa-diagram-project"></i>
                </div>
                <div>
                  <h3 class="text-base font-bold text-slate-800">Create New Project</h3>
                  <p class="text-[11px] text-slate-500">Define project scope, business unit & designated team</p>
                </div>
              </div>
              <button onclick="document.getElementById('create-project-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="ProjectsComponent.handleCreateProjectSubmit(event)" class="space-y-4 mt-4 text-xs">
              <div>
                <label class="form-label">Project Name <span class="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  id="new-project-name" 
                  placeholder="e.g. FY27 Digital Transformation & Branding" 
                  class="form-input" 
                  required 
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Business Unit <span class="text-rose-500">*</span></label>
                  <select id="new-project-bu" class="form-select" required>
                    <option value="">-- Select Business Unit --</option>
                    ${bus.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label">Project Manager <span class="text-rose-500">*</span></label>
                  <select id="new-project-manager" class="form-select" required>
                    <option value="">-- Select Manager --</option>
                    ${users.map(u => `<option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>${u.name} (${u.role.toUpperCase()})</option>`).join('')}
                  </select>
                </div>
              </div>

              <div>
                <label class="form-label">Assign Team Members</label>
                <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
                  ${users.map(u => `
                    <label class="flex items-center gap-2 text-xs text-slate-700 hover:bg-white p-1 rounded-lg cursor-pointer">
                      <input type="checkbox" name="project-members" value="${u.id}" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" ${u.id === currentUser.id ? 'checked' : ''} />
                      <span class="font-medium">${u.name}</span>
                      <span class="text-[10px] text-slate-400 capitalize">(${u.role})</span>
                    </label>
                  `).join('')}
                </div>
                <p class="text-[10px] text-slate-400 mt-1">Selected members will have access to project tasks & allocation.</p>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('create-project-modal').remove()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" id="btn-save-project" class="btn btn-primary flex-1">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleCreateProjectSubmit: async function (e) {
      e.preventDefault();
      const name = document.getElementById('new-project-name').value.trim();
      const buId = document.getElementById('new-project-bu').value;
      const managerId = document.getElementById('new-project-manager').value;
      
      const memberCheckboxes = document.querySelectorAll('input[name="project-members"]:checked');
      const memberIds = Array.from(memberCheckboxes).map(cb => cb.value);

      if (!name || !buId || !managerId) {
        App.showToast('Please fill all required fields.', 'warning');
        return;
      }

      const btn = document.getElementById('btn-save-project');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

      try {
        const newProject = {
          id: 'prj_' + Date.now().toString(36),
          name: name,
          businessUnitId: buId,
          managerId: managerId,
          memberIds: JSON.stringify(memberIds),
          order: ((State.get().data.projects || []).length + 1)
        };

        await API.saveMasterRecord('projects', newProject);
        document.getElementById('create-project-modal').remove();
        App.showToast('Project created successfully!', 'success');

        // Reload fresh initial data to reflect new project across the app
        await App.loadInitialData(true);
        selectedProjectId = newProject.id;
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Failed to create project', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Project';
      }
    }
  };
})();
