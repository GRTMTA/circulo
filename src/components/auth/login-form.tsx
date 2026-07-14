"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { loginAction } from "@/app/auth/actions";
import { idleState } from "@/lib/auth-shared";
import { AuthStatus } from "@/components/auth/auth-status";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, idleState);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="next" value={nextPath} />
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="login-email" className="text-sm">
            Email address
          </FieldLabel>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="member@example.com"
            className="h-13 rounded-xl border-border/90 bg-[var(--color-background-default)] shadow-[0_1px_0_rgba(18,49,61,0.04)]"
            required
          />
        </Field>

        <Field>
          <div className="flex items-center gap-3">
            <FieldLabel htmlFor="login-password" className="text-sm">
              Password
            </FieldLabel>
            <Link
              href="/forgot-password"
              className="ml-auto text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            className="h-13 rounded-xl border-border/90 bg-[var(--color-background-default)] shadow-[0_1px_0_rgba(18,49,61,0.04)]"
            required
          />
        </Field>

        <AuthStatus state={state} />

        <Field className="gap-4 pt-1">
          <Button
            type="submit"
            className="hero-primary-button h-13 w-full shadow-[0_16px_30px_-20px_var(--color-primary-default)] hover:brightness-105"
            disabled={pending}
          >
            {pending ? "Signing in..." : "Sign in"}
          </Button>
          <FieldDescription className="text-center text-sm leading-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
