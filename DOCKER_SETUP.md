# Setup with Docker

Have a `.env` file in the root directory with the following variables set:

```bash
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:3000
PORT=3000
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=
DATABASE_URL=postgres://admin:password@db:5432/postgres
JWT_SIGNING_KEY=

STRIPE_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_MEMBERSHIP_PRODUCT_ID=
STRIPE_WEBHOOK_SECRET=
```

Note the different `DATABASE_URL` and new `STRIPE_API_KEY` variable. Then, in the root directory, run:

```
docker compose up -d
```

And all services should have started.
