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
  date: timestamp("date", { mode: "date" }).notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "checkin", "completed", "cancelled"],
  })
    .notNull()
    .default("pending"),
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
    enum: ["cash", "card", "transfer"],
  }),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { mode: "date" }),
  isOpenInTab: boolean("is_open_in_tab").default(true),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" })
    .notNull()
    .defaultNow(),
});

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
  membershipTiers,
  customers,
  serviceCategories,
  services,
  productCategories,
  products,
  bookings,
  invoices,
  invoiceItems,
  invoiceItemStaff,
  staffCommissionRules,
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
  customers: many(customers),
  serviceCategories: many(serviceCategories),
  bookings: many(bookings),
  membershipTiers: many(membershipTiers),
  staffCommissionRules: many(staffCommissionRules),
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
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  // bookingServices: many(bookingServices), // Deprecated
  invoice: one(invoices),
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
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  booking: one(bookings, {
    fields: [invoices.bookingId],
    references: [bookings.id],
  }),
  items: many(invoiceItems),
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

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type InvoiceItemStaff = typeof invoiceItemStaff.$inferSelect;
export type NewInvoiceItemStaff = typeof invoiceItemStaff.$inferInsert;

export type StaffCommissionRule = typeof staffCommissionRules.$inferSelect;
export type NewStaffCommissionRule = typeof staffCommissionRules.$inferInsert;

export type CustomerMembership = typeof customerMemberships.$inferSelect;
export type NewCustomerMembership = typeof customerMemberships.$inferInsert;

export type MembershipTier = typeof membershipTiers.$inferSelect;
export type NewMembershipTier = typeof membershipTiers.$inferInsert;

export type MemberPermission = typeof memberPermissions.$inferSelect;
export type NewMemberPermission = typeof memberPermissions.$inferInsert;

// export type BookingService = typeof bookingServices.$inferSelect;
// export type NewBookingService = typeof bookingServices.$inferInsert;
