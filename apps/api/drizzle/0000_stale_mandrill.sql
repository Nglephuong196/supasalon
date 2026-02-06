CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` integer NOT NULL,
	`date` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`guest_count` integer DEFAULT 1 NOT NULL,
	`notes` text,
	`guests` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customer_memberships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`customer_id` integer NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text NOT NULL,
	`gender` text,
	`location` text,
	`birthday` integer,
	`notes` text,
	`total_spent` real DEFAULT 0 NOT NULL,
	`membership_tier_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`membership_tier_id`) REFERENCES `membership_tiers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`inviterId` text NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`inviterId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_item_staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_item_id` integer NOT NULL,
	`staff_id` text NOT NULL,
	`role` text DEFAULT 'technician' NOT NULL,
	`commission_value` real DEFAULT 0,
	`commission_type` text DEFAULT 'percent',
	`bonus` real DEFAULT 0,
	FOREIGN KEY (`invoice_item_id`) REFERENCES `invoice_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_id` integer NOT NULL,
	`type` text NOT NULL,
	`reference_id` integer,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real NOT NULL,
	`discount_value` real DEFAULT 0,
	`discount_type` text DEFAULT 'percent',
	`total` real NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` integer,
	`booking_id` integer,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount_value` real DEFAULT 0,
	`discount_type` text DEFAULT 'percent',
	`total` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0,
	`change` real DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_method` text,
	`notes` text,
	`paid_at` integer,
	`is_open_in_tab` integer DEFAULT true,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `member_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` text NOT NULL,
	`permissions` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `membership_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`min_spending` real NOT NULL,
	`discount_percent` real DEFAULT 0 NOT NULL,
	`min_spending_to_maintain` real,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`logo` text,
	`createdAt` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 10 NOT NULL,
	`sku` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `product_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `service_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` real NOT NULL,
	`duration` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`activeOrganizationId` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
