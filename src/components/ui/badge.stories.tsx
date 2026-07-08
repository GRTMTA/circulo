import type { Meta, StoryObj } from "@storybook/nextjs";

import { Badge } from "@/components/ui/badge";

const statuses = [
  "draft",
  "active",
  "delayed",
  "completed",
  "disputed",
  "cancelled",
  "accepted",
  "pending",
  "posted",
  "late",
  "missed",
  "restricted",
] as const;

const meta = {
  title: "UI/Badge",
  component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StatusMatrix: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-wrap gap-3 p-6">
      {statuses.map((status) => (
        <Badge
          key={status}
          variant={
            ["late", "missed", "disputed", "cancelled", "restricted"].includes(status)
              ? "destructive"
              : ["active", "completed", "accepted", "posted"].includes(status)
                ? "default"
                : ["pending", "draft"].includes(status)
                  ? "secondary"
                  : "outline"
          }
        >
          {status.replaceAll("_", " ")}
        </Badge>
      ))}
    </div>
  ),
};
