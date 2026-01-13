import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ScheduledClassWithStudent } from "@/lib/database.types";

const updateClassSchema = z.object({
  studentId: z.string().min(1, "Student is required").optional(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long")
    .optional(),
  startTime: z.string().datetime("Invalid start time").optional(),
  endTime: z.string().datetime("Invalid end time").optional(),
  notes: z.string().max(2000, "Notes are too long").optional().nullable(),
  paymentStatus: z.enum(["PAID", "UNPAID"]).optional(),
});

// GET /api/classes/[id] - Get a single scheduled class
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

    const { data, error } = await supabase
      .from("scheduled_classes")
      .select(`
        *,
        student:users!scheduled_classes_student_id_fkey(id, name, email)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const scheduledClass = data as unknown as ScheduledClassWithStudent;

    // Students can only view their own classes
    if (
      session.user.role === "STUDENT" &&
      scheduledClass.student_id !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      id: scheduledClass.id,
      studentId: scheduledClass.student_id,
      title: scheduledClass.title,
      startTime: scheduledClass.start_time,
      endTime: scheduledClass.end_time,
      paymentStatus: scheduledClass.payment_status,
      notes: scheduledClass.notes,
      createdAt: scheduledClass.created_at,
      updatedAt: scheduledClass.updated_at,
      student: scheduledClass.student,
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    );
  }
}

// PUT /api/classes/[id] - Update a scheduled class (teacher only)
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
    const result = updateClassSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Get existing class
    const { data: existingClass, error: findError } = await supabase
      .from("scheduled_classes")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const { studentId, startTime, endTime, ...restData } = result.data;

    // If changing student, verify new student exists
    if (studentId && studentId !== existingClass.student_id) {
      const { data: student, error: studentError } = await supabase
        .from("users")
        .select("id")
        .eq("id", studentId)
        .eq("role", "STUDENT")
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }
    }

    // Validate end time is after start time if either is being changed
    const newStartTime = startTime
      ? new Date(startTime)
      : new Date(existingClass.start_time);
    const newEndTime = endTime ? new Date(endTime) : new Date(existingClass.end_time);

    if (newEndTime <= newStartTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (restData.title !== undefined) updateData.title = restData.title;
    if (restData.notes !== undefined) updateData.notes = restData.notes;
    if (restData.paymentStatus !== undefined) updateData.payment_status = restData.paymentStatus;
    if (studentId) updateData.student_id = studentId;
    if (startTime) updateData.start_time = startTime;
    if (endTime) updateData.end_time = endTime;

    const { data, error } = await supabase
      .from("scheduled_classes")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        student:users!scheduled_classes_student_id_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;

    const updatedClass = data as unknown as ScheduledClassWithStudent;

    return NextResponse.json({
      id: updatedClass.id,
      studentId: updatedClass.student_id,
      title: updatedClass.title,
      startTime: updatedClass.start_time,
      endTime: updatedClass.end_time,
      paymentStatus: updatedClass.payment_status,
      notes: updatedClass.notes,
      createdAt: updatedClass.created_at,
      updatedAt: updatedClass.updated_at,
      student: updatedClass.student,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Delete a scheduled class (teacher only)
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

    // Check if class exists
    const { data: existingClass, error: findError } = await supabase
      .from("scheduled_classes")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("scheduled_classes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}

// PATCH /api/classes/[id] - Update payment status (teacher only)
export async function PATCH(
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

    const paymentStatusSchema = z.object({
      paymentStatus: z.enum(["PAID", "UNPAID"]),
    });

    const result = paymentStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 }
      );
    }

    // Check if class exists
    const { data: existingClass, error: findError } = await supabase
      .from("scheduled_classes")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("scheduled_classes")
      .update({ payment_status: result.data.paymentStatus })
      .eq("id", id)
      .select(`
        *,
        student:users!scheduled_classes_student_id_fkey(id, name, email)
      `)
      .single();

    if (error) throw error;

    const updatedClass = data as unknown as ScheduledClassWithStudent;

    return NextResponse.json({
      id: updatedClass.id,
      studentId: updatedClass.student_id,
      title: updatedClass.title,
      startTime: updatedClass.start_time,
      endTime: updatedClass.end_time,
      paymentStatus: updatedClass.payment_status,
      notes: updatedClass.notes,
      createdAt: updatedClass.created_at,
      updatedAt: updatedClass.updated_at,
      student: updatedClass.student,
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
