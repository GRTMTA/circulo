import type { Meta, StoryObj } from "@storybook/nextjs";

import {
  createCreatorDashboardFixture,
  createMemberDashboardFixture,
} from "../../../.storybook/fixtures";
import { DashboardViews } from "@/components/dashboard/dashboard-views";

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
    data: createCreatorDashboardFixture(),
  },
};

export const DraftCreatorCircle: Story = {
  args: {
    data: createCreatorDashboardFixture({
      circle: {
        ...createCreatorDashboardFixture().circle,
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
    data: createCreatorDashboardFixture({
      circle: {
        ...createCreatorDashboardFixture().circle,
        status: "cancelled",
      },
    }),
  },
};

export const ActiveMemberCircle: Story = {
  args: {
    data: createMemberDashboardFixture(),
  },
};
