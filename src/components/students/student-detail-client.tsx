"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/exercises/audio-player";
import { AssignStudentExercisesDialog } from "@/components/students/assign-student-exercises-dialog";
import {
  ArrowLeft,
  Mail,
  Calendar,
  BookOpen,
  DollarSign,
  Clock,
  Plus,
} from "lucide-react";

interface Exercise {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string | null;
}

interface StudentExercise {
  id: string;
  assignedAt: Date;
  notes: string | null;
  exercise: Exercise;
}

interface ScheduledClass {
  id: string;
  title: string | null;
  startTime: Date;
  endTime: Date;
  paymentStatus: "PAID" | "UNPAID";
  notes: string | null;
}

interface Student {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
  assignedExercises: StudentExercise[];
  scheduledClasses: ScheduledClass[];
  _count: {
    assignedExercises: number;
    scheduledClasses: number;
  };
}

interface StudentDetailClientProps {
  student: Student;
}

export function StudentDetailClient({ student }: StudentDetailClientProps) {
  const router = useRouter();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const paidClasses = student.scheduledClasses.filter(
    (c) => c.paymentStatus === "PAID"
  ).length;
  const unpaidClasses = student.scheduledClasses.filter(
    (c) => c.paymentStatus === "UNPAID"
  ).length;

  const handleAssigned = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/teacher/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {student.name || "Unnamed Student"}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {student.email}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercises</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student._count.assignedExercises}</div>
            <p className="text-xs text-muted-foreground">assigned exercises</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student._count.scheduledClasses}</div>
            <p className="text-xs text-muted-foreground">scheduled classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidClasses}</div>
            <p className="text-xs text-muted-foreground">paid classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{unpaidClasses}</div>
            <p className="text-xs text-muted-foreground">unpaid classes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Exercises */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Assigned Exercises</CardTitle>
                <CardDescription>
                  Exercises assigned to this student
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {student.assignedExercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exercises assigned yet
              </p>
            ) : (
              <div className="space-y-4">
                {student.assignedExercises.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">
                          {assignment.exercise.title}
                        </h4>
                        {assignment.exercise.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {assignment.exercise.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {formatDate(assignment.assignedAt)}
                      </Badge>
                    </div>
                    {assignment.exercise.audioUrl && (
                      <AudioPlayer
                        src={assignment.exercise.audioUrl}
                        compact
                      />
                    )}
                    {assignment.notes && (
                      <p className="text-sm text-muted-foreground italic border-l-2 pl-3">
                        {assignment.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Classes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Classes</CardTitle>
            <CardDescription>
              Last 10 scheduled classes for this student
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.scheduledClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No classes scheduled yet
              </p>
            ) : (
              <div className="space-y-3">
                {student.scheduledClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">
                        {cls.title || "Untitled Class"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(cls.startTime)}
                      </p>
                      {cls.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {cls.notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={cls.paymentStatus === "PAID" ? "default" : "secondary"}
                      className={
                        cls.paymentStatus === "PAID"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {cls.paymentStatus}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm">{student.name || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm">{student.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Joined</dt>
              <dd className="text-sm">{formatDate(student.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Student ID</dt>
              <dd className="text-sm font-mono text-xs">{student.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Assign Exercises Dialog */}
      <AssignStudentExercisesDialog
        studentId={student.id}
        studentName={student.name || "this student"}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onAssigned={handleAssigned}
      />
    </div>
  );
}
