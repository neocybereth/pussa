import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your .env file."
  );
}

// Server-side Supabase client with service role key for full access
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Type exports for convenience
export type Role = "TEACHER" | "STUDENT";
export type PaymentStatus = "PAID" | "UNPAID";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type StudentExercise =
  Database["public"]["Tables"]["student_exercises"]["Row"];
export type ScheduledClass =
  Database["public"]["Tables"]["scheduled_classes"]["Row"];
export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

// Insert types
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type ExerciseInsert =
  Database["public"]["Tables"]["exercises"]["Insert"];
export type StudentExerciseInsert =
  Database["public"]["Tables"]["student_exercises"]["Insert"];
export type ScheduledClassInsert =
  Database["public"]["Tables"]["scheduled_classes"]["Insert"];
export type SiteSettingsInsert =
  Database["public"]["Tables"]["site_settings"]["Insert"];

// Update types
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type ExerciseUpdate =
  Database["public"]["Tables"]["exercises"]["Update"];
export type StudentExerciseUpdate =
  Database["public"]["Tables"]["student_exercises"]["Update"];
export type ScheduledClassUpdate =
  Database["public"]["Tables"]["scheduled_classes"]["Update"];
export type SiteSettingsUpdate =
  Database["public"]["Tables"]["site_settings"]["Update"];
