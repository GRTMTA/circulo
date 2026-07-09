import type { Meta, StoryObj } from "@storybook/nextjs";

import { DashboardViews } from "@/components/dashboard/dashboard-views";
import {
  createCreatorDashboardMock,
  createMemberDashboardMock,
} from "@/lib/mocks";

const meta = {
  title: "Dashboard/Dashboard Views",
  component: DashboardViews,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof DashboardViews>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ActiveCreatorCircle: Story = {
  args: {
    data: createCreatorDashboardMock(),
  },
};

export const DraftCreatorCircle: Story = {
  args: {
    data: createCreatorDashboardMock({
      circle: createCreatorDashboardMock().circle && {
        ...createCreatorDashboardMock().circle,
        status: "draft",
        settingsLocked: false,
        payoutOrderLocked: false,
        rulesLocked: false,
      },
    }),
  },
};

export const CancelledCreatorCircle: Story = {
  args: {
    data: createCreatorDashboardMock({
      circle: {
        ...createCreatorDashboardMock().circle,
        status: "cancelled",
      },
    }),
  },
};

export const ActiveMemberCircle: Story = {
  args: {
    data: createMemberDashboardMock(),
  },
};
