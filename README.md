# Salon Pro

A monorepo for salon management with web and mobile apps.

## Tech Stack

- **Web**: Next.js 16 + React 19 + Tailwind CSS
- **Web (Svelte)**: SvelteKit 2 + Svelte 5
- **API**: Hono (Cloudflare Workers)
- **Mobile**: Expo + React Native
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Auth**: Better Auth
- **Monorepo**: Bun workspaces
- **Hosting**: Cloudflare Workers

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager & runtime)

### Install Dependencies

```bash
bun install
```

### Development

```bash
# Start web app (Next.js)
bun dev:web

# Start web app (SvelteKit)
bun dev:web-svelte

# Start API server
bun dev:api

# Start mobile app
bun dev:mobile

# Start mobile on specific platform
bun dev:mobile:ios
bun dev:mobile:android
bun dev:mobile:web
```

### Build

```bash
# Build web
bun build:web

# Build mobile
bun build:mobile:web
bun build:mobile:ios
bun build:mobile:android
```

## Project Structure

```
salon-pro/
├── apps/
│   ├── web/          # Next.js web app
│   ├── web-svelte/   # SvelteKit web app
│   ├── api/          # Hono API (Cloudflare Workers)
│   └── mobile/       # Expo mobile app
└── packages/
    ├── database/     # Database types
    └── constants/    # Shared constants
```

## Deployment

### Cloudflare Workers (Web App)

**Local commands:**

```bash
cd apps/web

# Build for Cloudflare
bun run cf:build

# Deploy to Cloudflare
bun run cf:deploy

# Local dev with Cloudflare runtime
bun run cf:dev
```

**CI/CD:** Push to `master` triggers auto-deploy via GitHub Actions.

**Required GitHub Secrets:**

- `CLOUDFLARE_API_TOKEN` - [Create here](https://dash.cloudflare.com/profile/api-tokens)
- `CLOUDFLARE_ACCOUNT_ID` - Found in Cloudflare Dashboard → Overview

## Database Development

All database commands should be run from the `apps/api` directory:

```bash
cd apps/api
```

### Schema Development Workflow

1. **Modify Schema** - Edit `src/db/schema.ts`

2. **Generate Migration** - Creates SQL migration file in `drizzle/`:
   ```bash
   bun run db:generate
   ```

3. **Apply Migration Locally** - Runs migration on local D1:
   ```bash
   bun run db:migrate:local
   ```

4. **Apply Migration to Production** - Runs migration on remote D1:
   ```bash
   bun run db:migrate:prod
   ```

### Better Auth Schema

The schema includes Better Auth tables (`user`, `session`, `account`, `verification`). If you need to regenerate or reference the Better Auth schema:

```bash
bunx @better-auth/cli generate --config src/lib/auth.ts
```

This generates the required auth tables. The current schema in `src/db/schema.ts` already includes these tables with the correct structure.

### Database Studio

To visually explore and edit your database:

```bash
bun run db:studio
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `bun run db:generate` | Generate migration from schema changes |
| `bun run db:migrate:local` | Apply migrations to local D1 |
| `bun run db:migrate:prod` | Apply migrations to remote D1 |
| `bun run db:studio` | Open Drizzle Studio GUI |

### First-Time Setup

When starting fresh or after resetting:

```bash
cd apps/api
bun run db:generate      # Generate initial migration
bun run db:migrate:local # Apply to local D1
```

