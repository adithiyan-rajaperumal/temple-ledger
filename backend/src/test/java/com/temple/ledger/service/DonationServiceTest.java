package com.temple.ledger.service;

import com.temple.ledger.domain.community.CommitmentStatus;
import com.temple.ledger.domain.community.Drive;
import com.temple.ledger.domain.community.DriveFamilyAllocation;
import com.temple.ledger.domain.community.DriveStatus;
import com.temple.ledger.domain.community.Family;
import com.temple.ledger.domain.community.Pledge;
import com.temple.ledger.domain.community.PledgeStatus;
import com.temple.ledger.domain.community.PledgeType;
import com.temple.ledger.domain.inflow.Donation;
import com.temple.ledger.domain.inflow.DonationSource;
import com.temple.ledger.domain.inflow.PaymentMode;
import com.temple.ledger.dto.inflow.CreateDonationRequest;
import com.temple.ledger.dto.inflow.DonationReceiptResponse;
import com.temple.ledger.repository.AccountRepository;
import com.temple.ledger.repository.DonationRepository;
import com.temple.ledger.repository.DriveFamilyAllocationRepository;
import com.temple.ledger.repository.DriveRepository;
import com.temple.ledger.repository.FamilyRepository;
import com.temple.ledger.repository.InKindDonationRepository;
import com.temple.ledger.repository.PledgeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DonationServiceTest {

    @Autowired
    private DonationService donationService;

    @Autowired
    private AccountingEngineService accountingEngineService;

    @Autowired
    private DonationRepository donationRepository;

    @Autowired
    private InKindDonationRepository inKindDonationRepository;

    @Autowired
    private FamilyRepository familyRepository;

    @Autowired
    private DriveRepository driveRepository;

    @Autowired
    private DriveFamilyAllocationRepository allocationRepository;

    @Autowired
    private PledgeRepository pledgeRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private AuditService auditService;

    private Family testFamily;
    private Drive testDrive;

    @BeforeEach
    void setUp() {
        seedAccountIfNotExists("1010", "Cash in Hand", "ரொக்க இருப்பு", com.temple.ledger.domain.accounting.AccountType.ASSET);
        seedAccountIfNotExists("1020", "Bank & GPay", "வங்கி இருப்பு", com.temple.ledger.domain.accounting.AccountType.ASSET);
        seedAccountIfNotExists("1030", "In-Kind Material Stock", "கட்டுமான பொருள் இருப்பு", com.temple.ledger.domain.accounting.AccountType.ASSET);
        seedAccountIfNotExists("4010", "Village Drive Donations", "கிராம தீர்மான நிதி", com.temple.ledger.domain.accounting.AccountType.INCOME);
        seedAccountIfNotExists("4020", "Devotee General Donations", "பொது நன்கொடை", com.temple.ledger.domain.accounting.AccountType.INCOME);
        seedAccountIfNotExists("4030", "In-Kind Material Contributions", "பொருள் நன்கொடை", com.temple.ledger.domain.accounting.AccountType.INCOME);

        testFamily = familyRepository.save(Family.builder()
                .familyCode("FAM-001")
                .headName("Sundaram Pillai")
                .headNameTa("சுந்தரம் பிள்ளை")
                .doorNo("12/A")
                .street("Sannathi Street")
                .village("Main Village")
                .phone("9840123456")
                .isActive(true)
                .build());

        testDrive = driveRepository.save(Drive.builder()
                .code("DRIVE-1")
                .name("Temple Renovation Phase 1")
                .nameTa("திருப்பணி கட்டம் 1")
                .defaultTargetPerFamily(new BigDecimal("10000.00"))
                .startDate(LocalDate.of(2026, 1, 1))
                .status(DriveStatus.ACTIVE)
                .description("Phase 1 Drive")
                .build());

        allocationRepository.save(DriveFamilyAllocation.builder()
                .drive(testDrive)
                .family(testFamily)
                .targetAmount(new BigDecimal("10000.00"))
                .status(CommitmentStatus.PARTICIPATING)
                .build());
    }

    private void seedAccountIfNotExists(String code, String name, String nameTa, com.temple.ledger.domain.accounting.AccountType type) {
        if (!accountRepository.existsByCode(code)) {
            accountRepository.save(com.temple.ledger.domain.accounting.Account.builder()
                    .code(code)
                    .name(name)
                    .nameTa(nameTa)
                    .type(type)
                    .isActive(true)
                    .build());
        }
    }

    @Test
    @DisplayName("Cash donation with manual book receipt generates double-entry Dr 1010, Cr 4020, and returns receipt response")
    void testRecordCashDonationWithBookReceipt() {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 1))
                .donorSource(DonationSource.GENERAL_PUBLIC)
                .donorName("Ramasamy")
                .donorNameTa("ராமசாமி")
                .village("Coimbatore")
                .phone("9876543210")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("2500.00"))
                .physicalBookReceiptNo("BK-001-45")
                .notes("General temple contribution")
                .build();

        DonationReceiptResponse response = donationService.recordDonation(request, "admin");

        assertThat(response).isNotNull();
        assertThat(response.getReceiptNo()).matches("RCT-2026-\\d{5}");
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("2500.00"));
        assertThat(response.getPaymentMode()).isEqualTo(PaymentMode.CASH);
        assertThat(response.getPhysicalBookReceiptNo()).isEqualTo("BK-001-45");
        assertThat(response.getJournalEntryNumber()).isNotNull();

        // Verify Double-Entry Balances:
        // Dr 1010 (Cash in Hand) = +2500.00
        // Cr 4020 (Devotee General Donations) = +2500.00
        BigDecimal cashBalance = accountingEngineService.getAccountBalanceByCode("1010");
        BigDecimal generalDonationBalance = accountingEngineService.getAccountBalanceByCode("4020");

        assertThat(cashBalance).isEqualByComparingTo(new BigDecimal("2500.00"));
        assertThat(generalDonationBalance).isEqualByComparingTo(new BigDecimal("2500.00"));

        List<com.temple.ledger.domain.audit.AuditLog> audits = auditService.getAuditHistory("DONATION", response.getDonationId().toString());
        assertThat(audits).hasSize(1);
        assertThat(audits.get(0).getAction()).isEqualTo("CREATE");
        assertThat(audits.get(0).getPerformedBy()).isEqualTo("admin");
        assertThat(audits.get(0).getChangeReason()).contains(response.getReceiptNo());
    }

    @Test
    @DisplayName("Cash donation without manual book receipt throws validation exception")
    void testRecordCashDonationWithoutBookReceiptThrowsValidationException() {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 1))
                .donorSource(DonationSource.GENERAL_PUBLIC)
                .donorName("Annamalai")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("1000.00"))
                .physicalBookReceiptNo("") // Empty book receipt
                .build();

        assertThatThrownBy(() -> donationService.recordDonation(request, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("book receipt");

        // Null book receipt
        request.setPhysicalBookReceiptNo(null);
        assertThatThrownBy(() -> donationService.recordDonation(request, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("book receipt");
    }

    @Test
    @DisplayName("GPay donation with transaction ID generates double-entry Dr 1020, Cr 4020 (or 4010 for drive)")
    void testRecordGPayDonationWithTransactionId() {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 2))
                .donorSource(DonationSource.GENERAL_PUBLIC)
                .donorName("Kavitha")
                .donorNameTa("கவிதா")
                .village("Chennai")
                .phone("9444012345")
                .paymentMode(PaymentMode.GPAY_ONLINE)
                .amount(new BigDecimal("5000.00"))
                .gpayTransactionId("UPI-2026-9876543210")
                .notes("Online transfer via GPay")
                .build();

        DonationReceiptResponse response = donationService.recordDonation(request, "admin");

        assertThat(response).isNotNull();
        assertThat(response.getReceiptNo()).matches("RCT-2026-\\d{5}");
        assertThat(response.getGpayTransactionId()).isEqualTo("UPI-2026-9876543210");

        // Verify Double-Entry Balances:
        // Dr 1020 (Bank & GPay) = +5000.00
        // Cr 4020 (Devotee General Donations) = +5000.00
        // Account 1010 (Cash in Hand) must be 0
        BigDecimal bankBalance = accountingEngineService.getAccountBalanceByCode("1020");
        BigDecimal cashBalance = accountingEngineService.getAccountBalanceByCode("1010");
        BigDecimal generalDonationBalance = accountingEngineService.getAccountBalanceByCode("4020");

        assertThat(bankBalance).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(cashBalance).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(generalDonationBalance).isEqualByComparingTo(new BigDecimal("5000.00"));
    }

    @Test
    @DisplayName("Duplicate GPay transaction ID throws duplicate error")
    void testRecordGPayDonationDuplicateTransactionIdThrowsException() {
        CreateDonationRequest first = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 2))
                .donorSource(DonationSource.GENERAL_PUBLIC)
                .donorName("Kavitha")
                .paymentMode(PaymentMode.GPAY_ONLINE)
                .amount(new BigDecimal("5000.00"))
                .gpayTransactionId("UPI-DUPLICATE-TXN-1")
                .build();

        donationService.recordDonation(first, "admin");

        CreateDonationRequest duplicate = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 2))
                .donorSource(DonationSource.GENERAL_PUBLIC)
                .donorName("Kavitha")
                .paymentMode(PaymentMode.GPAY_ONLINE)
                .amount(new BigDecimal("5000.00"))
                .gpayTransactionId("UPI-DUPLICATE-TXN-1")
                .build();

        assertThatThrownBy(() -> donationService.recordDonation(duplicate, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("In-Kind donation posts Dr 1030, Cr 4030, leaving cash/bank balance at 0")
    void testRecordInKindDonationValuationAndLedger() {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 3))
                .donorSource(DonationSource.GENERAL_PUBLIC)
                .donorName("UltraTech Supplier Trust")
                .donorNameTa("அல்ட்ராடெக் சிமெண்ட்")
                .paymentMode(PaymentMode.IN_KIND)
                .itemCategory("CEMENT")
                .itemDescription("50 bags of OPC 53 Grade Cement")
                .quantity(new BigDecimal("50.00"))
                .unit("BAGS")
                .approximateUnitRate(new BigDecimal("400.00"))
                .storageLocation("Temple Site Warehouse A")
                .notes("Cement bags for foundation")
                .build();

        DonationReceiptResponse response = donationService.recordDonation(request, "admin");

        assertThat(response).isNotNull();
        // 50 * 400 = 20,000.00
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(response.getItemCategory()).isEqualTo("CEMENT");
        assertThat(response.getQuantity()).isEqualByComparingTo(new BigDecimal("50.00"));
        assertThat(response.getUnit()).isEqualTo("BAGS");
        assertThat(response.getApproximateUnitRate()).isEqualByComparingTo(new BigDecimal("400.00"));
        assertThat(response.getTotalEstimatedValue()).isEqualByComparingTo(new BigDecimal("20000.00"));

        // Verify Double-Entry:
        // Dr 1030 (In-Kind Material Stock) = +20,000.00
        // Cr 4030 (In-Kind Material Contributions) = +20,000.00
        // Spendable Cash (1010) and Bank (1020) MUST REMAIN 0!
        BigDecimal materialStockBalance = accountingEngineService.getAccountBalanceByCode("1030");
        BigDecimal inKindIncomeBalance = accountingEngineService.getAccountBalanceByCode("4030");
        BigDecimal cashBalance = accountingEngineService.getAccountBalanceByCode("1010");
        BigDecimal bankBalance = accountingEngineService.getAccountBalanceByCode("1020");

        assertThat(materialStockBalance).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(inKindIncomeBalance).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(cashBalance).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(bankBalance).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Family drive installment calculates cumulative paid and remaining due")
    void testFamilyDriveInstallmentCalculatesCumulativeAndRemaining() {
        // Family target for DRIVE-1 is ₹10,000.00
        // Installment 1: ₹4,000 cash
        CreateDonationRequest installment1 = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 10))
                .donorSource(DonationSource.VILLAGE_FAMILY_DRIVE)
                .familyId(testFamily.getId())
                .driveId(testDrive.getId())
                .donorName("Sundaram Pillai")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("4000.00"))
                .physicalBookReceiptNo("BK-002-10")
                .build();

        DonationReceiptResponse res1 = donationService.recordDonation(installment1, "admin");
        assertThat(res1.getCumulativePaidForDriveOrPledge()).isEqualByComparingTo(new BigDecimal("4000.00"));
        assertThat(res1.getRemainingDueForDriveOrPledge()).isEqualByComparingTo(new BigDecimal("6000.00"));

        // Installment 2: ₹3,500 GPay
        CreateDonationRequest installment2 = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 15))
                .donorSource(DonationSource.VILLAGE_FAMILY_DRIVE)
                .familyId(testFamily.getId())
                .driveId(testDrive.getId())
                .donorName("Sundaram Pillai")
                .paymentMode(PaymentMode.GPAY_ONLINE)
                .amount(new BigDecimal("3500.00"))
                .gpayTransactionId("UPI-DRIVE1-INST2")
                .build();

        DonationReceiptResponse res2 = donationService.recordDonation(installment2, "admin");
        assertThat(res2.getCumulativePaidForDriveOrPledge()).isEqualByComparingTo(new BigDecimal("7500.00"));
        assertThat(res2.getRemainingDueForDriveOrPledge()).isEqualByComparingTo(new BigDecimal("2500.00"));

        // Installment 3: ₹2,500 Cash - Completing the drive commitment!
        CreateDonationRequest installment3 = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 20))
                .donorSource(DonationSource.VILLAGE_FAMILY_DRIVE)
                .familyId(testFamily.getId())
                .driveId(testDrive.getId())
                .donorName("Sundaram Pillai")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("2500.00"))
                .physicalBookReceiptNo("BK-002-11")
                .build();

        DonationReceiptResponse res3 = donationService.recordDonation(installment3, "admin");
        assertThat(res3.getCumulativePaidForDriveOrPledge()).isEqualByComparingTo(new BigDecimal("10000.00"));
        assertThat(res3.getRemainingDueForDriveOrPledge()).isEqualByComparingTo(BigDecimal.ZERO);

        // Verify Village Drive Donations (4010) has the full ₹10,000
        BigDecimal driveDonationsBalance = accountingEngineService.getAccountBalanceByCode("4010");
        assertThat(driveDonationsBalance).isEqualByComparingTo(new BigDecimal("10000.00"));
    }

    @Test
    @DisplayName("Pledge installment updates pledge fulfillment (PENDING -> PARTIALLY_FULFILLED -> COMPLETED)")
    void testPledgeInstallmentUpdatesPledgeFulfillment() {
        Pledge pledge = pledgeRepository.save(Pledge.builder()
                .pledgeCode("PLG-2026-0099")
                .pledgeDate(LocalDate.of(2026, 1, 15))
                .pledgeType(PledgeType.MONETARY)
                .donorName("Natarajan")
                .village("Madurai")
                .targetMonetaryAmount(new BigDecimal("50000.00"))
                .status(PledgeStatus.PENDING)
                .createdBy("admin")
                .build());

        // Installment 1: ₹20,000 GPay
        CreateDonationRequest installment1 = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 10))
                .pledgeId(pledge.getId())
                .donorName("Natarajan")
                .paymentMode(PaymentMode.GPAY_ONLINE)
                .amount(new BigDecimal("20000.00"))
                .gpayTransactionId("UPI-PLG-001")
                .build();

        DonationReceiptResponse res1 = donationService.recordDonation(installment1, "admin");
        assertThat(res1.getCumulativePaidForDriveOrPledge()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(res1.getRemainingDueForDriveOrPledge()).isEqualByComparingTo(new BigDecimal("30000.00"));
        assertThat(res1.getPledgeStatus()).isEqualTo(PledgeStatus.PARTIALLY_FULFILLED);

        Pledge updatedPledge1 = pledgeRepository.findById(pledge.getId()).orElseThrow();
        assertThat(updatedPledge1.getStatus()).isEqualTo(PledgeStatus.PARTIALLY_FULFILLED);

        // Installment 2: ₹30,000 Cash with manual book receipt
        CreateDonationRequest installment2 = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 15))
                .pledgeId(pledge.getId())
                .donorName("Natarajan")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("30000.00"))
                .physicalBookReceiptNo("BK-PLG-101")
                .build();

        DonationReceiptResponse res2 = donationService.recordDonation(installment2, "admin");
        assertThat(res2.getCumulativePaidForDriveOrPledge()).isEqualByComparingTo(new BigDecimal("50000.00"));
        assertThat(res2.getRemainingDueForDriveOrPledge()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(res2.getPledgeStatus()).isEqualTo(PledgeStatus.COMPLETED);

        Pledge updatedPledge2 = pledgeRepository.findById(pledge.getId()).orElseThrow();
        assertThat(updatedPledge2.getStatus()).isEqualTo(PledgeStatus.COMPLETED);
    }

    @Test
    @DisplayName("In-Kind material pledge installment updates pledge fulfillment based on material quantity")
    void testInKindPledgeInstallmentUpdatesPledgeFulfillment() {
        Pledge pledge = pledgeRepository.save(Pledge.builder()
                .pledgeCode("PLG-2026-MATERIAL")
                .pledgeDate(LocalDate.of(2026, 1, 20))
                .pledgeType(PledgeType.IN_KIND_MATERIAL)
                .donorName("River Sand Suppliers")
                .village("Trichy")
                .targetMaterialDesc("River Sand")
                .targetMaterialQty(new BigDecimal("10.00"))
                .targetMaterialUnit("LOADS")
                .status(PledgeStatus.PENDING)
                .createdBy("admin")
                .build());

        // Installment 1: 4 loads @ ₹5,000 = ₹20,000
        CreateDonationRequest installment1 = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 1))
                .pledgeId(pledge.getId())
                .donorName("River Sand Suppliers")
                .paymentMode(PaymentMode.IN_KIND)
                .itemCategory("RIVER_SAND")
                .itemDescription("River Sand first batch")
                .quantity(new BigDecimal("4.00"))
                .unit("LOADS")
                .approximateUnitRate(new BigDecimal("5000.00"))
                .storageLocation("Site Bay 1")
                .build();

        DonationReceiptResponse res1 = donationService.recordDonation(installment1, "admin");
        assertThat(res1.getPledgeStatus()).isEqualTo(PledgeStatus.PARTIALLY_FULFILLED);
        Pledge p1 = pledgeRepository.findById(pledge.getId()).orElseThrow();
        assertThat(p1.getStatus()).isEqualTo(PledgeStatus.PARTIALLY_FULFILLED);

        // Installment 2: 6 loads @ ₹5,000 = ₹30,000 -> Completes the 10 loads pledge!
        CreateDonationRequest installment2 = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 2, 5))
                .pledgeId(pledge.getId())
                .donorName("River Sand Suppliers")
                .paymentMode(PaymentMode.IN_KIND)
                .itemCategory("RIVER_SAND")
                .itemDescription("River Sand final batch")
                .quantity(new BigDecimal("6.00"))
                .unit("LOADS")
                .approximateUnitRate(new BigDecimal("5000.00"))
                .storageLocation("Site Bay 1")
                .build();

        DonationReceiptResponse res2 = donationService.recordDonation(installment2, "admin");
        assertThat(res2.getPledgeStatus()).isEqualTo(PledgeStatus.COMPLETED);
        Pledge p2 = pledgeRepository.findById(pledge.getId()).orElseThrow();
        assertThat(p2.getStatus()).isEqualTo(PledgeStatus.COMPLETED);
    }

    @Test
    @DisplayName("Record donation with Area, State, Country and verify Autocomplete donor & area search")
    void testRecordDonationWithLocationAndAutocompleteSearch() {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 3, 1))
                .donorName("Muthusamy Gounder")
                .donorNameTa("முத்துசாமி")
                .area("Gandhinagar")
                .state("Tamil Nadu")
                .country("India")
                .phone("9876543210")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("5000.00"))
                .physicalBookReceiptNo("BK-LOC-01")
                .build();

        DonationReceiptResponse res = donationService.recordDonation(request, "admin");
        assertThat(res.getArea()).isEqualTo("Gandhinagar");
        assertThat(res.getState()).isEqualTo("Tamil Nadu");
        assertThat(res.getCountry()).isEqualTo("India");

        // Autocomplete donor search
        var donors = donationService.searchDonors("Muthu");
        assertThat(donors).isNotEmpty();
        assertThat(donors.get(0).getDonorName()).isEqualTo("Muthusamy Gounder");
        assertThat(donors.get(0).getArea()).isEqualTo("Gandhinagar");
        assertThat(donors.get(0).getState()).isEqualTo("Tamil Nadu");
        assertThat(donors.get(0).getCountry()).isEqualTo("India");
        assertThat(donors.get(0).getPhone()).isEqualTo("9876543210");

        // Autocomplete area search
        var areas = donationService.searchAreas("Gandhi");
        assertThat(areas).contains("Gandhinagar");
    }

    @Test
    @DisplayName("Record Cash donation with separate Book No and Receipt Slip No")
    void testRecordCashDonationWithBookAndReceiptNumber() {
        CreateDonationRequest request = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 3, 2))
                .donorName("Kandasamy")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("2500.00"))
                .bookNo("B-04")
                .manualReceiptNo("RCT-045")
                .build();

        DonationReceiptResponse res = donationService.recordDonation(request, "admin");
        assertThat(res.getBookNo()).isEqualTo("B-04");
        assertThat(res.getManualReceiptNo()).isEqualTo("RCT-045");
        assertThat(res.getPhysicalBookReceiptNo()).isEqualTo("Book B-04 / Receipt RCT-045");

        // Missing both book and receipt number should fail
        CreateDonationRequest invalid = CreateDonationRequest.builder()
                .donationDate(LocalDate.of(2026, 3, 2))
                .donorName("Invalid Donor")
                .paymentMode(PaymentMode.CASH)
                .amount(new BigDecimal("1000.00"))
                .build();

        assertThatThrownBy(() -> donationService.recordDonation(invalid, "admin"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
