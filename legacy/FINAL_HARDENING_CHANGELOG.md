# Final Code Arena Hardening Changes

## Final fixes
1. Removed the synthetic `beats_percentile` field from `api-code-runner.php`.
2. Moved SQL execution into the same per-execution Docker sandbox used by Python/JavaScript.
3. Added `services/code-runner/sandbox/sql_runner.py`.
4. Included the SQL runner in the immutable sandbox image.
5. SQL execution remains one statement per execution and blocks dangerous SQLite operations.
6. Retained per-execution network isolation, resource limits, read-only filesystem, and automatic container cleanup.

## Verification
- 80 PHP files linted with `php -l`
- 0 PHP syntax errors
- Docker Compose YAML parses successfully
- No `beats_percentile`/`beatsPercentile` remains in the API
- No local `PDO('sqlite::memory:')` remains in the long-running runner
- SQL is routed through `/usr/local/bin/sql_runner.py` inside the disposable sandbox
- No `Student@123` source fallback remains
- Runner token fallback is absent
