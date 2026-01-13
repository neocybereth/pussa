import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { TeacherCalendar } from "@/components/calendar/teacher-calendar";
import { Plus } from "lucide-react";

export default async function TeacherCalendarPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const { data: classes, error } = await supabase
    .from("scheduled_classes")
    .select(`
      *,
      student:users(id, name, email)
    `)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Error fetching classes:", error);
  }

  // Serialize dates for client component
  const serializedClasses = (classes || []).map((c) => ({
    id: c.id,
    title: c.title,
    startTime: c.start_time,
    endTime: c.end_time,
    paymentStatus: c.payment_status,
    notes: c.notes,
    student: c.student,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage all scheduled classes. Click on a date to schedule a new class.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/calendar/schedule">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Class
          </Link>
        </Button>
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

      <TeacherCalendar initialClasses={serializedClasses} />
    </div>
  );
}
