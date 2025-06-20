# Setting Up the Project for Development

## Frontend
Install the Angular CLI globally if you haven't already:
```
npm install -g @angular/cli
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
You will require to have a `env` file in the `backend` directory with the following variables set:

```bash
FRONTEND_URL=http://localhost:4200
PORT=3000
OAUTH_GITHUB_CLIENT_ID=your_github_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_github_client_secret
DATABASE_URL=postgres://admin:password@localhost:5432/postgres
STRIPE_SECRET_KEY=keep_empty_for_now
JWT_SIGNING_KEY=your_jwt_signing_key
```

> To generate a JWT signing key, you can use the following command in your terminal:
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
Inprogress...
