CREATE TABLE IF NOT EXISTS ecovit_accounts (
 id uuid PRIMARY KEY, email text COLLATE "C" NOT NULL UNIQUE,
 state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','deleting')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), deleting_at timestamptz
);
CREATE TABLE IF NOT EXISTS ecovit_sessions (
 hash text PRIMARY KEY, account_id uuid NOT NULL REFERENCES ecovit_accounts(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), last_seen timestamptz NOT NULL DEFAULT clock_timestamp(),
 csrf text NOT NULL
);
CREATE TABLE IF NOT EXISTS ecovit_challenges (
 id uuid PRIMARY KEY, email text COLLATE "C" NOT NULL, purpose text NOT NULL CHECK(purpose IN ('login','delete')),
 code_hash text NOT NULL, flow_hash text NOT NULL, session_hash text,
 attempts integer NOT NULL DEFAULT 0, sent boolean NOT NULL DEFAULT false,
 expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS ecovit_sessions_account ON ecovit_sessions(account_id);
CREATE INDEX IF NOT EXISTS ecovit_challenges_expiry ON ecovit_challenges(expires_at);
CREATE TABLE IF NOT EXISTS ecovit_rate_limits (
 key text NOT NULL, bucket bigint NOT NULL, hits integer NOT NULL DEFAULT 1,
 expires_at timestamptz NOT NULL DEFAULT (clock_timestamp()+interval '2 days'),
 PRIMARY KEY(key,bucket)
);
CREATE TABLE IF NOT EXISTS ecovit_projects (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES ecovit_accounts(id) ON DELETE CASCADE,
 revision bigint NOT NULL DEFAULT 1, document json NOT NULL, list_meta json NOT NULL,
 state text NOT NULL DEFAULT 'active' CHECK(state IN ('active','trashed','purging')),
 trashed_at timestamptz, purge_after timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS ecovit_projects_owner ON ecovit_projects(owner_id,updated_at);
CREATE TABLE IF NOT EXISTS ecovit_assets (
 id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES ecovit_accounts(id) ON DELETE CASCADE,
 project_id uuid NOT NULL, bytes bigint NOT NULL CHECK(bytes > 0), hash text NOT NULL,
 mime text, width integer, height integer, ready boolean NOT NULL DEFAULT false,
 attached boolean NOT NULL DEFAULT false, unreferenced_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS ecovit_assets_owner ON ecovit_assets(owner_id);
CREATE TABLE IF NOT EXISTS ecovit_project_assets (
 project_id uuid NOT NULL REFERENCES ecovit_projects(id) ON DELETE CASCADE,
 asset_id uuid NOT NULL REFERENCES ecovit_assets(id), PRIMARY KEY(project_id,asset_id)
);
CREATE TABLE IF NOT EXISTS ecovit_receipts (
 account_id uuid NOT NULL REFERENCES ecovit_accounts(id) ON DELETE CASCADE,
 operation_id uuid NOT NULL, hash text NOT NULL, result json NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), PRIMARY KEY(account_id,operation_id)
);
CREATE TABLE IF NOT EXISTS ecovit_deletions (
 token_hash text PRIMARY KEY, account_id uuid REFERENCES ecovit_accounts(id) ON DELETE SET NULL,
 session_hash text NOT NULL, proof_hash text NOT NULL,
 accepted_at timestamptz, completed boolean NOT NULL DEFAULT false,
 expires_at timestamptz NOT NULL, proof_expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS ecovit_maintenance (
 id integer PRIMARY KEY CHECK(id=1), last_success timestamptz
);
CREATE TABLE IF NOT EXISTS ecovit_migrations (
 version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
INSERT INTO ecovit_migrations(version) VALUES(1) ON CONFLICT DO NOTHING;
