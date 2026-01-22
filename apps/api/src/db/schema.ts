import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================================
// TABLES
// ============================================================================

// User (better-auth)
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Session (better-auth)
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
  activeOrganizationId: text("activeOrganizationId"),
});

// Account (better-auth)
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Verification (better-auth)
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Organization (better-auth)
export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  metadata: text("metadata"),
});

// Member (better-auth)
export const member = sqliteTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id),
  userId: text("userId").notNull().references(() => user.id),
  role: text("role").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Invitation (better-auth)
export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organizationId").notNull().references(() => organization.id),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  inviterId: text("inviterId").notNull().references(() => user.id),
});


// Membership Tiers (configurable per organization)
export const membershipTiers = sqliteTable("membership_tiers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: text("organization_id").notNull().references(() => organization.id),
  name: text("name").notNull(),
  minSpending: real("min_spending").notNull(),
  discountPercent: real("discount_percent").notNull().default(0),
  minSpendingToMaintain: real("min_spending_to_maintain"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Customers
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: text("organization_id").notNull().references(() => organization.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  location: text("location"),
  birthday: integer("birthday", { mode: "timestamp" }),
  notes: text("notes"),
  totalSpent: real("total_spent").notNull().default(0),
  membershipTierId: integer("membership_tier_id").references(() => membershipTiers.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Service Categories
export const serviceCategories = sqliteTable("service_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: text("organization_id").notNull().references(() => organization.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Services
export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  duration: integer("duration").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Product Categories
export const productCategories = sqliteTable("product_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: text("organization_id").notNull().references(() => organization.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Products
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull().references(() => productCategories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  sku: text("sku"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Bookings
// Bookings
export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: text("organization_id").notNull().references(() => organization.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "checkin", "completed", "cancelled"] }).notNull().default("pending"),
  guestCount: integer("guest_count").notNull().default(1),
  notes: text("notes"),
  guests: text("guests", { mode: "json" }).notNull().$type<{
    services: {
      categoryId?: string | number;
      serviceId: number;
      memberId?: string;
      price?: number;
    }[]
  }[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Booking Services - DEPRECATED / REMOVED from Active Schema
// Kept commented out for reference or potential migration utilities if needed
/*
export const bookingServices = sqliteTable("booking_services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingId: integer("booking_id").notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  serviceId: integer("service_id").notNull().references(() => services.id),
  categoryId: integer("category_id").notNull().references(() => serviceCategories.id),
  memberId: text("member_id").references(() => member.id), // Staff assigned
  price: real("price").notNull(), // Snapshot of price at booking time
});
*/

// Invoices
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingId: integer("booking_id").notNull().references(() => bookings.id).unique(),
  amount: real("amount").notNull(),
  status: text("status", { enum: ["pending", "paid", "cancelled"] }).notNull().default("pending"),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Customer Memberships
export const customerMemberships = sqliteTable("customer_memberships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  type: text("type").notNull(),
  status: text("status", { enum: ["active", "expired", "cancelled"] }).notNull().default("active"),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Member Permissions
export const memberPermissions = sqliteTable("member_permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: text("member_id").notNull().references(() => member.id, { onDelete: 'cascade' }),
  permissions: text("permissions", { mode: "json" }).notNull().$type<Record<string, string[]>>(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

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
}));

export const membershipTiersRelations = relations(membershipTiers, ({ one, many }) => ({
  organization: one(organization, { fields: [membershipTiers.organizationId], references: [organization.id] }),
  customers: many(customers),
}));

export const memberRelations = relations(member, ({ one, many }) => ({
  user: one(user, { fields: [member.userId], references: [user.id] }),
  organization: one(organization, { fields: [member.organizationId], references: [organization.id] }),
  permissions: many(memberPermissions),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, { fields: [invitation.organizationId], references: [organization.id] }),
  inviter: one(user, { fields: [invitation.inviterId], references: [user.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organization, { fields: [customers.organizationId], references: [organization.id] }),
  membershipTier: one(membershipTiers, { fields: [customers.membershipTierId], references: [membershipTiers.id] }),
  bookings: many(bookings),
  memberships: many(customerMemberships),
}));

export const customerMembershipsRelations = relations(customerMemberships, ({ one }) => ({
  customer: one(customers, { fields: [customerMemberships.customerId], references: [customers.id] }),
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ one, many }) => ({
  organization: one(organization, { fields: [serviceCategories.organizationId], references: [organization.id] }),
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, { fields: [services.categoryId], references: [serviceCategories.id] }),
  // bookingServices: many(bookingServices), // Deprecated/Removed
}));

export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  organization: one(organization, { fields: [productCategories.organizationId], references: [organization.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(productCategories, { fields: [products.categoryId], references: [productCategories.id] }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  organization: one(organization, { fields: [bookings.organizationId], references: [organization.id] }),
  customer: one(customers, { fields: [bookings.customerId], references: [customers.id] }),
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

export const invoicesRelations = relations(invoices, ({ one }) => ({
  booking: one(bookings, { fields: [invoices.bookingId], references: [bookings.id] }),
}));

export const memberPermissionsRelations = relations(memberPermissions, ({ one }) => ({
  member: one(member, { fields: [memberPermissions.memberId], references: [member.id] }),
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

export type CustomerMembership = typeof customerMemberships.$inferSelect;
export type NewCustomerMembership = typeof customerMemberships.$inferInsert;

export type MembershipTier = typeof membershipTiers.$inferSelect;
export type NewMembershipTier = typeof membershipTiers.$inferInsert;

export type MemberPermission = typeof memberPermissions.$inferSelect;
export type NewMemberPermission = typeof memberPermissions.$inferInsert;

// export type BookingService = typeof bookingServices.$inferSelect;
// export type NewBookingService = typeof bookingServices.$inferInsert;
