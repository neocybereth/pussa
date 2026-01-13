import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";

const createExerciseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(2000, "Description is too long").optional(),
  audioUrl: z.string().url("Invalid audio URL"),
  audioKey: z.string().min(1, "Audio key is required"),
});

// GET /api/exercises - List all exercises (teacher only)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get exercises with count of assignments
    const { data: exercises, error } = await supabase
      .from("exercises")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get assignment counts for each exercise
    const exercisesWithCounts = await Promise.all(
      (exercises || []).map(async (exercise) => {
        const { count } = await supabase
          .from("student_exercises")
          .select("*", { count: "exact", head: true })
          .eq("exercise_id", exercise.id);

        return {
          ...exercise,
          // Map snake_case to camelCase for frontend compatibility
          audioUrl: exercise.audio_url,
          audioKey: exercise.audio_key,
          createdAt: exercise.created_at,
          updatedAt: exercise.updated_at,
          _count: {
            assignedTo: count || 0,
          },
        };
      })
    );

    return NextResponse.json(exercisesWithCounts);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

// POST /api/exercises - Create a new exercise (teacher only)
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = createExerciseSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { title, description, audioUrl, audioKey } = result.data;

    const { data: exercise, error } = await supabase
      .from("exercises")
      .insert({
        title,
        description,
        audio_url: audioUrl,
        audio_key: audioKey,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        ...exercise,
        audioUrl: exercise.audio_url,
        audioKey: exercise.audio_key,
        createdAt: exercise.created_at,
        updatedAt: exercise.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating exercise:", error);
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    );
  }
}
