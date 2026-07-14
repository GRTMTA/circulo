import type { Meta, StoryObj } from "@storybook/nextjs";

import { agreementRulesFixture } from "../../../.storybook/fixtures";
import { MemberAgreementScreen } from "@/components/agreement/member-agreement-screen";

const meta = {
  title: "Agreement/Member Agreement Screen",
  component: MemberAgreementScreen,
  args: {
    circleId: "circle-story",
    circleName: "Makati Friday Circle",
    rules: agreementRulesFixture,
    collateralAmount: 5,
    contributionAsset: "USDC",
  },
} satisfies Meta<typeof MemberAgreementScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotAccepted: Story = {};
export const Accepted: Story = { args: { accepted: true } };

