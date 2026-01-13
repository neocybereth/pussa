import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { Plus } from "lucide-react";

export default async function TeacherExercisesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching exercises:", error);
  }

  // Get assignment counts for each exercise
  const exercisesWithCounts = await Promise.all(
    (exercises || []).map(async (exercise) => {
      const { count } = await supabase
        .from("student_exercises")
        .select("*", { count: "exact", head: true })
        .eq("exercise_id", exercise.id);

      return {
        id: exercise.id,
        title: exercise.title,
        description: exercise.description,
        audioUrl: exercise.audio_url,
        audioKey: exercise.audio_key,
        createdAt: exercise.created_at,
        updatedAt: exercise.updated_at,
        _count: {
          assignedTo: count || 0,
        },
      };
    })
  );

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

      <ExerciseList exercises={exercisesWithCounts} />
    </div>
  );
}
