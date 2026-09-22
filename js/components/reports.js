/**
 * KARYA - Reports & Organization Activity Feed Component
 * Implements FR-REP-01 to FR-REP-03.
 */
const ReportsComponent = (function () {
  let activeReportSubTab = 'stats'; // 'stats' | 'feed'
  let feedFilterUser = '';
  let feedFilterType = '';

  return {
    render: function () {
      if (!State.canViewDashboards()) {
        return `<div class="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          Reports access is restricted to Admin, CEO, HOD, and Managers.
        </div>`;
      }

      return `
        <div class="space-y-6">
          <!-- Top Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-chart-line text-blue-600"></i>
                <span>Reports & Activity Feed</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Staff execution metrics, rework counts, and organisation-wide audit feed.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button 
                onclick="ReportsComponent.switchReportTab('stats')" 
                class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeReportSubTab === 'stats' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
              >
                <i class="fa-solid fa-users-viewfinder mr-1.5"></i> Employee Statistics
              </button>
              <button 
                onclick="ReportsComponent.switchReportTab('feed')" 
                class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeReportSubTab === 'feed' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
              >
                <i class="fa-solid fa-clock-rotate-left mr-1.5"></i> Activity Feed
              </button>
            </div>
          </div>

          <!-- Active View -->
          <div>
            ${activeReportSubTab === 'stats' ? this.renderEmployeeStats() : this.renderActivityFeed()}
          </div>
        </div>
      `;
    },

    switchReportTab: function (tab) {
      activeReportSubTab = tab;
      App.renderCurrentTab();
    },

    renderEmployeeStats: function () {
      const users = (State.get().data.users || []).filter(u => u.active);
      const tasks = State.get().data.tasks || [];

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
            Per-Employee Performance & Cost Breakdown
          </h3>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">Employee</th>
                  <th class="p-3">Role</th>
                  <th class="p-3 text-center">Assigned</th>
                  <th class="p-3 text-center">Completed</th>
                  <th class="p-3 text-center">WIP</th>
                  <th class="p-3 text-center">Rework Cycles</th>
                  <th class="p-3 text-center">Effort (Hrs)</th>
                  <th class="p-3 text-right">Manpower Cost</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${users.map(u => {
                  const empTasks = tasks.filter(t => t.assignedToId === u.id);
                  const completed = empTasks.filter(t => t.status === 'Completed').length;
                  const wip = empTasks.filter(t => t.status === 'WIP').length;
                  
                  let reworkCount = 0;
                  let totalMins = 0;
                  empTasks.forEach(t => {
                    totalMins += Number(t.timeSpentTotal || 0);
                    const acts = (t.activity && Array.isArray(t.activity)) ? t.activity : [];
                    reworkCount += acts.filter(a => a.type === 'rework').length;
                  });

                  const monthlySalary = u.salaryMonthly || 0;
                  const dailyRate = monthlySalary / 30;
                  const cost = (totalMins / 480) * dailyRate;

                  return `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="p-3 font-bold text-slate-800">${u.name}</td>
                      <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase badge-role-${u.role}">${u.role}</span></td>
                      <td class="p-3 text-center font-bold text-slate-700">${empTasks.length}</td>
                      <td class="p-3 text-center font-bold text-emerald-600">${completed}</td>
                      <td class="p-3 text-center font-bold text-blue-600">${wip}</td>
                      <td class="p-3 text-center font-bold ${reworkCount > 0 ? 'text-rose-600' : 'text-slate-400'}">${reworkCount}</td>
                      <td class="p-3 text-center font-semibold text-slate-700">${(totalMins / 60).toFixed(1)}h</td>
                      <td class="p-3 text-right font-bold text-emerald-700">₹${Math.round(cost).toLocaleString('en-IN')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    renderActivityFeed: function () {
      const tasks = State.get().data.tasks || [];
      const users = State.get().data.users || [];

      // Collate all activity entries
      const allActivities = [];
      tasks.forEach(t => {
        const acts = (t.activity && Array.isArray(t.activity)) ? t.activity : [];
        acts.forEach(a => {
          allActivities.push({
            ...a,
            task: t,
            timestamp: new Date(a.at || t.createdAt || new Date()).getTime()
          });
        });
      });

      // Sort newest first
      allActivities.sort((a, b) => b.timestamp - a.timestamp);

      // Filters
      let filtered = allActivities;
      if (feedFilterUser) filtered = filtered.filter(a => a.byId === feedFilterUser);
      if (feedFilterType) filtered = filtered.filter(a => a.type === feedFilterType);

      // Render up to 300 entries as per NFR-08
      const displayActivities = filtered.slice(0, 300);

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <!-- Feed Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div class="flex flex-wrap items-center gap-3">
              <select onchange="ReportsComponent.filterFeedUser(this.value)" class="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2">
                <option value="">All Actors</option>
                ${users.map(u => `<option value="${u.id}" ${feedFilterUser === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
              </select>

              <select onchange="ReportsComponent.filterFeedType(this.value)" class="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-2">
                <option value="">All Actions</option>
                <option value="submitted" ${feedFilterType === 'submitted' ? 'selected' : ''}>Deliverables Submitted</option>
                <option value="approved" ${feedFilterType === 'approved' ? 'selected' : ''}>Approvals Actioned</option>
                <option value="rework" ${feedFilterType === 'rework' ? 'selected' : ''}>Rework Sent Back</option>
                <option value="status" ${feedFilterType === 'status' ? 'selected' : ''}>Status Changes</option>
                <option value="reassigned" ${feedFilterType === 'reassigned' ? 'selected' : ''}>Reassignments</option>
              </select>
            </div>

            <span class="text-xs text-slate-400">
              Showing recent ${displayActivities.length} of ${allActivities.length} entries
            </span>
          </div>

          <!-- Feed Items -->
          <div class="divide-y divide-slate-100">
            ${displayActivities.length === 0 ? `
              <div class="p-8 text-center text-slate-400 text-xs">No activity logged yet.</div>
            ` : displayActivities.map(act => {
              const actor = State.getUserById(act.byId);
              const kraPath = State.getKraFullPath(act.task?.kraNodeId);

              let icon = 'fa-solid fa-comment';
              let badgeColor = 'bg-slate-100 text-slate-700';
              if (act.type === 'submitted') { icon = 'fa-solid fa-cloud-arrow-up'; badgeColor = 'bg-blue-100 text-blue-800'; }
              else if (act.type === 'approved') { icon = 'fa-solid fa-check'; badgeColor = 'bg-emerald-100 text-emerald-800'; }
              else if (act.type === 'rework') { icon = 'fa-solid fa-rotate-left'; badgeColor = 'bg-rose-100 text-rose-800'; }
              else if (act.type === 'reassigned') { icon = 'fa-solid fa-share-nodes'; badgeColor = 'bg-purple-100 text-purple-800'; }

              return `
                <div class="py-3 flex items-start gap-3 text-xs hover:bg-slate-50/60 transition px-2 rounded-xl">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${badgeColor}">
                    <i class="${icon} text-xs"></i>
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-start">
                      <div>
                        <strong class="text-slate-900 font-bold">${actor ? actor.name : 'System'}</strong>
                        <span class="text-slate-500 font-medium"> • ${act.type.toUpperCase()}</span>
                      </div>
                      <span class="text-[10px] text-slate-400">${new Date(act.at).toLocaleString()}</span>
                    </div>
                    <p class="text-slate-700 font-semibold mt-0.5 text-xs">${kraPath}</p>
                    ${act.remarks ? `<p class="text-slate-600 mt-1 italic">"${act.remarks}"</p>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    filterFeedUser: function (userId) {
      feedFilterUser = userId;
      App.renderCurrentTab();
    },

    filterFeedType: function (type) {
      feedFilterType = type;
      App.renderCurrentTab();
    }
  };
})();
