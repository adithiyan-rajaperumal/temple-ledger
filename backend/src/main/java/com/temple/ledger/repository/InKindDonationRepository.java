package com.temple.ledger.repository;

import com.temple.ledger.domain.inflow.InKindDonation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InKindDonationRepository extends JpaRepository<InKindDonation, UUID> {

    Optional<InKindDonation> findByDonationId(UUID donationId);

    @Query("SELECT COALESCE(SUM(ik.quantity), 0) FROM InKindDonation ik WHERE ik.donation.pledge.id = :pledgeId")
    BigDecimal sumQuantityByPledgeId(@Param("pledgeId") UUID pledgeId);
}
