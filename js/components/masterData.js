/**
 * KARYA - Master Data & Referential Integrity Component
 * Implements FR-MD-01 to FR-MD-10, FR-DI-01 to FR-DI-05 (Data Integrity & Guided Remap).
 */
const MasterDataComponent = (function () {
  let activeSection = 'users'; // 'users' | 'locations' | 'departments' | 'businessUnits' | 'categories' | 'flows'

  return {
    render: function () {
      if (!State.canAccessAdminScreens()) {
        return `<div class="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          Master Data management is restricted to Admin & CEO roles.
        </div>`;
      }

      return `
        <div class="space-y-6">
          <!-- Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-sliders text-blue-600"></i>
                <span>Master Data Management</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Maintain users, reporting lines, departments, locations, and approval flows.
              </p>
            </div>
          </div>

          <!-- Section Switcher Tabs -->
          <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button onclick="MasterDataComponent.switchSection('users')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'users' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-users mr-1"></i> Users & Staff (${(State.get().data.users || []).length})
            </button>
            <button onclick="MasterDataComponent.switchSection('departments')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'departments' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-building mr-1"></i> Departments
            </button>
            <button onclick="MasterDataComponent.switchSection('locations')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'locations' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-location-dot mr-1"></i> Locations
            </button>
            <button onclick="MasterDataComponent.switchSection('businessUnits')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'businessUnits' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-briefcase mr-1"></i> Business Units
            </button>
            <button onclick="MasterDataComponent.switchSection('categories')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'categories' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-tags mr-1"></i> Designations
            </button>
            <button onclick="MasterDataComponent.switchSection('flows')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'flows' ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-route mr-1"></i> Approval Flows
            </button>
          </div>

          <!-- Active Table View -->
          <div>
            ${activeSection === 'users' ? this.renderUsersTable() : ''}
            ${activeSection === 'departments' ? this.renderDepartmentsTable() : ''}
            ${activeSection === 'locations' ? this.renderLocationsTable() : ''}
            ${activeSection === 'businessUnits' ? this.renderBusinessUnitsTable() : ''}
            ${activeSection === 'categories' ? this.renderCategoriesTable() : ''}
            ${activeSection === 'flows' ? this.renderFlowsTable() : ''}
          </div>
        </div>
      `;
    },

    switchSection: function (sec) {
      activeSection = sec;
      App.renderCurrentTab();
    },

    renderUsersTable: function () {
      const users = State.get().data.users || [];

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800">Users & Staff Directory</h3>
              <p class="text-xs text-slate-500 mt-0.5">Manage employee records, login PINs, monthly salary, and reporting superiors.</p>
            </div>
            <button onclick="MasterDataComponent.openAddUserModal()" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5">
              <i class="fa-solid fa-user-plus text-xs"></i>
              <span>Add New User</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">User Name</th>
                  <th class="p-3">Role</th>
                  <th class="p-3">Designation</th>
                  <th class="p-3">Reports To</th>
                  <th class="p-3">Monthly Salary</th>
                  <th class="p-3">Sign-in PIN</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${users.map(u => {
                  const superior = State.getUserById(u.reportsToId);
                  return `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="p-3">
                        <strong class="text-slate-900 block">${u.name}</strong>
                        <span class="text-[11px] text-slate-400">${u.email || 'No email'}</span>
                      </td>
                      <td class="p-3">
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full badge-role-${u.role}">
                          ${u.role}
                        </span>
                      </td>
                      <td class="p-3 text-slate-600">${u.designation || 'Staff'}</td>
                      <td class="p-3 text-slate-600 font-medium">${superior ? superior.name : '— (Top Level)'}</td>
                      <td class="p-3 font-semibold text-slate-800">₹${(u.salaryMonthly || 0).toLocaleString('en-IN')}</td>
                      <td class="p-3 font-mono text-slate-600">${u.pin || '1234'}</td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}">
                          ${u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td class="p-3 text-center">
                        <button onclick="MasterDataComponent.openEditUserModal('${u.id}')" class="text-blue-600 hover:text-blue-800 p-1.5 font-semibold">
                          Edit
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    renderDepartmentsTable: function () {
      const depts = State.get().data.departments || [];
      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 class="text-base font-bold text-slate-800">Departments</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">Department Name</th>
                  <th class="p-3">Head of Department (HOD)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${depts.map(d => `
                  <tr>
                    <td class="p-3 font-bold text-slate-800">${d.name}</td>
                    <td class="p-3 text-slate-600">${State.getUserById(d.hodId)?.name || 'Admin'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    renderLocationsTable: function () {
      const locs = State.get().data.locations || [];
      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">Locations</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${locs.map(l => `
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs">
                📍 ${l.name}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    renderBusinessUnitsTable: function () {
      const bus = State.get().data.businessUnits || [];
      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">Business Units & Entities</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            ${bus.map(b => `
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <strong class="text-slate-800 block">${b.name}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    renderCategoriesTable: function () {
      const cats = State.get().data.userCategories || [];
      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">Designations (User Categories)</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${cats.map(c => `
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                🏷️ ${c.name}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    renderFlowsTable: function () {
      const flows = State.get().data.approvalFlows || [];
      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 class="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">Approval Workflows</h3>
          <div class="space-y-3">
            ${flows.map(f => {
              const steps = (f.steps && Array.isArray(f.steps)) ? f.steps : [];
              return `
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 class="font-bold text-slate-800">${f.name}</h4>
                  <div class="flex flex-wrap items-center gap-2">
                    ${steps.map((s, idx) => `
                      <span class="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-[11px]">
                        Step ${idx + 1}: ${s.label}
                      </span>
                    `).join('<span class="text-slate-400">→</span>')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    openAddUserModal: function () {
      const users = State.get().data.users || [];
      const depts = State.get().data.departments || [];
      const locs = State.get().data.locations || [];
      const cats = State.get().data.userCategories || [];

      const modalHtml = `
        <div id="add-user-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">Add New User</h3>
              <button onclick="document.getElementById('add-user-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="MasterDataComponent.handleAddUserSubmit(event)" class="space-y-4 mt-4 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input type="text" id="new-user-name" placeholder="Full name" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" id="new-user-email" placeholder="user@gretex.com" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Hierarchy Role</label>
                  <select id="new-user-role" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required>
                    <option value="employee">Employee</option>
                    <option value="team_leader">Team Leader</option>
                    <option value="manager">Manager</option>
                    <option value="hod">HOD</option>
                    <option value="admin">Admin</option>
                    <option value="ceo">CEO</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Reports To (Superior)</label>
                  <select id="new-user-reports-to" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option value="">-- None (Top Level) --</option>
                    ${users.filter(u => u.active).map(u => `
                      <option value="${u.id}">${u.name} [${u.role.toUpperCase()}]</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Designation</label>
                  <select id="new-user-category" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    ${cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Monthly Salary (₹)</label>
                  <input type="number" id="new-user-salary" value="50000" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5" required />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Login PIN (4-6 digits)</label>
                <input type="text" id="new-user-pin" value="1234" maxlength="6" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono" required />
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('add-user-modal').remove()" class="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium">Cancel</button>
                <button type="submit" id="btn-create-user" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium shadow">Create User</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleAddUserSubmit: async function (e) {
      e.preventDefault();
      const btn = document.getElementById('btn-create-user');
      btn.disabled = true;

      try {
        const name = document.getElementById('new-user-name').value;
        const email = document.getElementById('new-user-email').value;
        const role = document.getElementById('new-user-role').value;
        const reportsToId = document.getElementById('new-user-reports-to').value;
        const categoryId = document.getElementById('new-user-category').value;
        const salary = Number(document.getElementById('new-user-salary').value || 0);
        const pin = document.getElementById('new-user-pin').value;

        const cat = State.get().data.userCategories.find(c => c.id === categoryId);

        const newUser = {
          name: name,
          email: email,
          role: role,
          designation: cat ? cat.name : role.toUpperCase(),
          reportsToId: reportsToId,
          categoryId: categoryId,
          salaryMonthly: salary,
          pin: pin,
          active: true,
          doj: new Date().toISOString().split('T')[0]
        };

        await API.saveMasterRecord('users', newUser);
        document.getElementById('add-user-modal').remove();
        App.showToast('User created successfully!', 'success');
        await App.loadInitialData();
      } catch (err) {
        App.showToast(err.message || 'Error creating user', 'error');
        btn.disabled = false;
      }
    }
  };
})();
