import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";

const updateExerciseSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long")
    .optional(),
  description: z.string().max(2000, "Description is too long").optional(),
  audioUrl: z.string().url("Invalid audio URL").optional(),
  audioKey: z.string().min(1, "Audio key is required").optional(),
});

// GET /api/exercises/[id] - Get a single exercise
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Teachers can view any exercise
    // Students can only view exercises assigned to them
    if (session.user.role === "STUDENT") {
      const { data: assignment, error: assignmentError } = await supabase
        .from("student_exercises")
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq("student_id", session.user.id)
        .eq("exercise_id", id)
        .single();

      if (assignmentError || !assignment) {
        return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
      }

      const exercise = assignment.exercise;
      return NextResponse.json({
        ...exercise,
        audioUrl: exercise.audio_url,
        audioKey: exercise.audio_key,
        createdAt: exercise.created_at,
        updatedAt: exercise.updated_at,
      });
    }

    // Teacher view - get exercise with assigned students
    const { data: exercise, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Get assigned students
    const { data: assignments } = await supabase
      .from("student_exercises")
      .select(`
        *,
        student:users(id, name, email)
      `)
      .eq("exercise_id", id);

    return NextResponse.json({
      ...exercise,
      audioUrl: exercise.audio_url,
      audioKey: exercise.audio_key,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
      assignedTo: (assignments || []).map((a) => ({
        ...a,
        assignedAt: a.assigned_at,
        studentId: a.student_id,
        exerciseId: a.exercise_id,
      })),
    });
  } catch (error) {
    console.error("Error fetching exercise:", error);
    return NextResponse.json(
      { error: "Failed to fetch exercise" },
      { status: 500 }
    );
  }
}

// PUT /api/exercises/[id] - Update an exercise (teacher only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateExerciseSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Check if exercise exists
    const { data: existingExercise, error: findError } = await supabase
      .from("exercises")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existingExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Map camelCase to snake_case for update
    const updateData: Record<string, unknown> = {};
    if (result.data.title !== undefined) updateData.title = result.data.title;
    if (result.data.description !== undefined) updateData.description = result.data.description;
    if (result.data.audioUrl !== undefined) updateData.audio_url = result.data.audioUrl;
    if (result.data.audioKey !== undefined) updateData.audio_key = result.data.audioKey;

    const { data: exercise, error } = await supabase
      .from("exercises")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ...exercise,
      audioUrl: exercise.audio_url,
      audioKey: exercise.audio_key,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
    });
  } catch (error) {
    console.error("Error updating exercise:", error);
    return NextResponse.json(
      { error: "Failed to update exercise" },
      { status: 500 }
    );
  }
}

// DELETE /api/exercises/[id] - Delete an exercise (teacher only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Check if exercise exists
    const { data: existingExercise, error: findError } = await supabase
      .from("exercises")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existingExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Delete the exercise (cascade will delete related student_exercises records)
    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Exercise deleted successfully" });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    return NextResponse.json(
      { error: "Failed to delete exercise" },
      { status: 500 }
    );
  }
}
