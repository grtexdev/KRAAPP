/**
 * KARYA - Approval Workflow & Deliverables Inbox Component
 * Implements FR-APR-01 to FR-APR-15 (Inbox, Approver resolution, Drive previews, Rework loop, Activity trail).
 */
const ApprovalsComponent = (function () {
  return {
    render: function () {
      const currentUser = State.getUser();
      if (!currentUser) return `<div class="p-8 text-center text-slate-500">Please sign in to view approvals.</div>`;

      const allTasks = State.get().data.tasks || [];
      const flows = State.get().data.approvalFlows || [];
      const isAdminOrCeo = (currentUser.role === 'admin' || currentUser.role === 'ceo');

      // Filter tasks awaiting approval at the current user's step (FR-APR-08, FR-APR-15)
      const pendingApprovalTasks = allTasks.filter(task => {
        if (!task.approvalFlowId || task.approvalState !== 'pending') return false;

        const flow = flows.find(f => f.id === task.approvalFlowId);
        if (!flow || !flow.steps) return false;

        const currentStepIndex = Number(task.approvalStepIndex || 0);
        const step = flow.steps[currentStepIndex];
        if (!step) return false;

        // Admin & CEO can act on any step
        if (isAdminOrCeo) return true;

        // Named approver
        if (step.approverMode === 'employee' && step.employeeId === currentUser.id) {
          return true;
        }

        // Category-based approver
        if (step.approverMode === 'category' && step.categoryId === currentUser.categoryId) {
          return true;
        }

        return false;
      });

      return `
        <div class="space-y-6">
          <!-- Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-stamp text-blue-600"></i>
                <span>Approvals Inbox</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Review submitted deliverables, approve forward or return for rework.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="px-3 py-1.5 rounded-xl text-xs font-bold ${pendingApprovalTasks.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}">
                ${pendingApprovalTasks.length} Pending Approval(s)
              </span>
            </div>
          </div>

          <!-- Inbox Items -->
          ${pendingApprovalTasks.length === 0 ? `
            <div class="bg-white rounded-2xl p-12 border border-slate-200 text-center">
              <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <i class="fa-solid fa-circle-check text-2xl"></i>
              </div>
              <h3 class="text-base font-bold text-slate-700">All caught up!</h3>
              <p class="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                There are currently no deliverables awaiting your approval.
              </p>
            </div>
          ` : `
            <div class="space-y-4">
              ${pendingApprovalTasks.map(task => this.renderApprovalCard(task)).join('')}
            </div>
          `}
        </div>
      `;
    },

    renderApprovalCard: function (task) {
      const flow = State.getApprovalFlowById(task.approvalFlowId);
      const steps = (flow && flow.steps) ? flow.steps : [];
      const currentStepIndex = Number(task.approvalStepIndex || 0);
      const currentStep = steps[currentStepIndex];

      const assignee = State.getUserById(task.assignedToId);
      const project = State.getProjectById(task.projectId);
      const kraPath = State.getKraFullPath(task.kraNodeId);

      const attachments = (task.attachments && Array.isArray(task.attachments)) ? task.attachments : [];
      const activity = (task.activity && Array.isArray(task.activity)) ? task.activity : [];

      return `
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-blue-300 transition" id="approval-card-${task.id}">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                  ${project ? project.name : 'General Project'}
                </span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs text-slate-500">Submitted by: <strong>${assignee ? assignee.name : 'Unknown'}</strong></span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs text-slate-500">Priority: <strong>${task.priority}</strong></span>
              </div>
              <h3 class="text-base font-bold text-slate-900">${kraPath}</h3>
              ${task.details ? `<p class="text-xs text-slate-600 mt-1">${task.details}</p>` : ''}
            </div>

            <div class="text-right">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                Step ${currentStepIndex + 1} of ${steps.length}: ${currentStep ? currentStep.label : 'Review'}
              </span>
            </div>
          </div>

          <!-- Attached Deliverables (Google Drive Files) -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-paperclip text-blue-500"></i>
              <span>Deliverable Attachments (${attachments.length})</span>
            </h4>

            ${attachments.length === 0 ? `
              <p class="text-xs text-slate-400 italic">No files attached to this deliverable.</p>
            ` : `
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                ${attachments.map(att => `
                  <a 
                    href="${att.url || `https://drive.google.com/file/d/${att.assetId}/view`}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="bg-white hover:bg-blue-50 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2.5 transition text-xs group"
                  >
                    <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <i class="fa-solid fa-file text-sm"></i>
                    </div>
                    <div class="overflow-hidden">
                      <strong class="text-slate-800 group-hover:text-blue-600 truncate block">${att.name}</strong>
                      <span class="text-[10px] text-slate-400">View in Google Drive</span>
                    </div>
                  </a>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Activity Trail Toggle -->
          <div>
            <button 
              type="button" 
              onclick="ApprovalsComponent.toggleActivity('${task.id}')" 
              class="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <i class="fa-solid fa-clock-rotate-left"></i>
              <span>View Full Activity Trail (${activity.length})</span>
            </button>

            <div id="activity-trail-${task.id}" class="hidden mt-3 bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              ${activity.map(act => `
                <div class="flex items-start gap-2.5 text-xs">
                  <div class="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <div class="flex-1">
                    <div class="flex justify-between items-baseline">
                      <strong class="text-slate-800 font-semibold">${State.getUserById(act.byId)?.name || act.byId || 'User'} (${act.type})</strong>
                      <span class="text-[10px] text-slate-400">${new Date(act.at).toLocaleString()}</span>
                    </div>
                    ${act.remarks ? `<p class="text-slate-600 text-xs mt-0.5">${act.remarks}</p>` : ''}
                    ${act.byAdmin ? `<span class="inline-block mt-0.5 text-[10px] text-purple-600 font-semibold">(Actioned by Admin)</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Decision Action Row: Approve vs Send Back For Correction -->
          <div class="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100">
            <button 
              onclick="ApprovalsComponent.openReworkModal('${task.id}')" 
              class="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs px-4 py-2.5 rounded-xl border border-rose-200 transition flex items-center gap-1.5"
            >
              <i class="fa-solid fa-rotate-left"></i>
              <span>Send Back For Correction (Rework)</span>
            </button>

            <button 
              onclick="ApprovalsComponent.handleApprove('${task.id}')" 
              id="btn-approve-${task.id}" 
              class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <i class="fa-solid fa-check"></i>
              <span>Approve & Advance</span>
            </button>
          </div>
        </div>
      `;
    },

    toggleActivity: function (taskId) {
      const el = document.getElementById(`activity-trail-${taskId}`);
      if (el) el.classList.toggle('hidden');
    },

    handleApprove: async function (taskId) {
      const currentUser = State.getUser();
      const isAdminAction = (currentUser.role === 'admin' || currentUser.role === 'ceo');
      const btn = document.getElementById(`btn-approve-${taskId}`);

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Approving...`;
      }

      try {
        await API.actionApproval(taskId, 'approve', currentUser.id, 'Approved deliverable.', isAdminAction);
        App.showToast('Deliverable approved successfully!', 'success');
        await App.loadTasks();
      } catch (err) {
        App.showToast(err.message || 'Approval failed', 'error');
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Approve & Advance</span>`;
        }
      }
    },

    // Rework Modal (Mandatory remarks required per FR-APR-09)
    openReworkModal: function (taskId) {
      const modalHtml = `
        <div id="rework-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <i class="fa-solid fa-rotate-left text-xl"></i>
            </div>
            <h3 class="text-base font-bold text-center text-slate-800">Send Back For Correction</h3>
            <p class="text-xs text-slate-500 text-center mt-1">
              Please state clearly what needs correction. The task will return to the assignee with status WIP.
            </p>

            <div class="mt-4 space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Correction Remarks (Mandatory):</label>
                <textarea id="rework-remarks-input" rows="3" placeholder="Specify changes required in file, concept, format..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required></textarea>
              </div>

              <div class="pt-2 flex gap-2">
                <button onclick="document.getElementById('rework-modal').remove()" class="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold">Cancel</button>
                <button onclick="ApprovalsComponent.executeRework('${taskId}')" id="btn-confirm-rework" class="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-semibold shadow">Confirm Rework</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    executeRework: async function (taskId) {
      const remarks = document.getElementById('rework-remarks-input').value.trim();
      if (!remarks) {
        App.showToast('Written correction remarks are mandatory.', 'warning');
        return;
      }

      const currentUser = State.getUser();
      const isAdminAction = (currentUser.role === 'admin' || currentUser.role === 'ceo');
      const btn = document.getElementById('btn-confirm-rework');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

      try {
        await API.actionApproval(taskId, 'rework', currentUser.id, remarks, isAdminAction);
        document.getElementById('rework-modal').remove();
        App.showToast('Task returned for correction (Rework).', 'info');
        await App.loadTasks();
      } catch (err) {
        App.showToast(err.message || 'Action failed', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Confirm Rework';
      }
    }
  };
})();
