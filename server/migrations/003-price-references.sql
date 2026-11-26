CREATE TABLE ecovit_price_references (
 key text PRIMARY KEY,
 item jsonb NOT NULL,
 price bigint CHECK(price >= 0 AND price <= 9007199254740991),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ecovit') THEN
  GRANT SELECT,INSERT,UPDATE,DELETE ON ecovit_price_references TO ecovit;
 END IF;
END $$;
