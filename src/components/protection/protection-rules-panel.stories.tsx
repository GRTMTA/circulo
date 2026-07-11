import type { Meta, StoryObj } from "@storybook/nextjs";

import { ProtectionRulesPanel } from "@/components/protection/protection-rules-panel";

const meta = {
  title: "Protection/Protection Rules Panel",
  component: ProtectionRulesPanel,
} satisfies Meta<typeof ProtectionRulesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllClear: Story = {};
export const WithWarning: Story = {
  args: {
    protection: {
      gracePeriodHours: 4,
      slashPercentage: 100,
      warningThreshold: 2,
      members: [{ name: "Carlo Reyes", status: "warning", lateCount: 1 }],
    },
  },
};
export const Restricted: Story = {
  args: {
    protection: {
      gracePeriodHours: 4,
      slashPercentage: 100,
      warningThreshold: 2,
      members: [{ name: "Enzo Tan", status: "restricted", lateCount: 2 }],
    },
  },
};

