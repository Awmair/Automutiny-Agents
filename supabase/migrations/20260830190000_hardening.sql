create unique index leads_visitor_request_key_idx
  on public.leads (visitor_session_id, ((raw_json ->> '_request_key')))
  where visitor_session_id is not null and raw_json ? '_request_key';

create index agent_runs_started_idx on public.agent_runs (started_at desc);
