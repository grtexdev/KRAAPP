/**
 * KARYA - Standard UserID / Email & Password Authentication Component
 */
const AuthComponent = (function () {
  return {
    renderLoginModal: function () {
      return `
        <div id="login-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);">
          <!-- Animated BG blobs -->
          <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none" style="background:radial-gradient(circle,#2563eb,transparent);filter:blur(60px);animation:pulse-sync 4s infinite;"></div>
          <div class="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 pointer-events-none" style="background:radial-gradient(circle,#7c3aed,transparent);filter:blur(60px);animation:pulse-sync 4s 1s infinite;"></div>
          <div class="modal-panel max-w-sm w-full p-8 relative z-10">
            <!-- App Branding -->
            <div class="text-center mb-6">
              <div class="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/30">
                <i class="fa-solid fa-layer-group text-2xl text-white"></i>
              </div>
              <h2 class="text-2xl font-black text-slate-800 tracking-tight">KARYA</h2>
              <p class="text-xs font-medium text-slate-500 mt-0.5">KRA / KPI Operations Tracking System</p>
              <div class="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Gretex Group
              </div>
            </div>

            <!-- Normal Login Form: UserID/Email and Password -->
            <form id="login-form" class="space-y-4" onsubmit="AuthComponent.handleLogin(event)">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  User ID / Email Address
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-regular fa-envelope text-sm"></i>
                  </div>
                  <input 
                    type="text" 
                    id="login-identifier" 
                    placeholder="e.g. admin@gretex.com or usr_admin" 
                    class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                    required 
                    autocomplete="username"
                  />
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password / PIN
                  </label>
                  <span class="text-[11px] text-slate-400 font-medium">Default: 1234</span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i class="fa-solid fa-lock text-sm"></i>
                  </div>
                  <input 
                    type="password" 
                    id="login-password" 
                    placeholder="Enter your password" 
                    class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                    required 
                    autocomplete="current-password"
                  />
                  <button 
                    type="button" 
                    onclick="AuthComponent.togglePasswordVisibility()" 
                    class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    <i id="password-eye-icon" class="fa-regular fa-eye text-sm"></i>
                  </button>
                </div>
              </div>

              <!-- Error Box -->
              <div id="login-error" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3 text-center font-medium"></div>

              <!-- Submit Login Button -->
              <button 
                type="submit" 
                id="login-btn" 
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/25 transition duration-150 flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <span>Login</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </form>

            <!-- Quick Demo Credentials helper -->
            <div class="mt-6 pt-4 border-t border-slate-100">
              <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
                Quick Demo Accounts (Password: 1234)
              </div>
              <div class="flex flex-wrap justify-center gap-1.5 text-[11px]">
                <button type="button" onclick="AuthComponent.fillCredentials('ceo@gretex.com', '1234')" class="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-semibold transition">
                  👑 CEO
                </button>
                <button type="button" onclick="AuthComponent.fillCredentials('admin@gretex.com', '1234')" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold transition">
                  🛡️ Admin
                </button>
                <button type="button" onclick="AuthComponent.fillCredentials('sunita@gretex.com', '1234')" class="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-semibold transition">
                  🏢 HOD
                </button>
                <button type="button" onclick="AuthComponent.fillCredentials('vikram@gretex.com', '1234')" class="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold transition">
                  👔 Manager
                </button>
                <button type="button" onclick="AuthComponent.fillCredentials('priya@gretex.com', '1234')" class="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-semibold transition">
                  👥 TL
                </button>
                <button type="button" onclick="AuthComponent.fillCredentials('rahul@gretex.com', '1234')" class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold transition">
                  💼 Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    togglePasswordVisibility: function () {
      const input = document.getElementById('login-password');
      const icon = document.getElementById('password-eye-icon');
      if (!input || !icon) return;

      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash text-sm text-blue-600';
      } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye text-sm text-slate-400';
      }
    },

    fillCredentials: function (identifier, password) {
      const idInput = document.getElementById('login-identifier');
      const passInput = document.getElementById('login-password');
      if (idInput && passInput) {
        idInput.value = identifier;
        passInput.value = password;
        idInput.focus();
      }
    },

    handleLogin: async function (e) {
      e.preventDefault();
      const identifierInput = document.getElementById('login-identifier');
      const passwordInput = document.getElementById('login-password');
      const errorDiv = document.getElementById('login-error');
      const btn = document.getElementById('login-btn');

      const identifier = (identifierInput.value || '').trim();
      const password = (passwordInput.value || '').trim();

      if (!identifier || !password) {
        errorDiv.textContent = 'Please enter both UserID/Email and Password.';
        errorDiv.classList.remove('hidden');
        return;
      }

      errorDiv.classList.add('hidden');
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Signing in...`;

      try {
        let authenticatedUser = null;

        // 1. Authenticate against Backend API
        try {
          const authResult = await API.login(identifier, password);
          if (authResult && authResult.authenticated && authResult.user) {
            authenticatedUser = authResult.user;
          }
        } catch (apiErr) {
          console.warn("Backend API login attempt note:", apiErr.message);

          // 2. Client-side fallback if server didn't match ID or was offline
          const users = State.get().data.users || [];
          const lowerId = identifier.toLowerCase();
          const localMatch = users.find(u => {
            if (!u.active) return false;
            const matchEmail = u.email && u.email.trim().toLowerCase() === lowerId;
            const matchId = u.id && u.id.trim().toLowerCase() === lowerId;
            const matchName = u.name && u.name.trim().toLowerCase() === lowerId;
            const matchNamePartial = u.name && u.name.toLowerCase().includes(lowerId);
            return matchEmail || matchId || matchName || matchNamePartial;
          });

          if (localMatch) {
            // Check pin if not masked, or allow default 1234
            const localPin = String(localMatch.pin || '').trim();
            if (localPin === '****' || localPin === password || password === '1234') {
              authenticatedUser = localMatch;
            } else {
              throw new Error('Incorrect password. Please try again.');
            }
          } else {
            throw new Error(apiErr.message || 'User not found. Check your UserID/Email.');
          }
        }

        if (!authenticatedUser) {
          throw new Error('Authentication failed. Check your User ID / Email and Password.');
        }

        // Save authenticated session user
        State.setUser(authenticatedUser);

        // Reload fresh initial data scoped to authenticated user's role
        await App.loadInitialData(true);

        // Remove login modal
        const modal = document.getElementById('login-modal');
        if (modal) modal.remove();

        App.showToast(`Welcome back, ${authenticatedUser.name}!`, 'success');

        // Render dashboard / tasks
        App.renderNavbar();
        App.switchTab('myTasks');
      } catch (err) {
        errorDiv.textContent = err.message || 'Login failed.';
        errorDiv.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Sign In</span><i class="fa-solid fa-arrow-right text-sm ml-1"></i>`;
      }
    },

    logout: function () {
      State.clearUser();
      App.showToast('You have been signed out.', 'info');
      App.checkAuthAndRender();
    }
  };
})();
