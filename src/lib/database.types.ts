export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string;
          name: string;
          bio: string | null;
          role: "TEACHER" | "STUDENT";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          name: string;
          bio?: string | null;
          role?: "TEACHER" | "STUDENT";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          name?: string;
          bio?: string | null;
          role?: "TEACHER" | "STUDENT";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          audio_url: string;
          audio_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          audio_url: string;
          audio_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          audio_url?: string;
          audio_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_exercises: {
        Row: {
          id: string;
          student_id: string;
          exercise_id: string;
          assigned_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          exercise_id: string;
          assigned_at?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          exercise_id?: string;
          assigned_at?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_exercises_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          }
        ];
      };
      scheduled_classes: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          start_time: string;
          end_time: string;
          payment_status: "PAID" | "UNPAID";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          title: string;
          start_time: string;
          end_time: string;
          payment_status?: "PAID" | "UNPAID";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          title?: string;
          start_time?: string;
          end_time?: string;
          payment_status?: "PAID" | "UNPAID";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "scheduled_classes_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      site_settings: {
        Row: {
          id: string;
          teacher_name: string | null;
          teacher_bio: string | null;
          teacher_photo: string | null;
          pricing: Json | null;
          contact_info: Json | null;
        };
        Insert: {
          id?: string;
          teacher_name?: string | null;
          teacher_bio?: string | null;
          teacher_photo?: string | null;
          pricing?: Json | null;
          contact_info?: Json | null;
        };
        Update: {
          id?: string;
          teacher_name?: string | null;
          teacher_bio?: string | null;
          teacher_photo?: string | null;
          pricing?: Json | null;
          contact_info?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: "TEACHER" | "STUDENT";
      payment_status: "PAID" | "UNPAID";
    };
  };
};

// Helper types for joined queries
export type ScheduledClassWithStudent = Database["public"]["Tables"]["scheduled_classes"]["Row"] & {
  student: Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "email"> | null;
};

export type StudentExerciseWithExercise = Database["public"]["Tables"]["student_exercises"]["Row"] & {
  exercise: Database["public"]["Tables"]["exercises"]["Row"] | null;
};

export type StudentExerciseWithStudent = Database["public"]["Tables"]["student_exercises"]["Row"] & {
  student: Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "name" | "email"> | null;
};
