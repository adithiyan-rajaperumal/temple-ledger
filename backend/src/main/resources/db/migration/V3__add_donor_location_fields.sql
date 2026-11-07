-- -----------------------------------------------------------------------------
-- V3: Add Donor Location Fields (Area, State, Country) and Search Indexes
-- -----------------------------------------------------------------------------

ALTER TABLE donations ADD COLUMN IF NOT EXISTS area VARCHAR(128);
UPDATE donations SET area = village WHERE area IS NULL AND village IS NOT NULL;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS state VARCHAR(64) DEFAULT 'Tamil Nadu';
ALTER TABLE donations ADD COLUMN IF NOT EXISTS country VARCHAR(64) DEFAULT 'India';

ALTER TABLE families ADD COLUMN IF NOT EXISTS area VARCHAR(128);
UPDATE families SET area = village WHERE area IS NULL AND village IS NOT NULL;
ALTER TABLE families ADD COLUMN IF NOT EXISTS state VARCHAR(64) DEFAULT 'Tamil Nadu';
ALTER TABLE families ADD COLUMN IF NOT EXISTS country VARCHAR(64) DEFAULT 'India';

CREATE INDEX IF NOT EXISTS idx_donations_donor_name_lower ON donations(LOWER(donor_name));
CREATE INDEX IF NOT EXISTS idx_donations_area_lower ON donations(LOWER(area));
CREATE INDEX IF NOT EXISTS idx_donations_state ON donations(state);
CREATE INDEX IF NOT EXISTS idx_donations_country ON donations(country);
