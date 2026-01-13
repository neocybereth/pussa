import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AudioPlayer } from "@/components/exercises/audio-player";

export default async function StudentExercisesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const { data: exercises, error } = await supabase
    .from("student_exercises")
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq("student_id", session.user.id)
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("Error fetching exercises:", error);
  }

  const studentExercises = exercises || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Exercises</h1>
        <p className="text-muted-foreground">
          Practice materials assigned to you by your teacher.
        </p>
      </div>

      {studentExercises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No exercises have been assigned to you yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {studentExercises.map((se) => (
            <Card key={se.id}>
              <CardHeader>
                <CardTitle className="text-lg">{se.exercise?.title}</CardTitle>
                <CardDescription>
                  Assigned on{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                  }).format(new Date(se.assigned_at))}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {se.exercise?.description && (
                  <p className="text-sm text-muted-foreground">
                    {se.exercise.description}
                  </p>
                )}
                {se.exercise?.audio_url && (
                  <AudioPlayer src={se.exercise.audio_url} />
                )}
                {se.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Teacher Notes:
                    </p>
                    <p className="text-sm">{se.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
