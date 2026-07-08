import { Badge } from "@/components/ui/badge";

export function GracePeriodTimeline({
  dueAt,
  graceEndAt,
  slashAt,
  status,
}: {
  dueAt: string;
  graceEndAt: string;
  slashAt: string;
  status: "due" | "grace" | "slashed";
}) {
  const steps = [
    ["Due Time", dueAt],
    ["Grace Period", graceEndAt],
    ["Slash Time", slashAt],
    ["Restricted", slashAt],
  ];

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-white p-4">
      <Badge variant={status === "slashed" ? "destructive" : status === "grace" ? "outline" : "secondary"}>{status}</Badge>
      <div className="grid gap-3 md:grid-cols-4">
        {steps.map(([label, value]) => (
          <div key={label} className="border-t border-border pt-3">
            <p className="font-semibold">{label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{new Date(value).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

