"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { idleState, resetPasswordAction } from "@/app/auth/actions";
import { AuthStatus } from "@/components/auth/auth-status";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    idleState
  );

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="reset-password">New password</FieldLabel>
          <PasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            placeholder="Choose a strong password"
            minLength={8}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="reset-confirm-password">
            Confirm password
          </FieldLabel>
          <PasswordInput
            id="reset-confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            minLength={8}
            required
          />
        </Field>

        <AuthStatus state={state} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving password..." : "Save new password"}
        </Button>

        <FieldDescription className="text-center">
          Need another recovery email?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Request a new link
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
