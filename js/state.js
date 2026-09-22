/**
 * KARYA - Global State & Data Models
 * Central reactive store with BRD inheritance rules & hierarchical line-of-sight.
 */
const State = (function () {
  const store = {
    currentUser: null,
    activeTab: 'myTasks',
    isLoading: false,
    data: {
      users: [],
      locations: [],
      departments: [],
      businessUnits: [],
      userCategories: [],
      projects: [],
      mainKras: [],
      kraNodes: [],
      approvalFlows: [],
      tasks: [],
      reviews: []
    }
  };

  return {
    get: function () {
      return store;
    },

    getUser: function () {
      return store.currentUser;
    },

    setUser: function (user) {
      store.currentUser = user;
      SecureStorage.set('session_user', user);
      window.dispatchEvent(new CustomEvent('karya:user-changed', { detail: user }));
    },

    clearUser: function () {
      store.currentUser = null;
      SecureStorage.remove('session_user');
      window.dispatchEvent(new CustomEvent('karya:user-changed', { detail: null }));
    },

    setLoading: function (loading) {
      store.isLoading = loading;
      const loaderEl = document.getElementById('global-loader');
      if (loaderEl) {
        loaderEl.style.display = loading ? 'flex' : 'none';
      }
    },

    setActiveTab: function (tabName) {
      store.activeTab = tabName;
      window.dispatchEvent(new CustomEvent('karya:tab-changed', { detail: tabName }));
    },

    setInitialData: function (initialData) {
      store.data.users = initialData.users || [];
      store.data.locations = initialData.locations || [];
      store.data.departments = initialData.departments || [];
      store.data.businessUnits = initialData.businessUnits || [];
      store.data.userCategories = initialData.userCategories || [];
      store.data.projects = initialData.projects || [];
      store.data.mainKras = initialData.mainKras || [];
      store.data.kraNodes = initialData.kraNodes || [];
      store.data.approvalFlows = initialData.approvalFlows || [];
      window.dispatchEvent(new CustomEvent('karya:data-updated'));
    },

    setTasks: function (tasks) {
      store.data.tasks = tasks || [];
      window.dispatchEvent(new CustomEvent('karya:tasks-updated'));
    },

    // =========================================================================
    // LOOKUP HELPERS
    // =========================================================================
    getUserById: function (id) {
      return store.data.users.find(u => u.id === id) || null;
    },

    getLocationById: function (id) {
      return store.data.locations.find(l => l.id === id) || null;
    },

    getDepartmentById: function (id) {
      return store.data.departments.find(d => d.id === id) || null;
    },

    getProjectById: function (id) {
      return store.data.projects.find(p => p.id === id) || null;
    },

    getMainKraById: function (id) {
      return store.data.mainKras.find(m => m.id === id) || null;
    },

    getKraNodeById: function (id) {
      return store.data.kraNodes.find(n => n.id === id) || null;
    },

    getApprovalFlowById: function (id) {
      return store.data.approvalFlows.find(f => f.id === id) || null;
    },

    // Builds breadcrumb path: "GIL Turnover > Marketing > Social Media"
    getKraFullPath: function (nodeId) {
      if (!nodeId) return "";
      const node = this.getKraNodeById(nodeId);
      if (!node) return "";

      const parts = [node.name];
      let curr = node;
      while (curr.parentId) {
        const parent = this.getKraNodeById(curr.parentId);
        if (parent) {
          parts.unshift(parent.name);
          curr = parent;
        } else {
          break;
        }
      }

      const mainKra = this.getMainKraById(node.mainKraId);
      if (mainKra) {
        parts.unshift(mainKra.name);
      }

      return parts.join(" > ");
    },

    // Variable Fields Inheritance (FR-KRA-07 / Section 8.3: Nearest-Ancestor-Wins)
    resolveEffectiveVariableFields: function (nodeId) {
      if (!nodeId) return [];
      let curr = this.getKraNodeById(nodeId);
      while (curr) {
        if (curr.variableFields && Array.isArray(curr.variableFields) && curr.variableFields.length > 0) {
          const valid = curr.variableFields.filter(f => f && String(f).trim().length > 0);
          if (valid.length > 0) return valid;
        }
        curr = curr.parentId ? this.getKraNodeById(curr.parentId) : null;
      }
      return [];
    },

    // Owner Inheritance (FR-KRA-08: Nearest-Ancestor-Wins, falls back to Main KRA owner)
    resolveEffectiveOwnerId: function (nodeId) {
      if (!nodeId) return "";
      let curr = this.getKraNodeById(nodeId);
      while (curr) {
        if (curr.ownerId) return curr.ownerId;
        curr = curr.parentId ? this.getKraNodeById(curr.parentId) : null;
      }
      const node = this.getKraNodeById(nodeId);
      if (node && node.mainKraId) {
        const main = this.getMainKraById(node.mainKraId);
        if (main && main.ownerId) return main.ownerId;
      }
      return "";
    },

    // Approval Flow Inheritance (FR-KRA-08 / FR-APR-04: Nearest-Ancestor-Wins)
    resolveEffectiveApprovalFlowId: function (nodeId) {
      if (!nodeId) return "";
      let curr = this.getKraNodeById(nodeId);
      while (curr) {
        if (curr.approvalFlowId) return curr.approvalFlowId;
        curr = curr.parentId ? this.getKraNodeById(curr.parentId) : null;
      }
      const node = this.getKraNodeById(nodeId);
      if (node && node.mainKraId) {
        const main = this.getMainKraById(node.mainKraId);
        if (main && main.approvalFlowId) return main.approvalFlowId;
      }
      return "";
    },

    // Role Permissions & Line-of-sight Check
    canAccessAdminScreens: function () {
      const u = store.currentUser;
      return u && (u.role === 'admin' || u.role === 'ceo');
    },

    canManageKra: function () {
      const u = store.currentUser;
      return u && (u.role === 'admin' || u.role === 'ceo' || u.role === 'hod' || u.role === 'manager');
    },

    canAssignTasks: function () {
      const u = store.currentUser;
      return u && (u.role === 'admin' || u.role === 'ceo' || u.role === 'hod' || u.role === 'manager' || u.role === 'team_leader');
    },

    canViewDashboards: function () {
      const u = store.currentUser;
      return u && (u.role === 'admin' || u.role === 'ceo' || u.role === 'hod' || u.role === 'manager');
    },

    canViewSalary: function () {
      const u = store.currentUser;
      return u && (u.role === 'admin' || u.role === 'ceo' || u.role === 'hod');
    }
  };
})();
