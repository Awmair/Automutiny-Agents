# Free hosted alternatives to Supabase

Checked 2026-08-30 against official pricing and documentation.

## Project fit

Live Agents already has a 19-table PostgreSQL migration using UUIDs, JSONB, foreign keys, partial indexes, PL/pgSQL functions and triggers, row-level security, Supabase roles, a 24-hour visitor cleanup function, and future PDF object storage. The application is Next.js and keeps database access on the server.

This makes PostgreSQL compatibility more valuable than a larger free quota. A NoSQL or SQLite move would require rewriting the schema, security model, migrations, database client, and parts of the agent workflow.

## Recommendation

**Keep Supabase Free for the current build.** It is already the project’s proven workflow and supplies PostgreSQL, Auth, object storage, RLS, Edge Functions, and database cron through the APIs and roles already selected by this repository. Free includes 500 MB database storage, 1 GB file storage, 5 GB egress, 50,000 MAU, and 500,000 Edge Function invocations. The trade-offs are low-activity pausing after seven days and no automatic backups. [Supabase pricing](https://supabase.com/pricing), [pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [backups](https://supabase.com/docs/guides/platform/backups), [cron](https://supabase.com/docs/guides/cron)

If we deliberately leave Supabase, use one of these:

1. **Neon Free + Cloudflare R2 + a Cloudflare Worker cron** — strongest technical alternative and no manual database-project resume after inactivity.
2. **Nhost Starter** — closest one-provider replacement, but it has the same one-week inactivity pause problem.
3. **CockroachDB Basic + R2 + external application auth** — strongest verified extra candidate by free database capacity and availability, but it is more infrastructure than this installation needs.

Because the project is still at the migration-only stage, switching is cheapest now. Once Auth, storage, and database calls are wired, the migration cost rises.

## Ranked comparison

| Rank | Service | Durable free capacity | Fit for this project | Main problem | Rewrite cost |
|---:|---|---|---|---|---|
| 1 | **Neon + R2** | Neon: 0.5 GB DB/project, 100 CU-hours/project/month, 5 GB transfer, 60,000 Auth MAU, 6-hour restore window. R2: 10 GB-month storage, 1M Class A and 10M Class B operations/month, free egress. | Native PostgreSQL, standard connection string, Neon Auth, strong Next.js/Vercel integration. R2 handles PDFs. A free Worker can run daily cleanup. | Three pieces instead of one. Neon `pg_cron` is paid-only, so cleanup must run outside the DB. R2 requires enabling a usage-billed subscription through checkout. | **Low–medium:** preserve tables/functions/triggers; replace Supabase roles and storage client. |
| 2 | **Nhost Starter** | 1 GB Postgres, 1 GB file storage, 5 GB egress, 10 functions, unlimited users; one active project. | Closest Supabase shape: Postgres, Auth, Storage, Functions, Hasura permissions, `pgcrypto`, and `pg_cron`; official Next.js quickstart. | Pauses after one week of inactivity. Free has no daily backups. | **Low–medium:** SQL mostly transfers; replace Supabase roles, Auth/Storage SDK calls, and permission metadata. |
| 3 | **CockroachDB Basic + R2** | 50M request units and 10 GiB DB storage/month; scales to zero; 99.99% availability. | PostgreSQL wire protocol, SQL relations, JSON, UUIDs, RLS, PL/pgSQL functions and triggers, and standard Node drivers. Much larger DB allowance than Supabase. | Not PostgreSQL itself; unsupported extension/trigger details require checking. No bundled end-user Auth, PDF storage, or cron. Transaction retries may be needed. | **Medium:** preserve much of the relational model, but adapt extensions, roles, procedural SQL, and transactions. |
| 4 | **Convex Free** | 0.5 GB DB, 1 GB files, 1 GB DB I/O/month, 1 GB egress/month, 1M function calls and 20 GB-hours of action compute/month. | Excellent Next.js SDK, built-in file storage, Auth support, realtime functions, durable scheduling, and cron. | Document database and function model, not SQL/Postgres. Daily backups are a Professional-plan feature. | **High:** rewrite schema, queries, migrations, RLS model, functions, and agent persistence. Best for greenfield, not this repository. |
| 5 | **Turso Free** | 100 databases, 5 GB total storage, 500M rows read and 10M rows written/month, 24-hour PITR. | Fast Next.js integration, SQL, transactions, database tokens, and fine-grained table/action permissions. | libSQL/SQLite, not PostgreSQL. No bundled user Auth, object storage, or cron. | **High:** translate Postgres types, PL/pgSQL, triggers, roles/RLS, and cleanup scheduling; add file storage and Auth. |
| 6 | **Appwrite Cloud Free** | Two projects; 2 GB shared storage, 5 GB bandwidth, 750K executions, 75,000 MAU; one database, one bucket, and two functions per project. | Integrated Auth, permissioned rows, Storage, Functions, scheduled executions, realtime, and Next.js SDK. | Pauses after one week. No free backups. Free uses Appwrite TablesDB; native PostgreSQL requires dedicated compute starting at $10/month. | **High:** rebuild schema and access through Appwrite APIs. |
| 7 | **Cloudflare D1 + R2** | D1: 5M rows read/day, 100K rows written/day, 5 GB total, max 500 MB/database, seven-day Time Travel. R2: 10 GB-month and free egress. Workers Free: 100K requests/day and five cron triggers. | Generous free data, PDFs, backups, and cleanup scheduling. | D1 is SQLite and is natively bound to Cloudflare Workers, not Vercel. No bundled end-user Auth. | **High:** rewrite PostgreSQL schema/functions/RLS and use Workers/D1 APIs or an HTTP layer. |
| 8 | **Firebase Spark** | Firestore: 1 GiB, 50K reads/day, 20K writes/day, 20K deletes/day, 10 GiB egress/month. Auth: 3,000 DAU for common providers. | Mature Auth, security rules, Next.js SDK, and realtime data. | Firestore is NoSQL. New Cloud Storage usage requires the billing-enabled Blaze plan, as do scheduled functions; Firestore backups, PITR, TTL deletes, and restores are not in free usage. | **Very high:** full data, query, security, file, and cleanup rewrite. |

## Evidence by candidate

### Neon + Cloudflare R2

- Neon Free has no time limit or card requirement; compute automatically suspends after five minutes and wakes on the next query rather than pausing the whole project. [Neon pricing](https://neon.com/pricing), [scale to zero](https://neon.com/docs/introduction/scale-to-zero)
- Neon is managed PostgreSQL and supports standard connections; its official Vercel guide recommends the managed integration for minimal setup. [Postgres compatibility](https://neon.com/docs/reference/compatibility), [Vercel integration](https://neon.com/docs/guides/vercel-manual)
- `pg_cron` is available only on paid Neon plans, so the visitor purge needs an external scheduler. [Neon `pg_cron` notice](https://neon.com/docs/changelog/2025-01-10)
- R2 provides the PDF capacity above and S3-compatible access, but activation uses an R2 subscription checkout and usage beyond the free allowance is billable. [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [R2 setup](https://developers.cloudflare.com/r2/get-started/)
- Workers Free includes five cron triggers. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)

### Nhost

- Starter limits and inactivity behavior are explicit on the current pricing page. [Nhost pricing](https://nhost.io/pricing)
- Nhost provides Postgres, Auth, Storage, Functions, realtime GraphQL, and a Next.js path. [Nhost product](https://nhost.io/), [Next.js quickstart](https://docs.nhost.io/getting-started/quickstart/nextjs)
- Its supported extensions include both `pgcrypto` and `pg_cron`, matching this migration’s UUIDs and cleanup function. [Nhost extensions](https://docs.nhost.io/products/database/extensions)
- Free projects have no daily backups; manual `pg_dump` is available, and storage files are not covered by database backups. [Nhost backups](https://docs.nhost.io/products/database/backups)

### CockroachDB Basic

- The current Basic plan starts at $0, needs no credit card, includes 50M RUs and 10 GiB, scales to zero, and lists 99.99% availability. [CockroachDB pricing](https://www.cockroachlabs.com/pricing/)
- It supports the PostgreSQL wire protocol and most PostgreSQL syntax, but applications may need transaction retry handling. [Developer basics](https://www.cockroachlabs.com/docs/stable/developer-basics.html)
- PL/pgSQL functions and triggers are supported, but trigger gaps remain and extensions such as `pg_cron` have no equivalent. [PostgreSQL migration differences](https://www.cockroachlabs.com/blog/database-consolidation-production-ai/)

### Convex

- Official limits provide the Free quotas listed above. [Convex limits](https://docs.convex.dev/production/state/limits), [pricing](https://www.convex.dev/pricing)
- Recurring cleanup is built in through code-defined cron jobs. [Convex cron](https://docs.convex.dev/scheduling/cron-jobs)

### Turso

- The current Free plan provides the stated database, row, and restore quotas with no card. [Turso pricing](https://turso.tech/pricing)
- Free PITR covers 24 hours and creates a replacement database on restore. [Turso PITR](https://docs.turso.tech/features/point-in-time-recovery)
- The official SDK connects directly from Next.js; external Auth providers can issue database tokens through JWKS. [Next.js guide](https://docs.turso.tech/sdk/ts/guides/nextjs), [authorization](https://docs.turso.tech/sdk/authorization)

### Appwrite

- Free limits, one-week pausing, no backups, and the paid native-PostgreSQL boundary are documented in current pricing. [Appwrite pricing](https://appwrite.io/pricing)
- Scheduled function execution supports cron expressions. [Appwrite scheduling](https://appwrite.io/docs/products/functions/execute)

### Cloudflare D1/R2

- D1 quotas, daily cutoff behavior, database limits, and seven-day free Time Travel are official. [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)
- R2 and Workers quotas are documented above. [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)

### Firebase

- Firestore and Auth free quotas are current. [Firebase pricing](https://firebase.google.com/pricing), [Firestore free quota](https://firebase.google.com/docs/firestore/pricing), [Auth limits](https://firebase.google.com/docs/auth)
- Cloud Storage now requires Blaze, and scheduled functions are billed. [Storage requirement](https://firebase.google.com/docs/storage/web/start), [scheduled functions](https://firebase.google.com/docs/functions/schedule-functions)

## Excluded as non-durable free

**Xata Cloud** is no longer a durable free option. Its current managed service starts at $0.012/hour plus storage after a 14-day trial. Older articles describing a 15 GB free tier are no longer current. [Current Xata pricing](https://xata.io/pricing)

## Decision

Do not migrate merely to gain a larger quota. The current workload fits Supabase Free and migration would add risk before delivering agent functionality. If inactivity pausing becomes unacceptable for the public installation, move now to **Neon + R2**. If one-provider simplicity matters more than automatic wake-up, choose **Nhost Starter**.
