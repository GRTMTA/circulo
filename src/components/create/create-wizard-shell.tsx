"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CreateBasicsStep } from "@/components/create/create-basics-step";
import { CreateCollateralStep } from "@/components/create/create-collateral-step";
import { CreatePayoutOrderStep } from "@/components/create/create-payout-order-step";
import { CreateReviewStep } from "@/components/create/create-review-step";
import { CreateRosterStep } from "@/components/create/create-roster-step";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  mockCreateBasicsState,
  mockCreateCollateralState,
  mockCreatePayoutOrderState,
  mockCreateRosterState,
} from "@/lib/mocks";
import { createCircleAction } from "@/app/dashboard/actions";

const steps = ["Basics", "Roster", "Collateral", "Payout Order", "Review"];

export function CreateWizardShell() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState(mockCreateBasicsState);
  const [roster, setRoster] = useState(mockCreateRosterState);
  const [collateral, setCollateral] = useState(mockCreateCollateralState);
  const [payoutOrder, setPayoutOrder] = useState(mockCreatePayoutOrderState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Card className="trust-ledger-surface">
      <CardContent className="grid gap-6 p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <Badge key={label} variant={index === step ? "default" : index < step ? "outline" : "secondary"}>
              {index + 1}. {label}
            </Badge>
          ))}
        </div>
        {step === 0 ? <CreateBasicsStep values={basics} onChange={setBasics} /> : null}
        {step === 1 ? (
          <CreateRosterStep
            members={roster}
            memberCount={basics.memberCount}
            onAddMember={(member) => setRoster((current) => [...current, member])}
            onRemoveMember={(index) => setRoster((current) => current.filter((_, memberIndex) => memberIndex !== index))}
          />
        ) : null}
        {step === 2 ? <CreateCollateralStep values={collateral} onChange={setCollateral} /> : null}
        {step === 3 ? <CreatePayoutOrderStep order={payoutOrder} onReorder={setPayoutOrder} /> : null}
        {step === 4 ? <CreateReviewStep basics={basics} roster={roster} collateral={collateral} payoutOrder={payoutOrder} /> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || isSubmitting}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            Back
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              if (step < steps.length - 1) {
                setStep((current) => current + 1);
                return;
              }

              setIsSubmitting(true);
              try {
                const res = await createCircleAction(basics, roster, collateral, payoutOrder);
                if (res.success && res.circleId) {
                  toast.success("Circle draft created successfully");
                  router.push(`/dashboard/${res.circleId}`);
                  router.refresh();
                } else {
                  if (res.error === "Supabase not configured") {
                    // Fallback to mock mode
                    toast.success("Circle draft created (mock mode)");
                    router.push("/dashboard/circle-quezon-draft");
                    router.refresh();
                  } else {
                    toast.error(res.error || "Failed to create circle");
                  }
                }
              } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to create circle";
                toast.error(message);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting
              ? "Creating..."
              : step === steps.length - 1
              ? "Create Circle"
              : "Next"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
