CREATE INDEX `account_provider_account_id_idx` ON `account` (`provider_id`,`account_id`);--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `appointment_date_idx` ON `appointment` (`date`);--> statement-breakpoint
CREATE INDEX `appointment_employee_date_idx` ON `appointment` (`employeeId`,`date`);--> statement-breakpoint
CREATE INDEX `appointment_service_id_idx` ON `appointment` (`serviceId`);--> statement-breakpoint
CREATE INDEX `appointment_customer_id_idx` ON `appointment` (`customerId`);--> statement-breakpoint
CREATE INDEX `customer_name_idx` ON `customer` (`firstName`,`lastName`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_expires_at_idx` ON `session` (`expires_at`);--> statement-breakpoint
CREATE INDEX `shift_plan_employee_id_idx` ON `shiftPlan` (`employeeId`);--> statement-breakpoint
CREATE INDEX `verification_identifier_value_idx` ON `verification` (`identifier`,`value`);--> statement-breakpoint
CREATE INDEX `verification_expires_at_idx` ON `verification` (`expires_at`);