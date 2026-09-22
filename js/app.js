/**
 * KARYA - Main Application Orchestrator
 * Bootstraps state, encrypted storage, sidebar navigation, and UI event listeners.
 */
const App = (function () {
  let activeTab = 'myTasks';
  let sidebarOpen = false;

  // Navigation config (label, icon, permission)
  const NAV_LINKS = [
    { id: 'myTasks',        label: 'My Tasks',       icon: 'fa-list-check',         section: 'core',    show: () => true },
    { id: 'approvals',      label: 'Approvals',      icon: 'fa-stamp',              section: 'core',    show: () => true },
    { id: 'projects',       label: 'Projects',       icon: 'fa-diagram-project',    section: 'core',    show: () => true },
    { id: 'hierarchy',      label: 'Org Hierarchy',  icon: 'fa-network-wired',      section: 'core',    show: () => true },
    { id: 'kraBuilder',     label: 'KRA Builder',    icon: 'fa-sitemap',            section: 'manage',  show: () => State.canManageKra() },
    { id: 'taskAssignment', label: 'Allot Tasks',    icon: 'fa-user-plus',          section: 'manage',  show: () => State.canAssignTasks() },
    { id: 'csvImport',      label: 'CSV Import',     icon: 'fa-file-csv',           section: 'manage',  show: () => State.canAssignTasks() },
    { id: 'dashboards',     label: 'Dashboards',     icon: 'fa-chart-pie',          section: 'insight', show: () => State.canViewDashboards() },
    { id: 'reports',        label: 'Reports',        icon: 'fa-chart-line',         section: 'insight', show: () => State.canViewDashboards() },
    { id: 'masterData',     label: 'Master Data',    icon: 'fa-sliders',            section: 'admin',   show: () => State.canAccessAdminScreens() },
  ];

  const SECTION_LABELS = {
    core:    'Main',
    manage:  'Management',
    insight: 'Analytics',
    admin:   'Administration',
  };

  return {
    init: async function () {
      console.log('%cKARYA v' + CONFIG.VERSION + ' — Initializing', 'color:#2563eb;font-weight:700;font-size:12px');

      // Restore session
      const savedUser = SecureStorage.get('session_user');
      if (savedUser) State.setUser(savedUser);

      // Initial data load
      await this.loadInitialData();

      // Auth check
      this.checkAuthAndRender();

      // Listen for background data refresh events
      window.addEventListener('karya:data-refreshed', (e) => {
        State.setInitialData(e.detail);
        this.renderSidebar();
        this.renderCurrentTab();
      });
    },

    loadInitialData: async function (forceRefresh = false) {
      State.setLoading(true);
      try {
        const currentUser = State.getUser();
        const role = currentUser ? currentUser.role : 'employee';
        const initial = await API.getInitialData(role, forceRefresh);
        State.setInitialData(initial);
        await this.loadTasks(forceRefresh);
      } catch (err) {
        console.warn('[KARYA] Initial load (offline/cache mode):', err.message);
        this.showToast('Running in offline cache mode.', 'info');
      } finally {
        State.setLoading(false);
      }
    },

    loadTasks: async function (forceRefresh = false) {
      try {
        const tasks = await API.getTasks({}, forceRefresh);
        State.setTasks(tasks);
        this.renderSidebar();
        this.renderCurrentTab();
      } catch (err) {
        console.warn('[KARYA] Tasks load (cache):', err.message);
      }
    },

    checkAuthAndRender: function () {
      const currentUser = State.getUser();
      if (!currentUser) {
        const existingModal = document.getElementById('login-modal');
        if (!existingModal) {
          document.body.insertAdjacentHTML('beforeend', AuthComponent.renderLoginModal());
        }
      } else {
        const modal = document.getElementById('login-modal');
        if (modal) modal.remove();
        this.renderSidebar();
        this.renderCurrentTab();
      }
    },

    // ─── Sidebar Rendering ────────────────────────────────────────────────
    renderSidebar: function () {
      const currentUser = State.getUser();
      if (!currentUser) return;

      const tasks  = State.get().data.tasks  || [];
      const flows  = State.get().data.approvalFlows || [];
      const isAdminOrCeo = (currentUser.role === 'admin' || currentUser.role === 'ceo');

      // Count pending approvals
      const pendingCount = tasks.filter(task => {
        if (!task.approvalFlowId || task.approvalState !== 'pending') return false;
        const flow = flows.find(f => f.id === task.approvalFlowId);
        if (!flow || !flow.steps) return false;
        const step = flow.steps[Number(task.approvalStepIndex || 0)];
        if (!step) return false;
        if (isAdminOrCeo) return true;
        if (step.approverMode === 'employee' && step.employeeId === currentUser.id) return true;
        if (step.approverMode === 'category' && step.categoryId === currentUser.categoryId) return true;
        return false;
      }).length;

      // Build nav HTML with sections
      const visibleLinks = NAV_LINKS.filter(n => n.show());
      const sections = {};
      visibleLinks.forEach(link => {
        if (!sections[link.section]) sections[link.section] = [];
        sections[link.section].push(link);
      });

      let navHtml = '';
      Object.entries(sections).forEach(([sectionKey, links]) => {
        navHtml += `<div class="sidebar-section-label">${SECTION_LABELS[sectionKey] || sectionKey}</div>`;
        navHtml += links.map(n => {
          const badge = n.id === 'approvals' && pendingCount > 0
            ? `<span class="sidebar-badge">${pendingCount > 99 ? '99+' : pendingCount}</span>`
            : '';
          return `
            <button
              onclick="App.switchTab('${n.id}')"
              class="sidebar-link w-full text-left ${activeTab === n.id ? 'active' : ''}"
              title="${n.label}"
            >
              <span class="nav-icon"><i class="fa-solid ${n.icon}"></i></span>
              <span class="flex-1 truncate">${n.label}</span>
              ${badge}
            </button>
          `;
        }).join('');
      });

      const navEl = document.getElementById('sidebar-nav');
      if (navEl) navEl.innerHTML = navHtml;

      // User footer
      const roleColors = {
        ceo: '#a855f7', admin: '#ef4444', hod: '#6366f1',
        manager: '#0ea5e9', team_leader: '#14b8a6', employee: '#22c55e'
      };
      const roleColor = roleColors[currentUser.role] || '#64748b';
      const footerEl = document.getElementById('sidebar-user');
      if (footerEl) {
        footerEl.innerHTML = `
          <a 
            href="app-working.html" 
            target="_blank" 
            class="sidebar-link mb-2 text-blue-300 hover:text-white hover:bg-blue-600/20 border border-blue-500/20 transition flex items-center justify-between"
            title="Open Complete App Working SOP Manual"
          >
            <span class="flex items-center gap-2">
              <span class="nav-icon text-blue-400"><i class="fa-solid fa-book-open"></i></span>
              <span class="text-xs font-semibold">App Working Guide</span>
            </span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-blue-400 opacity-70"></i>
          </a>
          <div class="sidebar-user-card group relative" onclick="App.toggleUserMenu()">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white flex-shrink-0 badge-role-${currentUser.role}">
              ${currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-200 truncate">${currentUser.name.split(' ')[0]}</p>
              <p class="text-[10px] text-slate-500 capitalize leading-none mt-0.5">${currentUser.designation || currentUser.role}</p>
            </div>
            <i class="fa-solid fa-ellipsis-vertical text-slate-500 text-xs"></i>

            <!-- User dropdown (hidden until toggled) -->
            <div id="user-menu-dropdown" class="hidden absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-xl border border-white/10 shadow-xl overflow-hidden text-xs z-50">
              <div class="px-3 py-2.5 border-b border-white/10">
                <p class="font-semibold text-white">${currentUser.name}</p>
                <p class="text-slate-400 text-[10px] mt-0.5">${currentUser.email || ''}</p>
                <span class="inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-700 text-slate-300">${currentUser.role}</span>
              </div>
              <button onclick="AuthComponent.logout()" class="flex items-center gap-2 w-full px-3 py-2.5 text-rose-400 hover:bg-rose-500/10 transition font-medium">
                <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        `;
      }

      // Top bar user avatar (slim)
      const topUserEl = document.getElementById('navbar-user-section');
      if (topUserEl) {
        topUserEl.innerHTML = `
          <div class="flex items-center gap-2.5">
            <div class="hidden sm:block text-right">
              <p class="text-xs font-semibold text-slate-800 leading-none">${currentUser.name.split(' ')[0]}</p>
              <p class="text-[10px] text-slate-400 leading-none mt-0.5 capitalize">${currentUser.designation || currentUser.role}</p>
            </div>
            <div class="w-8 h-8 rounded-xl font-bold text-xs text-white flex items-center justify-center badge-role-${currentUser.role} cursor-pointer" title="Signed in as ${currentUser.name}">
              ${currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        `;
      }

      // Update breadcrumb
      this._updateBreadcrumb();
    },

    _updateBreadcrumb: function () {
      const crumbEl = document.getElementById('topbar-breadcrumb');
      if (!crumbEl) return;
      const link = NAV_LINKS.find(n => n.id === activeTab);
      if (link) {
        crumbEl.innerHTML = `
          <span class="text-slate-400 text-xs font-medium hidden sm:inline">KARYA</span>
          <span class="text-slate-300 mx-1.5 hidden sm:inline">/</span>
          <span class="text-slate-800 text-sm font-semibold">${link.label}</span>
        `;
      }
    },

    toggleUserMenu: function () {
      const menu = document.getElementById('user-menu-dropdown');
      if (menu) menu.classList.toggle('hidden');
    },

    // ─── Tab Navigation ───────────────────────────────────────────────────
    switchTab: function (tabId) {
      activeTab = tabId;
      State.setActiveTab(tabId);
      this.renderSidebar();
      this.renderCurrentTab();
      // Close mobile sidebar after tab switch
      if (window.innerWidth < 1024) this.closeSidebar();
      // Close user menu if open
      const menu = document.getElementById('user-menu-dropdown');
      if (menu) menu.classList.add('hidden');
    },

    renderCurrentTab: function () {
      const container = document.getElementById('app-main-content');
      if (!container) return;

      const map = {
        myTasks:        () => MyTasksComponent.render(),
        kraBuilder:     () => KraBuilderComponent.render(),
        taskAssignment: () => TaskAssignmentComponent.render(),
        approvals:      () => ApprovalsComponent.render(),
        projects:       () => ProjectsComponent.render(),
        hierarchy:      () => HierarchyComponent.render(),
        dashboards:     () => DashboardsComponent.render(),
        reports:        () => ReportsComponent.render(),
        csvImport:      () => CsvImportComponent.render(),
        masterData:     () => MasterDataComponent.render(),
      };

      const renderFn = map[activeTab] || map.myTasks;
      container.innerHTML = renderFn();
    },

    // ─── Sidebar Mobile Toggle ────────────────────────────────────────────
    toggleSidebar: function () {
      sidebarOpen ? this.closeSidebar() : this.openSidebar();
    },

    openSidebar: function () {
      sidebarOpen = true;
      const sidebar = document.getElementById('app-sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar) sidebar.classList.add('open');
      if (overlay) { overlay.classList.remove('hidden'); overlay.classList.add('open'); }
    },

    closeSidebar: function () {
      sidebarOpen = false;
      const sidebar = document.getElementById('app-sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) { overlay.classList.add('hidden'); overlay.classList.remove('open'); }
    },

    // ─── Toast Notification ───────────────────────────────────────────────
    showToast: function (message, type = 'info') {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
      }

      const configs = {
        success: { bg: 'bg-emerald-600', icon: 'fa-circle-check' },
        error:   { bg: 'bg-rose-600',    icon: 'fa-circle-exclamation' },
        warning: { bg: 'bg-amber-500',   icon: 'fa-triangle-exclamation' },
        info:    { bg: 'bg-slate-800',   icon: 'fa-circle-info' },
      };
      const cfg = configs[type] || configs.info;

      const toast = document.createElement('div');
      toast.className = `toast-enter ${cfg.bg} text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 pointer-events-auto max-w-xs`;
      toast.innerHTML = `<i class="fa-solid ${cfg.icon} flex-shrink-0"></i><span>${message}</span>`;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px) scale(0.95)';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    },

    // Legacy alias (navbar-tabs is now sidebar)
    renderNavbar: function () {
      this.renderSidebar();
    }
  };
})();

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
