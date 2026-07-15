import type { Meta, StoryObj } from "@storybook/nextjs";

import { WalletConnectCard } from "@/components/wallet/wallet-connect-card";
import { WalletProvider } from "@/components/wallet/wallet-context";

const meta = {
  title: "Wallet/Wallet Connect Card",
  component: WalletConnectCard,
  decorators: [
    (Story) => (
      <WalletProvider>
        <Story />
      </WalletProvider>
    ),
  ],
} satisfies Meta<typeof WalletConnectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { asset: "USDC" } };
