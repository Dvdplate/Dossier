CREATE TABLE `birthdays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`birth_month` integer NOT NULL,
	`birth_day` integer NOT NULL,
	`birth_year` integer,
	`note` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recurring_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`time_of_day` text NOT NULL,
	`day_of_week` integer,
	`day_of_month` integer,
	`active` integer DEFAULT true,
	`next_run_at` integer NOT NULL,
	`last_fired_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rules_active_next` ON `recurring_rules` (`active`,`next_run_at`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`position` real NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`origin` text DEFAULT 'manual' NOT NULL,
	`rule_id` integer,
	`occurrence_key` text,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`rule_id`) REFERENCES `recurring_rules`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_tasks_status_position` ON `tasks` (`status`,`position`);--> statement-breakpoint
CREATE INDEX `idx_tasks_rule_status` ON `tasks` (`rule_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tasks_occurrence_key` ON `tasks` (`occurrence_key`);