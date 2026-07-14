export {
  auditEventsFixture,
  auditEventTypesFixture,
  contributionsFixture,
  createCirclesListFixture,
  createContributionsFixture,
  createCreatorDashboardFixture,
  createMemberDashboardFixture,
  createMembersFixture,
  createPayoutsFixture,
  createRoundsFixture,
  membersFixture,
  payoutsFixture,
  roundsFixture,
} from "./dashboard";

export const agreementRulesFixture = [
  "This is not an investment, lending product, yield product, or public fundraiser.",
  "Contribution amount, member roster, payout order, collateral rules, and interval are locked before activation.",
  "Collateral may be slashed after missed contribution rules are met.",
  "The contract pays members directly. Circulo does not custody funds.",
  "Cash-in and cash-out are handled by licensed partners, not Circulo.",
];

export const connectedWalletFixture = {
  status: "connected" as const,
  walletAddress: "GABC91A2CONNECTED0000000000000000000000000000000000000001",
};