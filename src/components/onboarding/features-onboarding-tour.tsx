"use client";

import { useState } from "react";

import { OnboardingCompleteDialog } from "@/components/onboarding/onboarding-complete-dialog";
import { OnboardingTooltip } from "@/components/onboarding/onboarding-tooltip";

const tourSteps = [
  ["Welcome to Circulo", "Private rotating savings circles for trusted groups."],
  ["Circle overview", "Your circles appear as status cards with next actions."],
  ["Create Circle", "Use the create flow to set fixed roster, amount, interval, collateral, and payout order."],
  ["Circle switcher", "Switch between active, draft, completed, and cancelled circles from the sidebar."],
  ["Notifications", "Contribution and payout signals appear in the dashboard header and reminders."],
];

export function FeaturesOnboardingTour({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem("circulo_onboarding_complete")
      ? tourSteps.length
      : 0
  );
  const [completeOpen, setCompleteOpen] = useState(false);

  if (step >= tourSteps.length) {
    return <OnboardingCompleteDialog open={completeOpen} onOpenChange={setCompleteOpen} />;
  }

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <OnboardingTooltip
        step={step + 1}
        total={tourSteps.length}
        title={tourSteps[step][0]}
        description={tourSteps[step][1]}
        onNext={() => {
          if (step === tourSteps.length - 1) {
            window.localStorage.setItem("circulo_onboarding_complete", "true");
            setCompleteOpen(true);
            onComplete?.();
          }
          setStep((current) => current + 1);
        }}
        onSkip={() => {
          window.localStorage.setItem("circulo_onboarding_complete", "true");
          setStep(tourSteps.length);
          onComplete?.();
        }}
      />
    </div>
  );
}
