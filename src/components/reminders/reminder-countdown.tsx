"use client";

import { useEffect, useState } from "react";

export function ReminderCountdown({
  dueAt,
  onExpired,
}: {
  dueAt: string;
  onExpired?: () => void;
}) {
  const [remaining, setRemaining] = useState(() => new Date(dueAt).getTime() - Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = new Date(dueAt).getTime() - Date.now();
      setRemaining(next);
      if (next <= 0) onExpired?.();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [dueAt, onExpired]);

  const totalSeconds = Math.max(0, Math.floor(remaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className="font-mono text-sm font-semibold tabular-nums">
      {hours}h {minutes}m {seconds}s until contribution is due
    </span>
  );
}

