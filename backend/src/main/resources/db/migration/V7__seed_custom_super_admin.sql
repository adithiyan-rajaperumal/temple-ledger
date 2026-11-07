-- Seed custom Super Admin account for adithiyan1 with password Mahaveer2024@
INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    'adithiyan1',
    '$2a$10$y4z8akAIT7DpTCRszmySg.iCnZUXSGrkqhStKBjnDYpWVNMPf2l4y',
    'Adithiyan (Super Admin)',
    'ROLE_SUPER_ADMIN',
    true,
    NOW()
)
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = true;
