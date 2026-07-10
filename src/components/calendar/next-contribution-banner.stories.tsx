import type { Meta, StoryObj } from "@storybook/nextjs";

import { NextContributionBanner } from "@/components/calendar/next-contribution-banner";

const meta = {
  title: "Calendar/Next Contribution Banner",
  component: NextContributionBanner,
  args: {
    amount: 10,
    asset: "USDC",
    dueAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    urgency: "normal",
    memberName: "Bea Lim",
    memberAvatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Bea+Lim&backgroundColor=7b3126",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof NextContributionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Soon: Story = {
  args: {
    dueAt: new Date(Date.now() + 3600000).toISOString(),
    urgency: "soon",
  },
};

export const Urgent: Story = {
  args: {
    dueAt: new Date(Date.now() + 600000).toISOString(),
    urgency: "soon",
  },
};

export const Overdue: Story = {
  args: {
    dueAt: new Date(Date.now() - 86400000).toISOString(),
    urgency: "overdue",
  },
};

export const WithPayButton: Story = {
  args: {
    urgency: "soon",
    dueAt: new Date(Date.now() + 7200000).toISOString(),
    onPayNow: () => alert("Pay clicked"),
  },
};

export const OtherMember: Story = {
  args: {
    urgency: "normal",
    memberName: "Carlo Reyes",
    memberAvatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Carlo+Reyes&backgroundColor=d4a843",
  },
};
