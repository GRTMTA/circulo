"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultPreferences = {
  contributionDue: true,
  payout: true,
  statusChanges: true,
  memberUpdates: false,
};

export function ReminderSettingsPanel({
  preferences = defaultPreferences,
}: {
  preferences?: typeof defaultPreferences;
}) {
  const [settings, setSettings] = useState(preferences);

  return (
    <Card>
      <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
      <CardContent className="grid gap-3">
        {Object.entries(settings).map(([key, value]) => (
          <label key={key} className="flex items-center justify-between rounded-xl border border-border bg-white p-3 text-sm font-semibold">
            {key.replace(/([A-Z])/g, " $1")}
            <input
              type="checkbox"
              checked={value}
              onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.checked }))}
              className="size-4 accent-[var(--color-primary-default)]"
            />
          </label>
        ))}
        <Button onClick={() => toast.success("Reminder preferences saved")}>Save Preferences</Button>
      </CardContent>
    </Card>
  );
}

