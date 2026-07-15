import type { ReactNode } from "react";
import { ShieldCheckIcon, SparklesIcon, UsersRoundIcon } from "lucide-react";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  description: string;
  panelTitle?: string;
  panelDescription?: string;
  children: ReactNode;
}

export function AuthShell({
  eyebrow = "Circulo access",
  title,
  description,
  panelTitle = "Private circles, clearer commitments.",
  panelDescription = "Coordinate trusted contribution circles with calm onboarding, protected member access, and a ledger experience built for accountability.",
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-background)] p-3 text-[var(--color-text-primary)] sm:p-6">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/70 bg-white/75 shadow-[0_28px_80px_-48px_rgba(18,49,61,0.45)] backdrop-blur md:min-h-[calc(100vh-3rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <div className="relative isolate flex min-h-[360px] overflow-hidden bg-[linear-gradient(145deg,var(--color-primary-default)_0%,#1d7fa3_48%,#12313d_100%)] p-7 text-white sm:p-10 lg:min-h-full lg:p-12 xl:p-16">
          <div className="absolute inset-0 -z-10 opacity-45">
            <div className="absolute -left-24 top-10 h-[520px] w-[520px] rounded-full border border-white/20" />
            <div className="absolute -left-8 top-32 h-[620px] w-[620px] rounded-full border border-white/15" />
            <div className="absolute left-20 top-52 h-[700px] w-[700px] rounded-full border border-white/10" />
          </div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(255,255,255,0.18)_0,transparent_28%,transparent_100%)]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(18,49,61,0.34))]" />

          <div className="flex w-full flex-col justify-between gap-12">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white border border-white/20 shadow-lg">
                <Image
                  src="/logo only.jpg"
                  alt="Circulo Logo"
                  width={40}
                  height={40}
                  className="rounded-lg object-contain"
                  priority/>
              </div>
              <div>
                <p className="text-lg font-semibold leading-none">Circulo</p>
                <p className="mt-1 text-sm text-white/70">Trusted circle finance</p>
              </div>
            </div>

            <div className="max-w-xl animate-enter-soft">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                {eyebrow}
              </p>
              <h1 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-normal sm:text-5xl xl:text-6xl">
                {panelTitle}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/78 sm:mt-6 sm:text-lg">
                {panelDescription}
              </p>
            </div>

            <div className="hidden gap-3 text-sm text-white/78 sm:grid sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/12 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur">
                <ShieldCheckIcon className="mb-3 size-5 text-white/80" aria-hidden="true" />
                <p className="font-medium">Protected access</p>
                <p className="mt-1 text-white/68">Email identity first, wallet access when your circle needs it.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/12 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur">
                <UsersRoundIcon className="mb-3 size-5 text-white/80" aria-hidden="true" />
                <p className="font-medium">Invite-only groups</p>
                <p className="mt-1 text-white/68">Built for members who already trust each other.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-[linear-gradient(180deg,var(--color-background-default),var(--color-background-section))] px-4 py-8 sm:px-10 lg:px-12">
          <Card className="animate-scale-in-late w-full max-w-[460px] border border-border/80 bg-white/95 py-0 shadow-[0_24px_60px_-36px_rgba(18,49,61,0.45)]">
            <CardHeader className="px-5 pt-7 text-left sm:px-8 sm:pt-9">
              <CardTitle className="font-heading text-2xl text-[var(--color-text-primary)] sm:text-3xl">
                {title}
              </CardTitle>
              <CardDescription className="max-w-sm leading-6 text-[var(--color-text-secondary)]">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-7 sm:px-8 sm:pb-9">{children}</CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
