import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StudentCalendar } from "@/components/calendar/student-calendar";

export default async function StudentCalendarPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const classes = await prisma.scheduledClass.findMany({
    where: {
      studentId: session.user.id,
    },
    orderBy: { startTime: "asc" },
  });

  // Serialize dates for client component
  const serializedClasses = classes.map((c) => ({
    id: c.id,
    title: c.title,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
    paymentStatus: c.paymentStatus,
    notes: c.notes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
        <p className="text-muted-foreground">
          View your scheduled classes and payment status.
        </p>
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>Paid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span>Unpaid</span>
        </div>
      </div>

      <StudentCalendar initialClasses={serializedClasses} />
    </div>
  );
}
