# Softball Lineup Generator

A web app for generating fair, co-ed softball lineups. Tracks position preferences, season history, and co-ed rules across a full season.

## Local Setup

### Prerequisites

- [Docker](https://www.docker.com/) (for PostgreSQL)
- Node.js 20+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

`.env.example` contains the defaults that match the Docker Compose setup. No changes needed for local development.

### 3. Start the database

```bash
docker-compose up -d
```

### 4. Run migrations

```bash
npm run db:migrate
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Commands

| Command | Description |
|---|---|
| `npm run db:generate` | Generate a new migration from schema changes |
| `npm run db:migrate` | Apply pending migrations to the local DB |

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |

See `.env.example` for defaults.
