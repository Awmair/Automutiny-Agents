# Client onboarding

## Eagle-eye view

`Client rules and records → agent pipeline → guarded draft → human review → simulated action`

ELI5: each agent is a labelled Lego block. Supabase holds the client's records, Groq helps interpret them, deterministic code checks the answer, and the dashboard lets a person make the final decision.

## Installation process

1. **Discover:** agree on accepted work, geography, service levels, approver roles, data sources and retention requirements.
2. **Configure:** replace the three files in `docs/firm/` with the client's rules and set `FIRM_NAME`. Do not keep the example firm's rules beside the new rules.
3. **Provision:** create one client-owned Supabase project and Groq key, then use `deployment/client/setup-client.sh`.
4. **Validate:** apply migrations, seed safe client-approved test data, run the release checkpoint and manually test all three agent review flows.
5. **Deploy and hand off:** deploy the Next.js app, verify `/api/health`, document the approvers and operating owner, then enable monitoring.

## Client-specific decisions

- Data mapping from the client's CRM or practice system.
- Firm rules, thresholds and reply tone.
- Which roles may approve each action.
- Retention, audit and incident contacts.
- Whether any real email, CRM or document connector is added. Each connector requires a separate review because it changes the side-effect boundary.
