# KARYA - Frontend Application (HTML, CSS, JS Single Page App)

Yeh Karya application ka complete responsive web frontend hai jo Google Sheets backend API aur Google Drive storage se connected hai.

---

## Features Implemented

1. **6-Tier User Hierarchy & PIN Authentication**:
   - Role-based line of sight: **CEO → Admin → HOD → Manager → Team Leader → Employee**
   - 4–6 digit PIN login (`1234` default)
   - Visual organizational reporting tree
2. **KRA Hierarchy Builder**:
   - Unlimited depth tree (Main KRA → Sub KRA → Task → Sub Task L1, L2...)
   - Nearest-ancestor inheritance for Variable Field questions, Owners, and Approval Flows
   - Pre-delete impact summary and cascade deletion
3. **Task Allotment & Fan-Out**:
   - Multi-filter searchable KRA table
   - Multi-node × multi-assignee batch fan-out under shared `groupId`
   - Recurrence windows (Daily, Weekly, Monthly, Custom)
4. **My Tasks & Daily Reporting**:
   - Reporting date picker
   - Daily minutes logging with direct accumulation into cumulative total
   - Dynamic prompts for node's variable field questions
   - Task reassignment with mandatory hand-over remarks
   - Deliverable submission with file upload to Google Drive
5. **Approvals Inbox**:
   - Approver resolution by named user or User Category (designation)
   - Preview of Google Drive deliverables
   - Approve & Advance or Send Back for Correction (rework loop with mandatory reason)
   - Full chronological activity trail
6. **Projects & Bulk Task Matrix**:
   - Project team overview, effort logged, and derived manpower cost
   - Inline multi-row bulk task builder matrix
7. **Executive Dashboards & Reports**:
   - Manpower cost derived: `(minutes ÷ 480) × (salary ÷ 30)`
   - 5-bucket ageing profile (0–7, 8–15, 16–30, 31–90, >90 days)
   - Employee scorecard with 0–5 performance review ratings
   - Organization-wide audit feed (up to 300 entries)
8. **CSV Importer**:
   - Live downloadable template pre-filled with live workspace values
   - 19-column parser with in-memory validation preview
9. **Encrypted Local Storage Caching**:
   - Sensitive master data, user session, and tasks are encrypted and cached in browser `localStorage` for sub-second UI interactions.

---

## Local Run Kaise Karein

### Option A: VS Code Live Server
1. VS Code me `04. Frontend` folder open karein.
2. `index.html` file pe right click karke **"Open with Live Server"** select karein.

### Option B: Python Local Server
VS Code terminal me run karein:
```bash
cd "04. Frontend"
python -m http.server 8000
```
Browser me open karein: `http://localhost:8000`

---

## GitHub Pages Deployment
1. Is repository ko GitHub pe push karein.
2. Repository ke **Settings > Pages** me jayein.
3. **Branch**: `main` (ya `master`), **Folder**: `/04. Frontend` (ya root) select karke **Save** karein.
4. Kuch hi second me aapki app live ho jayegi!
