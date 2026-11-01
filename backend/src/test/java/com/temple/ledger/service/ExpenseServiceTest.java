package com.temple.ledger.service;

import com.temple.ledger.domain.accounting.Account;
import com.temple.ledger.domain.accounting.AccountType;
import com.temple.ledger.domain.accounting.JournalEntry;
import com.temple.ledger.domain.inflow.PaymentMode;
import com.temple.ledger.domain.outflow.Expense;
import com.temple.ledger.domain.outflow.ExpenseCategory;
import com.temple.ledger.dto.outflow.ContractorSummaryResponse;
import com.temple.ledger.dto.outflow.CreateContractorRequest;
import com.temple.ledger.dto.outflow.CreateExpenseRequest;
import com.temple.ledger.dto.outflow.ExpenseVoucherResponse;
import com.temple.ledger.repository.AccountRepository;
import com.temple.ledger.repository.ContractorRepository;
import com.temple.ledger.repository.ExpenseRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ExpenseServiceTest {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private AccountingEngineService accountingEngineService;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private ContractorRepository contractorRepository;

    @Autowired
    private AccountRepository accountRepository;

    @BeforeEach
    void setUp() {
        seedAccountIfNotExists("1010", "Cash in Hand", "ரொக்க இருப்பு", AccountType.ASSET);
        seedAccountIfNotExists("1020", "Bank & GPay", "வங்கி இருப்பு", AccountType.ASSET);
        seedAccountIfNotExists("5010", "Renovation Materials Purchased", "கட்டுமான பொருட்கள்", AccountType.EXPENSE);
        seedAccountIfNotExists("5020", "Labour Wages", "கூலி செலவுகள்", AccountType.EXPENSE);
        seedAccountIfNotExists("5030", "Contractor Work Releases", "ஒப்பந்த கூலி வழங்கல்", AccountType.EXPENSE);
        seedAccountIfNotExists("5040", "Collection Field Expenses", "வசூல் பயண & உணவு செலவு", AccountType.EXPENSE);
        seedAccountIfNotExists("5050", "General Temple Ritual & Misc", "இதர செலவுகள்", AccountType.EXPENSE);
    }

    private void seedAccountIfNotExists(String code, String name, String nameTa, AccountType type) {
        if (!accountRepository.existsByCode(code)) {
            accountRepository.save(Account.builder()
                    .code(code)
                    .name(name)
                    .nameTa(nameTa)
                    .type(type)
                    .isActive(true)
                    .build());
        }
    }

    @Test
    @DisplayName("Renovation material purchase posts DR 5010, CR 1020, and generates voucher number")
    void testRecordExpense_MaterialPurchase_BankGPay() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 10))
                .category(ExpenseCategory.MATERIAL_PURCHASE)
                .amount(new BigDecimal("15000.00"))
                .paymentMode(PaymentMode.GPAY_ONLINE)
                .paidTo("Chettinad Cements Dealer")
                .invoiceBillNo("INV-2026-908")
                .description("50 bags of OPC 53 Grade Cement for Gopuram foundation")
                .build();

        ExpenseVoucherResponse response = expenseService.recordExpense(request, "admin_user");

        assertThat(response).isNotNull();
        assertThat(response.getVoucherNo()).matches("VCH-2026-\\d{5}");
        assertThat(response.getCategory()).isEqualTo(ExpenseCategory.MATERIAL_PURCHASE);
        assertThat(response.getAmount()).isEqualByComparingTo("15000.00");
        assertThat(response.getPaymentMode()).isEqualTo(PaymentMode.GPAY_ONLINE);
        assertThat(response.getPaidTo()).isEqualTo("Chettinad Cements Dealer");
        assertThat(response.getInvoiceBillNo()).isEqualTo("INV-2026-908");
        assertThat(response.getJournalEntryId()).isNotNull();

        // Verify Journal Entry double-entry impact: DR 5010 (15000), CR 1020 (15000)
        BigDecimal materialExpBalance = accountingEngineService.getAccountBalanceByCode("5010");
        assertThat(materialExpBalance).isEqualByComparingTo("15000.00");

        BigDecimal bankBalance = accountingEngineService.getAccountBalanceByCode("1020");
        assertThat(bankBalance).isEqualByComparingTo("-15000.00"); // Credit to Asset is negative balance

        // Verify persistence
        Expense persisted = expenseRepository.findByVoucherNo(response.getVoucherNo()).orElseThrow();
        assertThat(persisted.getAmount()).isEqualByComparingTo("15000.00");
        assertThat(persisted.getCreatedBy()).isEqualTo("admin_user");
    }

    @Test
    @DisplayName("Labour wages payment posts DR 5020, CR 1010 (Cash in Hand)")
    void testRecordExpense_LabourWages_Cash() {
        CreateExpenseRequest request = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 11))
                .category(ExpenseCategory.LABOUR_WAGES)
                .amount(new BigDecimal("4500.00"))
                .paymentMode(PaymentMode.CASH)
                .paidTo("Madasamy Mason Head")
                .description("Daily wage disbursement for 6 workers (masonry work)")
                .build();

        ExpenseVoucherResponse response = expenseService.recordExpense(request, "accountant");

        assertThat(response).isNotNull();
        assertThat(response.getVoucherNo()).matches("VCH-2026-\\d{5}");
        assertThat(response.getCategory()).isEqualTo(ExpenseCategory.LABOUR_WAGES);
        assertThat(response.getAmount()).isEqualByComparingTo("4500.00");
        assertThat(response.getPaymentMode()).isEqualTo(PaymentMode.CASH);
        assertThat(response.getPaidTo()).isEqualTo("Madasamy Mason Head");

        BigDecimal labourExpBalance = accountingEngineService.getAccountBalanceByCode("5020");
        assertThat(labourExpBalance).isEqualByComparingTo("4500.00");

        BigDecimal cashBalance = accountingEngineService.getAccountBalanceByCode("1010");
        assertThat(cashBalance).isEqualByComparingTo("-4500.00");
    }

    @Test
    @DisplayName("Volunteer collection field expense requires volunteer name and description, posts DR 5040, CR 1010")
    void testRecordExpense_VolunteerFieldExpense() {
        CreateExpenseRequest validRequest = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 12))
                .category(ExpenseCategory.COLLECTION_FIELD_EXPENSE)
                .amount(new BigDecimal("1200.00"))
                .paymentMode(PaymentMode.CASH)
                .paidTo("Murugan (Volunteer)")
                .volunteerName("Murugan")
                .travelModeVehicle("TWO_WHEELER")
                .description("Petrol allowance and lunch for donation drive in South Village")
                .build();

        ExpenseVoucherResponse response = expenseService.recordExpense(validRequest, "treasurer");

        assertThat(response).isNotNull();
        assertThat(response.getVoucherNo()).matches("VCH-2026-\\d{5}");
        assertThat(response.getVolunteerName()).isEqualTo("Murugan");
        assertThat(response.getTravelModeVehicle()).isEqualTo("TWO_WHEELER");

        BigDecimal fieldExpBalance = accountingEngineService.getAccountBalanceByCode("5040");
        assertThat(fieldExpBalance).isEqualByComparingTo("1200.00");

        // Missing volunteer name must throw IllegalArgumentException
        CreateExpenseRequest missingVolunteer = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 12))
                .category(ExpenseCategory.COLLECTION_FIELD_EXPENSE)
                .amount(new BigDecimal("800.00"))
                .paymentMode(PaymentMode.CASH)
                .paidTo("Murugan")
                .volunteerName(null)
                .description("Petrol expense")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(missingVolunteer, "treasurer"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Volunteer name is mandatory");

        // Blank volunteer name must throw IllegalArgumentException
        CreateExpenseRequest blankVolunteer = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 12))
                .category(ExpenseCategory.COLLECTION_FIELD_EXPENSE)
                .amount(new BigDecimal("800.00"))
                .paymentMode(PaymentMode.CASH)
                .paidTo("Murugan")
                .volunteerName("   ")
                .description("Petrol expense")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(blankVolunteer, "treasurer"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Volunteer name is mandatory");
    }

    @Test
    @DisplayName("Contractor milestone release posts DR 5030, CR 1020 and accurately tracks paid-to-date and retention balance")
    void testRecordExpense_ContractorMilestoneRelease() {
        // 1. Create Contractor
        CreateContractorRequest contractorReq = CreateContractorRequest.builder()
                .contractorName("Ramu Painters & Sculptors")
                .trade("PAINTING")
                .phone("9876543210")
                .totalAgreedAmount(new BigDecimal("50000.00"))
                .notes("Contract for Rajagopuram stucco art and painting")
                .build();

        ContractorSummaryResponse contractor = expenseService.createContractor(contractorReq);
        assertThat(contractor.getContractorId()).isNotNull();
        assertThat(contractor.getPaidToDate()).isEqualByComparingTo("0.00");
        assertThat(contractor.getRemainingRetentionBalance()).isEqualByComparingTo("50000.00");

        // 2. Pay Milestone 1: ₹20,000
        CreateExpenseRequest milestone1 = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 15))
                .category(ExpenseCategory.CONTRACT_PAYOUT)
                .amount(new BigDecimal("20000.00"))
                .paymentMode(PaymentMode.GPAY_ONLINE)
                .contractorId(contractor.getContractorId())
                .contractMilestoneDesc("Milestone 1: Primer and Base Stucco Work")
                .description("First installment upon scaffolding and surface preparation completion")
                .build();

        ExpenseVoucherResponse vch1 = expenseService.recordExpense(milestone1, "superadmin");
        assertThat(vch1.getVoucherNo()).matches("VCH-2026-\\d{5}");
        assertThat(vch1.getContractorName()).isEqualTo("Ramu Painters & Sculptors");
        assertThat(vch1.getContractPaidToDate()).isEqualByComparingTo("20000.00");
        assertThat(vch1.getContractRemainingBalance()).isEqualByComparingTo("30000.00");

        // Verify Journal Entry for Milestone 1: DR 5030, CR 1020
        BigDecimal contractExpBalance = accountingEngineService.getAccountBalanceByCode("5030");
        assertThat(contractExpBalance).isEqualByComparingTo("20000.00");

        // 3. Pay Milestone 2: ₹15,000
        CreateExpenseRequest milestone2 = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 22))
                .category(ExpenseCategory.CONTRACT_PAYOUT)
                .amount(new BigDecimal("15000.00"))
                .paymentMode(PaymentMode.GPAY_ONLINE)
                .contractorId(contractor.getContractorId())
                .contractMilestoneDesc("Milestone 2: Gold leaf gilding & deity painting")
                .description("Second installment upon deity fine art detailing")
                .build();

        ExpenseVoucherResponse vch2 = expenseService.recordExpense(milestone2, "superadmin");
        assertThat(vch2.getContractPaidToDate()).isEqualByComparingTo("35000.00");
        assertThat(vch2.getContractRemainingBalance()).isEqualByComparingTo("15000.00");

        // Total contract expense in ledger should now be ₹35,000
        assertThat(accountingEngineService.getAccountBalanceByCode("5030")).isEqualByComparingTo("35000.00");

        // Check Contractor Summary query
        ContractorSummaryResponse summary = expenseService.getContractorSummary(contractor.getContractorId());
        assertThat(summary.getPaidToDate()).isEqualByComparingTo("35000.00");
        assertThat(summary.getRemainingRetentionBalance()).isEqualByComparingTo("15000.00");
    }

    @Test
    @DisplayName("Contractor payment exceeding total agreed amount is properly validated and rejected")
    void testRecordExpense_ContractorExceedingTotalAgreedAmount_ThrowsException() {
        CreateContractorRequest contractorReq = CreateContractorRequest.builder()
                .contractorName("Arumugam Carpentry Works")
                .trade("CARPENTRY")
                .phone("9443123456")
                .totalAgreedAmount(new BigDecimal("25000.00"))
                .build();

        ContractorSummaryResponse contractor = expenseService.createContractor(contractorReq);

        // Pay milestone of ₹20,000 (leaves ₹5,000 balance)
        CreateExpenseRequest milestone1 = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 1))
                .category(ExpenseCategory.CONTRACT_PAYOUT)
                .amount(new BigDecimal("20000.00"))
                .paymentMode(PaymentMode.CASH)
                .contractorId(contractor.getContractorId())
                .description("Initial Teakwood door framing disbursement")
                .build();
        expenseService.recordExpense(milestone1, "admin");

        // Attempt to pay ₹10,000 when only ₹5,000 remains (Total = 30,000 > 25,000)
        CreateExpenseRequest excessivePayout = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 10))
                .category(ExpenseCategory.CONTRACT_PAYOUT)
                .amount(new BigDecimal("10000.00"))
                .paymentMode(PaymentMode.CASH)
                .contractorId(contractor.getContractorId())
                .description("Final fitting disbursement exceeding agreed sum")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(excessivePayout, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds total agreed contract amount");
    }

    @Test
    @DisplayName("Contract payout requires valid contractorId")
    void testRecordExpense_ContractPayout_RequiresContractorId() {
        CreateExpenseRequest missingId = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 1))
                .category(ExpenseCategory.CONTRACT_PAYOUT)
                .amount(new BigDecimal("5000.00"))
                .paymentMode(PaymentMode.CASH)
                .contractorId(null)
                .description("Payout with missing contractor")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(missingId, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Contractor ID is mandatory");

        UUID nonExistentId = UUID.randomUUID();
        CreateExpenseRequest nonExistentContractor = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 1))
                .category(ExpenseCategory.CONTRACT_PAYOUT)
                .amount(new BigDecimal("5000.00"))
                .paymentMode(PaymentMode.CASH)
                .contractorId(nonExistentId)
                .description("Payout for non-existent contractor")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(nonExistentContractor, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Contractor not found with ID");
    }

    @Test
    @DisplayName("Expense validation rejects non-positive amounts, missing description, or unsupported payment modes")
    void testRecordExpense_GenericValidations() {
        // Zero amount
        CreateExpenseRequest zeroAmount = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 1))
                .category(ExpenseCategory.TEMPLE_RITUAL_MISC)
                .amount(BigDecimal.ZERO)
                .paymentMode(PaymentMode.CASH)
                .paidTo("Pooja Store")
                .description("Camphor and oil")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(zeroAmount, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("amount must be greater than zero");

        // Negative amount
        CreateExpenseRequest negativeAmount = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 1))
                .category(ExpenseCategory.TEMPLE_RITUAL_MISC)
                .amount(new BigDecimal("-100.00"))
                .paymentMode(PaymentMode.CASH)
                .paidTo("Pooja Store")
                .description("Camphor and oil")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(negativeAmount, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("amount must be greater than zero");

        // Blank description
        CreateExpenseRequest blankDesc = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 1))
                .category(ExpenseCategory.TEMPLE_RITUAL_MISC)
                .amount(new BigDecimal("500.00"))
                .paymentMode(PaymentMode.CASH)
                .paidTo("Pooja Store")
                .description("   ")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(blankDesc, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Description cannot be blank");

        // Unsupported IN_KIND payment mode for expense
        CreateExpenseRequest inKindMode = CreateExpenseRequest.builder()
                .expenseDate(LocalDate.of(2026, 3, 1))
                .category(ExpenseCategory.MATERIAL_PURCHASE)
                .amount(new BigDecimal("5000.00"))
                .paymentMode(PaymentMode.IN_KIND)
                .paidTo("Vendor")
                .description("Sand")
                .build();

        assertThatThrownBy(() -> expenseService.recordExpense(inKindMode, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Payment mode must be either CASH or GPAY_ONLINE");
    }

    @Test
    @DisplayName("Contractor management validates inputs and lists all contractors with summaries")
    void testContractorManagement() {
        CreateContractorRequest req1 = CreateContractorRequest.builder()
                .contractorName("Senthil Electricals")
                .trade("ELECTRICAL")
                .phone("9841001122")
                .totalAgreedAmount(new BigDecimal("40000.00"))
                .notes("Temple electrification and decorative lighting")
                .build();

        CreateContractorRequest req2 = CreateContractorRequest.builder()
                .contractorName("Kannan Sound Systems")
                .trade("SOUND")
                .phone("9841003344")
                .totalAgreedAmount(new BigDecimal("15000.00"))
                .build();

        ContractorSummaryResponse res1 = expenseService.createContractor(req1);
        ContractorSummaryResponse res2 = expenseService.createContractor(req2);

        assertThat(res1.getContractorName()).isEqualTo("Senthil Electricals");
        assertThat(res1.getTotalAgreedAmount()).isEqualByComparingTo("40000.00");
        assertThat(res1.getRemainingRetentionBalance()).isEqualByComparingTo("40000.00");

        List<ContractorSummaryResponse> list = expenseService.listContractors();
        assertThat(list).hasSizeGreaterThanOrEqualTo(2);

        // Validation: blank name
        assertThatThrownBy(() -> expenseService.createContractor(CreateContractorRequest.builder()
                .contractorName("")
                .trade("ELECTRICAL")
                .totalAgreedAmount(new BigDecimal("1000.00"))
                .build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Contractor name cannot be blank");

        // Validation: zero agreed amount
        assertThatThrownBy(() -> expenseService.createContractor(CreateContractorRequest.builder()
                .contractorName("Test")
                .trade("ELECTRICAL")
                .totalAgreedAmount(BigDecimal.ZERO)
                .build()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Total agreed amount must be greater than zero");
    }
}
