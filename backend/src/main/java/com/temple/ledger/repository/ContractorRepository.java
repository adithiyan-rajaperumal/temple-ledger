package com.temple.ledger.repository;

import com.temple.ledger.domain.outflow.Contractor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractorRepository extends JpaRepository<Contractor, UUID> {

    List<Contractor> findByTradeIgnoreCase(String trade);

    List<Contractor> findByStatus(String status);
}
