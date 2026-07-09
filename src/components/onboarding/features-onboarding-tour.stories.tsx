import type { Meta, StoryObj } from "@storybook/nextjs";

import { FeaturesOnboardingTour } from "@/components/onboarding/features-onboarding-tour";

const meta = {
  title: "Onboarding/Features Onboarding Tour",
  component: FeaturesOnboardingTour,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FeaturesOnboardingTour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {};

