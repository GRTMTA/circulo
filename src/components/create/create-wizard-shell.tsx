"use client";

import { useState, useEffect } from "react";
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
import {
  validateBasics,
  validateCollateral,
  validateRoster,
} from "@/lib/create/validation";

const steps = ["Basics", "Roster", "Collateral", "Payout Order", "Review"];

export function CreateWizardShell() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [basics, setBasics] = useState(mockCreateBasicsState);
  const [roster, setRoster] = useState(mockCreateRosterState);
  const [collateral, setCollateral] = useState(mockCreateCollateralState);
  const [payoutOrder, setPayoutOrder] = useState(mockCreatePayoutOrderState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [attempted, setAttempted] = useState(false);

  // Synchronize payoutOrder state when the roster changes
  useEffect(() => {
    Promise.resolve().then(() => {
      setPayoutOrder((currentOrder) => {
        const orderMap = new Map(currentOrder.map((item) => [item.walletAddress, item]));

        const newOrder = roster.map((member, index) => {
          const existing = orderMap.get(member.walletAddress);
          if (existing) {
            return { ...existing, displayName: member.displayName };
          }
          return {
            ...member,
            payoutRound: index + 1,
          };
        });

        return newOrder.map((item, index) => ({
          ...item,
          payoutRound: index + 1,
        }));
      });
    });
  }, [roster]);

  function validateCurrentStep(): boolean {
    let result;
    switch (step) {
      case 0:
        result = validateBasics(basics);
        break;
      case 1:
        result = validateRoster(roster, basics.memberCount);
        break;
      case 2:
        result = validateCollateral(collateral);
        break;
      default:
        return true;
    }
    setStepErrors(result.errors);
    return result.valid;
  }

  function isStepValid(): boolean {
    switch (step) {
      case 0:
        return validateBasics(basics).valid;
      case 1:
        return validateRoster(roster, basics.memberCount).valid;
      case 2:
        return validateCollateral(collateral).valid;
      default:
        return true;
    }
  }

  const canAdvance = isStepValid();

  function handleBack() {
    setAttempted(false);
    setStepErrors({});
    setStep((current) => Math.max(0, current - 1));
  }

  async function handleNext() {
    setAttempted(true);

    // Validate before advancing (steps 0–2)
    if (step < 3 && !validateCurrentStep()) return;

    setAttempted(false);
    setStepErrors({});

    // If not the last step, just advance
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    // Final step — submit
    setIsSubmitting(true);
    try {
      const res = await createCircleAction(basics, roster, collateral, payoutOrder);
      if (res.success && res.circleId) {
        toast.success("Circle draft created successfully");
        router.push(`/dashboard/${res.circleId}`);
        router.refresh();
      } else {
        if (res.error === "Supabase not configured") {
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
  }

  return (
    <Card className="trust-ledger-surface">
      <CardContent className="grid gap-6 p-5 sm:p-6">
        {/* Step indicator */}
        <nav aria-label="Wizard progress" className="flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <Badge
              key={label}
              variant={
                index === step
                  ? "default"
                  : index < step
                    ? "outline"
                    : "secondary"
              }
            >
              {index + 1}. {label}
            </Badge>
          ))}
        </nav>

        {/* Step content */}
        {step === 0 ? (
          <CreateBasicsStep
            values={basics}
            onChange={setBasics}
            errors={attempted ? stepErrors : {}}
          />
        ) : null}
        {step === 1 ? (
          <CreateRosterStep
            members={roster}
            memberCount={basics.memberCount}
            onAddMember={(member) => setRoster((current) => [...current, member])}
            onRemoveMember={(index) =>
              setRoster((current) =>
                current.filter((_, memberIndex) => memberIndex !== index)
              )
            }
            errors={attempted ? stepErrors : {}}
          />
        ) : null}
        {step === 2 ? (
          <CreateCollateralStep
            values={collateral}
            onChange={setCollateral}
            memberCount={basics.memberCount}
            contributionAmount={basics.contributionAmount}
            contributionAsset={basics.contributionAsset}
            errors={attempted ? stepErrors : {}}
          />
        ) : null}
        {step === 3 ? (
          <CreatePayoutOrderStep order={payoutOrder} onReorder={setPayoutOrder} />
        ) : null}
        {step === 4 ? (
          <CreateReviewStep
            basics={basics}
            roster={roster}
            collateral={collateral}
            payoutOrder={payoutOrder}
          />
        ) : null}

        {/* Navigation */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0 || isSubmitting}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button type="button" disabled={isSubmitting || !canAdvance} onClick={handleNext}>
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
