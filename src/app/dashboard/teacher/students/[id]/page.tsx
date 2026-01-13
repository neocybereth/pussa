import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { StudentDetailClient } from "@/components/students/student-detail-client";

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const { id } = await params;

  // Get student
  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", id)
    .eq("role", "STUDENT")
    .single();

  if (studentError || !student) {
    notFound();
  }

  // Get assigned exercises
  const { data: assignedExercises } = await supabase
    .from("student_exercises")
    .select(`
      id,
      assigned_at,
      notes,
      exercise:exercises(id, title, description, audio_url)
    `)
    .eq("student_id", id)
    .order("assigned_at", { ascending: false });

  // Get scheduled classes (last 10)
  const { data: scheduledClasses } = await supabase
    .from("scheduled_classes")
    .select("id, title, start_time, end_time, payment_status, notes")
    .eq("student_id", id)
    .order("start_time", { ascending: false })
    .limit(10);

  // Get counts
  const [exercisesCount, classesCount] = await Promise.all([
    supabase
      .from("student_exercises")
      .select("*", { count: "exact", head: true })
      .eq("student_id", id),
    supabase
      .from("scheduled_classes")
      .select("*", { count: "exact", head: true })
      .eq("student_id", id),
  ]);

  // Build student object with camelCase keys for frontend
  const studentData = {
    id: student.id,
    name: student.name,
    email: student.email,
    createdAt: student.created_at,
    assignedExercises: (assignedExercises || []).map((ae) => ({
      id: ae.id,
      assignedAt: ae.assigned_at,
      notes: ae.notes,
      exercise: ae.exercise
        ? {
            id: ae.exercise.id,
            title: ae.exercise.title,
            description: ae.exercise.description,
            audioUrl: ae.exercise.audio_url,
          }
        : null,
    })),
    scheduledClasses: (scheduledClasses || []).map((sc) => ({
      id: sc.id,
      title: sc.title,
      startTime: sc.start_time,
      endTime: sc.end_time,
      paymentStatus: sc.payment_status,
      notes: sc.notes,
    })),
    _count: {
      assignedExercises: exercisesCount.count || 0,
      scheduledClasses: classesCount.count || 0,
    },
  };

  return <StudentDetailClient student={studentData} />;
}
