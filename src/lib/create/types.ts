export interface CreateBasicsState {
  name: string;
  contributionAmount: number;
  contributionAsset: "USDC" | "USDT" | "XLM";
  intervalSeconds: number;
  memberCount: number;
}

export interface CreateRosterMember {
  displayName: string;
  walletAddress: string;
}

export interface CreateCollateralState {
  collateralAmount: number;
  gracePeriodHours: number;
  slashPercentage: number;
}

export interface CreatePayoutOrderItem extends CreateRosterMember {
  payoutRound: number;
}