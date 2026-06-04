CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`public_key_jwk` text NOT NULL,
	`created_at` integer NOT NULL
);
