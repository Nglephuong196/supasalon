# Salon Pro

A monorepo for salon management with web and mobile apps.

## Tech Stack

- **Web**: Next.js 16 + React 19 + Tailwind CSS
- **Mobile**: Expo + React Native
- **Database**: Supabase (PostgreSQL)
- **Monorepo**: Bun workspaces
- **Hosting**: Cloudflare Workers (via OpenNext)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager & runtime)
- [Docker](https://www.docker.com/) (for Supabase local dev)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)

### Install Dependencies

```bash
bun install
```

### Development

```bash
# Start web app
bun dev:web

# Start mobile app
bun dev:mobile

# Start mobile on specific platform
bun dev:mobile:ios
bun dev:mobile:android
bun dev:mobile:web
```

### Supabase Commands

Run these directly (not through bun scripts):

```bash
# Start local Supabase
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset database
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript local > packages/database/src/database.types.ts

# Push migrations
npx supabase db push

# Create new migration
npx supabase migration new <name>

# Diff database changes
npx supabase db diff -f <name>
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
│   └── mobile/       # Expo mobile app
├── packages/
│   ├── database/     # Supabase types
│   └── constants/    # Shared constants
└── supabase/         # Supabase config & migrations
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
