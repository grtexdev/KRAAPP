/**
 * KARYA - API Client Wrapper
 * Handles network requests to Google Apps Script, local cache synchronization,
 * and optimistic UI updates.
 */
const API = (function () {
  const BASE_URL = CONFIG.API_URL;

  // Generic request handler
  async function request(endpoint, options = {}) {
    try {
      if (options.method === 'POST') {
        options.redirect = 'follow';
        options.headers = options.headers || {};
        options.headers['Content-Type'] = 'text/plain;charset=utf-8';
      }
      const response = await fetch(endpoint, options);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Operation failed on server");
      }
      return data.data;
    } catch (err) {
      console.error("API Request Error:", err);
      throw err;
    }
  }

  return {
    // Health check
    ping: async function () {
      return await request(`${BASE_URL}?action=ping`);
    },

    // Fetch initial master data & cache in encrypted storage
    getInitialData: async function (role = 'employee', forceRefresh = false) {
      const cacheKey = `initial_data_${role}`;
      if (!forceRefresh) {
        const cached = SecureStorage.get(cacheKey);
        if (cached) {
          // Trigger silent background refresh
          this.silentRefreshInitialData(role, cacheKey);
          return cached;
        }
      }

      const data = await request(`${BASE_URL}?action=getInitialData&role=${encodeURIComponent(role)}`);
      SecureStorage.set(cacheKey, data);
      return data;
    },

    // Silent background sync — errors are intentionally suppressed (offline, 404 proxy redirects, etc.)
    silentRefreshInitialData: async function (role, cacheKey) {
      try {
        const fresh = await request(`${BASE_URL}?action=getInitialData&role=${encodeURIComponent(role)}`);
        SecureStorage.set(cacheKey, fresh);
        window.dispatchEvent(new CustomEvent('karya:data-refreshed', { detail: fresh }));
      } catch (_) {
        // Silently ignore — cached data will be used
      }
    },

    // Fetch tasks
    getTasks: async function (filters = {}, forceRefresh = false) {
      const queryParams = new URLSearchParams({ action: 'getTasks', ...filters });
      const cacheKey = `tasks_${JSON.stringify(filters)}`;
      
      if (!forceRefresh) {
        const cached = SecureStorage.get(cacheKey);
        if (cached) return cached;
      }

      const tasks = await request(`${BASE_URL}?${queryParams.toString()}`);
      SecureStorage.set(cacheKey, tasks);
      return tasks;
    },

    // Authenticate user by name or email + PIN
    login: async function (identifier, pin) {
      return await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'auth',
          identifier: identifier,
          pin: pin
        })
      });
    },

    // Master record CRUD
    saveMasterRecord: async function (table, record) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveMasterRecord',
          table: table,
          record: record
        })
      });
      // Invalidate cache
      SecureStorage.clearAll();
      return res;
    },

    batchSaveMasterRecords: async function (table, records) {
      if (!records || records.length === 0) return { success: true, count: 0 };
      try {
        const res = await request(BASE_URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'batchSaveMasterRecords',
            table: table,
            records: records
          })
        });
        SecureStorage.clearAll();
        return res;
      } catch (err) {
        console.warn("Batch save endpoint not available, falling back to sequential:", err.message);
        // Fallback: sequential save
        for (const rec of records) {
          await this.saveMasterRecord(table, rec);
        }
        SecureStorage.clearAll();
        return { success: true, count: records.length };
      }
    },

    deleteMasterRecord: async function (table, id, replacementId = null) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteMasterRecord',
          table: table,
          id: id,
          replacementId: replacementId
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // KRA node save / delete
    saveKraNode: async function (node) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveKraNode',
          node: node
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    deleteKraNode: async function (nodeId) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteKraNode',
          nodeId: nodeId
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // Task Assignment (Fan-out batch)
    assignTasks: async function (tasks, groupId = null) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'assignTasks',
          tasks: tasks,
          groupId: groupId
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // Daily effort logging
    updateTaskDailyLog: async function (taskId, date, minutes, varAnswers = {}, status = null, remarks = '', reason = '') {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateTaskDailyLog',
          taskId: taskId,
          date: date,
          minutes: minutes,
          var1: varAnswers.var1,
          var2: varAnswers.var2,
          var3: varAnswers.var3,
          var4: varAnswers.var4,
          status: status,
          remarks: remarks,
          reason: reason
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // Update status
    updateTaskStatus: async function (taskId, status, actorId) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateTaskStatus',
          taskId: taskId,
          status: status,
          actorId: actorId
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // Reassign task
    reassignTask: async function (taskId, toUserId, remarks, actorId) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'reassignTask',
          taskId: taskId,
          toUserId: toUserId,
          remarks: remarks,
          actorId: actorId
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // Submit for approval with attachments
    submitApproval: async function (taskId, actorId, remarks, attachments) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'submitApproval',
          taskId: taskId,
          actorId: actorId,
          remarks: remarks,
          attachments: attachments
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // Action approval (approve or rework)
    actionApproval: async function (taskId, decision, actorId, remarks, byAdmin = false) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'actionApproval',
          taskId: taskId,
          decision: decision, // 'approve' | 'rework'
          actorId: actorId,
          remarks: remarks,
          byAdmin: byAdmin
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // Upload base64 file to Google Drive
    uploadFile: async function (fileName, base64Data, mimeType) {
      return await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'uploadFile',
          fileName: fileName,
          base64Data: base64Data,
          mimeType: mimeType
        })
      });
    },

    // Performance review
    saveReview: async function (review) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveReview',
          review: review
        })
      });
      SecureStorage.clearAll();
      return res;
    },

    // CSV Import
    importCsvTasks: async function (tasks, groupId) {
      const res = await request(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'importCsvTasks',
          tasks: tasks,
          groupId: groupId
        })
      });
      SecureStorage.clearAll();
      return res;
    }
  };
})();
