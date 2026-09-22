/**
 * KARYA - 6-Tier Organizational Hierarchy Tree Component
 * Visualizes CEO -> Admin -> HOD -> Manager -> Team Leader -> Employee line-of-sight.
 */
const HierarchyComponent = (function () {
  return {
    render: function () {
      const users = State.get().data.users || [];
      const rootUsers = users.filter(u => !u.reportsToId && u.active);

      return `
        <div class="space-y-6">
          <!-- Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-network-wired text-blue-600"></i>
                <span>6-Tier Organizational Hierarchy</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Full line-of-sight: CEO → Admin → HOD → Manager → Team Leader → Employee.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                ${users.filter(u => u.active).length} Active Members
              </span>
            </div>
          </div>

          <!-- Visual Hierarchy Tree -->
          <div class="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 pb-3 border-b border-slate-100">
              Corporate Reporting Structure
            </h3>

            <div class="space-y-4">
              ${rootUsers.map(root => this.renderHierarchyNode(root, users, 1)).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderHierarchyNode: function (user, allUsers, level) {
      const subordinates = allUsers.filter(u => u.reportsToId === user.id && u.active);
      const roleClass = `badge-role-${user.role}`;

      return `
        <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition space-y-3 ml-${level > 1 ? '6 md:ml-10' : '0'}">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow ${roleClass}">
                ${user.name.charAt(0)}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="text-sm font-bold text-slate-900">${user.name}</h4>
                  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${roleClass}">
                    Level ${level}: ${user.role.toUpperCase()}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">${user.designation || 'Staff'} • ${user.email || 'No email'}</p>
              </div>
            </div>

            <div class="text-right">
              <span class="text-xs text-slate-500 font-medium">
                ${subordinates.length} Direct Report(s)
              </span>
            </div>
          </div>

          <!-- Subordinates / Reporting Line -->
          ${subordinates.length > 0 ? `
            <div class="space-y-3 pt-2 border-t border-slate-200/60">
              ${subordinates.map(sub => this.renderHierarchyNode(sub, allUsers, level + 1)).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
  };
})();
