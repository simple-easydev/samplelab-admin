-- Shuffle rank on genres (random integer values in 0–1000).
-- Run anytime to reassign ranks. Each run produces different values.

UPDATE genres
SET rank = (random() * 1000)::integer;
