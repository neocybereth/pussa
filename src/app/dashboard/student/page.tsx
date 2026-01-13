import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Clock, DollarSign, ArrowRight } from "lucide-react";
import { AudioPlayer } from "@/components/exercises/audio-player";
import { TeacherProfileCard } from "@/components/profile/teacher-profile-card";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get end of week (7 days from now)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  // Fetch data in parallel
  const [exerciseCountResult, upcomingClassesResult, recentExercisesResult, unpaidCountResult] = await Promise.all([
    // Count total assigned exercises
    supabase
      .from("student_exercises")
      .select("*", { count: "exact", head: true })
      .eq("student_id", userId),
    // Get upcoming classes this week
    supabase
      .from("scheduled_classes")
      .select("*")
      .eq("student_id", userId)
      .gte("start_time", today.toISOString())
      .lte("start_time", endOfWeek.toISOString())
      .order("start_time", { ascending: true })
      .limit(5),
    // Get recently assigned exercises
    supabase
      .from("student_exercises")
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq("student_id", userId)
      .order("assigned_at", { ascending: false })
      .limit(3),
    // Get unpaid count
    supabase
      .from("scheduled_classes")
      .select("*", { count: "exact", head: true })
      .eq("student_id", userId)
      .eq("payment_status", "UNPAID"),
  ]);

  const exerciseCount = exerciseCountResult.count || 0;
  const upcomingClasses = upcomingClassesResult.data || [];
  const recentExercises = recentExercisesResult.data || [];
  const unpaidCount = unpaidCountResult.count || 0;

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || "Student"}! Here&apos;s your learning progress.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Exercises</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exerciseCount}</div>
            <p className="text-xs text-muted-foreground">
              Exercises assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Class</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingClasses.length > 0 ? formatDate(new Date(upcomingClasses[0].start_time)) : "--"}
            </div>
            <p className="text-xs text-muted-foreground">
              {upcomingClasses.length > 0 ? formatTime(new Date(upcomingClasses[0].start_time)) : "No upcoming classes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Classes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidCount}</div>
            <p className="text-xs text-muted-foreground">
              Pending payment
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Classes Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Classes</CardTitle>
              <CardDescription>Your scheduled classes this week</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/student/calendar">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No classes scheduled this week.
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{cls.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(new Date(cls.start_time))} at {formatTime(new Date(cls.start_time))}
                      </p>
                    </div>
                    <Badge variant={cls.payment_status === "PAID" ? "default" : "secondary"}>
                      {cls.payment_status === "PAID" ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Exercises Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Exercises</CardTitle>
              <CardDescription>Your latest practice materials</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/student/exercises">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No exercises assigned yet.
              </p>
            ) : (
              <div className="space-y-4">
                {recentExercises.map((se) => (
                  <div key={se.id} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{se.exercise?.title}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                        }).format(new Date(se.assigned_at))}
                      </span>
                    </div>
                    {se.exercise?.audio_url && (
                      <AudioPlayer src={se.exercise.audio_url} compact />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Teacher Profile Section */}
      <TeacherProfileCard />
    </div>
  );
}
