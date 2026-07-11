"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  resendVerificationAction,
  verifyEmailCodeAction,
} from "@/app/auth/actions";
import { idleState } from "@/lib/auth-shared";
import { AuthStatus } from "@/components/auth/auth-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface VerifyEmailDialogProps {
  email: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VerifyEmailDialog({
  email,
  open,
  onOpenChange,
}: VerifyEmailDialogProps) {
  const router = useRouter();
  const [verifyState, verifyFormAction, verifyPending] = useActionState(
    verifyEmailCodeAction,
    idleState
  );
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendVerificationAction,
    idleState
  );

  useEffect(() => {
    if (verifyState.status === "success" && verifyState.redirectTo) {
      router.push(verifyState.redirectTo);
      router.refresh();
    }
  }, [router, verifyState]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Verify your email</DialogTitle>
          <DialogDescription>
            Enter the code sent to {email}. If your Supabase project sends a
            link instead, open the confirmation link and Circulo will finish
            verification through the callback route.
          </DialogDescription>
        </DialogHeader>

        <form action={verifyFormAction} className="mt-6 grid gap-5">
          <input type="hidden" name="email" value={email} />
          <Field>
            <FieldLabel htmlFor="verification-code">Verification code</FieldLabel>
            <Input
              id="verification-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
            <FieldDescription>
              Codes are usually 6 digits, depending on the Supabase email
              template.
            </FieldDescription>
          </Field>
          <AuthStatus state={verifyState} />
          <Button type="submit" disabled={verifyPending}>
            {verifyPending ? "Checking code..." : "Verify email"}
          </Button>
        </form>

        <DialogFooter>
          <form action={resendFormAction}>
            <input type="hidden" name="email" value={email} />
            <Button type="submit" variant="outline" disabled={resendPending}>
              {resendPending ? "Resending..." : "Resend email"}
            </Button>
          </form>
          <AuthStatus state={resendState} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
