# Release evaluation harness

The shared harness reads agent-owned JSONL fixtures, scores contract thresholds, verifies pressure-case outcomes and enforces the human-action architecture.

```bash
pnpm eval
pnpm pressure
pnpm redteam
pnpm release:check
```

The committed report is deliberately labelled as an offline contract check. A live-model benchmark requires an isolated evaluation Supabase project through `EVAL_SUPABASE_URL` and `EVAL_SUPABASE_SECRET_KEY`; production data must not be used for that job.
