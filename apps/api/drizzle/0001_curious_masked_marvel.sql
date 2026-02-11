CREATE TABLE `staff_commission_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`organization_id` text NOT NULL,
	`staff_id` text NOT NULL,
	`item_type` text NOT NULL,
	`item_id` integer NOT NULL,
	`commission_type` text DEFAULT 'percent' NOT NULL,
	`commission_value` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staff_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_commission_rules_staff_item_unique` ON `staff_commission_rules` (`organization_id`,`staff_id`,`item_type`,`item_id`);