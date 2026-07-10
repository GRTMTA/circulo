import type { Meta, StoryObj } from "@storybook/nextjs";

import { CircleList } from "@/components/dashboard/circle-list";
import { createCirclesListMock } from "@/lib/mocks";

const meta = {
  title: "Dashboard/Circle List",
  component: CircleList,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CircleList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { circles: createCirclesListMock() } };
export const SingleCircle: Story = { args: { circles: createCirclesListMock(1) } };
export const Empty: Story = { args: { circles: [] } };
export const ManyCircles: Story = { args: { circles: createCirclesListMock(12) } };

