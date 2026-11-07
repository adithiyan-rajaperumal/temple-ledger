package com.temple.ledger.service;

import com.temple.ledger.domain.community.CommitmentStatus;
import com.temple.ledger.domain.community.Drive;
import com.temple.ledger.domain.community.DriveFamilyAllocation;
import com.temple.ledger.domain.community.DriveStatus;
import com.temple.ledger.domain.community.Family;
import com.temple.ledger.domain.community.Pledge;
import com.temple.ledger.domain.inflow.Donation;
import com.temple.ledger.domain.inflow.DonationSource;
import com.temple.ledger.domain.inflow.InKindDonation;
import com.temple.ledger.domain.inflow.PaymentMode;
import com.temple.ledger.domain.outflow.Contractor;
import com.temple.ledger.domain.outflow.Expense;
import com.temple.ledger.domain.outflow.ExpenseCategory;
import com.temple.ledger.dto.inflow.DonationReceiptResponse;
import com.temple.ledger.dto.outflow.ExpenseVoucherResponse;
import com.temple.ledger.dto.report.CategoryChartItem;
import com.temple.ledger.dto.report.ChartDataResponse;
import com.temple.ledger.dto.report.DashboardSummaryResponse;
import com.temple.ledger.dto.report.FamilyDriveProgressDto;
import com.temple.ledger.dto.report.InflowOutflowComparison;
import com.temple.ledger.dto.report.PublicDriveListItemResponse;
import com.temple.ledger.dto.report.PublicDriveProgressResponse;
import com.temple.ledger.dto.report.TransactionGridItemResponse;
import com.temple.ledger.exception.ResourceNotFoundException;
import com.temple.ledger.repository.ContractorRepository;
import com.temple.ledger.repository.DonationRepository;
import com.temple.ledger.repository.DriveFamilyAllocationRepository;
import com.temple.ledger.repository.DriveRepository;
import com.temple.ledger.repository.ExpenseRepository;
import com.temple.ledger.repository.FamilyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final AccountingEngineService accountingEngineService;
    private final DonationRepository donationRepository;
    private final ExpenseRepository expenseRepository;
    private final DriveRepository driveRepository;
    private final DriveFamilyAllocationRepository allocationRepository;
    private final ContractorRepository contractorRepository;
    private final FamilyRepository familyRepository;

    /**
     * Aggregates key financial KPI metrics for public transparency dashboard.
     */
    public DashboardSummaryResponse getDashboardSummary() {
        // 1. Spendable cash & bank balance (Accounts 1010 + 1020)
        BigDecimal cashBalance = accountingEngineService.getAccountBalanceByCode("1010");
        BigDecimal bankBalance = accountingEngineService.getAccountBalanceByCode("1020");
        BigDecimal spendableBalance = cashBalance.add(bankBalance);

        // 2. Monetary Inflows and Outflows
        BigDecimal totalMonetaryInflow = donationRepository.sumTotalMonetaryDonations();
        if (totalMonetaryInflow == null) totalMonetaryInflow = BigDecimal.ZERO;

        BigDecimal totalMonetaryOutflow = expenseRepository.sumTotalExpenses();
        if (totalMonetaryOutflow == null) totalMonetaryOutflow = BigDecimal.ZERO;

        // 3. In-kind material valuation (Account 1030)
        BigDecimal totalInKindValuation = accountingEngineService.getAccountBalanceByCode("1030");

        // 4. Pending Family Drive Balance (across active drives and participating families)
        BigDecimal pendingFamilyDriveBalance = BigDecimal.ZERO;
        List<Drive> activeDrives = driveRepository.findAll().stream()
                .filter(d -> d.getStatus() == DriveStatus.ACTIVE)
                .toList();

        for (Drive drive : activeDrives) {
            List<DriveFamilyAllocation> allocations = allocationRepository.findByDriveId(drive.getId());
            for (DriveFamilyAllocation alloc : allocations) {
                if (alloc.getStatus() == CommitmentStatus.PARTICIPATING) {
                    BigDecimal target = alloc.getTargetAmount();
                    BigDecimal paid = donationRepository.sumAmountByDriveIdAndFamilyId(drive.getId(), alloc.getFamily().getId());
                    if (paid == null) paid = BigDecimal.ZERO;
                    BigDecimal pending = target.subtract(paid).max(BigDecimal.ZERO);
                    pendingFamilyDriveBalance = pendingFamilyDriveBalance.add(pending);
                }
            }
        }

        // 5. Pending Contractor Liabilities
        BigDecimal pendingContractorLiabilities = BigDecimal.ZERO;
        List<Contractor> contractors = contractorRepository.findAll();
        for (Contractor contractor : contractors) {
            BigDecimal sumPaid = expenseRepository.sumAmountByContractorId(contractor.getId());
            if (sumPaid == null) sumPaid = BigDecimal.ZERO;
            BigDecimal remaining = contractor.getTotalAgreedAmount().subtract(sumPaid).max(BigDecimal.ZERO);
            pendingContractorLiabilities = pendingContractorLiabilities.add(remaining);
        }

        return DashboardSummaryResponse.builder()
                .spendableCashAndBankBalance(spendableBalance)
                .totalMonetaryInflow(totalMonetaryInflow)
                .totalMonetaryOutflow(totalMonetaryOutflow)
                .totalInKindValuation(totalInKindValuation)
                .pendingFamilyDriveBalance(pendingFamilyDriveBalance)
                .pendingContractorLiabilities(pendingContractorLiabilities)
                .build();
    }

    /**
     * Returns categorized chart data for income and expense breakdowns and timeline comparison.
     */
    public ChartDataResponse getChartData() {
        List<Donation> donations = donationRepository.findAll();
        List<Expense> expenses = expenseRepository.findAll();

        // 1. Group income categories
        Map<String, CategoryAccumulator> incomeMap = new LinkedHashMap<>();
        BigDecimal totalIncome = BigDecimal.ZERO;

        for (Donation d : donations) {
            String key;
            String labelEn;
            String labelTa;

            if (d.getPaymentMode() == PaymentMode.IN_KIND) {
                key = "IN_KIND";
                labelEn = "In-Kind Materials";
                labelTa = "பொருள் நன்கொடை";
            } else if (d.getDrive() != null) {
                key = d.getDrive().getCode();
                labelEn = d.getDrive().getName();
                labelTa = d.getDrive().getNameTa() != null ? d.getDrive().getNameTa() : d.getDrive().getName();
            } else if (d.getDonorSource() == DonationSource.VILLAGE_FAMILY_DRIVE) {
                key = "VILLAGE_DRIVE";
                labelEn = "Village Family Drive";
                labelTa = "கிராம குடும்ப பங்களிப்பு";
            } else {
                key = "GENERAL_DONATION";
                labelEn = "General Devotee Donations";
                labelTa = "பொது பக்தர்கள் நன்கொடை";
            }

            incomeMap.putIfAbsent(key, new CategoryAccumulator(key, labelEn, labelTa));
            incomeMap.get(key).amount = incomeMap.get(key).amount.add(d.getAmount());
            totalIncome = totalIncome.add(d.getAmount());
        }

        final BigDecimal finalTotalIncome = totalIncome;
        List<CategoryChartItem> incomeCategories = incomeMap.values().stream()
                .map(acc -> {
                    BigDecimal pct = finalTotalIncome.compareTo(BigDecimal.ZERO) > 0
                            ? acc.amount.divide(finalTotalIncome, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return CategoryChartItem.builder()
                            .category(acc.category)
                            .labelEn(acc.labelEn)
                            .labelTa(acc.labelTa)
                            .amount(acc.amount)
                            .percentage(pct)
                            .build();
                })
                .collect(Collectors.toList());

        // 2. Group expense categories
        Map<ExpenseCategory, CategoryAccumulator> expenseMap = new LinkedHashMap<>();
        for (ExpenseCategory cat : ExpenseCategory.values()) {
            expenseMap.put(cat, new CategoryAccumulator(cat.name(), getExpenseLabelEn(cat), getExpenseLabelTa(cat)));
        }

        BigDecimal totalExpenses = BigDecimal.ZERO;
        for (Expense e : expenses) {
            expenseMap.get(e.getCategory()).amount = expenseMap.get(e.getCategory()).amount.add(e.getAmount());
            totalExpenses = totalExpenses.add(e.getAmount());
        }

        final BigDecimal finalTotalExpenses = totalExpenses;
        List<CategoryChartItem> expenseCategories = expenseMap.values().stream()
                .filter(acc -> acc.amount.compareTo(BigDecimal.ZERO) > 0)
                .map(acc -> {
                    BigDecimal pct = finalTotalExpenses.compareTo(BigDecimal.ZERO) > 0
                            ? acc.amount.divide(finalTotalExpenses, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return CategoryChartItem.builder()
                            .category(acc.category)
                            .labelEn(acc.labelEn)
                            .labelTa(acc.labelTa)
                            .amount(acc.amount)
                            .percentage(pct)
                            .build();
                })
                .collect(Collectors.toList());

        // 3. Monetary Inflow vs Outflow
        BigDecimal monetaryInflows = donationRepository.sumTotalMonetaryDonations();
        if (monetaryInflows == null) monetaryInflows = BigDecimal.ZERO;

        BigDecimal monetaryOutflows = expenseRepository.sumTotalExpenses();
        if (monetaryOutflows == null) monetaryOutflows = BigDecimal.ZERO;

        BigDecimal netBalance = monetaryInflows.subtract(monetaryOutflows);

        return ChartDataResponse.builder()
                .incomeCategories(incomeCategories)
                .expenseCategories(expenseCategories)
                .inflowVsOutflow(InflowOutflowComparison.builder()
                        .totalInflows(monetaryInflows)
                        .totalOutflows(monetaryOutflows)
                        .netBalance(netBalance)
                        .build())
                .build();
    }

    /**
     * Lists all drives for public display.
     */
    public List<PublicDriveListItemResponse> listPublicDrives() {
        return driveRepository.findAll().stream()
                .map(d -> PublicDriveListItemResponse.builder()
                        .id(d.getId())
                        .code(d.getCode())
                        .name(d.getName())
                        .nameTa(d.getNameTa())
                        .defaultTargetPerFamily(d.getDefaultTargetPerFamily())
                        .startDate(d.getStartDate())
                        .endDate(d.getEndDate())
                        .status(d.getStatus())
                        .description(d.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Returns detailed drive progress with breakdown of family fulfillment status.
     */
    @Transactional
    public PublicDriveProgressResponse getPublicDriveProgress(UUID driveId) {
        Drive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found with ID: " + driveId));

        List<DriveFamilyAllocation> allocations = allocationRepository.findByDriveId(driveId);
        if (allocations.isEmpty()) {
            List<Family> activeFamilies = familyRepository.findByIsActiveTrue();
            if (!activeFamilies.isEmpty()) {
                List<DriveFamilyAllocation> newAllocations = new ArrayList<>();
                for (Family fam : activeFamilies) {
                    newAllocations.add(DriveFamilyAllocation.builder()
                            .drive(drive)
                            .family(fam)
                            .targetAmount(drive.getDefaultTargetPerFamily() != null ? drive.getDefaultTargetPerFamily() : BigDecimal.ZERO)
                            .status(CommitmentStatus.PARTICIPATING)
                            .build());
                }
                allocations = allocationRepository.saveAll(newAllocations);
            }
        }
        List<FamilyDriveProgressDto> familyDtos = new ArrayList<>();

        BigDecimal totalTarget = BigDecimal.ZERO;
        BigDecimal totalCollected = BigDecimal.ZERO;
        int participating = 0;
        int optedOut = 0;
        int exempted = 0;

        for (DriveFamilyAllocation alloc : allocations) {
            Family fam = alloc.getFamily();
            BigDecimal target = alloc.getTargetAmount();
            BigDecimal paid = donationRepository.sumAmountByDriveIdAndFamilyId(driveId, fam.getId());
            if (paid == null) paid = BigDecimal.ZERO;
            BigDecimal balance = target.subtract(paid).max(BigDecimal.ZERO);

            String status;
            if (alloc.getStatus() == CommitmentStatus.OPTED_OUT) {
                status = "OPTED_OUT";
                optedOut++;
            } else if (alloc.getStatus() == CommitmentStatus.EXEMPTED) {
                status = "EXEMPTED";
                exempted++;
            } else {
                participating++;
                totalTarget = totalTarget.add(target);
                totalCollected = totalCollected.add(paid);
                if (paid.compareTo(target) >= 0) {
                    status = "PAID";
                } else if (paid.compareTo(BigDecimal.ZERO) > 0) {
                    status = "PARTIAL";
                } else {
                    status = "PENDING";
                }
            }

            familyDtos.add(FamilyDriveProgressDto.builder()
                    .familyId(fam.getId())
                    .familyCode(fam.getFamilyCode())
                    .headName(fam.getHeadName())
                    .headNameTa(fam.getHeadNameTa())
                    .doorNo(fam.getDoorNo())
                    .street(fam.getStreet())
                    .village(fam.getVillage())
                    .targetAmount(target)
                    .paidAmount(paid)
                    .balanceAmount(balance)
                    .status(status)
                    .build());
        }

        familyDtos.sort(Comparator.comparing(FamilyDriveProgressDto::getFamilyCode));

        BigDecimal totalPending = totalTarget.subtract(totalCollected).max(BigDecimal.ZERO);
        BigDecimal completionPct = totalTarget.compareTo(BigDecimal.ZERO) > 0
                ? totalCollected.divide(totalTarget, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return PublicDriveProgressResponse.builder()
                .driveId(drive.getId())
                .driveCode(drive.getCode())
                .driveName(drive.getName())
                .driveNameTa(drive.getNameTa())
                .defaultTargetPerFamily(drive.getDefaultTargetPerFamily())
                .totalTargetAmount(totalTarget)
                .totalCollectedAmount(totalCollected)
                .totalPendingAmount(totalPending)
                .completionPercentage(completionPct)
                .totalFamiliesCount(allocations.size())
                .participatingCount(participating)
                .optedOutCount(optedOut)
                .exemptedCount(exempted)
                .families(familyDtos)
                .build();
    }

    /**
     * Unified master filterable grid combining donations and expenses.
     */
    public Page<TransactionGridItemResponse> getTransactions(
            String search,
            String flowType,
            String category,
            String paymentMode,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        List<TransactionGridItemResponse> allItems = new ArrayList<>();

        // Add Donations
        for (Donation d : donationRepository.findAll()) {
            String itemFlowType = (d.getPaymentMode() == PaymentMode.IN_KIND) ? "IN_KIND" : "INCOME";

            String cat;
            String catTa;
            if (d.getPaymentMode() == PaymentMode.IN_KIND) {
                InKindDonation inKind = d.getInKindDonation();
                cat = (inKind != null && inKind.getItemCategory() != null) ? inKind.getItemCategory() : "IN_KIND";
                catTa = "பொருள் நன்கொடை";
            } else if (d.getDrive() != null) {
                cat = d.getDrive().getName();
                catTa = d.getDrive().getNameTa() != null ? d.getDrive().getNameTa() : d.getDrive().getName();
            } else if (d.getDonorSource() == DonationSource.VILLAGE_FAMILY_DRIVE) {
                cat = "Village Family Drive";
                catTa = "கிராம குடும்ப பங்களிப்பு";
            } else {
                cat = "General Donation";
                catTa = "பொது நன்கொடை";
            }

            InKindDonation inKind = d.getInKindDonation();
            Family fam = d.getFamily();
            Drive drive = d.getDrive();

            allItems.add(TransactionGridItemResponse.builder()
                    .id(d.getId())
                    .date(d.getDonationDate())
                    .flowType(itemFlowType)
                    .category(cat)
                    .categoryTa(catTa)
                    .amount(d.getAmount())
                    .paymentMode(d.getPaymentMode().name())
                    .referenceNo(d.getReceiptNo())
                    .bookNo(d.getBookNo())
                    .manualReceiptNo(d.getManualReceiptNo())
                    .physicalBookReceiptNo(d.getPhysicalBookReceiptNo())
                    .gpayTransactionId(d.getGpayTransactionId())
                    .partyName(d.getDonorName())
                    .donorNameTa(d.getDonorNameTa())
                    .phone(d.getPhone())
                    .doorNo(fam != null ? fam.getDoorNo() : null)
                    .street(fam != null ? fam.getStreet() : null)
                    .village(d.getVillage() != null ? d.getVillage() : (fam != null ? fam.getVillage() : null))
                    .area(d.getArea() != null ? d.getArea() : d.getVillage())
                    .state(d.getState() != null ? d.getState() : "Tamil Nadu")
                    .country(d.getCountry() != null ? d.getCountry() : "India")
                    .familyCode(fam != null ? fam.getFamilyCode() : null)
                    .headName(fam != null ? fam.getHeadName() : null)
                    .headNameTa(fam != null ? fam.getHeadNameTa() : null)
                    .driveCode(drive != null ? drive.getCode() : null)
                    .driveName(drive != null ? drive.getName() : null)
                    .driveNameTa(drive != null ? drive.getNameTa() : null)
                    .inKindItemCategory(inKind != null ? inKind.getItemCategory() : null)
                    .inKindItemDescription(inKind != null ? inKind.getItemDescription() : null)
                    .inKindQuantity(inKind != null ? inKind.getQuantity() : null)
                    .inKindUnit(inKind != null ? inKind.getUnit() : null)
                    .inKindApproximateUnitRate(inKind != null ? inKind.getApproximateUnitRate() : null)
                    .inKindTotalEstimatedValue(inKind != null ? inKind.getTotalEstimatedValue() : null)
                    .notes(d.getNotes())
                    .createdBy(d.getCreatedBy())
                    .createdAt(d.getCreatedAt())
                    .build());
        }

        // Add Expenses
        for (Expense e : expenseRepository.findAll()) {
            allItems.add(TransactionGridItemResponse.builder()
                    .id(e.getId())
                    .date(e.getExpenseDate())
                    .flowType("EXPENSE")
                    .category(e.getCategory().name())
                    .categoryTa(getExpenseLabelTa(e.getCategory()))
                    .amount(e.getAmount())
                    .paymentMode(e.getPaymentMode().name())
                    .referenceNo(e.getVoucherNo())
                    .partyName(e.getPaidTo())
                    .invoiceBillNo(e.getInvoiceBillNo())
                    .contractorName(e.getContractor() != null ? e.getContractor().getContractorName() : null)
                    .contractMilestoneDesc(e.getContractMilestoneDesc())
                    .volunteerName(e.getVolunteerName())
                    .travelModeVehicle(e.getTravelModeVehicle())
                    .village(null)
                    .notes(e.getDescription())
                    .createdBy(e.getCreatedBy())
                    .createdAt(e.getCreatedAt())
                    .build());
        }

        // Apply Filters
        List<TransactionGridItemResponse> filtered = allItems.stream()
                .filter(item -> {
                    // Flow Type Filter
                    if (flowType != null && !flowType.isBlank() && !flowType.equalsIgnoreCase("ALL")) {
                        if (!item.getFlowType().equalsIgnoreCase(flowType)) {
                            return false;
                        }
                    }

                    // Category Filter
                    if (category != null && !category.isBlank()) {
                        boolean matchEn = item.getCategory() != null && item.getCategory().equalsIgnoreCase(category);
                        boolean matchTa = item.getCategoryTa() != null && item.getCategoryTa().contains(category);
                        if (!matchEn && !matchTa) {
                            return false;
                        }
                    }

                    // Payment Mode Filter
                    if (paymentMode != null && !paymentMode.isBlank()) {
                        if (item.getPaymentMode() == null || !item.getPaymentMode().equalsIgnoreCase(paymentMode)) {
                            return false;
                        }
                    }

                    // Date range filters
                    if (startDate != null && item.getDate().isBefore(startDate)) {
                        return false;
                    }
                    if (endDate != null && item.getDate().isAfter(endDate)) {
                        return false;
                    }

                    // Search text filter across partyName, donorNameTa, phone, familyCode, village, area, street, referenceNo, bookNo, manualReceiptNo, gpayTransactionId, invoiceBillNo, contractorName, volunteerName, notes, createdBy
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase().trim();
                        boolean matchParty = item.getPartyName() != null && item.getPartyName().toLowerCase().contains(s);
                        boolean matchPartyTa = item.getDonorNameTa() != null && item.getDonorNameTa().toLowerCase().contains(s);
                        boolean matchPhone = item.getPhone() != null && item.getPhone().toLowerCase().contains(s);
                        boolean matchFamilyCode = item.getFamilyCode() != null && item.getFamilyCode().toLowerCase().contains(s);
                        boolean matchVillage = item.getVillage() != null && item.getVillage().toLowerCase().contains(s);
                        boolean matchArea = item.getArea() != null && item.getArea().toLowerCase().contains(s);
                        boolean matchStreet = item.getStreet() != null && item.getStreet().toLowerCase().contains(s);
                        boolean matchRef = item.getReferenceNo() != null && item.getReferenceNo().toLowerCase().contains(s);
                        boolean matchBook = item.getBookNo() != null && item.getBookNo().toLowerCase().contains(s);
                        boolean matchManualReceipt = item.getManualReceiptNo() != null && item.getManualReceiptNo().toLowerCase().contains(s);
                        boolean matchGPay = item.getGpayTransactionId() != null && item.getGpayTransactionId().toLowerCase().contains(s);
                        boolean matchInvoice = item.getInvoiceBillNo() != null && item.getInvoiceBillNo().toLowerCase().contains(s);
                        boolean matchContractor = item.getContractorName() != null && item.getContractorName().toLowerCase().contains(s);
                        boolean matchVolunteer = item.getVolunteerName() != null && item.getVolunteerName().toLowerCase().contains(s);
                        boolean matchNotes = item.getNotes() != null && item.getNotes().toLowerCase().contains(s);
                        boolean matchCreatedBy = item.getCreatedBy() != null && item.getCreatedBy().toLowerCase().contains(s);

                        if (!matchParty && !matchPartyTa && !matchPhone && !matchFamilyCode && !matchVillage && !matchArea
                                && !matchStreet && !matchRef && !matchNotes && !matchBook && !matchManualReceipt
                                && !matchGPay && !matchInvoice && !matchContractor && !matchVolunteer && !matchCreatedBy) {
                            return false;
                        }
                    }

                    return true;
                })
                .sorted(Comparator.comparing(TransactionGridItemResponse::getDate).reversed()
                        .thenComparing(TransactionGridItemResponse::getReferenceNo, Comparator.reverseOrder()))
                .collect(Collectors.toList());

        // Pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<TransactionGridItemResponse> subList = (start <= end && start < filtered.size())
                ? filtered.subList(start, end)
                : Collections.emptyList();

        return new PageImpl<>(subList, pageable, filtered.size());
    }

    /**
     * Public receipt lookup by receipt number.
     */
    public DonationReceiptResponse getPublicReceipt(String receiptNo) {
        Donation donation = donationRepository.findByReceiptNo(receiptNo)
                .orElseThrow(() -> new ResourceNotFoundException("Receipt not found: " + receiptNo));
        return toDonationReceiptResponse(donation);
    }

    /**
     * Lookup donation by UUID.
     */
    public DonationReceiptResponse getDonationById(UUID id) {
        Donation donation = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with ID: " + id));
        return toDonationReceiptResponse(donation);
    }

    /**
     * Lookup expense by UUID.
     */
    public ExpenseVoucherResponse getExpenseById(UUID id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with ID: " + id));
        return toExpenseVoucherResponse(expense);
    }

    private DonationReceiptResponse toDonationReceiptResponse(Donation d) {
        InKindDonation inKind = d.getInKindDonation();

        BigDecimal cumulativePaid = null;
        BigDecimal remainingDue = null;

        if (d.getDrive() != null && d.getFamily() != null) {
            BigDecimal target = d.getDrive().getDefaultTargetPerFamily();
            Optional<DriveFamilyAllocation> alloc = allocationRepository.findByDriveIdAndFamilyId(d.getDrive().getId(), d.getFamily().getId());
            if (alloc.isPresent()) {
                target = alloc.get().getTargetAmount();
            }
            cumulativePaid = donationRepository.sumAmountByDriveIdAndFamilyId(d.getDrive().getId(), d.getFamily().getId());
            if (cumulativePaid == null) cumulativePaid = BigDecimal.ZERO;
            remainingDue = target.subtract(cumulativePaid).max(BigDecimal.ZERO);
        } else if (d.getPledge() != null) {
            Pledge p = d.getPledge();
            cumulativePaid = donationRepository.sumAmountByPledgeId(p.getId());
            if (cumulativePaid == null) cumulativePaid = BigDecimal.ZERO;
            BigDecimal target = p.getTargetMonetaryAmount() != null ? p.getTargetMonetaryAmount() : BigDecimal.ZERO;
            remainingDue = target.subtract(cumulativePaid).max(BigDecimal.ZERO);
        }

        return DonationReceiptResponse.builder()
                .donationId(d.getId())
                .receiptNo(d.getReceiptNo())
                .donationDate(d.getDonationDate())
                .donorSource(d.getDonorSource())
                .familyId(d.getFamily() != null ? d.getFamily().getId() : null)
                .driveId(d.getDrive() != null ? d.getDrive().getId() : null)
                .pledgeId(d.getPledge() != null ? d.getPledge().getId() : null)
                .donorName(d.getDonorName())
                .donorNameTa(d.getDonorNameTa())
                .village(d.getVillage())
                .area(d.getArea() != null ? d.getArea() : d.getVillage())
                .state(d.getState() != null ? d.getState() : "Tamil Nadu")
                .country(d.getCountry() != null ? d.getCountry() : "India")
                .phone(d.getPhone())
                .paymentMode(d.getPaymentMode())
                .amount(d.getAmount())
                .bookNo(d.getBookNo())
                .manualReceiptNo(d.getManualReceiptNo())
                .physicalBookReceiptNo(d.getPhysicalBookReceiptNo())
                .gpayTransactionId(d.getGpayTransactionId())
                .notes(d.getNotes())
                .itemCategory(inKind != null ? inKind.getItemCategory() : null)
                .itemDescription(inKind != null ? inKind.getItemDescription() : null)
                .quantity(inKind != null ? inKind.getQuantity() : null)
                .unit(inKind != null ? inKind.getUnit() : null)
                .approximateUnitRate(inKind != null ? inKind.getApproximateUnitRate() : null)
                .totalEstimatedValue(inKind != null ? inKind.getTotalEstimatedValue() : null)
                .storageLocation(inKind != null ? inKind.getStorageLocation() : null)
                .cumulativePaidForDriveOrPledge(cumulativePaid)
                .remainingDueForDriveOrPledge(remainingDue)
                .pledgeStatus(d.getPledge() != null ? d.getPledge().getStatus() : null)
                .journalEntryId(d.getJournalEntry() != null ? d.getJournalEntry().getId() : null)
                .journalEntryNumber(d.getJournalEntry() != null ? d.getJournalEntry().getEntryNumber() : null)
                .createdAt(d.getCreatedAt())
                .build();
    }

    private ExpenseVoucherResponse toExpenseVoucherResponse(Expense e) {
        Contractor c = e.getContractor();
        BigDecimal paidToDate = null;
        BigDecimal remaining = null;

        if (c != null) {
            BigDecimal sumPaid = expenseRepository.sumAmountByContractorId(c.getId());
            paidToDate = sumPaid != null ? sumPaid : BigDecimal.ZERO;
            remaining = c.getTotalAgreedAmount().subtract(paidToDate).max(BigDecimal.ZERO);
        }

        return ExpenseVoucherResponse.builder()
                .expenseId(e.getId())
                .voucherNo(e.getVoucherNo())
                .expenseDate(e.getExpenseDate())
                .category(e.getCategory())
                .amount(e.getAmount())
                .paymentMode(e.getPaymentMode())
                .paidTo(e.getPaidTo())
                .invoiceBillNo(e.getInvoiceBillNo())
                .volunteerName(e.getVolunteerName())
                .travelModeVehicle(e.getTravelModeVehicle())
                .contractorId(c != null ? c.getId() : null)
                .contractorName(c != null ? c.getContractorName() : null)
                .contractMilestoneDesc(e.getContractMilestoneDesc())
                .contractPaidToDate(paidToDate)
                .contractRemainingBalance(remaining)
                .description(e.getDescription())
                .journalEntryId(e.getJournalEntry() != null ? e.getJournalEntry().getId() : null)
                .journalEntryNumber(e.getJournalEntry() != null ? e.getJournalEntry().getEntryNumber() : null)
                .createdBy(e.getCreatedBy())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private String getExpenseLabelEn(ExpenseCategory cat) {
        return switch (cat) {
            case MATERIAL_PURCHASE -> "Material Purchase";
            case LABOUR_WAGES -> "Labour Wages";
            case CONTRACT_PAYOUT -> "Contractor Payout";
            case COLLECTION_FIELD_EXPENSE -> "Collection Field Expense";
            case TEMPLE_RITUAL_MISC -> "Temple Ritual & Misc";
        };
    }

    private String getExpenseLabelTa(ExpenseCategory cat) {
        return switch (cat) {
            case MATERIAL_PURCHASE -> "பொருட்கள் கொள்முதல்";
            case LABOUR_WAGES -> "கூலி / ஊதியம்";
            case CONTRACT_PAYOUT -> "ஒப்பந்ததாரர் கொடுப்பனவு";
            case COLLECTION_FIELD_EXPENSE -> "களப் பணி மற்றும் பயண செலவு";
            case TEMPLE_RITUAL_MISC -> "பூஜை மற்றும் இதர செலவுகள்";
        };
    }

    private static class CategoryAccumulator {
        final String category;
        final String labelEn;
        final String labelTa;
        BigDecimal amount = BigDecimal.ZERO;

        CategoryAccumulator(String category, String labelEn, String labelTa) {
            this.category = category;
            this.labelEn = labelEn;
            this.labelTa = labelTa;
        }
    }
}
