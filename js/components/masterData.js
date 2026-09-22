/**
 * KARYA - Master Data & Referential Integrity Component
 * Complete management for Users, Departments, Locations, Business Units, and Designations.
 * Features: Single Record Creation, Edit, Active/Inactive Toggle, and Bulk CSV Import with Templates.
 */
const MasterDataComponent = (function () {
  let activeSection = 'departments'; // default to departments as requested by user
  let searchQueries = {
    users: '',
    departments: '',
    locations: '',
    businessUnits: '',
    categories: ''
  };
  let statusFilters = {
    users: 'all',        // 'all' | 'active' | 'inactive'
    departments: 'all',
    locations: 'all',
    businessUnits: 'all',
    categories: 'all'
  };

  // Helper to check if a record is active
  function isRecordActive(rec) {
    if (!rec) return false;
    if (rec.active === false || rec.active === 'false' || rec.active === 0 || rec.active === '0') return false;
    return true;
  }

  return {
    render: function () {
      if (!State.canAccessAdminScreens()) {
        return `
          <div class="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            Master Data management is restricted to Admin & CEO roles.
          </div>
        `;
      }

      const users = State.get().data.users || [];
      const depts = State.get().data.departments || [];
      const locs = State.get().data.locations || [];
      const bus = State.get().data.businessUnits || [];
      const cats = State.get().data.userCategories || [];
      const flows = State.get().data.approvalFlows || [];

      return `
        <div class="space-y-6">
          <!-- Page Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-sliders text-blue-600"></i>
                <span>Master Data Management</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Maintain and import organizational entities, branches, departments, and active statuses.
              </p>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <i class="fa-solid fa-shield-halved mr-1"></i> Admin & CEO Mode
              </span>
            </div>
          </div>

          <!-- Section Switcher Tabs with Counts -->
          <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button onclick="MasterDataComponent.switchSection('departments')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'departments' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-building mr-1.5"></i> Departments (${depts.length})
            </button>
            <button onclick="MasterDataComponent.switchSection('locations')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'locations' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-location-dot mr-1.5"></i> Locations (${locs.length})
            </button>
            <button onclick="MasterDataComponent.switchSection('businessUnits')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'businessUnits' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-briefcase mr-1.5"></i> Business Units (${bus.length})
            </button>
            <button onclick="MasterDataComponent.switchSection('categories')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'categories' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-tags mr-1.5"></i> Designations (${cats.length})
            </button>
            <button onclick="MasterDataComponent.switchSection('users')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'users' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-users mr-1.5"></i> Users & Staff (${users.length})
            </button>
            <button onclick="MasterDataComponent.switchSection('flows')" class="px-4 py-2 rounded-xl text-xs font-bold transition ${activeSection === 'flows' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
              <i class="fa-solid fa-route mr-1.5"></i> Approval Flows (${flows.length})
            </button>
          </div>

          <!-- Active Table View -->
          <div>
            ${activeSection === 'departments' ? this.renderDepartmentsTable() : ''}
            ${activeSection === 'locations' ? this.renderLocationsTable() : ''}
            ${activeSection === 'businessUnits' ? this.renderBusinessUnitsTable() : ''}
            ${activeSection === 'categories' ? this.renderCategoriesTable() : ''}
            ${activeSection === 'users' ? this.renderUsersTable() : ''}
            ${activeSection === 'flows' ? this.renderFlowsTable() : ''}
          </div>
        </div>
      `;
    },

    switchSection: function (sec) {
      activeSection = sec;
      App.renderCurrentTab();
    },

    setSearchQuery: function (sec, val) {
      searchQueries[sec] = (val || '').toLowerCase().trim();
      App.renderCurrentTab();
    },

    setStatusFilter: function (sec, val) {
      statusFilters[sec] = val;
      App.renderCurrentTab();
    },

    // =========================================================================
    // 1. DEPARTMENTS TABLE
    // =========================================================================
    renderDepartmentsTable: function () {
      let depts = State.get().data.departments || [];
      const query = searchQueries.departments || '';
      const filter = statusFilters.departments || 'all';

      if (filter === 'active') depts = depts.filter(d => isRecordActive(d));
      if (filter === 'inactive') depts = depts.filter(d => !isRecordActive(d));
      if (query) {
        depts = depts.filter(d => {
          const nameMatch = (d.name || '').toLowerCase().includes(query);
          const hodName = (State.getUserById(d.hodId)?.name || '').toLowerCase();
          return nameMatch || hodName.includes(query);
        });
      }

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <!-- Toolbar Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-building text-blue-600"></i>
                <span>Departments Directory</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Manage operational departments, assign Head of Department (HOD), and set active status.</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button 
                onclick="MasterDataComponent.openImportModal('departments')" 
                class="btn btn-secondary btn-sm flex items-center gap-1.5"
                title="Import Departments via CSV"
              >
                <i class="fa-solid fa-file-csv text-emerald-600"></i>
                <span>Import CSV</span>
              </button>
              <button 
                onclick="MasterDataComponent.openAddDepartmentModal()" 
                class="btn btn-primary btn-sm flex items-center gap-1.5 shadow"
              >
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Add Department</span>
              </button>
            </div>
          </div>

          <!-- Search and Filter Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div class="relative flex-1 max-w-sm">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search departments or HOD..." 
                value="${searchQueries.departments || ''}" 
                oninput="MasterDataComponent.setSearchQuery('departments', this.value)"
                class="form-input pl-8 py-1.5 text-xs"
              />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500">Status:</span>
              <div class="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs">
                <button onclick="MasterDataComponent.setStatusFilter('departments', 'all')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'}">All</button>
                <button onclick="MasterDataComponent.setStatusFilter('departments', 'active')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Active</button>
                <button onclick="MasterDataComponent.setStatusFilter('departments', 'inactive')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'inactive' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Inactive</button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">Department Name</th>
                  <th class="p-3">Head of Department (HOD)</th>
                  <th class="p-3">Sort Order</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${depts.length === 0 ? `
                  <tr><td colspan="5" class="p-8 text-center text-slate-400">No departments found matching your criteria.</td></tr>
                ` : depts.map(d => {
                  const active = isRecordActive(d);
                  const hod = State.getUserById(d.hodId);
                  return `
                    <tr class="hover:bg-slate-50 transition ${!active ? 'opacity-60 bg-slate-50/50' : ''}">
                      <td class="p-3">
                        <strong class="text-slate-900 block font-semibold">${d.name}</strong>
                        <span class="text-[10px] text-slate-400 font-mono">${d.id}</span>
                      </td>
                      <td class="p-3 text-slate-700">
                        ${hod ? `
                          <div class="flex items-center gap-1.5">
                            <span class="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                              ${hod.name.charAt(0)}
                            </span>
                            <span class="font-medium">${hod.name}</span>
                          </div>
                        ` : '<span class="text-slate-400">— Not Assigned</span>'}
                      </td>
                      <td class="p-3 text-slate-600 font-medium">${d.order || 1}</td>
                      <td class="p-3">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                          ${active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button 
                            onclick="MasterDataComponent.openEditDepartmentModal('${d.id}')" 
                            class="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition" 
                            title="Edit Department"
                          >
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.toggleRecordStatus('departments', '${d.id}')" 
                            class="p-1.5 ${active ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'} rounded transition" 
                            title="${active ? 'Deactivate Department' : 'Activate Department'}"
                          >
                            <i class="fa-solid ${active ? 'fa-ban' : 'fa-check'}"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.confirmDeleteRecord('departments', '${d.id}', '${d.name}')" 
                            class="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition" 
                            title="Delete Department"
                          >
                            <i class="fa-solid fa-trash"></i>
                          </button>
                        </div>
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

    // =========================================================================
    // 2. LOCATIONS TABLE
    // =========================================================================
    renderLocationsTable: function () {
      let locs = State.get().data.locations || [];
      const query = searchQueries.locations || '';
      const filter = statusFilters.locations || 'all';

      if (filter === 'active') locs = locs.filter(l => isRecordActive(l));
      if (filter === 'inactive') locs = locs.filter(l => !isRecordActive(l));
      if (query) {
        locs = locs.filter(l => (l.name || '').toLowerCase().includes(query));
      }

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <!-- Toolbar Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-location-dot text-blue-600"></i>
                <span>Branch & Office Locations</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Manage geographical offices, branch cities, and active presence.</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button 
                onclick="MasterDataComponent.openImportModal('locations')" 
                class="btn btn-secondary btn-sm flex items-center gap-1.5"
                title="Import Locations via CSV"
              >
                <i class="fa-solid fa-file-csv text-emerald-600"></i>
                <span>Import CSV</span>
              </button>
              <button 
                onclick="MasterDataComponent.openAddLocationModal()" 
                class="btn btn-primary btn-sm flex items-center gap-1.5 shadow"
              >
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Add Location</span>
              </button>
            </div>
          </div>

          <!-- Search and Filter Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div class="relative flex-1 max-w-sm">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search locations..." 
                value="${searchQueries.locations || ''}" 
                oninput="MasterDataComponent.setSearchQuery('locations', this.value)"
                class="form-input pl-8 py-1.5 text-xs"
              />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500">Status:</span>
              <div class="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs">
                <button onclick="MasterDataComponent.setStatusFilter('locations', 'all')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'}">All</button>
                <button onclick="MasterDataComponent.setStatusFilter('locations', 'active')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Active</button>
                <button onclick="MasterDataComponent.setStatusFilter('locations', 'inactive')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'inactive' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Inactive</button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">Location Name</th>
                  <th class="p-3">Sort Order</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${locs.length === 0 ? `
                  <tr><td colspan="4" class="p-8 text-center text-slate-400">No locations found.</td></tr>
                ` : locs.map(l => {
                  const active = isRecordActive(l);
                  return `
                    <tr class="hover:bg-slate-50 transition ${!active ? 'opacity-60 bg-slate-50/50' : ''}">
                      <td class="p-3">
                        <span class="font-bold text-slate-900 block flex items-center gap-1.5">
                          <span>📍</span> ${l.name}
                        </span>
                        <span class="text-[10px] text-slate-400 font-mono">${l.id}</span>
                      </td>
                      <td class="p-3 text-slate-600 font-medium">${l.order || 1}</td>
                      <td class="p-3">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                          ${active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button 
                            onclick="MasterDataComponent.openEditLocationModal('${l.id}')" 
                            class="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition" 
                            title="Edit Location"
                          >
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.toggleRecordStatus('locations', '${l.id}')" 
                            class="p-1.5 ${active ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'} rounded transition" 
                            title="${active ? 'Deactivate' : 'Activate'}"
                          >
                            <i class="fa-solid ${active ? 'fa-ban' : 'fa-check'}"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.confirmDeleteRecord('locations', '${l.id}', '${l.name}')" 
                            class="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition" 
                            title="Delete Location"
                          >
                            <i class="fa-solid fa-trash"></i>
                          </button>
                        </div>
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

    // =========================================================================
    // 3. BUSINESS UNITS TABLE
    // =========================================================================
    renderBusinessUnitsTable: function () {
      let bus = State.get().data.businessUnits || [];
      const query = searchQueries.businessUnits || '';
      const filter = statusFilters.businessUnits || 'all';

      if (filter === 'active') bus = bus.filter(b => isRecordActive(b));
      if (filter === 'inactive') bus = bus.filter(b => !isRecordActive(b));
      if (query) {
        bus = bus.filter(b => (b.name || '').toLowerCase().includes(query));
      }

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <!-- Toolbar Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-briefcase text-blue-600"></i>
                <span>Business Units & Subsidiaries</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Corporate legal entities (GIL, GCS, GSB, Platinumone, Bahutex).</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button 
                onclick="MasterDataComponent.openImportModal('businessUnits')" 
                class="btn btn-secondary btn-sm flex items-center gap-1.5"
                title="Import Business Units via CSV"
              >
                <i class="fa-solid fa-file-csv text-emerald-600"></i>
                <span>Import CSV</span>
              </button>
              <button 
                onclick="MasterDataComponent.openAddBusinessUnitModal()" 
                class="btn btn-primary btn-sm flex items-center gap-1.5 shadow"
              >
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Add Business Unit</span>
              </button>
            </div>
          </div>

          <!-- Search and Filter Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div class="relative flex-1 max-w-sm">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search business units..." 
                value="${searchQueries.businessUnits || ''}" 
                oninput="MasterDataComponent.setSearchQuery('businessUnits', this.value)"
                class="form-input pl-8 py-1.5 text-xs"
              />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500">Status:</span>
              <div class="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs">
                <button onclick="MasterDataComponent.setStatusFilter('businessUnits', 'all')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'}">All</button>
                <button onclick="MasterDataComponent.setStatusFilter('businessUnits', 'active')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Active</button>
                <button onclick="MasterDataComponent.setStatusFilter('businessUnits', 'inactive')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'inactive' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Inactive</button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">Business Unit / Entity</th>
                  <th class="p-3">Sort Order</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${bus.length === 0 ? `
                  <tr><td colspan="4" class="p-8 text-center text-slate-400">No business units found.</td></tr>
                ` : bus.map(b => {
                  const active = isRecordActive(b);
                  return `
                    <tr class="hover:bg-slate-50 transition ${!active ? 'opacity-60 bg-slate-50/50' : ''}">
                      <td class="p-3">
                        <strong class="font-bold text-slate-900 block">${b.name}</strong>
                        <span class="text-[10px] text-slate-400 font-mono">${b.id}</span>
                      </td>
                      <td class="p-3 text-slate-600 font-medium">${b.order || 1}</td>
                      <td class="p-3">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                          ${active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button 
                            onclick="MasterDataComponent.openEditBusinessUnitModal('${b.id}')" 
                            class="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition" 
                            title="Edit Business Unit"
                          >
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.toggleRecordStatus('businessUnits', '${b.id}')" 
                            class="p-1.5 ${active ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'} rounded transition" 
                            title="${active ? 'Deactivate' : 'Activate'}"
                          >
                            <i class="fa-solid ${active ? 'fa-ban' : 'fa-check'}"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.confirmDeleteRecord('businessUnits', '${b.id}', '${b.name}')" 
                            class="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition" 
                            title="Delete Business Unit"
                          >
                            <i class="fa-solid fa-trash"></i>
                          </button>
                        </div>
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

    // =========================================================================
    // 4. DESIGNATIONS (USER CATEGORIES) TABLE
    // =========================================================================
    renderCategoriesTable: function () {
      let cats = State.get().data.userCategories || [];
      const query = searchQueries.categories || '';
      const filter = statusFilters.categories || 'all';

      if (filter === 'active') cats = cats.filter(c => isRecordActive(c));
      if (filter === 'inactive') cats = cats.filter(c => !isRecordActive(c));
      if (query) {
        cats = cats.filter(c => (c.name || '').toLowerCase().includes(query));
      }

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <!-- Toolbar Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-tags text-blue-600"></i>
                <span>Designations & Functional Categories</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Used to resolve approvers by category (e.g. Brand Manager, Graphic Designer).</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button 
                onclick="MasterDataComponent.openImportModal('categories')" 
                class="btn btn-secondary btn-sm flex items-center gap-1.5"
                title="Import Designations via CSV"
              >
                <i class="fa-solid fa-file-csv text-emerald-600"></i>
                <span>Import CSV</span>
              </button>
              <button 
                onclick="MasterDataComponent.openAddCategoryModal()" 
                class="btn btn-primary btn-sm flex items-center gap-1.5 shadow"
              >
                <i class="fa-solid fa-plus text-xs"></i>
                <span>Add Designation</span>
              </button>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th class="p-3">Designation / Category</th>
                  <th class="p-3">Sort Order</th>
                  <th class="p-3">Status</th>
                  <th class="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${cats.length === 0 ? `
                  <tr><td colspan="4" class="p-8 text-center text-slate-400">No designations found.</td></tr>
                ` : cats.map(c => {
                  const active = isRecordActive(c);
                  return `
                    <tr class="hover:bg-slate-50 transition ${!active ? 'opacity-60 bg-slate-50/50' : ''}">
                      <td class="p-3">
                        <strong class="font-bold text-slate-900 block">🏷️ ${c.name}</strong>
                        <span class="text-[10px] text-slate-400 font-mono">${c.id}</span>
                      </td>
                      <td class="p-3 text-slate-600 font-medium">${c.order || 1}</td>
                      <td class="p-3">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                          ${active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button 
                            onclick="MasterDataComponent.openEditCategoryModal('${c.id}')" 
                            class="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition" 
                            title="Edit Designation"
                          >
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.toggleRecordStatus('userCategories', '${c.id}')" 
                            class="p-1.5 ${active ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'} rounded transition" 
                            title="${active ? 'Deactivate' : 'Activate'}"
                          >
                            <i class="fa-solid ${active ? 'fa-ban' : 'fa-check'}"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.confirmDeleteRecord('userCategories', '${c.id}', '${c.name}')" 
                            class="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition" 
                            title="Delete Designation"
                          >
                            <i class="fa-solid fa-trash"></i>
                          </button>
                        </div>
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

    // =========================================================================
    // 5. USERS & STAFF DIRECTORY
    // =========================================================================
    renderUsersTable: function () {
      let users = State.get().data.users || [];
      const query = searchQueries.users || '';
      const filter = statusFilters.users || 'all';

      if (filter === 'active') users = users.filter(u => isRecordActive(u));
      if (filter === 'inactive') users = users.filter(u => !isRecordActive(u));
      if (query) {
        users = users.filter(u => {
          return (u.name || '').toLowerCase().includes(query) ||
                 (u.email || '').toLowerCase().includes(query) ||
                 (u.role || '').toLowerCase().includes(query);
        });
      }

      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-users text-blue-600"></i>
                <span>Users & Staff Directory</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Manage employee records, login PINs, monthly salary, and reporting superiors.</p>
            </div>
            <button onclick="MasterDataComponent.openAddUserModal()" class="btn btn-primary btn-sm flex items-center gap-1.5 shadow">
              <i class="fa-solid fa-user-plus text-xs"></i>
              <span>Add New User</span>
            </button>
          </div>

          <!-- Search and Filter Bar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div class="relative flex-1 max-w-sm">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search staff name, email, or role..." 
                value="${searchQueries.users || ''}" 
                oninput="MasterDataComponent.setSearchQuery('users', this.value)"
                class="form-input pl-8 py-1.5 text-xs"
              />
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-500">Status:</span>
              <div class="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 text-xs">
                <button onclick="MasterDataComponent.setStatusFilter('users', 'all')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'}">All</button>
                <button onclick="MasterDataComponent.setStatusFilter('users', 'active')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Active</button>
                <button onclick="MasterDataComponent.setStatusFilter('users', 'inactive')" class="px-2.5 py-1 rounded-md font-medium ${filter === 'inactive' ? 'bg-slate-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Inactive</button>
              </div>
            </div>
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
                  const active = isRecordActive(u);
                  return `
                    <tr class="hover:bg-slate-50 transition ${!active ? 'opacity-60 bg-slate-50/50' : ''}">
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
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                          ${active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button 
                            onclick="MasterDataComponent.openEditUserModal('${u.id}')" 
                            class="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition" 
                            title="Edit User"
                          >
                            <i class="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onclick="MasterDataComponent.toggleRecordStatus('users', '${u.id}')" 
                            class="p-1.5 ${active ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'} rounded transition" 
                            title="${active ? 'Deactivate User' : 'Activate User'}"
                          >
                            <i class="fa-solid ${active ? 'fa-ban' : 'fa-check'}"></i>
                          </button>
                        </div>
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

    // =========================================================================
    // 6. APPROVAL FLOWS TABLE
    // =========================================================================
    renderFlowsTable: function () {
      const flows = State.get().data.approvalFlows || [];
      return `
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-route text-blue-600"></i>
                <span>Approval Workflows</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">Configured sequential chains through which task deliverables pass.</p>
            </div>
          </div>
          <div class="space-y-3">
            ${flows.map(f => {
              const steps = (f.steps && Array.isArray(f.steps)) ? f.steps : [];
              return `
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <h4 class="font-bold text-slate-800">${f.name}</h4>
                    <span class="text-[10px] text-slate-400 font-mono">${f.id}</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 pt-1">
                    ${steps.map((s, idx) => `
                      <span class="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-semibold text-[11px] flex items-center gap-1">
                        <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">${idx + 1}</span>
                        <span>${s.label || s.approverMode}</span>
                      </span>
                    `).join('<i class="fa-solid fa-arrow-right text-slate-300 text-xs"></i>')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    // =========================================================================
    // GENERIC TOGGLE ACTIVE / INACTIVE HANDLER
    // =========================================================================
    toggleRecordStatus: async function (tableName, id) {
      let list = [];
      let tableApiName = tableName;

      if (tableName === 'departments') list = State.get().data.departments || [];
      else if (tableName === 'locations') list = State.get().data.locations || [];
      else if (tableName === 'businessUnits') list = State.get().data.businessUnits || [];
      else if (tableName === 'userCategories') list = State.get().data.userCategories || [];
      else if (tableName === 'users') list = State.get().data.users || [];

      const record = list.find(r => r.id === id);
      if (!record) {
        App.showToast('Record not found', 'error');
        return;
      }

      const currentStatus = isRecordActive(record);
      const newStatus = !currentStatus;
      const updatedRecord = { ...record, active: newStatus };

      try {
        await API.saveMasterRecord(tableApiName, updatedRecord);
        App.showToast(`Status updated: ${record.name || record.id} is now ${newStatus ? 'Active' : 'Inactive'}!`, 'success');
        await App.loadInitialData(true);
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Failed to update status', 'error');
      }
    },

    // =========================================================================
    // GENERIC DELETE RECORD CONFIRMATION
    // =========================================================================
    confirmDeleteRecord: function (tableName, id, name) {
      if (confirm(`Are you sure you want to permanently delete "${name}"?\n\nTip: You can also deactivate it instead of deleting.`)) {
        this.executeDeleteRecord(tableName, id);
      }
    },

    executeDeleteRecord: async function (tableName, id) {
      try {
        await API.deleteMasterRecord(tableName, id);
        App.showToast('Record deleted successfully!', 'success');
        await App.loadInitialData(true);
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Failed to delete record', 'error');
      }
    },

    // =========================================================================
    // MODALS: ADD & EDIT DEPARTMENTS
    // =========================================================================
    openAddDepartmentModal: function () {
      this.renderDepartmentModal(null);
    },

    openEditDepartmentModal: function (id) {
      const dept = (State.get().data.departments || []).find(d => d.id === id);
      if (!dept) return;
      this.renderDepartmentModal(dept);
    },

    renderDepartmentModal: function (dept) {
      const users = (State.get().data.users || []).filter(u => u.active);
      const isEdit = !!dept;

      const modalHtml = `
        <div id="dept-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="modal-panel max-w-md w-full p-6 border border-slate-100">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">${isEdit ? 'Edit Department' : 'Add New Department'}</h3>
              <button onclick="document.getElementById('dept-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="MasterDataComponent.handleSaveDepartmentSubmit(event, '${isEdit ? dept.id : ''}')" class="space-y-4 mt-4 text-xs">
              <div>
                <label class="form-label">Department Name <span class="text-rose-500">*</span></label>
                <input type="text" id="dept-form-name" value="${isEdit ? (dept.name || '') : ''}" placeholder="e.g. Legal & Compliance" class="form-input" required />
              </div>

              <div>
                <label class="form-label">Head of Department (HOD)</label>
                <select id="dept-form-hod" class="form-select">
                  <option value="">-- Select HOD (Optional) --</option>
                  ${users.map(u => `
                    <option value="${u.id}" ${isEdit && dept.hodId === u.id ? 'selected' : ''}>
                      ${u.name} [${u.role.toUpperCase()}]
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Sort Order</label>
                  <input type="number" id="dept-form-order" value="${isEdit ? (dept.order || 1) : ((State.get().data.departments || []).length + 1)}" min="1" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Status</label>
                  <select id="dept-form-active" class="form-select">
                    <option value="true" ${!isEdit || isRecordActive(dept) ? 'selected' : ''}>Active</option>
                    <option value="false" ${isEdit && !isRecordActive(dept) ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('dept-modal').remove()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" id="btn-save-dept" class="btn btn-primary flex-1">${isEdit ? 'Save Changes' : 'Create Department'}</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleSaveDepartmentSubmit: async function (e, existingId) {
      e.preventDefault();
      const name = document.getElementById('dept-form-name').value.trim();
      const hodId = document.getElementById('dept-form-hod').value;
      const order = Number(document.getElementById('dept-form-order').value || 1);
      const active = document.getElementById('dept-form-active').value === 'true';

      const btn = document.getElementById('btn-save-dept');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

      try {
        const record = {
          id: existingId || ('dept_' + Date.now().toString(36)),
          name: name,
          hodId: hodId,
          order: order,
          active: active
        };

        await API.saveMasterRecord('departments', record);
        document.getElementById('dept-modal').remove();
        App.showToast(`Department "${name}" saved successfully!`, 'success');
        await App.loadInitialData(true);
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Failed to save department', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Save';
      }
    },

    // =========================================================================
    // MODALS: ADD & EDIT LOCATIONS
    // =========================================================================
    openAddLocationModal: function () {
      this.renderLocationModal(null);
    },

    openEditLocationModal: function (id) {
      const loc = (State.get().data.locations || []).find(l => l.id === id);
      if (!loc) return;
      this.renderLocationModal(loc);
    },

    renderLocationModal: function (loc) {
      const isEdit = !!loc;

      const modalHtml = `
        <div id="loc-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="modal-panel max-w-md w-full p-6 border border-slate-100">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">${isEdit ? 'Edit Location' : 'Add New Location'}</h3>
              <button onclick="document.getElementById('loc-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="MasterDataComponent.handleSaveLocationSubmit(event, '${isEdit ? loc.id : ''}')" class="space-y-4 mt-4 text-xs">
              <div>
                <label class="form-label">Location / City Name <span class="text-rose-500">*</span></label>
                <input type="text" id="loc-form-name" value="${isEdit ? (loc.name || '') : ''}" placeholder="e.g. Bangalore" class="form-input" required />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Sort Order</label>
                  <input type="number" id="loc-form-order" value="${isEdit ? (loc.order || 1) : ((State.get().data.locations || []).length + 1)}" min="1" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Status</label>
                  <select id="loc-form-active" class="form-select">
                    <option value="true" ${!isEdit || isRecordActive(loc) ? 'selected' : ''}>Active</option>
                    <option value="false" ${isEdit && !isRecordActive(loc) ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('loc-modal').remove()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" id="btn-save-loc" class="btn btn-primary flex-1">${isEdit ? 'Save Changes' : 'Create Location'}</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleSaveLocationSubmit: async function (e, existingId) {
      e.preventDefault();
      const name = document.getElementById('loc-form-name').value.trim();
      const order = Number(document.getElementById('loc-form-order').value || 1);
      const active = document.getElementById('loc-form-active').value === 'true';

      const btn = document.getElementById('btn-save-loc');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

      try {
        const record = {
          id: existingId || ('loc_' + Date.now().toString(36)),
          name: name,
          order: order,
          active: active
        };

        await API.saveMasterRecord('locations', record);
        document.getElementById('loc-modal').remove();
        App.showToast(`Location "${name}" saved successfully!`, 'success');
        await App.loadInitialData(true);
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Failed to save location', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Save';
      }
    },

    // =========================================================================
    // MODALS: ADD & EDIT BUSINESS UNITS
    // =========================================================================
    openAddBusinessUnitModal: function () {
      this.renderBusinessUnitModal(null);
    },

    openEditBusinessUnitModal: function (id) {
      const bu = (State.get().data.businessUnits || []).find(b => b.id === id);
      if (!bu) return;
      this.renderBusinessUnitModal(bu);
    },

    renderBusinessUnitModal: function (bu) {
      const isEdit = !!bu;

      const modalHtml = `
        <div id="bu-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="modal-panel max-w-md w-full p-6 border border-slate-100">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">${isEdit ? 'Edit Business Unit' : 'Add Business Unit'}</h3>
              <button onclick="document.getElementById('bu-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="MasterDataComponent.handleSaveBusinessUnitSubmit(event, '${isEdit ? bu.id : ''}')" class="space-y-4 mt-4 text-xs">
              <div>
                <label class="form-label">Business Unit Name <span class="text-rose-500">*</span></label>
                <input type="text" id="bu-form-name" value="${isEdit ? (bu.name || '') : ''}" placeholder="e.g. Gretex Fintech Advisory" class="form-input" required />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Sort Order</label>
                  <input type="number" id="bu-form-order" value="${isEdit ? (bu.order || 1) : ((State.get().data.businessUnits || []).length + 1)}" min="1" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Status</label>
                  <select id="bu-form-active" class="form-select">
                    <option value="true" ${!isEdit || isRecordActive(bu) ? 'selected' : ''}>Active</option>
                    <option value="false" ${isEdit && !isRecordActive(bu) ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('bu-modal').remove()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" id="btn-save-bu" class="btn btn-primary flex-1">${isEdit ? 'Save Changes' : 'Create Unit'}</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleSaveBusinessUnitSubmit: async function (e, existingId) {
      e.preventDefault();
      const name = document.getElementById('bu-form-name').value.trim();
      const order = Number(document.getElementById('bu-form-order').value || 1);
      const active = document.getElementById('bu-form-active').value === 'true';

      const btn = document.getElementById('btn-save-bu');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

      try {
        const record = {
          id: existingId || ('bu_' + Date.now().toString(36)),
          name: name,
          order: order,
          active: active
        };

        await API.saveMasterRecord('businessUnits', record);
        document.getElementById('bu-modal').remove();
        App.showToast(`Business Unit "${name}" saved successfully!`, 'success');
        await App.loadInitialData(true);
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Failed to save business unit', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Save';
      }
    },

    // =========================================================================
    // MODALS: ADD & EDIT CATEGORIES (DESIGNATIONS)
    // =========================================================================
    openAddCategoryModal: function () {
      this.renderCategoryModal(null);
    },

    openEditCategoryModal: function (id) {
      const cat = (State.get().data.userCategories || []).find(c => c.id === id);
      if (!cat) return;
      this.renderCategoryModal(cat);
    },

    renderCategoryModal: function (cat) {
      const isEdit = !!cat;

      const modalHtml = `
        <div id="cat-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="modal-panel max-w-md w-full p-6 border border-slate-100">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">${isEdit ? 'Edit Designation' : 'Add Designation'}</h3>
              <button onclick="document.getElementById('cat-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="MasterDataComponent.handleSaveCategorySubmit(event, '${isEdit ? cat.id : ''}')" class="space-y-4 mt-4 text-xs">
              <div>
                <label class="form-label">Designation / Role Title <span class="text-rose-500">*</span></label>
                <input type="text" id="cat-form-name" value="${isEdit ? (cat.name || '') : ''}" placeholder="e.g. Senior Copywriter" class="form-input" required />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Sort Order</label>
                  <input type="number" id="cat-form-order" value="${isEdit ? (cat.order || 1) : ((State.get().data.userCategories || []).length + 1)}" min="1" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Status</label>
                  <select id="cat-form-active" class="form-select">
                    <option value="true" ${!isEdit || isRecordActive(cat) ? 'selected' : ''}>Active</option>
                    <option value="false" ${isEdit && !isRecordActive(cat) ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('cat-modal').remove()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" id="btn-save-cat" class="btn btn-primary flex-1">${isEdit ? 'Save Changes' : 'Create Designation'}</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleSaveCategorySubmit: async function (e, existingId) {
      e.preventDefault();
      const name = document.getElementById('cat-form-name').value.trim();
      const order = Number(document.getElementById('cat-form-order').value || 1);
      const active = document.getElementById('cat-form-active').value === 'true';

      const btn = document.getElementById('btn-save-cat');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

      try {
        const record = {
          id: existingId || ('cat_' + Date.now().toString(36)),
          name: name,
          order: order,
          active: active
        };

        await API.saveMasterRecord('userCategories', record);
        document.getElementById('cat-modal').remove();
        App.showToast(`Designation "${name}" saved successfully!`, 'success');
        await App.loadInitialData(true);
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Failed to save designation', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Save';
      }
    },

    // =========================================================================
    // MODALS: ADD & EDIT USER
    // =========================================================================
    openAddUserModal: function () {
      this.renderUserModal(null);
    },

    openEditUserModal: function (id) {
      const user = (State.get().data.users || []).find(u => u.id === id);
      if (!user) return;
      this.renderUserModal(user);
    },

    renderUserModal: function (user) {
      const users = State.get().data.users || [];
      const cats = State.get().data.userCategories || [];
      const isEdit = !!user;

      const modalHtml = `
        <div id="user-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="modal-panel max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">${isEdit ? 'Edit User Record' : 'Add New User'}</h3>
              <button onclick="document.getElementById('user-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="MasterDataComponent.handleSaveUserSubmit(event, '${isEdit ? user.id : ''}')" class="space-y-4 mt-4 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Full Name <span class="text-rose-500">*</span></label>
                  <input type="text" id="user-form-name" value="${isEdit ? (user.name || '') : ''}" placeholder="e.g. Ramesh Kumar" class="form-input" required />
                </div>
                <div>
                  <label class="form-label">Email Address <span class="text-rose-500">*</span></label>
                  <input type="email" id="user-form-email" value="${isEdit ? (user.email || '') : ''}" placeholder="user@gretex.com" class="form-input" required />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Role <span class="text-rose-500">*</span></label>
                  <select id="user-form-role" class="form-select" required>
                    <option value="employee" ${isEdit && user.role === 'employee' ? 'selected' : ''}>Employee</option>
                    <option value="team_leader" ${isEdit && user.role === 'team_leader' ? 'selected' : ''}>Team Leader</option>
                    <option value="manager" ${isEdit && user.role === 'manager' ? 'selected' : ''}>Manager</option>
                    <option value="hod" ${isEdit && user.role === 'hod' ? 'selected' : ''}>HOD</option>
                    <option value="admin" ${isEdit && user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="ceo" ${isEdit && user.role === 'ceo' ? 'selected' : ''}>CEO</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Reports To (Superior)</label>
                  <select id="user-form-reports-to" class="form-select">
                    <option value="">-- None (Top Level) --</option>
                    ${users.filter(u => !isEdit || u.id !== user.id).map(u => `
                      <option value="${u.id}" ${isEdit && user.reportsToId === u.id ? 'selected' : ''}>
                        ${u.name} [${u.role.toUpperCase()}]
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Designation Category</label>
                  <select id="user-form-category" class="form-select">
                    <option value="">-- Choose Designation --</option>
                    ${cats.map(c => `
                      <option value="${c.id}" ${isEdit && (user.categoryId === c.id || user.designation === c.name) ? 'selected' : ''}>
                        ${c.name}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label">Monthly Salary (₹)</label>
                  <input type="number" id="user-form-salary" value="${isEdit ? (user.salaryMonthly || 0) : 50000}" min="0" class="form-input" required />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Login PIN (Default: 1234)</label>
                  <input type="text" id="user-form-pin" value="${isEdit ? (user.pin || '1234') : '1234'}" maxlength="6" class="form-input font-mono" required />
                </div>
                <div>
                  <label class="form-label">Account Status</label>
                  <select id="user-form-active" class="form-select">
                    <option value="true" ${!isEdit || isRecordActive(user) ? 'selected' : ''}>Active</option>
                    <option value="false" ${isEdit && !isRecordActive(user) ? 'selected' : ''}>Inactive</option>
                  </select>
                </div>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('user-modal').remove()" class="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" id="btn-save-user" class="btn btn-primary flex-1">${isEdit ? 'Save User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleSaveUserSubmit: async function (e, existingId) {
      e.preventDefault();
      const name = document.getElementById('user-form-name').value.trim();
      const email = document.getElementById('user-form-email').value.trim();
      const role = document.getElementById('user-form-role').value;
      const reportsToId = document.getElementById('user-form-reports-to').value;
      const categoryId = document.getElementById('user-form-category').value;
      const salary = Number(document.getElementById('user-form-salary').value || 0);
      const pin = document.getElementById('user-form-pin').value.trim() || '1234';
      const active = document.getElementById('user-form-active').value === 'true';

      const cat = State.get().data.userCategories.find(c => c.id === categoryId);

      const btn = document.getElementById('btn-save-user');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

      try {
        const userRecord = {
          id: existingId || ('usr_' + Date.now().toString(36)),
          name: name,
          email: email,
          role: role,
          designation: cat ? cat.name : role.toUpperCase(),
          reportsToId: reportsToId,
          categoryId: categoryId,
          salaryMonthly: salary,
          pin: pin,
          active: active,
          doj: new Date().toISOString().split('T')[0]
        };

        await API.saveMasterRecord('users', userRecord);
        document.getElementById('user-modal').remove();
        App.showToast(`User "${name}" saved successfully!`, 'success');
        await App.loadInitialData(true);
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Error saving user', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Save User';
      }
    },

    // =========================================================================
    // 7. GENERIC CSV IMPORT MODAL (DEPARTMENTS, LOCATIONS, BUs, CATEGORIES)
    // =========================================================================
    openImportModal: function (tableName) {
      const titles = {
        departments: 'Departments',
        locations: 'Locations',
        businessUnits: 'Business Units',
        categories: 'Designations'
      };
      const displayTitle = titles[tableName] || tableName;

      const modalHtml = `
        <div id="import-master-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="modal-panel max-w-xl w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <i class="fa-solid fa-file-csv"></i>
                </div>
                <div>
                  <h3 class="text-base font-bold text-slate-800">Bulk Import ${displayTitle}</h3>
                  <p class="text-[11px] text-slate-400">Upload CSV file or paste tabular data directly</p>
                </div>
              </div>
              <button onclick="document.getElementById('import-master-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div class="space-y-4 mt-4 text-xs">
              <!-- Template Download Action -->
              <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span class="font-bold text-slate-800 block">Step 1: Download Sample CSV Template</span>
                  <span class="text-slate-500 text-[11px]">Formatted with sample data and correct column headers</span>
                </div>
                <button 
                  onclick="MasterDataComponent.downloadTemplate('${tableName}')" 
                  class="btn btn-secondary btn-sm flex items-center gap-1.5"
                >
                  <i class="fa-solid fa-download text-blue-600"></i>
                  <span>Download Template</span>
                </button>
              </div>

              <!-- File Upload or Paste Option -->
              <div>
                <span class="font-bold text-slate-700 block mb-1">Step 2: Upload CSV File or Paste Data</span>
                <div class="grid grid-cols-1 gap-2">
                  <input 
                    type="file" 
                    id="import-file-input" 
                    accept=".csv,.txt" 
                    onchange="MasterDataComponent.handleImportFileSelect(event, '${tableName}')"
                    class="form-input text-xs"
                  />
                  <div class="text-center text-slate-400 text-[11px]">— or paste CSV text below —</div>
                  <textarea 
                    id="import-csv-textarea" 
                    rows="4" 
                    placeholder="Paste CSV rows here (e.g. name, order, active)..."
                    class="form-textarea font-mono text-[11px]"
                  ></textarea>
                </div>
              </div>

              <div class="flex justify-end">
                <button 
                  onclick="MasterDataComponent.parseAndPreviewCsv('${tableName}')" 
                  class="btn btn-secondary btn-sm flex items-center gap-1"
                >
                  <i class="fa-solid fa-table-list"></i>
                  <span>Preview Parsed Rows</span>
                </button>
              </div>

              <!-- Preview Table Container -->
              <div id="import-preview-wrapper" class="hidden space-y-2">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-800 text-xs">Previewing <span id="import-preview-count">0</span> Record(s):</span>
                </div>
                <div class="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                  <table class="w-full text-left text-[11px]">
                    <thead class="bg-slate-200/70 text-slate-700 font-semibold sticky top-0">
                      <tr id="import-preview-thead"></tr>
                    </thead>
                    <tbody id="import-preview-tbody" class="divide-y divide-slate-200"></tbody>
                  </table>
                </div>
              </div>

              <!-- Submit Buttons -->
              <div class="pt-3 flex gap-2 border-t border-slate-100">
                <button type="button" onclick="document.getElementById('import-master-modal').remove()" class="btn btn-secondary flex-1">Cancel</button>
                <button 
                  type="button" 
                  id="btn-confirm-import" 
                  onclick="MasterDataComponent.executeBatchImport('${tableName}')" 
                  class="btn btn-primary flex-1 shadow"
                  disabled
                >
                  Confirm & Import
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    downloadTemplate: function (tableName) {
      let csvContent = '';
      let filename = `${tableName}_template.csv`;

      if (tableName === 'departments') {
        csvContent = 'name,hod,order,active\n"Human Resources","Admin",1,true\n"Digital Marketing","Sunita Roy",2,true\n"Legal & Compliance","",3,true\n';
      } else if (tableName === 'locations') {
        csvContent = 'name,order,active\n"Mumbai",1,true\n"Kolkata",2,true\n"Pune",3,true\n"Guwahati",4,true\n"Bangalore",5,true\n';
      } else if (tableName === 'businessUnits') {
        csvContent = 'name,order,active\n"Gretex Corporate Services",1,true\n"Gretex Share Broking",2,true\n"Gretex Industries Ltd",3,true\n"Platinumone Insurance",4,true\n"Bahutex (AIF)",5,true\n';
      } else if (tableName === 'categories') {
        csvContent = 'name,order,active\n"Senior Copywriter",1,true\n"Motion Graphic Artist",2,true\n"Content Strategist",3,true\n';
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    handleImportFileSelect: function (e, tableName) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        document.getElementById('import-csv-textarea').value = event.target.result;
        MasterDataComponent.parseAndPreviewCsv(tableName);
      };
      reader.readAsText(file);
    },

    parseAndPreviewCsv: function (tableName) {
      const text = (document.getElementById('import-csv-textarea')?.value || '').trim();
      if (!text) {
        App.showToast('Please upload a file or paste CSV text first.', 'warning');
        return;
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        App.showToast('CSV must contain a header row and at least one data row.', 'warning');
        return;
      }

      // Parse headers
      const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      const rows = [];
      const users = State.get().data.users || [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Basic CSV split considering quotes
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const values = match.map(v => v.trim().replace(/^["']|["']$/g, ''));

        const record = {};
        rawHeaders.forEach((hdr, idx) => {
          record[hdr] = values[idx] !== undefined ? values[idx] : '';
        });

        if (record.name && record.name.trim().length > 0) {
          const formatted = {
            id: '',
            name: record.name.trim(),
            order: Number(record.order || i),
            active: (record.active === 'false' || record.active === '0') ? false : true
          };

          if (tableName === 'departments') {
            // resolve HOD if specified
            const hodSearch = (record.hod || record.hodid || '').toLowerCase().trim();
            if (hodSearch) {
              const matchedUser = users.find(u => {
                return (u.id && u.id.toLowerCase() === hodSearch) ||
                       (u.name && u.name.toLowerCase().includes(hodSearch)) ||
                       (u.email && u.email.toLowerCase() === hodSearch);
              });
              formatted.hodId = matchedUser ? matchedUser.id : '';
            } else {
              formatted.hodId = '';
            }
          }

          rows.push(formatted);
        }
      }

      if (rows.length === 0) {
        App.showToast('No valid rows found. Please ensure "name" column is present and filled.', 'error');
        return;
      }

      // Render Preview Table
      const thead = document.getElementById('import-preview-thead');
      const tbody = document.getElementById('import-preview-tbody');
      const wrapper = document.getElementById('import-preview-wrapper');
      const countEl = document.getElementById('import-preview-count');
      const btnConfirm = document.getElementById('btn-confirm-import');

      countEl.textContent = rows.length;
      thead.innerHTML = `
        <th class="p-2">Name</th>
        ${tableName === 'departments' ? '<th class="p-2">HOD Assigned</th>' : ''}
        <th class="p-2">Order</th>
        <th class="p-2">Status</th>
      `;

      tbody.innerHTML = rows.map(r => `
        <tr class="hover:bg-white">
          <td class="p-2 font-semibold text-slate-800">${r.name}</td>
          ${tableName === 'departments' ? `<td class="p-2 text-slate-600">${State.getUserById(r.hodId)?.name || '—'}</td>` : ''}
          <td class="p-2 text-slate-600">${r.order}</td>
          <td class="p-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
              ${r.active ? 'Active' : 'Inactive'}
            </span>
          </td>
        </tr>
      `).join('');

      wrapper.classList.remove('hidden');
      btnConfirm.disabled = false;
      btnConfirm.dataset.parsedRows = JSON.stringify(rows);
      App.showToast(`Parsed ${rows.length} rows successfully! Ready to import.`, 'success');
    },

    executeBatchImport: async function (tableName) {
      const btnConfirm = document.getElementById('btn-confirm-import');
      const rawData = btnConfirm.dataset.parsedRows;
      if (!rawData) return;

      const rows = JSON.parse(rawData);
      let apiTable = tableName;
      if (tableName === 'categories') apiTable = 'userCategories';

      btnConfirm.disabled = true;
      btnConfirm.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Importing ${rows.length} records...`;

      try {
        await API.batchSaveMasterRecords(apiTable, rows);
        document.getElementById('import-master-modal').remove();
        App.showToast(`Successfully imported ${rows.length} ${tableName}!`, 'success');
        await App.loadInitialData(true);
        App.renderCurrentTab();
      } catch (err) {
        App.showToast(err.message || 'Import failed', 'error');
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = 'Confirm & Import';
      }
    }
  };
})();
