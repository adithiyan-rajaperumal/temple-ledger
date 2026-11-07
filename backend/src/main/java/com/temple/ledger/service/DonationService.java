package com.temple.ledger.service;

import com.temple.ledger.domain.accounting.Account;
import com.temple.ledger.domain.accounting.JournalEntry;
import com.temple.ledger.domain.community.Drive;
import com.temple.ledger.domain.community.DriveFamilyAllocation;
import com.temple.ledger.domain.community.Family;
import com.temple.ledger.domain.community.Pledge;
import com.temple.ledger.domain.community.PledgeStatus;
import com.temple.ledger.domain.community.PledgeType;
import com.temple.ledger.domain.inflow.Donation;
import com.temple.ledger.domain.inflow.DonationSource;
import com.temple.ledger.domain.inflow.InKindDonation;
import com.temple.ledger.domain.inflow.PaymentMode;
import com.temple.ledger.dto.inflow.CreateDonationRequest;
import com.temple.ledger.dto.inflow.DonationReceiptResponse;
import com.temple.ledger.dto.inflow.DonorProfileDto;
import com.temple.ledger.repository.AccountRepository;
import com.temple.ledger.repository.DonationRepository;
import com.temple.ledger.repository.DriveFamilyAllocationRepository;
import com.temple.ledger.repository.DriveRepository;
import com.temple.ledger.repository.FamilyRepository;
import com.temple.ledger.repository.InKindDonationRepository;
import com.temple.ledger.repository.PledgeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final InKindDonationRepository inKindDonationRepository;
    private final FamilyRepository familyRepository;
    private final DriveRepository driveRepository;
    private final DriveFamilyAllocationRepository allocationRepository;
    private final PledgeRepository pledgeRepository;
    private final AccountRepository accountRepository;
    private final AccountingEngineService accountingEngineService;
    private final AuditService auditService;

    @Transactional
    public DonationReceiptResponse recordDonation(CreateDonationRequest request, String username) {
        log.info("Recording donation for donor: {}, mode: {}", request.getDonorName(), request.getPaymentMode());

        // 1. Validation
        if (request.getPaymentMode() == null) {
            throw new IllegalArgumentException("Payment mode cannot be null");
        }
        if (request.getDonorName() == null || request.getDonorName().isBlank()) {
            throw new IllegalArgumentException("Donor name cannot be blank");
        }

        LocalDate donationDate = request.getDonationDate() != null ? request.getDonationDate() : LocalDate.now();
        String operator = (username != null && !username.isBlank()) ? username : "system";

        BigDecimal finalAmount;
        if (request.getPaymentMode() == PaymentMode.CASH) {
            boolean hasSeparate = (request.getBookNo() != null && !request.getBookNo().isBlank())
                    && (request.getManualReceiptNo() != null && !request.getManualReceiptNo().isBlank());
            boolean hasCombined = request.getPhysicalBookReceiptNo() != null && !request.getPhysicalBookReceiptNo().isBlank();
            if (!hasSeparate && !hasCombined) {
                if (request.getBookNo() == null || request.getBookNo().isBlank()) {
                    throw new IllegalArgumentException("Physical donation book receipt number is mandatory for cash donations");
                }
                if (request.getManualReceiptNo() == null || request.getManualReceiptNo().isBlank()) {
                    throw new IllegalArgumentException("Physical receipt slip number is mandatory for cash donations");
                }
                throw new IllegalArgumentException("Physical book receipt number is mandatory for cash donations");
            }
            if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Donation amount must be greater than zero");
            }
            finalAmount = request.getAmount();
        } else if (request.getPaymentMode() == PaymentMode.GPAY_ONLINE) {
            if (request.getGpayTransactionId() == null || request.getGpayTransactionId().isBlank()) {
                throw new IllegalArgumentException("GPay transaction ID is mandatory for online donations");
            }
            String txnId = request.getGpayTransactionId().trim();
            if (donationRepository.existsByGpayTransactionId(txnId)) {
                throw new IllegalArgumentException("Donation with GPay transaction ID already exists: " + txnId);
            }
            if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Donation amount must be greater than zero");
            }
            finalAmount = request.getAmount();
        } else if (request.getPaymentMode() == PaymentMode.IN_KIND) {
            if (request.getItemCategory() == null || request.getItemCategory().isBlank()) {
                throw new IllegalArgumentException("Item category is mandatory for in-kind donations");
            }
            if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("In-kind quantity must be greater than zero");
            }
            if (request.getUnit() == null || request.getUnit().isBlank()) {
                throw new IllegalArgumentException("Unit is mandatory for in-kind donations");
            }
            if (request.getApproximateUnitRate() == null || request.getApproximateUnitRate().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Approximate unit rate must be greater than zero");
            }
            finalAmount = request.getQuantity().multiply(request.getApproximateUnitRate());
        } else {
            throw new IllegalArgumentException("Unsupported payment mode: " + request.getPaymentMode());
        }

        // 2. Resolve Relationships
        Family family = null;
        if (request.getFamilyId() != null) {
            family = familyRepository.findById(request.getFamilyId())
                    .orElseThrow(() -> new IllegalArgumentException("Family not found with ID: " + request.getFamilyId()));
        }

        Drive drive = null;
        if (request.getDriveId() != null) {
            drive = driveRepository.findById(request.getDriveId())
                    .orElseThrow(() -> new IllegalArgumentException("Drive not found with ID: " + request.getDriveId()));
        }

        Pledge pledge = null;
        if (request.getPledgeId() != null) {
            pledge = pledgeRepository.findById(request.getPledgeId())
                    .orElseThrow(() -> new IllegalArgumentException("Pledge not found with ID: " + request.getPledgeId()));
            if (family == null && pledge.getFamily() != null) {
                family = pledge.getFamily();
            }
            if (drive == null && pledge.getDrive() != null) {
                drive = pledge.getDrive();
            }
        }

        DonationSource donorSource = request.getDonorSource();
        if (donorSource == null) {
            donorSource = (drive != null || family != null)
                    ? DonationSource.VILLAGE_FAMILY_DRIVE
                    : DonationSource.GENERAL_PUBLIC;
        }

        // 3. Generate Receipt Number
        String receiptNo = generateUniqueReceiptNo(donationDate);

        // 4. Double-Entry Posting
        String debitAccountCode;
        String creditAccountCode;

        if (request.getPaymentMode() == PaymentMode.CASH) {
            debitAccountCode = "1010"; // Cash in Hand
            creditAccountCode = (donorSource == DonationSource.VILLAGE_FAMILY_DRIVE || drive != null)
                    ? "4010"  // Village Drive Donations
                    : "4020"; // Devotee General Donations
        } else if (request.getPaymentMode() == PaymentMode.GPAY_ONLINE) {
            debitAccountCode = "1020"; // Bank & GPay
            creditAccountCode = (donorSource == DonationSource.VILLAGE_FAMILY_DRIVE || drive != null)
                    ? "4010"  // Village Drive Donations
                    : "4020"; // Devotee General Donations
        } else {
            debitAccountCode = "1030";  // In-Kind Material Stock
            creditAccountCode = "4030"; // In-Kind Material Contributions
        }

        Account debitAccount = accountRepository.findByCode(debitAccountCode)
                .orElseThrow(() -> new IllegalStateException("Account not found with code: " + debitAccountCode));
        Account creditAccount = accountRepository.findByCode(creditAccountCode)
                .orElseThrow(() -> new IllegalStateException("Account not found with code: " + creditAccountCode));

        List<PostingItem> postings = List.of(
                PostingItem.debit(debitAccount, finalAmount),
                PostingItem.credit(creditAccount, finalAmount)
        );

        String jeDescription = String.format("Donation from %s (%s, %s)",
                request.getDonorName(), request.getPaymentMode(), receiptNo);

        JournalEntry journalEntry = accountingEngineService.createBalancedJournalEntry(
                donationDate,
                jeDescription,
                "DONATION",
                null,
                operator,
                postings
        );

        // 5. Create and Save Donation Entity
        String effectiveArea = request.getArea() != null && !request.getArea().isBlank()
                ? request.getArea().trim()
                : (request.getVillage() != null && !request.getVillage().isBlank()
                    ? request.getVillage().trim()
                    : (family != null ? (family.getArea() != null ? family.getArea() : family.getVillage()) : null));
        String effectiveState = request.getState() != null && !request.getState().isBlank()
                ? request.getState().trim()
                : (family != null && family.getState() != null ? family.getState() : "Tamil Nadu");
        String effectiveCountry = request.getCountry() != null && !request.getCountry().isBlank()
                ? request.getCountry().trim()
                : (family != null && family.getCountry() != null ? family.getCountry() : "India");

        Donation donation = Donation.builder()
                .receiptNo(receiptNo)
                .donationDate(donationDate)
                .donorSource(donorSource)
                .family(family)
                .drive(drive)
                .pledge(pledge)
                .donorName(request.getDonorName())
                .donorNameTa(request.getDonorNameTa())
                .village(effectiveArea)
                .area(effectiveArea)
                .state(effectiveState)
                .country(effectiveCountry)
                .phone(request.getPhone() != null ? request.getPhone() : (family != null ? family.getPhone() : null))
                .paymentMode(request.getPaymentMode())
                .amount(finalAmount)
                .bookNo(request.getBookNo() != null ? request.getBookNo().trim() : null)
                .manualReceiptNo(request.getManualReceiptNo() != null ? request.getManualReceiptNo().trim() : null)
                .physicalBookReceiptNo(request.getPhysicalBookReceiptNo())
                .gpayTransactionId(request.getGpayTransactionId() != null ? request.getGpayTransactionId().trim() : null)
                .notes(request.getNotes())
                .journalEntry(journalEntry)
                .createdBy(operator)
                .build();

        if (request.getPaymentMode() == PaymentMode.IN_KIND) {
            InKindDonation inKind = InKindDonation.builder()
                    .donation(donation)
                    .itemCategory(request.getItemCategory())
                    .itemDescription(request.getItemDescription() != null && !request.getItemDescription().isBlank()
                            ? request.getItemDescription()
                            : request.getItemCategory())
                    .quantity(request.getQuantity())
                    .unit(request.getUnit())
                    .approximateUnitRate(request.getApproximateUnitRate())
                    .totalEstimatedValue(finalAmount)
                    .storageLocation(request.getStorageLocation())
                    .build();
            donation.setInKindDonation(inKind);
        }

        Donation savedDonation = donationRepository.saveAndFlush(donation);
        journalEntry.setReferenceId(savedDonation.getId());

        auditService.logAction(
                "DONATION",
                savedDonation.getId().toString(),
                "CREATE",
                operator,
                null,
                request,
                "Donation recorded: " + savedDonation.getReceiptNo()
        );

        // 6. Commitment & Installment Tracking
        BigDecimal cumulativePaid = null;
        BigDecimal remainingDue = null;
        PledgeStatus pledgeStatus = null;

        if (pledge != null) {
            if (pledge.getPledgeType() == PledgeType.IN_KIND_MATERIAL) {
                BigDecimal totalQty = inKindDonationRepository.sumQuantityByPledgeId(pledge.getId());
                BigDecimal targetQty = pledge.getTargetMaterialQty() != null ? pledge.getTargetMaterialQty() : BigDecimal.ZERO;
                BigDecimal remainingQty = targetQty.subtract(totalQty).max(BigDecimal.ZERO);

                cumulativePaid = totalQty;
                remainingDue = remainingQty;

                if (totalQty.compareTo(targetQty) >= 0) {
                    pledge.setStatus(PledgeStatus.COMPLETED);
                } else if (totalQty.compareTo(BigDecimal.ZERO) > 0) {
                    pledge.setStatus(PledgeStatus.PARTIALLY_FULFILLED);
                } else {
                    pledge.setStatus(PledgeStatus.PENDING);
                }
            } else if (pledge.getPledgeType() == PledgeType.MONETARY) {
                BigDecimal totalMonetary = donationRepository.sumAmountByPledgeId(pledge.getId());
                BigDecimal targetMonetary = pledge.getTargetMonetaryAmount() != null ? pledge.getTargetMonetaryAmount() : BigDecimal.ZERO;
                BigDecimal remainingMonetary = targetMonetary.subtract(totalMonetary).max(BigDecimal.ZERO);

                cumulativePaid = totalMonetary;
                remainingDue = remainingMonetary;

                if (totalMonetary.compareTo(targetMonetary) >= 0) {
                    pledge.setStatus(PledgeStatus.COMPLETED);
                } else if (totalMonetary.compareTo(BigDecimal.ZERO) > 0) {
                    pledge.setStatus(PledgeStatus.PARTIALLY_FULFILLED);
                } else {
                    pledge.setStatus(PledgeStatus.PENDING);
                }
            } else { // HYBRID
                BigDecimal totalMonetary = donationRepository.sumAmountByPledgeId(pledge.getId());
                BigDecimal targetMonetary = pledge.getTargetMonetaryAmount() != null ? pledge.getTargetMonetaryAmount() : BigDecimal.ZERO;
                BigDecimal totalQty = inKindDonationRepository.sumQuantityByPledgeId(pledge.getId());
                BigDecimal targetQty = pledge.getTargetMaterialQty() != null ? pledge.getTargetMaterialQty() : BigDecimal.ZERO;

                cumulativePaid = totalMonetary;
                remainingDue = targetMonetary.subtract(totalMonetary).max(BigDecimal.ZERO);

                boolean monetaryDone = totalMonetary.compareTo(targetMonetary) >= 0;
                boolean materialDone = totalQty.compareTo(targetQty) >= 0;

                if (monetaryDone && materialDone) {
                    pledge.setStatus(PledgeStatus.COMPLETED);
                } else if (totalMonetary.compareTo(BigDecimal.ZERO) > 0 || totalQty.compareTo(BigDecimal.ZERO) > 0) {
                    pledge.setStatus(PledgeStatus.PARTIALLY_FULFILLED);
                } else {
                    pledge.setStatus(PledgeStatus.PENDING);
                }
            }
            pledgeRepository.save(pledge);
            pledgeStatus = pledge.getStatus();
        } else if (drive != null && family != null) {
            BigDecimal targetAmount = drive.getDefaultTargetPerFamily();
            Optional<DriveFamilyAllocation> allocOpt = allocationRepository.findByDriveIdAndFamilyId(drive.getId(), family.getId());
            if (allocOpt.isPresent()) {
                targetAmount = allocOpt.get().getTargetAmount();
            }

            BigDecimal totalPaid = donationRepository.sumAmountByDriveIdAndFamilyId(drive.getId(), family.getId());
            BigDecimal pendingDue = targetAmount.subtract(totalPaid).max(BigDecimal.ZERO);

            cumulativePaid = totalPaid;
            remainingDue = pendingDue;
        }

        // 7. Assemble Receipt Response
        InKindDonation inKind = savedDonation.getInKindDonation();
        return DonationReceiptResponse.builder()
                .donationId(savedDonation.getId())
                .receiptNo(savedDonation.getReceiptNo())
                .donationDate(savedDonation.getDonationDate())
                .donorSource(savedDonation.getDonorSource())
                .familyId(savedDonation.getFamily() != null ? savedDonation.getFamily().getId() : null)
                .driveId(savedDonation.getDrive() != null ? savedDonation.getDrive().getId() : null)
                .pledgeId(savedDonation.getPledge() != null ? savedDonation.getPledge().getId() : null)
                .donorName(savedDonation.getDonorName())
                .donorNameTa(savedDonation.getDonorNameTa())
                .village(savedDonation.getVillage())
                .area(savedDonation.getArea())
                .state(savedDonation.getState())
                .country(savedDonation.getCountry())
                .phone(savedDonation.getPhone())
                .paymentMode(savedDonation.getPaymentMode())
                .amount(savedDonation.getAmount())
                .bookNo(savedDonation.getBookNo())
                .manualReceiptNo(savedDonation.getManualReceiptNo())
                .physicalBookReceiptNo(savedDonation.getPhysicalBookReceiptNo())
                .gpayTransactionId(savedDonation.getGpayTransactionId())
                .notes(savedDonation.getNotes())
                .itemCategory(inKind != null ? inKind.getItemCategory() : null)
                .itemDescription(inKind != null ? inKind.getItemDescription() : null)
                .quantity(inKind != null ? inKind.getQuantity() : null)
                .unit(inKind != null ? inKind.getUnit() : null)
                .approximateUnitRate(inKind != null ? inKind.getApproximateUnitRate() : null)
                .totalEstimatedValue(inKind != null ? inKind.getTotalEstimatedValue() : null)
                .storageLocation(inKind != null ? inKind.getStorageLocation() : null)
                .cumulativePaidForDriveOrPledge(cumulativePaid)
                .remainingDueForDriveOrPledge(remainingDue)
                .pledgeStatus(pledgeStatus)
                .journalEntryId(journalEntry.getId())
                .journalEntryNumber(journalEntry.getEntryNumber())
                .createdAt(savedDonation.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<DonorProfileDto> searchDonors(String query) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }
        String q = query.trim();
        Map<String, DonorProfileDto> profileMap = new LinkedHashMap<>();

        // 1. Search past donations
        List<Donation> pastDonations = donationRepository.searchDonorsByName(q);
        for (Donation d : pastDonations) {
            String areaVal = d.getArea() != null ? d.getArea() : d.getVillage();
            String key = (d.getDonorName() + "|" + (areaVal != null ? areaVal : "")).toLowerCase();
            if (!profileMap.containsKey(key)) {
                profileMap.put(key, DonorProfileDto.builder()
                        .donorName(d.getDonorName())
                        .donorNameTa(d.getDonorNameTa())
                        .area(areaVal)
                        .state(d.getState() != null ? d.getState() : "Tamil Nadu")
                        .country(d.getCountry() != null ? d.getCountry() : "India")
                        .phone(d.getPhone())
                        .familyId(d.getFamily() != null ? d.getFamily().getId() : null)
                        .familyCode(d.getFamily() != null ? d.getFamily().getFamilyCode() : null)
                        .build());
            }
        }

        // 2. Search master families
        List<Family> families = familyRepository.findByHeadNameContainingIgnoreCase(q);
        for (Family f : families) {
            String areaVal = f.getArea() != null ? f.getArea() : f.getVillage();
            String key = (f.getHeadName() + "|" + (areaVal != null ? areaVal : "")).toLowerCase();
            if (!profileMap.containsKey(key)) {
                profileMap.put(key, DonorProfileDto.builder()
                        .donorName(f.getHeadName())
                        .donorNameTa(f.getHeadNameTa())
                        .area(areaVal)
                        .state(f.getState() != null ? f.getState() : "Tamil Nadu")
                        .country(f.getCountry() != null ? f.getCountry() : "India")
                        .phone(f.getPhone())
                        .familyId(f.getId())
                        .familyCode(f.getFamilyCode())
                        .build());
            }
        }

        return new ArrayList<>(profileMap.values());
    }

    @Transactional(readOnly = true)
    public List<String> searchAreas(String query) {
        String q = (query != null) ? query.trim() : "";
        return donationRepository.searchAreas(q);
    }

    private synchronized String generateUniqueReceiptNo(LocalDate donationDate) {
        int year = donationDate.getYear();
        String prefix = String.format("RCT-%d-", year);
        long count = donationRepository.countByReceiptNoStartingWith(prefix);
        long seq = count + 1;
        String receiptNo = String.format("RCT-%d-%05d", year, seq);

        while (donationRepository.existsByReceiptNo(receiptNo)) {
            seq++;
            receiptNo = String.format("RCT-%d-%05d", year, seq);
        }
        return receiptNo;
    }
}
