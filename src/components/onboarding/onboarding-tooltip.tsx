"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OnboardingTooltip({
  step,
  total,
  title,
  description,
  onNext,
  onSkip,
}: {
  step: number;
  total: number;
  title: string;
  description: string;
  anchorRect?: DOMRect | null;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <Card className="max-w-sm shadow-xl">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs font-semibold text-muted-foreground">Step {step} of {total}</p>
        <div className="flex gap-2">
          <Button onClick={onNext}>{step === total ? "Finish" : "Next"}</Button>
          <Button variant="ghost" onClick={onSkip}>Skip Tour</Button>
        </div>
      </CardContent>
    </Card>
  );
}

