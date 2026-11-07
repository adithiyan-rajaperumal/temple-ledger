# Design Spec: 1008 ஸ்ரீ விருஷபநாத ஜிநாலயம் (Othalavadi) Customization, Password Management & Mobile-First Responsive Experience

**Document Date:** 2026-11-08  
**Temple Name:** 1008 ஸ்ரீ விருஷபநாத ஜிநாலயம், ஒத்தலவாடி (1008 Sri Vrishabhanatha Jinalayam, Othalavadi)  
**Domain:** [https://othalavadi-jinalayam.in](https://othalavadi-jinalayam.in)  
**Status:** Approved by User  

---

## 1. Executive Summary

This specification formalizes the transformation of the Temple & Community Ledger into a dedicated, community-facing income and expense management portal for **1008 ஸ்ரீ விருஷபநாத ஜிநாலயம், ஒத்தலவாடி** (`https://othalavadi-jinalayam.in`).

Key pillars:
1. **Localization & Branding**: Eliminate confusing technical terms like "பேரேடு" (PEREDU) in favor of intuitive, conversational Tamil ("வரவு செலவு கணக்கு" / "முழு வரவு செலவு விவரம்"). Brand the application for **1008 ஸ்ரீ விருஷபநாத ஜிநாலயம்** across all navigation headers, metadata, receipts, and public dashboards.
2. **Mobile-First Responsive Design**: Optimize every page (Public Dashboard, Family Drives, Master Transactions Grid, Admin Forms, Receipt Modal) for smartphones (360px–414px viewports), with touch-friendly controls, responsive grids, and clean tabular-to-card presentations.
3. **Login Security**: Eliminate all hardcoded demo/sample credential prompts (`admin` / `operator1`) from the login interface.
4. **Super Admin Provisioning**: Configure Super Admin `adithiyan1` with password `Mahaveer2024@` directly into PostgreSQL via Flyway migration.
5. **Password Management**: Provide full password change capabilities:
   - Self-service password change for the currently authenticated user (`POST /api/v1/auth/change-password`).
   - Super Admin reset for other users in the User Management console (`PATCH /api/v1/admin/users/{userId}/password`).
   - Full audit logging of all credential mutations.

---

## 2. Localization & Branding Architecture

### 2.1 Terminology Updates

| Context | Previous English | Previous Tamil | Updated English | Updated Tamil (Natural Phrasing) |
|---|---|---|---|---|
| Application Title | Temple & Community Ledger | கோவில் & கிராம பேரேடு | 1008 Sri Vrishabhanatha Jinalayam - Income & Expense Portal | 1008 ஸ்ரீ விருஷபநாத ஜிநாலயம் - வரவு செலவு கணக்கு |
| Subtitle / Web Link | Transparency Portal | வெளிப்படைத்தன்மை தளம் | Official Portal: othalavadi-jinalayam.in | othalavadi-jinalayam.in நேரலை கணக்கு |
| Master Ledger Nav | Master Ledger | அனைத்து வரவு செலவுகள் | Master Transactions / All Entries | முழு வரவு செலவு விவரம் |
| Digital Receipt Verification | Verified via Online Ledger | நேரலை பேரேடு மூலம் சரிபார்க்கப்பட்டது | Verified via othalavadi-jinalayam.in | othalavadi-jinalayam.in நேரலை கணக்கு மூலம் சரிபார்க்கப்பட்டது |
| Receipt Temple Header | Arulmigu Temple Renovation Fund | அருள்மிகு திருக்கோவில் திருப்பணி நிதி | 1008 Sri Vrishabhanatha Jinalayam Renovation Fund | 1008 ஸ்ரீ விருஷபநாத ஜிநாலயம் திருப்பணி நிதி |

### 2.2 Metadata & Browser Title
- `<title>` in `frontend/index.html`: `1008 ஸ்ரீ விருஷபநாத ஜிநாலயம் | othalavadi-jinalayam.in`
- Favicon and OpenGraph metadata reflecting the temple portal.

---

## 3. Security & Super Admin Credentials

### 3.1 Super Admin Seeding
- **Username**: `adithiyan1`
- **Initial Password**: `Mahaveer2024@`
- **Role**: `ROLE_SUPER_ADMIN`
- **Database Migration**: `V7__seed_custom_super_admin.sql` executes an idempotent SQL upsert into `users` table:
  - Generates BCrypt hash for `Mahaveer2024@`.
  - Sets `is_active = true`.
  - Also ensures existing default admin `admin` (if present) is kept or aliased without interfering with `adithiyan1`.

### 3.2 Login Screen Sanitization
- Remove the "Quick Demo Access" card entirely from `frontend/src/pages/Login.jsx`.
- Retain only the secure input fields (Username, Password with toggle visibility), submit button, and a link back to the Public Dashboard.

---

## 4. Password Management Subsystem

### 4.1 Backend APIs

#### 4.1.1 Self-Service Password Change
- **Endpoint**: `POST /api/v1/auth/change-password`
- **Authentication**: Bearer JWT (any active user: Super Admin or Data Entry)
- **Request Body**:
  ```json
  {
    "currentPassword": "old_secret_here",
    "newPassword": "new_secret_here"
  }
  ```
- **Business Logic**:
  1. Extract authenticated username from `SecurityContext`.
  2. Verify `currentPassword` matches `user.passwordHash` using `PasswordEncoder.matches`. Throw `BadCredentialsException("Current password is incorrect")` on mismatch.
  3. Validate `newPassword`: minimum 6 characters, not blank.
  4. Encode `newPassword` and update `user.passwordHash`.
  5. Log audit action: `USER`, `userId`, `UPDATE_PASSWORD`, `username`, change reason: "User changed own password".

#### 4.1.2 Super Admin Reset Password
- **Endpoint**: `PATCH /api/v1/admin/users/{userId}/password`
- **Authentication**: Bearer JWT with `ROLE_SUPER_ADMIN`
- **Request Body**:
  ```json
  {
    "newPassword": "new_secret_here"
  }
  ```
- **Business Logic**:
  1. Look up user by `userId`. Throw `ResourceNotFoundException` if missing.
  2. Validate `newPassword` minimum 6 characters.
  3. Encode `newPassword` and update `user.passwordHash`.
  4. Log audit action: `USER`, `userId`, `RESET_PASSWORD`, `adminUsername`, change reason: "Super Admin reset user password for: " + targetUsername.

### 4.2 Frontend UI Components
1. **Change Password Modal (`frontend/src/components/ChangePasswordModal.jsx`)**:
   - Triggerable from Navbar desktop and mobile user profile dropdown/menu.
   - Form fields: Current Password, New Password, Confirm New Password.
   - Validation: Passwords match, minimum 6 characters.
   - Feedback: Success alert and automatic closure.
2. **User Management Password Reset (`frontend/src/pages/admin/UserManagement.jsx`)**:
   - Add a key icon / "Reset Password" button to each user card in the list.
   - Opens an Admin Reset modal requiring only the new password.

---

## 5. Mobile-First Responsive Overhaul

### 5.1 Responsive Standards Across All Pages
- **Touch Target Sizing**: Minimum 44px $\times$ 44px for buttons, pills, dropdown triggers, and links.
- **Form Inputs**: Full width (`w-full`), proper HTML5 keyboard types (`inputMode="numeric"` for phone/receipt numbers, `inputMode="decimal"` for amounts).
- **Sticky Actions**: Mobile action bars for quick form submission ("Record Donation", "Save Expense") to prevent unnecessary vertical scrolling.
- **Horizontal Overflow Prevention**: Set appropriate `overflow-x-auto` on tabular data containers with shadow indicators so users know they can swipe.

### 5.2 Specific Page Enhancements

#### A. Navbar (`Navbar.jsx`)
- Mobile header shows the temple title with responsive truncation (`max-w-[200px] sm:max-w-none`).
- Instant `EN | தமிழ்` toggle button prominently placed in the mobile header without opening the menu.
- Mobile drawer includes navigation links, user profile details, "Change Password" action, and logout.

#### B. Public Transparency Dashboard (`PublicDashboard.jsx`)
- **Metric Cards Grid**:
  - Small screens (< 640px): 1 card per row with prominent numbers and icons.
  - Tablets (640px–1024px): 2 cards per row.
  - Desktops (> 1024px): 3 cards / 2 cards balanced layout.
- **Recharts**: Wrapped in responsive containers with auto-sizing aspect ratio (height 260px on mobile, 320px on desktop) and wrapped/stacked legends.

#### C. Family Drive Status Board (`DriveProgressBoard.jsx`)
- Target/Collected/Pending summary banner stacks cleanly into 3 vertical metric boxes on mobile.
- Family search input and status filter pills scroll horizontally without breaking container boundaries.
- On small screens, table rows display a clean mobile card format or horizontal swipeable layout with pinned family code/name.

#### D. Master Data Grid (`MasterDataGrid.jsx`)
- Filter panel collapsible with an "Filters / வடிகட்டிகள்" toggle button on mobile.
- Filter criteria (Flow type, category, date range) stack full width.
- Export to CSV button formatted for easy tap.

#### E. Data Entry Forms (`DonationEntry.jsx` & `ExpenseEntry.jsx`)
- Payment mode selector (Cash, GPay, In-Kind) renders as equal-width large touch buttons.
- Cash receipt number vs GPay transaction ID fields clearly highlighted.
- Sticky submit button on mobile bottom bar for quick repetitive entries during community drives.

#### F. Digital Receipt Modal (`ReceiptModal.jsx`)
- Full viewport height handling (`max-h-[90vh] overflow-y-auto`).
- Full-width action buttons: "WhatsApp Share" (primary green) and "Print / PDF".

---

## 6. Testing & Quality Assurance Contract

1. **Backend Tests**:
   - Unit tests for `UserService.changePassword` (current password check, success, mismatch failure).
   - MockMvc tests for `POST /api/v1/auth/change-password` and `PATCH /api/v1/admin/users/{userId}/password`.
   - Security verification ensuring unauthenticated requests receive 401 and non-admins receive 403 on admin reset.
   - All existing 58 backend tests must remain 100% passing.
2. **Frontend Tests**:
   - `i18n.test.js`: Verify updated translation dictionaries and absence of "பேரேடு".
   - `admin.test.js`: Verify change password modal and user management reset.
   - Build verification: `npm run build` generates production bundle without warnings.
3. **End-to-End Live Verification**:
   - Commit & push to master $\rightarrow$ Vercel executes migration V7.
   - Login to live backend using `adithiyan1` and `Mahaveer2024@`.
   - Test password change on live backend.
