-- Create custom types
CREATE TYPE role AS ENUM ('TEACHER', 'STUDENT');
CREATE TYPE payment_status AS ENUM ('PAID', 'UNPAID');

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role role DEFAULT 'STUDENT' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create exercises table
CREATE TABLE exercises (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  audio_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create student_exercises table (junction table for student-exercise assignments)
CREATE TABLE student_exercises (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT,
  UNIQUE(student_id, exercise_id)
);

-- Create scheduled_classes table
CREATE TABLE scheduled_classes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  payment_status payment_status DEFAULT 'UNPAID' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create site_settings table
CREATE TABLE site_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  teacher_name TEXT,
  teacher_bio TEXT,
  teacher_photo TEXT,
  pricing JSONB,
  contact_info JSONB
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_student_exercises_student_id ON student_exercises(student_id);
CREATE INDEX idx_student_exercises_exercise_id ON student_exercises(exercise_id);
CREATE INDEX idx_scheduled_classes_student_id ON scheduled_classes(student_id);
CREATE INDEX idx_scheduled_classes_start_time ON scheduled_classes(start_time);
CREATE INDEX idx_scheduled_classes_payment_status ON scheduled_classes(payment_status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_classes_updated_at
  BEFORE UPDATE ON scheduled_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
