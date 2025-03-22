DROP INDEX `appointment_date_idx`;--> statement-breakpoint
CREATE INDEX `appointment_date_time_idx` ON `appointment` (`date`,`time_from`);--> statement-breakpoint
CREATE INDEX `appointment_employee_date_time_idx` ON `appointment` (`employeeId`,`date`,`time_from`,`time_to`);