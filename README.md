# Bieszczadzki UL - Virtual Office 🏔️

Modular web application for project, task, budget, and documentation management for the Bieszczadzki UL organization.

## Team
- **PM:** Łukasz Szczepański
- **Mentor:** Krzysiek Jamiński

## Tech Stack
- **Frontend:** React + TypeScript (Vite)
- **Backend:** NestJS (TypeScript)
- **Database:** MySQL 8 + Prisma ORM
- **Local database:** runs in Docker (no local MySQL installation needed)

## Prerequisites
- [Node.js](https://nodejs.org/) **22 or newer** (the exact major is pinned in `.nvmrc`; with [nvm](https://github.com/nvm-sh/nvm) just run `nvm use`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be running before you start the database

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

> ⚠️ If you change any `DB_*` value in the root `.env`, you must update `DATABASE_URL` in `backend/.env` to match — the root file configures the MySQL container, `backend/.env` tells Prisma how to reach it. Mismatched values are the most common cause of "backend won't connect".

### 3. Start the MySQL database

Make sure Docker Desktop is running, then:

```bash
docker compose up -d --wait
```

This starts MySQL 8 in a container on port `3306`. Data is kept in a Docker volume, so it survives restarts.

The first run takes about 30 seconds, because MySQL has to initialise the database and apply the grants in `docker/init/`. The `--wait` flag holds the terminal until the container reports **healthy**, so you can safely run the next step as soon as it returns.

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
├── docker/init/      SQL/shell scripts run once when the DB container is created
├── docker-compose.yml    MySQL container definition
├── .nvmrc            Node version used by the team
└── .env.example      Database credentials used by docker-compose
```

## Troubleshooting

**`error during connect ... dockerDesktopLinuxEngine`** — Docker Desktop is not running. Start it and wait until it reports "running", then retry.

**Backend crashes on start with a Prisma connection error** — the database is not ready or not running. Check `docker compose ps`; the `mysql` service must say `healthy`. If it does not exist, run `docker compose up -d --wait`.

**`P3014` / shadow database error** — the grants in `docker/init/` only run when the container is created for the very first time. If your volume predates that script, recreate it with `docker compose down -v && docker compose up -d --wait` (this deletes all local data).

**`Access denied for user` / backend connects to the wrong database** — `DATABASE_URL` in `backend/.env` does not match the `DB_*` values in the root `.env`.

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
