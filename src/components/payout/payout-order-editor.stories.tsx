import type { Meta, StoryObj } from "@storybook/nextjs";

import { PayoutOrderEditor } from "@/components/payout/payout-order-editor";
import { createMockMembers } from "@/lib/mocks";

const meta = {
  title: "Payout/Payout Order Editor",
  component: PayoutOrderEditor,
  args: {
    members: createMockMembers(),
    locked: false,
  },
} satisfies Meta<typeof PayoutOrderEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Editable: Story = {};
export const Locked: Story = { args: { locked: true } };
export const Empty: Story = { args: { members: [] } };

