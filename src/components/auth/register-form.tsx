"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { registerAction } from "@/app/auth/actions";
import { idleState } from "@/lib/auth-shared";
import { AuthStatus } from "@/components/auth/auth-status";
import { PasswordInput } from "@/components/auth/password-input";
import { VerifyEmailDialog } from "@/components/auth/verify-email-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerAction, idleState);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state]);

  return (
    <>
      <form action={formAction}>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="register-given-name">Given name</FieldLabel>
              <Input
                id="register-given-name"
                name="givenName"
                autoComplete="given-name"
                placeholder="e.g. John"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="register-last-name">Last name</FieldLabel>
              <Input
                id="register-last-name"
                name="lastName"
                autoComplete="family-name"
                placeholder="e.g. Doe"
                required
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="register-email">Email</FieldLabel>
            <Input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="member@example.com"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="register-password">Password</FieldLabel>
            <PasswordInput
              id="register-password"
              name="password"
              autoComplete="new-password"
              placeholder="Choose a strong password"
              minLength={8}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="register-confirm-password">
              Confirm password
            </FieldLabel>
            <PasswordInput
              id="register-confirm-password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat your password"
              minLength={8}
              required
            />
          </Field>

          <FieldDescription>
            Use at least 8 characters. Circle invites are handled separately
            from account creation.
          </FieldDescription>

          <AuthStatus state={state} />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create account"}
          </Button>

          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Login
            </Link>
          </FieldDescription>
        </FieldGroup>
      </form>

      {state.email ? (
        <VerifyEmailDialog
          email={state.email}
          open={state.status === "verification"}
        />
      ) : null}
    </>
  );
}
