/**
 * KARYA - CSV Import & Template Generator Component
 * Implements FR-IMP-01 to FR-IMP-15 (19-column parser, live template download, validation preview).
 */
const CsvImportComponent = (function () {
  let parsedPreviewRows = [];

  return {
    render: function () {
      if (!State.canAssignTasks()) {
        return `<div class="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          CSV Import is restricted to Admin, CEO, HOD, and Managers.
        </div>`;
      }

      return `
        <div class="space-y-6">
          <!-- Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-file-csv text-blue-600"></i>
                <span>CSV Bulk Task Importer</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Upload CSV files to create task assignments in bulk with in-memory validation.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button onclick="CsvImportComponent.downloadTemplate()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5">
                <i class="fa-solid fa-download"></i>
                <span>Download Live Template</span>
              </button>
              <button onclick="CsvImportComponent.downloadValidValues()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5">
                <i class="fa-solid fa-list-check"></i>
                <span>Valid Values Reference</span>
              </button>
            </div>
          </div>

          <!-- Upload Drop Zone -->
          <div class="bg-white rounded-2xl p-8 border-2 border-dashed border-slate-200 hover:border-blue-400 transition text-center space-y-3">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
              <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-800">Select or Drag & Drop Task CSV File</h3>
              <p class="text-xs text-slate-400 mt-1">Supports standard 19-column Karya format with UTF-8 encoding</p>
            </div>

            <input 
              type="file" 
              id="csv-file-input" 
              accept=".csv" 
              onchange="CsvImportComponent.handleFileSelect(event)" 
              class="hidden" 
            />

            <button 
              onclick="document.getElementById('csv-file-input').click()" 
              class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow transition"
            >
              Browse CSV File
            </button>
          </div>

          <!-- Preview Table if File Loaded -->
          <div id="csv-preview-container" class="hidden bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 class="text-base font-bold text-slate-800">Import Validation Preview</h3>
                <p id="csv-preview-summary" class="text-xs text-slate-500 mt-0.5"></p>
              </div>
              <button 
                onclick="CsvImportComponent.executeImport()" 
                id="btn-execute-import" 
                class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
              >
                <i class="fa-solid fa-check-double"></i>
                <span>Confirm & Import Valid Tasks</span>
              </button>
            </div>

            <div class="overflow-x-auto max-h-96">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th class="p-2.5">Row</th>
                    <th class="p-2.5">Status</th>
                    <th class="p-2.5">Main KRA</th>
                    <th class="p-2.5">KRA Path</th>
                    <th class="p-2.5">Assigned To</th>
                    <th class="p-2.5">Project</th>
                    <th class="p-2.5">Date Given</th>
                    <th class="p-2.5">Errors / Warnings</th>
                  </tr>
                </thead>
                <tbody id="csv-preview-tbody" class="divide-y divide-slate-100"></tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    downloadTemplate: function () {
      const main = State.get().data.mainKras[0]?.name || 'GIL — Turnover ₹80 Cr';
      const loc = State.get().data.locations[0]?.name || 'Mumbai';
      const dept = State.get().data.departments[0]?.name || 'Marketing';
      const prj = State.get().data.projects[0]?.name || 'YMS Retail Store Expansion';
      const emp = State.get().data.users[0]?.name || 'System Administrator';

      const headers = [
        "Date Given", "Location", "Department", "Project", "Main KRA", "KRA Path",
        "Assigned To", "Priority", "Instructions", "Qty", "Quality", "Cost Budget",
        "Allotted Minutes", "Remarks", "Recurring", "Frequency", "Recur Start", "Recur End", "Approval Flow"
      ];

      const row1 = [
        new Date().toISOString().split('T')[0], loc, dept, prj, main, "Marketing & Brand Visibility > Social Media Campaigns",
        emp, "High", "Prepare promotional creative campaign", "10", "95", "5000", "120", "Campaign for FY27", "No", "", "", "", "Creative & Deliverable Sign-off Flow"
      ];

      const csvContent = headers.join(",") + "\n" + row1.map(v => `"${v}"`).join(",");
      this.triggerDownload(csvContent, "karya_task_import_template.csv");
    },

    downloadValidValues: function () {
      const rows = [];
      rows.push("Type,Valid Value Name");
      State.get().data.locations.forEach(l => rows.push(`Location,"${l.name}"`));
      State.get().data.departments.forEach(d => rows.push(`Department,"${d.name}"`));
      State.get().data.projects.forEach(p => rows.push(`Project,"${p.name}"`));
      State.get().data.mainKras.forEach(m => rows.push(`Main KRA,"${m.name}"`));
      State.get().data.users.forEach(u => rows.push(`Employee,"${u.name}"`));
      State.get().data.approvalFlows.forEach(f => rows.push(`Approval Flow,"${f.name}"`));

      this.triggerDownload(rows.join("\n"), "karya_valid_values_reference.csv");
    },

    triggerDownload: function (content, filename) {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },

    handleFileSelect: function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        this.parseAndPreview(text);
      };
      reader.readAsText(file);
    },

    parseAndPreview: function (csvText) {
      const lines = csvText.split(/\r\n|\n/).filter(l => l.trim().length > 0);
      if (lines.length <= 1) {
        App.showToast('CSV file is empty or missing data rows.', 'warning');
        return;
      }

      const rows = [];
      const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.replace(/^["']|["']$/g, '').trim());
        const rowObj = { _rowIdx: i + 1, _errors: [] };

        headers.forEach((h, idx) => {
          rowObj[h] = vals[idx] || '';
        });

        // Validation
        const mainKra = State.get().data.mainKras.find(m => m.name.toLowerCase() === (rowObj['main kra'] || '').toLowerCase());
        if (!mainKra) rowObj._errors.push(`Unmatched Main KRA: "${rowObj['main kra']}"`);

        const project = State.get().data.projects.find(p => p.name.toLowerCase() === (rowObj['project'] || '').toLowerCase());
        if (!project) rowObj._errors.push(`Unmatched Project: "${rowObj['project']}"`);

        const location = State.get().data.locations.find(l => l.name.toLowerCase() === (rowObj['location'] || '').toLowerCase());
        if (!location) rowObj._errors.push(`Unmatched Location: "${rowObj['location']}"`);

        const department = State.get().data.departments.find(d => d.name.toLowerCase() === (rowObj['department'] || '').toLowerCase());
        if (!department) rowObj._errors.push(`Unmatched Department: "${rowObj['department']}"`);

        rowObj._valid = rowObj._errors.length === 0;
        rowObj._resolved = { mainKra, project, location, department };
        rows.push(rowObj);
      }

      parsedPreviewRows = rows;
      const validCount = rows.filter(r => r._valid).length;

      document.getElementById('csv-preview-container').classList.remove('hidden');
      document.getElementById('csv-preview-summary').innerHTML = `
        Parsed <strong>${rows.length}</strong> rows: <span class="text-emerald-600 font-bold">${validCount} Valid</span>, <span class="text-rose-600 font-bold">${rows.length - validCount} Errors</span>
      `;

      const tbody = document.getElementById('csv-preview-tbody');
      tbody.innerHTML = rows.map(r => `
        <tr class="${r._valid ? 'hover:bg-slate-50' : 'bg-rose-50/40'}">
          <td class="p-2.5 font-mono">${r._rowIdx}</td>
          <td class="p-2.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${r._valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${r._valid ? 'Ready' : 'Error'}
            </span>
          </td>
          <td class="p-2.5">${r['main kra'] || '—'}</td>
          <td class="p-2.5">${r['kra path'] || '—'}</td>
          <td class="p-2.5">${r['assigned to'] || '—'}</td>
          <td class="p-2.5">${r['project'] || '—'}</td>
          <td class="p-2.5">${r['date given'] || '—'}</td>
          <td class="p-2.5 text-rose-600 font-medium">${r._errors.join(', ')}</td>
        </tr>
      `).join('');
    },

    executeImport: async function () {
      const validRows = parsedPreviewRows.filter(r => r._valid);
      if (validRows.length === 0) {
        App.showToast('No valid rows available to import.', 'warning');
        return;
      }

      const btn = document.getElementById('btn-execute-import');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Importing...`;

      try {
        const currentUser = State.getUser();
        const tasksToCreate = [];

        validRows.forEach(r => {
          // Resolve assignee names separated by ';'
          const assigneeNames = (r['assigned to'] || '').split(';').map(n => n.trim());
          const matchedUserIds = [];

          assigneeNames.forEach(an => {
            const u = State.get().data.users.find(usr => usr.name.toLowerCase() === an.toLowerCase());
            if (u) matchedUserIds.push(u.id);
          });

          if (matchedUserIds.length === 0) {
            matchedUserIds.push(currentUser.id);
          }

          matchedUserIds.forEach(uId => {
            tasksToCreate.push({
              dateGiven: r['date given'] || new Date().toISOString().split('T')[0],
              locationId: r._resolved.location.id,
              departmentId: r._resolved.department.id,
              projectId: r._resolved.project.id,
              mainKraId: r._resolved.mainKra.id,
              assignedToId: uId,
              assignedBy: currentUser.id,
              priority: r['priority'] || 'Normal',
              details: r['instructions'] || '',
              estMinutes: Number(r['allotted minutes'] || 60),
              status: 'Pending'
            });
          });
        });

        await API.assignTasks(tasksToCreate);
        document.getElementById('csv-preview-container').classList.add('hidden');
        App.showToast(`Successfully imported ${tasksToCreate.length} tasks!`, 'success');
        await App.loadTasks();
        App.switchTab('myTasks');
      } catch (err) {
        App.showToast(err.message || 'Import failed', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Confirm & Import Valid Tasks';
      }
    }
  };
})();
