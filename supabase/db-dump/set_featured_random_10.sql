-- Set is_featured = true for 10 random packs and 10 random creators.
-- Run anytime to (re)assign featured items. Each run picks a new random set.

UPDATE packs
SET is_featured = true
WHERE id IN (
  SELECT id FROM packs ORDER BY random() LIMIT 10
);

UPDATE creators
SET is_featured = true
WHERE id IN (
  SELECT id FROM creators ORDER BY random() LIMIT 10
);
