# SupaSalon Feature and Workflow Documentation

This document is generated from the current implementation in:
- `apps/salon-api`
- `apps/salon-web`

It focuses on real behavior in code: routes, permission checks, business rules, and UI workflows.

## 1. Application Overview

SupaSalon is a multi-tenant salon management app with:
- `salon-api`: Elysia + Drizzle + PostgreSQL backend
- `salon-web`: React + TanStack Router + TanStack Query frontend

Primary business domains:
- Authentication and tenant context
- Booking lifecycle
- Invoice and payment lifecycle
- Cash session operations
- Payroll cycles
- Commission rules and payouts
- Prepaid plans/cards
- Reminder automation
- Approval workflows for sensitive actions
- Core catalogs (customers, services, products, branches, members)

## 2. High-Level Architecture

Request lifecycle for protected API calls:
1. Client sends cookies + `X-Organization-Id` and optional `sessionId` header (see `apps/salon-web/src/lib/api.ts`).
2. `requireTenant()` validates session via Better Auth and confirms user belongs to organization (`apps/salon-api/src/lib/tenant.ts`).
3. `requirePermissionFor()` checks role/permission when route enforces resource/action (`apps/salon-api/src/routes/protected/plugin.ts`, `apps/salon-api/src/lib/permission.ts`).
4. Route handler calls service layer.
5. Service layer enforces domain rules and DB updates.
6. Critical operations write to `activity_logs`.

Public flow:
- `/public/*` routes skip tenant auth and support public booking + slug availability checks.

## 3. Auth, Session, and Organization Workflow

### Backend auth
- Better Auth configured with email/password, bearer, organization plugin, and Expo plugin (`apps/salon-api/src/lib/auth.ts`).
- Auth routes mounted via `app.mount(auth.handler)` at `/api/auth/*` (`apps/salon-api/src/index.ts`).

### Frontend auth
- `signIn`, `signUp`, `signOut`, `useSession`, and `organization` come from Better Auth React client (`apps/salon-web/src/lib/auth-client.ts`).
- `ApiContextSync` stores `organizationId` and session token into runtime/localStorage for API headers (`apps/salon-web/src/components/providers/api-context-sync.tsx`).

### Tenant resolution
- Candidate organization from header (`X-Organization-Id`/`X-Salon-Id`) or session active org.
- API rejects requests if user is not member of resolved org (`apps/salon-api/src/lib/tenant.ts`).

## 4. Permission Model

Role shortcuts:
- `owner` and `admin` bypass fine-grained checks.

Fine-grained checks:
- Per-resource action checks through `MembersService.checkPermission()`.
- Resources used in app: `CUSTOMER`, `INVOICE`, `SERVICE`, `PRODUCT`, `BOOKING`, `EMPLOYEE`, `REPORT`.

Notes:
- Some routes use `getTenant()` directly (authenticated membership required) without explicit `requirePermissionFor` action checks.

## 5. Data Model (Feature-Relevant)

Key tables in `apps/salon-api/src/db/schema.ts`:
- Identity/multi-tenant: `user`, `session`, `organization`, `member`, `member_permissions`
- Catalogs: `customers`, `service_categories`, `services`, `product_categories`, `products`, `branches`, `member_branches`
- Booking: `bookings`, `booking_policies`
- Sales/payments: `invoices`, `invoice_items`, `invoice_item_staff`, `invoice_payment_transactions`
- Cash ops: `cash_sessions`, `cash_transactions`
- Prepaid: `prepaid_plans`, `customer_prepaid_cards`, `customer_prepaid_transactions`
- Reminder/approval: `booking_reminder_settings`, `booking_reminder_logs`, `approval_policies`, `approval_requests`
- Payroll/commission: `payroll_configs`, `payroll_cycles`, `payroll_items`, `staff_commission_rules`, `staff_commission_payouts`
- Audit: `activity_logs`

## 6. Backend Feature Map (`salon-api`)

### 6.1 Public endpoints

From `apps/salon-api/src/routes/public-booking.ts`:
- `POST /public/organization/check-slug`: validates slug format and uniqueness.
- `GET /public/booking/:slug/options`: salon info + services + staff for booking page.
- `POST /public/booking/:slug`: creates customer if needed and creates booking.

Public booking validations/workflow:
1. Validate payload (name/phone/datetime/guests).
2. Resolve org by slug.
3. Verify services belong to org.
4. Verify selected staff belong to org.
5. Upsert customer by phone in org.
6. Create booking with normalized guest-service JSON.

### 6.2 Booking Management

Routes: `apps/salon-api/src/routes/protected/bookings.ts`
- `GET /bookings` (filters: customerId/branch/date/status/search/page/limit/simple)
- `GET /bookings/stats`
- `GET /bookings/:id`
- `POST /bookings`
- `PUT /bookings/:id`
- `PATCH /bookings/:id/status`
- `DELETE /bookings/:id`

Key rules in `apps/salon-api/src/services/bookings.ts`:
- Optional default booking policy fallback.
- Staff overlap prevention when policy `preventStaffOverlap=true`:
  - Uses assigned `memberId` in booking guest services.
  - Computes duration from service durations.
  - Applies policy buffer minutes.
  - Rejects overlapping active bookings.
- Deposit rules:
  - Auto applies default deposit if policy requires and request has zero deposit.
  - `depositPaid <= depositAmount` enforced.
- No-show transitions:
  - Auto sets `noShowAt`; default reason if missing.

### 6.3 Booking Policies

Routes: `apps/salon-api/src/routes/protected/booking-policies.ts`
- `GET /booking-policies`
- `PUT /booking-policies`

Fields:
- `preventStaffOverlap`
- `bufferMinutes`
- `requireDeposit`
- `defaultDepositAmount`
- `cancellationWindowHours`

### 6.4 Booking Reminders

Routes: `apps/salon-api/src/routes/protected/booking-reminders.ts`
- `GET /booking-reminders/settings`
- `PUT /booking-reminders/settings`
- `GET /booking-reminders/logs`
- `POST /booking-reminders/send`
- `POST /booking-reminders/dispatch`

Rules in `apps/salon-api/src/services/booking-reminders.ts`:
- Settings defaults: disabled, 24h, SMS enabled template.
- Manual send: writes log entries immediately with status `sent`.
- Auto dispatch:
  - Finds bookings in target time window (`hoursBefore` +/- 15 min).
  - Only statuses `pending|confirmed`.
  - Deduplicates already sent/queued channel logs per booking.
- Message template placeholders include `customerName`, `bookingTime`, `serviceName`.

### 6.5 Invoice and Payments

Routes: `apps/salon-api/src/routes/protected/invoices.ts`
- `GET /invoices` (+ filters: branchId, open tab, date today, from, to)
- `GET /invoices/:id`
- `GET /invoices/booking/:bookingId`
- `GET /invoices/:id/payments`
- `POST /invoices`
- `POST /invoices/:id/settle`
- `POST /invoices/:id/close`
- `POST /invoices/:id/cancel`
- `POST /invoices/:id/refund`
- `GET /invoices/:id/audit`
- `PUT /invoices/:id`
- `DELETE /invoices/:id`

Core behavior in `apps/salon-api/src/services/invoices.ts`:
- Branch resolution order: explicit branch -> linked booking branch -> org default branch.
- Settlement supports multi-payment allocations (cash/card/transfer).
- Payment transactions can be `pending|confirmed|failed|cancelled`.
- Cash confirmed payments link to current open cash session.
- Invoice payment state is recomputed from confirmed payment/refund rows:
  - `amountPaid`, `change`, `paymentMethod`, `status`, tab open flag.
- Cancel guard: cannot cancel if net paid > 0, must refund instead.
- Refund:
  - Supports amount and per-method allocation.
  - Auto-allocation fallback by refundable balances.
  - Writes refund payment transactions, then refreshes invoice status.

### 6.6 Approval Workflow

Routes: `apps/salon-api/src/routes/protected/approval-requests.ts`
- `GET /approval-requests/policy`
- `PUT /approval-requests/policy`
- `GET /approval-requests`
- `PATCH /approval-requests/:id/approve`
- `PATCH /approval-requests/:id/reject`

Approval triggers:
- Invoice cancel (if policy requires)
- Invoice refund (if policy requires and amount >= threshold)
- Cash out transaction (if policy requires and amount >= threshold)

Execution on approval:
- `invoice_cancel` -> execute `InvoicesService.cancel()`
- `invoice_refund` -> execute `InvoicesService.refund()`
- `cash_out` -> execute `CashManagementService.createCashTransaction(type=out)`

Approval dedupe:
- Service prevents duplicate pending approval for same entity/action.

### 6.7 Cash Management

Routes: `apps/salon-api/src/routes/protected/cash-management.ts`
- `GET /cash-management/overview`
- `GET /cash-management/session/current`
- `POST /cash-management/session/open`
- `POST /cash-management/session/:id/close`
- `GET /cash-management/sessions`
- `GET /cash-management/transactions`
- `POST /cash-management/transactions`
- `GET /cash-management/report/payment-method`
- `GET /cash-management/pending-payments`
- `PATCH /cash-management/payments/:id/confirm`
- `PATCH /cash-management/payments/:id/fail`

Rules in `apps/salon-api/src/services/cash-management.ts`:
- Only one open cash session per organization.
- Session close computes expected balance:
  - opening + confirmed cash payments + manual cash in - cash refunds - manual cash out.
- Manual cash transaction requires open session.
- Payment report aggregates received/refunded/net and pending/confirmed counts by method.

### 6.8 Payroll

Routes: `apps/salon-api/src/routes/protected/payroll.ts`
- Configs: `GET /payroll/configs`, `POST /payroll/configs`
- Cycles: `GET /payroll/cycles`, `POST /payroll/cycles/preview`, `POST /payroll/cycles`, `GET /payroll/cycles/:id`, `GET /payroll/cycles/:id/items`
- Item edits: `PATCH /payroll/items/:id`
- State transitions: `PATCH /payroll/cycles/:id/finalize`, `PATCH /payroll/cycles/:id/pay`

Rules in `apps/salon-api/src/services/payroll.ts`:
- Preview staff set from branch assignments or org members (excluding owner).
- Commission in preview derived from paid invoice staff commissions in period.
- Effective payroll config resolved by staff + branch + effective date.
- Net amount formula:
  - base + commission + bonus + allowance - deduction - advance
- Create cycle checks duplicate period per branch.
- Finalize requires at least one item.
- Pay cycle auto-finalizes if still draft, then marks items paid.
- Paid items cannot be edited.

### 6.9 Commission Management

Routes:
- Rules (`apps/salon-api/src/routes/protected/staff-commission-rules.ts`):
  - `GET /staff-commission-rules`
  - `POST /staff-commission-rules/upsert`
  - `POST /staff-commission-rules/bulk-upsert`
  - `DELETE /staff-commission-rules/:id`
- Payouts (`apps/salon-api/src/routes/protected/commission-payouts.ts`):
  - `GET /commission-payouts`
  - `POST /commission-payouts/preview`
  - `POST /commission-payouts`
  - `PATCH /commission-payouts/:id/pay`
  - `GET /commission-payouts/export` (CSV)

Rules in `apps/salon-api/src/services/commission-payouts.ts`:
- Preview computes per-staff totals from paid invoices + item staff commission setup.
- Create payout cycle inserts one row per staff preview result.
- Prevents duplicate payout period cycle.

### 6.10 Prepaid Cards and Plans

Routes: `apps/salon-api/src/routes/protected/prepaid.ts`
- Plans: `GET/POST /prepaid/plans`, `PUT/DELETE /prepaid/plans/:id`
- Cards: `GET /prepaid/cards`, `GET /prepaid/cards/:id`, `POST /prepaid/cards`
- Transactions: `POST /prepaid/cards/:id/consume`, `POST /prepaid/cards/:id/topup`, `GET /prepaid/transactions`

Rules in `apps/salon-api/src/services/prepaid.ts`:
- Plan delete blocked if any cards already use plan.
- Card create:
  - derives values from plan unless explicitly provided
  - auto card code if absent
  - creates initial `purchase` transaction record
- Consume:
  - card must be active and not expired
  - amount must be positive and <= remaining balance
- Topup:
  - card must be active
  - amount positive

### 6.11 Branches

Routes: `apps/salon-api/src/routes/protected/branches.ts`
- Branch CRUD: `GET /branches`, `GET /branches/:id`, `POST /branches`, `PUT /branches/:id`, `DELETE /branches/:id`
- Branch membership: `GET /branches/:id/members`, `PUT /branches/:id/members/:memberId`, `DELETE /branches/:id/members/:memberId`, `GET /branches/by-member/:memberId`

Rules in `apps/salon-api/src/services/branches.ts`:
- First branch becomes default automatically.
- Setting a branch default unsets old default.
- Deletion blocked if branch has bookings/invoices.
- Member primary branch logic maintained on assign/unassign.
- Fallback default branch assignment can be auto-created for member lookup.

### 6.12 Core Catalogs and Users/Members

Routes and behavior:
- Customers (`/customers`): paginated search + vip filter + CRUD.
- Customer memberships (`/customer-memberships`): CRUD + by-customer listing.
- Membership tiers (`/membership-tiers`): CRUD + recalc by customer.
- Services (`/service-categories`, `/services`): category + item CRUD.
- Products (`/product-categories`, `/products`): category + item CRUD.
- Members (`/members`):
  - list/paginated list
  - create member user account via Better Auth signup
  - role updates/removal
  - permission set/get/check
- Users (`/users`): profile patch `/users/me`, role updates/removal by owner/admin.

### 6.13 Dashboard Aggregation

Route: `GET /dashboard?range=today|week|month|year` (`apps/salon-api/src/routes/protected/dashboard.ts`)

Provides:
- Revenue chart by selected range
- KPI stats + trend comparisons to previous period
- Upcoming/recent schedule list from bookings
- Top stylists by revenue attribution from invoice item staff commissions
- Low stock products list

## 7. Frontend Feature Map (`salon-web`)

## 7.1 Route structure

Defined in `apps/salon-web/src/router.tsx`:
- Public auth layout:
  - `/signin`
  - `/signup`
- Protected dashboard layout:
  - `/` overview
  - `/bookings`
  - `/customers`
  - `/employees`
  - `/services`
  - `/products`
  - `/invoices`
  - `/prepaid`
  - `/branches`
  - `/booking-reminders`
  - `/approvals`
  - `/cash-management`
  - `/settings`
  - `/profile`
  - `/commission-settings`
  - `/payroll`
  - `/unauthorized`
- Public booking layout:
  - `/book/$slug`

Protected layout gate:
- `useSession()` check; unauthenticated users are redirected to `/signin`.

## 7.2 API client behavior

From `apps/salon-web/src/lib/api.ts`:
- Base URL from `VITE_API_URL`/`PUBLIC_API_URL`/`VITE_AUTH_BASE_URL`.
- Auto includes cookies (`credentials: include`).
- For non-public/non-auth routes, ensures organization ID is available:
  - reads active org from session
  - or fetches auth organization list and sets active org
- Sends `X-Organization-Id` and `sessionId` when available.

## 7.3 Query model

From `apps/salon-web/src/lib/query-client.ts`:
- Centralized query keys for all modules (dashboard, bookings, invoices, cash, payroll, reminders, approvals, settings, etc.).
- Query defaults:
  - `refetchOnWindowFocus=false`
  - `retry=1` for queries
  - `retry=0` for mutations
  - `staleTime=30s`

## 7.4 Dashboard shell and navigation

From `apps/salon-web/src/components/layout/dashboard-shell.tsx`:
- Desktop left nav sections:
  - Main: Overview, Bookings
  - Management: Services, Products, Customers, Employees
  - System: Invoices, Branches, Payroll, Prepaid, Reminders, Cash, Approvals, Settings, Commission
- Mobile bottom quick nav: Overview, Bookings, Invoices, Payroll, Cash.
- Header actions: profile and sign out.

## 7.5 Auth and onboarding workflows (UI)

### Sign up (`apps/salon-web/src/pages/sign-up-page.tsx`)
1. Validates owner/email/password/salon info/phone.
2. Normalizes slug and checks slug availability via `/public/organization/check-slug`.
3. Creates user using `signUp.email()`.
4. Creates organization via `organization.create({name, slug})`.
5. Redirects to sign-in.

### Sign in (`apps/salon-web/src/pages/sign-in-page.tsx`)
1. Validates email/password.
2. Calls `signIn.email()`.
3. On success navigates to `/`.

## 7.6 Public booking workflow (UI)

From `apps/salon-web/src/pages/public/booking-page.tsx`:
1. Fetch salon options via `/public/booking/:slug/options`.
2. User selects customer info, datetime, service, optional staff, guest count.
3. UI expands single service selection across guest count.
4. Submits to `/public/booking/:slug` and displays confirmation message.

## 7.7 Dashboard module workflows

### Overview
- Fetches `/dashboard` with selected range.
- Displays chart, KPIs, top stylists, schedule, low stock.

### Bookings
- Loads dependencies (`customers`, `services`, `members`, `branches`).
- Lists bookings with filters.
- Creates/updates/deletes bookings.
- Updates status (including no-show reason).
- Reads booking stats endpoint for KPI cards.

### Customers
- Paginated listing with search and VIP filter.
- Create/update/delete customer records.

### Employees
- Paginated listing with search.
- Create member (creates auth user + org member server-side).
- Update role.
- Remove member by id/email.

### Services and Products
- Category CRUD and item CRUD flows.
- Category deletion invalidates related item queries.

### Invoices
- List invoices (branch filter).
- Create invoice with items/staff allocations.
- Settle invoice with split payments.
- Close tab-only invoice.
- Cancel/refund operations.
- Reads invoice audit logs.
- Handles approval-required responses (`requiresApproval=true`) from backend.

### Cash Management
- View current session and snapshot.
- Open/close session.
- Create manual in/out cash transactions.
- View pending payments and confirm/fail them.
- View payment method report + transaction history.
- Handles approval-required responses for high cash out requests.

### Approvals
- Manage approval policy toggles/thresholds.
- View approval request list with filters.
- Approve/reject requests.
- On approval updates related domains (invoice/cash) via cache invalidation.

### Booking Reminders
- Configure reminder channels/template/hours-before.
- Send manual reminder per booking.
- Trigger auto dispatch.
- View reminder logs.

### Branches
- Create/update/delete branch.
- Assign/unassign members to branch and mark primary.
- View members by branch.

### Payroll
- Manage payroll configs per staff/branch.
- Preview cycle payroll.
- Create payroll cycle.
- Edit payroll item bonuses/allowances/deductions/advances/payment method.
- Finalize cycle and mark paid.

### Prepaid
- Manage prepaid plans.
- Create cards for customers.
- Consume/topup card balances.
- View transaction history.

### Settings
- Combined settings bundle fetch:
  - tiers, members, services/products/categories, commission rules, booking policy.
- Manage membership tiers.
- Manage member permissions.
- Manage commission rules (single/bulk).
- Update booking policy.

### Commission Settings
- Manage commission rules (focused screen).
- Preview commission payout period.
- Create payout cycle and mark payout paid.

### Profile
- Update user profile (`/users/me`).
- Update organization name/slug via Better Auth organization update endpoint.

## 8. Cross-Domain Workflows

### 8.1 Approval-gated sensitive operations
1. User initiates cancel/refund invoice or large cash out.
2. Backend checks approval policy + threshold.
3. If required, creates pending approval request and returns HTTP 202 + `requiresApproval`.
4. Approver reviews in Approvals page.
5. Approve executes original action, marks approval executed, logs audit trail.

### 8.2 Invoice-Cash reconciliation
1. Invoice settlement creates payment transaction rows.
2. Confirmed cash payments link to open cash session.
3. Session snapshot computes expected balance from:
   - opening balance
   - cash payments/refunds
   - manual cash in/out
4. Session close stores discrepancy.

### 8.3 Payroll from sales commissions
1. Staff commissions attached to invoice items.
2. Payroll preview aggregates paid invoices in date range.
3. Preview rows become payroll cycle items.
4. Manual adjustments produce final net payroll.
5. Cycle finalized then paid.

### 8.4 Public booking to customer conversion
1. Public user books by salon slug.
2. Backend finds customer by phone in org; creates if missing.
3. Creates booking with normalized service/staff guest structure.
4. Booking appears in internal dashboard booking management.

## 9. Operational Notes

- CORS in API allows local web/mobile dev origins + app scheme (`apps/salon-api/src/index.ts`).
- Most critical write operations append `activity_logs` for audit traceability.
- Dashboard and some endpoints use aggregate snapshots rather than event sourcing.
- Frontend cache invalidations are explicitly wired after each mutation.

## 10. Source Index

Backend core:
- `apps/salon-api/src/index.ts`
- `apps/salon-api/src/lib/auth.ts`
- `apps/salon-api/src/lib/tenant.ts`
- `apps/salon-api/src/lib/permission.ts`
- `apps/salon-api/src/db/schema.ts`
- `apps/salon-api/src/routes/protected/*.ts`
- `apps/salon-api/src/routes/public-booking.ts`
- `apps/salon-api/src/services/*.ts`

Frontend core:
- `apps/salon-web/src/router.tsx`
- `apps/salon-web/src/lib/api.ts`
- `apps/salon-web/src/lib/auth-client.ts`
- `apps/salon-web/src/lib/query-client.ts`
- `apps/salon-web/src/components/layout/*.tsx`
- `apps/salon-web/src/pages/**/*.tsx`
- `apps/salon-web/src/services/*.ts`
