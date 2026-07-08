"use client";

import {
  CalendarDays,
  ClipboardCheck,
  LockKeyhole,
  LucideIcon,
  PiggyBank,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { AuditEventCard } from "@/components/audit/audit-event-card";
import { AuditExportButton } from "@/components/audit/audit-export-button";
import { AuditFilterBar } from "@/components/audit/audit-filter-bar";
import { CycleCalendarView } from "@/components/calendar/cycle-calendar-view";
import { CircleStatusBanner } from "@/components/emergency/circle-status-banner";
import { EmergencyControls } from "@/components/emergency/emergency-controls";
import { PayoutExecutionCard } from "@/components/payout/payout-execution-card";
import { PayoutOrderEditor } from "@/components/payout/payout-order-editor";
import { PayoutOrderLocked } from "@/components/payout/payout-order-locked";
import { ProtectionRulesPanel } from "@/components/protection/protection-rules-panel";
import { ContributionReminderBanner } from "@/components/reminders/contribution-reminder-banner";
import { ReminderSettingsPanel } from "@/components/reminders/reminder-settings-panel";
import { WalletPayButton } from "@/components/wallet/wallet-pay-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Progress,
  ProgressLabel,
} from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  CircleEnrichedDTO,
  CreatorDashboardDTO,
  DashboardAuditEvent,
  DashboardContribution,
  DashboardMember,
  DashboardPayout,
  DashboardRound,
  MemberDashboardDTO,
} from "@/lib/dashboard/types";
import { createMockCalendarEvents, mockAuditEventTypes } from "@/lib/mocks";

export function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatAmount(value: number, asset = "USDC") {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)} ${asset}`;
}

export function formatInterval(seconds: number) {
  const hours = Math.round(seconds / 3600);
  if (hours < 24) return `Every ${hours}h`;
  const days = Math.round(hours / 24);
  return `Every ${days} day${days === 1 ? "" : "s"}`;
}

export function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function shortenWallet(wallet: string) {
  if (wallet.length <= 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  if (["late", "missed", "disputed", "cancelled", "fully_slashed", "restricted"].includes(status)) {
    return "destructive";
  }

  if (["active", "paid", "posted", "accepted", "completed", "ready"].includes(status)) {
    return "default";
  }

  if (["pending", "draft", "scheduled", "not_due"].includes(status)) {
    return "secondary";
  }

  return "outline";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={getStatusVariant(status)}>{titleCase(status)}</Badge>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  detail?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-base">
          <Icon className="size-4 text-primary" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {detail ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function getCurrentRound(rounds: DashboardRound[], fallback: number) {
  return (
    rounds.find((round) => ["active", "late", "grace_period"].includes(round.status)) ??
    rounds.find((round) => round.roundNumber === fallback) ??
    rounds[0] ??
    null
  );
}

export function getMemberName(members: DashboardMember[], memberId: string | null) {
  if (!memberId) return "Unassigned";
  return members.find((member) => member.id === memberId)?.displayName ?? "Unknown member";
}

export function getProgress(current: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

export function MemberTable({ members }: { members: DashboardMember[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Wallet</TableHead>
          <TableHead>Invite</TableHead>
          <TableHead>Agreement</TableHead>
          <TableHead>Collateral</TableHead>
          <TableHead>Contribution</TableHead>
          <TableHead>Payout</TableHead>
          <TableHead>Restriction</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="font-semibold">{member.displayName}</TableCell>
            <TableCell className="font-mono text-sm">{shortenWallet(member.walletAddress)}</TableCell>
            <TableCell><StatusBadge status={member.inviteStatus} /></TableCell>
            <TableCell><StatusBadge status={member.agreementStatus} /></TableCell>
            <TableCell><StatusBadge status={member.collateralStatus} /></TableCell>
            <TableCell><StatusBadge status={member.paymentStatus} /></TableCell>
            <TableCell>Round {member.payoutRound}</TableCell>
            <TableCell><StatusBadge status={member.restrictionStatus} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ContributionTable({
  contributions,
  members,
  asset,
}: {
  contributions: DashboardContribution[];
  members: DashboardMember[];
  asset: string;
}) {
  return (
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
        {contributions.map((contribution) => (
          <TableRow key={contribution.id}>
            <TableCell className="font-semibold">
              {getMemberName(members, contribution.memberId)}
            </TableCell>
            <TableCell>{formatAmount(contribution.amountDue, asset)}</TableCell>
            <TableCell><StatusBadge status={contribution.status} /></TableCell>
            <TableCell className="font-mono text-sm">
              {contribution.txHash ? shortenWallet(contribution.txHash) : "-"}
            </TableCell>
            <TableCell>{formatDate(contribution.paidAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PayoutTimeline({
  payouts,
  members,
}: {
  payouts: DashboardPayout[];
  members: DashboardMember[];
}) {
  return (
    <div className="grid gap-3">
      {payouts.map((payout) => (
        <div
          key={payout.id}
          className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-[auto_1fr_auto]"
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {payout.roundNumber}
          </div>
          <div>
            <p className="font-semibold">{getMemberName(members, payout.recipientMemberId)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Expected {formatDate(payout.expectedPayoutAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={payout.status} />
            {payout.txHash ? (
              <span className="font-mono text-sm text-muted-foreground">
                {shortenWallet(payout.txHash)}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditList({
  events,
  members,
}: {
  events: DashboardAuditEvent[];
  members: DashboardMember[];
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No audit events yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-xl border border-border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">{titleCase(event.eventType)}</p>
            <span className="text-sm text-muted-foreground">{formatDate(event.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.memberId ? getMemberName(members, event.memberId) : "Circle event"}
            {event.roundNumber ? `, round ${event.roundNumber}` : ""}
            {event.txHash ? `, ${shortenWallet(event.txHash)}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}

export function CreatorDashboard({ data }: { data: CreatorDashboardDTO }) {
  const currentRound = getCurrentRound(data.rounds, data.circle.currentRound);
  const postedCollateral = data.members.filter((member) => member.collateralStatus === "posted").length;
  const acceptedMembers = data.members.filter((member) => member.inviteStatus === "accepted").length;
  const acceptedAgreements = data.members.filter((member) => member.agreementStatus === "accepted").length;
  const paidContributions = data.contributions.filter((contribution) => contribution.status === "paid").length;
  const missingContributions = data.members.length - paidContributions;
  const activationReady =
    data.members.length > 0 &&
    acceptedMembers === data.members.length &&
    postedCollateral === data.members.length &&
    acceptedAgreements === data.members.length &&
    data.circle.payoutOrderLocked &&
    data.circle.settingsLocked &&
    data.circle.rulesLocked;

  return (
    <Tabs defaultValue="overview" className="gap-5">
      <TabsList className="max-w-full overflow-x-auto" variant="line">
        {[
          ["overview", "Overview"],
          ["activation", "Activation Gate"],
          ["members", "Members & Collateral"],
          ["contributions", "Contributions"],
          ["payouts", "Payout Order"],
          ["calendar", "Cycle Calendar"],
          ["defaults", "Default Protection"],
          ["audit", "Audit Log"],
          ["settings", "Pool Settings"],
        ].map(([value, label]) => (
          <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overview" className="grid gap-6">
        {data.circle.status === "disputed" ? <CircleStatusBanner status="disputed" /> : null}
        {data.circle.status === "cancelled" ? <CircleStatusBanner status="cancelled" /> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Pool Status" value={titleCase(data.circle.status)} icon={ShieldCheck} />
          <StatCard label="Collateral Posted" value={`${postedCollateral} / ${data.members.length}`} icon={LockKeyhole} />
          <StatCard label="Current Round" value={`Round ${data.circle.currentRound}`} detail={`of ${data.circle.totalRounds}`} icon={CalendarDays} />
          <StatCard label="Collected" value={formatAmount(currentRound?.collectedAmount ?? 0, data.circle.contributionAsset)} detail={`Expected ${formatAmount(currentRound?.expectedAmount ?? 0, data.circle.contributionAsset)}`} icon={PiggyBank} />
          <StatCard label="Next Due" value={formatDate(currentRound?.dueAt ?? null)} icon={ClipboardCheck} />
          <StatCard label="Missing Contributions" value={`${Math.max(0, missingContributions)} member${missingContributions === 1 ? "" : "s"}`} icon={ShieldAlert} />
        </div>
        <SectionCard title="Circle health" description="Operational snapshot for the creator.">
          <div className="grid gap-4 md:grid-cols-2">
            <Progress value={getProgress(postedCollateral, data.members.length)}>
              <ProgressLabel>Collateral posted</ProgressLabel>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {postedCollateral} / {data.members.length}
              </span>
            </Progress>
            <Progress value={getProgress(paidContributions, data.members.length)}>
              <ProgressLabel>Current round paid</ProgressLabel>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {paidContributions} / {data.members.length}
              </span>
            </Progress>
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="activation" className="grid gap-6">
        <Alert>
          <ShieldCheck className="size-4" />
          <AlertTitle>Creator activation after contract verification</AlertTitle>
          <AlertDescription>
            Activation unlocks only when members, collateral, agreement, payout order, and locked rules are complete.
          </AlertDescription>
        </Alert>
        <SectionCard title="Activation requirements">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              [`${acceptedMembers} / ${data.members.length} members accepted`, acceptedMembers === data.members.length],
              [`${postedCollateral} / ${data.members.length} collateral posted`, postedCollateral === data.members.length],
              [`${acceptedAgreements} / ${data.members.length} agreements accepted`, acceptedAgreements === data.members.length],
              ["Payout order selected and locked", data.circle.payoutOrderLocked],
              ["Contribution amount and interval locked", data.circle.settingsLocked],
              ["Default and collateral rules locked", data.circle.rulesLocked],
            ].map(([label, complete]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
                <span className="font-medium">{label}</span>
                <StatusBadge status={complete ? "accepted" : "pending"} />
              </div>
            ))}
          </div>
          <Button className="mt-6" disabled={!activationReady}>
            {activationReady ? "Activate Pool" : "Activation Locked"}
          </Button>
        </SectionCard>
      </TabsContent>

      <TabsContent value="members">
        <SectionCard title="Members & Collateral" description="Creator-only roster, collateral, payment, and restriction status.">
          <MemberTable members={data.members} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="contributions">
        <SectionCard title="Contribution Tracking" description="On-chain contribution verification is the primary flow.">
          <ContributionTable contributions={data.contributions} members={data.members} asset={data.circle.contributionAsset} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="payouts">
        <SectionCard title="Payout Order" description="Once active, payout order cannot be changed.">
          <div className="grid gap-5">
            {data.circle.payoutOrderLocked ? (
              <PayoutOrderLocked payouts={data.payouts} members={data.members} />
            ) : (
              <PayoutOrderEditor members={data.members} locked={data.circle.payoutOrderLocked} />
            )}
            {data.payouts[0] ? (
              <PayoutExecutionCard
                payout={data.payouts[0]}
                recipientName={getMemberName(data.members, data.payouts[0].recipientMemberId)}
                status={data.payouts[0].status}
              />
            ) : null}
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="calendar">
        <SectionCard title="Cycle Calendar" description="Contribution due dates, payout dates, grace windows, and status markers.">
          <CycleCalendarView events={createMockCalendarEvents(data.circle.id, data.rounds, data.payouts, data.contributions)} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="defaults">
        <SectionCard title="Default Protection" description="Grace period, warning, auto-slash, and restriction flow.">
          <ProtectionRulesPanel
            protection={{
              gracePeriodHours: 4,
              slashPercentage: 100,
              warningThreshold: 2,
              members: data.members.map((member) => ({
                name: member.displayName,
                status: member.restrictionStatus,
                lateCount: member.paymentStatus === "late" || member.paymentStatus === "missed" ? 1 : 0,
              })),
            }}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="audit">
        <SectionCard title="Audit Log" description="Readable activity history for circle actions and on-chain events.">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AuditFilterBar eventTypes={mockAuditEventTypes} members={data.members} />
              <AuditExportButton events={data.auditEvents} members={data.members} />
            </div>
            <div className="grid gap-3">
              {data.auditEvents.map((event) => (
                <AuditEventCard
                  key={event.id}
                  event={event}
                  memberName={event.memberId ? getMemberName(data.members, event.memberId) : "Circle event"}
                />
              ))}
            </div>
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="settings">
        <SectionCard title="Pool Settings" description="Financial settings lock after activation; only non-financial metadata stays editable.">
          <div className="grid gap-3 md:grid-cols-2">
            <StatCard label="Contribution" value={formatAmount(data.circle.contributionAmount, data.circle.contributionAsset)} icon={PiggyBank} />
            <StatCard label="Interval" value={formatInterval(data.circle.intervalSeconds)} icon={CalendarDays} />
            <StatCard label="Collateral" value={formatAmount(data.circle.collateralAmount, data.circle.contributionAsset)} icon={LockKeyhole} />
            <StatCard label="Settings" value={data.circle.settingsLocked ? "Locked" : "Draft editable"} icon={Settings} />
          </div>
          <div className="mt-5">
            <EmergencyControls circleName={data.circle.name} />
          </div>
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}

export function MemberDashboard({ data }: { data: MemberDashboardDTO }) {
  const currentRound = getCurrentRound(data.rounds, data.circle.currentRound);
  const myContribution = data.contributions.find(
    (contribution) =>
      contribution.memberId === data.currentMember.id &&
      contribution.roundId === currentRound?.id
  );
  const paidMembers = data.contributions.filter((contribution) => contribution.status === "paid").length;
  const pendingMembers = data.contributions.filter((contribution) => ["pending", "due_now", "due_soon"].includes(contribution.status)).length;
  const lateMembers = data.contributions.filter((contribution) => ["late", "grace_period", "missed"].includes(contribution.status)).length;

  return (
    <Tabs defaultValue="status" className="gap-5">
      <TabsList className="max-w-full overflow-x-auto" variant="line">
        {[
          ["status", "My Status"],
          ["pay", "Pay Contribution"],
          ["timeline", "Payout Timeline"],
          ["transparency", "Group Transparency"],
          ["collateral", "Collateral Status"],
          ["rules", "Rules & Agreement"],
          ["notifications", "Notifications"],
        ].map(([value, label]) => (
          <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="status" className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Your Due" value={formatAmount(myContribution?.amountDue ?? data.circle.contributionAmount, data.circle.contributionAsset)} icon={PiggyBank} />
          <StatCard label="Due Date" value={formatDate(currentRound?.dueAt ?? null)} icon={CalendarDays} />
          <StatCard label="Your Payout" value={`Round ${data.currentMember.payoutRound}`} icon={WalletCards} />
          <StatCard label="Collateral" value={titleCase(data.currentMember.collateralStatus)} icon={LockKeyhole} />
          <StatCard label="Status" value={titleCase(data.currentMember.restrictionStatus === "clear" ? data.currentMember.paymentStatus : data.currentMember.restrictionStatus)} icon={ShieldCheck} />
          <StatCard label="Pool Status" value={titleCase(data.circle.status)} icon={UsersRound} />
        </div>
      </TabsContent>

      <TabsContent value="pay">
        <SectionCard title="Pay Contribution" description="Use wallet payment and on-chain verification as the main flow.">
          <div className="grid gap-4">
            <ContributionReminderBanner
              amount={myContribution?.amountDue ?? data.circle.contributionAmount}
              asset={data.circle.contributionAsset}
              dueAt={currentRound?.dueAt ?? new Date().toISOString()}
              urgency={myContribution?.status === "late" ? "overdue" : "due_soon"}
            />
            <WalletPayButton
              amount={myContribution?.amountDue ?? data.circle.contributionAmount}
              asset={data.circle.contributionAsset}
              dueDate={currentRound?.dueAt ?? new Date().toISOString()}
              status={myContribution?.status === "paid" ? "paid" : "idle"}
            />
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="timeline">
        <SectionCard title="Payout Timeline" description="Payout order was locked before activation. Members can view it, not edit it.">
          <PayoutTimeline payouts={data.payouts} members={data.members} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="transparency">
        <SectionCard title="Group Transparency" description="Member-safe pool health without creator-only settings.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Paid" value={String(paidMembers)} icon={ShieldCheck} />
            <StatCard label="Pending" value={String(pendingMembers)} icon={ClipboardCheck} />
            <StatCard label="Late" value={String(lateMembers)} icon={ShieldAlert} />
            <StatCard label="Collected" value={formatAmount(currentRound?.collectedAmount ?? 0, data.circle.contributionAsset)} icon={PiggyBank} />
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="collateral">
        <SectionCard title="Collateral Status" description="Collateral discourages disappearing after payout and follows locked default rules.">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Your Collateral" value={titleCase(data.currentMember.collateralStatus)} icon={LockKeyhole} />
            <StatCard label="Pool Requirement" value={formatAmount(data.circle.collateralAmount, data.circle.contributionAsset)} icon={ShieldCheck} />
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="rules">
        <SectionCard title="Rules & Agreement" description="Short, explicit participation boundaries.">
          <div className="grid gap-3">
            {[
              "This is not an investment, lending product, yield product, or public fundraiser.",
              "Contribution amount, member roster, payout order, collateral rules, and interval are locked before activation.",
              "Collateral may be slashed after missed contribution rules are met.",
              "The contract pays members directly. Circulo does not custody funds.",
              "Cash-in and cash-out are handled by licensed partners, not Circulo.",
            ].map((rule) => (
              <div key={rule} className="rounded-xl border border-border bg-white p-4 text-sm leading-6">{rule}</div>
            ))}
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="notifications">
        <SectionCard title="Notifications" description="Member-facing status updates and action reminders.">
          <div className="grid gap-5">
            <ReminderSettingsPanel />
            {data.notifications.length > 0 ? (
              <div className="grid gap-3">
              {data.notifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">{notification.title}</p>
                    <StatusBadge status={notification.readAt ? "completed" : "pending"} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.body}</p>
                </div>
              ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            )}
          </div>
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}

export function DashboardViews({ data }: { data: CircleEnrichedDTO }) {
  return data.role === "creator" ? (
    <CreatorDashboard data={data} />
  ) : (
    <MemberDashboard data={data} />
  );
}
