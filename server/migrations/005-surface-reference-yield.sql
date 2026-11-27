ALTER TABLE ecovit_price_references ADD COLUMN yield_milli bigint;
ALTER TABLE ecovit_price_references ADD CONSTRAINT surface_reference_yield CHECK (
  yield_milli IS NULL OR (
    item->>'group' = 'surface' AND price IS NOT NULL AND
    yield_milli BETWEEN 1 AND 9007199254740991
  )
);
