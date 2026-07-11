import { Progress, ProgressLabel } from "@/components/ui/progress";

export function OnboardingProgress({ current, total }: { current: number; total: number }) {
  return (
    <Progress value={(current / total) * 100}>
      <ProgressLabel>Step {current} of {total}</ProgressLabel>
    </Progress>
  );
}

