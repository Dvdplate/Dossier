PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_birthdays` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`birth_month` integer NOT NULL,
	`birth_day` integer NOT NULL,
	`birth_year` integer,
	`note` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_birthdays`("id", "name", "birth_month", "birth_day", "birth_year", "note", "created_at") SELECT "id", "name", "birth_month", "birth_day", "birth_year", "note", "created_at" FROM `birthdays`;--> statement-breakpoint
DROP TABLE `birthdays`;--> statement-breakpoint
ALTER TABLE `__new_birthdays` RENAME TO `birthdays`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`public_key_jwk` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_devices`("id", "nickname", "public_key_jwk", "created_at") SELECT "id", "nickname", "public_key_jwk", "created_at" FROM `devices`;--> statement-breakpoint
DROP TABLE `devices`;--> statement-breakpoint
ALTER TABLE `__new_devices` RENAME TO `devices`;--> statement-breakpoint
CREATE TABLE `__new_recurring_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`time_of_day` text NOT NULL,
	`day_of_week` integer,
	`day_of_month` integer,
	`active` integer DEFAULT true,
	`next_run_at` integer NOT NULL,
	`last_fired_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_recurring_rules`("id", "title", "type", "time_of_day", "day_of_week", "day_of_month", "active", "next_run_at", "last_fired_at", "created_at") SELECT "id", "title", "type", "time_of_day", "day_of_week", "day_of_month", "active", "next_run_at", "last_fired_at", "created_at" FROM `recurring_rules`;--> statement-breakpoint
DROP TABLE `recurring_rules`;--> statement-breakpoint
ALTER TABLE `__new_recurring_rules` RENAME TO `recurring_rules`;--> statement-breakpoint
CREATE INDEX `idx_rules_active_next` ON `recurring_rules` (`active`,`next_run_at`);--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`position` real NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`origin` text DEFAULT 'manual' NOT NULL,
	`rule_id` integer,
	`occurrence_key` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`rule_id`) REFERENCES `recurring_rules`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "title", "notes", "position", "status", "origin", "rule_id", "occurrence_key", "created_at", "completed_at") SELECT "id", "title", "notes", "position", "status", "origin", "rule_id", "occurrence_key", "created_at", "completed_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
CREATE INDEX `idx_tasks_status_position` ON `tasks` (`status`,`position`);--> statement-breakpoint
CREATE INDEX `idx_tasks_rule_status` ON `tasks` (`rule_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tasks_occurrence_key` ON `tasks` (`occurrence_key`);