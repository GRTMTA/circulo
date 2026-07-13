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

export const mockCreateBasicsState: CreateBasicsState = {
  name: "Makati Friday Circle",
  contributionAmount: 10,
  contributionAsset: "XLM",
  intervalSeconds: 86_400,
  memberCount: 5,
};

export const mockCreateRosterState: CreateRosterMember[] = [
  { displayName: "Ari Santos", walletAddress: "GAAAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKKLLLMMMNNOOOPPPQQQRRR2" },
  { displayName: "Bea Lim", walletAddress: "GAAAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKKLLLMMMNNOOOPPPQQQRRR3" },
  { displayName: "Carlo Reyes", walletAddress: "GAAAABBBCCCDDDEEEFFFGGGHHHIIIJJJKKKLLLMMMNNOOOPPPQQQRRR4" },
];

export const mockCreateCollateralState: CreateCollateralState = {
  collateralAmount: 5,
  gracePeriodHours: 4,
  slashPercentage: 100,
};

export const mockCreatePayoutOrderState: CreatePayoutOrderItem[] = mockCreateRosterState.map(
  (member, index) => ({
    ...member,
    payoutRound: index + 1,
  })
);

export const mockCreateReviewState = {
  basics: mockCreateBasicsState,
  roster: mockCreateRosterState,
  collateral: mockCreateCollateralState,
  payoutOrder: mockCreatePayoutOrderState,
};

