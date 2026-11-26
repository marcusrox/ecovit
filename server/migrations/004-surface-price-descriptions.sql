ALTER TABLE ecovit_price_references ADD COLUMN description text;
ALTER TABLE ecovit_price_references ADD CONSTRAINT surface_reference_description CHECK (
  CASE WHEN item->>'group' = 'surface' THEN
    (price IS NULL AND description IS NULL) OR
    (price IS NOT NULL AND description IS NOT NULL AND
     length(btrim(description)) BETWEEN 1 AND 160 AND description = btrim(description))
  ELSE description IS NULL END
);
