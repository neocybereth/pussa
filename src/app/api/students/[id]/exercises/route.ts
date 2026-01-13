import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for assigning exercises
const assignExercisesSchema = z.object({
  exerciseIds: z.array(z.string()),
});

// GET /api/students/[id]/exercises - Get exercises assigned to a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Teachers can view any student's exercises, students can only view their own
    if (session.user.role === "STUDENT" && session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: studentExercises, error } = await supabase
      .from("student_exercises")
      .select(`
        id,
        assigned_at,
        notes,
        exercise:exercises(id, title, description, audio_url, created_at)
      `)
      .eq("student_id", id)
      .order("assigned_at", { ascending: false });

    if (error) throw error;

    // Map to camelCase
    const mappedExercises = (studentExercises || []).map((se) => ({
      id: se.id,
      assignedAt: se.assigned_at,
      notes: se.notes,
      exercise: se.exercise
        ? {
            id: se.exercise.id,
            title: se.exercise.title,
            description: se.exercise.description,
            audioUrl: se.exercise.audio_url,
            createdAt: se.exercise.created_at,
          }
        : null,
    }));

    return NextResponse.json(mappedExercises);
  } catch (error) {
    console.error("Error fetching student exercises:", error);
    return NextResponse.json(
      { error: "Failed to fetch student exercises" },
      { status: 500 }
    );
  }
}

// POST /api/students/[id]/exercises - Assign exercises to a student (teacher only)
export async function POST(
  request: NextRequest,
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

    const validation = assignExercisesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .eq("role", "STUDENT")
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get current assignments
    const { data: currentAssignments } = await supabase
      .from("student_exercises")
      .select("exercise_id")
      .eq("student_id", id);

    const currentExerciseIds = (currentAssignments || []).map((a) => a.exercise_id);
    const newExerciseIds = validation.data.exerciseIds;

    // Find exercises to add and remove
    const toAdd = newExerciseIds.filter((eid) => !currentExerciseIds.includes(eid));
    const toRemove = currentExerciseIds.filter((eid) => !newExerciseIds.includes(eid));

    // Remove unassigned exercises
    if (toRemove.length > 0) {
      await supabase
        .from("student_exercises")
        .delete()
        .eq("student_id", id)
        .in("exercise_id", toRemove);
    }

    // Add new assignments
    if (toAdd.length > 0) {
      await supabase
        .from("student_exercises")
        .upsert(
          toAdd.map((exerciseId) => ({
            student_id: id,
            exercise_id: exerciseId,
          })),
          { onConflict: "student_id,exercise_id", ignoreDuplicates: true }
        );
    }

    return NextResponse.json({
      success: true,
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error) {
    console.error("Error assigning exercises:", error);
    return NextResponse.json(
      { error: "Failed to assign exercises" },
      { status: 500 }
    );
  }
}
