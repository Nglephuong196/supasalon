# Supasalon

A salon management monorepo with web, API, and mobile apps.

## Tech Stack

| Layer     | Technology                         |
| --------- | ---------------------------------- |
| Web       | React + TypeScript + Vite          |
| API       | ASP.NET Core + Entity Framework    |
| Mobile    | Expo + React Native                |
| Database  | PostgreSQL                         |
| Monorepo  | Bun workspaces + Turbo             |

## Project Structure

```text
supasalon/
|-- apps/
|   |-- api/
|   |-- web/
|   `-- mobile/
`-- packages/
    |-- constants/
    `-- database/
```

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Bun
- .NET SDK

### Install

```bash
bun install
```

### Run Development

```bash
# run web + api
bun run dev

# run all workspaces
bun run dev:all

# run individual apps
bun run dev:web
bun run dev:api
bun run dev:mobile
```

## Common Commands

| Command                    | Description                          |
| -------------------------- | ------------------------------------ |
| `bun run build`            | Build all workspaces                 |
| `bun run build:web`        | Build web app                        |
| `bun run lint`             | Lint repo with Biome                 |
| `bun run format`           | Format repo with Biome               |
| `bun run db:generate`      | Generate API migrations              |
| `bun run db:migrate:local` | Run local DB migrations for API      |
| `bun run db:studio`        | List API migrations                  |

## Key Paths

| Path                        | Purpose                          |
| --------------------------- | -------------------------------- |
| `apps/api/Program.cs`       | API entry point                  |
| `apps/api/Data`             | API EF DbContext/configurations  |
| `apps/web/src/main.tsx`     | Web app bootstrap                |
| `apps/mobile/app`           | Expo Router app screens          |
| `packages/constants`        | Shared constants                 |
| `packages/database`         | Shared database types/helpers    |
