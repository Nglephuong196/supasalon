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
CREATE TABLE `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`logo` text,
	`createdAt` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);
--> statement-breakpoint
-- DATA MIGRATION: Salons -> Organization
INSERT INTO `organization` (`id`, `name`, `slug`, `createdAt`, `metadata`)
SELECT
  CAST(`id` AS TEXT),
  `name`,
  `name` || '-' || CAST(`id` AS TEXT),
  `created_at`,
  json_object('address', `address`, 'phone', `phone`)
FROM `salons`;
--> statement-breakpoint
-- DATA MIGRATION: Salon Members -> Member
INSERT INTO `member` (`id`, `organizationId`, `userId`, `role`, `createdAt`)
SELECT
  lower(hex(randomblob(16))),
  CAST(`salon_id` AS TEXT),
  `user_id`,
  `role`,
  `joined_at`
FROM `salon_members`;
--> statement-breakpoint
DROP TABLE `salon_members`;--> statement-breakpoint
DROP TABLE `salons`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`customer_id` integer NOT NULL,
	`service_id` integer NOT NULL,
	`date` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_bookings`("id", "organization_id", "customer_id", "service_id", "date", "status", "notes", "created_at")
SELECT "id", CAST("salon_id" AS TEXT), "customer_id", "service_id", "date", "status", "notes", "created_at" FROM `bookings`;
--> statement-breakpoint
DROP TABLE `bookings`;--> statement-breakpoint
ALTER TABLE `__new_bookings` RENAME TO `bookings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "organization_id", "name", "email", "phone", "notes", "created_at")
SELECT "id", CAST("salon_id" AS TEXT), "name", "email", "phone", "notes", "created_at" FROM `customers`;
--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
CREATE TABLE `__new_service_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_service_categories`("id", "organization_id", "name", "description", "created_at")
SELECT "id", CAST("salon_id" AS TEXT), "name", "description", "created_at" FROM `service_categories`;
--> statement-breakpoint
DROP TABLE `service_categories`;--> statement-breakpoint
ALTER TABLE `__new_service_categories` RENAME TO `service_categories`;--> statement-breakpoint
ALTER TABLE `session` ADD `activeOrganizationId` text;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `role`;