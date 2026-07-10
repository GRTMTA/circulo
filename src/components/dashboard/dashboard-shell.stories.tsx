import type { Meta, StoryObj } from "@storybook/nextjs";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const meta = {
  title: "Dashboard/Dashboard Shell",
  component: DashboardShell,
  args: {
    breadcrumbItems: [{ label: "Makati Friday Circle" }],
    title: "Creator dashboard",
    description:
      "Monitor collateral, contributions, payout readiness, and audit history.",
    children: (
      <Card>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Dashboard shell content appears here.
          </p>
        </CardContent>
      </Card>
    ),
  },
} satisfies Meta<typeof DashboardShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    headerActions: (
      <>
        <Button variant="outline">Export audit log</Button>
        <Button>Invite member</Button>
      </>
    ),
  },
};

export const NestedBreadcrumbs: Story = {
  args: {
    breadcrumbItems: [
      { label: "All Circles", href: "/dashboard" },
      { label: "Makati Friday Circle", href: "/dashboard/circle-makati-friday" },
      { label: "Calendar" },
    ],
    title: "Cycle Calendar",
  },
};

export const EmptyContent: Story = {
  args: {
    title: "No circle dashboard yet",
    description: "The authenticated user has no creator or member circles.",
    children: (
      <EmptyState
        title="No circles found"
        description="Create or accept an invite-only circle to populate this dashboard."
      />
    ),
  },
};
