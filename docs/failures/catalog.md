# Failure catalog

| Failure | Detection | Safe result | Human next step |
| --- | --- | --- | --- |
| Inquiry contains prompt-injection instructions | Trusted prompt boundary and red-team case | Instructions are treated as record text; no action is sent | Review the brief and reject suspicious content |
| PDF has weak or ambiguous matter evidence | Evidence validation and confidence guard | Document stays in review without an automatic route | Confirm the matter or reject the extraction |
| Model returns invalid JSON or times out | Schema validation, retries and fault tests | Run fails closed; no partial brief is visible | Retry after provider recovery and inspect the trace |
| Database fails during run start | Test-only fault simulation and error handling | Run does not begin and no review artifact is presented | Restore database access and retry |
| Duplicate intake form submission | Session-scoped request key and database index | Existing lead is reused | Continue the existing review instead of creating another lead |
