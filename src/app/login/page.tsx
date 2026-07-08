import Link from "next/link";
import { ArrowLeft, WalletCards } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f8f7f2] px-6 py-8 text-[#17140f]">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#5d5548] transition hover:text-[#17140f]"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <section className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="font-mono text-xs font-semibold uppercase text-[#7b3126]">
              Wallet and Supabase auth
            </p>
            <h1 className="mt-4 text-4xl font-semibold">Join with your wallet.</h1>
            <p className="mt-4 leading-7 text-[#5d5548]">
              This page is ready for Stellar Wallet Kit and Supabase auth wiring.
              Keep identity off-chain, keep balances and payout rules on-chain.
            </p>
          </div>

          <div className="rounded-md border border-[#17140f]/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#17140f]/10 pb-5">
              <div>
                <h2 className="text-lg font-semibold">Access Circulo</h2>
                <p className="text-sm text-[#5d5548]">Connect before joining a circle.</p>
              </div>
              <WalletCards className="text-[#2f6f5e]" size={28} />
            </div>

            <form className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Email
                <input
                  className="rounded-md border border-[#17140f]/15 px-3 py-3 outline-none transition focus:border-[#2f6f5e]"
                  placeholder="member@example.com"
                  type="email"
                />
              </label>
              <button
                className="rounded-md bg-[#17140f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2d261b]"
                type="button"
              >
                Continue with Supabase
              </button>
              <button
                className="rounded-md border border-[#17140f]/15 px-5 py-3 text-sm font-semibold transition hover:bg-[#f6f3ec]"
                type="button"
              >
                Connect Stellar wallet
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
