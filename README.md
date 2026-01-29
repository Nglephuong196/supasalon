# Supasalon

A multi-tenant salon management SaaS with web and mobile apps.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Web** | SvelteKit 2 + Svelte 5 + Tailwind v4 + shadcn-svelte |
| **API** | Hono on Cloudflare Workers |
| **Mobile** | Expo 54 + React Native |
| **Database** | Cloudflare D1 (SQLite) + Drizzle ORM |
| **Auth** | Better Auth (email/password) |
| **Monorepo** | pnpm workspaces + Turbo |
| **Hosting** | Cloudflare (Workers + Pages) |

## Project Structure

```
supasalon/
├── apps/
│   ├── api/              # Hono API (Cloudflare Workers)
│   ├── web/              # SvelteKit web app
│   └── mobile/           # Expo mobile app
└── packages/
    ├── constants/        # Shared constants (Vietnam provinces, phone validation)
    └── database/         # Shared database types
```

## Architecture Overview

### API (`apps/api`)

Hono serverless API deployed to Cloudflare Workers with D1 database.

**Entry point:** `src/index.ts`

**Structure:**
- `src/controllers/` - Route handlers (auth, users, salons, customers, services, bookings, invoices)
- `src/services/` - Business logic layer
- `src/db/` - Database connection and schema
- `src/lib/auth.ts` - Better Auth configuration

**Environment variables** (`.dev.vars`):
```
BETTER_AUTH_SECRET=<your-secret>
BETTER_AUTH_URL=http://localhost:8787
```

**API Routes:**
| Route | Description |
|-------|-------------|
| `GET /` | Health check |
| `/api/auth/*` | Better Auth endpoints (signup, signin, session, etc.) |
| `/users` | User management |
| `/salons` | Salon CRUD |
| `/customers` | Customer management |
| `/service-categories` | Service category CRUD |
| `/services` | Service CRUD |
| `/bookings` | Booking management |
| `/invoices` | Invoice management |

**CORS:** Configured for `localhost:5173` (SvelteKit dev server)

### Database Schema (`apps/api/src/db/schema.ts`)

**Better Auth tables:**
- `user` - Users with role (admin/owner/staff)
- `session` - Auth sessions (7-day expiry)
- `account` - OAuth accounts
- `verification` - Email verification tokens

**Business tables:**
- `salons` - Linked to owner (user)
- `customers` - Linked to salon
- `serviceCategories` - Linked to salon
- `services` - Linked to category
- `bookings` - Links salon, customer, service
- `invoices` - Linked to booking

**Auto-create salon on signup:** When a user signs up with `salonName`, a salon is automatically created via Better Auth database hooks.

### Web App (`apps/web`)

SvelteKit 2 with Svelte 5, deployed to Cloudflare Pages.

**UI Stack:**
- Tailwind CSS v4
- shadcn-svelte (Radix-based components)
- bits-ui
- lucide-svelte (icons)

**Auth client:** `src/lib/auth-client.ts`
```typescript
import { signIn, signUp, signOut, useSession } from '$lib/auth-client';
```

**Custom user fields in auth:**
- `salonName` - Salon name (used to auto-create salon)
- `province` - Vietnamese province
- `address` - Street address
- `phone` - Phone number

**Routes:**
- `/` - Landing page
- `/(auth)/login` - Login page
- `/(auth)/signup` - Signup page
- `/dashboard` - Protected dashboard

**Environment variables** (`.env`):
```
VITE_AUTH_BASE_URL=http://localhost:8787
```

### Shared Packages

**`@repo/constants`:**
- `VIETNAM_PROVINCES` - List of 34 Vietnamese provinces (post-2025 reform)
- `VIETNAM_PHONE_REGEX` - Vietnamese phone number validation
- `isValidVietnamesePhone()` - Phone validation helper

**`@repo/database`:**
- Shared TypeScript types (placeholder for future expansion)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Latest LTS recommended)
- [pnpm](https://pnpm.io/) (Package manager)

### Install Dependencies

```bash
pnpm install
```

### First-Time Database Setup

```bash
cd apps/api
cp .dev.vars.example .dev.vars  # Edit with your secrets
pnpm run db:generate            # Generate migration
pnpm run db:migrate:local       # Apply to local D1
```

### Development

```bash
# Start all apps (web, api, mobile) or filtered
pnpm run dev

# Or individually via turbo filters (defined in package.json):
pnpm run dev:web          # Web on http://localhost:5173
pnpm run dev:api          # API on http://localhost:8787
pnpm run dev:mobile       # Expo mobile
```

## Database Development

All commands from `apps/api`:

```bash
cd apps/api
```

### Workflow

1. **Edit schema** - `src/db/schema.ts`
2. **Generate migration** - `pnpm run db:generate`
3. **Apply locally** - `pnpm run db:migrate:local`
4. **Apply to production** - `pnpm run db:migrate:prod`

### Commands

| Command | Description |
|---------|-------------|
| `pnpm run db:generate` | Generate migration from schema changes |
| `pnpm run db:migrate:local` | Apply migrations to local D1 |
| `pnpm run db:migrate:prod` | Apply migrations to remote D1 |
| `pnpm run db:studio` | Open Drizzle Studio GUI |

### Better Auth Schema

Regenerate auth tables if needed:
```bash
pnpm exec @better-auth/cli generate --config src/lib/auth.ts
```

## Deployment

### API (Cloudflare Workers)

```bash
cd apps/api
pnpm run deploy
```

### Web (Cloudflare Pages)

```bash
cd apps/web
pnpm run deploy
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `apps/api/src/index.ts` | API entry point and routes |
| `apps/api/src/lib/auth.ts` | Better Auth configuration |
| `apps/api/src/db/schema.ts` | Database schema (all tables) |
| `apps/api/wrangler.jsonc` | Cloudflare Workers config |
| `apps/web/src/lib/auth-client.ts` | Frontend auth client |
| `packages/constants/vietnam.ts` | Vietnam provinces & phone validation |
