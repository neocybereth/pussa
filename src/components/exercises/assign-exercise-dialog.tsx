"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string | null;
  email: string;
}

interface AssignExerciseDialogProps {
  exerciseId: string;
  exerciseTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
}

export function AssignExerciseDialog({
  exerciseId,
  exerciseTitle,
  open,
  onOpenChange,
  onAssigned,
}: AssignExerciseDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedStudentIds, setAssignedStudentIds] = useState<Set<string>>(new Set());
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all students and current assignments in parallel
      const [studentsRes, assignmentsRes] = await Promise.all([
        fetch("/api/students"),
        fetch(`/api/exercises/${exerciseId}/assign`),
      ]);

      if (!studentsRes.ok) {
        throw new Error("Failed to fetch students");
      }

      if (!assignmentsRes.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const studentsData = await studentsRes.json();
      const assignmentsData = await assignmentsRes.json();

      setStudents(studentsData);

      const assignedIds = new Set<string>(
        assignmentsData.assignedStudents.map((s: Student) => s.id)
      );
      setAssignedStudentIds(assignedIds);
      setSelectedStudentIds(new Set<string>(assignedIds));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find students to add and remove
      const toAdd = [...selectedStudentIds].filter(
        (id) => !assignedStudentIds.has(id)
      );
      const toRemove = [...assignedStudentIds].filter(
        (id) => !selectedStudentIds.has(id)
      );

      // Perform additions
      if (toAdd.length > 0) {
        const addRes = await fetch(`/api/exercises/${exerciseId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: toAdd }),
        });

        if (!addRes.ok) {
          const data = await addRes.json();
          throw new Error(data.error || "Failed to assign students");
        }
      }

      // Perform removals
      for (const studentId of toRemove) {
        const removeRes = await fetch(`/api/exercises/${exerciseId}/assign`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        if (!removeRes.ok) {
          const data = await removeRes.json();
          throw new Error(data.error || "Failed to remove assignment");
        }
      }

      const changes = toAdd.length + toRemove.length;
      if (changes > 0) {
        toast.success(
          `Updated assignments: ${toAdd.length} added, ${toRemove.length} removed`
        );
      } else {
        toast.info("No changes made");
      }

      onAssigned?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update assignments"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    [...selectedStudentIds].some((id) => !assignedStudentIds.has(id)) ||
    [...assignedStudentIds].some((id) => !selectedStudentIds.has(id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Exercise
          </DialogTitle>
          <DialogDescription>
            Select students to assign &quot;{exerciseTitle}&quot; to.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No students registered yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {students.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedStudentIds.has(student.id)}
                    onCheckedChange={() => handleStudentToggle(student.id)}
                    disabled={isSaving}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {student.name || "Unnamed"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {student.email}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
