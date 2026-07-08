import type { Meta, StoryObj } from "@storybook/nextjs";

import { CycleCalendarView } from "@/components/calendar/cycle-calendar-view";
import { mockCalendarEvents } from "@/lib/mocks";

const meta = {
  title: "Calendar/Cycle Calendar View",
  component: CycleCalendarView,
  args: {
    events: mockCalendarEvents,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CycleCalendarView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CurrentMonth: Story = {};
export const EmptyMonth: Story = { args: { events: [] } };
export const ManyEvents: Story = { args: { events: [...mockCalendarEvents, ...mockCalendarEvents] } };

