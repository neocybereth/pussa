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
import { Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Exercise {
  id: string;
  title: string;
  description: string | null;
}

interface StudentExercise {
  id: string;
  exercise: {
    id: string;
  };
}

interface AssignStudentExercisesDialogProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
}

export function AssignStudentExercisesDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
  onAssigned,
}: AssignStudentExercisesDialogProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assignedExerciseIds, setAssignedExerciseIds] = useState<Set<string>>(new Set());
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all exercises and current student assignments in parallel
      const [exercisesRes, assignmentsRes] = await Promise.all([
        fetch("/api/exercises"),
        fetch(`/api/students/${studentId}/exercises`),
      ]);

      if (!exercisesRes.ok) {
        throw new Error("Failed to fetch exercises");
      }

      if (!assignmentsRes.ok) {
        throw new Error("Failed to fetch assignments");
      }

      const exercisesData = await exercisesRes.json();
      const assignmentsData: StudentExercise[] = await assignmentsRes.json();

      setExercises(exercisesData);

      const assignedIds = new Set<string>(
        assignmentsData.map((a) => a.exercise.id)
      );
      setAssignedExerciseIds(assignedIds);
      setSelectedExerciseIds(new Set<string>(assignedIds));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const handleExerciseToggle = (exerciseId: string) => {
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/students/${studentId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseIds: [...selectedExerciseIds] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update assignments");
      }

      const result = await response.json();

      if (result.added > 0 || result.removed > 0) {
        toast.success(
          `Updated assignments: ${result.added} added, ${result.removed} removed`
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
    [...selectedExerciseIds].some((id) => !assignedExerciseIds.has(id)) ||
    [...assignedExerciseIds].some((id) => !selectedExerciseIds.has(id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assign Exercises
          </DialogTitle>
          <DialogDescription>
            Select exercises to assign to {studentName}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : exercises.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No exercises created yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {exercises.map((exercise) => (
                <label
                  key={exercise.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selectedExerciseIds.has(exercise.id)}
                    onCheckedChange={() => handleExerciseToggle(exercise.id)}
                    disabled={isSaving}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {exercise.title}
                    </p>
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {exercise.description}
                      </p>
                    )}
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
