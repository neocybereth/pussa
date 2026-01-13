import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudentList } from "@/components/students/student-list";

export default async function TeacherStudentsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          assignedExercises: true,
          scheduledClasses: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Convert dates to strings for client component
  const serializedStudents = students.map((student) => ({
    ...student,
    createdAt: student.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">
          Manage your students and view their progress.
        </p>
      </div>

      <StudentList students={serializedStudents} />
    </div>
  );
}
