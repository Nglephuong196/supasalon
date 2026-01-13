CREATE TABLE `salon_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`salon_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'staff' NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`salon_id`) REFERENCES `salons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
