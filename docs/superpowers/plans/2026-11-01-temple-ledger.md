# Temple & Community Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-fledged, generic, auditable community & temple ledger web application with Spring Boot (PostgreSQL) and React, supporting double-entry accounting, universal pledges & installments, multi-drive family tracking, in-kind renovation materials, expenses, bilingual English/Tamil (தமிழ்) UI, and a public transparency dashboard with filterable grid.

**Architecture:** A domain-modular Spring Boot 3 REST API paired with a React 18 (Vite + Tailwind CSS + Recharts + react-i18next) single-page application. Financial integrity is enforced via transactional double-entry journal postings under the hood, while exposing intuitive forms for donations, expenses, and installments. Deployable as a single-tenant white-label package to Cloudflare Pages (Frontend) and Render (Backend) with Supabase (PostgreSQL).

**Tech Stack:**
* Backend: Java 21, Spring Boot 3.3.x, Spring Data JPA, Spring Security (Stateless JWT), Flyway, PostgreSQL, i18next message bundles, JUnit 5, Mockito.
* Frontend: React 18, Vite, Tailwind CSS, Lucide React, Recharts, react-i18next, TanStack Table (or standard responsive table with filtering/sorting), Axios.
* Database: PostgreSQL (Supabase).

## Global Constraints
* Frontend must support instantaneous English and Tamil (தமிழ்) toggle across all views and receipt generators.
* All financial transactions must atomically balance debits and credits (`sum(debits) == sum(credits)`) in the double-entry journal.
* In-kind material donations must be tracked with quantity and valuation but strictly segregated from spendable cash/bank balances.
* Cash inflows require manual donation book receipt numbers; digital inflows require GPay transaction / UTR IDs.
* Public endpoints (`/api/v1/public/**`) must remain accessible without login for community transparency.
* All mutations (create, edit, void) must record an immutable audit trail entry with user identity and timestamp.

---

### Task 1: Repository Structure & Backend Scaffolding

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-test.yml`
- Create: `backend/src/main/java/com/temple/ledger/TempleLedgerApplication.java`
- Test: `backend/src/test/java/com/temple/ledger/TempleLedgerApplicationTests.java`

**Interfaces:**
- Produces: Base Spring Boot 3 application context with PostgreSQL, Flyway, Validation, and Security dependencies.

- [ ] **Step 1: Create `backend/pom.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.3.4</version>
        <relativePath/>
    </parent>
    <groupId>com.temple</groupId>
    <artifactId>temple-ledger</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>temple-ledger</name>
    <description>Generic Temple &amp; Community Ledger Backend</description>

    <properties>
        <java.version>17</java.version>
        <jjwt.version>0.12.6</jjwt.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: Create application configuration files**
`backend/src/main/resources/application.yml`:
```yaml
spring:
  application:
    name: temple-ledger
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/temple_ledger}
    username: ${SPRING_DATASOURCE_USERNAME:postgres}
    password: ${SPRING_DATASOURCE_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    open-in-view: false
  flyway:
    enabled: true
    baseline-on-migrate: true

app:
  jwt:
    secret: ${JWT_SECRET:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}
    expiration-ms: 86400000 # 24 hours
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:5173,https://*.pages.dev}

server:
  port: ${PORT:8080}
```

`backend/src/main/resources/application-test.yml`:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:temple_test;DB_CLOSE_DELAY=-1;MODE=PostgreSQL
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    properties:
      hibernate:
        dialect: org.hibernate.dialect.H2Dialect
  flyway:
    enabled: false

app:
  jwt:
    secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
    expiration-ms: 3600000
  cors:
    allowed-origins: "*"
```

- [ ] **Step 3: Create Main Application class and Test**
`backend/src/main/java/com/temple/ledger/TempleLedgerApplication.java`:
```java
package com.temple.ledger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TempleLedgerApplication {
    public static void main(String[] args) {
        SpringApplication.run(TempleLedgerApplication.class, args);
    }
}
```

`backend/src/test/java/com/temple/ledger/TempleLedgerApplicationTests.java`:
```java
package com.temple.ledger;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class TempleLedgerApplicationTests {
    @Test
    void contextLoads() {
    }
}
```

- [ ] **Step 4: Run test to verify context loads**
Run: `mvn clean test` (or `./mvnw test`)
Expected: BUILD SUCCESS (1 test passed).

- [ ] **Step 5: Commit**
```bash
git add backend/
git commit -m "chore: scaffold Spring Boot 3 backend project with configuration"
```

---

### Task 2: Database Migrations (Flyway DDL)

**Files:**
- Create: `backend/src/main/resources/db/migration/V1__init_schema.sql`
- Create: `backend/src/main/resources/db/migration/V2__seed_chart_of_accounts.sql`

**Interfaces:**
- Produces: Complete schema tables (`accounts`, `journal_entries`, `journal_postings`, `families`, `drives`, `drive_family_allocations`, `pledges`, `donations`, `in_kind_donations`, `contractors`, `expenses`, `users`, `audit_logs`).

- [ ] **Step 1: Write `V1__init_schema.sql`**
Write DDL script containing all schema tables with foreign keys and constraints matching Section 4 of the design spec.
- [ ] **Step 2: Write `V2__seed_chart_of_accounts.sql`**
Seed standard Chart of Accounts:
  - 1010 Cash in Hand / ரொக்க இருப்பு (ASSET)
  - 1020 Bank & GPay / வங்கி இருப்பு (ASSET)
  - 1030 In-Kind Material Stock / கட்டுமான பொருள் இருப்பு (ASSET)
  - 2010 Contractor Payables / ஒப்பந்ததாரர் நிலுவை (LIABILITY)
  - 3010 Village Family Drives Equity / கிராம நிதி (EQUITY)
  - 3020 General Temple Fund / பொது கோவில் நிதி (EQUITY)
  - 4010 Village Drive Donations / கிராம தீர்மான நிதி (INCOME)
  - 4020 Devotee General Donations / பொது நன்கொடை (INCOME)
  - 4030 In-Kind Material Contributions / பொருள் நன்கொடை (INCOME)
  - 5010 Renovation Materials Purchased / கட்டுமான பொருட்கள் (EXPENSE)
  - 5020 Labour Wages / கூலி செலவுகள் (EXPENSE)
  - 5030 Contractor Work Releases / ஒப்பந்த கூலி வழங்கல் (EXPENSE)
  - 5040 Collection Field Expenses / வசூல் பயண & உணவு செலவு (EXPENSE)
  - 5050 General Temple Ritual & Misc / இதர செலவுகள் (EXPENSE)
- [ ] **Step 3: Verify migration syntax**
- [ ] **Step 4: Commit**
```bash
git add backend/src/main/resources/db/migration/
git commit -m "feat(db): add initial flyway schema and chart of accounts seed"
```

---

### Task 3: Double-Entry Accounting Core Engine

**Files:**
- Create: `backend/src/main/java/com/temple/ledger/domain/accounting/Account.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/accounting/AccountType.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/accounting/JournalEntry.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/accounting/JournalPosting.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/AccountRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/JournalEntryRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/service/AccountingEngineService.java`
- Test: `backend/src/test/java/com/temple/ledger/service/AccountingEngineServiceTest.java`

**Interfaces:**
- Produces: `AccountingEngineService.createBalancedJournalEntry(...)` which throws `UnbalancedJournalException` if debits != credits, and returns the persisted `JournalEntry`.

- [ ] **Step 1: Write failing test verifying balanced debits and credits**
```java
@Test
void whenDebitsDoNotMatchCredits_thenThrowUnbalancedJournalException() {
    // Assert throws UnbalancedJournalException
}
```
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement entities and `AccountingEngineService`**
Enforce `BigDecimal debitSum.compareTo(creditSum) == 0`.
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
```bash
git add backend/src/main/java/com/temple/ledger/domain/accounting/ backend/src/main/java/com/temple/ledger/service/AccountingEngineService.java backend/src/test/
git commit -m "feat(accounting): implement balanced double-entry journal posting engine"
```

---

### Task 4: Family Master & Dynamic Multi-Drive Commitments

**Files:**
- Create: `backend/src/main/java/com/temple/ledger/domain/community/Family.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/community/Drive.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/community/DriveFamilyAllocation.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/community/Pledge.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/FamilyRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/DriveRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/DriveFamilyAllocationRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/PledgeRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/service/DriveManagementService.java`
- Test: `backend/src/test/java/com/temple/ledger/service/DriveManagementServiceTest.java`

**Interfaces:**
- Produces:
  - `DriveManagementService.createDrive(CreateDriveRequest)`
  - `DriveManagementService.initializeDriveAllocations(UUID driveId)` (populates active families)
  - `DriveManagementService.updateAllocation(UUID driveId, UUID familyId, UpdateAllocationRequest)` (allows opt-out, exemption, custom quota)
  - `DriveManagementService.getDriveFamilyProgress(UUID driveId)`

- [ ] **Step 1: Write failing unit test for dynamic drive initialization and family opt-out**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `DriveManagementService` logic**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
```bash
git add backend/src/main/java/com/temple/ledger/domain/community/ backend/src/main/java/com/temple/ledger/service/DriveManagementService.java backend/src/test/
git commit -m "feat(drives): implement multi-drive family allocations and opt-out support"
```

---

### Task 5: Inflow Engine (Donations, Universal Installments, GPay/Book Ref & In-Kind)

**Files:**
- Create: `backend/src/main/java/com/temple/ledger/domain/inflow/Donation.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/inflow/InKindDonation.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/inflow/PaymentMode.java`
- Create: `backend/src/main/java/com/temple/ledger/dto/inflow/CreateDonationRequest.java`
- Create: `backend/src/main/java/com/temple/ledger/dto/inflow/DonationReceiptResponse.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/DonationRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/InKindDonationRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/service/DonationService.java`
- Test: `backend/src/test/java/com/temple/ledger/service/DonationServiceTest.java`

**Interfaces:**
- Produces:
  - `DonationService.recordDonation(CreateDonationRequest request, String username)`
  - Validates `physicalBookReceiptNo` for Cash, `gpayTransactionId` for GPay.
  - Automatically posts double-entry journal entry via `AccountingEngineService`.
  - Atomically updates target family drive / pledge installment status.
  - Generates unalterable receipt number: `RCT-YYYY-XXXXX`.

- [ ] **Step 1: Write failing unit tests for Cash with book receipt, GPay with transaction ID, In-Kind valuation, and pledge installment updates**
- [ ] **Step 2: Run test to verify failures**
- [ ] **Step 3: Implement `DonationService` with `@Transactional` guarantees**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
```bash
git add backend/src/main/java/com/temple/ledger/domain/inflow/ backend/src/main/java/com/temple/ledger/service/DonationService.java backend/src/test/
git commit -m "feat(inflow): implement donation service with book receipts, gpay, in-kind, and installment tracking"
```

---

### Task 6: Outflow Engine (Renovation Materials, Labour Wages, Contracts, Volunteer Field Expenses)

**Files:**
- Create: `backend/src/main/java/com/temple/ledger/domain/outflow/Expense.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/outflow/Contractor.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/outflow/ExpenseCategory.java`
- Create: `backend/src/main/java/com/temple/ledger/dto/outflow/CreateExpenseRequest.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/ExpenseRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/repository/ContractorRepository.java`
- Create: `backend/src/main/java/com/temple/ledger/service/ExpenseService.java`
- Test: `backend/src/test/java/com/temple/ledger/service/ExpenseServiceTest.java`

**Interfaces:**
- Produces:
  - `ExpenseService.recordExpense(CreateExpenseRequest request, String username)`
  - Handles material purchase bills, worker daily wages, contractor milestone payouts, and volunteer travel/petrol/food disbursements.
  - Posts balancing double-entry vouchers: `DR 50xx (Expense Account), CR 1010/1020 (Cash/Bank)`.
  - Generates voucher number: `VCH-YYYY-XXXXX`.

- [ ] **Step 1: Write failing unit tests for contractor milestone payout and volunteer travel/food allowance voucher**
- [ ] **Step 2: Run test to verify failures**
- [ ] **Step 3: Implement `ExpenseService`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
```bash
git add backend/src/main/java/com/temple/ledger/domain/outflow/ backend/src/main/java/com/temple/ledger/service/ExpenseService.java backend/src/test/
git commit -m "feat(outflow): implement expense vouchers, contractor milestones, and volunteer travel disbursements"
```

---

### Task 7: Security, Authentication & Immutable Audit Trail

**Files:**
- Create: `backend/src/main/java/com/temple/ledger/domain/security/User.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/security/UserRole.java`
- Create: `backend/src/main/java/com/temple/ledger/domain/audit/AuditLog.java`
- Create: `backend/src/main/java/com/temple/ledger/security/JwtTokenProvider.java`
- Create: `backend/src/main/java/com/temple/ledger/security/JwtAuthenticationFilter.java`
- Create: `backend/src/main/java/com/temple/ledger/security/SecurityConfig.java`
- Create: `backend/src/main/java/com/temple/ledger/service/AuditService.java`
- Create: `backend/src/main/java/com/temple/ledger/service/UserService.java`
- Test: `backend/src/test/java/com/temple/ledger/security/SecurityAndAuditTest.java`

**Interfaces:**
- Produces:
  - Public paths permit-all (`/api/v1/public/**`)
  - Super Admin endpoints (`/api/v1/admin/**`) for managing operators & viewing audit logs
  - Operators authenticated via JWT
  - `AuditService.logAction(entityName, entityId, action, username, beforeState, afterState)`

- [ ] **Step 1: Write failing security tests verifying public endpoints are open and admin endpoints require `ROLE_SUPER_ADMIN`**
- [ ] **Step 2: Run test to verify failures**
- [ ] **Step 3: Implement JWT token handling, security filter chain, and immutable audit logging**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
```bash
git add backend/src/main/java/com/temple/ledger/domain/security/ backend/src/main/java/com/temple/ledger/security/ backend/src/main/java/com/temple/ledger/service/AuditService.java backend/src/test/
git commit -m "feat(security): implement stateless JWT auth, role authorization, and audit logging"
```

---

### Task 8: Public Dashboard, Drive Progress & Master Data Grid APIs

**Files:**
- Create: `backend/src/main/java/com/temple/ledger/dto/report/DashboardSummaryResponse.java`
- Create: `backend/src/main/java/com/temple/ledger/dto/report/ChartDataResponse.java`
- Create: `backend/src/main/java/com/temple/ledger/dto/report/TransactionGridItemResponse.java`
- Create: `backend/src/main/java/com/temple/ledger/service/ReportService.java`
- Create: `backend/src/main/java/com/temple/ledger/controller/PublicReportController.java`
- Create: `backend/src/main/java/com/temple/ledger/controller/AdminController.java`
- Create: `backend/src/main/java/com/temple/ledger/controller/DonationController.java`
- Create: `backend/src/main/java/com/temple/ledger/controller/ExpenseController.java`
- Test: `backend/src/test/java/com/temple/ledger/controller/PublicReportControllerTest.java`

**Interfaces:**
- Produces:
  - `GET /api/v1/public/dashboard/summary`: Spendable cash/bank balance, total monetary collections, total expenses, in-kind valuation.
  - `GET /api/v1/public/dashboard/charts`: Pie chart data for income categories, expense categories, and balance comparison.
  - `GET /api/v1/public/drives/{driveId}/families`: Public family status table.
  - `GET /api/v1/public/transactions`: Unified filterable grid supporting search, category, type, date range, pagination.
  - `GET /api/v1/public/receipts/{receiptNo}`: Digital receipt details for printable view / WhatsApp verification.

- [ ] **Step 1: Write MockMvc tests verifying public summary, chart metrics, and filterable transaction responses**
- [ ] **Step 2: Run test to verify failures**
- [ ] **Step 3: Implement `ReportService` aggregations and REST controllers**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**
```bash
git add backend/src/main/java/com/temple/ledger/controller/ backend/src/main/java/com/temple/ledger/service/ReportService.java backend/src/test/
git commit -m "feat(api): implement public dashboard, charts, drive progress, and data grid endpoints"
```

---

### Task 9: Frontend Setup & Bilingual Localization Engine (English & Tamil)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/src/i18n.js`
- Create: `frontend/src/locales/en.json`
- Create: `frontend/src/locales/ta.json`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/components/Navbar.jsx`
- Test: `frontend/src/i18n.test.js`

**Interfaces:**
- Produces:
  - React 18 SPA with Vite, Tailwind CSS, Lucide Icons, and Recharts.
  - Instant language switcher `EN | தமிழ்` in the top navbar.
  - Full translation dictionary for temple accounting terms in `en.json` and `ta.json`.

- [ ] **Step 1: Scaffold Vite React app with Tailwind CSS and dependencies**
- [ ] **Step 2: Write test for `i18n` translation keys loading**
- [ ] **Step 3: Implement `Navbar` with language toggle, public links, and login button**
- [ ] **Step 4: Run test to verify language switching**
- [ ] **Step 5: Commit**
```bash
git add frontend/
git commit -m "feat(frontend): scaffold React Vite app with Tailwind CSS and bilingual i18n support"
```

---

### Task 10: Public Transparency Dashboard & Visual Charts

**Files:**
- Create: `frontend/src/pages/PublicDashboard.jsx`
- Create: `frontend/src/components/MetricCard.jsx`
- Create: `frontend/src/components/IncomePieChart.jsx`
- Create: `frontend/src/components/ExpensePieChart.jsx`
- Create: `frontend/src/components/CashFlowComparisonChart.jsx`
- Create: `frontend/src/services/api.js`

**Interfaces:**
- Produces:
  - Real-time KPI Cards: Spendable Cash/Bank Balance, Total Collections, Total Expenses, In-Kind Valuation.
  - 3 Recharts components: Income Categories Pie, Expense Categories Pie, Inflow vs Outflow Bar/Area comparison.
  - Zero-login requirement; bilingual labels change instantly on language toggle.

- [ ] **Step 1: Implement API service to call `/api/v1/public/dashboard/summary` and `/charts`**
- [ ] **Step 2: Build `MetricCard` and Recharts visualizations with Indian currency formatting (`₹`)**
- [ ] **Step 3: Test dashboard renders gracefully with real and empty data**
- [ ] **Step 4: Commit**
```bash
git add frontend/src/pages/PublicDashboard.jsx frontend/src/components/
git commit -m "feat(ui): implement public transparency dashboard with KPI cards and pie charts"
```

---

### Task 11: Public Family Drive Status Board & Master Filterable Data Grid

**Files:**
- Create: `frontend/src/pages/DriveProgressBoard.jsx`
- Create: `frontend/src/pages/MasterDataGrid.jsx`
- Create: `frontend/src/components/FilterBar.jsx`
- Create: `frontend/src/components/ReceiptModal.jsx`

**Interfaces:**
- Produces:
  - **Drive Progress Board**: Dropdown to select Drive 1 (₹10k), Drive 2 (₹20k), etc. Searchable table of families showing target, paid, due, status, and installment history.
  - **Master Data Grid**: Comprehensive table of all income and expenses with live search (donor name, receipt #, GPay ID, village), category filter, payment mode filter, date range filter, and CSV/PDF export buttons.
  - **Digital Receipt Modal**: Clean printable view with QR code and WhatsApp share link.

- [ ] **Step 1: Build `DriveProgressBoard` with drive selector, target vs collected progress bar, and family search**
- [ ] **Step 2: Build `MasterDataGrid` with search, multi-criteria filtering, and pagination**
- [ ] **Step 3: Build `ReceiptModal` with print stylesheet and WhatsApp sharing link generation**
- [ ] **Step 4: Verify filtering and receipt rendering across both English and Tamil**
- [ ] **Step 5: Commit**
```bash
git add frontend/src/pages/ frontend/src/components/
git commit -m "feat(ui): implement public family drive progress board, master data grid, and digital receipts"
```

---

### Task 12: Admin & Data Entry Portal (Bilingual Entry Forms & Audit Viewer)

**Files:**
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/pages/admin/DonationEntry.jsx`
- Create: `frontend/src/pages/admin/ExpenseEntry.jsx`
- Create: `frontend/src/pages/admin/PledgeManagement.jsx`
- Create: `frontend/src/pages/admin/DriveConfiguration.jsx`
- Create: `frontend/src/pages/admin/ContractorManagement.jsx`
- Create: `frontend/src/pages/admin/AuditTrailViewer.jsx`
- Create: `frontend/src/pages/admin/UserManagement.jsx`
- Create: `frontend/src/components/ProtectedRoute.jsx`

**Interfaces:**
- Produces:
  - Protected routes guarded by JWT.
  - Fast, intuitive bilingual forms:
    - Donation Form: Cash (with book receipt #), GPay (with txn ID), In-Kind (item, qty, rate), and Drive/Pledge installment selector.
    - Expense Form: Renovation materials, worker wages, contractor milestone releases, volunteer travel/food vouchers.
    - Super Admin panels: Drive creation, family master list, opt-out toggles, user management, and full audit log explorer.

- [ ] **Step 1: Implement JWT authentication flow and `ProtectedRoute` wrapper**
- [ ] **Step 2: Build bilingual `DonationEntry` and `ExpenseEntry` forms with instant receipt preview**
- [ ] **Step 3: Build `DriveConfiguration` and `PledgeManagement` interfaces**
- [ ] **Step 4: Build `AuditTrailViewer` for Super Admin**
- [ ] **Step 5: Test form submissions and validation error states**
- [ ] **Step 6: Commit**
```bash
git add frontend/src/pages/admin/ frontend/src/pages/Login.jsx frontend/src/components/ProtectedRoute.jsx
git commit -m "feat(ui): implement admin portal with data entry forms, drive management, and audit viewer"
```

---

### Task 13: End-to-End Verification, Docker Packaging & Cloud Deployment Config

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/_redirects` (for Cloudflare Pages SPA routing)
- Create: `render.yaml` (Render blueprint for Spring Boot service)
- Create: `README.md` (Setup, outsourcing guide, and deployment instructions)

**Interfaces:**
- Produces:
  - Complete containerized backend ready for Render.
  - Cloudflare Pages configuration for React SPA edge hosting.
  - Full automated integration test suite verifying accounting balance, drive installments, in-kind segregation, and audit logging.

- [ ] **Step 1: Create `backend/Dockerfile` using Eclipse Temurin 21 JRE Alpine image**
- [ ] **Step 2: Create `frontend/_redirects` with `/* /index.html 200`**
- [ ] **Step 3: Create `render.yaml` configuring web service and environment variables**
- [ ] **Step 4: Write comprehensive `README.md` covering local setup, Supabase connection, Cloudflare Pages deployment, Render deployment, and outsourcing instructions**
- [ ] **Step 5: Run full backend and frontend test suites**
Run: `cd backend && mvn test`
Run: `cd frontend && npm test` (or build check `npm run build`)
Expected: All tests pass, build succeeds.
- [ ] **Step 6: Commit**
```bash
git add backend/Dockerfile frontend/_redirects render.yaml README.md
git commit -m "chore(deploy): add docker, render config, cloudflare pages rules, and documentation"
```
