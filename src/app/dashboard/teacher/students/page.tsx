import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { StudentList } from "@/components/students/student-list";

export default async function TeacherStudentsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const { data: students, error } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("role", "STUDENT")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching students:", error);
  }

  // Get counts for each student
  const studentsWithCounts = await Promise.all(
    (students || []).map(async (student) => {
      const [exercisesCount, classesCount] = await Promise.all([
        supabase
          .from("student_exercises")
          .select("*", { count: "exact", head: true })
          .eq("student_id", student.id),
        supabase
          .from("scheduled_classes")
          .select("*", { count: "exact", head: true })
          .eq("student_id", student.id),
      ]);

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        createdAt: student.created_at,
        _count: {
          assignedExercises: exercisesCount.count || 0,
          scheduledClasses: classesCount.count || 0,
        },
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">
          Manage your students and view their progress.
        </p>
      </div>

      <StudentList students={studentsWithCounts} />
    </div>
  );
}
