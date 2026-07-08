"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CreateBasicsState,
  CreateCollateralState,
  CreatePayoutOrderItem,
  CreateRosterMember,
} from "@/lib/mocks";

export function CreateReviewStep({
  basics,
  roster,
  collateral,
  payoutOrder,
}: {
  basics: CreateBasicsState;
  roster: CreateRosterMember[];
  collateral: CreateCollateralState;
  payoutOrder: CreatePayoutOrderItem[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Circle Details</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><strong>Name:</strong> {basics.name}</p>
          <p><strong>Contribution:</strong> {basics.contributionAmount} {basics.contributionAsset}</p>
          <p><strong>Members:</strong> {basics.memberCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Collateral Rules</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><strong>Collateral:</strong> {collateral.collateralAmount} {basics.contributionAsset}</p>
          <p><strong>Grace:</strong> {collateral.gracePeriodHours} hours</p>
          <p><strong>Slash:</strong> {collateral.slashPercentage}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Roster</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          {roster.map((member) => <Badge key={member.walletAddress} variant="outline">{member.displayName}</Badge>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Payout Order</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          {payoutOrder.map((member) => <Badge key={member.walletAddress}>Round {member.payoutRound}: {member.displayName}</Badge>)}
        </CardContent>
      </Card>
    </div>
  );
}

