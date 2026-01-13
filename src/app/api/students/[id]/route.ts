import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Validation schema for updating a student
const updateStudentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

// GET /api/students/[id] - Get a single student with details (teacher only)
export async function GET(
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

    // Get student
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("id, name, email, created_at, updated_at")
      .eq("id", id)
      .eq("role", "STUDENT")
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get assigned exercises
    const { data: assignedExercises } = await supabase
      .from("student_exercises")
      .select(`
        id,
        assigned_at,
        notes,
        exercise:exercises(id, title, description, audio_url)
      `)
      .eq("student_id", id)
      .order("assigned_at", { ascending: false });

    // Get scheduled classes (last 10)
    const { data: scheduledClasses } = await supabase
      .from("scheduled_classes")
      .select("id, title, start_time, end_time, payment_status, notes")
      .eq("student_id", id)
      .order("start_time", { ascending: false })
      .limit(10);

    // Get counts
    const [exercisesCount, classesCount] = await Promise.all([
      supabase
        .from("student_exercises")
        .select("*", { count: "exact", head: true })
        .eq("student_id", id),
      supabase
        .from("scheduled_classes")
        .select("*", { count: "exact", head: true })
        .eq("student_id", id),
    ]);

    return NextResponse.json({
      id: student.id,
      name: student.name,
      email: student.email,
      createdAt: student.created_at,
      updatedAt: student.updated_at,
      assignedExercises: (assignedExercises || []).map((ae) => ({
        id: ae.id,
        assignedAt: ae.assigned_at,
        notes: ae.notes,
        exercise: ae.exercise
          ? {
              id: ae.exercise.id,
              title: ae.exercise.title,
              description: ae.exercise.description,
              audioUrl: ae.exercise.audio_url,
            }
          : null,
      })),
      scheduledClasses: (scheduledClasses || []).map((sc) => ({
        id: sc.id,
        title: sc.title,
        startTime: sc.start_time,
        endTime: sc.end_time,
        paymentStatus: sc.payment_status,
        notes: sc.notes,
      })),
      _count: {
        assignedExercises: exercisesCount.count || 0,
        scheduledClasses: classesCount.count || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

// PUT /api/students/[id] - Update a student (teacher only)
export async function PUT(
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

    const validation = updateStudentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if student exists
    const { data: existingStudent, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .eq("role", "STUDENT")
      .single();

    if (findError || !existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // If email is being changed, check for duplicates
    if (validation.data.email && validation.data.email !== existingStudent.email) {
      const { data: emailExists } = await supabase
        .from("users")
        .select("id")
        .eq("email", validation.data.email)
        .single();

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 }
        );
      }
    }

    const { data: updatedStudent, error } = await supabase
      .from("users")
      .update(validation.data)
      .eq("id", id)
      .select("id, name, email, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: updatedStudent.id,
      name: updatedStudent.name,
      email: updatedStudent.email,
      createdAt: updatedStudent.created_at,
      updatedAt: updatedStudent.updated_at,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

// DELETE /api/students/[id] - Delete a student (teacher only)
export async function DELETE(
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

    // Check if student exists
    const { data: existingStudent, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .eq("role", "STUDENT")
      .single();

    if (findError || !existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete the student (cascade will handle related records)
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
