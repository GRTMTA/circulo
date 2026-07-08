import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

export const circleStatuses = [
  "draft",
  "active",
  "delayed",
  "completed",
  "disputed",
  "cancelled",
] as const;

export type CircleStatus = (typeof circleStatuses)[number];

export const coreFeatures = [
  {
    title: "Invite-only circles",
    description: "Closed groups only, with no public matching or stranger pooling.",
    icon: LockKeyhole,
  },
  {
    title: "Locked roster",
    description: "Members are fixed before activation so late joiners never fund old payouts.",
    icon: UsersRound,
  },
  {
    title: "Collateral protection",
    description: "Missed contributions can slash collateral and inject it into the pool.",
    icon: ShieldCheck,
  },
  {
    title: "Direct payouts",
    description: "The contract pays members directly; Circulo never takes custody.",
    icon: CircleDollarSign,
  },
] as const;

export const dashboardStats = [
  { label: "Circle status", value: "Draft" },
  { label: "Contribution", value: "10 USDC" },
  { label: "Interval", value: "24 hours" },
  { label: "Members", value: "5" },
] as const;

export const upcomingCycle = [
  {
    title: "Collateral gate",
    detail: "Waiting for 2 of 5 members",
    icon: ClipboardCheck,
  },
  {
    title: "Next contribution",
    detail: "Round 1 opens after activation",
    icon: CalendarDays,
  },
  {
    title: "Wallet flow",
    detail: "Stablecoin in/out via Stellar wallet",
    icon: WalletCards,
  },
  {
    title: "Default rules",
    detail: "Grace period and warnings pending configuration",
    icon: AlertTriangle,
  },
] as const;

export const techStack = [
  "Next.js App Router",
  "Tailwind CSS",
  "Stellar Wallet Kit",
  "@stellar/stellar-sdk",
  "Supabase",
  "Rust + Soroban",
] as const;
