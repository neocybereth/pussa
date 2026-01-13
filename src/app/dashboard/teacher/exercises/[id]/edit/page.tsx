import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ExerciseForm } from "@/components/exercises/exercise-form";

interface EditExercisePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExercisePage({ params }: EditExercisePageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const { id } = await params;

  const exercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      audioUrl: true,
      audioKey: true,
    },
  });

  if (!exercise) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Exercise</h1>
        <p className="text-muted-foreground">
          Update the exercise details and audio file.
        </p>
      </div>

      <ExerciseForm mode="edit" exercise={exercise} />
    </div>
  );
}
