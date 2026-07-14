import type { Meta, StoryObj } from "@storybook/nextjs";

import { connectedWalletFixture } from "../../../.storybook/fixtures";
import { WalletConnectCard } from "@/components/wallet/wallet-connect-card";

const meta = {
  title: "Wallet/Wallet Connect Card",
  component: WalletConnectCard,
} satisfies Meta<typeof WalletConnectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = { args: connectedWalletFixture };
export const Disconnected: Story = { args: { walletAddress: null } };

