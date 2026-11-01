package com.temple.ledger;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MigrationScriptsTest {

    @Test
    void testV1InitSchemaContainsAllTablesAndEnums() throws IOException {
        ClassPathResource resource = new ClassPathResource("db/migration/V1__init_schema.sql");
        assertThat(resource.exists()).isTrue();

        String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        // Required ENUM types
        List<String> requiredEnums = List.of(
                "CREATE TYPE account_type",
                "CREATE TYPE pledge_type",
                "CREATE TYPE pledge_status",
                "CREATE TYPE drive_status",
                "CREATE TYPE commitment_status",
                "CREATE TYPE payment_mode",
                "CREATE TYPE donation_source",
                "CREATE TYPE expense_category",
                "CREATE TYPE user_role"
        );
        for (String typeDef : requiredEnums) {
            assertThat(content).contains(typeDef);
        }

        // Required Tables
        List<String> requiredTables = List.of(
                "CREATE TABLE accounts",
                "CREATE TABLE journal_entries",
                "CREATE TABLE journal_postings",
                "CREATE TABLE families",
                "CREATE TABLE drives",
                "CREATE TABLE drive_family_allocations",
                "CREATE TABLE pledges",
                "CREATE TABLE donations",
                "CREATE TABLE in_kind_donations",
                "CREATE TABLE contractors",
                "CREATE TABLE expenses",
                "CREATE TABLE users",
                "CREATE TABLE audit_logs"
        );
        for (String tableDef : requiredTables) {
            assertThat(content).contains(tableDef);
        }

        // Key constraints & extension
        assertThat(content).contains("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\"");
        assertThat(content).contains("chk_debit_or_credit");
        assertThat(content).contains("uq_drive_family");
    }

    @Test
    void testV2SeedChartOfAccountsContainsAllAccountsWithTamilNames() throws IOException {
        ClassPathResource resource = new ClassPathResource("db/migration/V2__seed_chart_of_accounts.sql");
        assertThat(resource.exists()).isTrue();

        String content = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        List<String> expectedCodes = List.of(
                "'1010'", "'1020'", "'1030'",
                "'2010'",
                "'3010'", "'3020'",
                "'4010'", "'4020'", "'4030'",
                "'5010'", "'5020'", "'5030'", "'5040'", "'5050'"
        );
        for (String code : expectedCodes) {
            assertThat(content).contains(code);
        }

        // Tamil names
        assertThat(content).contains("ரொக்க இருப்பு");
        assertThat(content).contains("வங்கி இருப்பு");
        assertThat(content).contains("கட்டுமான பொருள் இருப்பு");
        assertThat(content).contains("ஒப்பந்ததாரர் நிலுவை");
        assertThat(content).contains("கிராம நிதி");
        assertThat(content).contains("பொது கோவில் நிதி");
        assertThat(content).contains("கிராம தீர்மான நிதி");
        assertThat(content).contains("பொது நன்கொடை");
        assertThat(content).contains("பொருள் நன்கொடை");
        assertThat(content).contains("கட்டுமான பொருட்கள்");
        assertThat(content).contains("கூலி செலவுகள்");
        assertThat(content).contains("ஒப்பந்த கூலி வழங்கல்");
        assertThat(content).contains("வசூல் பயண & உணவு செலவு");
        assertThat(content).contains("இதர செலவுகள்");
    }
}
