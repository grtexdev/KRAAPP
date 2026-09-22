/**
 * KARYA - KRA Hierarchy Builder Component
 * Implements FR-KRA-01 to FR-KRA-10 (Unlimited depth tree, ancestor inheritance, cascade delete).
 */
const KraBuilderComponent = (function () {
  let selectedMainKraId = '';

  return {
    render: function () {
      const mainKras = State.get().data.mainKras || [];
      if (!selectedMainKraId && mainKras.length > 0) {
        selectedMainKraId = mainKras[0].id;
      }

      const activeMainKra = State.getMainKraById(selectedMainKraId);
      const allNodes = State.get().data.kraNodes || [];
      const nodesForMain = allNodes.filter(n => n.mainKraId === selectedMainKraId);

      return `
        <div class="space-y-6">
          <!-- Top Header -->
          <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <i class="fa-solid fa-sitemap text-blue-600"></i>
                <span>KRA Hierarchy Builder</span>
              </h1>
              <p class="text-sm text-slate-500 mt-0.5">
                Cascade group targets into unlimited sub-KRAs, tasks, and variable fields.
              </p>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <select 
                onchange="KraBuilderComponent.selectMainKra(this.value)" 
                class="bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                ${mainKras.map(m => `
                  <option value="${m.id}" ${m.id === selectedMainKraId ? 'selected' : ''}>
                    🎯 ${m.name}
                  </option>
                `).join('')}
              </select>

              ${State.canAccessAdminScreens() ? `
                <button 
                  onclick="KraBuilderComponent.openAddMainKraModal()" 
                  class="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2.5 rounded-xl shadow transition"
                >
                  <i class="fa-solid fa-plus mr-1"></i> New Main KRA
                </button>
              ` : ''}
            </div>
          </div>

          ${activeMainKra ? `
            <!-- Main KRA Card -->
            <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
              <div class="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-2">
                    ROOT OBJECTIVE
                  </span>
                  <h2 class="text-xl font-bold">${activeMainKra.name}</h2>
                  <div class="flex flex-wrap items-center gap-4 mt-3 text-xs text-blue-200/80">
                    <span><i class="fa-solid fa-building mr-1"></i> ${State.get().data.businessUnits.find(b => b.id === activeMainKra.businessUnitId)?.name || 'All Entities'}</span>
                    <span><i class="fa-solid fa-user-tie mr-1"></i> Owner: ${State.getUserById(activeMainKra.ownerId)?.name || 'Company Wide'}</span>
                    <span><i class="fa-solid fa-code-branch mr-1"></i> Flow: ${State.getApprovalFlowById(activeMainKra.approvalFlowId)?.name || 'Direct Completion'}</span>
                  </div>
                </div>

                <button 
                  onclick="KraBuilderComponent.openAddNodeModal('${activeMainKra.id}', null, 1)" 
                  class="bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <i class="fa-solid fa-plus"></i>
                  <span>Add Sub KRA (Level 1)</span>
                </button>
              </div>
            </div>

            <!-- Visual KRA Tree -->
            <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 class="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Cascade Tree Structure</span>
                <span class="text-xs text-slate-400 font-normal">Unlimited depth • Nearest-ancestor inheritance</span>
              </h3>

              <div class="space-y-3">
                ${this.renderTreeLevel(nodesForMain, null, 1)}
              </div>
            </div>
          ` : `
            <div class="bg-white rounded-2xl p-12 text-center text-slate-500 border border-slate-200">
              No Main KRAs configured. Click "New Main KRA" to begin.
            </div>
          `}
        </div>
      `;
    },

    // Recursive tree rendering with depth labeling
    renderTreeLevel: function (allNodes, parentId, level) {
      const children = allNodes.filter(n => (n.parentId || null) === (parentId || null));
      if (children.length === 0) {
        if (level === 1) {
          return `
            <div class="text-center py-8 text-slate-400 text-xs">
              No sub-levels added yet. Click "Add Sub KRA" to start cascading.
            </div>
          `;
        }
        return '';
      }

      // Depth Label derived according to FR-KRA-03
      let levelLabel = "Sub KRA";
      if (level === 2) levelLabel = "Task";
      else if (level >= 3) levelLabel = `Sub Task Level ${level - 2}`;

      return children.map(node => {
        const ownerName = State.getUserById(node.ownerId)?.name || `Inherited (${State.getUserById(State.resolveEffectiveOwnerId(node.id))?.name || 'Root'})`;
        const flowName = State.getApprovalFlowById(node.approvalFlowId)?.name || `Inherited (${State.getApprovalFlowById(State.resolveEffectiveApprovalFlowId(node.id))?.name || 'None'})`;
        const varFields = (node.variableFields && Array.isArray(node.variableFields)) ? node.variableFields.filter(f => f) : [];
        const hasChildren = allNodes.some(n => n.parentId === node.id);

        return `
          <div class="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition space-y-2 ml-${level > 1 ? '4 md:ml-6' : '0'}">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-700">
                  L${level} • ${levelLabel}
                </span>
                <h4 class="text-sm font-bold text-slate-800">${node.name}</h4>
              </div>

              <div class="flex items-center gap-1.5">
                <button 
                  onclick="KraBuilderComponent.openAddNodeModal('${node.mainKraId}', '${node.id}', ${level + 1})" 
                  title="Add child sub-task" 
                  class="bg-blue-50 hover:bg-blue-100 text-blue-700 p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <i class="fa-solid fa-plus text-[10px]"></i>
                  <span>Add Child</span>
                </button>
                <button 
                  onclick="KraBuilderComponent.openEditNodeModal('${node.id}')" 
                  title="Edit node" 
                  class="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg text-xs"
                >
                  <i class="fa-solid fa-pen text-[10px]"></i>
                </button>
                <button 
                  onclick="KraBuilderComponent.confirmDeleteNode('${node.id}')" 
                  title="Delete node & descendants" 
                  class="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg text-xs"
                >
                  <i class="fa-solid fa-trash text-[10px]"></i>
                </button>
              </div>
            </div>

            <!-- Metadata tags -->
            <div class="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span><i class="fa-solid fa-user text-slate-400 mr-1"></i> Owner: <strong>${ownerName}</strong></span>
              <span><i class="fa-solid fa-shield-halved text-slate-400 mr-1"></i> Approval: <strong>${flowName}</strong></span>
              ${varFields.length > 0 ? `
                <span><i class="fa-solid fa-list-check text-blue-500 mr-1"></i> Variable Questions: <strong>${varFields.join(', ')}</strong></span>
              ` : `
                <span class="text-slate-400">Questions: Inherited from ancestor</span>
              `}
            </div>

            <!-- Render Nested Descendants -->
            ${this.renderTreeLevel(allNodes, node.id, level + 1)}
          </div>
        `;
      }).join('');
    },

    selectMainKra: function (id) {
      selectedMainKraId = id;
      App.renderCurrentTab();
    },

    // Add Node Modal
    openAddNodeModal: function (mainKraId, parentId, level) {
      const users = State.get().data.users || [];
      const flows = State.get().data.approvalFlows || [];

      // Pre-fill variable fields from parent/ancestor (FR-KRA-06)
      const inheritedVars = parentId ? State.resolveEffectiveVariableFields(parentId) : [];
      const inheritedOwnerId = parentId ? State.resolveEffectiveOwnerId(parentId) : '';
      const inheritedFlowId = parentId ? State.resolveEffectiveApprovalFlowId(parentId) : '';

      const modalHtml = `
        <div id="add-kra-node-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">Add KRA Tree Node (Level ${level})</h3>
              <button onclick="document.getElementById('add-kra-node-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="KraBuilderComponent.handleAddNodeSubmit(event, '${mainKraId}', '${parentId || ''}')" class="space-y-4 mt-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Node Title / Task Name</label>
                <input type="text" id="node-name" placeholder="e.g. Social Media Creative Campaigns" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500" required />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Owner (Override Ancestor)</label>
                  <select id="node-owner" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option value="">-- Inherit from Ancestor --</option>
                    ${users.filter(u => u.active).map(u => `
                      <option value="${u.id}" ${u.id === inheritedOwnerId ? 'selected' : ''}>${u.name} [${u.role.toUpperCase()}]</option>
                    `).join('')}
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Approval Flow (Override)</label>
                  <select id="node-flow" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option value="">-- Inherit from Ancestor --</option>
                    ${flows.map(f => `
                      <option value="${f.id}" ${f.id === inheritedFlowId ? 'selected' : ''}>${f.name}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Variable Fields (Up to 4 questions answered at daily reporting) -->
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="block font-semibold text-slate-700">Variable Field Questions (Up to 4):</label>
                  <span class="text-[11px] text-slate-400">Pre-filled from ancestor</span>
                </div>
                <div class="space-y-2">
                  <input type="text" id="node-var-1" value="${inheritedVars[0] || ''}" placeholder="Question 1 (e.g. Creative Title)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                  <input type="text" id="node-var-2" value="${inheritedVars[1] || ''}" placeholder="Question 2 (e.g. Target Audience / Platform)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                  <input type="text" id="node-var-3" value="${inheritedVars[2] || ''}" placeholder="Question 3 (Optional)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                  <input type="text" id="node-var-4" value="${inheritedVars[3] || ''}" placeholder="Question 4 (Optional)" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('add-kra-node-modal').remove()" class="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium">Cancel</button>
                <button type="submit" id="btn-create-node" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium shadow">Save Node</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleAddNodeSubmit: async function (e, mainKraId, parentId) {
      e.preventDefault();
      const btn = document.getElementById('btn-create-node');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...`;

      try {
        const name = document.getElementById('node-name').value;
        const ownerId = document.getElementById('node-owner').value;
        const approvalFlowId = document.getElementById('node-flow').value;
        const currentUser = State.getUser();

        const varFields = [
          document.getElementById('node-var-1').value.trim(),
          document.getElementById('node-var-2').value.trim(),
          document.getElementById('node-var-3').value.trim(),
          document.getElementById('node-var-4').value.trim()
        ].filter(v => v);

        const newNode = {
          mainKraId: mainKraId,
          parentId: parentId || null,
          name: name,
          variableFields: varFields,
          ownerId: ownerId,
          approvalFlowId: approvalFlowId,
          createdBy: currentUser.id
        };

        await API.saveKraNode(newNode);
        document.getElementById('add-kra-node-modal').remove();
        App.showToast('KRA node created successfully!', 'success');
        await App.loadInitialData();
      } catch (err) {
        App.showToast(err.message || 'Failed to save node', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Save Node';
      }
    },

    // Edit Node Modal (FR-KRA-09)
    openEditNodeModal: function (nodeId) {
      const node = State.getKraNodeById(nodeId);
      if (!node) return;

      const users = State.get().data.users || [];
      const flows = State.get().data.approvalFlows || [];
      const varFields = (node.variableFields && Array.isArray(node.variableFields)) ? node.variableFields : [];

      const modalHtml = `
        <div id="edit-kra-node-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 class="text-base font-bold text-slate-800">Edit KRA Node</h3>
              <button onclick="document.getElementById('edit-kra-node-modal').remove()" class="text-slate-400 hover:text-slate-600">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onsubmit="KraBuilderComponent.handleEditNodeSubmit(event, '${node.id}')" class="space-y-4 mt-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Node Title</label>
                <input type="text" id="edit-node-name" value="${node.name}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800" required />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Owner</label>
                  <select id="edit-node-owner" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option value="">-- Inherit from Ancestor --</option>
                    ${users.filter(u => u.active).map(u => `
                      <option value="${u.id}" ${u.id === node.ownerId ? 'selected' : ''}>${u.name}</option>
                    `).join('')}
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Approval Flow</label>
                  <select id="edit-node-flow" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <option value="">-- Inherit from Ancestor --</option>
                    ${flows.map(f => `
                      <option value="${f.id}" ${f.id === node.approvalFlowId ? 'selected' : ''}>${f.name}</option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Variable Field Questions:</label>
                <div class="space-y-2">
                  <input type="text" id="edit-var-1" value="${varFields[0] || ''}" placeholder="Question 1" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                  <input type="text" id="edit-var-2" value="${varFields[1] || ''}" placeholder="Question 2" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                  <input type="text" id="edit-var-3" value="${varFields[2] || ''}" placeholder="Question 3" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                  <input type="text" id="edit-var-4" value="${varFields[3] || ''}" placeholder="Question 4" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
                </div>
              </div>

              <div class="pt-3 flex gap-2">
                <button type="button" onclick="document.getElementById('edit-kra-node-modal').remove()" class="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium">Cancel</button>
                <button type="submit" id="btn-update-node" class="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium shadow">Update Node</button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    handleEditNodeSubmit: async function (e, nodeId) {
      e.preventDefault();
      const node = State.getKraNodeById(nodeId);
      if (!node) return;

      const btn = document.getElementById('btn-update-node');
      btn.disabled = true;

      try {
        node.name = document.getElementById('edit-node-name').value;
        node.ownerId = document.getElementById('edit-node-owner').value;
        node.approvalFlowId = document.getElementById('edit-node-flow').value;
        node.variableFields = [
          document.getElementById('edit-var-1').value.trim(),
          document.getElementById('edit-var-2').value.trim(),
          document.getElementById('edit-var-3').value.trim(),
          document.getElementById('edit-var-4').value.trim()
        ].filter(v => v);

        await API.saveKraNode(node);
        document.getElementById('edit-kra-node-modal').remove();
        App.showToast('KRA node updated successfully!', 'success');
        await App.loadInitialData();
      } catch (err) {
        App.showToast(err.message || 'Failed to update', 'error');
        btn.disabled = false;
      }
    },

    // Pre-delete Cascade Confirmation Modal (FR-KRA-10, FR-DI-06)
    confirmDeleteNode: function (nodeId) {
      const allNodes = State.get().data.kraNodes || [];
      const allTasks = State.get().data.tasks || [];

      // Calculate descendants
      const descendantIds = [nodeId];
      function findDescendants(pId) {
        allNodes.filter(n => n.parentId === pId).forEach(n => {
          descendantIds.push(n.id);
          findDescendants(n.id);
        });
      }
      findDescendants(nodeId);

      // Tasks impacted
      const impactedTasks = allTasks.filter(t => descendantIds.includes(t.kraNodeId));

      const modalHtml = `
        <div id="delete-node-modal" class="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <i class="fa-solid fa-triangle-exclamation text-xl"></i>
            </div>
            <h3 class="text-base font-bold text-center text-slate-800">Confirm Cascade Deletion</h3>
            <p class="text-xs text-slate-500 text-center mt-1">
              Deleting this KRA node will permanently delete:
            </p>

            <div class="my-4 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
              <div class="flex justify-between">
                <span class="text-slate-600">Descendant sub-levels:</span>
                <strong class="text-rose-600">${descendantIds.length - 1} node(s)</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Assigned tasks impacted:</span>
                <strong class="text-rose-600">${impactedTasks.length} task(s)</strong>
              </div>
            </div>

            <div class="flex gap-2">
              <button onclick="document.getElementById('delete-node-modal').remove()" class="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-semibold">Cancel</button>
              <button onclick="KraBuilderComponent.executeDeleteNode('${nodeId}')" id="btn-confirm-delete" class="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow">Delete All</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    executeDeleteNode: async function (nodeId) {
      const btn = document.getElementById('btn-confirm-delete');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;

      try {
        await API.deleteKraNode(nodeId);
        document.getElementById('delete-node-modal').remove();
        App.showToast('Node and descendants deleted.', 'success');
        await App.loadInitialData();
        await App.loadTasks();
      } catch (err) {
        App.showToast(err.message || 'Deletion failed', 'error');
        btn.disabled = false;
      }
    }
  };
})();
