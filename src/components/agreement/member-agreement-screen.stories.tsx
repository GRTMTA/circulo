import type { Meta, StoryObj } from "@storybook/nextjs";

import { MemberAgreementScreen } from "@/components/agreement/member-agreement-screen";
import { mockAgreementRules } from "@/lib/mocks";

const meta = {
  title: "Agreement/Member Agreement Screen",
  component: MemberAgreementScreen,
  args: {
    circleName: "Makati Friday Circle",
    rules: mockAgreementRules,
  },
} satisfies Meta<typeof MemberAgreementScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotAccepted: Story = {};
export const Accepted: Story = { args: { accepted: true } };

