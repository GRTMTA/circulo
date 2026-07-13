"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptAgreementAction } from "@/app/dashboard/actions";

export function MemberAgreementScreen({
  circleId,
  circleName,
  rules,
  accepted = false,
}: {
  circleId?: string;
  circleName: string;
  rules: string[];
  accepted?: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(accepted);
  const [submitting, setSubmitting] = useState(false);

  async function handleAccept() {
    if (!circleId) {
      toast.success("Successfully joined the circle (mock mode)!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await acceptAgreementAction(circleId);
      if (res.success) {
        toast.success("Successfully joined the circle!");
        router.push(`/dashboard/${circleId}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to join circle.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="trust-ledger-surface">
      <CardHeader>
        <CardTitle>Before joining {circleName}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3">
          {rules.map((rule) => (
            <div key={rule} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{rule}</span>
            </div>
          ))}
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 text-sm font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            disabled={submitting}
            className="mt-1 size-4 accent-[var(--color-primary-default)]"
          />
          I understand and accept these circle rules.
        </label>
        <Button disabled={!checked || submitting} onClick={handleAccept}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Joining Circle...
            </>
          ) : (
            "Accept & Join Circle"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
