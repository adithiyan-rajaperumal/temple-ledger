package com.temple.ledger.service;

import com.temple.ledger.domain.accounting.Account;
import com.temple.ledger.domain.accounting.AccountType;
import com.temple.ledger.domain.accounting.JournalEntry;
import com.temple.ledger.exception.UnbalancedJournalException;
import com.temple.ledger.repository.AccountRepository;
import com.temple.ledger.repository.JournalEntryRepository;
import com.temple.ledger.repository.JournalPostingRepository;
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
class AccountingEngineServiceTest {

    @Autowired
    private AccountingEngineService accountingEngineService;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private JournalEntryRepository journalEntryRepository;

    @Autowired
    private JournalPostingRepository journalPostingRepository;

    private Account cashAccount;
    private Account generalDonationsAccount;
    private Account contractorPayablesAccount;
    private Account labourExpenseAccount;
    private Account villageEquityAccount;

    @BeforeEach
    void setUp() {
        cashAccount = accountRepository.save(Account.builder()
                .code("1010")
                .name("Cash in Hand")
                .nameTa("ரொக்க இருப்பு")
                .type(AccountType.ASSET)
                .isActive(true)
                .build());

        generalDonationsAccount = accountRepository.save(Account.builder()
                .code("4020")
                .name("Devotee General Donations")
                .nameTa("பொது நன்கொடை")
                .type(AccountType.INCOME)
                .isActive(true)
                .build());

        contractorPayablesAccount = accountRepository.save(Account.builder()
                .code("2010")
                .name("Contractor Payables")
                .nameTa("ஒப்பந்ததாரர் நிலுவை")
                .type(AccountType.LIABILITY)
                .isActive(true)
                .build());

        labourExpenseAccount = accountRepository.save(Account.builder()
                .code("5020")
                .name("Labour Wages")
                .nameTa("கூலி செலவுகள்")
                .type(AccountType.EXPENSE)
                .isActive(true)
                .build());

        villageEquityAccount = accountRepository.save(Account.builder()
                .code("3010")
                .name("Village Family Drives Equity")
                .nameTa("கிராம நிதி")
                .type(AccountType.EQUITY)
                .isActive(true)
                .build());
    }

    @Test
    @DisplayName("Step 1: Fail when debits do not match credits with UnbalancedJournalException")
    void whenDebitsDoNotMatchCredits_thenThrowUnbalancedJournalException() {
        List<PostingItem> postings = List.of(
                PostingItem.debit(cashAccount.getId(), new BigDecimal("1000.00")),
                PostingItem.credit(generalDonationsAccount.getId(), new BigDecimal("950.00"))
        );

        assertThatThrownBy(() -> accountingEngineService.createBalancedJournalEntry(
                LocalDate.now(),
                "Unbalanced cash donation test",
                "DONATION",
                UUID.randomUUID(),
                "admin",
                postings
        ))
                .isInstanceOf(UnbalancedJournalException.class)
                .hasMessageContaining("Unbalanced journal entry");
    }

    @Test
    @DisplayName("Should post balanced journal entry successfully and persist postings")
    void whenBalancedPostingsProvided_thenSuccessfullyPostJournalEntry() {
        List<PostingItem> postings = List.of(
                PostingItem.debit(cashAccount.getId(), new BigDecimal("5000.00")),
                PostingItem.credit(generalDonationsAccount.getId(), new BigDecimal("5000.00"))
        );

        JournalEntry savedEntry = accountingEngineService.createBalancedJournalEntry(
                LocalDate.of(2026, 11, 1),
                "Devotee general cash contribution",
                "DONATION",
                UUID.randomUUID(),
                "treasurer",
                postings
        );

        assertThat(savedEntry).isNotNull();
        assertThat(savedEntry.getId()).isNotNull();
        assertThat(savedEntry.getEntryNumber()).startsWith("JE-2026-");
        assertThat(savedEntry.getPostings()).hasSize(2);

        // Verify retrieval from repository
        JournalEntry fetched = journalEntryRepository.findById(savedEntry.getId()).orElseThrow();
        assertThat(fetched.getDescription()).isEqualTo("Devotee general cash contribution");
        assertThat(fetched.getPostings()).hasSize(2);
    }

    @Test
    @DisplayName("Should reject single-sided postings (less than 2 lines)")
    void whenSingleSidedPosting_thenThrowException() {
        List<PostingItem> singlePosting = List.of(
                PostingItem.debit(cashAccount.getId(), new BigDecimal("1000.00"))
        );

        assertThatThrownBy(() -> accountingEngineService.createBalancedJournalEntry(
                LocalDate.now(),
                "Single-sided entry attempt",
                "ADJUSTMENT",
                null,
                "admin",
                singlePosting
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least two postings");
    }

    @Test
    @DisplayName("Should reject entry with zero total amount")
    void whenZeroTotalAmount_thenThrowException() {
        List<PostingItem> zeroPostings = List.of(
                PostingItem.debit(cashAccount.getId(), BigDecimal.ZERO),
                PostingItem.credit(generalDonationsAccount.getId(), BigDecimal.ZERO)
        );

        assertThatThrownBy(() -> accountingEngineService.createBalancedJournalEntry(
                LocalDate.now(),
                "Zero amount entry",
                "ADJUSTMENT",
                null,
                "admin",
                zeroPostings
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("greater than zero");
    }

    @Test
    @DisplayName("Should reject postings referencing non-existent accounts")
    void whenAccountNotFound_thenThrowException() {
        UUID nonExistentId = UUID.randomUUID();
        List<PostingItem> postings = List.of(
                PostingItem.debit(nonExistentId, new BigDecimal("100.00")),
                PostingItem.credit(generalDonationsAccount.getId(), new BigDecimal("100.00"))
        );

        assertThatThrownBy(() -> accountingEngineService.createBalancedJournalEntry(
                LocalDate.now(),
                "Unknown account entry",
                "ADJUSTMENT",
                null,
                "admin",
                postings
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Account not found");
    }

    @Test
    @DisplayName("Should compute account balances accurately for all AccountTypes")
    void whenCalculatingAccountBalance_thenComputesCorrectlyPerAccountType() {
        LocalDate date = LocalDate.of(2026, 11, 1);

        // 1. ASSET (Cash): Debit 10,000, Credit 3,000 -> Expected Balance: 7,000
        accountingEngineService.createBalancedJournalEntry(
                date, "Devotee cash gift", "DONATION", null, "admin",
                List.of(
                        PostingItem.debit(cashAccount.getId(), new BigDecimal("10000.00")),
                        PostingItem.credit(generalDonationsAccount.getId(), new BigDecimal("10000.00"))
                )
        );

        // 2. EXPENSE (Labour): Debit 3,000 from Cash (Cash credit 3,000)
        accountingEngineService.createBalancedJournalEntry(
                date, "Mason wages", "EXPENSE", null, "admin",
                List.of(
                        PostingItem.debit(labourExpenseAccount.getId(), new BigDecimal("3000.00")),
                        PostingItem.credit(cashAccount.getId(), new BigDecimal("3000.00"))
                )
        );

        // 3. LIABILITY (Contractor): Credit 5,000 (Expense debit 5,000)
        accountingEngineService.createBalancedJournalEntry(
                date, "Scaffolding contractor invoice", "CONTRACT_INVOICE", null, "admin",
                List.of(
                        PostingItem.debit(labourExpenseAccount.getId(), new BigDecimal("5000.00")),
                        PostingItem.credit(contractorPayablesAccount.getId(), new BigDecimal("5000.00"))
                )
        );

        // 4. EQUITY: Credit 15,000
        accountingEngineService.createBalancedJournalEntry(
                date, "Village equity seed", "EQUITY_SEED", null, "admin",
                List.of(
                        PostingItem.debit(cashAccount.getId(), new BigDecimal("15000.00")),
                        PostingItem.credit(villageEquityAccount.getId(), new BigDecimal("15000.00"))
                )
        );

        // Assert balances:
        // Cash (ASSET): 10,000 - 3,000 + 15,000 = 22,000
        assertThat(accountingEngineService.getAccountBalance(cashAccount.getId()))
                .isEqualByComparingTo(new BigDecimal("22000.00"));
        assertThat(accountingEngineService.getAccountBalanceByCode("1010"))
                .isEqualByComparingTo(new BigDecimal("22000.00"));

        // Labour (EXPENSE): 3,000 + 5,000 = 8,000
        assertThat(accountingEngineService.getAccountBalance(labourExpenseAccount.getId()))
                .isEqualByComparingTo(new BigDecimal("8000.00"));

        // Devotee General Donations (INCOME): 10,000
        assertThat(accountingEngineService.getAccountBalance(generalDonationsAccount.getId()))
                .isEqualByComparingTo(new BigDecimal("10000.00"));

        // Contractor Payables (LIABILITY): 5,000
        assertThat(accountingEngineService.getAccountBalance(contractorPayablesAccount.getId()))
                .isEqualByComparingTo(new BigDecimal("5000.00"));

        // Village Equity (EQUITY): 15,000
        assertThat(accountingEngineService.getAccountBalance(villageEquityAccount.getId()))
                .isEqualByComparingTo(new BigDecimal("15000.00"));
    }

    @Test
    @DisplayName("Should generate sequential entry numbers formatted as JE-YYYY-XXXXX")
    void whenSequentialEntriesPosted_thenEntryNumbersIncrementDeterministically() {
        LocalDate date = LocalDate.of(2026, 11, 2);

        JournalEntry je1 = accountingEngineService.createBalancedJournalEntry(
                date, "First entry", "DONATION", null, "admin",
                List.of(
                        PostingItem.debit(cashAccount.getId(), new BigDecimal("100.00")),
                        PostingItem.credit(generalDonationsAccount.getId(), new BigDecimal("100.00"))
                )
        );

        JournalEntry je2 = accountingEngineService.createBalancedJournalEntry(
                date, "Second entry", "DONATION", null, "admin",
                List.of(
                        PostingItem.debit(cashAccount.getId(), new BigDecimal("200.00")),
                        PostingItem.credit(generalDonationsAccount.getId(), new BigDecimal("200.00"))
                )
        );

        assertThat(je1.getEntryNumber()).isEqualTo("JE-2026-00001");
        assertThat(je2.getEntryNumber()).isEqualTo("JE-2026-00002");
    }

    @Test
    @DisplayName("Should support multi-legged split journal entries (compound entries)")
    void whenMultiLegSplitEntryPosted_thenValidatesBalanceAndPersistsAllPostings() {
        LocalDate date = LocalDate.of(2026, 11, 2);

        // 1 Debit (Cash 1000) = 2 Credits (General Donations 700 + Village Equity 300)
        List<PostingItem> compoundPostings = List.of(
                PostingItem.debit(cashAccount.getId(), new BigDecimal("1000.00")),
                PostingItem.credit(generalDonationsAccount.getId(), new BigDecimal("700.00")),
                PostingItem.credit(villageEquityAccount.getId(), new BigDecimal("300.00"))
        );

        JournalEntry compoundEntry = accountingEngineService.createBalancedJournalEntry(
                date, "Compound donation split", "SPLIT_DONATION", null, "treasurer",
                compoundPostings
        );

        assertThat(compoundEntry.getPostings()).hasSize(3);
        assertThat(accountingEngineService.getAccountBalance(cashAccount.getId()))
                .isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(accountingEngineService.getAccountBalance(generalDonationsAccount.getId()))
                .isEqualByComparingTo(new BigDecimal("700.00"));
        assertThat(accountingEngineService.getAccountBalance(villageEquityAccount.getId()))
                .isEqualByComparingTo(new BigDecimal("300.00"));
    }

    @Test
    @DisplayName("Should reject posting to an inactive account")
    void whenAccountIsInactive_thenThrowIllegalStateException() {
        Account inactiveAccount = accountRepository.save(Account.builder()
                .code("9999")
                .name("Defunct Old Account")
                .type(AccountType.EXPENSE)
                .isActive(false)
                .build());

        List<PostingItem> postings = List.of(
                PostingItem.debit(inactiveAccount.getId(), new BigDecimal("50.00")),
                PostingItem.credit(cashAccount.getId(), new BigDecimal("50.00"))
        );

        assertThatThrownBy(() -> accountingEngineService.createBalancedJournalEntry(
                LocalDate.now(), "Posting to inactive account", "EXPENSE", null, "admin", postings
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("inactive account");
    }

    @Test
    @DisplayName("Should reject postings with negative amounts")
    void whenNegativeAmountsProvided_thenThrowIllegalArgumentException() {
        List<PostingItem> negativePostings = List.of(
                new PostingItem(cashAccount.getId(), new BigDecimal("-50.00"), BigDecimal.ZERO),
                new PostingItem(generalDonationsAccount.getId(), BigDecimal.ZERO, new BigDecimal("-50.00"))
        );

        assertThatThrownBy(() -> accountingEngineService.createBalancedJournalEntry(
                LocalDate.now(), "Negative test", "ADJUSTMENT", null, "admin", negativePostings
        ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("negative");
    }
}
