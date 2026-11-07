# Implementation Plan: 1008 ஸ்ரீ விருஷபநாத ஜிநாலயம் (Othalavadi) Portal Customization & Mobile-First Overhaul

**Date:** 2026-11-08  
**Design Spec:** [2026-11-08-othalavadi-jinalayam-customization-and-mobile-refactor-design.md](file:///d:/VS/temple-ledger/docs/superpowers/specs/2026-11-08-othalavadi-jinalayam-customization-and-mobile-refactor-design.md)  
**Status:** In Progress  

---

## Proposed Changes

### Backend
1. **Migration `V7__seed_custom_super_admin.sql`**:
   - Seeds Super Admin `adithiyan1` with role `ROLE_SUPER_ADMIN` and BCrypt hash for `Mahaveer2024@`.
2. **Password Management Services & Endpoints**:
   - `ChangePasswordRequest.java` & `AdminResetPasswordRequest.java` in `com.temple.ledger.dto.security`.
   - `UserService.java`:
     - `void changePassword(String username, ChangePasswordRequest request)`
     - `void adminResetPassword(UUID userId, AdminResetPasswordRequest request, String adminUsername)`
   - `AuthController.java`:
     - `POST /api/v1/auth/change-password`
   - `AdminController.java`:
     - `PATCH /api/v1/admin/users/{userId}/password`
   - Audit logging for password changes in `AuditService`.
   - Unit & MockMvc tests in `UserServiceTest.java` and `SecurityAndAuditTest.java`.

### Frontend
1. **Localization & Rebranding**:
   - `frontend/src/locales/ta.json` and `frontend/src/locales/en.json`:
     - Eliminate all occurrences of "பேரேடு" (PEREDU); replace with "வரவு செலவு கணக்கு" and "முழு வரவு செலவு விவரம்".
     - Set application title to **1008 ஸ்ரீ விருஷபநாத ஜிநாலயம் - வரவு செலவு கணக்கு** / **1008 Sri Vrishabhanatha Jinalayam - Income & Expense Portal**.
     - Website badge: `https://othalavadi-jinalayam.in`.
   - `frontend/index.html`: Update title and metadata.
   - `frontend/src/i18n.test.js`: Update assertions.
2. **Login Screen**:
   - Remove demo credentials / sample username card in `frontend/src/pages/Login.jsx`.
3. **Password Management UI**:
   - `frontend/src/components/ChangePasswordModal.jsx`: Self-service password change modal with validation and alerts.
   - `frontend/src/components/Navbar.jsx`: Wire "Change Password" button in desktop user menu and mobile drawer.
   - `frontend/src/pages/admin/UserManagement.jsx`: Add "Reset Password" button per user row with admin modal.
4. **Mobile-First Responsive Enhancements**:
   - `Navbar.jsx`: 44px+ touch targets, mobile EN/தமிழ் button on top header, slide-down drawer.
   - `PublicDashboard.jsx`: 1-column mobile cards, responsive Recharts aspect ratio and legend wrapping.
   - `DriveProgressBoard.jsx`: Stacked mobile metric banner, horizontal scroll with sticky identity column.
   - `MasterDataGrid.jsx`: Collapsible filters on mobile, touch-friendly filter dropdowns.
   - `DonationEntry.jsx` & `ExpenseEntry.jsx`: Full-width inputs, `inputMode` numeric keyboards, sticky bottom submit action on mobile.
   - `ReceiptModal.jsx`: Viewport-aware scrolling, full-width WhatsApp Share and Print buttons.

---

## Plan Tasks

### Task 1: Super Admin Seeding Migration (`adithiyan1` / `Mahaveer2024@`)
- Generate BCrypt hash for `Mahaveer2024@`.
- Create `backend/src/main/resources/db/migration/V7__seed_custom_super_admin.sql`.
- Write unit test in `SecurityAndAuditTest` verifying `adithiyan1` authenticates with `Mahaveer2024@`.
- Run tests and commit.

### Task 2: Backend Password Management Subsystem
- Create `ChangePasswordRequest.java` and `AdminResetPasswordRequest.java`.
- Implement `changePassword` and `adminResetPassword` in `UserService.java`.
- Expose `POST /api/v1/auth/change-password` in `AuthController.java` and `PATCH /api/v1/admin/users/{userId}/password` in `AdminController.java`.
- Add test coverage in `SecurityAndAuditTest.java`.
- Run `mvn -f backend/pom.xml test` and commit.

### Task 3: Localization Overhaul & Temple Rebranding
- Edit `frontend/src/locales/ta.json` and `en.json`.
- Replace all "பேரேடு" with natural Tamil phrases ("வரவு செலவு கணக்கு", "முழு வரவு செலவு விவரம்").
- Set temple title to `1008 ஸ்ரீ விருஷபநாத ஜிநாலயம், ஒத்தலவாடி` and domain link `https://othalavadi-jinalayam.in`.
- Update `frontend/index.html`.
- Update `frontend/src/i18n.test.js` and verify passing.
- Commit.

### Task 4: Login Screen Sanitization & Password UI
- Edit `frontend/src/pages/Login.jsx`: remove quick demo card (`admin`/`operator1`).
- Implement `frontend/src/components/ChangePasswordModal.jsx`.
- Integrate `ChangePasswordModal` into `Navbar.jsx` (desktop & mobile).
- Add password reset action in `frontend/src/pages/admin/UserManagement.jsx`.
- Update frontend tests and commit.

### Task 5: Mobile-First Responsive Overhaul
- Update `Navbar.jsx` with mobile header layout, 44px+ tap targets, quick language toggle.
- Update `PublicDashboard.jsx` for 1-column mobile grid and responsive charts.
- Update `DriveProgressBoard.jsx` and `MasterDataGrid.jsx` for mobile scrolling and filters.
- Update `DonationEntry.jsx` and `ExpenseEntry.jsx` with touch inputs and sticky mobile actions.
- Update `ReceiptModal.jsx` for mobile viewport fitting and 1-tap WhatsApp sharing.
- Verify `npm run build --prefix frontend`.
- Commit.

### Task 6: End-to-End Verification & Cloud Deployment
- Run all backend tests (`mvn test`).
- Run all frontend tests and production build (`npm test`, `npm run build`).
- Push to GitHub `origin/master`.
- Live check: verify `adithiyan1` login and public dashboard on `https://temple-ledger-backend.vercel.app`.
