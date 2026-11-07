-- Convert custom PostgreSQL ENUM columns to standard VARCHAR for seamless JPA/Hibernate EnumType.STRING compatibility

ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(32) USING role::text;
ALTER TABLE accounts ALTER COLUMN type TYPE VARCHAR(32) USING type::text;
ALTER TABLE drives ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
ALTER TABLE drive_family_allocations ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
ALTER TABLE pledges ALTER COLUMN pledge_type TYPE VARCHAR(32) USING pledge_type::text;
ALTER TABLE pledges ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
ALTER TABLE donations ALTER COLUMN donor_source TYPE VARCHAR(32) USING donor_source::text;
ALTER TABLE donations ALTER COLUMN payment_mode TYPE VARCHAR(32) USING payment_mode::text;
ALTER TABLE expenses ALTER COLUMN category TYPE VARCHAR(64) USING category::text;
ALTER TABLE expenses ALTER COLUMN payment_mode TYPE VARCHAR(32) USING payment_mode::text;
