import type { Meta, StoryObj } from "@storybook/nextjs";

import { EmergencyPauseDialog } from "@/components/emergency/emergency-pause-dialog";

const meta = {
  title: "Emergency/Emergency Pause Dialog",
  component: EmergencyPauseDialog,
  args: {
    circleName: "Makati Friday Circle",
    open: true,
  },
} satisfies Meta<typeof EmergencyPauseDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultOpen: Story = {};

