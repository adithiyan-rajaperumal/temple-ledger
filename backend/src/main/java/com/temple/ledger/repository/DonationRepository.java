package com.temple.ledger.repository;

import com.temple.ledger.domain.inflow.Donation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DonationRepository extends JpaRepository<Donation, UUID> {

    Optional<Donation> findByReceiptNo(String receiptNo);

    boolean existsByReceiptNo(String receiptNo);

    long countByReceiptNoStartingWith(String prefix);

    boolean existsByGpayTransactionId(String gpayTransactionId);

    List<Donation> findByDriveIdAndFamilyId(UUID driveId, UUID familyId);

    List<Donation> findByPledgeId(UUID pledgeId);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.drive.id = :driveId AND d.family.id = :familyId")
    BigDecimal sumAmountByDriveIdAndFamilyId(@Param("driveId") UUID driveId, @Param("familyId") UUID familyId);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.pledge.id = :pledgeId")
    BigDecimal sumAmountByPledgeId(@Param("pledgeId") UUID pledgeId);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.paymentMode != com.temple.ledger.domain.inflow.PaymentMode.IN_KIND")
    BigDecimal sumTotalMonetaryDonations();

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Donation d WHERE d.drive.id = :driveId")
    BigDecimal sumAmountByDriveId(@Param("driveId") UUID driveId);
}
