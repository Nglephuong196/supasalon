CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"actor_user_id" text,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"action" text NOT NULL,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"require_invoice_cancel_approval" boolean DEFAULT false NOT NULL,
	"require_invoice_refund_approval" boolean DEFAULT false NOT NULL,
	"invoice_refund_threshold" double precision DEFAULT 0 NOT NULL,
	"require_cash_out_approval" boolean DEFAULT false NOT NULL,
	"cash_out_threshold" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"action" text NOT NULL,
	"payload" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"request_reason" text,
	"review_reason" text,
	"requested_by_user_id" text,
	"reviewed_by_user_id" text,
	"reviewed_at" timestamp,
	"expires_at" timestamp,
	"executed_at" timestamp,
	"execution_result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"prevent_staff_overlap" boolean DEFAULT true NOT NULL,
	"buffer_minutes" integer DEFAULT 0 NOT NULL,
	"require_deposit" boolean DEFAULT false NOT NULL,
	"default_deposit_amount" double precision DEFAULT 0 NOT NULL,
	"cancellation_window_hours" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_reminder_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"booking_id" integer NOT NULL,
	"channel" text DEFAULT 'sms' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"sent_at" timestamp,
	"message" text,
	"error_message" text,
	"payload" jsonb,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_reminder_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"channels" jsonb DEFAULT '{"sms":true,"zalo":false,"email":false}'::jsonb NOT NULL,
	"hours_before" integer DEFAULT 24 NOT NULL,
	"template" text DEFAULT 'Xin chào {{customerName}}, lịch hẹn {{serviceName}} tại salon vào {{bookingTime}}. Hẹn gặp bạn!' NOT NULL,
	"updated_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"branch_id" integer,
	"date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"deposit_amount" double precision DEFAULT 0 NOT NULL,
	"deposit_paid" double precision DEFAULT 0 NOT NULL,
	"no_show_reason" text,
	"no_show_at" timestamp,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"guests" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"address" text,
	"phone" text,
	"manager_member_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"opened_by_user_id" text,
	"closed_by_user_id" text,
	"opening_balance" double precision DEFAULT 0 NOT NULL,
	"expected_closing_balance" double precision DEFAULT 0 NOT NULL,
	"actual_closing_balance" double precision,
	"discrepancy" double precision,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"cash_session_id" integer,
	"type" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_prepaid_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" integer NOT NULL,
	"plan_id" integer,
	"card_code" text NOT NULL,
	"unit" text DEFAULT 'vnd' NOT NULL,
	"purchase_price" double precision DEFAULT 0 NOT NULL,
	"initial_balance" double precision DEFAULT 0 NOT NULL,
	"remaining_balance" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"expired_at" timestamp,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_prepaid_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"card_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"invoice_id" integer,
	"type" text DEFAULT 'purchase' NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"balance_after" double precision DEFAULT 0 NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"gender" text,
	"location" text,
	"birthday" timestamp,
	"notes" text,
	"total_spent" double precision DEFAULT 0 NOT NULL,
	"membership_tier_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"inviterId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_item_staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_item_id" integer NOT NULL,
	"staff_id" text NOT NULL,
	"role" text DEFAULT 'technician' NOT NULL,
	"commission_value" double precision DEFAULT 0,
	"commission_type" text DEFAULT 'percent',
	"bonus" double precision DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"type" text NOT NULL,
	"reference_id" integer,
	"name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" double precision NOT NULL,
	"discount_value" double precision DEFAULT 0,
	"discount_type" text DEFAULT 'percent',
	"total" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"invoice_id" integer NOT NULL,
	"cash_session_id" integer,
	"kind" text DEFAULT 'payment' NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"reference_code" text,
	"notes" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" integer,
	"booking_id" integer,
	"branch_id" integer,
	"subtotal" double precision DEFAULT 0 NOT NULL,
	"discount_value" double precision DEFAULT 0,
	"discount_type" text DEFAULT 'percent',
	"total" double precision DEFAULT 0 NOT NULL,
	"amount_paid" double precision DEFAULT 0,
	"change" double precision DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"notes" text,
	"paid_at" timestamp,
	"cancel_reason" text,
	"cancelled_at" timestamp,
	"refund_reason" text,
	"refunded_at" timestamp,
	"is_open_in_tab" boolean DEFAULT true,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" integer NOT NULL,
	"member_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"permissions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"min_spending" double precision NOT NULL,
	"discount_percent" double precision DEFAULT 0 NOT NULL,
	"min_spending_to_maintain" double precision,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payroll_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" integer,
	"staff_id" text NOT NULL,
	"salary_type" text DEFAULT 'monthly' NOT NULL,
	"base_salary" double precision DEFAULT 0 NOT NULL,
	"default_allowance" double precision DEFAULT 0 NOT NULL,
	"default_deduction" double precision DEFAULT 0 NOT NULL,
	"default_advance" double precision DEFAULT 0 NOT NULL,
	"payment_method" text DEFAULT 'transfer' NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" integer,
	"name" text NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_by_user_id" text,
	"finalized_by_user_id" text,
	"paid_by_user_id" text,
	"finalized_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"cycle_id" integer NOT NULL,
	"staff_id" text NOT NULL,
	"branch_id" integer,
	"base_salary" double precision DEFAULT 0 NOT NULL,
	"commission_amount" double precision DEFAULT 0 NOT NULL,
	"bonus_amount" double precision DEFAULT 0 NOT NULL,
	"allowance_amount" double precision DEFAULT 0 NOT NULL,
	"deduction_amount" double precision DEFAULT 0 NOT NULL,
	"advance_amount" double precision DEFAULT 0 NOT NULL,
	"net_amount" double precision DEFAULT 0 NOT NULL,
	"payment_method" text DEFAULT 'transfer' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"paid_at" timestamp,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prepaid_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text DEFAULT 'vnd' NOT NULL,
	"sale_price" double precision DEFAULT 0 NOT NULL,
	"initial_balance" double precision DEFAULT 0 NOT NULL,
	"expiry_days" integer DEFAULT 90 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" double precision NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 10 NOT NULL,
	"sku" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" double precision NOT NULL,
	"duration" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"activeOrganizationId" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff_commission_payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"from_date" timestamp NOT NULL,
	"to_date" timestamp NOT NULL,
	"total_amount" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"notes" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_commission_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"item_type" text NOT NULL,
	"item_id" integer NOT NULL,
	"commission_type" text DEFAULT 'percent' NOT NULL,
	"commission_value" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_policies" ADD CONSTRAINT "approval_policies_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_policies" ADD CONSTRAINT "booking_policies_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reminder_logs" ADD CONSTRAINT "booking_reminder_logs_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reminder_logs" ADD CONSTRAINT "booking_reminder_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reminder_logs" ADD CONSTRAINT "booking_reminder_logs_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reminder_settings" ADD CONSTRAINT "booking_reminder_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_reminder_settings" ADD CONSTRAINT "booking_reminder_settings_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_manager_member_id_member_id_fk" FOREIGN KEY ("manager_member_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_opened_by_user_id_user_id_fk" FOREIGN KEY ("opened_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_closed_by_user_id_user_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_cash_session_id_cash_sessions_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_memberships" ADD CONSTRAINT "customer_memberships_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_cards" ADD CONSTRAINT "customer_prepaid_cards_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_cards" ADD CONSTRAINT "customer_prepaid_cards_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_cards" ADD CONSTRAINT "customer_prepaid_cards_plan_id_prepaid_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."prepaid_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_cards" ADD CONSTRAINT "customer_prepaid_cards_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_transactions" ADD CONSTRAINT "customer_prepaid_transactions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_transactions" ADD CONSTRAINT "customer_prepaid_transactions_card_id_customer_prepaid_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."customer_prepaid_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_transactions" ADD CONSTRAINT "customer_prepaid_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_transactions" ADD CONSTRAINT "customer_prepaid_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_prepaid_transactions" ADD CONSTRAINT "customer_prepaid_transactions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_membership_tier_id_membership_tiers_id_fk" FOREIGN KEY ("membership_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_user_id_fk" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_item_staff" ADD CONSTRAINT "invoice_item_staff_invoice_item_id_invoice_items_id_fk" FOREIGN KEY ("invoice_item_id") REFERENCES "public"."invoice_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_item_staff" ADD CONSTRAINT "invoice_item_staff_staff_id_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_transactions" ADD CONSTRAINT "invoice_payment_transactions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_transactions" ADD CONSTRAINT "invoice_payment_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_transactions" ADD CONSTRAINT "invoice_payment_transactions_cash_session_id_cash_sessions_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_transactions" ADD CONSTRAINT "invoice_payment_transactions_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_branches" ADD CONSTRAINT "member_branches_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_branches" ADD CONSTRAINT "member_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_branches" ADD CONSTRAINT "member_branches_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_permissions" ADD CONSTRAINT "member_permissions_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_tiers" ADD CONSTRAINT "membership_tiers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_configs" ADD CONSTRAINT "payroll_configs_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_configs" ADD CONSTRAINT "payroll_configs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_configs" ADD CONSTRAINT "payroll_configs_staff_id_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_cycles" ADD CONSTRAINT "payroll_cycles_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_cycles" ADD CONSTRAINT "payroll_cycles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_cycles" ADD CONSTRAINT "payroll_cycles_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_cycles" ADD CONSTRAINT "payroll_cycles_finalized_by_user_id_user_id_fk" FOREIGN KEY ("finalized_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_cycles" ADD CONSTRAINT "payroll_cycles_paid_by_user_id_user_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_cycle_id_payroll_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."payroll_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_staff_id_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prepaid_plans" ADD CONSTRAINT "prepaid_plans_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_categories" ADD CONSTRAINT "service_categories_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_commission_payouts" ADD CONSTRAINT "staff_commission_payouts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_commission_payouts" ADD CONSTRAINT "staff_commission_payouts_staff_id_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_commission_rules" ADD CONSTRAINT "staff_commission_rules_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_commission_rules" ADD CONSTRAINT "staff_commission_rules_staff_id_member_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "approval_policies_org_unique" ON "approval_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_policies_org_unique" ON "booking_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_reminder_settings_org_unique" ON "booking_reminder_settings" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_org_name_unique" ON "branches" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_org_code_unique" ON "branches" USING btree ("organization_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_prepaid_cards_org_code_unique" ON "customer_prepaid_cards" USING btree ("organization_id","card_code");--> statement-breakpoint
CREATE UNIQUE INDEX "member_branches_org_branch_member_unique" ON "member_branches" USING btree ("organization_id","branch_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_cycles_org_branch_period_unique" ON "payroll_cycles" USING btree ("organization_id","branch_id","from_date","to_date");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_items_cycle_staff_unique" ON "payroll_items" USING btree ("cycle_id","staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prepaid_plans_org_name_unique" ON "prepaid_plans" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_commission_rules_staff_item_unique" ON "staff_commission_rules" USING btree ("organization_id","staff_id","item_type","item_id");