ALTER TABLE `users` ADD `pin_encrypted` text;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `status` text DEFAULT 'a_faire' NOT NULL;
