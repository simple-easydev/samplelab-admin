-- Set random release_date on samples (within last 365 days from now).
-- Run anytime to reassign. Each run produces different values.

UPDATE samples
SET release_date = NOW() - (random() * interval '365 days');
