package com.temple.ledger.repository;

import com.temple.ledger.domain.accounting.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByCode(String code);

    List<Account> findAllByIsActiveTrue();

    boolean existsByCode(String code);
}
