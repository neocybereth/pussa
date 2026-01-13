import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
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

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        assignedTo: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    return NextResponse.json({
      exerciseId: exercise.id,
      assignedStudents: exercise.assignedTo.map((a) => ({
        ...a.student,
        assignedAt: a.assignedAt,
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
    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Verify all students exist and are students
    const students = await prisma.user.findMany({
      where: {
        id: { in: result.data.studentIds },
        role: "STUDENT",
      },
    });

    if (students.length !== result.data.studentIds.length) {
      return NextResponse.json(
        { error: "One or more students not found" },
        { status: 400 }
      );
    }

    // Create assignments (skip duplicates)
    const assignments = await prisma.studentExercise.createMany({
      data: result.data.studentIds.map((studentId) => ({
        studentId,
        exerciseId: id,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `Exercise assigned to ${assignments.count} student(s)`,
      count: assignments.count,
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

    // Delete the assignment using composite key
    await prisma.studentExercise.delete({
      where: {
        studentId_exerciseId: {
          studentId: result.data.studentId,
          exerciseId: id,
        },
      },
    });

    return NextResponse.json({ message: "Assignment removed successfully" });
  } catch (error) {
    console.error("Error removing assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove assignment" },
      { status: 500 }
    );
  }
}
