"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/dashboard/actions";
import type { NotificationWithCircle } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

/**
 * Header notification center backed by member_notifications (issue #11). Lists
 * lifecycle signals — due soon, grace period, slashed, payout received — with
 * unread counts and mark-as-read, so the bell is functional instead of static.
 */
export function NotificationCenter({
  notifications,
}: {
  notifications: NotificationWithCircle[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);

  const unreadCount = items.filter((n) => !n.readAt).length;

  async function handleOpen(open: boolean) {
    if (!open) router.refresh();
  }

  async function markOne(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    await markNotificationReadAction(id);
  }

  async function markAll() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    await markAllNotificationsReadAction();
  }

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger
        nativeButton
        aria-label="Notifications"
        data-onboarding="notifications"
        className="relative flex size-11 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-[var(--color-background-muted)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-muted)]"
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-[var(--color-error-default)] px-1 text-[11px] font-bold text-[var(--color-error-inverse)]">
            {unreadCount}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-[var(--color-border-muted)] px-4 py-3">
          <p className="font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAll}>
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y divide-[var(--color-border-muted)]">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.circleId ? `/dashboard/${n.circleId}` : "/dashboard"}
                    onClick={() => !n.readAt && markOne(n.id)}
                    className={cn(
                      "block px-4 py-3 transition-colors hover:bg-[var(--color-background-muted)]/40",
                      !n.readAt && "bg-[var(--color-primary-muted)]/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">{n.title}</p>
                      {!n.readAt ? (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--color-primary-default)]" />
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {n.circleName} ·{" "}
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
