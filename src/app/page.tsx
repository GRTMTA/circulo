<<<<<<< HEAD
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  return <LandingPage />;
}
=======
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { coreFeatures, techStack } from "@/lib/circulo";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f3ec] text-[#17140f]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="font-mono text-sm font-semibold uppercase">
            Circulo
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md border border-[#17140f]/15 px-4 py-2 text-sm font-medium transition hover:bg-white"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-[#17140f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d261b]"
            >
              Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-5 font-mono text-xs font-semibold uppercase text-[#7b3126]">
              Invite-only rotating savings on Soroban
            </p>
            <h1 className="text-5xl font-semibold leading-tight sm:text-6xl">
              Circulo keeps trusted savings circles accountable.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#5d5548]">
              Closed groups contribute a fixed stablecoin amount on a fixed
              schedule, then receive payouts in a pre-agreed rotation. The app
              never holds funds or promises returns.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-md bg-[#2f6f5e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245648]"
              >
                Start a circle
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-[#17140f]/15 px-5 py-3 text-sm font-semibold transition hover:bg-white"
              >
                View scaffold
              </Link>
            </div>
          </div>

          <div className="border-y border-[#17140f]/15 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {coreFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-md border border-[#17140f]/10 bg-white/65 p-5 shadow-sm"
                  >
                    <Icon className="mb-5 text-[#2f6f5e]" size={24} />
                    <h2 className="text-base font-semibold">{feature.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[#5d5548]">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#17140f]/15 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {techStack.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm text-[#5d5548]"
            >
              <CheckCircle2 size={16} className="text-[#2f6f5e]" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
>>>>>>> c7b4d4ef2f6f18edebbb75fb60b56b7d63a2b3a4
