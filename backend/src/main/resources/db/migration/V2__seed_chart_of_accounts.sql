-- =============================================================================
-- V2__seed_chart_of_accounts.sql: Seed Initial Chart of Accounts
-- Supports English and Tamil localization for standard ledger accounts
-- =============================================================================

INSERT INTO accounts (code, name, name_ta, type, is_active) VALUES
('1010', 'Cash in Hand', 'ரொக்க இருப்பு', 'ASSET', true),
('1020', 'Bank & GPay', 'வங்கி இருப்பு', 'ASSET', true),
('1030', 'In-Kind Material Stock', 'கட்டுமான பொருள் இருப்பு', 'ASSET', true),
('2010', 'Contractor Payables', 'ஒப்பந்ததாரர் நிலுவை', 'LIABILITY', true),
('3010', 'Village Family Drives Equity', 'கிராம நிதி', 'EQUITY', true),
('3020', 'General Temple Fund', 'பொது கோவில் நிதி', 'EQUITY', true),
('4010', 'Village Drive Donations', 'கிராம தீர்மான நிதி', 'INCOME', true),
('4020', 'Devotee General Donations', 'பொது நன்கொடை', 'INCOME', true),
('4030', 'In-Kind Material Contributions', 'பொருள் நன்கொடை', 'INCOME', true),
('5010', 'Renovation Materials Purchased', 'கட்டுமான பொருட்கள்', 'EXPENSE', true),
('5020', 'Labour Wages', 'கூலி செலவுகள்', 'EXPENSE', true),
('5030', 'Contractor Work Releases', 'ஒப்பந்த கூலி வழங்கல்', 'EXPENSE', true),
('5040', 'Collection Field Expenses', 'வசூல் பயண & உணவு செலவு', 'EXPENSE', true),
('5050', 'General Temple Ritual & Misc', 'இதர செலவுகள்', 'EXPENSE', true)
ON CONFLICT (code) DO NOTHING;
