import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
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

  const { data: exercise, error } = await supabase
    .from("exercises")
    .select("id, title, description, audio_url, audio_key")
    .eq("id", id)
    .single();

  if (error || !exercise) {
    notFound();
  }

  // Map to camelCase for the form
  const exerciseData = {
    id: exercise.id,
    title: exercise.title,
    description: exercise.description,
    audioUrl: exercise.audio_url,
    audioKey: exercise.audio_key,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Exercise</h1>
        <p className="text-muted-foreground">
          Update the exercise details and audio file.
        </p>
      </div>

      <ExerciseForm mode="edit" exercise={exerciseData} />
    </div>
  );
}
