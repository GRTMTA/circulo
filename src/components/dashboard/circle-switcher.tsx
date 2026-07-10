"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, CircleDot } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CircleListItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

function inferCircleId(pathname: string) {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match?.[1] === "create" ? undefined : match?.[1];
}

export function CircleSwitcher({
  circles,
  currentCircleId,
  collapsed = false,
}: {
  circles: CircleListItem[];
  currentCircleId?: string;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const inferredCircleId = currentCircleId ?? inferCircleId(pathname);
  const currentCircle = useMemo(
    () => circles.find((circle) => circle.id === inferredCircleId) ?? circles[0],
    [circles, inferredCircleId]
  );

  if (circles.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between rounded-2xl border-[var(--color-border-muted)] bg-white text-left",
              collapsed && "size-11 justify-center p-0"
            )}
          />
        }
      >
        <span className={cn("flex min-w-0 items-center gap-2", collapsed && "sr-only")}>
          <CircleDot className="size-4 text-primary" />
          <span className="truncate">{currentCircle?.name ?? "Select circle"}</span>
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground", collapsed && "hidden")} />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="grid gap-1">
          {circles.map((circle) => (
            <button
              key={circle.id}
              type="button"
              className={cn(
                "rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30",
                circle.id === currentCircle?.id && "bg-[var(--color-primary-muted)] text-primary"
              )}
              onClick={() => router.push(`/dashboard/${circle.id}`)}
            >
              <span className="block font-semibold">{circle.name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {circle.role} · {circle.status}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

