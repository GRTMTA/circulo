"use client";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  LockKeyhole,
  LucideIcon,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { coreFeatures, techStack } from "@/lib/circulo";
import { useEffect, useRef } from "react";
import Image from "next/image";

const metrics = [
  { label: "Roster", value: "5 members" },
  { label: "Round", value: "1 of 5" },
  { label: "Contribution", value: "10 USDC" },
] as const;

const timeline = [
  {
    title: "Invite trusted members",
    description: "Start with a private roster and lock participation before funds move.",
    icon: UsersRound,
  },
  {
    title: "Set the rotation",
    description: "Fix amount, interval, collateral, and payout order ahead of activation.",
    icon: CalendarDays,
  },
  {
    title: "Verify on-chain",
    description: "Track contributions and direct payouts without Circulo custody.",
    icon: ShieldCheck,
  },
] as const;

const trustSignals = [
  "No public matching",
  "No pooled strangers",
  "No custody of funds",
  "No promised returns",
] as const;

const dashboardRows: {
  title: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Collateral gate",
    detail: "Waiting for everyone to post",
    icon: ClipboardCheck,
  },
  {
    title: "Direct payout",
    detail: "Contract sends to recipient wallet",
    icon: CircleDollarSign,
  },
  {
    title: "Locked rules",
    detail: "Amount and rotation cannot drift",
    icon: LockKeyhole,
  },
];

function GlowyWaveField() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 hero-gradient-stage" />
      <div className="animate-enter-soft absolute left-1/2 top-[42%] h-[40rem] w-[95rem] -translate-x-1/2 rounded-[999px] bg-[color-mix(in_srgb,var(--color-primary-default)_22%,var(--color-background-default))] opacity-90 blur-[150px]" />
      <div className="animate-enter-late absolute left-1/2 top-[42%] h-[40rem] w-[95rem] -translate-x-1/2 rounded-[999px] bg-[color-mix(in_srgb,var(--color-success-default)_16%,var(--color-primary-muted))] opacity-70 blur-[150px]" />

      <div className="absolute -left-64 -top-64 flex h-[31.25rem] w-[121rem] items-center justify-between gap-[58rem]">
        <div className="animate-orbit-left size-[31.25rem] rounded-full bg-[color-mix(in_srgb,var(--color-primary-default)_24%,var(--color-background-default))] blur-[150px]" />
        <div className="animate-orbit-right size-[31.25rem] rounded-full bg-[color-mix(in_srgb,var(--color-warning-default)_18%,var(--color-primary-muted))] blur-[150px]" />
      </div>

      <div className="animate-wave-drift absolute left-1/2 top-[18%] h-36 w-[78rem] -translate-x-1/2 rounded-[999px] bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-primary-default)_46%,transparent),color-mix(in_srgb,var(--color-success-default)_24%,transparent),transparent)] opacity-55 blur-3xl" />
      <div className="animate-wave-drift-reverse absolute left-1/2 top-[34%] h-32 w-[70rem] -translate-x-1/2 rounded-[999px] bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-warning-default)_18%,transparent),color-mix(in_srgb,var(--color-primary-default)_34%,transparent),transparent)] opacity-50 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,transparent,var(--color-background-default))]" />
    </div>
  );
}

function LandingNav() {
  return (
    <header className="animate-enter-soft relative z-20 mx-auto mt-5 flex w-full max-w-[1116px] px-4 sm:px-6">
      <nav className="surface-glass flex min-h-16 w-full items-center justify-between rounded-lg border border-border/45 px-4 shadow-[0_18px_70px_-42px_rgba(26,31,54,0.56)] sm:px-6 lg:gap-10">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <Image
            src="/logo.jpg"
            alt="Circulo logo"
            width={160}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "xs" }),
              "hidden sm:inline-flex"
            )}
          >
            Log In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "xs" }),
              "animate-gradient-shift rounded-xl bg-[linear-gradient(135deg,var(--color-primary-default),color-mix(in_srgb,var(--color-primary-default)_76%,var(--color-success-default)),var(--color-primary-default))] shadow-[0_16px_36px_-22px_var(--color-primary-default)]"
            )}
          >
            Sign Up
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function HeroProofPanel() {
  return (
    <div className="relative mx-auto mt-12 w-full max-w-4xl">
      <div className="absolute -inset-6 rounded-[28px] bg-[radial-gradient(circle_at_20%_10%,color-mix(in_srgb,var(--color-primary-default)_20%,transparent),transparent_36%),radial-gradient(circle_at_82%_80%,color-mix(in_srgb,var(--color-success-default)_16%,transparent),transparent_34%)] blur-2xl" />
      <div className="animate-float-slow gradient-border relative overflow-hidden rounded-[18px] p-3 shadow-[0_34px_100px_-54px_rgba(26,31,54,0.75)] backdrop-blur">
        <div className="rounded-[14px] border border-border/60 bg-background/88 p-4 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--color-background-default)_88%,white)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Circle health</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal">Family USDC pool</h2>
            </div>
            <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-primary shadow-[0_10px_30px_-22px_var(--color-primary-default)]">
              Draft locked
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="gradient-border rounded-[14px] p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-lg font-semibold">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[14px] border border-primary/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary-muted)_40%,var(--color-background-default)),var(--color-background-default)_64%,color-mix(in_srgb,var(--color-success-default)_10%,var(--color-background-default)))] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[radial-gradient(circle,var(--color-primary-muted),color-mix(in_srgb,var(--color-primary-default)_12%,transparent))] text-primary">
                  <WalletCards className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">Next contribution</p>
                  <p className="text-sm text-muted-foreground">2 of 5 members ready</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-primary">40%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="animate-gradient-shift h-full w-2/5 rounded-full bg-[linear-gradient(90deg,var(--color-primary-default),var(--color-success-default),var(--color-primary-default))]" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {dashboardRows.map(({ title, detail, icon: Icon }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-[14px] border border-border/60 bg-background/80 p-3 text-left transition duration-300 hover:border-primary/35 hover:bg-background"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-background-muted),color-mix(in_srgb,var(--color-primary-default)_14%,var(--color-background-muted)))] text-primary">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <article className="group gradient-border rounded-[14px] p-5 shadow-[0_18px_52px_-42px_rgba(26,31,54,0.58)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_72px_-46px_rgba(26,31,54,0.78)]">
      <div className="flex size-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary-default)_16%,transparent),color-mix(in_srgb,var(--color-success-default)_12%,transparent))] text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-normal">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-normal text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
    </div>
  );
}


export function LandingPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const handleMove = (e: MouseEvent) => {
      const rect = heading.getBoundingClientRect();

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      heading.style.setProperty("--mouse-x", `${x}%`);
      heading.style.setProperty("--mouse-y", `${y}%`);
    };

    window.addEventListener("mousemove", handleMove);

    return () => window.removeEventListener("mousemove", handleMove);
  }, []);
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate flex min-h-screen w-full flex-col items-center overflow-hidden px-4 text-center sm:px-6">
        <GlowyWaveField />
        <LandingNav />
        <div className="relative z-10 max-w-5xl">
          <div className="flex min-h-[calc(100vh-6.75rem)] flex-col items-center justify-center gap-14 py-14 sm:py-20">
          <Badge variant="outline" className="animate-scale-in-late bg-background shadow-[0_18px_46px_-36px_rgba(26,31,54,0.8)] backdrop-blur">
            <Sparkles data-icon="inline-start" />
            Invite-only savings circles on Soroban
          </Badge>
          <h1
          ref={headingRef}
            className="hero-gradient-text animate-enter-late mx-auto max-w-[1133px] text-4xl font-medium leading-[1.17] tracking-normal sm:text-5xl lg:text-6xl">
            Save together. Grow together.
          </h1>
          <p className="animate-enter-late mx-auto max-w-3xl rounded-[14px] border border-border/45 bg-background/50 p-4 text-base font-medium leading-7 text-foreground/75 shadow-[0_18px_54px_-44px_rgba(26,31,54,0.75)] backdrop-blur sm:text-xl sm:leading-8">
            A modern platform for trusted savings circles with transparent contributions, fair payouts, and secure records.
          </p>

          <div className="animate-scale-in-late flex flex-col justify-center gap-4 sm:flex-row sm:gap-11">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "hero-primary-button rounded-lg border border-primary/20 text-primary-foreground shadow-[0_20px_44px_-24px_var(--color-primary-default)] transition hover:scale-105"
              )}
            >
              Start a Circle
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>

          <div className="animate-enter-late flex flex-wrap justify-center gap-3">
            {trustSignals.map((signal) => (
              <span
                key={signal}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-[0_14px_34px_-30px_rgba(26,31,54,0.72)] backdrop-blur"
              >
                <CheckCircle2 className="size-4 text-primary" />
                {signal}
              </span>
            ))}
          </div>
          </div>
        </div>
      </section>

      <section id="trust" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <HeroProofPanel />
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Built for accountability"
          title="Everything important is decided before activation."
          description="The interface keeps the social agreement visible while the contract handles contribution and payout mechanics directly."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {coreFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section id="process" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="gradient-border grid gap-6 rounded-[18px] p-5 shadow-[0_24px_88px_-52px_rgba(26,31,54,0.68)] backdrop-blur md:grid-cols-3 md:p-6">
          {timeline.map((step, index) => {
            const Icon = step.icon;

            return (
              <article key={step.title} className="relative overflow-hidden rounded-[14px] border border-border/50 bg-background/75 p-5">
                <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--color-primary-default),var(--color-success-default),var(--color-warning-default))]" />
                <div className="flex items-center justify-between gap-4">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary-default)_16%,transparent),color-mix(in_srgb,var(--color-success-default)_14%,transparent))] text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm font-semibold text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-normal">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="animate-gradient-shift rounded-[18px] border border-primary/20 bg-[linear-gradient(135deg,var(--color-primary-default),color-mix(in_srgb,var(--color-primary-default)_72%,var(--color-success-default)),color-mix(in_srgb,var(--color-primary-default)_84%,var(--color-warning-default)))] p-6 text-primary-foreground shadow-[0_30px_100px_-48px_var(--color-primary-default)] sm:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal opacity-80">Ready when your circle is</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              Bring the agreement, roster, and wallet flow into one calm workspace.
            </h2>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Circulo keeps trusted rotating savings circles transparent and non-custodial.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {techStack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </footer>
    </main>
  );
}
