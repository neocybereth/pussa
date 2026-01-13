import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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

    // Build where clause based on role and filters
    const where: {
      studentId?: string;
      startTime?: { gte?: Date; lte?: Date };
    } = {};

    // Students can only see their own classes
    if (session.user.role === "STUDENT") {
      where.studentId = session.user.id;
    } else if (studentId) {
      // Teachers can filter by student
      where.studentId = studentId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate);
      }
    }

    const classes = await prisma.scheduledClass.findMany({
      where,
      orderBy: { startTime: "asc" },
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

    return NextResponse.json(classes);
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
    const student = await prisma.user.findUnique({
      where: { id: studentId, role: "STUDENT" },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Validate end time is after start time
    if (new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const scheduledClass = await prisma.scheduledClass.create({
      data: {
        studentId,
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
        paymentStatus: paymentStatus || "UNPAID",
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

    return NextResponse.json(scheduledClass, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
