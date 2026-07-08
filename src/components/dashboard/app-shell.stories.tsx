import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  CalendarDays,
  FileClock,
  LayoutDashboard,
  PiggyBank,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { AppShell, type AppShellNavigationGroup } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCirclesListMock } from "@/lib/mocks";

const navigation: AppShellNavigationGroup[] = [
  {
    heading: "Creator",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard, match: "exact" },
      { label: "Members", href: "/dashboard/members", icon: UsersRound },
      { label: "Contributions", href: "/dashboard/contributions", icon: PiggyBank },
    ],
  },
  {
    heading: "Trust",
    items: [
      { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
      { label: "Protection", href: "/dashboard/protection", icon: ShieldCheck },
      { label: "Audit Log", href: "/dashboard/audit", icon: FileClock },
    ],
  },
];

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
    navigation,
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
    circles: createCirclesListMock(),
  },
};

export const ManyCircles: Story = {
  args: {
    circles: createCirclesListMock(12),
  },
};
