-- V4: Add dedicated book_no and manual_receipt_no columns to donations
ALTER TABLE donations ADD COLUMN IF NOT EXISTS book_no VARCHAR(32);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS manual_receipt_no VARCHAR(32);

-- Populate book_no and manual_receipt_no from existing physical_book_receipt_no where available
UPDATE donations
SET book_no = TRIM(SPLIT_PART(physical_book_receipt_no, '/', 1)),
    manual_receipt_no = TRIM(SPLIT_PART(physical_book_receipt_no, '/', 2))
WHERE physical_book_receipt_no IS NOT NULL 
  AND physical_book_receipt_no LIKE '%/%'
  AND book_no IS NULL;

-- Index for fast lookup by book and manual receipt number
CREATE INDEX IF NOT EXISTS idx_donations_book_receipt ON donations(book_no, manual_receipt_no);
