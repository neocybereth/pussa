"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, Trash2, BookOpen, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AddStudentDialog } from "./add-student-dialog";

interface Student {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  _count: {
    assignedExercises: number;
    scheduledClasses: number;
  };
}

interface StudentListProps {
  students: Student[];
}

export function StudentList({ students: initialStudents }: StudentListProps) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/students/${studentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete student");
      }

      setStudents(students.filter((s) => s.id !== studentToDelete.id));
      toast.success("Student deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete student");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleStudentAdded = (student: Student) => {
    setStudents((prev) => [...prev, student].sort((a, b) => 
      (a.name || "").localeCompare(b.name || "")
    ));
    router.refresh();
  };

  if (students.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <AddStudentDialog onStudentAdded={handleStudentAdded} />
        </div>
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground mb-4">No students registered yet</p>
          <p className="text-sm text-muted-foreground">
            Add a student using the button above, or they can register at the{" "}
            <Link href="/register" className="text-primary hover:underline">
              registration page
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <p className="text-sm text-muted-foreground">
            {filteredStudents.length} of {students.length} students
          </p>
          <AddStudentDialog onStudentAdded={handleStudentAdded} />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 border rounded-md">
          <p className="text-muted-foreground">No students match your search</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Exercises</TableHead>
                <TableHead className="hidden md:table-cell">Classes</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{student.name || "No name"}</p>
                      <p className="text-sm text-muted-foreground sm:hidden">
                        {student.email}
                      </p>
                      <div className="flex gap-2 md:hidden">
                        <Badge variant="secondary" className="gap-1">
                          <BookOpen className="h-3 w-3" />
                          {student._count.assignedExercises}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {student._count.scheduledClasses}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {student.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="gap-1">
                      <BookOpen className="h-3 w-3" />
                      {student._count.assignedExercises}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {student._count.scheduledClasses}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {formatDate(student.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        title="View student"
                      >
                        <Link href={`/dashboard/teacher/students/${student.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(student)}
                        title="Delete student"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {studentToDelete?.name || studentToDelete?.email}?
              This action cannot be undone and will remove all their exercise assignments and
              scheduled classes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
