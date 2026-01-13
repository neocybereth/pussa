"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { AudioPlayer } from "./audio-player";
import { Edit, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Exercise {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  audioKey: string;
  createdAt: string;
  _count: {
    assignedTo: number;
  };
}

interface ExerciseListProps {
  exercises: Exercise[];
}

export function ExerciseList({ exercises: initialExercises }: ExerciseListProps) {
  const router = useRouter();
  const [exercises, setExercises] = useState(initialExercises);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (exercise: Exercise) => {
    setExerciseToDelete(exercise);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!exerciseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/exercises/${exerciseToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete exercise");
      }

      setExercises(exercises.filter((e) => e.id !== exerciseToDelete.id));
      toast.success("Exercise deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete exercise");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setExerciseToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No exercises yet</p>
        <Button asChild>
          <Link href="/dashboard/teacher/exercises/new">Create your first exercise</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Audio</TableHead>
              <TableHead className="hidden sm:table-cell">Assigned</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{exercise.title}</p>
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {exercise.description}
                      </p>
                    )}
                    <div className="md:hidden mt-2">
                      <AudioPlayer src={exercise.audioUrl} compact />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="max-w-xs">
                    <AudioPlayer src={exercise.audioUrl} compact />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary" className="gap-1">
                    <Users className="h-3 w-3" />
                    {exercise._count.assignedTo}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {formatDate(exercise.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title="Edit exercise"
                    >
                      <Link href={`/dashboard/teacher/exercises/${exercise.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(exercise)}
                      title="Delete exercise"
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exercise</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{exerciseToDelete?.title}&quot;? This action
              cannot be undone and will remove the exercise from all assigned students.
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
