import type { Meta, StoryObj } from "@storybook/nextjs";

import { ContributionReminderBanner } from "@/components/reminders/contribution-reminder-banner";

// Mock date to ensure it is due soon (e.g. 2 hours from now)
const twoHoursFromNow = new Date();
twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

const meta = {
  title: "Reminders/Contribution Reminder Banner",
  component: ContributionReminderBanner,
  args: {
    contributionAmount: 10,
    contributionAsset: "USDC",
    currentRound: {
      id: "round-1",
      roundNumber: 1,
      dueAt: twoHoursFromNow.toISOString(),
      payoutMemberId: "member-2",
      expectedAmount: 50,
      collectedAmount: 0,
      status: "active",
    },
    myContribution: {
      id: "contribution-1",
      roundId: "round-1",
      memberId: "member-1",
      amountDue: 10,
      status: "pending",
      txHash: null,
      paidAt: null,
      slashedAmount: 0,
      slashedAt: null,
      remindersSent: 0,
    },
  },
} satisfies Meta<typeof ContributionReminderBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DueSoon: Story = {};

export const DueNow: Story = {
  args: {
    currentRound: {
      id: "round-1",
      roundNumber: 1,
      dueAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      payoutMemberId: "member-2",
      expectedAmount: 50,
      collectedAmount: 0,
      status: "late",
    },
    myContribution: {
      id: "contribution-1",
      roundId: "round-1",
      memberId: "member-1",
      amountDue: 10,
      status: "late",
      txHash: null,
      paidAt: null,
      slashedAmount: 0,
      slashedAt: null,
      remindersSent: 0,
    },
  },
};

export const Overdue: Story = {
  args: {
    currentRound: {
      id: "round-1",
      roundNumber: 1,
      dueAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      payoutMemberId: "member-2",
      expectedAmount: 50,
      collectedAmount: 0,
      status: "grace_period",
    },
    myContribution: {
      id: "contribution-1",
      roundId: "round-1",
      memberId: "member-1",
      amountDue: 10,
      status: "grace_period",
      txHash: null,
      paidAt: null,
      slashedAmount: 0,
      slashedAt: null,
      remindersSent: 0,
    },
  },
};
