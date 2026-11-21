CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
--> statement-breakpoint
CREATE TABLE policy_versions (
  id text PRIMARY KEY,
  content jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE clinics (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  id text NOT NULL UNIQUE,
  name text NOT NULL,
  timezone text NOT NULL,
  slot_grid_minutes bigint NOT NULL CHECK (slot_grid_minutes > 0),
  opening_hours jsonb NOT NULL,
  closed_dates jsonb NOT NULL,
  demo_date text NOT NULL,
  demo_now bigint NOT NULL,
  coverage_from bigint NOT NULL,
  coverage_to bigint NOT NULL CHECK (coverage_from < coverage_to),
  active_policy_version_id text NOT NULL REFERENCES policy_versions(id) DEFERRABLE INITIALLY DEFERRED
);
--> statement-breakpoint
CREATE TABLE practitioners (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  role text NOT NULL,
  skills text[] NOT NULL,
  working_hours jsonb NOT NULL,
  breaks jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE rooms (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  capabilities text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE equipment (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  type text NOT NULL
);
--> statement-breakpoint
CREATE TABLE services (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  duration_min bigint NOT NULL CHECK (duration_min > 0),
  required_skill text NOT NULL,
  required_room_capability text,
  required_equipment_type text
);
--> statement-breakpoint
CREATE TABLE patients (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  is_returning boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE patient_referrals (
  patient_id text NOT NULL REFERENCES patients(id),
  service_id text NOT NULL REFERENCES services(id),
  PRIMARY KEY (patient_id, service_id)
);
--> statement-breakpoint
CREATE TABLE practitioner_time_off (
  id text NOT NULL,
  practitioner_id text NOT NULL REFERENCES practitioners(id),
  from_minute bigint NOT NULL,
  to_minute bigint NOT NULL CHECK (from_minute < to_minute),
  reason text NOT NULL,
  PRIMARY KEY (practitioner_id, id)
);
--> statement-breakpoint
CREATE TABLE room_maintenance (
  id text NOT NULL,
  room_id text NOT NULL REFERENCES rooms(id),
  from_minute bigint NOT NULL,
  to_minute bigint NOT NULL CHECK (from_minute < to_minute),
  PRIMARY KEY (room_id, id)
);
--> statement-breakpoint
CREATE TABLE equipment_maintenance (
  id text NOT NULL,
  equipment_id text NOT NULL REFERENCES equipment(id),
  from_minute bigint NOT NULL,
  to_minute bigint NOT NULL CHECK (from_minute < to_minute),
  PRIMARY KEY (equipment_id, id)
);
--> statement-breakpoint
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled');
--> statement-breakpoint
CREATE TABLE bookings (
  id text PRIMARY KEY,
  patient_id text NOT NULL REFERENCES patients(id),
  service_id text NOT NULL REFERENCES services(id),
  practitioner_id text NOT NULL REFERENCES practitioners(id),
  room_id text NOT NULL REFERENCES rooms(id),
  equipment_id text REFERENCES equipment(id),
  start_minute bigint NOT NULL,
  end_minute bigint NOT NULL CHECK (start_minute < end_minute),
  status booking_status NOT NULL,
  created_at bigint NOT NULL,
  cancelled_at bigint,
  CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL)),
  CONSTRAINT bookings_practitioner_overlap EXCLUDE USING gist (
    practitioner_id WITH =, int8range(start_minute, end_minute, '[)') WITH &&
  ) WHERE (status = 'confirmed'),
  CONSTRAINT bookings_room_overlap EXCLUDE USING gist (
    room_id WITH =, int8range(start_minute, end_minute, '[)') WITH &&
  ) WHERE (status = 'confirmed'),
  CONSTRAINT bookings_equipment_overlap EXCLUDE USING gist (
    equipment_id WITH =, int8range(start_minute, end_minute, '[)') WITH &&
  ) WHERE (status = 'confirmed' AND equipment_id IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX bookings_start ON bookings (start_minute);
--> statement-breakpoint
CREATE INDEX bookings_end ON bookings (end_minute);
--> statement-breakpoint
CREATE INDEX bookings_patient_start ON bookings (patient_id, start_minute);
--> statement-breakpoint
CREATE TYPE evaluation_kind AS ENUM ('slot', 'range');
--> statement-breakpoint
CREATE TABLE evaluation_inputs (
  id text PRIMARY KEY,
  kind evaluation_kind NOT NULL,
  snapshot jsonb NOT NULL,
  request jsonb NOT NULL,
  evaluated_at bigint NOT NULL,
  options jsonb NOT NULL,
  input_version integer NOT NULL CHECK (input_version > 0),
  schema_version integer NOT NULL CHECK (schema_version > 0),
  engine_version text NOT NULL,
  policy_version_id text NOT NULL REFERENCES policy_versions(id),
  result jsonb NOT NULL,
  duration_ms double precision NOT NULL CHECK (duration_ms >= 0 AND duration_ms < 'Infinity')
);
--> statement-breakpoint
CREATE INDEX evaluation_inputs_kind_date ON evaluation_inputs (kind, evaluated_at, id);
--> statement-breakpoint
CREATE FUNCTION reject_historical_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Historical records are immutable' USING ERRCODE = '55000';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER policy_versions_immutable BEFORE UPDATE OR DELETE ON policy_versions
FOR EACH ROW EXECUTE FUNCTION reject_historical_mutation();
--> statement-breakpoint
CREATE TRIGGER evaluation_inputs_immutable BEFORE UPDATE OR DELETE ON evaluation_inputs
FOR EACH ROW EXECUTE FUNCTION reject_historical_mutation();
