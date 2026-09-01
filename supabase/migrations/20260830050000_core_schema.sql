create extension if not exists pgcrypto;

create table public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  runs_today integer not null default 0 check (runs_today >= 0 and runs_today <= 10),
  run_day date not null default current_date,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  profile_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  role text not null check (
    role in ('partner', 'associate', 'paralegal', 'intake_coordinator', 'office_manager', 'admin')
  ),
  email text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, email)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  email text,
  phone text,
  company text,
  source text not null,
  notes text,
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel text not null check (channel in ('website', 'phone', 'email', 'sms', 'meeting', 'internal')),
  direction text not null check (direction in ('inbound', 'outbound', 'internal')),
  occurred_at timestamptz not null,
  summary text not null,
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  source text not null,
  raw_json jsonb not null,
  practice_area_guess text,
  status text not null default 'new' check (
    status in ('new', 'running', 'review', 'approved', 'edited', 'rejected', 'sent', 'failed')
  ),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matters (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  matter_type text not null,
  stage text not null,
  opened_at timestamptz not null,
  responsible_staff_id uuid references public.staff(id) on delete set null,
  last_client_contact_at timestamptz,
  status text not null default 'open' check (
    status in ('open', 'closed', 'declined', 'archived', 'transferred')
  ),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matter_tasks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  owner_staff_id uuid references public.staff(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matter_deadlines (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  kind text not null check (length(btrim(kind)) > 0),
  due_at timestamptz not null,
  satisfied_at timestamptz,
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  matter_id uuid references public.matters(id) on delete set null,
  storage_path text not null,
  filename text not null,
  mime text not null,
  uploaded_at timestamptz not null default now(),
  status text not null default 'new' check (
    status in ('new', 'running', 'review', 'approved', 'edited', 'rejected', 'routed', 'failed')
  ),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_requests (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters(id) on delete cascade,
  doc_type text not null,
  requested_at timestamptz not null,
  received_at timestamptz,
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent text not null check (agent in (
    'intake-brief',
    'document-routing',
    'stalled-work',
    'accounting-document-chase',
    'accounting-transaction-review',
    'accounting-filing-readiness',
    'logistics-load-exception',
    'logistics-pod-verification',
    'logistics-invoice-reconciliation'
  )),
  subject_type text not null,
  subject_id uuid not null,
  model text not null,
  status text not null default 'running' check (
    status in ('running', 'review', 'finished', 'failed')
  ),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(10, 6) not null default 0 check (cost_usd >= 0),
  error text,
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  seq integer not null check (seq > 0),
  name text not null check (length(btrim(name)) > 0),
  input_json jsonb not null,
  output_json jsonb,
  display_input_json jsonb not null,
  display_output_json jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  tokens integer not null default 0 check (tokens >= 0),
  note text,
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, seq)
);

create table public.operational_cases (
  id uuid primary key default gen_random_uuid(),
  agent text not null check (agent in (
    'accounting-document-chase',
    'accounting-transaction-review',
    'accounting-filing-readiness',
    'logistics-load-exception',
    'logistics-pod-verification',
    'logistics-invoice-reconciliation'
  )),
  scenario_id text not null check (length(btrim(scenario_id)) > 0),
  subject text not null check (length(btrim(subject)) > 0),
  input_json jsonb not null,
  output_json jsonb not null,
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  priority text not null check (priority in ('low', 'medium', 'high')),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  status text not null default 'review' check (
    status in ('review', 'approved', 'edited', 'rejected')
  ),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.briefs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  qualification_json jsonb not null,
  brief_md text not null,
  next_action text not null check (
    next_action in ('schedule_consult', 'request_info', 'refer_out', 'decline', 'partner_review')
  ),
  reply_draft text not null,
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  status text not null default 'review' check (
    status in ('review', 'approved', 'edited', 'rejected')
  ),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_results (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  classification_json jsonb not null,
  extracted_json jsonb not null,
  completeness_json jsonb not null,
  routing_json jsonb not null,
  request_draft text,
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  status text not null default 'review' check (
    status in ('review', 'approved', 'edited', 'rejected')
  ),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stalled_reports (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  report_date date not null,
  summary_md text not null,
  items_json jsonb not null,
  status text not null default 'review' check (status in ('review', 'reviewed')),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stalled_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.stalled_reports(id) on delete cascade,
  matter_id uuid not null references public.matters(id) on delete cascade,
  kind text not null check (
    kind in (
      'stale_client_contact',
      'at_risk_deadline',
      'overdue_task',
      'unreturned_document_request',
      'ownerless_matter',
      'stage_time_outlier'
    )
  ),
  severity text not null check (severity in ('low', 'medium', 'high')),
  evidence_json jsonb not null,
  drafted_action text,
  decision text check (decision in ('approved', 'snoozed', 'dismissed')),
  decided_by text,
  decided_at timestamptz,
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id uuid not null,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  decision text not null check (
    decision in ('approve', 'edit', 'reject', 'snooze_7d', 'dismiss', 'mark_reviewed')
  ),
  edited_payload_json jsonb,
  reviewer text not null,
  decided_at timestamptz not null default now(),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outbox (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  to_email text not null,
  subject text not null,
  body text not null,
  related_type text not null,
  related_id uuid not null,
  status text not null default 'queued' check (status in ('queued', 'cancelled')),
  visitor_session_id uuid references public.visitor_sessions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index agent_runs_active_subject_idx
  on public.agent_runs (
    agent,
    subject_type,
    subject_id,
    coalesce(visitor_session_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status in ('running', 'review');

create unique index stalled_reports_firm_date_idx
  on public.stalled_reports (
    firm_id,
    report_date,
    coalesce(visitor_session_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index visitor_sessions_last_seen_idx on public.visitor_sessions (last_seen_at);
create index contacts_firm_idx on public.contacts (firm_id);
create index interactions_contact_occurred_idx on public.interactions (contact_id, occurred_at desc);
create index leads_queue_idx on public.leads (status, created_at desc);
create index matters_firm_status_idx on public.matters (firm_id, status);
create index matter_tasks_open_due_idx on public.matter_tasks (matter_id, due_at) where completed_at is null;
create index matter_deadlines_open_due_idx on public.matter_deadlines (matter_id, due_at) where satisfied_at is null;
create index documents_queue_idx on public.documents (status, uploaded_at desc);
create index document_requests_open_idx on public.document_requests (matter_id, requested_at) where received_at is null;
create index agent_runs_queue_idx on public.agent_runs (agent, status, started_at desc);
create index agent_steps_run_idx on public.agent_steps (run_id, seq);
create index operational_cases_queue_idx on public.operational_cases (agent, status, created_at desc);
create index reviews_subject_idx on public.reviews (subject_type, subject_id, decided_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'visitor_sessions',
    'firms',
    'staff',
    'contacts',
    'interactions',
    'leads',
    'matters',
    'matter_tasks',
    'matter_deadlines',
    'documents',
    'document_requests',
    'agent_runs',
    'agent_steps',
    'operational_cases',
    'briefs',
    'document_results',
    'stalled_reports',
    'stalled_items',
    'reviews',
    'outbox'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name
    );
  end loop;
end;
$$;

create or replace function public.purge_visitor_sessions()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  purged_count integer;
begin
  with purged as (
    delete from public.visitor_sessions
    where last_seen_at < now() - interval '24 hours'
    returning 1
  )
  select count(*)::integer into purged_count from purged;

  return purged_count;
end;
$$;

alter table public.visitor_sessions enable row level security;
alter table public.firms enable row level security;
alter table public.staff enable row level security;
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;
alter table public.leads enable row level security;
alter table public.matters enable row level security;
alter table public.matter_tasks enable row level security;
alter table public.matter_deadlines enable row level security;
alter table public.documents enable row level security;
alter table public.document_requests enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_steps enable row level security;
alter table public.operational_cases enable row level security;
alter table public.briefs enable row level security;
alter table public.document_results enable row level security;
alter table public.stalled_reports enable row level security;
alter table public.stalled_items enable row level security;
alter table public.reviews enable row level security;
alter table public.outbox enable row level security;

revoke all privileges on all tables in schema public from anon, authenticated;
grant all privileges on all tables in schema public to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.purge_visitor_sessions() from public, anon, authenticated;
grant execute on function public.set_updated_at() to service_role;
grant execute on function public.purge_visitor_sessions() to service_role;
