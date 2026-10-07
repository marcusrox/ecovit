begin;
create table public.projects (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 160),
  schema_version integer not null check (schema_version = 1),
  current_revision integer not null default 1 check (current_revision > 0),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (name = document->>'name'),
  check (schema_version = (document->>'schemaVersion')::integer)
);
create index projects_owner_page_idx on public.projects(owner_id, created_at desc, id desc) where deleted_at is null;
create table public.project_revisions (
  project_id uuid not null references public.projects(id) on delete cascade,
  revision integer not null check (revision > 0),
  document jsonb not null,
  created_at timestamptz not null default now(),
  engine_version text not null,
  idempotency_key uuid not null,
  content_hash text not null,
  primary key(project_id, revision),
  unique(project_id, idempotency_key)
);

alter table public.projects enable row level security;
alter table public.project_revisions enable row level security;
revoke all on public.projects, public.project_revisions from public, anon, authenticated;
grant select on public.projects, public.project_revisions to authenticated;

create policy projects_owner_read on public.projects for select to authenticated
  using (owner_id = (select auth.uid()) and deleted_at is null);
create policy revisions_owner_read on public.project_revisions for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = (select auth.uid()) and p.deleted_at is null));

-- M0: criação/leitura. Save/delete, retenção e purga serão adicionados em M4.
create function public.create_project(p_project_id uuid, p_document jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $fn$
declare
  v_owner uuid := auth.uid();
  v_project public.projects%rowtype;
  v_hash text;
  v_original_hash text;
begin
  if v_owner is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_project_id is null then raise exception 'INVALID_DOCUMENT'; end if;
  -- Serializa também duas tentativas concorrentes antes de a linha existir.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_project_id::text, 0));
  select * into v_project from public.projects where id = p_project_id for update;
  if found and (v_project.owner_id <> v_owner or v_project.deleted_at is not null) then raise exception 'NOT_FOUND'; end if;
  perform public.validate_project_document(p_document);
  v_hash := encode(extensions.digest(convert_to(p_document::text, 'UTF8'), 'sha256'), 'hex');
  if v_project.id is not null then
    select r.content_hash into v_original_hash from public.project_revisions r where r.project_id = p_project_id and r.revision = 1;
    if v_original_hash is null then raise exception 'REVISION_CONFLICT'; end if;
    if v_original_hash <> v_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return jsonb_build_object('id', v_project.id, 'revision', 1, 'updated_at', v_project.created_at);
  end if;
  insert into public.projects(id, owner_id, name, schema_version, document)
    values (p_project_id, v_owner, p_document->>'name', 1, p_document) returning * into v_project;
  insert into public.project_revisions(project_id, revision, document, engine_version, idempotency_key, content_hash)
    values (p_project_id, 1, p_document, 'm0-no-engine', p_project_id, v_hash);
  return jsonb_build_object('id', v_project.id, 'revision', 1, 'updated_at', v_project.updated_at);
end;
$fn$;
revoke all on function public.create_project(uuid, jsonb) from public, anon;
grant execute on function public.create_project(uuid, jsonb) to authenticated;
commit;
