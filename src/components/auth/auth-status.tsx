import { CircleAlertIcon, CircleCheckIcon, MailIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import type { AuthActionState } from "@/app/auth/actions";

interface AuthStatusProps {
  state: AuthActionState;
}

export function AuthStatus({ state }: AuthStatusProps) {
  if (!state.message || state.status === "idle") {
    return null;
  }

  const isError = state.status === "error";
  const isVerification = state.status === "verification";
  const Icon = isError ? CircleAlertIcon : isVerification ? MailIcon : CircleCheckIcon;

  return (
    <Alert variant={isError ? "destructive" : "default"}>
      <Icon className="size-4" />
      <AlertTitle>
        {isError ? "We could not continue" : isVerification ? "Check your email" : "Success"}
      </AlertTitle>
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
