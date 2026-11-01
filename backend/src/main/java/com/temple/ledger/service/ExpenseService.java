package com.temple.ledger.service;

import com.temple.ledger.domain.accounting.Account;
import com.temple.ledger.domain.accounting.JournalEntry;
import com.temple.ledger.domain.inflow.PaymentMode;
import com.temple.ledger.domain.outflow.Contractor;
import com.temple.ledger.domain.outflow.Expense;
import com.temple.ledger.domain.outflow.ExpenseCategory;
import com.temple.ledger.dto.outflow.ContractorSummaryResponse;
import com.temple.ledger.dto.outflow.CreateContractorRequest;
import com.temple.ledger.dto.outflow.CreateExpenseRequest;
import com.temple.ledger.dto.outflow.ExpenseVoucherResponse;
import com.temple.ledger.repository.AccountRepository;
import com.temple.ledger.repository.ContractorRepository;
import com.temple.ledger.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ContractorRepository contractorRepository;
    private final AccountRepository accountRepository;
    private final AccountingEngineService accountingEngineService;

    @Transactional
    public ExpenseVoucherResponse recordExpense(CreateExpenseRequest request, String username) {
        Objects.requireNonNull(request, "CreateExpenseRequest cannot be null");
        log.info("Recording expense voucher for category: {}, mode: {}", request.getCategory(), request.getPaymentMode());

        // 1. Validation
        if (request.getCategory() == null) {
            throw new IllegalArgumentException("Expense category cannot be null");
        }

        if (request.getPaymentMode() == null) {
            throw new IllegalArgumentException("Payment mode cannot be null");
        }
        if (request.getPaymentMode() != PaymentMode.CASH && request.getPaymentMode() != PaymentMode.GPAY_ONLINE) {
            throw new IllegalArgumentException("Payment mode must be either CASH or GPAY_ONLINE for expenses");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Expense amount must be greater than zero");
        }

        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description cannot be blank");
        }

        Contractor contractor = null;
        BigDecimal previousPaidToDate = BigDecimal.ZERO;
        BigDecimal newPaidToDate = null;
        BigDecimal remainingRetentionBalance = null;

        if (request.getCategory() == ExpenseCategory.COLLECTION_FIELD_EXPENSE) {
            if (request.getVolunteerName() == null || request.getVolunteerName().isBlank()) {
                throw new IllegalArgumentException("Volunteer name is mandatory for collection field expenses");
            }
        } else if (request.getCategory() == ExpenseCategory.CONTRACT_PAYOUT) {
            if (request.getContractorId() == null) {
                throw new IllegalArgumentException("Contractor ID is mandatory for contract payout");
            }
            contractor = contractorRepository.findById(request.getContractorId())
                    .orElseThrow(() -> new IllegalArgumentException("Contractor not found with ID: " + request.getContractorId()));

            BigDecimal sumPaid = expenseRepository.sumAmountByContractorId(contractor.getId());
            previousPaidToDate = sumPaid != null ? sumPaid : BigDecimal.ZERO;
            newPaidToDate = previousPaidToDate.add(request.getAmount());

            if (newPaidToDate.compareTo(contractor.getTotalAgreedAmount()) > 0) {
                throw new IllegalArgumentException(String.format(
                        "Payment amount of ₹%s exceeds total agreed contract amount of ₹%s for contractor %s (already paid: ₹%s)",
                        request.getAmount(), contractor.getTotalAgreedAmount(), contractor.getContractorName(), previousPaidToDate
                ));
            }
            remainingRetentionBalance = contractor.getTotalAgreedAmount().subtract(newPaidToDate).max(BigDecimal.ZERO);
        }

        // Determine paidTo
        String paidTo;
        if (request.getPaidTo() != null && !request.getPaidTo().isBlank()) {
            paidTo = request.getPaidTo().trim();
        } else if (contractor != null) {
            paidTo = contractor.getContractorName();
        } else if (request.getVolunteerName() != null && !request.getVolunteerName().isBlank()) {
            paidTo = request.getVolunteerName().trim();
        } else {
            throw new IllegalArgumentException("Paid to cannot be blank");
        }

        LocalDate expenseDate = request.getExpenseDate() != null ? request.getExpenseDate() : LocalDate.now();
        String operator = (username != null && !username.isBlank()) ? username : "system";

        // 2. Generate Unique Voucher Number
        String voucherNo = generateUniqueVoucherNo(expenseDate);

        // 3. Resolve Chart of Accounts
        String expenseAccountCode = switch (request.getCategory()) {
            case MATERIAL_PURCHASE -> "5010";        // Renovation Materials Purchased
            case LABOUR_WAGES -> "5020";             // Labour Wages
            case CONTRACT_PAYOUT -> "5030";          // Contractor Work Releases
            case COLLECTION_FIELD_EXPENSE -> "5040"; // Collection Field Expenses
            case TEMPLE_RITUAL_MISC -> "5050";        // General Temple Ritual & Misc
        };

        String paymentAccountCode = switch (request.getPaymentMode()) {
            case CASH -> "1010";        // Cash in Hand
            case GPAY_ONLINE -> "1020"; // Bank & GPay
            default -> throw new IllegalArgumentException("Unsupported payment mode: " + request.getPaymentMode());
        };

        Account expenseAccount = accountRepository.findByCode(expenseAccountCode)
                .orElseThrow(() -> new IllegalStateException("Account not found with code: " + expenseAccountCode));
        Account paymentAccount = accountRepository.findByCode(paymentAccountCode)
                .orElseThrow(() -> new IllegalStateException("Account not found with code: " + paymentAccountCode));

        // 4. Atomic Double-Entry Journal Posting: DR Expense Account, CR Payment Account
        List<PostingItem> postings = List.of(
                PostingItem.debit(expenseAccount, request.getAmount()),
                PostingItem.credit(paymentAccount, request.getAmount())
        );

        String jeDescription = String.format("Expense Voucher %s (%s, %s): %s",
                voucherNo, request.getCategory(), request.getPaymentMode(), request.getDescription().trim());

        JournalEntry journalEntry = accountingEngineService.createBalancedJournalEntry(
                expenseDate,
                jeDescription,
                "EXPENSE",
                null,
                operator,
                postings
        );

        // 5. Save Expense Entity
        Expense expense = Expense.builder()
                .voucherNo(voucherNo)
                .expenseDate(expenseDate)
                .category(request.getCategory())
                .amount(request.getAmount())
                .paymentMode(request.getPaymentMode())
                .paidTo(paidTo)
                .contractor(contractor)
                .contractMilestoneDesc(request.getContractMilestoneDesc())
                .volunteerName(request.getVolunteerName() != null ? request.getVolunteerName().trim() : null)
                .travelModeVehicle(request.getTravelModeVehicle())
                .invoiceBillNo(request.getInvoiceBillNo())
                .description(request.getDescription().trim())
                .journalEntry(journalEntry)
                .createdBy(operator)
                .build();

        Expense savedExpense = expenseRepository.save(expense);

        // 6. Update contractor status if contract amount is fully fulfilled
        if (contractor != null && remainingRetentionBalance.compareTo(BigDecimal.ZERO) == 0) {
            contractor.setStatus("COMPLETED");
            contractorRepository.save(contractor);
        }

        // 7. Build Response
        return ExpenseVoucherResponse.builder()
                .expenseId(savedExpense.getId())
                .voucherNo(savedExpense.getVoucherNo())
                .expenseDate(savedExpense.getExpenseDate())
                .category(savedExpense.getCategory())
                .amount(savedExpense.getAmount())
                .paymentMode(savedExpense.getPaymentMode())
                .paidTo(savedExpense.getPaidTo())
                .invoiceBillNo(savedExpense.getInvoiceBillNo())
                .volunteerName(savedExpense.getVolunteerName())
                .travelModeVehicle(savedExpense.getTravelModeVehicle())
                .contractorId(contractor != null ? contractor.getId() : null)
                .contractorName(contractor != null ? contractor.getContractorName() : null)
                .contractMilestoneDesc(savedExpense.getContractMilestoneDesc())
                .contractPaidToDate(newPaidToDate)
                .contractRemainingBalance(remainingRetentionBalance)
                .description(savedExpense.getDescription())
                .journalEntryId(journalEntry.getId())
                .journalEntryNumber(journalEntry.getEntryNumber())
                .createdBy(savedExpense.getCreatedBy())
                .createdAt(savedExpense.getCreatedAt())
                .build();
    }

    @Transactional
    public ContractorSummaryResponse createContractor(CreateContractorRequest request) {
        Objects.requireNonNull(request, "CreateContractorRequest cannot be null");
        if (request.getContractorName() == null || request.getContractorName().isBlank()) {
            throw new IllegalArgumentException("Contractor name cannot be blank");
        }
        if (request.getTrade() == null || request.getTrade().isBlank()) {
            throw new IllegalArgumentException("Trade cannot be blank");
        }
        if (request.getTotalAgreedAmount() == null || request.getTotalAgreedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Total agreed amount must be greater than zero");
        }

        Contractor contractor = Contractor.builder()
                .contractorName(request.getContractorName().trim())
                .trade(request.getTrade().trim().toUpperCase())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .totalAgreedAmount(request.getTotalAgreedAmount())
                .status(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus().trim() : "ACTIVE")
                .notes(request.getNotes())
                .build();

        Contractor saved = contractorRepository.save(contractor);
        return mapToContractorSummary(saved, BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public ContractorSummaryResponse getContractorSummary(UUID contractorId) {
        Contractor contractor = contractorRepository.findById(contractorId)
                .orElseThrow(() -> new IllegalArgumentException("Contractor not found with ID: " + contractorId));
        BigDecimal sumPaid = expenseRepository.sumAmountByContractorId(contractorId);
        BigDecimal paidToDate = sumPaid != null ? sumPaid : BigDecimal.ZERO;
        return mapToContractorSummary(contractor, paidToDate);
    }

    @Transactional(readOnly = true)
    public List<ContractorSummaryResponse> listContractors() {
        return contractorRepository.findAll().stream()
                .map(c -> {
                    BigDecimal sumPaid = expenseRepository.sumAmountByContractorId(c.getId());
                    BigDecimal paidToDate = sumPaid != null ? sumPaid : BigDecimal.ZERO;
                    return mapToContractorSummary(c, paidToDate);
                })
                .collect(Collectors.toList());
    }

    private ContractorSummaryResponse mapToContractorSummary(Contractor contractor, BigDecimal paidToDate) {
        BigDecimal remaining = contractor.getTotalAgreedAmount().subtract(paidToDate).max(BigDecimal.ZERO);
        return ContractorSummaryResponse.builder()
                .contractorId(contractor.getId())
                .contractorName(contractor.getContractorName())
                .trade(contractor.getTrade())
                .phone(contractor.getPhone())
                .totalAgreedAmount(contractor.getTotalAgreedAmount())
                .paidToDate(paidToDate)
                .remainingRetentionBalance(remaining)
                .status(contractor.getStatus())
                .notes(contractor.getNotes())
                .createdAt(contractor.getCreatedAt())
                .build();
    }

    private synchronized String generateUniqueVoucherNo(LocalDate expenseDate) {
        int year = expenseDate.getYear();
        String prefix = String.format("VCH-%d-", year);
        long count = expenseRepository.countByVoucherNoStartingWith(prefix);
        long seq = count + 1;
        String voucherNo = String.format("VCH-%d-%05d", year, seq);

        while (expenseRepository.existsByVoucherNo(voucherNo)) {
            seq++;
            voucherNo = String.format("VCH-%d-%05d", year, seq);
        }
        return voucherNo;
    }
}
