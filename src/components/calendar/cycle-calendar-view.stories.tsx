import type { Meta, StoryObj } from "@storybook/nextjs";

import {
  createContributionsFixture,
  createMembersFixture,
  createPayoutsFixture,
  createRoundsFixture,
} from "../../../.storybook/fixtures";
import { CycleCalendarView } from "@/components/calendar/cycle-calendar-view";

const baseRounds = createRoundsFixture();
const basePayouts = createPayoutsFixture();
const baseContributions = createContributionsFixture();
const baseMembers = createMembersFixture();

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
    rounds: createRoundsFixture([
      { status: "late" },
    ]),
    contributions: createContributionsFixture([
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
