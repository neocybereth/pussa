"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CalendarView, CalendarEvent } from "./calendar-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, Trash2 } from "lucide-react";

interface ScheduledClass {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  paymentStatus: "PAID" | "UNPAID";
  notes: string | null;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

interface TeacherCalendarProps {
  initialClasses: ScheduledClass[];
}

export function TeacherCalendar({ initialClasses }: TeacherCalendarProps) {
  const router = useRouter();
  const [classes, setClasses] = useState<ScheduledClass[]>(initialClasses);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingPayment, setIsTogglingPayment] = useState(false);

  const events: CalendarEvent[] = classes.map((c) => ({
    id: c.id,
    title: `${c.title} - ${c.student.name}`,
    start: c.startTime,
    end: c.endTime,
    extendedProps: {
      studentId: c.student.id,
      studentName: c.student.name,
      paymentStatus: c.paymentStatus,
      notes: c.notes || undefined,
    },
  }));

  const handleEventClick = useCallback((eventId: string) => {
    const classData = classes.find((c) => c.id === eventId);
    if (classData) {
      setSelectedClass(classData);
    }
  }, [classes]);

  const handleDateSelect = useCallback((start: Date, end: Date) => {
    // Navigate to schedule form with selected dates
    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    });
    router.push(`/dashboard/teacher/calendar/schedule?${params.toString()}`);
  }, [router]);

  const togglePaymentStatus = async () => {
    if (!selectedClass) return;

    setIsTogglingPayment(true);
    try {
      const newStatus = selectedClass.paymentStatus === "PAID" ? "UNPAID" : "PAID";
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }

      // Update local state
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedClass.id ? { ...c, paymentStatus: newStatus } : c
        )
      );
      setSelectedClass((prev) =>
        prev ? { ...prev, paymentStatus: newStatus } : null
      );
      toast.success(`Payment marked as ${newStatus.toLowerCase()}`);
    } catch {
      toast.error("Failed to update payment status");
    } finally {
      setIsTogglingPayment(false);
    }
  };

  const deleteClass = async () => {
    if (!selectedClass) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete class");
      }

      setClasses((prev) => prev.filter((c) => c.id !== selectedClass.id));
      setSelectedClass(null);
      toast.success("Class deleted successfully");
    } catch {
      toast.error("Failed to delete class");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Class Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView
            events={events}
            onEventClick={handleEventClick}
            onDateSelect={handleDateSelect}
            selectable={true}
            initialView="timeGridWeek"
            height={600}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedClass?.title}</DialogTitle>
            <DialogDescription>
              Class with {selectedClass?.student.name}
            </DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Student</span>
                  <span className="font-medium">{selectedClass.student.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm">{selectedClass.student.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Start</span>
                  <span className="text-sm">{formatDateTime(selectedClass.startTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">End</span>
                  <span className="text-sm">{formatDateTime(selectedClass.endTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment</span>
                  <Badge
                    variant={selectedClass.paymentStatus === "PAID" ? "default" : "secondary"}
                    className={
                      selectedClass.paymentStatus === "PAID"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-amber-500 hover:bg-amber-600"
                    }
                  >
                    {selectedClass.paymentStatus}
                  </Badge>
                </div>
                {selectedClass.notes && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Notes</span>
                    <p className="mt-1 text-sm">{selectedClass.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={togglePaymentStatus}
                  disabled={isTogglingPayment}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  {isTogglingPayment
                    ? "Updating..."
                    : `Mark as ${selectedClass.paymentStatus === "PAID" ? "Unpaid" : "Paid"}`}
                </Button>
                <Button
                  variant="destructive"
                  onClick={deleteClass}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
