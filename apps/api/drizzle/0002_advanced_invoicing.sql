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
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invoices` (
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
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_invoices`("id", "organization_id", "customer_id", "booking_id", "subtotal", "discount_value", "discount_type", "total", "amount_paid", "change", "status", "payment_method", "notes", "paid_at", "created_at") SELECT "id", "organization_id", "customer_id", "booking_id", "subtotal", "discount_value", "discount_type", "total", "amount_paid", "change", "status", "payment_method", "notes", "paid_at", "created_at" FROM `invoices`;--> statement-breakpoint
DROP TABLE `invoices`;--> statement-breakpoint
ALTER TABLE `__new_invoices` RENAME TO `invoices`;--> statement-breakpoint
PRAGMA foreign_keys=ON;