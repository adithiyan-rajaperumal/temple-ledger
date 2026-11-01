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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DriveManagementServiceTest {

    @Autowired
    private DriveManagementService driveManagementService;

    @Autowired
    private FamilyRepository familyRepository;

    @Autowired
    private DriveRepository driveRepository;

    @Autowired
    private DriveFamilyAllocationRepository allocationRepository;

    @Autowired
    private PledgeRepository pledgeRepository;

    @Autowired
    private AuditService auditService;

    private List<Family> seededFamilies = new ArrayList<>();

    @BeforeEach
    void setUp() {
        // Seed 60 active families + 1 inactive family
        for (int i = 1; i <= 60; i++) {
            Family family = driveManagementService.createFamily(CreateFamilyRequest.builder()
                    .familyCode(String.format("FAM-%03d", i))
                    .headName("Family Head " + i)
                    .headNameTa("குடும்ப தலைவர் " + i)
                    .doorNo("No. " + i)
                    .street("North Street")
                    .village("Main Village")
                    .phone(String.format("98765%05d", i))
                    .isActive(true)
                    .build());
            seededFamilies.add(family);
        }

        // 1 inactive family to verify exclusion
        driveManagementService.createFamily(CreateFamilyRequest.builder()
                .familyCode("FAM-INACTIVE-01")
                .headName("Inactive Member")
                .doorNo("No. 999")
                .street("Outskirts")
                .village("Main Village")
                .phone("9999999999")
                .isActive(false)
                .build());
    }

    @Test
    @DisplayName("Step 1: Creating Drive 1 (₹10,000) and initializing 60 families creates 60 allocations with ₹10,000 target")
    void testInitializeDriveAllocationsFor60Families() {
        Drive drive1 = driveManagementService.createDrive(CreateDriveRequest.builder()
                .code("DRIVE-1")
                .name("Phase 1 Renovation Fund")
                .nameTa("முதல் கட்ட திருப்பணி நிதி")
                .defaultTargetPerFamily(new BigDecimal("10000.00"))
                .startDate(LocalDate.of(2026, 1, 1))
                .status(DriveStatus.ACTIVE)
                .description("Initial ₹10,000 per family renovation drive")
                .build());

        List<DriveFamilyAllocation> allocations = driveManagementService.initializeDriveAllocations(drive1.getId());

        assertThat(allocations).hasSize(60);
        assertThat(allocations).allMatch(a -> a.getTargetAmount().compareTo(new BigDecimal("10000.00")) == 0);
        assertThat(allocations).allMatch(a -> a.getStatus() == CommitmentStatus.PARTICIPATING);

        DriveProgressSummary progress = driveManagementService.getDriveProgress(drive1.getId());
        assertThat(progress.getTotalAllocationsCount()).isEqualTo(60);
        assertThat(progress.getParticipatingCount()).isEqualTo(60);
        assertThat(progress.getOptedOutCount()).isEqualTo(0);
        assertThat(progress.getTotalActiveTarget()).isEqualByComparingTo(new BigDecimal("600000.00"));
        assertThat(progress.getTotalTargetAmount()).isEqualByComparingTo(new BigDecimal("600000.00"));
    }

    @Test
    @DisplayName("Step 2: Opt-out of a family updates status to OPTED_OUT and adjusts total active target")
    void testFamilyOptOutAdjustsTotalTarget() {
        Drive drive1 = driveManagementService.createDrive(CreateDriveRequest.builder()
                .code("DRIVE-1")
                .name("Phase 1 Renovation Fund")
                .defaultTargetPerFamily(new BigDecimal("10000.00"))
                .startDate(LocalDate.of(2026, 1, 1))
                .build());

        driveManagementService.initializeDriveAllocations(drive1.getId());

        Family familyToOptOut = seededFamilies.get(0);

        DriveFamilyAllocation updatedAllocation = driveManagementService.updateAllocation(
                drive1.getId(),
                familyToOptOut.getId(),
                UpdateAllocationRequest.builder()
                        .status(CommitmentStatus.OPTED_OUT)
                        .notes("Family opted out due to financial hardship")
                        .build()
        );

        assertThat(updatedAllocation.getStatus()).isEqualTo(CommitmentStatus.OPTED_OUT);
        assertThat(updatedAllocation.getNotes()).isEqualTo("Family opted out due to financial hardship");

        List<com.temple.ledger.domain.audit.AuditLog> logs = auditService.getAuditHistory("DRIVE_ALLOCATION", updatedAllocation.getId().toString());
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getAction()).isEqualTo("UPDATE");
        assertThat(logs.get(0).getPerformedBy()).isEqualTo("admin");
        assertThat(logs.get(0).getChangeReason()).contains(familyToOptOut.getFamilyCode());

        DriveProgressSummary progress = driveManagementService.getDriveProgress(drive1.getId());
        assertThat(progress.getTotalAllocationsCount()).isEqualTo(60);
        assertThat(progress.getParticipatingCount()).isEqualTo(59);
        assertThat(progress.getOptedOutCount()).isEqualTo(1);
        // Total active target = 59 * 10,000 = 590,000
        assertThat(progress.getTotalActiveTarget()).isEqualByComparingTo(new BigDecimal("590000.00"));
    }

    @Test
    @DisplayName("Step 3: Custom target quota for an individual family updates allocation target and active total")
    void testCustomTargetQuotaForIndividualFamily() {
        Drive drive1 = driveManagementService.createDrive(CreateDriveRequest.builder()
                .code("DRIVE-1")
                .name("Phase 1 Renovation Fund")
                .defaultTargetPerFamily(new BigDecimal("10000.00"))
                .startDate(LocalDate.of(2026, 1, 1))
                .build());

        driveManagementService.initializeDriveAllocations(drive1.getId());

        Family familyWithHigherTarget = seededFamilies.get(1);

        DriveFamilyAllocation updatedAllocation = driveManagementService.updateAllocation(
                drive1.getId(),
                familyWithHigherTarget.getId(),
                UpdateAllocationRequest.builder()
                        .targetAmount(new BigDecimal("15000.00"))
                        .notes("Pledged extra ₹5,000 voluntarily")
                        .build()
        );

        assertThat(updatedAllocation.getTargetAmount()).isEqualByComparingTo(new BigDecimal("15000.00"));
        assertThat(updatedAllocation.getStatus()).isEqualTo(CommitmentStatus.PARTICIPATING);

        DriveProgressSummary progress = driveManagementService.getDriveProgress(drive1.getId());
        assertThat(progress.getParticipatingCount()).isEqualTo(60);
        // 59 * 10,000 + 15,000 = 605,000
        assertThat(progress.getTotalActiveTarget()).isEqualByComparingTo(new BigDecimal("605000.00"));
    }

    @Test
    @DisplayName("Step 4: Creating Drive 2 (₹20,000) creates independent allocations without affecting Drive 1")
    void testMultipleDrivesHaveIndependentAllocations() {
        // Create Drive 1 (₹10,000)
        Drive drive1 = driveManagementService.createDrive(CreateDriveRequest.builder()
                .code("DRIVE-1")
                .name("Drive 1")
                .defaultTargetPerFamily(new BigDecimal("10000.00"))
                .startDate(LocalDate.of(2026, 1, 1))
                .build());
        driveManagementService.initializeDriveAllocations(drive1.getId());

        // Family 0 opts out of Drive 1
        Family fam0 = seededFamilies.get(0);
        driveManagementService.updateAllocation(drive1.getId(), fam0.getId(),
                UpdateAllocationRequest.builder()
                        .status(CommitmentStatus.OPTED_OUT)
                        .notes("Opted out of Drive 1")
                        .build());

        // Create Drive 2 (₹20,000)
        Drive drive2 = driveManagementService.createDrive(CreateDriveRequest.builder()
                .code("DRIVE-2")
                .name("Drive 2 - Raja Gopuram Fund")
                .defaultTargetPerFamily(new BigDecimal("20000.00"))
                .startDate(LocalDate.of(2026, 6, 1))
                .build());
        List<DriveFamilyAllocation> allocationsDrive2 = driveManagementService.initializeDriveAllocations(drive2.getId());

        // Verify Drive 2 has 60 allocations at ₹20,000, all PARTICIPATING
        assertThat(allocationsDrive2).hasSize(60);
        assertThat(allocationsDrive2).allMatch(a -> a.getTargetAmount().compareTo(new BigDecimal("20000.00")) == 0);
        assertThat(allocationsDrive2).allMatch(a -> a.getStatus() == CommitmentStatus.PARTICIPATING);

        DriveProgressSummary progressDrive2 = driveManagementService.getDriveProgress(drive2.getId());
        assertThat(progressDrive2.getParticipatingCount()).isEqualTo(60);
        assertThat(progressDrive2.getTotalActiveTarget()).isEqualByComparingTo(new BigDecimal("1200000.00"));

        // Verify Drive 1 progress is unchanged
        DriveProgressSummary progressDrive1 = driveManagementService.getDriveProgress(drive1.getId());
        assertThat(progressDrive1.getParticipatingCount()).isEqualTo(59);
        assertThat(progressDrive1.getOptedOutCount()).isEqualTo(1);
        assertThat(progressDrive1.getTotalActiveTarget()).isEqualByComparingTo(new BigDecimal("590000.00"));
    }

    @Test
    @DisplayName("Step 5: Universal Pledge creation (monetary and in-kind material)")
    void testUniversalPledgeCreation() {
        Family family = seededFamilies.get(2);
        Drive drive = driveManagementService.createDrive(CreateDriveRequest.builder()
                .code("DRIVE-SPECIAL")
                .name("Special Kumbhabhishekam Fund")
                .defaultTargetPerFamily(new BigDecimal("10000.00"))
                .startDate(LocalDate.of(2026, 1, 1))
                .build());

        // 1. Monetary pledge linked to family and drive
        Pledge monetaryPledge = driveManagementService.createPledge(CreatePledgeRequest.builder()
                .pledgeCode("PLG-2026-0001")
                .pledgeDate(LocalDate.of(2026, 2, 1))
                .pledgeType(PledgeType.MONETARY)
                .donorName("Murugan K")
                .donorNameTa("முருகன் கே")
                .village("Main Village")
                .phone("9876543210")
                .familyId(family.getId())
                .driveId(drive.getId())
                .targetMonetaryAmount(new BigDecimal("50000.00"))
                .notes("Pledged ₹50,000 payable in 5 monthly installments")
                .createdBy("admin")
                .build());

        assertThat(monetaryPledge.getId()).isNotNull();
        assertThat(monetaryPledge.getPledgeCode()).isEqualTo("PLG-2026-0001");
        assertThat(monetaryPledge.getPledgeType()).isEqualTo(PledgeType.MONETARY);
        assertThat(monetaryPledge.getTargetMonetaryAmount()).isEqualByComparingTo(new BigDecimal("50000.00"));
        assertThat(monetaryPledge.getStatus()).isEqualTo(PledgeStatus.PENDING);
        assertThat(monetaryPledge.getFamily().getId()).isEqualTo(family.getId());
        assertThat(monetaryPledge.getDrive().getId()).isEqualTo(drive.getId());

        // 2. In-kind material pledge (external donor, e.g. 100 bags cement)
        Pledge materialPledge = driveManagementService.createPledge(CreatePledgeRequest.builder()
                .pledgeCode("PLG-2026-0002")
                .pledgeDate(LocalDate.of(2026, 2, 5))
                .pledgeType(PledgeType.IN_KIND_MATERIAL)
                .donorName("Chennai Devotee Trust")
                .donorNameTa("சென்னை பக்தர் அறக்கட்டளை")
                .village("Chennai")
                .phone("9841012345")
                .targetMaterialDesc("Ultratech 53-grade Cement")
                .targetMaterialQty(new BigDecimal("100.00"))
                .targetMaterialUnit("BAGS")
                .notes("Sponsoring 100 bags cement for pillar construction")
                .createdBy("admin")
                .build());

        assertThat(materialPledge.getId()).isNotNull();
        assertThat(materialPledge.getPledgeType()).isEqualTo(PledgeType.IN_KIND_MATERIAL);
        assertThat(materialPledge.getTargetMaterialQty()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(materialPledge.getTargetMaterialUnit()).isEqualTo("BAGS");
        assertThat(materialPledge.getFamily()).isNull();
        assertThat(materialPledge.getDrive()).isNull();
    }

    @Test
    @DisplayName("Step 6: Idempotency of initializeDriveAllocations")
    void testInitializeDriveAllocationsIdempotency() {
        Drive drive = driveManagementService.createDrive(CreateDriveRequest.builder()
                .code("DRIVE-IDEMPOTENT")
                .name("Idempotent Drive")
                .defaultTargetPerFamily(new BigDecimal("10000.00"))
                .startDate(LocalDate.of(2026, 1, 1))
                .build());

        List<DriveFamilyAllocation> firstInit = driveManagementService.initializeDriveAllocations(drive.getId());
        assertThat(firstInit).hasSize(60);

        // Customize one allocation
        Family fam = seededFamilies.get(0);
        driveManagementService.updateAllocation(drive.getId(), fam.getId(),
                UpdateAllocationRequest.builder()
                        .targetAmount(new BigDecimal("12000.00"))
                        .status(CommitmentStatus.PARTICIPATING)
                        .notes("Custom quota")
                        .build());

        // Run initialize again
        List<DriveFamilyAllocation> secondInit = driveManagementService.initializeDriveAllocations(drive.getId());
        assertThat(secondInit).hasSize(60);

        // Verify the customized allocation was not overwritten
        DriveFamilyAllocation famAlloc = allocationRepository.findByDriveIdAndFamilyId(drive.getId(), fam.getId())
                .orElseThrow();
        assertThat(famAlloc.getTargetAmount()).isEqualByComparingTo(new BigDecimal("12000.00"));
        assertThat(famAlloc.getNotes()).isEqualTo("Custom quota");
    }
}
