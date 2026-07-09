import type { Meta, StoryObj } from "@storybook/nextjs";

import { WalletConnectCard } from "@/components/wallet/wallet-connect-card";
import { mockWalletConnected } from "@/lib/mocks";

const meta = {
  title: "Wallet/Wallet Connect Card",
  component: WalletConnectCard,
} satisfies Meta<typeof WalletConnectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = { args: mockWalletConnected };
export const Disconnected: Story = { args: { status: "disconnected", walletAddress: null } };
export const Connecting: Story = { args: { status: "connecting", walletAddress: null } };

