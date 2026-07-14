"use client";

import { useState } from "react";
import Link from "next/link";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
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
  acceptAgreementAction,
  activateCircleAction,
} from "@/app/dashboard/actions";
import { ContributionReminderBanner } from "@/components/reminders/contribution-reminder-banner";
import { ReminderSettingsPanel } from "@/components/reminders/reminder-settings-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StellarWalletsKit } from "@/config/stellar";
import {
  triggerPostCollateralOnChain,
  triggerActivateOnChain,
  submitSignedTransaction,
} from "@/services/contractService";
import { env, getTokenContractId } from "@/lib/env";
import { calculateCollateral } from "@/lib/create/validation";
import type {
  CreatorDashboardDTO,
  DashboardAuditEvent,
  DashboardContribution,
  DashboardDTO,
  DashboardMember,
  DashboardPayout,
  DashboardRound,
  MemberDashboardDTO,
  DashboardNotification,
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

export function MemberTable({ members }: { members: DashboardMember[] }) {
  const [search, setSearch] = useState("");
  const [filterInvite, setFilterInvite] = useState<string | null>(null);
  const [filterAgreement, setFilterAgreement] = useState<string | null>(null);
  const [filterCollateral, setFilterCollateral] = useState<string | null>(null);
  const [filterPayment, setFilterPayment] = useState<string | null>(null);
  const [filterRestriction, setFilterRestriction] = useState<string | null>(
    null,
  );
  const [sort, toggleSort, sortFn] = useSort("displayName");

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
              label="Payout"
              sortKey="payoutRound"
              sort={sort}
              onToggle={toggleSort}
            />
            <SortHeader
              label="Restriction"
              sortKey="restrictionStatus"
              sort={sort}
              onToggle={toggleSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
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
                <TableCell>Round {member.payoutRound}</TableCell>
                <TableCell>
                  <StatusBadge status={member.restrictionStatus} />
                </TableCell>
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
                  {contribution.txHash
                    ? shortenWallet(contribution.txHash)
                    : "-"}
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
  const currentRound = getCurrentRound(data.rounds, data.circle.currentRound);
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
  const activationReady =
    readyMembers >= MIN_CYCLE_MEMBERS &&
    allPresentValidated &&
    data.circle.payoutOrderLocked &&
    data.circle.settingsLocked &&
    data.circle.rulesLocked;

  const tabContent = (
    <>
      <TabsContent value="overview" className="grid gap-6">
        <CircleStatusBanner status={data.circle.status} />
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

      <TabsContent value="activation" className="grid gap-6">
        <Alert>
          <ShieldCheck className="size-4" />
          <AlertTitle>Starting a cycle requires all gates to pass</AlertTitle>
          <AlertDescription>
            A cycle can start once at least {MIN_CYCLE_MEMBERS} members have
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
                  `${readyMembers} / ${MIN_CYCLE_MEMBERS} minimum members validated`,
                  readyMembers >= MIN_CYCLE_MEMBERS,
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
                  "Payout order selected and locked",
                  data.circle.payoutOrderLocked,
                ],
                [
                  "Contribution amount and interval locked",
                  data.circle.settingsLocked,
                ],
                [
                  "Default and collateral rules locked",
                  data.circle.rulesLocked,
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
                {readyMembers < MIN_CYCLE_MEMBERS ? (
                  <li>
                    Need at least {MIN_CYCLE_MEMBERS} members with validated
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
                {!data.circle.payoutOrderLocked ? (
                  <li>Payout order not locked.</li>
                ) : null}
                {!data.circle.settingsLocked ? (
                  <li>Settings not locked.</li>
                ) : null}
                {!data.circle.rulesLocked ? <li>Rules not locked.</li> : null}
              </ul>
            </div>
          ) : null}

          <ActivateButton
            circleId={data.circle.id}
            ready={activationReady}
            status={data.circle.status}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="members">
        <SectionCard
          title="Members & Collateral"
          description="Creator-only roster, collateral, payment, and restriction status."
        >
          <MemberTable members={data.members} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="contributions">
        <SectionCard
          title="Contribution Tracking"
          description="On-chain contribution verification is the primary flow."
        >
          <ContributionTable
            contributions={data.contributions}
            members={data.members}
            asset={data.circle.contributionAsset}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="payouts">
        <SectionCard
          title="Payout Order"
          description="Once active, payout order cannot be changed."
        >
          <PayoutTimeline payouts={data.payouts} members={data.members} />
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
            asset={data.circle.contributionAsset}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="defaults">
        <DefaultProtectionCreatorView
          circle={data.circle}
          members={data.members}
        />
      </TabsContent>

      <TabsContent value="audit">
        <SectionCard
          title="Audit Log"
          description="Complete activity history — who joined, paid, received payouts, and when."
        >
          <AuditLog events={data.auditEvents} members={data.members} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="settings">
        <SectionCard
          title="Pool Settings"
          description="Financial settings lock after activation; only non-financial metadata stays editable."
        >
          <div className="grid gap-3 md:grid-cols-2">
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
              label="Collateral"
              value={`Dynamic (max ${formatAmount(calculateCollateral(data.circle.memberCount, data.circle.contributionAmount, 1), data.circle.contributionAsset)})`}
              icon={LockKeyhole}
            />
            <StatCard
              label="Settings"
              value={data.circle.settingsLocked ? "Locked" : "Draft editable"}
              icon={Settings}
            />
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="emergency" className="grid gap-6">
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
            const res = await cancelCircleAction(data.circle.id, reason);
            if (!res.success) throw new Error(res.error);
          }}
        />
        <EmergencyRulesDisplay />
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
          ["activation", "Activation Gate"],
          ["members", "Members & Collateral"],
          ["contributions", "Contributions"],
          ["payouts", "Payout Order"],
          ["calendar", "Cycle Calendar"],
          ["defaults", "Default Protection"],
          ["audit", "Audit Log"],
          ["settings", "Pool Settings"],
          ["emergency", "Emergency"],
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
  const [activeInviteNotification, setActiveInviteNotification] =
    useState<DashboardNotification | null>(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [inviteActionError, setInviteActionError] = useState<string | null>(
    null,
  );

  const handleAcceptInvite = async () => {
    if (!activeInviteNotification) return;
    setIsAcceptingInvite(true);
    setInviteActionError(null);

    const circleId = activeInviteNotification.circleId || data.circle.id;
    const notificationId = activeInviteNotification.id;

    try {
      // 1. Connect wallet & fetch active address
      const addressRes = await StellarWalletsKit.getAddress();
      const userAddress = addressRes?.address;
      if (!userAddress) {
        throw new Error(
          "Stellar wallet address not found. Please connect your wallet first.",
        );
      }
      if (
        userAddress.toUpperCase() !==
        data.currentMember.walletAddress.toUpperCase()
      ) {
        throw new Error(
          "Connect the Stellar wallet that received this invitation.",
        );
      }

      if (!env.contractId) {
        throw new Error("NEXT_PUBLIC_CIRCULO_CONTRACT_ID is not configured.");
      }
      const tokenContractId = getTokenContractId(data.circle.contributionAsset);

      const { txXdr } = await triggerPostCollateralOnChain(
        userAddress,
        env.contractId,
        circleId,
        tokenContractId,
      );

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
        networkPassphrase: env.sorobanNetworkPassphrase,
        address: userAddress,
      });
      const { hash: txHash } = await submitSignedTransaction(signedTxXdr);

      const res = await acceptAgreementAction(circleId, notificationId, txHash);
      if (res.success) {
        toast.success(
          "Invitation accepted and collateral posted successfully!",
        );
        setActiveInviteNotification(null);
      } else {
        throw new Error(res.error || "Failed to accept circle invitation.");
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Invite acceptance error:", error);
      toast.error(error.message || "Failed to accept invite.");
      setInviteActionError(
        error.message || "Failed to process on-chain transaction.",
      );
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  const currentRound = getCurrentRound(data.rounds, data.circle.currentRound);
  const myContribution = data.contributions.find(
    (contribution) =>
      contribution.memberId === data.currentMember.id &&
      contribution.roundId === currentRound?.id,
  );
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
      </TabsContent>

      <TabsContent value="status" className="grid gap-6">
        <CircleStatusCard
          status={data.circle.status}
          currentRound={data.circle.currentRound}
          totalRounds={data.circle.totalRounds}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Your Due"
            value={formatAmount(
              myContribution?.amountDue ?? data.circle.contributionAmount,
              data.circle.contributionAsset,
            )}
            icon={PiggyBank}
          />
          <StatCard
            label="Due Date"
            value={formatDate(currentRound?.dueAt ?? null)}
            icon={CalendarDays}
          />
          <StatCard
            label="Your Payout"
            value={`Round ${data.currentMember.payoutRound}`}
            icon={WalletCards}
          />
          <StatCard
            label="Collateral"
            value={titleCase(data.currentMember.collateralStatus)}
            icon={LockKeyhole}
          />
          <StatCard
            label="Status"
            value={titleCase(
              data.currentMember.restrictionStatus === "clear"
                ? data.currentMember.paymentStatus
                : data.currentMember.restrictionStatus,
            )}
            icon={ShieldCheck}
          />
        </div>
      </TabsContent>

      <TabsContent value="pay">
        <SectionCard
          title="Pay Contribution"
          description="Use wallet payment and on-chain verification as the main flow."
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-3xl font-semibold">
                {formatAmount(
                  myContribution?.amountDue ?? data.circle.contributionAmount,
                  data.circle.contributionAsset,
                )}
              </p>
              <p className="mt-2 text-muted-foreground">
                Due {formatDate(currentRound?.dueAt ?? null)}
              </p>
              <div className="mt-4">
                <StatusBadge status={myContribution?.status ?? "not_due"} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>
                Pay{" "}
                {formatAmount(
                  data.circle.contributionAmount,
                  data.circle.contributionAsset,
                )}
              </Button>
              <Button variant="outline">View transaction</Button>
            </div>
          </div>
        </SectionCard>
      </TabsContent>

      <TabsContent value="timeline">
        <SectionCard
          title="Payout Timeline"
          description="Payout order was locked before activation. Members can view it, not edit it."
        >
          <PayoutTimeline payouts={data.payouts} members={data.members} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="transparency" className="grid gap-6">
        <SectionCard
          title="Group Transparency"
          description="Member-safe pool health without creator-only settings."
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
          description="Record of who joined, paid, received payouts, and when."
        >
          <AuditLog events={data.auditEvents} members={data.members} />
        </SectionCard>
      </TabsContent>

      <TabsContent value="collateral">
        <DefaultProtectionMemberView
          circle={data.circle}
          member={data.currentMember}
        />
      </TabsContent>

      <TabsContent value="rules" className="grid gap-6">
        <SectionCard
          title="Rules & Agreement"
          description="Short, explicit participation boundaries."
        >
          <div className="grid gap-3">
            {[
              "This is not an investment, lending product, yield product, or public fundraiser.",
              "Contribution amount, member roster, payout order, collateral rules, and interval are locked before activation.",
              "Collateral may be slashed after missed contribution rules are met.",
              "The contract pays members directly. Circulo does not custody funds.",
              "Cash-in and cash-out are handled by licensed partners, not Circulo.",
            ].map((rule) => (
              <div
                key={rule}
                className="rounded-xl border border-border bg-white p-4 text-sm leading-6"
              >
                {rule}
              </div>
            ))}
          </div>
        </SectionCard>
        <EmergencyRulesDisplay />
      </TabsContent>

      <TabsContent value="notifications" className="grid gap-6">
        <SectionCard
          title="Notifications"
          description="Member-facing status updates and action reminders."
        >
          {data.notifications.length > 0 ? (
            <div className="grid gap-3">
              {data.notifications.map((notification) => {
                const isInvite =
                  notification.notificationType === "invite" &&
                  !notification.readAt;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-xl border border-border bg-white p-4 transition-all",
                      isInvite &&
                        "cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/[0.01]",
                    )}
                    onClick={() => {
                      if (isInvite) {
                        setActiveInviteNotification(notification);
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{notification.title}</p>
                        {isInvite && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20 font-medium"
                          >
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <StatusBadge
                        status={notification.readAt ? "completed" : "pending"}
                      />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {notification.body}
                    </p>
                    {isInvite && (
                      <p className="mt-3 text-xs text-indigo-500 font-semibold flex items-center gap-1">
                        Click to review invitation & deposit collateral →
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}
        </SectionCard>
        <ReminderSettingsPanel
          reminderScheduleHours={data.circle.reminderScheduleHours}
        />
      </TabsContent>

      <Dialog
        open={!!activeInviteNotification}
        onOpenChange={(open) => {
          if (!open) {
            setActiveInviteNotification(null);
            setInviteActionError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Savings Circle Invitation</DialogTitle>
            <DialogDescription>
              Confirm your participation in the savings circle and post your
              collateral deposit.
            </DialogDescription>
          </DialogHeader>

          {activeInviteNotification && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-slate-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Circle Name</span>
                  <span className="font-semibold text-foreground">
                    {data.circle.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Contribution Amount
                  </span>
                  <span className="font-semibold text-foreground">
                    {data.circle.contributionAmount}{" "}
                    {data.circle.contributionAsset}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Collateral Required
                  </span>
                  <span className="font-bold text-indigo-600">
                    {calculateCollateral(
                      data.circle.memberCount,
                      data.circle.contributionAmount,
                      data.currentMember.payoutRound,
                    )}{" "}
                    {data.circle.contributionAsset}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-indigo-50 border border-indigo-100 p-3 rounded-xl leading-5">
                <span className="font-bold text-indigo-600 block mb-1">
                  🔒 Non-Custodial Escrow Security
                </span>
                Accepting this invitation requires you to deposit the collateral
                to the circle&apos;s automated smart contract escrow. The
                platform operators never hold or control your funds. The deposit
                will be automatically deducted from your connected Stellar
                wallet.
              </div>

              {inviteActionError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                  {inviteActionError}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setActiveInviteNotification(null);
                setInviteActionError(null);
              }}
              disabled={isAcceptingInvite}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptInvite}
              disabled={isAcceptingInvite}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center min-w-[120px]"
            >
              {isAcceptingInvite ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                "Accept & Pay"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          ["status", "My Status"],
          ["pay", "Pay Contribution"],
          ["timeline", "Payout Timeline"],
          ["transparency", "Group Transparency"],
          ["collateral", "Collateral Status"],
          ["rules", "Rules & Agreement"],
          ["notifications", "Notifications"],
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
