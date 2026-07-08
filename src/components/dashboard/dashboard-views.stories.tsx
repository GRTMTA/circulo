import type { Meta, StoryObj } from "@storybook/nextjs";

import { DashboardViews } from "@/components/dashboard/dashboard-views";
import {
  createCreatorDashboardMock,
  createEmptyDashboardMock,
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

export const CreatorDashboard: Story = {
  args: {
    data: createCreatorDashboardMock(),
  },
};

export const MemberDashboard: Story = {
  args: {
    data: createMemberDashboardMock(),
  },
};

export const EmptyState: Story = {
  args: {
    data: createEmptyDashboardMock(true),
  },
};

export const SupabaseUnconfigured: Story = {
  args: {
    data: createEmptyDashboardMock(false),
  },
};
