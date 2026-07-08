import type { DashboardMember } from "@/lib/dashboard/types";

export const mockMembers: DashboardMember[] = [
  {
    id: "member-creator",
    profileId: "profile-creator",
    displayName: "Ari Santos",
    walletAddress: "GABC91A2CREATOR000000000000000000000000000000000000000001",
    role: "creator",
    inviteStatus: "accepted",
    agreementStatus: "accepted",
    collateralStatus: "posted",
    paymentStatus: "paid",
    payoutRound: 1,
    restrictionStatus: "clear",
  },
  {
    id: "member-b",
    profileId: "profile-b",
    displayName: "Bea Lim",
    walletAddress: "GDEF22FPENDING000000000000000000000000000000000000000002",
    role: "member",
    inviteStatus: "accepted",
    agreementStatus: "accepted",
    collateralStatus: "posted",
    paymentStatus: "pending",
    payoutRound: 2,
    restrictionStatus: "clear",
  },
  {
    id: "member-c",
    profileId: "profile-c",
    displayName: "Carlo Reyes",
    walletAddress: "GHIJ8KQLATE00000000000000000000000000000000000000000003",
    role: "member",
    inviteStatus: "accepted",
    agreementStatus: "accepted",
    collateralStatus: "partially_slashed",
    paymentStatus: "late",
    payoutRound: 3,
    restrictionStatus: "warning",
  },
  {
    id: "member-d",
    profileId: "profile-d",
    displayName: "Dina Cruz",
    walletAddress: "GKLM44DPOSTED000000000000000000000000000000000000000004",
    role: "member",
    inviteStatus: "invited",
    agreementStatus: "pending",
    collateralStatus: "not_posted",
    paymentStatus: "not_due",
    payoutRound: 4,
    restrictionStatus: "clear",
  },
  {
    id: "member-e",
    profileId: "profile-e",
    displayName: "Enzo Tan",
    walletAddress: "GNOP55ERESTRICTED00000000000000000000000000000000000005",
    role: "member",
    inviteStatus: "expired",
    agreementStatus: "pending",
    collateralStatus: "fully_slashed",
    paymentStatus: "missed",
    payoutRound: 5,
    restrictionStatus: "restricted",
  },
];

export function createMockMembers(
  overrides: Partial<DashboardMember>[] = []
): DashboardMember[] {
  return mockMembers.map((member, index) => ({
    ...member,
    ...overrides[index],
  }));
}
