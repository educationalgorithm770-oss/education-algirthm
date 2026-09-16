# Code Runner Security Deployment

## Architecture
The HTTP-facing `code-runner` has **no Docker socket mount**. It talks only to `docker-socket-proxy` over the private `runner_internal` network. The proxy is the sole component with a read-only Docker socket mount and exposes only the Docker API operations required for ephemeral sandbox lifecycle management.

Each Python/JavaScript submission runs in a fresh `education-algorithm-code-sandbox` container with no network, memory/CPU/PID limits, read-only root filesystem, tmpfs `/tmp`, dropped capabilities, no-new-privileges, unprivileged UID, 5-second wall timeout, output cap, and automatic removal.

## Start
```bash
export CODE_RUNNER_TOKEN='generate-a-long-random-secret'
docker compose -f docker-compose.code-runner.yml up -d --build
```

The compose deployment automatically builds `education-algorithm-code-sandbox:latest` before starting the runner. Do not expose port 8088 publicly; the LMS should reach the runner through a private reverse proxy or internal host routing.

For stronger blast-radius reduction, deploy this compose stack on a dedicated sandbox host separate from the LMS, database, and production secrets.
