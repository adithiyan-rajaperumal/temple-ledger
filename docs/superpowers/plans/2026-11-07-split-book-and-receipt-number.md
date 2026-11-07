# Split Donation Book Number & Receipt Number Implementation Plan

Split the single physical donation book receipt field into two dedicated, distinct fields: **Bill/Donation Book Number** (`book_no`) and **Receipt/Slip Number** (`manual_receipt_no`), with full bilingual UI, validation, and backward compatibility.

## User Review Required

> [!IMPORTANT]
> - Cash donations will require both **Book Number** and **Receipt Slip Number**.
> - Backward compatibility is preserved: `physical_book_receipt_no` is automatically synthesized as `"Book <bookNo> / Receipt <manualReceiptNo>"` for legacy reports and receipt lookups.

---

## Proposed Changes

### Backend Subsystem

#### 1. Database Migration
- File: `backend/src/main/resources/db/migration/V4__split_book_and_receipt_number.sql`
- Add `book_no VARCHAR(32)` and `manual_receipt_no VARCHAR(32)` columns to `donations`.
- Create composite index `idx_donations_book_receipt` on `(book_no, manual_receipt_no)`.

#### 2. Domain Entities & DTOs
- File: `backend/src/main/java/com/temple/ledger/domain/inflow/Donation.java`
  - Add `bookNo` and `manualReceiptNo`.
  - Update `@PrePersist` and `@PreUpdate` to maintain bidirectional synchronization with `physicalBookReceiptNo`.
- File: `backend/src/main/java/com/temple/ledger/dto/inflow/CreateDonationRequest.java`
  - Add `bookNo`, `manualReceiptNo`.
- File: `backend/src/main/java/com/temple/ledger/dto/inflow/DonationReceiptResponse.java`
  - Add `bookNo`, `manualReceiptNo`.
- File: `backend/src/main/java/com/temple/ledger/dto/report/TransactionGridItemResponse.java`
  - Add `bookNo`, `manualReceiptNo`.

#### 3. Services
- File: `backend/src/main/java/com/temple/ledger/service/DonationService.java`
  - Update `recordDonation`: enforce that for Cash donations, both `bookNo` and `manualReceiptNo` (or `physicalBookReceiptNo`) are mandatory.
  - Set `bookNo` and `manualReceiptNo` on the `Donation` entity.
- File: `backend/src/main/java/com/temple/ledger/service/ReportService.java`
  - Populate `bookNo` and `manualReceiptNo` in transaction grid items and public digital receipt responses.
  - Include `bookNo` and `manualReceiptNo` in global search filter.

#### 4. Backend Tests
- File: `backend/src/test/java/com/temple/ledger/service/DonationServiceTest.java`
  - Add tests verifying Cash donations with separate book and receipt numbers, auto-population of `physicalBookReceiptNo`, and validation failures when either number is missing.

---

### Frontend Subsystem

#### 5. Bilingual Localization
- Files: `frontend/src/locales/en.json`, `frontend/src/locales/ta.json`
  - Add keys: `bookNo`, `receiptSlipNo`, `enterBookNo`, `enterReceiptSlipNo`.

#### 6. Admin Donation Entry Form
- File: `frontend/src/pages/admin/DonationEntry.jsx`
  - Add states `bookNo` and `manualReceiptNo`.
  - In Cash Mode, render two separate side-by-side inputs:
    - Input 1: **Book Number / புத்தக எண்** (`bookNo`)
    - Input 2: **Receipt Slip Number / ரசீது தாள் எண்** (`manualReceiptNo`)
  - Validate both fields when Cash mode is active.
  - Pass both in the payload and clear in `resetForm()`.

#### 7. Digital Receipt Modal & Master Ledger
- File: `frontend/src/components/ReceiptModal.jsx`
  - Display Book Number and Receipt Slip Number in the payment details section.
  - Include Book Number and Receipt Slip Number in the generated WhatsApp message text.
- File: `frontend/src/pages/MasterDataGrid.jsx`
  - Export `Book No` and `Receipt Slip No` in the CSV export.
  - Display Book & Slip info in the reference column.

#### 8. Frontend Tests
- File: `frontend/src/admin.test.js`
  - Add unit test verifying separate book and receipt number validation and payload construction.

---

## Verification Plan

### Automated Tests
1. Backend Unit Tests: `mvn -f backend/pom.xml test` (verifying all 57+ tests pass).
2. Frontend Unit Tests: `npm test --prefix frontend` (verifying 100% i18n key parity and admin form validation).
3. Production Bundle Build: `npm run build --prefix frontend` (verifying 0 Vite build errors).
