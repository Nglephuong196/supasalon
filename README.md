# Supasalon

A salon management monorepo with salon web, salon API, and mobile apps.

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Salon Web   | React + TypeScript + Vite           |
| Salon API   | Elysia + Bun + Drizzle ORM          |
| Mobile      | Expo + React Native                 |
| Database    | PostgreSQL + Drizzle ORM            |
| Monorepo    | Bun workspaces + Turbo              |

## Project Structure

```text
supasalon/
|-- apps/
|   |-- salon-api/
|   |-- salon-web/
|   `-- mobile/
`-- packages/
    |-- constants/
    `-- database/
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Bun

### Install

```bash
bun install
```

### Run Development

```bash
# run salon web + salon api
bun run dev

# run all workspaces
bun run dev:all

# run individual apps
bun run dev:web
bun run dev:api
bun run dev:mobile
```

## Common Commands

| Command                    | Description                         |
| -------------------------- | ----------------------------------- |
| `bun run build`            | Build all workspaces                |
| `bun run build:web`        | Build salon web app                 |
| `bun run lint`             | Lint repo with Biome                |
| `bun run format`           | Format repo with Biome              |
| `bun run db:generate`      | Generate migrations for salon API   |
| `bun run db:migrate:local` | Run local DB migrations for API     |
| `bun run db:studio`        | Open Drizzle Studio for salon API   |

## Key Paths

| Path                                  | Purpose                          |
| ------------------------------------- | -------------------------------- |
| `apps/salon-api/src/index.ts`         | API entry point                  |
| `apps/salon-api/src/db/schema.ts`     | Database schema                  |
| `apps/salon-web/src/main.tsx`         | Web app bootstrap                |
| `apps/mobile/app`                     | Expo Router app screens          |
| `packages/constants`                  | Shared constants                 |
| `packages/database`                   | Shared database types/helpers    |
