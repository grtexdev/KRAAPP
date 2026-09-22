/**
 * KARYA - Executive Dashboards Component
 * Implements FR-DSH-01 to FR-DSH-07, Section 8.1 (Manpower Cost) & Section 8.2 (5-Bucket Ageing Profile).
 */
const DashboardsComponent = (function () {
  let activeSubTab = 'cost'; // 'cost' | 'status' | 'ageing' | 'scorecard'
  let filterDepartmentId = '';

  return {
    render: function () {
      const currentUser = State.getUser();
      if (!State.canViewDashboards()) {
        return `<div class="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          Dashboard access is restricted to Admin, CEO, HOD and Manager roles.
        </div>`;
      }

      const departments = State.get().data.departments || [];

      return `
        <div class="space-y-6">
          <!-- Top Switcher & Controls -->
          <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex items-center gap-2">
              <button 
                onclick="DashboardsComponent.switchSubTab('cost')" 
                class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSubTab === 'cost' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
              >
                <i class="fa-solid fa-coins mr-1.5"></i> Manpower Cost
              </button>
              <button 
                onclick="DashboardsComponent.switchSubTab('status')" 
                class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSubTab === 'status' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
              >
                <i class="fa-solid fa-chart-pie mr-1.5"></i> Task Status
              </button>
              <button 
                onclick="DashboardsComponent.switchSubTab('ageing')" 
                class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSubTab === 'ageing' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
              >
                <i class="fa-solid fa-hourglass-half mr-1.5"></i> Ageing (90+ Days)
              </button>
              <button 
                onclick="DashboardsComponent.switchSubTab('scorecard')" 
                class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSubTab === 'scorecard' ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
              >
                <i class="fa-solid fa-award mr-1.5"></i> Scorecard
              </button>
            </div>

            <!-- Scoping Department Filter -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500 font-medium">Department Scope:</span>
              <select 
                onchange="DashboardsComponent.setDepartmentFilter(this.value)" 
                class="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2 outline-none"
              >
                <option value="">All Departments</option>
                ${departments.map(d => `<option value="${d.id}" ${d.id === filterDepartmentId ? 'selected' : ''}>${d.name}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Active Dashboard View -->
          <div>
            ${activeSubTab === 'cost' ? this.renderCostDashboard() : ''}
            ${activeSubTab === 'status' ? this.renderStatusDashboard() : ''}
            ${activeSubTab === 'ageing' ? this.renderAgeingDashboard() : ''}
            ${activeSubTab === 'scorecard' ? this.renderScorecardDashboard() : ''}
          </div>
        </div>
      `;
    },

    switchSubTab: function (tab) {
      activeSubTab = tab;
      App.renderCurrentTab();
    },

    setDepartmentFilter: function (deptId) {
      filterDepartmentId = deptId;
      App.renderCurrentTab();
    },

    // 1. Manpower Cost Dashboard (FR-DSH-01, Section 8.1)
    renderCostDashboard: function () {
      let tasks = State.get().data.tasks || [];
      if (filterDepartmentId) tasks = tasks.filter(t => t.departmentId === filterDepartmentId);

      let totalMinutes = 0;
      let totalCost = 0;
      const costByProject = {};
      const costByMainKra = {};

      tasks.forEach(t => {
        const mins = Number(t.timeSpentTotal || 0);
        totalMinutes += mins;

        const assignee = State.getUserById(t.assignedToId);
        const monthlySalary = assignee ? (assignee.salaryMonthly || 0) : 0;
        const dailyRate = monthlySalary / 30; // BRD 8.1 rule
        const taskCost = (mins / 480) * dailyRate; // 480 mins standard working day

        totalCost += taskCost;

        // Project rollup
        const pId = t.projectId || 'unassigned';
        costByProject[pId] = (costByProject[pId] || 0) + taskCost;

        // Main KRA rollup
        const mId = t.mainKraId || 'unassigned';
        costByMainKra[mId] = (costByMainKra[mId] || 0) + taskCost;
      });

      const projects = State.get().data.projects || [];
      const mainKras = State.get().data.mainKras || [];

      return `
        <div class="space-y-6">
          <!-- KPI Summary Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Manpower Cost</span>
              <span class="text-3xl font-extrabold text-emerald-600">₹${Math.round(totalCost).toLocaleString('en-IN')}</span>
              <p class="text-xs text-slate-400 mt-2">Derived from actual recorded effort</p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Effort Logged</span>
              <span class="text-3xl font-extrabold text-blue-600">${Math.round(totalMinutes / 60)} hrs</span>
              <p class="text-xs text-slate-400 mt-2">${totalMinutes.toLocaleString()} recorded minutes</p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Active Projects</span>
              <span class="text-3xl font-extrabold text-indigo-600">${projects.length}</span>
              <p class="text-xs text-slate-400 mt-2">Across entities</p>
            </div>

            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Root KRAs Tracked</span>
              <span class="text-3xl font-extrabold text-purple-600">${mainKras.length}</span>
              <p class="text-xs text-slate-400 mt-2">Group target trees</p>
            </div>
          </div>

          <!-- Visual Cost Bars by Project & Main KRA -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Cost by Project -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 class="text-base font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Cost Attributed by Project</span>
                <span class="text-xs text-slate-400">Section 8.1</span>
              </h3>

              <div class="space-y-3">
                ${projects.map(p => {
                  const pCost = costByProject[p.id] || 0;
                  const pct = totalCost > 0 ? (pCost / totalCost) * 100 : 0;
                  return `
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs font-medium">
                        <span class="text-slate-800">${p.name}</span>
                        <span class="text-slate-900 font-bold">₹${Math.round(pCost).toLocaleString('en-IN')} (${pct.toFixed(1)}%)</span>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${pct}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Cost by Main KRA -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 class="text-base font-bold text-slate-800 flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Cost Attributed by Main KRA</span>
                <span class="text-xs text-slate-400">Target Line</span>
              </h3>

              <div class="space-y-3">
                ${mainKras.map(m => {
                  const mCost = costByMainKra[m.id] || 0;
                  const pct = totalCost > 0 ? (mCost / totalCost) * 100 : 0;
                  return `
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs font-medium">
                        <span class="text-slate-800 truncate max-w-xs">${m.name}</span>
                        <span class="text-slate-900 font-bold">₹${Math.round(mCost).toLocaleString('en-IN')} (${pct.toFixed(1)}%)</span>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div class="bg-indigo-600 h-2 rounded-full" style="width: ${pct}%"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 2. Task Status & 5-Bucket Ageing Profile (FR-DSH-02, Section 8.2)
    renderStatusDashboard: function () {
      let tasks = State.get().data.tasks || [];
      if (filterDepartmentId) tasks = tasks.filter(t => t.departmentId === filterDepartmentId);

      const statusCounts = {
        Pending: tasks.filter(t => t.status === 'Pending').length,
        WIP: tasks.filter(t => t.status === 'WIP').length,
        Completed: tasks.filter(t => t.status === 'Completed').length,
        Hold: tasks.filter(t => t.status === 'Hold').length
      };

      // 5 Ageing Buckets (Section 8.2: 0-7, 8-15, 16-30, 31-90, >90 days) for open work
      const openTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'WIP');
      const today = new Date();

      const buckets = { '0_7': 0, '8_15': 0, '16_30': 0, '31_90': 0, 'over_90': 0 };

      openTasks.forEach(t => {
        const givenDate = new Date(t.dateGiven || t.createdAt || today);
        const ageDays = Math.max(0, Math.floor((today - givenDate) / (1000 * 60 * 60 * 24)));

        if (ageDays <= 7) buckets['0_7']++;
        else if (ageDays <= 15) buckets['8_15']++;
        else if (ageDays <= 30) buckets['16_30']++;
        else if (ageDays <= 90) buckets['31_90']++;
        else buckets['over_90']++;
      });

      return `
        <div class="space-y-6">
          <!-- Status Metric Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
              <span class="text-xs font-bold text-slate-500 uppercase block mb-1">Pending</span>
              <span class="text-3xl font-extrabold text-amber-600">${statusCounts.Pending}</span>
              <p class="text-xs text-slate-400 mt-1">Not yet started</p>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
              <span class="text-xs font-bold text-slate-500 uppercase block mb-1">WIP (In Progress)</span>
              <span class="text-3xl font-extrabold text-blue-600">${statusCounts.WIP}</span>
              <p class="text-xs text-slate-400 mt-1">Active execution</p>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
              <span class="text-xs font-bold text-slate-500 uppercase block mb-1">Completed</span>
              <span class="text-3xl font-extrabold text-emerald-600">${statusCounts.Completed}</span>
              <p class="text-xs text-slate-400 mt-1">Sign-off achieved</p>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-slate-400">
              <span class="text-xs font-bold text-slate-500 uppercase block mb-1">On Hold</span>
              <span class="text-3xl font-extrabold text-slate-600">${statusCounts.Hold}</span>
              <p class="text-xs text-slate-400 mt-1">Paused deliverables</p>
            </div>
          </div>

          <!-- 5-Bucket Ageing Profile (Section 8.2) -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 class="text-base font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Open Work Ageing Profile (${openTasks.length} Open Tasks)</span>
              <span class="text-xs text-slate-400">5 Structured Buckets</span>
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <span class="text-xs font-semibold text-slate-500 block mb-1">0–7 Days</span>
                <span class="text-2xl font-bold text-emerald-600">${buckets['0_7']}</span>
                <span class="text-[10px] text-slate-400 block mt-1">Freshly allotted</span>
              </div>

              <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <span class="text-xs font-semibold text-slate-500 block mb-1">8–15 Days</span>
                <span class="text-2xl font-bold text-blue-600">${buckets['8_15']}</span>
                <span class="text-[10px] text-slate-400 block mt-1">Normal pace</span>
              </div>

              <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <span class="text-xs font-semibold text-slate-500 block mb-1">16–30 Days</span>
                <span class="text-2xl font-bold text-amber-600">${buckets['16_30']}</span>
                <span class="text-[10px] text-slate-400 block mt-1">Attention needed</span>
              </div>

              <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <span class="text-xs font-semibold text-slate-500 block mb-1">31–90 Days</span>
                <span class="text-2xl font-bold text-orange-600">${buckets['31_90']}</span>
                <span class="text-[10px] text-slate-400 block mt-1">Delayed work</span>
              </div>

              <div class="bg-rose-50 rounded-xl p-4 border border-rose-200 text-center">
                <span class="text-xs font-bold text-rose-700 block mb-1">&gt;90 Days (Critical)</span>
                <span class="text-2xl font-extrabold text-rose-700">${buckets['over_90']}</span>
                <span class="text-[10px] text-rose-500 block mt-1">Immediate escalation</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 3. Ageing Escalation Dashboard (>90 Days) (FR-DSH-03)
    renderAgeingDashboard: function () {
      let tasks = State.get().data.tasks || [];
      if (filterDepartmentId) tasks = tasks.filter(t => t.departmentId === filterDepartmentId);

      const today = new Date();
      // Only WIP & Pending tasks older than 90 days
      const agedTasks = tasks.filter(t => {
        if (t.status !== 'Pending' && t.status !== 'WIP') return false;
        const givenDate = new Date(t.dateGiven || t.createdAt || today);
        const ageDays = Math.floor((today - givenDate) / (1000 * 60 * 60 * 24));
        t._ageDays = ageDays;
        return ageDays > 90;
      });

      // Sort by age descending
      agedTasks.sort((a, b) => b._ageDays - a._ageDays);

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-rose-600 flex items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Tasks Older Than 90 Days (Escalation List)</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">WIP and Pending tasks requiring management intervention.</p>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full">
              ${agedTasks.length} Escalated Task(s)
            </span>
          </div>

          ${agedTasks.length === 0 ? `
            <div class="p-8 text-center text-slate-400 text-xs">
              No tasks currently exceeding 90 days of ageing. Excellent!
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th class="p-3">Age</th>
                    <th class="p-3">KRA Path</th>
                    <th class="p-3">Project</th>
                    <th class="p-3">Assignee</th>
                    <th class="p-3">Status</th>
                    <th class="p-3">Date Given</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${agedTasks.map(t => `
                    <tr class="hover:bg-rose-50/40 transition">
                      <td class="p-3 font-bold text-rose-600">${t._ageDays} days</td>
                      <td class="p-3 font-medium text-slate-800">${State.getKraFullPath(t.kraNodeId)}</td>
                      <td class="p-3 text-slate-600">${State.getProjectById(t.projectId)?.name || 'General'}</td>
                      <td class="p-3 font-semibold text-slate-700">${State.getUserById(t.assignedToId)?.name || 'Staff'}</td>
                      <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold badge-${t.status.toLowerCase()}">${t.status}</span></td>
                      <td class="p-3 text-slate-500">${t.dateGiven}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    },

    // 4. Scorecard Dashboard (FR-DSH-04, FR-PRV-01, FR-PRV-02)
    renderScorecardDashboard: function () {
      const users = (State.get().data.users || []).filter(u => u.active);
      const reviews = State.get().data.reviews || [];

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-award text-blue-600"></i>
                <span>Employee Scorecard & Performance Reviews</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Action consistency and periodic 0–5 performance review ratings.</p>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">Employee</th>
                  <th class="p-3">Role / Designation</th>
                  <th class="p-3">Reports To (HOD / Superior)</th>
                  <th class="p-3 text-center">Action Consistency</th>
                  <th class="p-3 text-center">Performance Score (0-5)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${users.map(u => {
                  const superior = State.getUserById(u.reportsToId);
                  const userReview = reviews.filter(r => r.employeeId === u.id).pop(); // latest review

                  return `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="p-3 font-bold text-slate-800">${u.name}</td>
                      <td class="p-3 text-slate-600">${u.designation || u.role.toUpperCase()}</td>
                      <td class="p-3 text-slate-600">${superior ? superior.name : 'Top Level (Board/CEO)'}</td>
                      <td class="p-3 text-center">
                        ${userReview ? `
                          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold ${userReview.consistencyAchieved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                            ${userReview.consistencyAchieved ? 'Achieved' : 'Missed'}
                          </span>
                        ` : `<span class="text-slate-400 italic">Not evaluated</span>`}
                      </td>
                      <td class="p-3 text-center font-bold text-sm text-blue-600">
                        ${userReview ? `⭐ ${userReview.achievedScore || 0} / 5` : `<span class="text-slate-400 font-normal text-xs">—</span>`}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  };
})();
