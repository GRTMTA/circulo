"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Trash2,
  RefreshCcw,
  Clock,
  History,
  Info,
} from "lucide-react";

// AppShell and DashboardShell imports removed since layout is managed by Next.js layouts.
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  FilterOption,
  FilterSpec,
} from "@/components/ui/table-filter-bar";
import { TableFilterBar } from "@/components/ui/table-filter-bar";
import { CalendarExportButton } from "@/components/calendar/calendar-export-button";
import { CycleCalendarView } from "@/components/calendar/cycle-calendar-view";
import { AuditLog } from "@/components/dashboard/audit-log";
import {
  CircleStatusBanner,
  CircleStatusCard,
} from "@/components/dashboard/circle-status-indicator";
import {
  DefaultProtectionCreatorView,
  DefaultProtectionMemberView,
} from "@/components/dashboard/default-protection-panel";
import {
  EmergencyActionsPanel,
  EmergencyRulesDisplay,
} from "@/components/dashboard/emergency-rules-panel";
import {
  pauseCircleAction,
  resumeCircleAction,
  cancelCircleAction,
  activateCircleAction,
  confirmCreatorCollateralAction,
  deleteCircleAction,
  proposeDeleteCircleAction,
  voteDeleteCircleAction,
  leaveCancelledCircleAction,
} from "@/app/dashboard/actions";
import { ContributionReminderBanner } from "@/components/reminders/contribution-reminder-banner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StellarWalletsKit } from "@/config/stellar";
import {
  triggerPostCollateralOnChain,
  triggerActivateOnChain,
  triggerCancelCircleOnChain,
  submitSignedTransaction,
} from "@/services/contractService";
import {
  triggerProposeDissolution,
  triggerCastDissolutionVote,
} from "@/services/dissolutionService";
import { calculateCollateral, MIN_CYCLE_MEMBERS } from "@/lib/create/validation";
import { SlashMemberButton } from "@/components/dashboard/slash-member-button";
import { ExplorerLink } from "@/components/stellar/explorer-link";
import { WalletPayButton } from "@/components/wallet/wallet-pay-button";
import { env, getTokenContractId } from "@/lib/env";
import type {
  CreatorDashboardDTO,
  DashboardContribution,
  DashboardDTO,
  DashboardMember,
  DashboardPayout,
  DashboardRound,
  MemberDashboardDTO,
} from "@/lib/dashboard/types";

// navigation variables removed as sidebar is constructed dynamically by the parent AppShell.

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

async function submitDissolutionWalletAction(
  circleId: string,
  approve?: boolean,
): Promise<string> {
  const wallet = await StellarWalletsKit.getAddress();
  const memberAddress = wallet?.address;
  if (!memberAddress) throw new Error("Connect the correct Stellar testnet wallet first.");
  if (!env.contractId) throw new Error("The Circulo contract is not configured.");

  const prepared = approve === undefined
    ? await triggerProposeDissolution(memberAddress, env.contractId, circleId)
    : await triggerCastDissolutionVote(memberAddress, env.contractId, circleId, approve);
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(prepared.txXdr, {
    networkPassphrase: env.sorobanNetworkPassphrase,
    address: memberAddress,
  });
  return (await submitSignedTransaction(signedTxXdr)).hash;
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (
    [
      "late",
      "missed",
      "disputed",
      "cancelled",
      "fully_slashed",
      "restricted",
    ].includes(status)
  ) {
    return "destructive";
  }

  if (
    ["active", "paid", "posted", "accepted", "completed", "ready"].includes(
      status,
    )
  ) {
    return "default";
  }

  if (["pending", "draft", "scheduled", "not_due"].includes(status)) {
    return "secondary";
  }

  return "outline";
}

function getStatusColor(status: string): string {
  if (["paid", "posted", "accepted", "completed", "ready"].includes(status)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (status === "active" || status === "verifying") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  if (
    [
      "pending",
      "draft",
      "scheduled",
      "not_due",
      "delayed",
      "warning",
      "invited",
      "due_soon",
      "due_now",
      "grace_period",
    ].includes(status)
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (
    [
      "late",
      "missed",
      "disputed",
      "cancelled",
      "fully_slashed",
      "restricted",
    ].includes(status)
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  return "bg-gray-50 text-gray-600 border-gray-200";
}

export function StatusBadge({ status }: { status: string }) {
  const variant = getStatusVariant(status);
  return (
    <Badge
      variant={variant === "destructive" ? "destructive" : "outline"}
      className={getStatusColor(status)}
    >
      {titleCase(status)}
    </Badge>
  );
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
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
        {detail ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {detail}
          </p>
        ) : null}
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
    rounds.find((round) =>
      ["active", "late", "grace_period"].includes(round.status),
    ) ??
    rounds.find((round) => round.roundNumber === fallback) ??
    rounds[0] ??
    null
  );
}

export function getMemberName(
  members: DashboardMember[],
  memberId: string | null,
) {
  if (!memberId) return "Unassigned";
  return (
    members.find((member) => member.id === memberId)?.displayName ??
    "Unknown member"
  );
}

function getMemberObject(members: DashboardMember[], memberId: string | null) {
  if (!memberId) return null;
  return members.find((member) => member.id === memberId) ?? null;
}

function MemberAvatar({
  member,
  className = "size-6",
}: {
  member: DashboardMember | null;
  className?: string;
}) {
  if (!member) {
    return (
      <Avatar className={className}>
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar className={className}>
      <AvatarImage
        src={member.avatarUrl ?? undefined}
        alt={member.displayName}
      />
      <AvatarFallback>
        {member.displayName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
}

export function getProgress(current: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

type SortDirection = "asc" | "desc" | null;
type SortConfig = { key: string; direction: SortDirection };

function useSort(
  defaultKey: string,
): [
  SortConfig,
  (key: string) => void,
  <T>(items: T[], extractor: (item: T) => string | number) => T[],
] {
  const [sort, setSort] = useState<SortConfig>({
    key: defaultKey,
    direction: "asc",
  });

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key === key) {
        const next: SortDirection =
          prev.direction === "asc"
            ? "desc"
            : prev.direction === "desc"
              ? null
              : "asc";
        return { key, direction: next };
      }
      return { key, direction: "asc" };
    });
  };

  const sortFn = <T,>(
    items: T[],
    extractor: (item: T) => string | number,
  ): T[] => {
    if (!sort.direction) return items;
    return [...items].sort((a, b) => {
      const va = extractor(a);
      const vb = extractor(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sort.direction === "asc" ? cmp : -cmp;
    });
  };

  return [sort, toggleSort, sortFn];
}

function SortHeader({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: string;
  sort: SortConfig;
  onToggle: (key: string) => void;
}) {
  const isActive = sort.key === sortKey && sort.direction !== null;
  return (
    <TableHead>
      <button
        type="button"
        className="inline-flex items-center gap-1 whitespace-nowrap text-left text-xs font-medium uppercase text-muted-foreground hover:text-foreground"
        onClick={() => onToggle(sortKey)}
      >
        {label}
        {isActive ? (
          sort.direction === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-30" />
        )}
      </button>
    </TableHead>
  );
}

export function MemberTable({
  members,
  slashControls,
}: {
  members: DashboardMember[];
  slashControls?: { circleId: string; slashPercentage: number };
}) {
  const [search, setSearch] = useState("");
  const [filterInvite, setFilterInvite] = useState<string | null>(null);
  const [filterAgreement, setFilterAgreement] = useState<string | null>(null);
  const [filterCollateral, setFilterCollateral] = useState<string | null>(null);
  const [filterPayment, setFilterPayment] = useState<string | null>(null);
  const [filterRestriction, setFilterRestriction] = useState<string | null>(
    null,
  );
  const [sort, toggleSort, sortFn] = useSort("payoutRound");

  const statusOptions = (statuses: string[]): FilterOption[] =>
    statuses.map((s) => ({ value: s, label: titleCase(s) }));

  const inviteStatuses = [
    "accepted",
    "invited",
    "declined",
    "expired",
  ] as const;
  const agreementStatuses = ["accepted", "pending"] as const;
  const collateralStatuses = [
    "not_posted",
    "posted",
    "partially_slashed",
    "fully_slashed",
  ] as const;
  const paymentStatuses = [
    "paid",
    "pending",
    "late",
    "missed",
    "not_due",
    "disputed",
  ] as const;
  const restrictionStatuses = ["clear", "warning", "restricted"] as const;

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      m.displayName.toLowerCase().includes(q) ||
      m.walletAddress.toLowerCase().includes(q);
    const matchesInvite = !filterInvite || m.inviteStatus === filterInvite;
    const matchesAgreement =
      !filterAgreement || m.agreementStatus === filterAgreement;
    const matchesCollateral =
      !filterCollateral || m.collateralStatus === filterCollateral;
    const matchesPayment = !filterPayment || m.paymentStatus === filterPayment;
    const matchesRestriction =
      !filterRestriction || m.restrictionStatus === filterRestriction;
    return (
      matchesSearch &&
      matchesInvite &&
      matchesAgreement &&
      matchesCollateral &&
      matchesPayment &&
      matchesRestriction
    );
  });

  const sorted = sortFn(filtered, (m) => {
    switch (sort.key) {
      case "displayName":
        return m.displayName;
      case "walletAddress":
        return m.walletAddress;
      case "inviteStatus":
        return m.inviteStatus;
      case "agreementStatus":
        return m.agreementStatus;
      case "collateralStatus":
        return m.collateralStatus;
      case "paymentStatus":
        return m.paymentStatus;
      case "payoutRound":
        return m.payoutRound;
      case "restrictionStatus":
        return m.restrictionStatus;
      default:
        return m.displayName;
    }
  });

  const hasActiveFilters =
    !!search ||
    !!filterInvite ||
    !!filterAgreement ||
    !!filterCollateral ||
    !!filterPayment ||
    !!filterRestriction;

  const filters: FilterSpec[] = [
    {
      id: "invite",
      label: "Invite",
      value: filterInvite,
      options: statusOptions([...inviteStatuses]),
      onChange: setFilterInvite,
    },
    {
      id: "agreement",
      label: "Agreement",
      value: filterAgreement,
      options: statusOptions([...agreementStatuses]),
      onChange: setFilterAgreement,
    },
    {
      id: "collateral",
      label: "Collateral",
      value: filterCollateral,
      options: statusOptions([...collateralStatuses]),
      onChange: setFilterCollateral,
    },
    {
      id: "payment",
      label: "Contribution",
      value: filterPayment,
      options: statusOptions([...paymentStatuses]),
      onChange: setFilterPayment,
    },
    {
      id: "restriction",
      label: "Restriction",
      value: filterRestriction,
      options: statusOptions([...restrictionStatuses]),
      onChange: setFilterRestriction,
    },
  ];

  return (
    <div className="space-y-4">
      <TableFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or wallet..."
        filters={filters}
        totalCount={members.length}
        filteredCount={sorted.length}
        onClearFilters={() => {
          setSearch("");
          setFilterInvite(null);
          setFilterAgreement(null);
          setFilterCollateral(null);
          setFilterPayment(null);
          setFilterRestriction(null);
        }}
        hasActiveFilters={hasActiveFilters}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader
              label="Order"
              sortKey="payoutRound"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Member"
              sortKey="displayName"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Wallet"
              sortKey="walletAddress"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Invite"
              sortKey="inviteStatus"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Agreement"
              sortKey="agreementStatus"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Collateral"
              sortKey="collateralStatus"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Contribution"
              sortKey="paymentStatus"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Restriction"
              sortKey="restrictionStatus"
              sort={sort}
              onToggle={toggleSort}
            />
            {slashControls ? <TableHead>Action</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={slashControls ? 9 : 8}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                No members match your filters.
                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="ml-1 font-medium text-primary underline"
                    onClick={() => {
                      setSearch("");
                      setFilterInvite(null);
                      setFilterAgreement(null);
                      setFilterCollateral(null);
                      setFilterPayment(null);
                      setFilterRestriction(null);
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-semibold text-center sm:text-left">
                  {member.payoutRound}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={member} className="size-8" />
                    <span className="font-semibold">{member.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {shortenWallet(member.walletAddress)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={member.inviteStatus} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={member.agreementStatus} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={member.collateralStatus} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={member.paymentStatus} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={member.restrictionStatus} />
                </TableCell>
                {slashControls ? (
                  <TableCell>
                    {member.role !== "creator" &&
                    member.collateralStatus === "posted" &&
                    member.restrictionStatus !== "restricted" ? (
                      <SlashMemberButton
                        circleId={slashControls.circleId}
                        member={member}
                        slashPercentage={slashControls.slashPercentage}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
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
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sort, toggleSort, sortFn] = useSort("memberName");

  const contributionStatuses = [
    "paid",
    "pending",
    "late",
    "missed",
    "not_due",
    "disputed",
    "due_soon",
    "due_now",
    "verifying",
    "grace_period",
  ] as const;

  const filtered = contributions.filter((c) => {
    const q = search.toLowerCase();
    const memberName = getMemberName(members, c.memberId).toLowerCase();
    const matchesSearch = !q || memberName.includes(q);
    const matchesStatus = !filterStatus || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sorted = sortFn(filtered, (c) => {
    switch (sort.key) {
      case "memberName":
        return getMemberName(members, c.memberId);
      case "amountDue":
        return c.amountDue;
      case "status":
        return c.status;
      case "paidAt":
        return c.paidAt ?? "";
      default:
        return getMemberName(members, c.memberId);
    }
  });

  const hasActiveFilters = !!search || !!filterStatus;
  const statusOptions: FilterOption[] = contributionStatuses.map((s) => ({
    value: s,
    label: titleCase(s),
  }));
  const filters: FilterSpec[] = [
    {
      id: "status",
      label: "Status",
      value: filterStatus,
      options: statusOptions,
      onChange: setFilterStatus,
    },
  ];

  return (
    <div className="space-y-4">
      <TableFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by member name..."
        filters={filters}
        totalCount={contributions.length}
        filteredCount={sorted.length}
        onClearFilters={() => {
          setSearch("");
          setFilterStatus(null);
        }}
        hasActiveFilters={hasActiveFilters}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <SortHeader
              label="Member"
              sortKey="memberName"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Amount Due"
              sortKey="amountDue"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Status"
              sortKey="status"
              sort={sort}
              onToggle={toggleSort}
            />
            <TableHead>TX Hash</TableHead>
            <SortHeader
              label="Time Paid"
              sortKey="paidAt"
              sort={sort}
              onToggle={toggleSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-sm text-muted-foreground"
              >
                No contributions match your filters.
                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="ml-1 font-medium text-primary underline"
                    onClick={() => {
                      setSearch("");
                      setFilterStatus(null);
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((contribution) => (
              <TableRow key={contribution.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <MemberAvatar
                      member={getMemberObject(members, contribution.memberId)}
                      className="size-8"
                    />
                    <span className="font-semibold">
                      {getMemberName(members, contribution.memberId)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatAmount(contribution.amountDue, asset)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={contribution.status} />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <ExplorerLink value={contribution.txHash} kind="tx" />
                </TableCell>
                <TableCell>{formatDate(contribution.paidAt)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
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
          <MemberAvatar
            member={getMemberObject(members, payout.recipientMemberId)}
            className="size-11"
          />
          <div>
            <p className="font-semibold">
              {getMemberName(members, payout.recipientMemberId)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Expected {formatDate(payout.expectedPayoutAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={payout.status} />
            {payout.txHash ? (
              <ExplorerLink value={payout.txHash} kind="tx" />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

type WalletFlowDirection = "in" | "out" | "escrow";
type WalletFlowStatus = "confirmed" | "verifying" | "scheduled";

interface MemberWalletFlow {
  id: string;
  direction: WalletFlowDirection;
  status: WalletFlowStatus;
  title: string;
  description: string;
  amount: number;
  asset: string;
  occurredAt: string | null;
  txHash: string | null;
}

function metadataAmount(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
): number | null {
  if (!metadata) return null;

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function formatWalletFlowTime(value: string | null, timeZone: string) {
  if (!value) return "Recorded time unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

/**
 * Circle-scoped wallet ledger. It intentionally uses the verified dashboard
 * records instead of trying to infer Soroban token transfers from Horizon's
 * payment-operation endpoint, which does not reliably expose contract calls.
 */
function MemberTransactionHistory({ data }: { data: MemberDashboardDTO }) {
  const [directionFilter, setDirectionFilter] = useState<"all" | WalletFlowDirection>("all");
  const collateralRequired = calculateCollateral(
    data.circle.memberCount,
    data.circle.contributionAmount,
    data.currentMember.payoutRound,
    data.circle.cycleCount,
  );
  const refundableCollateral = Math.max(
    0,
    collateralRequired - data.currentMember.slashedAmount,
  );
  const roundsById = new Map(data.rounds.map((round) => [round.id, round]));
  const flows: MemberWalletFlow[] = [];

  for (const contribution of data.contributions) {
    if (
      contribution.memberId !== data.currentMember.id ||
      !contribution.txHash ||
      !["paid", "verifying"].includes(contribution.status)
    ) {
      continue;
    }

    const round = roundsById.get(contribution.roundId);
    flows.push({
      id: `contribution-${contribution.id}`,
      direction: "out",
      status: contribution.status === "paid" ? "confirmed" : "verifying",
      title: `Contribution sent${round ? ` — Round ${round.roundNumber}` : ""}`,
      description: "Sent from your wallet to the circle smart contract.",
      amount: contribution.amountDue,
      asset: data.circle.contributionAsset,
      occurredAt: contribution.paidAt,
      txHash: contribution.txHash,
    });
  }

  for (const payout of data.payouts) {
    if (payout.recipientMemberId !== data.currentMember.id || !payout.txHash) {
      continue;
    }

    flows.push({
      id: `payout-${payout.id}`,
      direction: "in",
      status: payout.status === "paid" ? "confirmed" : "scheduled",
      title: `Payout received — Round ${payout.roundNumber}`,
      description:
        payout.status === "paid"
          ? "Automatically released from the circle smart contract."
          : "Payout transaction has been submitted and is awaiting final confirmation.",
      amount: payout.payoutAmount,
      asset: data.circle.contributionAsset,
      occurredAt: payout.processedAt ?? payout.expectedPayoutAt,
      txHash: payout.txHash,
    });
  }

  const refundTransactionHashes = new Set<string>();
  for (const event of data.auditEvents) {
    if (event.memberId !== data.currentMember.id || !event.txHash) continue;

    if (event.eventType === "collateral_posted") {
      flows.push({
        id: `collateral-posted-${event.id}`,
        direction: "out",
        status: "confirmed",
        title: "Collateral locked in escrow",
        description: "Locked for your remaining contribution obligations in this circle.",
        amount: metadataAmount(event.metadata, ["amount", "collateral_amount"]) ?? collateralRequired,
        asset: event.asset ?? data.circle.contributionAsset,
        occurredAt: event.createdAt,
        txHash: event.txHash,
      });
    }

    if (event.eventType === "collateral_refunded") {
      refundTransactionHashes.add(event.txHash);
      flows.push({
        id: `collateral-refunded-${event.id}`,
        direction: "in",
        status: "confirmed",
        title: "Collateral returned",
        description: "Returned from the circle smart contract to your wallet.",
        amount: metadataAmount(event.metadata, ["amount", "refund_amount"]) ?? refundableCollateral,
        asset: event.asset ?? data.circle.contributionAsset,
        occurredAt: event.createdAt,
        txHash: event.txHash,
      });
    }

    if (event.eventType === "collateral_slashed") {
      flows.push({
        id: `collateral-slashed-${event.id}`,
        direction: "escrow",
        status: "confirmed",
        title: "Collateral applied from escrow",
        description: "This used collateral already locked in escrow; it is not a second wallet withdrawal.",
        amount:
          metadataAmount(event.metadata, ["slashed_amount", "amount"]) ??
          data.currentMember.slashedAmount,
        asset: event.asset ?? data.circle.contributionAsset,
        occurredAt: event.createdAt,
        txHash: event.txHash,
      });
    }
  }

  // The contract refunds collateral in the same transaction that completes a
  // circle or cancels a draft. Older records did not create one audit row per
  // member, so derive those confirmed incoming transfers from that transaction.
  const finalPayout = data.payouts.find(
    (payout) =>
      payout.roundNumber === data.circle.totalRounds &&
      payout.status === "paid" &&
      payout.txHash,
  );
  const cancellation = data.auditEvents.find(
    (event) => event.eventType === "circle_cancelled" && event.txHash,
  );
  const automaticRefund =
    data.circle.status === "completed" && finalPayout?.txHash
      ? {
          id: `completion-refund-${finalPayout.id}`,
          title: "Collateral returned on completion",
          description: "Returned automatically when the last cycle payout completed.",
          occurredAt: finalPayout.processedAt ?? finalPayout.expectedPayoutAt,
          txHash: finalPayout.txHash,
        }
      : data.circle.status === "cancelled" && cancellation?.txHash
        ? {
            id: `cancellation-refund-${cancellation.id}`,
            title: "Collateral refunded on cancellation",
            description: "Returned automatically when the draft circle was cancelled.",
            occurredAt: cancellation.createdAt,
            txHash: cancellation.txHash,
          }
        : null;

  if (automaticRefund && !refundTransactionHashes.has(automaticRefund.txHash)) {
    flows.push({
      ...automaticRefund,
      direction: "in",
      status: "confirmed",
      amount: refundableCollateral,
      asset: data.circle.contributionAsset,
    });
  }

  const sortedFlows = [...flows].sort((left, right) => {
    const leftTime = left.occurredAt ? new Date(left.occurredAt).getTime() : 0;
    const rightTime = right.occurredAt ? new Date(right.occurredAt).getTime() : 0;
    return rightTime - leftTime;
  });
  const visibleFlows =
    directionFilter === "all"
      ? sortedFlows
      : sortedFlows.filter((flow) => flow.direction === directionFilter);
  const totalIncoming = sortedFlows
    .filter((flow) => flow.direction === "in")
    .reduce((total, flow) => total + flow.amount, 0);
  const totalOutgoing = sortedFlows
    .filter((flow) => flow.direction === "out")
    .reduce((total, flow) => total + flow.amount, 0);

  const filters: Array<["all" | WalletFlowDirection, string]> = [
    ["all", "All"],
    ["in", "Received"],
    ["out", "Sent"],
    ["escrow", "Escrow"],
  ];

  return (
    <div className="grid gap-6">
      <SectionCard
        title="Circle Transaction History"
        description="Verified asset movements between your wallet and this circle's smart contract."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Received"
            value={formatAmount(totalIncoming, data.circle.contributionAsset)}
            icon={ArrowDownLeft}
          />
          <StatCard
            label="Sent"
            value={formatAmount(totalOutgoing, data.circle.contributionAsset)}
            icon={ArrowUpRight}
          />
          <StatCard
            label="Net movement"
            value={formatAmount(totalIncoming - totalOutgoing, data.circle.contributionAsset)}
            icon={History}
          />
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Collateral stays in escrow after it leaves your wallet. A slash reduces
          that escrow balance, rather than creating another wallet debit.
        </p>
      </SectionCard>

      <SectionCard
        title="Wallet movements"
        description="Open a transaction hash to independently verify the movement on Stellar Expert."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {filters.map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="xs"
                variant={directionFilter === value ? "default" : "outline"}
                onClick={() => setDirectionFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            View full wallet ledger
          </Link>
        </div>

        {visibleFlows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <History className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-semibold">No verified wallet movements yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Collateral deposits, contributions, payouts, and refunds will appear here once their on-chain transactions are recorded.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {visibleFlows.map((flow) => {
              const isIncoming = flow.direction === "in";
              const isEscrow = flow.direction === "escrow";
              const Icon = isEscrow
                ? LockKeyhole
                : isIncoming
                  ? ArrowDownLeft
                  : ArrowUpRight;
              const directionLabel = isEscrow
                ? "Escrow"
                : isIncoming
                  ? "Received"
                  : "Sent";
              const statusLabel =
                flow.status === "confirmed"
                  ? "Confirmed"
                  : flow.status === "verifying"
                    ? "Verifying"
                    : "Submitted";

              return (
                <div
                  key={flow.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={
                        isEscrow
                          ? "flex size-10 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700"
                          : isIncoming
                            ? "flex size-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                            : "flex size-10 shrink-0 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-700"
                      }
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{flow.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {directionLabel}
                        </Badge>
                        <Badge
                          variant={flow.status === "confirmed" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{flow.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{formatWalletFlowTime(flow.occurredAt, data.circle.timeZone)}</span>
                        <ExplorerLink value={flow.txHash} kind="tx" className="text-xs" label="View transaction" />
                      </div>
                    </div>
                  </div>
                  <p
                    className={
                      isEscrow
                        ? "shrink-0 text-right font-semibold tabular-nums text-amber-700"
                        : isIncoming
                          ? "shrink-0 text-right font-semibold tabular-nums text-emerald-700"
                          : "shrink-0 text-right font-semibold tabular-nums text-rose-700"
                    }
                  >
                    {isEscrow ? "− " : isIncoming ? "+ " : "− "}
                    {formatAmount(flow.amount, flow.asset)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ActivateButton({
  circleId,
  ready,
  status,
}: {
  circleId: string;
  ready: boolean;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "draft") {
    return (
      <div className="mt-6 rounded-xl border border-[var(--color-success-default)]/20 bg-[var(--color-success-default)]/5 p-4 text-sm">
        <p className="font-semibold text-[var(--color-success-default)]">
          Circle is already active
        </p>
        <p className="mt-1 text-muted-foreground">
          This circle has been activated and is processing rounds.
        </p>
      </div>
    );
  }

  async function handleActivate() {
    setLoading(true);
    setError(null);
    try {
      const addressRes = await StellarWalletsKit.getAddress();
      const creatorAddress = addressRes?.address;
      if (!creatorAddress) {
        throw new Error("Connect a Stellar testnet wallet first.");
      }

      if (!env.contractId) {
        throw new Error("NEXT_PUBLIC_CIRCULO_CONTRACT_ID is not configured.");
      }

      toast.info(
        "Preparing on-chain contract activation. Please sign the transaction...",
      );

      const { txXdr } = await triggerActivateOnChain(
        creatorAddress,
        env.contractId,
        circleId,
      );

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: env.sorobanNetworkPassphrase,
        address: creatorAddress,
      });

      toast.info("Submitting activation transaction to Stellar Testnet...");
      await submitSignedTransaction(signedTxXdr);

      const res = await activateCircleAction(circleId);
      if (!res.success) {
        setError(res.error ?? "Activation failed.");
      } else {
        toast.success("Circle successfully activated on-chain!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 grid gap-3">
      {error ? (
        <div className="rounded-xl border border-[var(--color-error-default)]/20 bg-[var(--color-error-default)]/5 p-3 text-sm text-[var(--color-error-default)]">
          {error}
        </div>
      ) : null}
      <Button disabled={!ready || loading} onClick={handleActivate}>
        {loading
          ? "Activating..."
          : ready
            ? "Activate Circle"
            : "Activation Locked"}
      </Button>
      {ready ? (
        <p className="text-xs text-muted-foreground">
          All gates are satisfied. Activating will lock the circle permanently
          and begin Round 1.
        </p>
      ) : null}
    </div>
  );
}

function CreatorDashboard({
  data,
  isTabContentOnly = false,
}: {
  data: CreatorDashboardDTO;
  isTabContentOnly?: boolean;
}) {
  const router = useRouter();
  const [activationOpen, setActivationOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentRound = getCurrentRound(data.rounds, data.circle.currentRound);
  const creatorMember = data.members.find((member) => member.role === "creator");

  // Dissolution state - derived from audit events
  const deleteProposedEvent = data.auditEvents.find(
    (e) => e.eventType === "delete_proposed" && (e.metadata as Record<string, unknown>)?.status === "pending"
  );
  const myVoteEvent = creatorMember
    ? data.auditEvents.find(
        (e) => e.eventType === "delete_voted" && e.memberId === creatorMember.id
      )
    : null;
  const allVoteEvents = data.auditEvents.filter((e) => e.eventType === "delete_voted");
  const approveCount = allVoteEvents.filter(
    (e) => (e.metadata as Record<string, unknown>)?.vote === "approve"
  ).length;

  const deleteProposed = !!deleteProposedEvent;
  const hasVoted = !!myVoteEvent;
  const proposerName = deleteProposedEvent
    ? data.members.find((m) => m.id === deleteProposedEvent.memberId)?.displayName ?? "A member"
    : null;

  const wasRejected = data.auditEvents.some(
    (e) => e.eventType === "delete_proposed" && (e.metadata as Record<string, unknown>)?.status === "rejected"
  );

  const [isPostingCreatorCollateral, setIsPostingCreatorCollateral] = useState(false);
  const postedCollateral = data.members.filter(
    (member) => member.collateralStatus === "posted",
  ).length;
  const acceptedMembers = data.members.filter(
    (member) => member.inviteStatus === "accepted",
  ).length;
  const acceptedAgreements = data.members.filter(
    (member) => member.agreementStatus === "accepted",
  ).length;
  const paidContributions = data.contributions.filter(
    (contribution) => contribution.status === "paid",
  ).length;
  const missingContributions = data.members.length - paidContributions;
  // A member counts as "ready" only when their invite, agreement, and
  // collateral are all validated.
  const readyMembers = data.members.filter(
    (member) =>
      member.inviteStatus === "accepted" &&
      member.agreementStatus === "accepted" &&
      member.collateralStatus === "posted",
  ).length;
  const allPresentValidated =
    data.members.length > 0 && readyMembers === data.members.length;
  const payoutOrderConfigured =
    data.members.length > 0 &&
    [...data.members]
      .sort((left, right) => left.payoutRound - right.payoutRound)
      .every((member, index) => member.payoutRound === index + 1);
  const settingsConfigured =
    data.circle.contributionAmount > 0 && data.circle.intervalSeconds > 0;
  // Small circles should not be blocked by the global three-member target.
  // Keep three as the upper bound for larger circles, while requiring every
  // member currently in this roster to be validated.
  const minimumMembersRequired = Math.min(MIN_CYCLE_MEMBERS, data.members.length);
  const activationReady =
    readyMembers >= minimumMembersRequired &&
    allPresentValidated &&
    payoutOrderConfigured &&
    settingsConfigured;

  const handlePostCreatorCollateral = async () => {
    if (!creatorMember) return;
    setIsPostingCreatorCollateral(true);
    try {
      const wallet = await StellarWalletsKit.getAddress();
      const creatorAddress = wallet?.address;
      if (!creatorAddress) {
        throw new Error("Connect the creator's Stellar wallet first.");
      }
      if (creatorAddress.toUpperCase() !== creatorMember.walletAddress.toUpperCase()) {
        throw new Error("Connect the wallet that created this circle.");
      }

      const { txXdr } = await triggerPostCollateralOnChain(
        creatorAddress,
        env.contractId,
        data.circle.id,
        getTokenContractId(data.circle.contributionAsset),
      );
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: env.sorobanNetworkPassphrase,
        address: creatorAddress,
      });
      const { hash } = await submitSignedTransaction(signedTxXdr);
      const result = await confirmCreatorCollateralAction(data.circle.id, hash);
      if (!result.success) {
        throw new Error(result.error || "Creator collateral could not be confirmed.");
      }

      toast.success("Creator collateral posted successfully.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not post creator collateral.");
    } finally {
      setIsPostingCreatorCollateral(false);
    }
  };

  const tabContent = (
    <>
      <TabsContent value="overview" className="grid gap-6">
        <div className="flex justify-end">
          <Button onClick={() => setActivationOpen(true)}>
            <ShieldCheck className="size-4" />
            Activation Gate
          </Button>
        </div>
        <CircleStatusBanner status={data.circle.status} />

        {deleteProposed && !hasVoted && creatorMember ? (
          <Alert className="border-rose-500/20 bg-rose-50/50 text-rose-700">
            <AlertTriangle className="size-4 text-rose-500" />
            <AlertTitle className="font-bold text-rose-800">Proposal to Delete Circle</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 mt-1.5">
              <span>
                <strong>{proposerName}</strong> has proposed to delete this circle.
                This requires <strong>unanimous approval from all {data.members.length} members</strong>.
              </span>
              <span className="text-xs text-rose-600/80">
                If approved, the escrowed collateral will first be used to compensate members
                who have not yet received their payout, ensuring they are made whole.
                Any remaining collateral will then be refunded proportionally to all members.
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold bg-rose-100 text-rose-700 rounded-full px-2.5 py-0.5">
                  {approveCount} / {data.members.length} approved
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const txHash = await submitDissolutionWalletAction(data.circle.id, false);
                        const res = await voteDeleteCircleAction(data.circle.id, creatorMember.id, "reject", txHash);
                        if (!res.success) toast.error(res.error);
                        else {
                          toast.success("You rejected the proposal. The deletion has been cancelled.");
                          router.refresh();
                        }
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Could not record your vote.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const txHash = await submitDissolutionWalletAction(data.circle.id, true);
                        const res = await voteDeleteCircleAction(data.circle.id, creatorMember.id, "approve", txHash);
                        if (!res.success) toast.error(res.error);
                        else if (res.outcome === "dissolved") {
                          toast.success("All members approved. Collateral settlement completed and the circle was removed.");
                          router.replace("/dashboard");
                          router.refresh();
                        } else {
                          toast.success("Your vote has been recorded.");
                          router.refresh();
                        }
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Could not record your vote.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Approve Deletion
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ) : deleteProposed && hasVoted ? (
          <Alert className="border-blue-500/20 bg-blue-50/50 text-blue-700">
            <Info className="size-4 text-blue-500" />
            <AlertTitle className="font-bold text-blue-800">Vote Recorded — Waiting for Others</AlertTitle>
            <AlertDescription>
              <span>
                Your vote has been recorded. <strong>{approveCount} of {data.members.length}</strong> members
                have approved so far. All members must approve for the dissolution to proceed.
              </span>
              <p className="text-xs text-blue-600/70 mt-1.5">
                If approved, collateral will first compensate members who haven&apos;t received their payout yet.
              </p>
            </AlertDescription>
          </Alert>
        ) : wasRejected ? (
          <Alert className="border-amber-500/20 bg-amber-50/50 text-amber-700">
            <Info className="size-4 text-amber-500" />
            <AlertTitle className="font-bold text-amber-800">Deletion Proposal Rejected</AlertTitle>
            <AlertDescription>
              A previous proposal to delete this circle was rejected by a member. The circle continues as normal.
            </AlertDescription>
          </Alert>
        ) : null}

        {data.circle.status === "cancelled" ? (
          <Alert className="border-rose-500/20 bg-rose-50/50 text-rose-700 animate-enter-soft">
            <AlertTriangle className="size-4 text-rose-500" />
            <AlertTitle className="font-bold text-rose-800">Circle Cancelled</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 mt-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span>This circle has been cancelled. Any posted collateral was refunded automatically. Delete it from Settings if you want to remove it from the dashboard.</span>
            </AlertDescription>
          </Alert>
        ) : data.circle.status === "draft" ? (
          <Alert className="border-amber-500/20 bg-amber-50/50 text-amber-700 animate-enter-soft">
            <AlertTriangle className="size-4 text-amber-500" />
            <AlertTitle className="font-bold text-amber-800">Unstarted Draft Circle</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 mt-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {creatorMember?.collateralStatus === "posted"
                  ? "Waiting for every invited member to post collateral."
                  : "Post your creator collateral to begin setup. The amount is based on your payout position."}
              </span>
              <div className="flex flex-wrap gap-2">
                {creatorMember?.collateralStatus !== "posted" ? (
                  <Button
                    disabled={isPostingCreatorCollateral}
                    onClick={handlePostCreatorCollateral}
                  >
                    {isPostingCreatorCollateral
                      ? "Posting collateral..."
                      : `Post ${formatAmount(
                          calculateCollateral(
                            data.circle.memberCount,
                            data.circle.contributionAmount,
                            creatorMember?.payoutRound ?? 1,
                            data.circle.cycleCount,
                          ),
                          data.circle.contributionAsset,
                        )} collateral`}
                  </Button>
                ) : null}
              </div>
            </AlertDescription>
          </Alert>
        ) : null}
        <CircleStatusCard
          status={data.circle.status}
          currentRound={data.circle.currentRound}
          totalRounds={data.circle.totalRounds}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Collateral Posted"
            value={`${postedCollateral} / ${data.members.length}`}
            icon={LockKeyhole}
          />
          <StatCard
            label="Current Round"
            value={`Round ${data.circle.currentRound}`}
            detail={`of ${data.circle.totalRounds}`}
            icon={CalendarDays}
          />
          <StatCard
            label="Collected"
            value={formatAmount(
              currentRound?.collectedAmount ?? 0,
              data.circle.contributionAsset,
            )}
            detail={`Expected ${formatAmount(currentRound?.expectedAmount ?? 0, data.circle.contributionAsset)}`}
            icon={PiggyBank}
          />
          <StatCard
            label="Next Due"
            value={formatDate(currentRound?.dueAt ?? null)}
            icon={ClipboardCheck}
          />
          <StatCard
            label="Missing Contributions"
            value={`${Math.max(0, missingContributions)} member${missingContributions === 1 ? "" : "s"}`}
            icon={ShieldAlert}
          />
        </div>
        <SectionCard
          title="Circle health"
          description="Operational snapshot for the creator."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Progress
              value={getProgress(postedCollateral, data.members.length)}
            >
              <ProgressLabel>Collateral posted</ProgressLabel>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {postedCollateral} / {data.members.length}
              </span>
            </Progress>
            <Progress
              value={getProgress(paidContributions, data.members.length)}
            >
              <ProgressLabel>Current round paid</ProgressLabel>
              <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                {paidContributions} / {data.members.length}
              </span>
            </Progress>
          </div>
        </SectionCard>
      </TabsContent>

      <Dialog open={activationOpen} onOpenChange={setActivationOpen}>
        <DialogContent className="top-4 right-4 left-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden p-0 sm:w-[min(92vw,56rem)]">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
            <DialogTitle>Activation Gate</DialogTitle>
            <DialogDescription>
              Every requirement below must pass before the circle can begin its first round.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        <Alert>
          <ShieldCheck className="size-4" />
          <AlertTitle>Starting a cycle requires all gates to pass</AlertTitle>
          <AlertDescription>
            A cycle can start once at least {minimumMembersRequired} members have
            validated collateral and every member currently in the circle is
            validated. Members added later join the next cycle, not the one in
            progress.
          </AlertDescription>
        </Alert>
        <SectionCard title="Activation requirements">
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                [
                  `${readyMembers} / ${minimumMembersRequired} minimum members validated`,
                  readyMembers >= minimumMembersRequired,
                ],
                [
                  `${postedCollateral} / ${data.members.length} collateral posted`,
                  postedCollateral === data.members.length,
                ],
                [
                  `${acceptedMembers} / ${data.members.length} members accepted invite`,
                  acceptedMembers === data.members.length,
                ],
                [
                  `${acceptedAgreements} / ${data.members.length} agreements accepted`,
                  acceptedAgreements === data.members.length,
                ],
                [
                  "Payout order selected during creation",
                  payoutOrderConfigured,
                ],
                [
                  "Contribution amount and interval configured",
                  settingsConfigured,
                ],
              ] as [string, boolean][]
            ).map(([label, complete]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-border bg-white p-4"
              >
                <span className="font-medium">{label}</span>
                <StatusBadge status={complete ? "accepted" : "pending"} />
              </div>
            ))}
          </div>

          {!activationReady ? (
            <div className="mt-6 rounded-xl border border-[var(--color-warning-default)]/20 bg-[var(--color-warning-default)]/5 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-[var(--color-text-default)]">
                Why can&apos;t I start the cycle yet?
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {readyMembers < minimumMembersRequired ? (
                  <li>
                    Need at least {minimumMembersRequired} members with validated
                    collateral — {readyMembers} ready so far.
                  </li>
                ) : null}
                {postedCollateral < data.members.length ? (
                  <li>
                    {data.members.length - postedCollateral} member
                    {data.members.length - postedCollateral > 1 ? "s" : ""}{" "}
                    still need
                    {data.members.length - postedCollateral === 1 ? "s" : ""} to
                    post collateral.
                  </li>
                ) : null}
                {acceptedMembers < data.members.length ? (
                  <li>
                    {data.members.length - acceptedMembers} invite
                    {data.members.length - acceptedMembers > 1 ? "s" : ""}{" "}
                    pending.
                  </li>
                ) : null}
                {acceptedAgreements < data.members.length ? (
                  <li>
                    {data.members.length - acceptedAgreements} agreement
                    {data.members.length - acceptedAgreements > 1 ? "s" : ""}{" "}
                    not yet accepted.
                  </li>
                ) : null}
                {!payoutOrderConfigured ? (
                  <li>Payout order is incomplete.</li>
                ) : null}
                {!settingsConfigured ? (
                  <li>Contribution amount or interval is incomplete.</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <ActivateButton
            circleId={data.circle.id}
            ready={activationReady}
            status={data.circle.status}
          />
        </SectionCard>
          </div>
          <DialogFooter className="mt-0 shrink-0 border-t border-border px-6 py-4">
            <Button variant="outline" onClick={() => setActivationOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TabsContent value="members">
        <SectionCard
          title="Members & Collateral"
          description="Creator-only roster, collateral, payment, and restriction status."
        >
          <MemberTable
            members={data.members}
            slashControls={
              data.circle.status === "active" && data.circle.autoSlashEnabled
                ? { circleId: data.circle.id, slashPercentage: data.circle.slashPercentage }
                : undefined
            }
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="audit">
        <SectionCard
          title="Audit Log"
          description="Complete activity history — who joined, paid, received payouts, and when."
        >
          <AuditLog events={data.auditEvents} members={data.members} timeZone={data.circle.timeZone} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="calendar">
        <SectionCard
          title="Cycle Calendar"
          description="Contribution due dates, payout dates, grace windows, and status markers."
        >
          <div className="mb-4 flex justify-end">
            <CalendarExportButton events={[]} circleName={data.circle.name} />
          </div>
          <CycleCalendarView
            rounds={data.rounds}
            payouts={data.payouts}
            contributions={data.contributions}
            members={data.members}
            currentMemberId={creatorMember?.id}
            asset={data.circle.contributionAsset}
            timeZone={data.circle.timeZone}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="agreement">
        <SectionCard
          title="Circle Agreement"
          description="The rules, protection terms, collateral, and obligations that every member accepted."
        >
          <DefaultProtectionCreatorView circle={data.circle} members={data.members} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="settings" className="grid gap-6">
        <SectionCard
          title="Settings"
          description="Financial settings, timezone, cycle configuration, and emergency controls for this circle."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Contribution"
              value={formatAmount(
                data.circle.contributionAmount,
                data.circle.contributionAsset,
              )}
              icon={PiggyBank}
            />
            <StatCard
              label="Interval"
              value={formatInterval(data.circle.intervalSeconds)}
              icon={CalendarDays}
            />
            <StatCard
              label="Cycles"
              value={`${data.circle.cycleCount} (${data.circle.totalRounds} rounds)`}
              icon={RefreshCcw}
            />
            <StatCard
              label="Timezone"
              value={data.circle.timeZone}
              icon={Clock}
            />
            <StatCard
              label="Collateral"
              value={`Dynamic (max ${formatAmount(calculateCollateral(data.circle.memberCount, data.circle.contributionAmount, 1, data.circle.cycleCount), data.circle.contributionAsset)})`}
              icon={LockKeyhole}
            />
            <StatCard
              label="Settings"
              value={data.circle.settingsLocked ? "Locked" : "Draft editable"}
              icon={Settings}
            />
          </div>
          {data.circle.status === "draft" || data.circle.status === "cancelled" ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
              <div>
                <p className="font-semibold">Remove circle</p>
                <p className="text-sm text-muted-foreground">
                  Available only when the server-side deletion rules allow it.
                </p>
              </div>
              <DeleteCircleButton circleId={data.circle.id} />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4 p-4 border rounded-lg bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Propose Circle Dissolution</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-xl">
                    Propose to dissolve and delete this circle. This starts a vote visible to all
                    members in the Overview tab. <strong>All members must unanimously approve</strong> for
                    the dissolution to proceed.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  disabled={deleteProposed || loading || !creatorMember}
                  onClick={async () => {
                    if (!creatorMember) return;
                    if (!confirm(
                      "Are you sure you want to propose dissolving this circle?\n\n" +
                      "This will start a vote. ALL members must approve for the circle to be deleted.\n\n" +
                      "If approved, the escrowed collateral will first compensate members who " +
                      "haven't received their payout yet, then any remainder is refunded to everyone."
                    )) return;
                    setLoading(true);
                    try {
                      const txHash = await submitDissolutionWalletAction(data.circle.id);
                      const res = await proposeDeleteCircleAction(data.circle.id, creatorMember.id, txHash);
                      if (!res.success) toast.error(res.error);
                      else {
                        toast.success("Dissolution proposed. All members can now vote in the Overview tab.");
                        router.refresh();
                      }
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not open the dissolution proposal.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="shrink-0"
                >
                  {deleteProposed ? "Dissolution Proposed" : "Propose Dissolution"}
                </Button>
              </div>
              <div className="text-xs text-slate-400 border-t pt-3 space-y-1">
                <p><strong>How collateral recovery works:</strong></p>
                <p>
                  Upon unanimous approval, the smart contract distributes the escrowed collateral
                  to compensate members who have not yet received their round payouts first.
                  Any remaining collateral is then refunded proportionally to all members.
                </p>
              </div>
            </div>
          )}
        </SectionCard>
        <SectionCard title="Emergency controls" description="Pause, resume, or cancel according to the circle's safety rules.">
        <EmergencyActionsPanel
          circleId={data.circle.id}
          circleStatus={data.circle.status}
          onPause={async (reason) => {
            const res = await pauseCircleAction(data.circle.id, reason);
            if (!res.success) throw new Error(res.error);
          }}
          onResume={async () => {
            const res = await resumeCircleAction(data.circle.id);
            if (!res.success) throw new Error(res.error);
          }}
          onCancel={async (reason) => {
            const addressRes = await StellarWalletsKit.getAddress();
            const creatorAddress = addressRes?.address;
            if (!creatorAddress) {
              throw new Error("Connect a Stellar testnet wallet first.");
            }

            if (!env.contractId) {
              throw new Error("NEXT_PUBLIC_CIRCULO_CONTRACT_ID is not configured.");
            }

            toast.info("Preparing on-chain contract cancellation. Please sign the transaction...");

            const { txXdr } = await triggerCancelCircleOnChain(
              creatorAddress,
              env.contractId,
              data.circle.id
            );

            const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
              networkPassphrase: env.sorobanNetworkPassphrase,
              address: creatorAddress,
            });

            toast.info("Submitting cancellation transaction to Stellar Testnet...");
            const { hash: txHash } = await submitSignedTransaction(signedTxXdr);

            const res = await cancelCircleAction(data.circle.id, reason, txHash);
            if (!res.success) throw new Error(res.error);
            toast.success("Circle successfully cancelled on-chain!");
          }}
        ></EmergencyActionsPanel>
        <EmergencyRulesDisplay />
        </SectionCard>
      </TabsContent>
    </>
  );

  if (isTabContentOnly) {
    return tabContent;
  }

  return (
    <Tabs defaultValue="overview" className="gap-5">
      <TabsList className="max-w-full overflow-x-auto" variant="line">
        {[
          ["overview", "Overview"],
          ["members", "Members & Collateral"],
          ["audit", "Audit Log"],
          ["calendar", "Cycle Calendar"],
          ["agreement", "Agreement"],
          ["settings", "Settings"],
        ].map(([value, label]) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabContent}
    </Tabs>
  );
}

function MemberDashboard({
  data,
  isTabContentOnly = false,
}: {
  data: MemberDashboardDTO;
  isTabContentOnly?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Dissolution state — derived from audit events
  const deleteProposedEvent = data.auditEvents.find(
    (e) => e.eventType === "delete_proposed" && (e.metadata as Record<string, unknown>)?.status === "pending"
  );
  const myVoteEvent = data.auditEvents.find(
    (e) => e.eventType === "delete_voted" && e.memberId === data.currentMember.id
  );
  const allVoteEvents = data.auditEvents.filter((e) => e.eventType === "delete_voted");
  const approveCount = allVoteEvents.filter(
    (e) => (e.metadata as Record<string, unknown>)?.vote === "approve"
  ).length;

  const deleteProposed = !!deleteProposedEvent;
  const hasVoted = !!myVoteEvent;
  const proposerName = deleteProposedEvent
    ? data.members.find((m) => m.id === deleteProposedEvent.memberId)?.displayName ?? "A member"
    : null;

  // Check if a proposal was recently rejected
  const wasRejected = data.auditEvents.some(
    (e) => e.eventType === "delete_proposed" && (e.metadata as Record<string, unknown>)?.status === "rejected"
  );

  const currentRound = getCurrentRound(data.rounds, data.circle.currentRound);
  const myContribution = data.contributions.find(
    (contribution) =>
      contribution.memberId === data.currentMember.id &&
      contribution.roundId === currentRound?.id,
  );
  const paymentButtonStatus: "idle" | "verifying" | "paid" =
    myContribution?.status === "paid"
      ? "paid"
      : myContribution?.status === "verifying"
        ? "verifying"
        : "idle";
  const paidMembers = data.contributions.filter(
    (contribution) => contribution.status === "paid",
  ).length;
  const pendingMembers = data.contributions.filter((contribution) =>
    ["pending", "due_now", "due_soon"].includes(contribution.status),
  ).length;
  const lateMembers = data.contributions.filter((contribution) =>
    ["late", "grace_period", "missed"].includes(contribution.status),
  ).length;
  const postedCollateral = data.members.filter(
    (m) => m.collateralStatus === "posted",
  ).length;
  const missingContributions =
    data.members.length -
    data.contributions.filter(
      (c) => c.roundId === currentRound?.id && c.status === "paid",
    ).length;

  const tabContent = (
    <>
      <TabsContent value="overview" className="grid gap-6">
        {data.circle.status === "cancelled" ? (
          <Alert className="border-rose-500/20 bg-rose-50/50 text-rose-700">
            <AlertTriangle className="size-4 text-rose-500" />
            <AlertTitle className="font-bold text-rose-800">Circle Cancelled by Creator</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 mt-1.5 sm:flex-row sm:items-center sm:justify-between">
              <span>This savings circle has been cancelled. Any posted collateral was refunded automatically on-chain.</span>
            </AlertDescription>
          </Alert>
        ) : null}

        {data.currentMember.agreementStatus === "pending" ? (
          <Alert className="border-amber-500/20 bg-amber-500/5 text-amber-600">
            <AlertTriangle className="size-4 text-amber-500" />
            <AlertTitle>Pending Circle Agreement</AlertTitle>
            <AlertDescription className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span>
                You have been invited to join this rotating savings circle.
                Please read and accept the agreement rules to participate.
              </span>
              <Link href={`/dashboard/${data.circle.id}/agreement`} passHref>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
                >
                  Review & Join
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        {deleteProposed && !hasVoted ? (
          <Alert className="border-rose-500/20 bg-rose-50/50 text-rose-700">
            <AlertTriangle className="size-4 text-rose-500" />
            <AlertTitle className="font-bold text-rose-800">Proposal to Delete Circle</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 mt-1.5">
              <span>
                <strong>{proposerName}</strong> has proposed to delete this circle.
                This requires <strong>unanimous approval from all {data.members.length} members</strong>.
              </span>
              <span className="text-xs text-rose-600/80">
                If approved, the escrowed collateral will first be used to compensate members
                who have not yet received their payout, ensuring they are made whole.
                Any remaining collateral will then be refunded proportionally to all members.
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold bg-rose-100 text-rose-700 rounded-full px-2.5 py-0.5">
                  {approveCount} / {data.members.length} approved
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const txHash = await submitDissolutionWalletAction(data.circle.id, false);
                        const res = await voteDeleteCircleAction(data.circle.id, data.currentMember.id, "reject", txHash);
                        if (!res.success) toast.error(res.error);
                        else {
                          toast.success("You rejected the proposal. The deletion has been cancelled.");
                          router.refresh();
                        }
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Could not record your vote.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const txHash = await submitDissolutionWalletAction(data.circle.id, true);
                        const res = await voteDeleteCircleAction(data.circle.id, data.currentMember.id, "approve", txHash);
                        if (!res.success) toast.error(res.error);
                        else if (res.outcome === "dissolved") {
                          toast.success("All members approved. Collateral settlement completed and the circle was removed.");
                          router.replace("/dashboard");
                          router.refresh();
                        } else {
                          toast.success("Your vote has been recorded.");
                          router.refresh();
                        }
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Could not record your vote.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Approve Deletion
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ) : deleteProposed && hasVoted ? (
          <Alert className="border-blue-500/20 bg-blue-50/50 text-blue-700">
            <Info className="size-4 text-blue-500" />
            <AlertTitle className="font-bold text-blue-800">Vote Recorded — Waiting for Others</AlertTitle>
            <AlertDescription>
              <span>
                Your vote has been recorded. <strong>{approveCount} of {data.members.length}</strong> members
                have approved so far. All members must approve for the dissolution to proceed.
              </span>
              <p className="text-xs text-blue-600/70 mt-1.5">
                If approved, collateral will first compensate members who haven&apos;t received their payout yet.
              </p>
            </AlertDescription>
          </Alert>
        ) : wasRejected ? (
          <Alert className="border-amber-500/20 bg-amber-50/50 text-amber-700">
            <Info className="size-4 text-amber-500" />
            <AlertTitle className="font-bold text-amber-800">Deletion Proposal Rejected</AlertTitle>
            <AlertDescription>
              A previous proposal to delete this circle was rejected by a member. The circle continues as normal.
            </AlertDescription>
          </Alert>
        ) : null}

        <ContributionReminderBanner
          currentRound={currentRound ?? null}
          myContribution={myContribution}
          contributionAmount={data.circle.contributionAmount}
          contributionAsset={data.circle.contributionAsset}
        />
        <CircleStatusBanner status={data.circle.status} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Collateral Posted"
            value={`${postedCollateral} / ${data.members.length}`}
            icon={LockKeyhole}
          />
          <StatCard
            label="Current Round"
            value={`Round ${data.circle.currentRound}`}
            detail={`of ${data.circle.totalRounds}`}
            icon={CalendarDays}
          />
          <StatCard
            label="Collected"
            value={formatAmount(
              currentRound?.collectedAmount ?? 0,
              data.circle.contributionAmount > 0
                ? data.circle.contributionAsset
                : "",
            )}
            detail={`Expected ${formatAmount(currentRound?.expectedAmount ?? 0, data.circle.contributionAmount > 0 ? data.circle.contributionAsset : "")}`}
            icon={PiggyBank}
          />
          <StatCard
            label="Next Due"
            value={formatDate(currentRound?.dueAt ?? null)}
            icon={ClipboardCheck}
          />
          <StatCard
            label="Missing Contributions"
            value={`${Math.max(0, missingContributions)} member${missingContributions === 1 ? "" : "s"}`}
            icon={ShieldAlert}
          />
        </div>
        <CircleStatusCard
          status={data.circle.status}
          currentRound={data.circle.currentRound}
          totalRounds={data.circle.totalRounds}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard title="Your status" description="Your contribution, payout position, and account standing.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your due</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatAmount(myContribution?.amountDue ?? data.circle.contributionAmount, data.circle.contributionAsset)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due date</p>
                <p className="mt-1 text-lg font-semibold">{formatDate(currentRound?.dueAt ?? null)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your payout</p>
                <p className="mt-1 text-lg font-semibold">Round {data.currentMember.payoutRound}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Standing</p>
                <p className="mt-1 text-lg font-semibold">
                  {titleCase(data.currentMember.restrictionStatus === "clear" ? data.currentMember.paymentStatus : data.currentMember.restrictionStatus)}
                </p>
              </div>
            </div>
          </SectionCard>
          {data.circle.status === "active" && currentRound ? (
            <WalletPayButton
              circleId={data.circle.id}
              amount={myContribution?.amountDue ?? data.circle.contributionAmount}
              asset={data.circle.contributionAsset}
              dueDate={currentRound.dueAt}
              roundNumber={currentRound.roundNumber}
              status={paymentButtonStatus}
            />
          ) : (
            <SectionCard title="Contribution payment" description="Payments become available when the circle starts its current round.">
              <p className="text-sm text-muted-foreground">This circle is not currently accepting contributions.</p>
            </SectionCard>
          )}
        </div>
      </TabsContent>

      <TabsContent value="transactions" className="grid gap-6">
        <MemberTransactionHistory data={data} />
      </TabsContent>

      <TabsContent value="calendar">
        <CycleCalendarView
          rounds={data.rounds}
          payouts={data.payouts}
          contributions={data.contributions}
          members={data.members}
          currentMemberId={data.currentMember.id}
          asset={data.circle.contributionAsset}
          timeZone={data.circle.timeZone}
        />
      </TabsContent>

      <TabsContent value="audit" className="grid gap-6">
        <SectionCard
          title="Audit Log"
          description="Contribution, payout, and circle activity visible to every member."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Paid"
              value={String(paidMembers)}
              icon={ShieldCheck}
            />
            <StatCard
              label="Pending"
              value={String(pendingMembers)}
              icon={ClipboardCheck}
            />
            <StatCard
              label="Late"
              value={String(lateMembers)}
              icon={ShieldAlert}
            />
            <StatCard
              label="Collected"
              value={formatAmount(
                currentRound?.collectedAmount ?? 0,
                data.circle.contributionAsset,
              )}
              icon={PiggyBank}
            />
          </div>
        </SectionCard>
        <SectionCard
          title="Activity History"
          description="Verified payments, payouts, and important circle events."
        >
          <AuditLog events={data.auditEvents} members={data.members} timeZone={data.circle.timeZone} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="collateral" className="grid gap-6">
        <SectionCard
          title="Collateral & Agreement"
          description="Your collateral status and the protection rules you accepted for this circle."
        >
          <p className="text-sm text-muted-foreground">
            Review your current protection status below. The full agreement remains available from the circle agreement route.
          </p>
        </SectionCard>
        <DefaultProtectionMemberView
          circle={data.circle}
          member={data.currentMember}
        />
      </TabsContent>

      <TabsContent value="settings" className="grid gap-6">
        <SectionCard
          title="Circle Settings"
          description="Member-specific settings and emergency controls."
        >
          {data.circle.status === "cancelled" ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-slate-50/50">
              <div>
                <h4 className="font-semibold text-slate-900">Remove from Dashboard</h4>
                <p className="text-sm text-slate-500 mt-1 max-w-xl">
                  This circle has been dissolved and cancelled. You can safely remove it from your dashboard. This will remove your membership record.
                </p>
              </div>
              <Button
                variant="outline"
                disabled={loading}
                onClick={async () => {
                  if (!confirm("Are you sure you want to remove this circle from your dashboard?")) return;
                  setLoading(true);
                  const res = await leaveCancelledCircleAction(data.circle.id, data.currentMember.id);
                  if (!res.success) toast.error(res.error);
                  else {
                    toast.success("Circle removed from dashboard.");
                    router.push("/dashboard");
                    router.refresh();
                  }
                  setLoading(false);
                }}
                className="shrink-0"
              >
                Remove Circle
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-4 border rounded-lg bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900">Propose Circle Dissolution</h4>
                  <p className="text-sm text-slate-500 mt-1 max-w-xl">
                    Propose to dissolve and delete this circle. This starts a vote visible to all
                    members in the Overview tab. <strong>All members must unanimously approve</strong> for
                    the dissolution to proceed.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  disabled={deleteProposed || loading || data.currentMember.role !== "creator"}
                  onClick={async () => {
                    if (!confirm(
                      "Are you sure you want to propose dissolving this circle?\n\n" +
                      "This will start a vote. ALL members must approve for the circle to be deleted.\n\n" +
                      "If approved, the escrowed collateral will first compensate members who " +
                      "haven't received their payout yet, then any remainder is refunded to everyone."
                    )) return;
                    setLoading(true);
                    const res = { success: false, error: "Only the circle creator can open a dissolution proposal." };
                    if (!res.success) toast.error(res.error);
                    if (!res.success) toast.error(res.error);
                    else {
                      toast.success("Dissolution proposed. All members can now vote in the Overview tab.");
                      router.refresh();
                    }
                    setLoading(false);
                  }}
                  className="shrink-0"
                >
                  {deleteProposed ? "Dissolution Proposed" : "Propose Dissolution"}
                </Button>
              </div>
              <div className="text-xs text-slate-400 border-t pt-3 space-y-1">
                <p><strong>How collateral recovery works:</strong></p>
                <p>
                  Upon unanimous approval, the smart contract distributes the escrowed collateral
                  to compensate members who have not yet received their round payouts first.
                  Any remaining collateral is then refunded proportionally to all members.
                </p>
              </div>
            </div>
          )}
        </SectionCard>
      </TabsContent>
    </>
  );

  if (isTabContentOnly) {
    return tabContent;
  }

  return (
    <Tabs defaultValue="overview" className="gap-5">
      <TabsList className="max-w-full overflow-x-auto" variant="line">
        {[
          ["overview", "Overview"],
          ["transactions", "Transactions"],
          ["calendar", "Cycle Calendar"],
          ["audit", "Audit Log"],
          ["collateral", "Collateral & Agreement"],
          ["settings", "Settings"],
        ].map(([value, label]) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabContent}
    </Tabs>
  );
}

function DashboardEmptyState({ configured }: { configured: boolean }) {
  return (
    <EmptyState
      icon={<UsersRound className="size-8" />}
      title={
        configured ? "No circle dashboard yet" : "Supabase is not configured"
      }
      description={
        configured
          ? "Once you create or accept an invite-only pool, your creator or member dashboard will appear here."
          : "Add Supabase environment variables to load authenticated circle dashboards."
      }
      actions={<Button disabled>Circle setup comes next</Button>}
    />
  );
}

export function DashboardViews({
  data,
  isTabContentOnly = false,
}: {
  data: DashboardDTO;
  isTabContentOnly?: boolean;
}) {
  if (data.role === "creator") {
    return <CreatorDashboard data={data} isTabContentOnly={isTabContentOnly} />;
  }
  if (data.role === "member") {
    return <MemberDashboard data={data} isTabContentOnly={isTabContentOnly} />;
  }
  return <DashboardEmptyState configured={data.configured} />;
}

function DeleteCircleButton({ circleId }: { circleId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you absolutely sure you want to permanently delete this circle? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await deleteCircleAction(circleId);
      if (res.success) {
        toast.success("Circle permanently deleted.");
        router.push("/dashboard");
        router.refresh();
      } else {
        throw new Error(res.error || "Failed to delete circle.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={loading}
      onClick={handleDelete}
      className="font-semibold shadow-sm flex items-center gap-1.5 hover:bg-rose-700"
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      Delete Circle
    </Button>
  );
}
