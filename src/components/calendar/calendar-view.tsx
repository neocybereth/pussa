"use client";

import { useRef, useSyncExternalStore, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, DateSelectArg, EventInput } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  extendedProps?: {
    studentId?: string;
    studentName?: string;
    paymentStatus?: "PAID" | "UNPAID";
    notes?: string;
  };
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  selectable?: boolean;
  initialView?: "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";
  height?: string | number;
}

const emptySubscribe = () => () => {};

export function CalendarView({
  events,
  onEventClick,
  onDateSelect,
  selectable = false,
  initialView = "dayGridMonth",
  height = "auto",
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const updateTitle = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      setCurrentTitle(api.view.title);
    }
  }, []);

  const handlePrev = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.prev();
      updateTitle();
    }
  }, [updateTitle]);

  const handleNext = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.next();
      updateTitle();
    }
  }, [updateTitle]);

  const handleToday = useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.today();
      updateTitle();
    }
  }, [updateTitle]);

  const handleEventClick = (info: EventClickArg) => {
    if (onEventClick) {
      onEventClick(info.event.id);
    }
  };

  const handleDateSelect = (info: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(info.start, info.end);
    }
  };

  const formattedEvents: EventInput[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor:
      event.extendedProps?.paymentStatus === "PAID" ? "#22c55e" : "#f59e0b",
    borderColor:
      event.extendedProps?.paymentStatus === "PAID" ? "#16a34a" : "#d97706",
    extendedProps: event.extendedProps,
  }));

  if (!mounted) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="calendar-wrapper">
      {/* Custom navigation controls */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="flex items-center gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{currentTitle}</h2>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={initialView}
        headerToolbar={{
          left: "",
          center: "",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        datesSet={() => updateTitle()}
        events={formattedEvents}
        eventClick={handleEventClick}
        selectable={selectable}
        select={handleDateSelect}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        height={height}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: "short",
        }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        nowIndicator={true}
        eventDisplay="block"
      />
      <style jsx global>{`
        .calendar-wrapper {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--accent) / 0.3);
          --fc-page-bg-color: hsl(var(--background));
          --fc-neutral-bg-color: hsl(var(--muted));
          --fc-list-event-hover-bg-color: hsl(var(--accent));
        }

        .calendar-wrapper .fc {
          font-family: inherit;
        }

        .calendar-wrapper .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .calendar-wrapper .fc-button {
          font-size: 0.875rem;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
        }

        .calendar-wrapper .fc-button-group > .fc-button {
          border-radius: 0;
        }

        .calendar-wrapper .fc-button-group > .fc-button:first-child {
          border-top-left-radius: 0.375rem;
          border-bottom-left-radius: 0.375rem;
        }

        .calendar-wrapper .fc-button-group > .fc-button:last-child {
          border-top-right-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }

        .calendar-wrapper .fc-event {
          cursor: pointer;
          border-radius: 0.25rem;
          padding: 2px 4px;
          font-size: 0.75rem;
        }

        .calendar-wrapper .fc-event:hover {
          opacity: 0.9;
        }

        .calendar-wrapper .fc-daygrid-day-number {
          padding: 0.5rem;
          font-size: 0.875rem;
        }

        .calendar-wrapper .fc-col-header-cell-cushion {
          padding: 0.5rem;
          font-weight: 500;
        }

        .calendar-wrapper .fc-timegrid-slot {
          height: 2.5rem;
        }

        .calendar-wrapper .fc-timegrid-slot-label-cushion {
          font-size: 0.75rem;
        }

        @media (max-width: 640px) {
          .calendar-wrapper .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }

          .calendar-wrapper .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }

          .calendar-wrapper .fc-button {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
          }

          .calendar-wrapper .fc-toolbar-title {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
