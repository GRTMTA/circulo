import type { Meta, StoryObj } from "@storybook/nextjs";

import { CreateWizardShell } from "@/components/create/create-wizard-shell";

const meta = {
  title: "Create/Create Wizard Shell",
  component: CreateWizardShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CreateWizardShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basics: Story = {};
export const PopulatedFlow: Story = {};

