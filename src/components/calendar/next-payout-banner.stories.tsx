import type { Meta, StoryObj } from "@storybook/nextjs";

import { NextPayoutBanner } from "@/components/calendar/next-payout-banner";

const meta = {
  title: "Calendar/Next Payout Banner",
  component: NextPayoutBanner,
  args: {
    recipientName: "Bea Lim",
    recipientAvatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Bea+Lim&backgroundColor=7b3126",
    amount: 50,
    asset: "USDC",
    expectedAt: new Date(Date.now() + 86400000).toISOString(),
    status: "scheduled",
  },
  parameters: { layout: "padded" },
} satisfies Meta<typeof NextPayoutBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scheduled: Story = {};

export const Ready: Story = {
  args: {
    status: "ready",
    expectedAt: new Date(Date.now() + 3600000).toISOString(),
  },
};

export const Paid: Story = {
  args: {
    status: "paid",
    expectedAt: new Date(Date.now() - 86400000).toISOString(),
  },
};

export const CurrentUserRecipient: Story = {
  args: {
    status: "ready",
    isCurrentUserRecipient: true,
    expectedAt: new Date(Date.now() + 7200000).toISOString(),
  },
};

export const Delayed: Story = {
  args: {
    status: "delayed",
    expectedAt: new Date(Date.now() - 86400000).toISOString(),
    recipientName: "Carlo Reyes",
    recipientAvatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Carlo+Reyes&backgroundColor=d4a843",
  },
};

export const Disputed: Story = {
  args: {
    status: "disputed",
    expectedAt: new Date(Date.now() - 86400000).toISOString(),
    recipientName: "Enzo Tan",
    recipientAvatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Enzo+Tan&backgroundColor=8b5e9e",
  },
};
