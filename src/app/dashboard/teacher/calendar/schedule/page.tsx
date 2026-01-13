import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ScheduleForm } from "@/components/calendar/schedule-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ScheduleClassPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/teacher/calendar">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Class</h1>
          <p className="text-muted-foreground">
            Create a new scheduled class for a student.
          </p>
        </div>
      </div>

      <ScheduleForm />
    </div>
  );
}
