# Client platform verification

Verified against official provider documentation on 2026-08-30.

| Platform | Verified choice | Packaging consequence |
| --- | --- | --- |
| Groq | `qwen/qwen3.6-27b` is listed as a supported production model. Free-plan limits are rate-limited and account-specific. | Keep model and token limits configurable; do not promise unlimited free usage. |
| Supabase | Current projects use publishable and secret keys. Legacy `anon` and `service_role` keys remain supported during the transition. | New installations ask for `SUPABASE_SECRET_KEY`; existing installations may keep `SUPABASE_SERVICE_ROLE_KEY`. |
| Vercel Hobby | Cron jobs may run once daily with hourly precision. Vercel can authenticate the request with `CRON_SECRET`. | The package schedules one daily stalled-work and cleanup job and does not depend on minute-accurate timing. |

Sources: [Groq models](https://console.groq.com/docs/models), [Groq rate limits](https://console.groq.com/docs/rate-limits), [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [Vercel cron usage](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
