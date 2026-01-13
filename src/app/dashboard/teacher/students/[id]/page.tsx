import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

  const student = await prisma.user.findUnique({
    where: { id, role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      assignedExercises: {
        select: {
          id: true,
          assignedAt: true,
          notes: true,
          exercise: {
            select: {
              id: true,
              title: true,
              description: true,
              audioUrl: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
      scheduledClasses: {
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          paymentStatus: true,
          notes: true,
        },
        orderBy: { startTime: "desc" },
        take: 10,
      },
      _count: {
        select: {
          assignedExercises: true,
          scheduledClasses: true,
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  return <StudentDetailClient student={student} />;
}
