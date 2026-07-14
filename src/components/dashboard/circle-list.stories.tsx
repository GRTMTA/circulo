import type { Meta, StoryObj } from "@storybook/nextjs";

import { createCirclesListFixture } from "../../../.storybook/fixtures";
import { CircleList } from "@/components/dashboard/circle-list";

const meta = {
  title: "Dashboard/Circle List",
  component: CircleList,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CircleList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { circles: createCirclesListFixture() } };
export const SingleCircle: Story = { args: { circles: createCirclesListFixture(1) } };
export const Empty: Story = { args: { circles: [] } };
export const ManyCircles: Story = { args: { circles: createCirclesListFixture(12) } };

