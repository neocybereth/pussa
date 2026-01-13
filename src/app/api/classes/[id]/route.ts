import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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

    const scheduledClass = await prisma.scheduledClass.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!scheduledClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Students can only view their own classes
    if (
      session.user.role === "STUDENT" &&
      scheduledClass.studentId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(scheduledClass);
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

    const existingClass = await prisma.scheduledClass.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const { studentId, startTime, endTime, ...restData } = result.data;

    // If changing student, verify new student exists
    if (studentId && studentId !== existingClass.studentId) {
      const student = await prisma.user.findUnique({
        where: { id: studentId, role: "STUDENT" },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }
    }

    // Validate end time is after start time if either is being changed
    const newStartTime = startTime
      ? new Date(startTime)
      : existingClass.startTime;
    const newEndTime = endTime ? new Date(endTime) : existingClass.endTime;

    if (newEndTime <= newStartTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const updatedClass = await prisma.scheduledClass.update({
      where: { id },
      data: {
        ...restData,
        ...(studentId && { studentId }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClass);
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

    const existingClass = await prisma.scheduledClass.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    await prisma.scheduledClass.delete({
      where: { id },
    });

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

    const existingClass = await prisma.scheduledClass.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const updatedClass = await prisma.scheduledClass.update({
      where: { id },
      data: {
        paymentStatus: result.data.paymentStatus,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
