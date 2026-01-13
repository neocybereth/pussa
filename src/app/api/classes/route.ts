import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ScheduledClassWithStudent } from "@/lib/database.types";

const createClassSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  startTime: z.string().datetime("Invalid start time"),
  endTime: z.string().datetime("Invalid end time"),
  notes: z.string().max(2000, "Notes are too long").optional(),
  paymentStatus: z.enum(["PAID", "UNPAID"]).optional(),
});

// GET /api/classes - List scheduled classes
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query
    let query = supabase
      .from("scheduled_classes")
      .select(
        `
        *,
        student:users!scheduled_classes_student_id_fkey(id, name, email)
      `
      )
      .order("start_time", { ascending: true });

    // Students can only see their own classes
    if (session.user.role === "STUDENT") {
      query = query.eq("student_id", session.user.id);
    } else if (studentId) {
      // Teachers can filter by student
      query = query.eq("student_id", studentId);
    }

    // Date range filter
    if (startDate) {
      query = query.gte("start_time", startDate);
    }
    if (endDate) {
      query = query.lte("start_time", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const classes = data as unknown as ScheduledClassWithStudent[];

    // Map to camelCase for frontend compatibility
    const mappedClasses = (classes || []).map((c) => ({
      id: c.id,
      studentId: c.student_id,
      title: c.title,
      startTime: c.start_time,
      endTime: c.end_time,
      paymentStatus: c.payment_status,
      notes: c.notes,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      student: c.student,
    }));

    return NextResponse.json(mappedClasses);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// POST /api/classes - Schedule a new class (teacher only)
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
    const result = createClassSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { studentId, title, startTime, endTime, notes, paymentStatus } =
      result.data;

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from("users")
      .select("id")
      .eq("id", studentId)
      .eq("role", "STUDENT")
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Validate end time is after start time
    if (new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("scheduled_classes")
      .insert({
        student_id: studentId,
        title,
        start_time: startTime,
        end_time: endTime,
        notes,
        payment_status: paymentStatus || "UNPAID",
      })
      .select(
        `
        *,
        student:users!scheduled_classes_student_id_fkey(id, name, email)
      `
      )
      .single();

    if (error) throw error;

    const scheduledClass = data as unknown as ScheduledClassWithStudent;

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
