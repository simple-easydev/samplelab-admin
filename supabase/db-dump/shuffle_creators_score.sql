-- Set random score (rank) on creators (integer 1–1000).
-- Run anytime to reassign. Each run produces different values.

UPDATE creators
SET score = 1 + floor(random() * 1000)::integer;
