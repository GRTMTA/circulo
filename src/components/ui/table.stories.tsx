import type { Meta, StoryObj } from "@storybook/nextjs";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  auditEventsFixture,
  contributionsFixture,
  membersFixture,
  payoutsFixture,
} from "../../../.storybook/fixtures";

const meta = {
  title: "UI/Table",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

function memberName(id: string | null) {
  return membersFixture.find((member) => member.id === id)?.displayName ?? "Unknown";
}

function statusBadge(status: string) {
  return (
    <Badge
      variant={
        ["late", "missed", "disputed", "restricted", "fully_slashed"].includes(status)
          ? "destructive"
          : ["paid", "posted", "accepted", "ready"].includes(status)
            ? "default"
            : "secondary"
      }
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}

export const Members: Story = {
  render: () => (
    <div className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Invite</TableHead>
            <TableHead>Collateral</TableHead>
            <TableHead>Contribution</TableHead>
            <TableHead>Payout</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {membersFixture.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-semibold">{member.displayName}</TableCell>
              <TableCell className="font-mono text-sm">
                {member.walletAddress.slice(0, 8)}...
              </TableCell>
              <TableCell>{statusBadge(member.inviteStatus)}</TableCell>
              <TableCell>{statusBadge(member.collateralStatus)}</TableCell>
              <TableCell>{statusBadge(member.paymentStatus)}</TableCell>
              <TableCell>Round {member.payoutRound}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const Contributions: Story = {
  render: () => (
    <div className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Amount Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>TX Hash</TableHead>
            <TableHead>Time Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributionsFixture.map((contribution) => (
            <TableRow key={contribution.id}>
              <TableCell>{memberName(contribution.memberId)}</TableCell>
              <TableCell>{contribution.amountDue} USDC</TableCell>
              <TableCell>{statusBadge(contribution.status)}</TableCell>
              <TableCell className="font-mono text-sm">
                {contribution.txHash ?? "-"}
              </TableCell>
              <TableCell>{contribution.paidAt ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};

export const PayoutsAndAudit: Story = {
  render: () => (
    <div className="grid gap-8 p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Round</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payoutsFixture.map((payout) => (
            <TableRow key={payout.id}>
              <TableCell>Round {payout.roundNumber}</TableCell>
              <TableCell>{memberName(payout.recipientMemberId)}</TableCell>
              <TableCell>{statusBadge(payout.status)}</TableCell>
              <TableCell>{payout.expectedPayoutAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Round</TableHead>
            <TableHead>TX Hash</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditEventsFixture.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.eventType.replaceAll("_", " ")}</TableCell>
              <TableCell>{memberName(event.memberId)}</TableCell>
              <TableCell>{event.roundNumber ?? "-"}</TableCell>
              <TableCell className="font-mono text-sm">{event.txHash ?? "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};
