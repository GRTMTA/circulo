"use client";

import { useState } from "react";
import { Bell, BellOff, Clock, Info } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface ReminderPreferences {
  contributionDueSoon: boolean;
  contributionDueNow: boolean;
  contributionOverdue: boolean;
  payoutReady: boolean;
  gracePeriodWarning: boolean;
  circleStatusChanges: boolean;
}

const DEFAULT_PREFERENCES: ReminderPreferences = {
  contributionDueSoon: true,
  contributionDueNow: true,
  contributionOverdue: true,
  payoutReady: true,
  gracePeriodWarning: true,
  circleStatusChanges: true,
};

const REMINDER_CATEGORIES: {
  key: keyof ReminderPreferences;
  label: string;
  description: string;
  critical?: boolean;
}[] = [
  {
    key: "contributionDueSoon",
    label: "Due soon (24h before)",
    description: "Heads-up one day before your contribution deadline.",
  },
  {
    key: "contributionDueNow",
    label: "Due now (1h before)",
    description: "Final nudge one hour before the deadline.",
    critical: true,
  },
  {
    key: "contributionOverdue",
    label: "Overdue alert",
    description: "Notification when your contribution is past due and grace period starts.",
    critical: true,
  },
  {
    key: "gracePeriodWarning",
    label: "Grace period ending",
    description: "Warning before your collateral gets slashed.",
    critical: true,
  },
  {
    key: "payoutReady",
    label: "Payout received",
    description: "Notification when your payout round arrives.",
  },
  {
    key: "circleStatusChanges",
    label: "Circle status changes",
    description: "When the circle is paused, resumed, or cancelled.",
  },
];

export function ReminderSettingsPanel({
  preferences = DEFAULT_PREFERENCES,
  reminderScheduleHours = [24, 1],
  onSave,
}: {
  preferences?: ReminderPreferences;
  reminderScheduleHours?: number[];
  onSave?: (prefs: ReminderPreferences) => Promise<void>;
}) {
  const [settings, setSettings] = useState<ReminderPreferences>(preferences);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(settings);
      }
      toast.success("Reminder preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  const enabledCount = Object.values(settings).filter(Boolean).length;

  return (
    <div className="grid gap-6">
      <Alert>
        <Clock className="size-4" />
        <AlertTitle>Reminder schedule</AlertTitle>
        <AlertDescription>
          This circle sends reminders{" "}
          <strong>
            {reminderScheduleHours
              .sort((a, b) => b - a)
              .map((h) => (h >= 24 ? `${h / 24} day${h >= 48 ? "s" : ""}` : `${h} hour${h > 1 ? "s" : ""}`))
              .join(" and ")}
          </strong>{" "}
          before each contribution deadline. Reminders help you avoid accidental
          defaults and collateral slashing.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-[var(--color-primary-default)]" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
            <Badge variant="outline">
              {enabledCount} / {REMINDER_CATEGORIES.length} active
            </Badge>
          </div>
          <CardDescription>
            Choose which reminders you receive. Critical alerts (marked) cannot be fully
            disabled — they always appear in your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {REMINDER_CATEGORIES.map((category) => (
            <label
              key={category.key}
              className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 transition-colors hover:bg-[var(--color-background-muted)] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={settings[category.key]}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    [category.key]: event.target.checked,
                  }))
                }
                className="mt-1 size-4 accent-[var(--color-primary-default)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{category.label}</span>
                  {category.critical ? (
                    <Badge variant="destructive" className="text-[0.6rem] px-1.5 py-0">
                      Critical
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              {settings[category.key] ? (
                <Bell className="mt-1 size-4 shrink-0 text-[var(--color-primary-default)]" />
              ) : (
                <BellOff className="mt-1 size-4 shrink-0 text-muted-foreground" />
              )}
            </label>
          ))}
          <Button className="mt-3" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="size-5 text-[var(--color-text-alternative)]" />
            <CardTitle>How reminders work</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Reminders are generated automatically based on the circle's schedule.
            They fire at the configured intervals before each round's due date.
          </p>
          <p>
            If you haven't paid when a reminder fires, you'll see a notification in your
            dashboard. Once you pay, no further reminders are sent for that round.
          </p>
          <p>
            <strong>Critical reminders</strong> (overdue and grace period) always appear
            in your dashboard regardless of your preferences, because they signal
            imminent collateral action.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
