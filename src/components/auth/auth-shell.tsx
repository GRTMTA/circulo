import type { ReactNode } from "react";

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
  children: ReactNode;
}

export function AuthShell({
  eyebrow = "Circulo access",
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-8 text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <section className="grid w-full gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-xl font-heading text-4xl font-semibold leading-tight md:text-5xl">
              Identity stays simple. Circles stay invite-only.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--color-text-secondary)]">
              Sign in with email and password for off-chain account access.
              Wallets and circle invitations can be layered onto the account
              without opening public circle matching.
            </p>
          </div>

          <Card className="border border-border bg-white/95 py-0 shadow-sm">
            <CardHeader className="px-6 pt-7 text-center sm:px-8">
              <CardTitle className="justify-center font-heading text-xl text-[var(--color-text-primary)]">
                {title}
              </CardTitle>
              <CardDescription className="mx-auto max-w-sm leading-6 text-[var(--color-text-secondary)]">
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-7 sm:px-8">{children}</CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
