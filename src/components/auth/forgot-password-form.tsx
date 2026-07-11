"use client";

import Link from "next/link";
import { useActionState } from "react";

import { forgotPasswordAction } from "@/app/auth/actions";
import { idleState } from "@/lib/auth-shared";
import { AuthStatus } from "@/components/auth/auth-status";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    idleState
  );

  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
          <Input
            id="forgot-password-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={defaultEmail}
            placeholder="member@example.com"
            required
          />
        </Field>

        <AuthStatus state={state} />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending reset link..." : "Send reset link"}
        </Button>

        <FieldDescription className="text-center">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
