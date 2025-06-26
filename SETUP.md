# Setting Up the Project for Development

## Frontend

Install the Angular CLI globally if you haven't already:

```
npm install -g @angular/cli@19
```

Then, `cd frontend`, install the dependencies and run the development server:

```bash
cd frontend
npm install
ng serve
```

> [!NOTE]
> Environment variables for the frontend are configured in the `frontend/src/environments/environment.{development}.ts` files
> No secrets should ever be stored in the frontend code, as it is publicly accessible.

## Backend

You will require to have a `.env` file in the `backend` directory with the following variables set:

```bash
NODE_ENV=development
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:3000
PORT=3000
OAUTH_GITHUB_CLIENT_ID=your_github_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
DATABASE_URL=postgres://admin:password@localhost:5432/postgres
JWT_SIGNING_KEY=your_jwt_signing_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_MEMBERSHIP_PRODUCT_ID=your_membership_product_id
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

> To generate a JWT signing key, you can use the following command in your terminal:
>
> ```bash
> openssl rand -base64 32
> ```

Then, within the `backend` directory, install the dependencies and run the development server:

```bash
npm install
npm run start:dev
```

## Database

To run the database, you will need to have Docker installed. Then, run this in the root directory:

```bash
docker compose up -d
```

And the database will be available at `localhost:5432` with the username `admin` and password `password`.

> The connection string is <postgres://admin:password@localhost:5432/postgres>

## OAuth2

Currently, we have Github as the OAuth2 provider. To set it up, create a new OAuth application in your Github account <https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app>. Use the following settings
for the application:

- Homepage URL: `http://localhost:4200`
- Redirect URL: `http://localhost:3000/api/auth/github/callback`

Copy the `Client ID` and `Client Secret` into the `.env` file in the `backend` directory.

## Stripe

Because we use stripe webhooks, we have to install stripe CLI to test the webhooks locally. You can install it by following the instructions here: <https://stripe.com/docs/stripe-cli#install>
