ALTER TABLE bookings ADD COLUMN cancellation_id text NOT NULL DEFAULT gen_random_uuid()::text;
--> statement-breakpoint
ALTER TABLE bookings ADD CONSTRAINT bookings_cancellation_id_unique UNIQUE (cancellation_id);
