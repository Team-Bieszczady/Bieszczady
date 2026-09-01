# Bieszczadzki UL - Virtual Office 🏔️

Modular web application for project, task, budget, and documentation management for the Bieszczadzki UL organization.

## Team
- **PM:** Łukasz Szczepański
- **Mentor:** Krzysiek Jamiński

## Tech Stack
- **Frontend:** React + TypeScript (Vite)
- **Backend:** NestJS (TypeScript)
- **Database:** SQL Server 2022 + Prisma ORM
- **Local database:** runs in Docker (no local SQL Server installation needed)

## Prerequisites
- [Node.js](https://nodejs.org/) **22 or newer** (the exact major is pinned in `.nvmrc`; with [nvm](https://github.com/nvm-sh/nvm) just run `nvm use`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be running before you start the database. The SQL Server image is about 1.5 GB and the container needs at least 2 GB of RAM, so make sure Docker Desktop is allowed that much.

## How to run locally

### 1. Clone the repository

```bash
git clone https://github.com/Team-Bieszczady/Bieszczady.git
cd Bieszczady
```

### 2. Set up environment files

Copy each example file. The default values work for local development, so you can leave them as they are.

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

On macOS/Linux use `cp` instead of `Copy-Item`.

> These `.env` files are gitignored — never commit them. Only the `.env.example` templates belong in the repository.

> ⚠️ If you change any `DB_*` value in the root `.env`, you must update `DATABASE_URL` in `backend/.env` to match — the root file configures the SQL Server container, `backend/.env` tells Prisma how to reach it. Mismatched values are the most common cause of "backend won't connect".

#### Email (password reset)

Password reset sends a real email, so `backend/.env` needs SMTP credentials.
For development we use [Mailtrap](https://mailtrap.io), which captures messages
in a web inbox instead of delivering them, so no address ever receives anything
by accident.

Create a free account, open **Email Testing → Inboxes → your sandbox →
Integration → SMTP**, and copy `Username` and `Password` into `backend/.env`:

```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<from Mailtrap>
SMTP_PASS=<from Mailtrap>
SMTP_FROM=noreply@bieszczady.local
```

Take the credentials from **Email Testing**, not from *Email Sending* — the two
sections look identical and the wrong pair fails with
`535 5.7.0 Invalid credentials`.

`SMTP_FROM` is only a label here; Mailtrap never delivers to it. Before a real
deployment it has to become an address on a domain the foundation controls,
otherwise messages land in spam.

### 3. Start the SQL Server database

Make sure Docker Desktop is running, then:

```bash
docker compose up -d --wait
```

This starts SQL Server 2022 in a container on port `1433`. Data is kept in a Docker volume, so it survives restarts.

The very first run takes several minutes, because Docker has to download the SQL Server image (~1.5 GB). After that it is roughly a minute, because SQL Server initialises itself and then `docker/init/01-init.sql` creates the application database and login. The `--wait` flag holds the terminal until everything is ready, so you can safely run the next step as soon as it returns.

Check the status at any time:

```bash
docker compose ps
```

### 4. Start the backend

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

Runs at http://localhost:3000

Verify it works: open http://localhost:3000/health — it should return `{"status":"ok"}`. This endpoint queries the database, so `ok` also confirms the database connection.

### 5. Start the frontend

In a **separate terminal**:

```bash
cd frontend
npm install
npm run dev
```

Runs at http://localhost:5173 — you should see "Hello World" and `Backend: ✅ połączono`, which confirms the frontend can reach the backend.

## Useful commands

| Command | What it does |
| --- | --- |
| `docker compose up -d --wait` | Start the database and wait until it is ready |
| `docker compose down` | Stop the database (data is kept) |
| `docker compose down -v` | Stop the database and **delete all data** |
| `npm test` (in `backend`) | Run backend unit tests |
| `npm run test:e2e` (in `backend`) | Run backend e2e tests — **requires the database to be running** |
| `npm run build` (in either folder) | Production build |
| `npx prisma migrate dev` (in `backend`) | Apply schema changes to the database |
| `npx prisma studio` (in `backend`) | Browse the database in a GUI |

## Project structure

```
.
├── backend/          NestJS API
│   ├── prisma/       Prisma schema and migrations
│   └── src/          Application code
├── frontend/         React + Vite app
├── docker/init/      SQL script that creates the database and application login
├── docker-compose.yml    SQL Server container definition
├── .nvmrc            Node version used by the team
└── .env.example      Database credentials used by docker-compose
```

## Troubleshooting

**`the URL must start with the protocol sqlserver://`** — your local `backend/.env` still holds the old MySQL connection string. The `.env` files are gitignored, so `git pull` cannot update them. Re-copy the templates:

```powershell
Copy-Item .env.example .env -Force
Copy-Item backend/.env.example backend/.env -Force
```

Then remove the old MySQL container and volume, and start the new one:

```bash
docker compose down -v --remove-orphans
docker volume rm bieszczady_mysql_data
docker compose up -d --wait
```

**`error during connect ... dockerDesktopLinuxEngine`** — Docker Desktop is not running. Start it and wait until it reports "running", then retry.

**Backend crashes on start with a Prisma connection error** — the database is not ready or not running. Check `docker compose ps`; the `mssql` service must say `healthy`. If it does not exist, run `docker compose up -d --wait`.

**`P3014` / shadow database error** — Prisma Migrate could not create its temporary shadow database. The `dbcreator` role is granted by `docker/init/01-init.sql`, which runs against a fresh container. If your volume predates that script, recreate it with `docker compose down -v && docker compose up -d --wait` (this deletes all local data).

**`Login failed for user` / backend connects to the wrong database** — `DATABASE_URL` in `backend/.env` does not match the `DB_*` values in the root `.env`.

**`Password validation failed` when the container starts** — SQL Server rejects weak SA passwords. `DB_SA_PASSWORD` must be at least 8 characters and mix upper case, lower case, digits and a symbol.

**`certificate chain was issued by an authority that is not trusted`** — `DATABASE_URL` is missing `trustServerCertificate=true`. The local container uses a self-signed certificate.

**Frontend shows `❌ brak połączenia`** — the backend is not running, or `VITE_API_URL` in `frontend/.env` does not match the backend address. The `/health` endpoint returns HTTP 503 when the database is unreachable, so this also appears when the backend is up but the database is not.

**`Port 5173 is already in use`** — something is still listening on that port, usually a dev server from an earlier session that was never stopped. The frontend deliberately refuses to start on a different port, because the backend only accepts requests from `http://localhost:5173` (see `CORS_ORIGIN`); starting on `5174` would make every API call fail with a confusing CORS error. Free the port and try again:

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173 -State Listen).OwningProcess -Force
```

Stop dev servers with `Ctrl+C` in their terminal — closing the VS Code tab does not always kill the process.

## Working with git

- `main` is protected — never commit to it directly.
- Branch naming: `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`.
- Open a Pull Request into `main` and request a review before merging.
- Before pushing, make sure `npm run lint` and `npm test` pass in `backend`, and `npm run build` passes in `frontend`.

> These rules are a starting proposal — confirm them with the PM and mentor and adjust this section if the team decides otherwise.
