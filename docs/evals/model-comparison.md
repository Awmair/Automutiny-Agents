# Groq model comparison

Run on 2026-08-30T15:11:38.009Z with six synthetic intake cases.

| Model | Cases | Field accuracy | Total tokens | p50 latency |
| --- | ---: | ---: | ---: | ---: |
| `qwen/qwen3.6-27b` | 6 | 91.7% | 1335 | 2646 ms |
| `qwen/qwen3.8-27b` | 6 | 79.2% | 1326 | 2909 ms |

- `qwen/qwen3.6-27b`: intake-002: practice_area; intake-003: practice_area
- `qwen/qwen3.8-27b`: intake-002: practice_area; intake-003: practice_area; intake-004: fit_bucket, disqualified, next_action

This is a small live smoke comparison, not the isolated full-pipeline benchmark.
