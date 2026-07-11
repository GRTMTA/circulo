"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MemberAgreementScreen({
  circleName,
  rules,
  accepted = false,
}: {
  circleName: string;
  rules: string[];
  accepted?: boolean;
}) {
  const [checked, setChecked] = useState(accepted);

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
        <label className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 text-sm font-semibold">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 size-4 accent-[var(--color-primary-default)]"
          />
          I understand and accept these circle rules.
        </label>
        <Button disabled={!checked} onClick={() => toast.success("Agreement accepted")}>
          Accept & Join Circle
        </Button>
      </CardContent>
    </Card>
  );
}

