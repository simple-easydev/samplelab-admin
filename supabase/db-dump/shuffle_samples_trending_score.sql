-- Shuffle trending_score on samples (random values in 0–1000).
-- Run anytime to reassign scores. Each run produces different values.

UPDATE samples
SET trending_score = (random() * 1000)::numeric(12, 4);
