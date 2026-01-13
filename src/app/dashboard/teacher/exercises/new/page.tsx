import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ExerciseForm } from "@/components/exercises/exercise-form";

export default async function NewExercisePage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Exercise</h1>
        <p className="text-muted-foreground">
          Create a new exercise with audio for your students.
        </p>
      </div>

      <ExerciseForm mode="create" />
    </div>
  );
}
