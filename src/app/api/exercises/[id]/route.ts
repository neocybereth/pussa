import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
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
      const assignment = await prisma.studentExercise.findUnique({
        where: {
          studentId_exerciseId: {
            studentId: session.user.id,
            exerciseId: id,
          },
        },
        include: {
          exercise: true,
        },
      });

      if (!assignment) {
        return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
      }

      return NextResponse.json(assignment.exercise);
    }

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

    return NextResponse.json(exercise);
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

    const existingExercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!existingExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(exercise);
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

    const existingExercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!existingExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    // Delete the exercise (cascade will delete related StudentExercise records)
    await prisma.exercise.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Exercise deleted successfully" });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    return NextResponse.json(
      { error: "Failed to delete exercise" },
      { status: 500 }
    );
  }
}
