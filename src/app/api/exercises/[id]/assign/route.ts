import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";

const assignExerciseSchema = z.object({
  studentIds: z.array(z.string()).min(1, "At least one student is required"),
});

const unassignExerciseSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
});

// GET /api/exercises/[id]/assign - Get students assigned to this exercise
export async function GET(
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
    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .select("id")
      .eq("id", id)
      .single();

    if (exerciseError || !exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Get assigned students
    const { data: assignments, error } = await supabase
      .from("student_exercises")
      .select(`
        *,
        student:users(id, name, email)
      `)
      .eq("exercise_id", id);

    if (error) throw error;

    return NextResponse.json({
      exerciseId: id,
      assignedStudents: (assignments || []).map((a) => ({
        ...a.student,
        assignedAt: a.assigned_at,
        notes: a.notes,
      })),
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

// POST /api/exercises/[id]/assign - Assign exercise to students
export async function POST(
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
    const result = assignExerciseSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Verify exercise exists
    const { data: exercise, error: exerciseError } = await supabase
      .from("exercises")
      .select("id")
      .eq("id", id)
      .single();

    if (exerciseError || !exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Verify all students exist and are students
    const { data: students, error: studentsError } = await supabase
      .from("users")
      .select("id")
      .in("id", result.data.studentIds)
      .eq("role", "STUDENT");

    if (studentsError) throw studentsError;

    if (!students || students.length !== result.data.studentIds.length) {
      return NextResponse.json(
        { error: "One or more students not found" },
        { status: 400 }
      );
    }

    // Create assignments (upsert to skip duplicates)
    const { data: assignments, error: insertError } = await supabase
      .from("student_exercises")
      .upsert(
        result.data.studentIds.map((studentId) => ({
          student_id: studentId,
          exercise_id: id,
        })),
        { onConflict: "student_id,exercise_id", ignoreDuplicates: true }
      )
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({
      message: `Exercise assigned to ${assignments?.length || 0} student(s)`,
      count: assignments?.length || 0,
    });
  } catch (error) {
    console.error("Error assigning exercise:", error);
    return NextResponse.json(
      { error: "Failed to assign exercise" },
      { status: 500 }
    );
  }
}

// DELETE /api/exercises/[id]/assign - Remove assignment from a student
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
    const body = await request.json();
    const result = unassignExerciseSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Delete the assignment
    const { error } = await supabase
      .from("student_exercises")
      .delete()
      .eq("student_id", result.data.studentId)
      .eq("exercise_id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Assignment removed successfully" });
  } catch (error) {
    console.error("Error removing assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove assignment" },
      { status: 500 }
    );
  }
}
