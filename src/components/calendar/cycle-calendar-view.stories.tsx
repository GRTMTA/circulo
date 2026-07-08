import type { Meta, StoryObj } from "@storybook/nextjs";

import { CycleCalendarView } from "@/components/calendar/cycle-calendar-view";
import { createMockContributions } from "@/lib/mocks/contributions";
import { createMockMembers } from "@/lib/mocks/members";
import { createMockPayouts } from "@/lib/mocks/payouts";
import { createMockRounds } from "@/lib/mocks/cycles";

const baseRounds = createMockRounds();
const basePayouts = createMockPayouts();
const baseContributions = createMockContributions();
const baseMembers = createMockMembers();

const meta = {
  title: "Calendar/Cycle Calendar View",
  component: CycleCalendarView,
  args: {
    rounds: baseRounds,
    payouts: basePayouts,
    contributions: baseContributions,
    members: baseMembers,
    defaultView: "month",
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CycleCalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MonthDefault: Story = {};

export const MonthOverdue: Story = {
  args: {
    rounds: createMockRounds([
      { status: "late" },
    ]),
    contributions: createMockContributions([
      {},
      { status: "late" },
      { status: "missed" },
      { status: "late" },
      { status: "missed" },
    ]),
  },
};

export const WeekView: Story = {
  args: {
    defaultView: "week",
  },
};

export const AgendaView: Story = {
  args: {
    defaultView: "agenda",
  },
};

export const EmptyCalendar: Story = {
  args: {
    rounds: [],
    payouts: [],
    contributions: [],
  },
};

export const MemberView: Story = {
  args: {
    currentMemberId: "member-c",
  },
};

export const WithFilters: Story = {
  args: {
    defaultView: "agenda",
  },
};
