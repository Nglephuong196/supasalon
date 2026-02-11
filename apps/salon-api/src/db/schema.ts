import { relations } from "drizzle-orm";
import { boolean, doublePrecision, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// ============================================================================
// TABLES
// ============================================================================

// User (better-auth)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Session (better-auth)
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  activeOrganizationId: text("activeOrganizationId"),
});

// Account (better-auth)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { mode: "date" }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { mode: "date" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Verification (better-auth)
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

// Organization (better-auth)
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .defaultNow(),
  metadata: text("metadata"),
});

// Member (better-auth)
export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Invitation (better-auth)
export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organization.id),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  inviterId: text("inviterId")
    .notNull()
    .references(() => user.id),
});

// Branches (multi-branch organization)
export const branches = pgTable(
  "branches",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    name: text("name").notNull(),
    code: text("code"),
    address: text("address"),
    phone: text("phone"),
    managerMemberId: text("manager_member_id").references(() => member.id),
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgNameUnique: uniqueIndex("branches_org_name_unique").on(table.organizationId, table.name),
    orgCodeUnique: uniqueIndex("branches_org_code_unique").on(table.organizationId, table.code),
  }),
);

// Member branch assignments
export const memberBranches = pgTable(
  "member_branches",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgBranchMemberUnique: uniqueIndex("member_branches_org_branch_member_unique").on(
      table.organizationId,
      table.branchId,
      table.memberId,
    ),
  }),
);

// Membership Tiers (configurable per organization)
export const membershipTiers = pgTable("membership_tiers", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  minSpending: doublePrecision("min_spending").notNull(),
  discountPercent: doublePrecision("discount_percent").notNull().default(0),
  minSpendingToMaintain: doublePrecision("min_spending_to_maintain"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  location: text("location"),
  birthday: timestamp("birthday", { mode: "date" }),
  notes: text("notes"),
  totalSpent: doublePrecision("total_spent").notNull().default(0),
  membershipTierId: integer("membership_tier_id").references(() => membershipTiers.id),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Service Categories
export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => serviceCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Product Categories
export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => productCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  sku: text("sku"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Bookings
// Bookings
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  branchId: integer("branch_id").references(() => branches.id),
  date: timestamp("date", { mode: "date" }).notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "checkin", "completed", "cancelled", "no_show"],
  })
    .notNull()
    .default("pending"),
  depositAmount: doublePrecision("deposit_amount").notNull().default(0),
  depositPaid: doublePrecision("deposit_paid").notNull().default(0),
  noShowReason: text("no_show_reason"),
  noShowAt: timestamp("no_show_at", { mode: "date" }),
  guestCount: integer("guest_count").notNull().default(1),
  notes: text("notes"),
  guests: jsonb("guests").notNull().$type<
    {
      services: {
        categoryId?: string | number;
        serviceId: number;
        memberId?: string;
        price?: number;
      }[];
    }[]
  >(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Booking Policies (per organization)
export const bookingPolicies = pgTable(
  "booking_policies",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    preventStaffOverlap: boolean("prevent_staff_overlap").notNull().default(true),
    bufferMinutes: integer("buffer_minutes").notNull().default(0),
    requireDeposit: boolean("require_deposit").notNull().default(false),
    defaultDepositAmount: doublePrecision("default_deposit_amount").notNull().default(0),
    cancellationWindowHours: integer("cancellation_window_hours").notNull().default(2),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgUnique: uniqueIndex("booking_policies_org_unique").on(table.organizationId),
  }),
);

// Booking Services - DEPRECATED / REMOVED from Active Schema
// Kept commented out for reference or potential migration utilities if needed
/*
export const bookingServices = pgTable("booking_services", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  serviceId: integer("service_id").notNull().references(() => services.id),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  memberId: text("member_id").references(() => member.id), // Staff assigned
  price: doublePrecision("price").notNull(), // Snapshot of price at booking time
});
*/

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  customerId: integer("customer_id").references(() => customers.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  branchId: integer("branch_id").references(() => branches.id),
  subtotal: doublePrecision("subtotal").notNull().default(0),
  discountValue: doublePrecision("discount_value").default(0),
  discountType: text("discount_type", { enum: ["percent", "fixed"] }).default("percent"),
  total: doublePrecision("total").notNull().default(0),
  amountPaid: doublePrecision("amount_paid").default(0),
  change: doublePrecision("change").default(0),
  status: text("status", {
    enum: ["pending", "paid", "cancelled", "refunded"],
  })
    .notNull()
    .default("pending"),
  paymentMethod: text("payment_method", {
    enum: ["cash", "card", "transfer", "mixed"],
  }),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { mode: "date" }),
  cancelReason: text("cancel_reason"),
  cancelledAt: timestamp("cancelled_at", { mode: "date" }),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at", { mode: "date" }),
  isOpenInTab: boolean("is_open_in_tab").default(true),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Cash Sessions (cashier shifts)
export const cashSessions = pgTable("cash_sessions", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  openedByUserId: text("opened_by_user_id").references(() => user.id),
  closedByUserId: text("closed_by_user_id").references(() => user.id),
  openingBalance: doublePrecision("opening_balance").notNull().default(0),
  expectedClosingBalance: doublePrecision("expected_closing_balance").notNull().default(0),
  actualClosingBalance: doublePrecision("actual_closing_balance"),
  discrepancy: doublePrecision("discrepancy"),
  status: text("status", { enum: ["open", "closed"] })
    .notNull()
    .default("open"),
  notes: text("notes"),
  openedAt: timestamp("opened_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  closedAt: timestamp("closed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Cash In/Out Transactions (outside invoices)
export const cashTransactions = pgTable("cash_transactions", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  cashSessionId: integer("cash_session_id").references(() => cashSessions.id),
  type: text("type", { enum: ["in", "out"] }).notNull(),
  category: text("category").notNull().default("other"),
  amount: doublePrecision("amount").notNull().default(0),
  notes: text("notes"),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Invoice Payment Transactions (split payments, pending transfer/card, refunds by method)
export const invoicePaymentTransactions = pgTable("invoice_payment_transactions", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  cashSessionId: integer("cash_session_id").references(() => cashSessions.id),
  kind: text("kind", { enum: ["payment", "refund"] })
    .notNull()
    .default("payment"),
  method: text("method", { enum: ["cash", "card", "transfer"] }).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "failed", "cancelled"] })
    .notNull()
    .default("confirmed"),
  amount: doublePrecision("amount").notNull().default(0),
  referenceCode: text("reference_code"),
  notes: text("notes"),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  confirmedAt: timestamp("confirmed_at", { mode: "date" }),
});

// Prepaid Plans (configuration templates)
export const prepaidPlans = pgTable(
  "prepaid_plans",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    name: text("name").notNull(),
    description: text("description"),
    unit: text("unit", { enum: ["vnd", "credit"] })
      .notNull()
      .default("vnd"),
    salePrice: doublePrecision("sale_price").notNull().default(0),
    initialBalance: doublePrecision("initial_balance").notNull().default(0),
    expiryDays: integer("expiry_days").notNull().default(90),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgNameUnique: uniqueIndex("prepaid_plans_org_name_unique").on(table.organizationId, table.name),
  }),
);

// Customer Prepaid Cards (wallet/card instances after purchase)
export const customerPrepaidCards = pgTable(
  "customer_prepaid_cards",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    planId: integer("plan_id").references(() => prepaidPlans.id),
    cardCode: text("card_code").notNull(),
    unit: text("unit", { enum: ["vnd", "credit"] })
      .notNull()
      .default("vnd"),
    purchasePrice: doublePrecision("purchase_price").notNull().default(0),
    initialBalance: doublePrecision("initial_balance").notNull().default(0),
    remainingBalance: doublePrecision("remaining_balance").notNull().default(0),
    status: text("status", { enum: ["active", "expired", "cancelled"] })
      .notNull()
      .default("active"),
    notes: text("notes"),
    purchasedAt: timestamp("purchased_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    expiredAt: timestamp("expired_at", { mode: "date" }),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgCardCodeUnique: uniqueIndex("customer_prepaid_cards_org_code_unique").on(
      table.organizationId,
      table.cardCode,
    ),
  }),
);

// Prepaid Card Transactions (purchase/topup/consume/refund)
export const customerPrepaidTransactions = pgTable("customer_prepaid_transactions", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  cardId: integer("card_id")
    .notNull()
    .references(() => customerPrepaidCards.id, { onDelete: "cascade" }),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  type: text("type", { enum: ["purchase", "consume", "topup", "adjust", "expire", "refund"] })
    .notNull()
    .default("purchase"),
  amount: doublePrecision("amount").notNull().default(0),
  balanceAfter: doublePrecision("balance_after").notNull().default(0),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Booking Reminder Settings (per organization)
export const bookingReminderSettings = pgTable(
  "booking_reminder_settings",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    enabled: boolean("enabled").notNull().default(false),
    channels: jsonb("channels")
      .notNull()
      .$type<{ sms: boolean; zalo: boolean; email: boolean }>()
      .default({
        sms: true,
        zalo: false,
        email: false,
      }),
    hoursBefore: integer("hours_before").notNull().default(24),
    template: text("template")
      .notNull()
      .default(
        "Xin chào {{customerName}}, lịch hẹn {{serviceName}} tại salon vào {{bookingTime}}. Hẹn gặp bạn!",
      ),
    updatedByUserId: text("updated_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgUnique: uniqueIndex("booking_reminder_settings_org_unique").on(table.organizationId),
  }),
);

// Booking Reminder Logs (manual/automatic send records)
export const bookingReminderLogs = pgTable("booking_reminder_logs", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["sms", "zalo", "email"] })
    .notNull()
    .default("sms"),
  status: text("status", { enum: ["queued", "sent", "failed", "cancelled"] })
    .notNull()
    .default("queued"),
  scheduledAt: timestamp("scheduled_at", { mode: "date" }).notNull(),
  sentAt: timestamp("sent_at", { mode: "date" }),
  message: text("message"),
  errorMessage: text("error_message"),
  payload: jsonb("payload").$type<Record<string, unknown> | null>(),
  createdByUserId: text("created_by_user_id").references(() => user.id),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Approval Policies (controls sensitive actions)
export const approvalPolicies = pgTable(
  "approval_policies",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    requireInvoiceCancelApproval: boolean("require_invoice_cancel_approval")
      .notNull()
      .default(false),
    requireInvoiceRefundApproval: boolean("require_invoice_refund_approval")
      .notNull()
      .default(false),
    invoiceRefundThreshold: doublePrecision("invoice_refund_threshold")
      .notNull()
      .default(0),
    requireCashOutApproval: boolean("require_cash_out_approval")
      .notNull()
      .default(false),
    cashOutThreshold: doublePrecision("cash_out_threshold")
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgUnique: uniqueIndex("approval_policies_org_unique").on(table.organizationId),
  }),
);

// Approval Requests (pending/approved/rejected actions)
export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  entityType: text("entity_type", {
    enum: ["invoice", "cash_transaction", "booking", "commission_payout", "prepaid_card"],
  }).notNull(),
  entityId: integer("entity_id"),
  action: text("action").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown> | null>(),
  status: text("status", { enum: ["pending", "approved", "rejected", "cancelled"] })
    .notNull()
    .default("pending"),
  requestReason: text("request_reason"),
  reviewReason: text("review_reason"),
  requestedByUserId: text("requested_by_user_id").references(() => user.id),
  reviewedByUserId: text("reviewed_by_user_id").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  executedAt: timestamp("executed_at", { mode: "date" }),
  executionResult: jsonb("execution_result").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Payroll Configs (default payroll setup per staff)
export const payrollConfigs = pgTable("payroll_configs", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  branchId: integer("branch_id").references(() => branches.id),
  staffId: text("staff_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  salaryType: text("salary_type", { enum: ["monthly", "daily", "hourly"] })
    .notNull()
    .default("monthly"),
  baseSalary: doublePrecision("base_salary").notNull().default(0),
  defaultAllowance: doublePrecision("default_allowance").notNull().default(0),
  defaultDeduction: doublePrecision("default_deduction").notNull().default(0),
  defaultAdvance: doublePrecision("default_advance").notNull().default(0),
  paymentMethod: text("payment_method", { enum: ["cash", "transfer", "card"] })
    .notNull()
    .default("transfer"),
  effectiveFrom: timestamp("effective_from", { mode: "date" })
    .notNull()
    .defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Payroll Cycles
export const payrollCycles = pgTable(
  "payroll_cycles",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    branchId: integer("branch_id").references(() => branches.id),
    name: text("name").notNull(),
    fromDate: timestamp("from_date", { mode: "date" }).notNull(),
    toDate: timestamp("to_date", { mode: "date" }).notNull(),
    status: text("status", { enum: ["draft", "finalized", "paid"] })
      .notNull()
      .default("draft"),
    notes: text("notes"),
    createdByUserId: text("created_by_user_id").references(() => user.id),
    finalizedByUserId: text("finalized_by_user_id").references(() => user.id),
    paidByUserId: text("paid_by_user_id").references(() => user.id),
    finalizedAt: timestamp("finalized_at", { mode: "date" }),
    paidAt: timestamp("paid_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgPeriodUnique: uniqueIndex("payroll_cycles_org_branch_period_unique").on(
      table.organizationId,
      table.branchId,
      table.fromDate,
      table.toDate,
    ),
  }),
);

// Payroll Items (per staff in a cycle)
export const payrollItems = pgTable(
  "payroll_items",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => payrollCycles.id, { onDelete: "cascade" }),
    staffId: text("staff_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    branchId: integer("branch_id").references(() => branches.id),
    baseSalary: doublePrecision("base_salary").notNull().default(0),
    commissionAmount: doublePrecision("commission_amount").notNull().default(0),
    bonusAmount: doublePrecision("bonus_amount").notNull().default(0),
    allowanceAmount: doublePrecision("allowance_amount").notNull().default(0),
    deductionAmount: doublePrecision("deduction_amount").notNull().default(0),
    advanceAmount: doublePrecision("advance_amount").notNull().default(0),
    netAmount: doublePrecision("net_amount").notNull().default(0),
    paymentMethod: text("payment_method", { enum: ["cash", "transfer", "card"] })
      .notNull()
      .default("transfer"),
    status: text("status", { enum: ["draft", "paid"] })
      .notNull()
      .default("draft"),
    paidAt: timestamp("paid_at", { mode: "date" }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    cycleStaffUnique: uniqueIndex("payroll_items_cycle_staff_unique").on(table.cycleId, table.staffId),
  }),
);

// Invoice Items
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["service", "product", "package", "other"],
  }).notNull(),
  referenceId: integer("reference_id"),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: doublePrecision("unit_price").notNull(),
  discountValue: doublePrecision("discount_value").default(0),
  discountType: text("discount_type", { enum: ["percent", "fixed"] }).default("percent"),
  total: doublePrecision("total").notNull(),
});

// Invoice Item Staff (Commissions)
export const invoiceItemStaff = pgTable("invoice_item_staff", {
  id: serial("id").primaryKey(),
  invoiceItemId: integer("invoice_item_id")
    .notNull()
    .references(() => invoiceItems.id, { onDelete: "cascade" }),
  staffId: text("staff_id")
    .notNull()
    .references(() => member.id),
  role: text("role", { enum: ["technician", "seller"] })
    .notNull()
    .default("technician"),
  commissionValue: doublePrecision("commission_value").default(0),
  commissionType: text("commission_type", {
    enum: ["percent", "fixed"],
  }).default("percent"),
  bonus: doublePrecision("bonus").default(0),
});

// Staff Commission Rules (config per staff and product/service)
export const staffCommissionRules = pgTable(
  "staff_commission_rules",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id),
    staffId: text("staff_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    itemType: text("item_type", { enum: ["service", "product"] }).notNull(),
    itemId: integer("item_id").notNull(),
    commissionType: text("commission_type", { enum: ["percent", "fixed"] })
      .notNull()
      .default("percent"),
    commissionValue: doublePrecision("commission_value").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    staffItemUnique: uniqueIndex("staff_commission_rules_staff_item_unique").on(
      table.organizationId,
      table.staffId,
      table.itemType,
      table.itemId,
    ),
  }),
);

// Staff Commission Payouts
export const staffCommissionPayouts = pgTable("staff_commission_payouts", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  staffId: text("staff_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  fromDate: timestamp("from_date", { mode: "date" }).notNull(),
  toDate: timestamp("to_date", { mode: "date" }).notNull(),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  status: text("status", { enum: ["draft", "paid"] })
    .notNull()
    .default("draft"),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Activity Logs (audit trail for critical actions)
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),
  actorUserId: text("actor_user_id").references(() => user.id),
  entityType: text("entity_type", {
    enum: [
      "invoice",
      "booking",
      "branch",
      "commission_payout",
      "payroll_cycle",
      "payroll_item",
      "cash_session",
      "cash_transaction",
      "invoice_payment",
      "booking_reminder",
      "prepaid_card",
      "approval_request",
    ],
  }).notNull(),
  entityId: integer("entity_id"),
  action: text("action").notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Customer Memberships
export const customerMemberships = pgTable("customer_memberships", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  type: text("type").notNull(),
  status: text("status", { enum: ["active", "expired", "cancelled"] })
    .notNull()
    .default("active"),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

// Member Permissions
export const memberPermissions = pgTable("member_permissions", {
  id: serial("id").primaryKey(),
  memberId: text("member_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  permissions: jsonb("permissions").notNull().$type<Record<string, string[]>>(),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

export const table = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  branches,
  memberBranches,
  membershipTiers,
  customers,
  serviceCategories,
  services,
  productCategories,
  products,
  bookings,
  bookingPolicies,
  invoices,
  cashSessions,
  cashTransactions,
  invoicePaymentTransactions,
  prepaidPlans,
  customerPrepaidCards,
  customerPrepaidTransactions,
  bookingReminderSettings,
  bookingReminderLogs,
  approvalPolicies,
  approvalRequests,
  payrollConfigs,
  payrollCycles,
  payrollItems,
  invoiceItems,
  invoiceItemStaff,
  staffCommissionRules,
  staffCommissionPayouts,
  activityLogs,
  customerMemberships,
  memberPermissions,
} as const;

export type Table = typeof table;

// ============================================================================
// RELATIONS (defined after all tables)
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(member),
  openedCashSessions: many(cashSessions, {
    relationName: "cash_session_opened_by_user",
  }),
  closedCashSessions: many(cashSessions, {
    relationName: "cash_session_closed_by_user",
  }),
  cashTransactions: many(cashTransactions),
  invoicePaymentTransactions: many(invoicePaymentTransactions),
  prepaidCards: many(customerPrepaidCards),
  prepaidTransactions: many(customerPrepaidTransactions),
  bookingReminderSettings: many(bookingReminderSettings),
  bookingReminderLogs: many(bookingReminderLogs),
  requestedApprovalRequests: many(approvalRequests, {
    relationName: "approval_request_requested_by_user",
  }),
  reviewedApprovalRequests: many(approvalRequests, {
    relationName: "approval_request_reviewed_by_user",
  }),
  createdPayrollCycles: many(payrollCycles, {
    relationName: "payroll_cycle_created_by_user",
  }),
  finalizedPayrollCycles: many(payrollCycles, {
    relationName: "payroll_cycle_finalized_by_user",
  }),
  paidPayrollCycles: many(payrollCycles, {
    relationName: "payroll_cycle_paid_by_user",
  }),
  activityLogs: many(activityLogs),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  branches: many(branches),
  memberBranches: many(memberBranches),
  customers: many(customers),
  serviceCategories: many(serviceCategories),
  bookings: many(bookings),
  bookingPolicies: many(bookingPolicies),
  membershipTiers: many(membershipTiers),
  invoices: many(invoices),
  cashSessions: many(cashSessions),
  cashTransactions: many(cashTransactions),
  invoicePaymentTransactions: many(invoicePaymentTransactions),
  prepaidPlans: many(prepaidPlans),
  prepaidCards: many(customerPrepaidCards),
  prepaidTransactions: many(customerPrepaidTransactions),
  bookingReminderSettings: many(bookingReminderSettings),
  bookingReminderLogs: many(bookingReminderLogs),
  approvalPolicies: many(approvalPolicies),
  approvalRequests: many(approvalRequests),
  payrollConfigs: many(payrollConfigs),
  payrollCycles: many(payrollCycles),
  payrollItems: many(payrollItems),
  staffCommissionRules: many(staffCommissionRules),
  staffCommissionPayouts: many(staffCommissionPayouts),
  activityLogs: many(activityLogs),
}));

export const membershipTiersRelations = relations(membershipTiers, ({ one, many }) => ({
  organization: one(organization, {
    fields: [membershipTiers.organizationId],
    references: [organization.id],
  }),
  customers: many(customers),
}));

export const memberRelations = relations(member, ({ one, many }) => ({
  user: one(user, { fields: [member.userId], references: [user.id] }),
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  permissions: many(memberPermissions),
  managedBranches: many(branches, {
    relationName: "branch_manager_member",
  }),
  branchAssignments: many(memberBranches),
  payrollConfigs: many(payrollConfigs),
  payrollItems: many(payrollItems),
  commissionRules: many(staffCommissionRules),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  organization: one(organization, {
    fields: [branches.organizationId],
    references: [organization.id],
  }),
  manager: one(member, {
    fields: [branches.managerMemberId],
    references: [member.id],
    relationName: "branch_manager_member",
  }),
  memberAssignments: many(memberBranches),
  bookings: many(bookings),
  invoices: many(invoices),
  payrollConfigs: many(payrollConfigs),
  payrollCycles: many(payrollCycles),
  payrollItems: many(payrollItems),
}));

export const memberBranchesRelations = relations(memberBranches, ({ one }) => ({
  organization: one(organization, {
    fields: [memberBranches.organizationId],
    references: [organization.id],
  }),
  branch: one(branches, {
    fields: [memberBranches.branchId],
    references: [branches.id],
  }),
  member: one(member, {
    fields: [memberBranches.memberId],
    references: [member.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organization, {
    fields: [customers.organizationId],
    references: [organization.id],
  }),
  membershipTier: one(membershipTiers, {
    fields: [customers.membershipTierId],
    references: [membershipTiers.id],
  }),
  bookings: many(bookings),
  memberships: many(customerMemberships),
  prepaidCards: many(customerPrepaidCards),
  prepaidTransactions: many(customerPrepaidTransactions),
}));

export const customerMembershipsRelations = relations(customerMemberships, ({ one }) => ({
  customer: one(customers, {
    fields: [customerMemberships.customerId],
    references: [customers.id],
  }),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ one, many }) => ({
  organization: one(organization, {
    fields: [serviceCategories.organizationId],
    references: [organization.id],
  }),
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  // bookingServices: many(bookingServices), // Deprecated/Removed
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  organization: one(organization, {
    fields: [productCategories.organizationId],
    references: [organization.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  organization: one(organization, {
    fields: [bookings.organizationId],
    references: [organization.id],
  }),
  branch: one(branches, {
    fields: [bookings.branchId],
    references: [branches.id],
  }),
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  // bookingServices: many(bookingServices), // Deprecated
  invoice: one(invoices),
  reminderLogs: many(bookingReminderLogs),
}));

export const bookingPoliciesRelations = relations(bookingPolicies, ({ one }) => ({
  organization: one(organization, {
    fields: [bookingPolicies.organizationId],
    references: [organization.id],
  }),
}));

/*
export const bookingServicesRelations = relations(bookingServices, ({ one }) => ({
  booking: one(bookings, { fields: [bookingServices.bookingId], references: [bookings.id] }),
  service: one(services, { fields: [bookingServices.serviceId], references: [services.id] }),
  category: one(serviceCategories, { fields: [bookingServices.categoryId], references: [serviceCategories.id] }),
  member: one(member, { fields: [bookingServices.memberId], references: [member.id] }),
}));
*/

// Invoices Relations
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organization, {
    fields: [invoices.organizationId],
    references: [organization.id],
  }),
  branch: one(branches, {
    fields: [invoices.branchId],
    references: [branches.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  booking: one(bookings, {
    fields: [invoices.bookingId],
    references: [bookings.id],
  }),
  payments: many(invoicePaymentTransactions),
  prepaidTransactions: many(customerPrepaidTransactions),
  items: many(invoiceItems),
}));

export const cashSessionsRelations = relations(cashSessions, ({ one, many }) => ({
  organization: one(organization, {
    fields: [cashSessions.organizationId],
    references: [organization.id],
  }),
  openedBy: one(user, {
    fields: [cashSessions.openedByUserId],
    references: [user.id],
    relationName: "cash_session_opened_by_user",
  }),
  closedBy: one(user, {
    fields: [cashSessions.closedByUserId],
    references: [user.id],
    relationName: "cash_session_closed_by_user",
  }),
  transactions: many(cashTransactions),
  invoicePayments: many(invoicePaymentTransactions),
}));

export const cashTransactionsRelations = relations(cashTransactions, ({ one }) => ({
  organization: one(organization, {
    fields: [cashTransactions.organizationId],
    references: [organization.id],
  }),
  cashSession: one(cashSessions, {
    fields: [cashTransactions.cashSessionId],
    references: [cashSessions.id],
  }),
  createdBy: one(user, {
    fields: [cashTransactions.createdByUserId],
    references: [user.id],
  }),
}));

export const invoicePaymentTransactionsRelations = relations(
  invoicePaymentTransactions,
  ({ one }) => ({
    organization: one(organization, {
      fields: [invoicePaymentTransactions.organizationId],
      references: [organization.id],
    }),
    invoice: one(invoices, {
      fields: [invoicePaymentTransactions.invoiceId],
      references: [invoices.id],
    }),
    cashSession: one(cashSessions, {
      fields: [invoicePaymentTransactions.cashSessionId],
      references: [cashSessions.id],
    }),
    createdBy: one(user, {
      fields: [invoicePaymentTransactions.createdByUserId],
      references: [user.id],
    }),
  }),
);

export const prepaidPlansRelations = relations(prepaidPlans, ({ one, many }) => ({
  organization: one(organization, {
    fields: [prepaidPlans.organizationId],
    references: [organization.id],
  }),
  cards: many(customerPrepaidCards),
}));

export const customerPrepaidCardsRelations = relations(customerPrepaidCards, ({ one, many }) => ({
  organization: one(organization, {
    fields: [customerPrepaidCards.organizationId],
    references: [organization.id],
  }),
  customer: one(customers, {
    fields: [customerPrepaidCards.customerId],
    references: [customers.id],
  }),
  plan: one(prepaidPlans, {
    fields: [customerPrepaidCards.planId],
    references: [prepaidPlans.id],
  }),
  createdBy: one(user, {
    fields: [customerPrepaidCards.createdByUserId],
    references: [user.id],
  }),
  transactions: many(customerPrepaidTransactions),
}));

export const customerPrepaidTransactionsRelations = relations(
  customerPrepaidTransactions,
  ({ one }) => ({
    organization: one(organization, {
      fields: [customerPrepaidTransactions.organizationId],
      references: [organization.id],
    }),
    card: one(customerPrepaidCards, {
      fields: [customerPrepaidTransactions.cardId],
      references: [customerPrepaidCards.id],
    }),
    customer: one(customers, {
      fields: [customerPrepaidTransactions.customerId],
      references: [customers.id],
    }),
    invoice: one(invoices, {
      fields: [customerPrepaidTransactions.invoiceId],
      references: [invoices.id],
    }),
    createdBy: one(user, {
      fields: [customerPrepaidTransactions.createdByUserId],
      references: [user.id],
    }),
  }),
);

export const bookingReminderSettingsRelations = relations(bookingReminderSettings, ({ one }) => ({
  organization: one(organization, {
    fields: [bookingReminderSettings.organizationId],
    references: [organization.id],
  }),
  updatedBy: one(user, {
    fields: [bookingReminderSettings.updatedByUserId],
    references: [user.id],
  }),
}));

export const bookingReminderLogsRelations = relations(bookingReminderLogs, ({ one }) => ({
  organization: one(organization, {
    fields: [bookingReminderLogs.organizationId],
    references: [organization.id],
  }),
  booking: one(bookings, {
    fields: [bookingReminderLogs.bookingId],
    references: [bookings.id],
  }),
  createdBy: one(user, {
    fields: [bookingReminderLogs.createdByUserId],
    references: [user.id],
  }),
}));

export const approvalPoliciesRelations = relations(approvalPolicies, ({ one }) => ({
  organization: one(organization, {
    fields: [approvalPolicies.organizationId],
    references: [organization.id],
  }),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one }) => ({
  organization: one(organization, {
    fields: [approvalRequests.organizationId],
    references: [organization.id],
  }),
  requestedBy: one(user, {
    fields: [approvalRequests.requestedByUserId],
    references: [user.id],
    relationName: "approval_request_requested_by_user",
  }),
  reviewedBy: one(user, {
    fields: [approvalRequests.reviewedByUserId],
    references: [user.id],
    relationName: "approval_request_reviewed_by_user",
  }),
}));

export const payrollConfigsRelations = relations(payrollConfigs, ({ one }) => ({
  organization: one(organization, {
    fields: [payrollConfigs.organizationId],
    references: [organization.id],
  }),
  branch: one(branches, {
    fields: [payrollConfigs.branchId],
    references: [branches.id],
  }),
  staff: one(member, {
    fields: [payrollConfigs.staffId],
    references: [member.id],
  }),
}));

export const payrollCyclesRelations = relations(payrollCycles, ({ one, many }) => ({
  organization: one(organization, {
    fields: [payrollCycles.organizationId],
    references: [organization.id],
  }),
  branch: one(branches, {
    fields: [payrollCycles.branchId],
    references: [branches.id],
  }),
  createdBy: one(user, {
    fields: [payrollCycles.createdByUserId],
    references: [user.id],
    relationName: "payroll_cycle_created_by_user",
  }),
  finalizedBy: one(user, {
    fields: [payrollCycles.finalizedByUserId],
    references: [user.id],
    relationName: "payroll_cycle_finalized_by_user",
  }),
  paidBy: one(user, {
    fields: [payrollCycles.paidByUserId],
    references: [user.id],
    relationName: "payroll_cycle_paid_by_user",
  }),
  items: many(payrollItems),
}));

export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  organization: one(organization, {
    fields: [payrollItems.organizationId],
    references: [organization.id],
  }),
  cycle: one(payrollCycles, {
    fields: [payrollItems.cycleId],
    references: [payrollCycles.id],
  }),
  staff: one(member, {
    fields: [payrollItems.staffId],
    references: [member.id],
  }),
  branch: one(branches, {
    fields: [payrollItems.branchId],
    references: [branches.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  staffCommissions: many(invoiceItemStaff),
}));

export const invoiceItemStaffRelations = relations(invoiceItemStaff, ({ one }) => ({
  item: one(invoiceItems, {
    fields: [invoiceItemStaff.invoiceItemId],
    references: [invoiceItems.id],
  }),
  staff: one(member, {
    fields: [invoiceItemStaff.staffId],
    references: [member.id],
  }),
}));

export const staffCommissionRulesRelations = relations(staffCommissionRules, ({ one }) => ({
  organization: one(organization, {
    fields: [staffCommissionRules.organizationId],
    references: [organization.id],
  }),
  staff: one(member, {
    fields: [staffCommissionRules.staffId],
    references: [member.id],
  }),
}));

export const staffCommissionPayoutsRelations = relations(staffCommissionPayouts, ({ one }) => ({
  organization: one(organization, {
    fields: [staffCommissionPayouts.organizationId],
    references: [organization.id],
  }),
  staff: one(member, {
    fields: [staffCommissionPayouts.staffId],
    references: [member.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  organization: one(organization, {
    fields: [activityLogs.organizationId],
    references: [organization.id],
  }),
  actor: one(user, {
    fields: [activityLogs.actorUserId],
    references: [user.id],
  }),
}));

export const memberPermissionsRelations = relations(memberPermissions, ({ one }) => ({
  member: one(member, {
    fields: [memberPermissions.memberId],
    references: [member.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type MemberBranch = typeof memberBranches.$inferSelect;
export type NewMemberBranch = typeof memberBranches.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type NewServiceCategory = typeof serviceCategories.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type BookingPolicy = typeof bookingPolicies.$inferSelect;
export type NewBookingPolicy = typeof bookingPolicies.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type CashSession = typeof cashSessions.$inferSelect;
export type NewCashSession = typeof cashSessions.$inferInsert;

export type CashTransaction = typeof cashTransactions.$inferSelect;
export type NewCashTransaction = typeof cashTransactions.$inferInsert;

export type InvoicePaymentTransaction = typeof invoicePaymentTransactions.$inferSelect;
export type NewInvoicePaymentTransaction = typeof invoicePaymentTransactions.$inferInsert;

export type PrepaidPlan = typeof prepaidPlans.$inferSelect;
export type NewPrepaidPlan = typeof prepaidPlans.$inferInsert;

export type CustomerPrepaidCard = typeof customerPrepaidCards.$inferSelect;
export type NewCustomerPrepaidCard = typeof customerPrepaidCards.$inferInsert;

export type CustomerPrepaidTransaction = typeof customerPrepaidTransactions.$inferSelect;
export type NewCustomerPrepaidTransaction = typeof customerPrepaidTransactions.$inferInsert;

export type BookingReminderSetting = typeof bookingReminderSettings.$inferSelect;
export type NewBookingReminderSetting = typeof bookingReminderSettings.$inferInsert;

export type BookingReminderLog = typeof bookingReminderLogs.$inferSelect;
export type NewBookingReminderLog = typeof bookingReminderLogs.$inferInsert;

export type ApprovalPolicy = typeof approvalPolicies.$inferSelect;
export type NewApprovalPolicy = typeof approvalPolicies.$inferInsert;

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type NewApprovalRequest = typeof approvalRequests.$inferInsert;

export type PayrollConfig = typeof payrollConfigs.$inferSelect;
export type NewPayrollConfig = typeof payrollConfigs.$inferInsert;

export type PayrollCycle = typeof payrollCycles.$inferSelect;
export type NewPayrollCycle = typeof payrollCycles.$inferInsert;

export type PayrollItem = typeof payrollItems.$inferSelect;
export type NewPayrollItem = typeof payrollItems.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type InvoiceItemStaff = typeof invoiceItemStaff.$inferSelect;
export type NewInvoiceItemStaff = typeof invoiceItemStaff.$inferInsert;

export type StaffCommissionRule = typeof staffCommissionRules.$inferSelect;
export type NewStaffCommissionRule = typeof staffCommissionRules.$inferInsert;
export type StaffCommissionPayout = typeof staffCommissionPayouts.$inferSelect;
export type NewStaffCommissionPayout = typeof staffCommissionPayouts.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;

export type CustomerMembership = typeof customerMemberships.$inferSelect;
export type NewCustomerMembership = typeof customerMemberships.$inferInsert;

export type MembershipTier = typeof membershipTiers.$inferSelect;
export type NewMembershipTier = typeof membershipTiers.$inferInsert;

export type MemberPermission = typeof memberPermissions.$inferSelect;
export type NewMemberPermission = typeof memberPermissions.$inferInsert;

// export type BookingService = typeof bookingServices.$inferSelect;
// export type NewBookingService = typeof bookingServices.$inferInsert;
