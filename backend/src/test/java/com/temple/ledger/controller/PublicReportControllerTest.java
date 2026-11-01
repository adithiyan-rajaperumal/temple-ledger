package com.temple.ledger.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.temple.ledger.domain.community.CommitmentStatus;
import com.temple.ledger.domain.community.Drive;
import com.temple.ledger.domain.community.Family;
import com.temple.ledger.domain.inflow.PaymentMode;
import com.temple.ledger.domain.outflow.ExpenseCategory;
import com.temple.ledger.domain.security.UserRole;
import com.temple.ledger.dto.inflow.CreateDonationRequest;
import com.temple.ledger.dto.inflow.DonationReceiptResponse;
import com.temple.ledger.dto.outflow.CreateContractorRequest;
import com.temple.ledger.dto.outflow.CreateExpenseRequest;
import com.temple.ledger.dto.outflow.ExpenseVoucherResponse;
import com.temple.ledger.security.JwtTokenProvider;
import com.temple.ledger.service.DonationService;
import com.temple.ledger.service.DriveManagementService;
import com.temple.ledger.service.ExpenseService;
import com.temple.ledger.service.dto.CreateDriveRequest;
import com.temple.ledger.service.dto.CreateFamilyRequest;
import com.temple.ledger.service.dto.UpdateAllocationRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PublicReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private DriveManagementService driveManagementService;

    @Autowired
    private DonationService donationService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private com.temple.ledger.repository.AccountRepository accountRepository;

    private String superAdminToken;
    private String dataEntryToken;

    private Drive drive1;
    private Family familyA;
    private Family familyB;
    private DonationReceiptResponse donationCash;
    private DonationReceiptResponse donationInKind;
    private ExpenseVoucherResponse expenseMaterial;

    private void seedAccountIfNotExists(String code, String name, String nameTa, com.temple.ledger.domain.accounting.AccountType type) {
        if (accountRepository.findByCode(code).isEmpty()) {
            accountRepository.save(com.temple.ledger.domain.accounting.Account.builder()
                    .code(code)
                    .name(name)
                    .nameTa(nameTa)
                    .type(type)
                    .isActive(true)
                    .build());
        }
    }

    @BeforeEach
    void setUp() {
        seedAccountIfNotExists("1010", "Cash in Hand", "ரொக்க இருப்பு", com.temple.ledger.domain.accounting.AccountType.ASSET);
        seedAccountIfNotExists("1020", "Bank & GPay", "வங்கி இருப்பு", com.temple.ledger.domain.accounting.AccountType.ASSET);
        seedAccountIfNotExists("1030", "In-Kind Material Stock", "கட்டுமான பொருள் இருப்பு", com.temple.ledger.domain.accounting.AccountType.ASSET);
        seedAccountIfNotExists("4010", "Village Drive Donations", "கிராம தீர்மான நிதி", com.temple.ledger.domain.accounting.AccountType.INCOME);
        seedAccountIfNotExists("4020", "Devotee General Donations", "பொது நன்கொடை", com.temple.ledger.domain.accounting.AccountType.INCOME);
        seedAccountIfNotExists("4030", "In-Kind Material Contributions", "பொருள் நன்கொடை", com.temple.ledger.domain.accounting.AccountType.INCOME);
        seedAccountIfNotExists("5010", "Renovation Materials Purchased", "கட்டுமான பொருட்கள்", com.temple.ledger.domain.accounting.AccountType.EXPENSE);
        seedAccountIfNotExists("5020", "Labour Wages", "கூலி செலவுகள்", com.temple.ledger.domain.accounting.AccountType.EXPENSE);
        seedAccountIfNotExists("5030", "Contractor Work Releases", "ஒப்பந்த கூலி வழங்கல்", com.temple.ledger.domain.accounting.AccountType.EXPENSE);
        seedAccountIfNotExists("5040", "Collection Field Expenses", "வசூல் பயண & உணவு செலவு", com.temple.ledger.domain.accounting.AccountType.EXPENSE);
        seedAccountIfNotExists("5050", "General Temple Ritual & Misc", "இதர செலவுகள்", com.temple.ledger.domain.accounting.AccountType.EXPENSE);

        superAdminToken = jwtTokenProvider.generateToken("admin", UserRole.ROLE_SUPER_ADMIN.name());
        dataEntryToken = jwtTokenProvider.generateToken("operator1", UserRole.ROLE_DATA_ENTRY.name());

        // 1. Create Families
        familyA = driveManagementService.createFamily(CreateFamilyRequest.builder()
                .familyCode("FAM-T8-001")
                .headName("Murugan K")
                .headNameTa("முருகன் கே")
                .doorNo("12")
                .street("North Street")
                .village("Chidambaram")
                .phone("9876543210")
                .isActive(true)
                .build());

        familyB = driveManagementService.createFamily(CreateFamilyRequest.builder()
                .familyCode("FAM-T8-002")
                .headName("Senthil P")
                .headNameTa("செந்தில் பி")
                .doorNo("15")
                .street("South Street")
                .village("Chidambaram")
                .phone("9876543211")
                .isActive(true)
                .build());

        // 2. Create Drive
        drive1 = driveManagementService.createDrive(CreateDriveRequest.builder()
                .code("DRIVE-T8-" + System.currentTimeMillis())
                .name("Kumbhabhishekam Phase 1")
                .nameTa("கும்பாபிஷேக திருப்பணி நிலை 1")
                .defaultTargetPerFamily(new BigDecimal("10000.00"))
                .startDate(LocalDate.now().minusDays(30))
                .endDate(LocalDate.now().plusDays(60))
                .description("Phase 1 Drive")
                .build());

        driveManagementService.initializeDriveAllocations(drive1.getId());

        // 3. Create Contractor & Contract liability
        var contractor = expenseService.createContractor(CreateContractorRequest.builder()
                .contractorName("Raja Masonry Works")
                .trade("MASONRY")
                .phone("9876500001")
                .totalAgreedAmount(new BigDecimal("50000.00"))
                .status("ACTIVE")
                .build());

        // 4. Record Donations
        donationCash = donationService.recordDonation(CreateDonationRequest.builder()
                .donationDate(LocalDate.now().minusDays(10))
                .donorName("Murugan K")
                .donorNameTa("முருகன் கே")
                .village("Chidambaram")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("6000.00"))
                .physicalBookReceiptNo("BK-T8-001")
                .familyId(familyA.getId())
                .driveId(drive1.getId())
                .notes("Drive 1 first installment")
                .build(), "operator1");

        donationInKind = donationService.recordDonation(CreateDonationRequest.builder()
                .donationDate(LocalDate.now().minusDays(5))
                .donorName("Devotee Anbarasan")
                .paymentMode(PaymentMode.IN_KIND)
                .itemCategory("CEMENT")
                .itemDescription("50 bags of OPC 53 Grade")
                .quantity(new BigDecimal("50.00"))
                .unit("BAGS")
                .approximateUnitRate(new BigDecimal("400.00"))
                .storageLocation("Site Shed A")
                .notes("Cement donation")
                .build(), "operator1");

        // 5. Record Expense
        expenseMaterial = expenseService.recordExpense(CreateExpenseRequest.builder()
                .expenseDate(LocalDate.now().minusDays(2))
                .category(ExpenseCategory.MATERIAL_PURCHASE)
                .amount(new BigDecimal("2000.00"))
                .paymentMode(PaymentMode.CASH)
                .paidTo("National Brick Works")
                .invoiceBillNo("INV-9901")
                .description("Clay bricks load")
                .build(), "operator1");
    }

    @Test
    @DisplayName("GET /api/v1/public/dashboard/summary returns 200 with accurate KPI figures without authentication")
    void testGetDashboardSummaryPublic() throws Exception {
        mockMvc.perform(get("/api/v1/public/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.spendableCashAndBankBalance").isNumber())
                .andExpect(jsonPath("$.totalMonetaryInflow").value(6000.00))
                .andExpect(jsonPath("$.totalMonetaryOutflow").value(2000.00))
                .andExpect(jsonPath("$.totalInKindValuation").value(20000.00))
                .andExpect(jsonPath("$.pendingFamilyDriveBalance").isNumber())
                .andExpect(jsonPath("$.pendingContractorLiabilities").value(50000.00));
    }

    @Test
    @DisplayName("GET /api/v1/public/dashboard/charts returns 200 with income & expense breakdowns")
    void testGetDashboardChartsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/public/dashboard/charts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.incomeCategories").isArray())
                .andExpect(jsonPath("$.expenseCategories").isArray())
                .andExpect(jsonPath("$.inflowVsOutflow.totalInflows").value(6000.00))
                .andExpect(jsonPath("$.inflowVsOutflow.totalOutflows").value(2000.00))
                .andExpect(jsonPath("$.inflowVsOutflow.netBalance").value(4000.00));
    }

    @Test
    @DisplayName("GET /api/v1/public/drives lists all public drives")
    void testListPublicDrives() throws Exception {
        mockMvc.perform(get("/api/v1/public/drives"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.code == '" + drive1.getCode() + "')].name").value(drive1.getName()));
    }

    @Test
    @DisplayName("GET /api/v1/public/drives/{driveId}/families returns family drive progress board")
    void testGetPublicDriveFamilies() throws Exception {
        mockMvc.perform(get("/api/v1/public/drives/{driveId}/families", drive1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.driveId").value(drive1.getId().toString()))
                .andExpect(jsonPath("$.families").isArray())
                .andExpect(jsonPath("$.families[?(@.familyCode == 'FAM-T8-001')].paidAmount").value(6000.00))
                .andExpect(jsonPath("$.families[?(@.familyCode == 'FAM-T8-001')].balanceAmount").value(4000.00))
                .andExpect(jsonPath("$.families[?(@.familyCode == 'FAM-T8-001')].status").value("PARTIAL"))
                .andExpect(jsonPath("$.families[?(@.familyCode == 'FAM-T8-002')].status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/v1/public/transactions filters by flowType, search, paymentMode, and pagination")
    void testGetMasterTransactionsGrid() throws Exception {
        // 1. Unfiltered page returns all transactions
        mockMvc.perform(get("/api/v1/public/transactions?page=0&size=20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements", greaterThanOrEqualTo(3)));

        // 2. Filter by flowType = INCOME
        mockMvc.perform(get("/api/v1/public/transactions?flowType=INCOME"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].flowType", everyItem(is("INCOME"))));

        // 3. Filter by flowType = EXPENSE
        mockMvc.perform(get("/api/v1/public/transactions?flowType=EXPENSE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].flowType", everyItem(is("EXPENSE"))))
                .andExpect(jsonPath("$.content[0].partyName").value("National Brick Works"));

        // 4. Filter by flowType = IN_KIND
        mockMvc.perform(get("/api/v1/public/transactions?flowType=IN_KIND"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].flowType", everyItem(is("IN_KIND"))))
                .andExpect(jsonPath("$.content[0].partyName").value("Devotee Anbarasan"));

        // 5. Text search matching donor or party name
        mockMvc.perform(get("/api/v1/public/transactions?search=Murugan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].referenceNo").value(donationCash.getReceiptNo()));

        // 6. Filter by paymentMode
        mockMvc.perform(get("/api/v1/public/transactions?paymentMode=CASH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].paymentMode", everyItem(is("CASH"))));
    }

    @Test
    @DisplayName("GET /api/v1/public/receipts/{receiptNo} returns 200 for valid receipt and 404 for invalid")
    void testGetPublicReceipt() throws Exception {
        mockMvc.perform(get("/api/v1/public/receipts/{receiptNo}", donationCash.getReceiptNo()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receiptNo").value(donationCash.getReceiptNo()))
                .andExpect(jsonPath("$.donorName").value("Murugan K"))
                .andExpect(jsonPath("$.amount").value(6000.00))
                .andExpect(jsonPath("$.physicalBookReceiptNo").value("BK-T8-001"));

        mockMvc.perform(get("/api/v1/public/receipts/NON-EXISTENT-RECEIPT"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Donation and Expense CRUD endpoints work with proper authorization")
    void testDonationAndExpenseEndpoints() throws Exception {
        // Authenticated donation creation
        CreateDonationRequest newDonation = CreateDonationRequest.builder()
                .donorName("Ramesh Devotee")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("1500.00"))
                .physicalBookReceiptNo("BK-T8-002")
                .donationDate(LocalDate.now())
                .notes("Temple pooja sponsor")
                .build();

        String respStr = mockMvc.perform(post("/api/v1/donations")
                        .header("Authorization", "Bearer " + dataEntryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDonation)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.receiptNo").isString())
                .andReturn().getResponse().getContentAsString();

        DonationReceiptResponse createdDonation = objectMapper.readValue(respStr, DonationReceiptResponse.class);

        // Fetch donation by ID
        mockMvc.perform(get("/api/v1/donations/{id}", createdDonation.getDonationId())
                        .header("Authorization", "Bearer " + dataEntryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.donorName").value("Ramesh Devotee"));

        // Authenticated expense creation
        CreateExpenseRequest newExpense = CreateExpenseRequest.builder()
                .category(ExpenseCategory.TEMPLE_RITUAL_MISC)
                .amount(new BigDecimal("500.00"))
                .paymentMode(PaymentMode.CASH)
                .paidTo("Pooja Store")
                .description("Camphor and flowers")
                .expenseDate(LocalDate.now())
                .build();

        String expRespStr = mockMvc.perform(post("/api/v1/expenses")
                        .header("Authorization", "Bearer " + dataEntryToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newExpense)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.voucherNo").isString())
                .andReturn().getResponse().getContentAsString();

        ExpenseVoucherResponse createdExpense = objectMapper.readValue(expRespStr, ExpenseVoucherResponse.class);

        // Fetch expense by ID
        mockMvc.perform(get("/api/v1/expenses/{id}", createdExpense.getExpenseId())
                        .header("Authorization", "Bearer " + dataEntryToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paidTo").value("Pooja Store"));
    }

    @Test
    @DisplayName("Admin controller drives and family management endpoints work for Super Admin")
    void testAdminControllerDrivesAndFamilies() throws Exception {
        // Admin creates drive
        CreateDriveRequest driveReq = CreateDriveRequest.builder()
                .code("DRIVE-T8-ADMIN")
                .name("Gopuram Renovation")
                .defaultTargetPerFamily(new BigDecimal("15000.00"))
                .startDate(LocalDate.now())
                .build();

        String driveResp = mockMvc.perform(post("/api/v1/admin/drives")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(driveReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("DRIVE-T8-ADMIN"))
                .andReturn().getResponse().getContentAsString();

        Drive createdDrive = objectMapper.readValue(driveResp, Drive.class);

        // Admin initializes drive allocations
        mockMvc.perform(post("/api/v1/admin/drives/{driveId}/initialize", createdDrive.getId())
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        // Admin updates allocation
        UpdateAllocationRequest updateReq = UpdateAllocationRequest.builder()
                .status(CommitmentStatus.OPTED_OUT)
                .notes("Family opted out due to relocation")
                .build();

        mockMvc.perform(patch("/api/v1/admin/drives/{driveId}/allocations/{familyId}", createdDrive.getId(), familyA.getId())
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPTED_OUT"));

        // Admin creates family
        CreateFamilyRequest famReq = CreateFamilyRequest.builder()
                .familyCode("FAM-T8-003")
                .headName("Kannan M")
                .village("Chidambaram")
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/v1/admin/families")
                        .header("Authorization", "Bearer " + superAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(famReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.familyCode").value("FAM-T8-003"));

        // Admin lists families
        mockMvc.perform(get("/api/v1/admin/families")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
