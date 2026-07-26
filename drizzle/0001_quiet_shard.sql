CREATE TABLE `slot_volunteers` (
	`id` text PRIMARY KEY NOT NULL,
	`slot_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text,
	FOREIGN KEY (`slot_id`) REFERENCES `slots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `task_volunteers` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `task_volunteers` (`id`, `task_id`, `user_id`, `role`)
SELECT `id` || ':' || `user_id`, `id`, `user_id`, NULL FROM `tasks` WHERE `user_id` IS NOT NULL;
--> statement-breakpoint
INSERT INTO `slot_volunteers` (`id`, `slot_id`, `user_id`, `role`)
SELECT `id` || ':' || `user_id`, `id`, `user_id`, NULL FROM `slots` WHERE `user_id` IS NOT NULL;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_slots`("id", "post_id", "start_at", "end_at") SELECT "id", "post_id", "start_at", "end_at" FROM `slots`;--> statement-breakpoint
DROP TABLE `slots`;--> statement-breakpoint
ALTER TABLE `__new_slots` RENAME TO `slots`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`festival_id` text NOT NULL,
	`location_id` text,
	`title` text NOT NULL,
	`description` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "festival_id", "location_id", "title", "description", "start_at", "end_at") SELECT "id", "festival_id", "location_id", "title", "description", "start_at", "end_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;