import type { Meta, StoryObj } from "@storybook/nextjs";
import { CalendarDays, LockKeyhole, PiggyBank, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const meta = {
  title: "UI/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PoolOverviewCards: Story = {
  render: () => (
    <div className="grid max-w-5xl gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Status", value: "Active", detail: "Pool verified", icon: ShieldCheck },
        { label: "Collateral", value: "4 / 5", detail: "One member pending", icon: LockKeyhole },
        { label: "Collected", value: "40 / 50 USDC", detail: "Round 2", icon: PiggyBank },
        { label: "Next Due", value: "12h", detail: "24h cycle", icon: CalendarDays },
      ].map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} size="sm">
            <CardHeader>
              <CardTitle className="text-base">
                <Icon className="size-4 text-primary" />
                {item.label}
              </CardTitle>
              <CardDescription>{item.detail}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  ),
};
