/**
 * KARYA - Application Configuration
 */
const CONFIG = {
  APP_NAME: "Karya - KRA Operations Tracking System",
  VERSION: "1.1.0",
  // Google Apps Script Web App Deployment URL
  API_URL: "https://script.google.com/macros/s/AKfycbx9ova5gWLVaro5-XN02UJZIx7wXm5PkrAq0zM8oQPwhj5q-X7Y1V_NVuf9C_F0Zgu8IQ/exec",
  // Google Sheet ID for database
  SPREADSHEET_ID: "1yENjJaB_D8ivVSY9tYV1OS0gXlGG95zW2KnWX73bdyw",
  // Google Drive Folder ID for file uploads & deliverables
  DRIVE_FOLDER_ID: "1tEMREJYUldVFle0uaqUt-ojXQEJtAuuD",
  // Local storage encryption key seed
  CACHE_KEY_SALT: "karya_gretex_secure_salt_2026",
  // Hierarchy Level Definitions
  ROLES: {
    CEO: "ceo",
    ADMIN: "admin",
    HOD: "hod",
    MANAGER: "manager",
    TEAM_LEADER: "team_leader",
    EMPLOYEE: "employee"
  }
};
