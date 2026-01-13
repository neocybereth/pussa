import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Calendar, DollarSign, ArrowRight, Clock } from "lucide-react";

export default async function TeacherDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get end of week (7 days from now)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  // Fetch data in parallel
  const [
    studentCountResult,
    exerciseCountResult,
    upcomingClassesResult,
    recentStudentsResult,
    paidCountResult,
    unpaidCountResult,
  ] = await Promise.all([
    // Count total students
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "STUDENT"),
    // Count total exercises
    supabase
      .from("exercises")
      .select("*", { count: "exact", head: true }),
    // Get upcoming classes this week
    supabase
      .from("scheduled_classes")
      .select(`
        *,
        student:users(name, email)
      `)
      .gte("start_time", today.toISOString())
      .lte("start_time", endOfWeek.toISOString())
      .order("start_time", { ascending: true })
      .limit(5),
    // Get recently registered students
    supabase
      .from("users")
      .select("id, name, email, created_at")
      .eq("role", "STUDENT")
      .order("created_at", { ascending: false })
      .limit(5),
    // Count paid classes
    supabase
      .from("scheduled_classes")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "PAID"),
    // Count unpaid classes
    supabase
      .from("scheduled_classes")
      .select("*", { count: "exact", head: true })
      .eq("payment_status", "UNPAID"),
  ]);

  const studentCount = studentCountResult.count || 0;
  const exerciseCount = exerciseCountResult.count || 0;
  const upcomingClasses = upcomingClassesResult.data || [];
  const recentStudentsRaw = recentStudentsResult.data || [];
  const paidCount = paidCountResult.count || 0;
  const unpaidCount = unpaidCountResult.count || 0;

  // Get counts for recent students
  const recentStudents = await Promise.all(
    recentStudentsRaw.map(async (student) => {
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
        ...student,
        _count: {
          assignedExercises: exercisesCount.count || 0,
          scheduledClasses: classesCount.count || 0,
        },
      };
    })
  );

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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name || "Teacher"}! Here&apos;s an overview of your teaching activities.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-muted-foreground">
              Active students enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercises</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exerciseCount}</div>
            <p className="text-xs text-muted-foreground">
              Total exercises created
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
            <CardTitle className="text-sm font-medium">Unpaid Classes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidCount}</div>
            <p className="text-xs text-muted-foreground">
              {paidCount} paid total
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
              <Link href="/dashboard/teacher/calendar">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-4">
                <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No classes scheduled this week.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <Link href="/dashboard/teacher/calendar/schedule">
                    Schedule a class
                  </Link>
                </Button>
              </div>
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
                        {cls.student?.name || cls.student?.email} • {formatDate(new Date(cls.start_time))} at {formatTime(new Date(cls.start_time))}
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

        {/* Recent Students Widget */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Students</CardTitle>
              <CardDescription>Newly registered students</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/teacher/students">
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentStudents.length === 0 ? (
              <div className="text-center py-4">
                <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No students registered yet.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share the registration link with your students.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{student.name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {student._count.assignedExercises} exercises
                      </Badge>
                      <Badge variant="outline">
                        {student._count.scheduledClasses} classes
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to manage your teaching activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/teacher/exercises/new">
                <BookOpen className="mr-2 h-4 w-4" />
                Add Exercise
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/teacher/calendar/schedule">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Class
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/teacher/students">
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
