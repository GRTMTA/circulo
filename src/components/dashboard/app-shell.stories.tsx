import type { Meta, StoryObj } from "@storybook/nextjs";

import { createCirclesListFixture } from "../../../.storybook/fixtures";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ShellContent() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {["Pool health", "Collateral", "Next payout"].map((title) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Storybook layout content for Circulo dashboard navigation.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const meta = {
  title: "Dashboard/App Shell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    brand: {
      title: "Circulo",
      href: "/dashboard",
      full: <span className="font-heading text-xl">Circulo</span>,
      compact: <span className="font-heading text-lg">C</span>,
    },
    user: {
      name: "Ari Santos",
      email: "ari@example.com",
      badge: "Pool creator",
      description: "Private savings circle operator.",
    },
    notificationCount: 3,
    children: <ShellContent />,
  },
} satisfies Meta<typeof AppShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Expanded: Story = {};

export const Collapsed: Story = {
  args: {
    defaultCollapsed: true,
  },
};

export const WithHeaderActions: Story = {
  args: {
    headerActions: (
      <Button size="sm" variant="outline">
        Invite member
      </Button>
    ),
  },
};

export const WithCircleSwitcher: Story = {
  args: {
    circles: createCirclesListFixture(),
  },
};

export const ManyCircles: Story = {
  args: {
    circles: createCirclesListFixture(12),
  },
};
