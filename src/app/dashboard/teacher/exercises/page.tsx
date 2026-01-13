import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { Plus } from "lucide-react";

export default async function TeacherExercisesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const exercises = await prisma.exercise.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { assignedTo: true },
      },
    },
  });

  // Convert dates to strings for client component
  const serializedExercises = exercises.map((exercise) => ({
    ...exercise,
    createdAt: exercise.createdAt.toISOString(),
    updatedAt: exercise.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exercises</h1>
          <p className="text-muted-foreground">
            Manage your exercise library and assign them to students.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/exercises/new">
            <Plus className="mr-2 h-4 w-4" />
            New Exercise
          </Link>
        </Button>
      </div>

      <ExerciseList exercises={serializedExercises} />
    </div>
  );
}
