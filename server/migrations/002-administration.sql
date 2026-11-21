ALTER TABLE ecovit_accounts DROP CONSTRAINT ecovit_accounts_state_check;
ALTER TABLE ecovit_accounts ADD CONSTRAINT ecovit_accounts_state_check CHECK (state IN ('active','blocked','deleting'));
ALTER TABLE ecovit_accounts ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE ecovit_accounts ADD COLUMN last_activity timestamptz;
CREATE TABLE ecovit_activity (
 account_id uuid NOT NULL REFERENCES ecovit_accounts(id) ON DELETE CASCADE,
 day date NOT NULL, PRIMARY KEY(account_id,day)
);
CREATE TABLE ecovit_admin_audit (
 id uuid PRIMARY KEY, actor_id uuid REFERENCES ecovit_accounts(id) ON DELETE CASCADE,
 target_id uuid NOT NULL REFERENCES ecovit_accounts(id) ON DELETE CASCADE,
 source text NOT NULL CHECK(source IN ('panel','server')),
 action text NOT NULL, reason text NOT NULL, outcome text NOT NULL,
 operation_id uuid NOT NULL, fingerprint text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(actor_id,operation_id)
);
CREATE INDEX ecovit_admin_audit_time ON ecovit_admin_audit(created_at);
CREATE INDEX ecovit_admin_audit_target ON ecovit_admin_audit(target_id);
CREATE UNIQUE INDEX ecovit_admin_configured ON ecovit_admin_audit(target_id) WHERE action='configured';
CREATE TABLE ecovit_operation_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 category text NOT NULL, code text NOT NULL, outcome text NOT NULL,
 request_id text, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX ecovit_operation_events_time ON ecovit_operation_events(created_at);
CREATE TABLE ecovit_observation (
 id integer PRIMARY KEY CHECK(id=1), started_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO ecovit_observation(id) VALUES(1);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ecovit') THEN
  GRANT SELECT,INSERT,UPDATE,DELETE ON ecovit_activity,ecovit_admin_audit,ecovit_operation_events,ecovit_observation TO ecovit;
  GRANT USAGE,SELECT ON SEQUENCE ecovit_operation_events_id_seq TO ecovit;
 END IF;
END $$;
