package com.temple.ledger.service;

import com.temple.ledger.domain.community.CommitmentStatus;
import com.temple.ledger.domain.community.Drive;
import com.temple.ledger.domain.community.DriveFamilyAllocation;
import com.temple.ledger.domain.community.DriveStatus;
import com.temple.ledger.domain.community.Family;
import com.temple.ledger.domain.community.Pledge;
import com.temple.ledger.domain.community.PledgeStatus;
import com.temple.ledger.domain.community.PledgeType;
import com.temple.ledger.repository.DriveFamilyAllocationRepository;
import com.temple.ledger.repository.DriveRepository;
import com.temple.ledger.repository.FamilyRepository;
import com.temple.ledger.repository.PledgeRepository;
import com.temple.ledger.service.dto.CreateDriveRequest;
import com.temple.ledger.service.dto.CreateFamilyRequest;
import com.temple.ledger.service.dto.CreatePledgeRequest;
import com.temple.ledger.service.dto.DriveProgressSummary;
import com.temple.ledger.service.dto.UpdateAllocationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DriveManagementService {

    private final FamilyRepository familyRepository;
    private final DriveRepository driveRepository;
    private final DriveFamilyAllocationRepository allocationRepository;
    private final PledgeRepository pledgeRepository;
    private final AuditService auditService;

    public Drive createDrive(CreateDriveRequest request) {
        log.info("Creating drive with code: {}", request.getCode());
        Drive drive = Drive.builder()
                .code(request.getCode())
                .name(request.getName())
                .nameTa(request.getNameTa())
                .defaultTargetPerFamily(request.getDefaultTargetPerFamily())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(request.getStatus() != null ? request.getStatus() : DriveStatus.ACTIVE)
                .description(request.getDescription())
                .build();
        return driveRepository.save(drive);
    }

    @Transactional(readOnly = true)
    public Optional<Drive> findDriveById(UUID driveId) {
        return driveRepository.findById(driveId);
    }

    public Family createFamily(CreateFamilyRequest request) {
        log.info("Creating family with code: {}", request.getFamilyCode());
        Family family = Family.builder()
                .familyCode(request.getFamilyCode())
                .headName(request.getHeadName())
                .headNameTa(request.getHeadNameTa())
                .doorNo(request.getDoorNo())
                .street(request.getStreet())
                .village(request.getVillage() != null ? request.getVillage() : "Main Village")
                .phone(request.getPhone())
                .isActive(request.isActive())
                .build();
        return familyRepository.save(family);
    }

    public Family createFamily(Family family) {
        return familyRepository.save(family);
    }

    @Transactional(readOnly = true)
    public Optional<Family> findFamilyById(UUID familyId) {
        return familyRepository.findById(familyId);
    }

    @Transactional(readOnly = true)
    public List<Family> getActiveFamilies() {
        return familyRepository.findByIsActiveTrue();
    }

    public List<DriveFamilyAllocation> initializeDriveAllocations(UUID driveId) {
        log.info("Initializing drive allocations for drive: {}", driveId);
        Drive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new IllegalArgumentException("Drive not found with ID: " + driveId));

        List<Family> activeFamilies = familyRepository.findByIsActiveTrue();
        List<DriveFamilyAllocation> newlyCreatedAllocations = new ArrayList<>();

        for (Family family : activeFamilies) {
            boolean exists = allocationRepository.existsByDriveIdAndFamilyId(driveId, family.getId());
            if (!exists) {
                DriveFamilyAllocation allocation = DriveFamilyAllocation.builder()
                        .drive(drive)
                        .family(family)
                        .targetAmount(drive.getDefaultTargetPerFamily())
                        .status(CommitmentStatus.PARTICIPATING)
                        .build();
                newlyCreatedAllocations.add(allocation);
            }
        }

        if (!newlyCreatedAllocations.isEmpty()) {
            allocationRepository.saveAll(newlyCreatedAllocations);
            log.info("Saved {} new allocations for drive {}", newlyCreatedAllocations.size(), driveId);
        }

        return allocationRepository.findByDriveId(driveId);
    }

    public DriveFamilyAllocation updateAllocation(UUID driveId, UUID familyId, UpdateAllocationRequest request) {
        log.info("Updating allocation for drive: {}, family: {}", driveId, familyId);
        DriveFamilyAllocation allocation = allocationRepository.findByDriveIdAndFamilyId(driveId, familyId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Allocation not found for drive: " + driveId + " and family: " + familyId));

        Family family = allocation.getFamily();
        UpdateAllocationRequest beforeState = UpdateAllocationRequest.builder()
                .targetAmount(allocation.getTargetAmount())
                .status(allocation.getStatus())
                .notes(allocation.getNotes())
                .build();

        if (request.getTargetAmount() != null) {
            allocation.setTargetAmount(request.getTargetAmount());
        }
        if (request.getStatus() != null) {
            allocation.setStatus(request.getStatus());
        }
        if (request.getNotes() != null) {
            allocation.setNotes(request.getNotes());
        }

        DriveFamilyAllocation saved = allocationRepository.save(allocation);

        auditService.logAction(
                "DRIVE_ALLOCATION",
                saved.getId().toString(),
                "UPDATE",
                "admin",
                beforeState,
                request,
                "Allocation updated for family: " + (family != null ? family.getFamilyCode() : familyId)
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public DriveProgressSummary getDriveProgress(UUID driveId) {
        Drive drive = driveRepository.findById(driveId)
                .orElseThrow(() -> new IllegalArgumentException("Drive not found with ID: " + driveId));

        List<DriveFamilyAllocation> allocations = allocationRepository.findByDriveId(driveId);

        int participatingCount = 0;
        int optedOutCount = 0;
        int exemptedCount = 0;
        BigDecimal totalActiveTarget = BigDecimal.ZERO;

        for (DriveFamilyAllocation allocation : allocations) {
            if (allocation.getStatus() == CommitmentStatus.PARTICIPATING) {
                participatingCount++;
                totalActiveTarget = totalActiveTarget.add(allocation.getTargetAmount());
            } else if (allocation.getStatus() == CommitmentStatus.OPTED_OUT) {
                optedOutCount++;
            } else if (allocation.getStatus() == CommitmentStatus.EXEMPTED) {
                exemptedCount++;
            }
        }

        return DriveProgressSummary.builder()
                .driveId(drive.getId())
                .driveCode(drive.getCode())
                .driveName(drive.getName())
                .defaultTargetPerFamily(drive.getDefaultTargetPerFamily())
                .totalActiveTarget(totalActiveTarget)
                .totalTargetAmount(totalActiveTarget)
                .totalAllocationsCount(allocations.size())
                .participatingCount(participatingCount)
                .optedOutCount(optedOutCount)
                .exemptedCount(exemptedCount)
                .allocations(allocations)
                .build();
    }

    @Transactional(readOnly = true)
    public DriveProgressSummary getDriveFamilyProgress(UUID driveId) {
        return getDriveProgress(driveId);
    }

    public Pledge createPledge(CreatePledgeRequest request) {
        log.info("Creating pledge with code: {}", request.getPledgeCode());
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

        Pledge pledge = Pledge.builder()
                .pledgeCode(request.getPledgeCode())
                .pledgeDate(request.getPledgeDate())
                .pledgeType(request.getPledgeType() != null ? request.getPledgeType() : PledgeType.MONETARY)
                .donorName(request.getDonorName())
                .donorNameTa(request.getDonorNameTa())
                .village(request.getVillage())
                .phone(request.getPhone())
                .family(family)
                .drive(drive)
                .targetMonetaryAmount(request.getTargetMonetaryAmount() != null ? request.getTargetMonetaryAmount() : BigDecimal.ZERO)
                .targetMaterialDesc(request.getTargetMaterialDesc())
                .targetMaterialQty(request.getTargetMaterialQty() != null ? request.getTargetMaterialQty() : BigDecimal.ZERO)
                .targetMaterialUnit(request.getTargetMaterialUnit())
                .status(request.getStatus() != null ? request.getStatus() : PledgeStatus.PENDING)
                .notes(request.getNotes())
                .createdBy(request.getCreatedBy() != null ? request.getCreatedBy() : "system")
                .build();

        return pledgeRepository.save(pledge);
    }

    public Pledge createPledge(Pledge pledge) {
        return pledgeRepository.save(pledge);
    }

    @Transactional(readOnly = true)
    public List<Pledge> listPledges() {
        return pledgeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Pledge> findPledgeById(UUID pledgeId) {
        return pledgeRepository.findById(pledgeId);
    }

    @Transactional(readOnly = true)
    public Optional<Pledge> findPledgeByCode(String pledgeCode) {
        return pledgeRepository.findByPledgeCode(pledgeCode);
    }
}
