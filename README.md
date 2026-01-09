# Salon Pro

A monorepo for salon management with web and mobile apps.

## Tech Stack

- **Web**: Next.js 16 + React 19 + Tailwind CSS
- **Mobile**: Expo + React Native
- **Database**: PostgreSQL (backend TBD)
- **Monorepo**: Bun workspaces
- **Hosting**: Cloudflare Workers (via OpenNext)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (package manager & runtime)

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
