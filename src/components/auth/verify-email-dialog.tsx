"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";

import { resendVerificationAction } from "@/app/auth/actions";
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
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendVerificationAction,
    idleState
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--color-primary-muted)]">
            <Mail className="size-6 text-[var(--color-primary-default)]" />
          </div>
          <DialogTitle className="text-center">Check your email</DialogTitle>
          <DialogDescription className="text-center">
            We sent a verification link to <strong>{email}</strong>. Click the
            link in the email to verify your account and get started.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-xl border border-border bg-[var(--color-background-muted)] p-4 text-sm text-muted-foreground">
          <p className="font-medium text-[var(--color-text-default)]">
            Didn&apos;t receive it?
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Check your spam or junk folder</li>
            <li>Make sure <strong>{email}</strong> is correct</li>
            <li>Click below to resend</li>
          </ul>
        </div>

        <AuthStatus state={resendState} />

        <DialogFooter className="mt-4 flex flex-col gap-3 sm:flex-col sm:items-center">
          <form action={resendFormAction}>
            <input type="hidden" name="email" value={email} />
            <Button type="submit" variant="outline" disabled={resendPending} className="w-full">
              {resendPending ? "Resending..." : "Resend verification email"}
            </Button>
          </form>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange?.(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
