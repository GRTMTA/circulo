export const mockGracePeriodTimeline = [
  { label: "Contribution missed", status: "complete", timestamp: "2026-07-08T12:00:00.000Z" },
  { label: "Grace period starts", status: "current", timestamp: "2026-07-08T12:05:00.000Z" },
  { label: "Grace period ending", status: "pending", timestamp: "2026-07-08T16:00:00.000Z" },
  { label: "Collateral slash", status: "pending", timestamp: "2026-07-08T16:05:00.000Z" },
  { label: "Restriction applied", status: "pending", timestamp: "2026-07-08T16:10:00.000Z" },
];

export const mockSlashHistory = [
  {
    memberId: "member-c",
    memberName: "Carlo Reyes",
    roundNumber: 2,
    slashedAmount: 2.5,
    reason: "Missed contribution after grace period",
    timestamp: "2026-07-08T16:05:00.000Z",
  },
];

export const mockProtectionRules = [
  { rule: "Grace period is 4 hours after due time.", active: true },
  { rule: "Collateral is slashed after the grace period expires.", active: true },
  { rule: "Slashed collateral is injected into the pool.", active: true },
  { rule: "Restricted members cannot join future circles.", active: true },
];

