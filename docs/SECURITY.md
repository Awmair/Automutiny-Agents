# Security boundary

## Protected assets

- Client records and uploaded PDFs.
- Server-only Supabase and Groq credentials.
- Model traces, review decisions and simulated outbox content.

## Controls

- Browser code has no direct database privileges; server routes use private credentials.
- Visitor data is session-scoped, rate-limited and deleted after 24 hours.
- Uploaded files are private PDFs, limited to 10 MB and deleted with their visitor session.
- Model inputs are bounded, untrusted record text is labelled as data, outputs are schema-validated and unsafe output fails closed.
- Agent packages can prepare review records but cannot write final workflow states or the outbox.
- Approved actions are simulated. No email or external-system connector is enabled.
- Test-only fault injection cannot activate in production.

## Out of scope

- Visitor authentication and role-based staff accounts.
- Encryption beyond the hosting providers' defaults.
- Legal advice, conflict clearance, deadline calculation or autonomous representation decisions.
- Production email, CRM, case-management or document-system delivery.

Each real client needs an access-control, retention and connector review before production use.

## Report a vulnerability

Use GitHub private vulnerability reporting when it is available. Otherwise, contact Automutiny privately through `automutiny.com`. Do not put credentials, client records or exploit details in a public issue.
