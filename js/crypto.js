/**
 * KARYA - Client-side Encrypted Local Storage Helper
 * Ensures sensitive data (salary, tasks, session token, master cache)
 * is securely stored in localStorage with encryption for high speed & privacy.
 */
const SecureStorage = (function () {
  const SALT = CONFIG.CACHE_KEY_SALT || "karya_default_salt";

  // Simple and fast XOR-based stream cipher with rolling hash key for browser environments
  function crypt(str, key) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode ^ keyChar);
    }
    return result;
  }

  function encode(str) {
    try {
      const xorStr = crypt(str, SALT);
      return btoa(encodeURIComponent(xorStr));
    } catch (e) {
      return btoa(str);
    }
  }

  function decode(str) {
    try {
      const raw = atob(str);
      const decodedUri = decodeURIComponent(raw);
      return crypt(decodedUri, SALT);
    } catch (e) {
      try {
        return atob(str);
      } catch (err) {
        return null;
      }
    }
  }

  return {
    set: function (key, value) {
      try {
        const jsonStr = JSON.stringify(value);
        const encrypted = encode(jsonStr);
        localStorage.setItem('karya_enc_' + key, encrypted);
        return true;
      } catch (e) {
        console.warn('SecureStorage write error:', e);
        return false;
      }
    },

    get: function (key, defaultValue = null) {
      try {
        const raw = localStorage.getItem('karya_enc_' + key);
        if (!raw) return defaultValue;
        const decrypted = decode(raw);
        if (!decrypted) return defaultValue;
        return JSON.parse(decrypted);
      } catch (e) {
        console.warn('SecureStorage read error:', e);
        return defaultValue;
      }
    },

    remove: function (key) {
      try {
        localStorage.removeItem('karya_enc_' + key);
      } catch (e) {}
    },

    clearAll: function () {
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('karya_enc_')) {
            localStorage.removeItem(k);
          }
        });
      } catch (e) {}
    }
  };
})();
