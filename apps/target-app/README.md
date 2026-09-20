# target-app

A minimal Django admin app (SQLite, one seeded superuser) that exists purely to give `apps/e2e` a real, local login/create-user flow to test against -- not a stand-in for whatever real application eventually gets tested in Kubernetes.

```sh
docker compose up target-app --build
open http://localhost:8000/admin/
```

Seeded credentials come from `DJANGO_SUPERUSER_USERNAME` / `DJANGO_SUPERUSER_PASSWORD` (see `docker-compose.yml`; defaults are `e2e-admin` / `correct-horse-battery-staple`). `/healthz` returns `200 ok` with no auth, for readiness checks.
