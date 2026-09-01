alter table public.agent_runs drop constraint agent_runs_agent_check;

alter table public.agent_runs add constraint agent_runs_agent_check check (agent in (
  'intake-brief',
  'document-routing',
  'stalled-work',
  'accounting-document-chase',
  'accounting-transaction-review',
  'accounting-filing-readiness',
  'logistics-load-exception',
  'logistics-pod-verification',
  'logistics-invoice-reconciliation'
));

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

create index operational_cases_queue_idx
  on public.operational_cases (agent, status, created_at desc);

create trigger set_updated_at before update on public.operational_cases
  for each row execute function public.set_updated_at();

alter table public.operational_cases enable row level security;

revoke all privileges on public.operational_cases from anon, authenticated;
grant all privileges on public.operational_cases to service_role;
