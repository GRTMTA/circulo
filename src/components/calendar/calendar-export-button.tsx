"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "@/lib/calendar";

function generateIcs(events: CalendarEvent[], circleName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Circulo//Calendar//EN",
    `X-WR-CALNAME:${circleName}`,
  ];

  events.forEach((event) => {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + 3600000);

    const format = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@circulo`,
      `DTSTART:${format(start)}`,
      `DTEND:${format(end)}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description}` : "",
      event.memberName ? `ATTENDEE;CN=${event.memberName}` : "",
      "END:VEVENT",
    );
  });

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

function generateCsv(events: CalendarEvent[]): string {
  const header = "Date,Event Type,Member,Amount,Status";
  const rows = events.map((e) =>
    [
      new Date(e.date).toISOString(),
      e.type.replace(/_/g, " "),
      e.memberName ?? "",
      e.amount ?? "",
      e.status ?? "",
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CalendarExportButton({
  events,
  circleName,
}: {
  events: CalendarEvent[];
  circleName: string;
}) {
  const [open, setOpen] = useState(false);

  function exportIcs() {
    const content = generateIcs(events, circleName);
    downloadBlob(content, `${circleName.replace(/\s+/g, "_")}_calendar.ics`, "text/calendar");
    setOpen(false);
    toast.success("Calendar exported as ICS");
  }

  function exportCsv() {
    const content = generateCsv(events);
    downloadBlob(content, `${circleName.replace(/\s+/g, "_")}_calendar.csv`, "text/csv");
    setOpen(false);
    toast.success("Calendar exported as CSV");
  }

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
      >
        <Download className="mr-1.5 size-3.5" />
        Export
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-border bg-white p-1 shadow-lg">
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={exportIcs}
          >
            Export as ICS
          </button>
          <button
            type="button"
            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
            onClick={exportCsv}
          >
            Export as CSV
          </button>
        </div>
      ) : null}
    </div>
  );
}
