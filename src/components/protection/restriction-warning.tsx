import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RestrictionWarning({
  restrictionLevel,
  lateCount,
  maxAllowed,
}: {
  restrictionLevel: "warning" | "restricted";
  lateCount: number;
  maxAllowed: number;
}) {
  return (
    <Alert variant={restrictionLevel === "restricted" ? "destructive" : "default"}>
      <AlertTitle>{restrictionLevel === "restricted" ? "Member Restricted" : "Restriction Warning"}</AlertTitle>
      <AlertDescription>
        You have {lateCount} late or missed contributions. Restricted members cannot create or join new circles after {maxAllowed}.
      </AlertDescription>
    </Alert>
  );
}

