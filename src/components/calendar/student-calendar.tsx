"use client";

import { useState, useCallback } from "react";
import { CalendarView, CalendarEvent } from "./calendar-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScheduledClass {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  paymentStatus: "PAID" | "UNPAID";
  notes: string | null;
}

interface StudentCalendarProps {
  initialClasses: ScheduledClass[];
}

export function StudentCalendar({ initialClasses }: StudentCalendarProps) {
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);

  const events: CalendarEvent[] = initialClasses.map((c) => ({
    id: c.id,
    title: c.title,
    start: c.startTime,
    end: c.endTime,
    extendedProps: {
      paymentStatus: c.paymentStatus,
      notes: c.notes || undefined,
    },
  }));

  const handleEventClick = useCallback((eventId: string) => {
    const classData = initialClasses.find((c) => c.id === eventId);
    if (classData) {
      setSelectedClass(classData);
    }
  }, [initialClasses]);

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
          <CardTitle>My Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarView
            events={events}
            onEventClick={handleEventClick}
            selectable={false}
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
              Scheduled class details
            </DialogDescription>
          </DialogHeader>

          {selectedClass && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Start</span>
                  <span className="text-sm">{formatDateTime(selectedClass.startTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">End</span>
                  <span className="text-sm">{formatDateTime(selectedClass.endTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
