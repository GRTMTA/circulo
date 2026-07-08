import type { Meta, StoryObj } from "@storybook/nextjs";

import { Progress, ProgressLabel } from "@/components/ui/progress";

const meta = {
  title: "UI/Progress",
  component: Progress,
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ContributionProgress: Story = {
  args: {
    value: 80,
  },
  render: () => (
    <div className="grid max-w-xl gap-6 p-6">
      {[
        { label: "Collateral posted", value: 80, text: "4 / 5 members" },
        { label: "Current round paid", value: 40, text: "2 / 5 members" },
        { label: "Pool collection", value: 80, text: "40 / 50 USDC" },
      ].map((item) => (
        <Progress key={item.label} value={item.value}>
          <ProgressLabel>{item.label}</ProgressLabel>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {item.text}
          </span>
        </Progress>
      ))}
    </div>
  ),
};
