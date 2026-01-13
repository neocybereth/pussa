import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

    const studentExercises = await prisma.studentExercise.findMany({
      where: { studentId: id },
      select: {
        id: true,
        assignedAt: true,
        notes: true,
        exercise: {
          select: {
            id: true,
            title: true,
            description: true,
            audioUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json(studentExercises);
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
    const student = await prisma.user.findUnique({
      where: { id, role: "STUDENT" },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get current assignments
    const currentAssignments = await prisma.studentExercise.findMany({
      where: { studentId: id },
      select: { exerciseId: true },
    });

    const currentExerciseIds = currentAssignments.map((a) => a.exerciseId);
    const newExerciseIds = validation.data.exerciseIds;

    // Find exercises to add and remove
    const toAdd = newExerciseIds.filter((eid) => !currentExerciseIds.includes(eid));
    const toRemove = currentExerciseIds.filter((eid) => !newExerciseIds.includes(eid));

    // Perform updates in a transaction
    await prisma.$transaction([
      // Remove unassigned exercises
      prisma.studentExercise.deleteMany({
        where: {
          studentId: id,
          exerciseId: { in: toRemove },
        },
      }),
      // Add new assignments
      prisma.studentExercise.createMany({
        data: toAdd.map((exerciseId) => ({
          studentId: id,
          exerciseId,
        })),
        skipDuplicates: true,
      }),
    ]);

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
