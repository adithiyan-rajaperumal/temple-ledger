-- Seed default Super Admin account with admin / admin123
INSERT INTO users (id, username, password_hash, full_name, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2a$10$HMtLoNn1TVDbbNUoWTVJ2uQ/8bDu.RSUunrVNOOn8GuRXXvvJAXN2',
    'System Super Admin',
    'ROLE_SUPER_ADMIN',
    true,
    NOW()
)
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = true;
