import type { Meta, StoryObj } from "@storybook/nextjs";

import { ContributionReminderBanner } from "@/components/reminders/contribution-reminder-banner";

const meta = {
  title: "Reminders/Contribution Reminder Banner",
  component: ContributionReminderBanner,
  args: {
    amount: 10,
    asset: "USDC",
    dueAt: "2026-07-09T12:00:00.000Z",
    urgency: "due_soon",
  },
} satisfies Meta<typeof ContributionReminderBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DueSoon: Story = {};
export const DueNow: Story = { args: { urgency: "due_now" } };
export const Overdue: Story = { args: { urgency: "overdue" } };

