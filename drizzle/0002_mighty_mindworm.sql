CREATE TABLE `volunteer_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`festival_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`festival_id`) REFERENCES `festivals`(`id`) ON UPDATE no action ON DELETE cascade
);
