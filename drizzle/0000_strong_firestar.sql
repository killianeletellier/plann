CREATE TABLE `animation_volunteers` (
	`id` text PRIMARY KEY NOT NULL,
	`animation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text,
	FOREIGN KEY (`animation_id`) REFERENCES `animations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `animations` (
	`id` text PRIMARY KEY NOT NULL,
	`festival_id` text NOT NULL,
	`location_id` text NOT NULL,
	`artist_id` text,
	`title` text NOT NULL,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`festival_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`description` text,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `festivals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `festivals_code_unique` ON `festivals` (`code`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`festival_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`grid_x` integer DEFAULT 0 NOT NULL,
	`grid_y` integer DEFAULT 0 NOT NULL,
	`grid_w` integer DEFAULT 2 NOT NULL,
	`grid_h` integer DEFAULT 2 NOT NULL,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`festival_id` text NOT NULL,
	`location_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`user_id` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`festival_id` text NOT NULL,
	`user_id` text NOT NULL,
	`location_id` text,
	`title` text NOT NULL,
	`description` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`festival_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text,
	`pin_hash` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade
);
