export interface CreateBasicsState {
  name: string;
  contributionAmount: number;
  contributionAsset: "USDC" | "USDT";
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
  contributionAsset: "USDC",
  intervalSeconds: 86_400,
  memberCount: 5,
};

export const mockCreateRosterState: CreateRosterMember[] = [
  { displayName: "Ari Santos", walletAddress: "GABC91A2CREATOR000000000000000000000000000000000000000001" },
  { displayName: "Bea Lim", walletAddress: "GDEF22FPENDING000000000000000000000000000000000000000002" },
  { displayName: "Carlo Reyes", walletAddress: "GHIJ8KQLATE00000000000000000000000000000000000000000003" },
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

