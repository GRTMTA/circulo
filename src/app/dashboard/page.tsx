import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { dashboardStats, upcomingCycle } from "@/lib/circulo";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#17140f]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#17140f]/10 pb-6">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#5d5548] transition hover:text-[#17140f]"
            >
              <ArrowLeft size={16} />
              Home
            </Link>
            <h1 className="text-3xl font-semibold">Makati Friday Circle</h1>
            <p className="mt-2 text-sm text-[#5d5548]">
              Draft circle scaffold with creator and member-facing sections.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md border border-[#17140f]/15 px-4 py-2 text-sm font-semibold transition hover:bg-white">
            <Settings size={16} />
            Pool settings
          </button>
        </header>

        <section className="grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-md border border-[#17140f]/10 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-[#5d5548]">{stat.label}</p>
              <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-md border border-[#17140f]/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#17140f]/10 pb-4">
              <h2 className="text-lg font-semibold">Cycle calendar</h2>
              <span className="rounded-md bg-[#f1eee4] px-3 py-1 text-xs font-semibold uppercase text-[#5d5548]">
                Draft
              </span>
            </div>
            <div className="mt-6 grid gap-4">
              {upcomingCycle.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 rounded-md border border-[#17140f]/10 p-4"
                  >
                    <Icon className="mt-1 text-[#2f6f5e]" size={20} />
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-[#5d5548]">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border border-[#17140f]/10 bg-[#17140f] p-6 text-white shadow-sm">
            <h2 className="text-lg font-semibold">Audit log</h2>
            <div className="mt-6 grid gap-4">
              {[
                "Circle draft created",
                "Five wallet addresses added",
                "Payout order pending confirmation",
                "Collateral gate not yet satisfied",
              ].map((event) => (
                <div key={event} className="border-b border-white/10 pb-4">
                  <p className="text-sm">{event}</p>
                  <p className="mt-1 font-mono text-xs text-white/55">pending timestamp</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
