"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getIsSupabaseConfigured } from "@/lib/env";
import { getSafeNextPath } from "@/lib/auth";
import { type AuthActionState } from "@/lib/auth-shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

function errorState(message: string): AuthActionState {
  return {
    status: "error",
    message,
  };
}

function assertConfigured() {
  if (!getIsSupabaseConfigured()) {
    return errorState(
      "Supabase is not configured yet. Add the Supabase URL and publishable key to continue."
    );
  }

  return null;
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const configError = assertConfigured();
  if (configError) return configError;

  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const nextPath = getSafeNextPath(formData.get("next"));

  if (!email || !password) {
    return errorState("Enter your email and password to continue.");
  }

  const supabase = await createServerSupabaseClient();
  let error;
  try {
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  } catch (caught) {
    console.error("Login request failed:", caught);
    return errorState(
      "We couldn't reach the authentication service. Check your connection and try again."
    );
  }

  if (error) {
    if (error.message === "Email not confirmed") {
      return {
        status: "verification",
        message: "Confirm your email before signing in.",
        email,
      };
    }

    if (error.message === "Invalid login credentials") {
      return errorState(
        "That email and password combination doesn't match an account. Check your details and try again."
      );
    }

    return errorState(error.message);
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Signed in.",
    redirectTo: nextPath,
  };
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const configError = assertConfigured();
  if (configError) return configError;

  const givenName = getString(formData, "givenName").trim();
  const lastName = getString(formData, "lastName").trim();
  const email = getString(formData, "email").toLowerCase();
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (!givenName || !lastName || !email || !password || !confirmPassword) {
    return errorState("Complete every field to create your account.");
  }

  const fullName = `${givenName} ${lastName}`;

  if (password.length < 8) {
    return errorState("Use at least 8 characters for your password.");
  }

  if (password !== confirmPassword) {
    return errorState("Passwords do not match.");
  }

  const supabase = await createServerSupabaseClient();
  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return errorState(error.message);
  }

  revalidatePath("/", "layout");

  if (data.session) {
    return {
      status: "success",
      message: "Account created.",
      redirectTo: "/dashboard",
    };
  }

  return {
    status: "verification",
    message: "We sent a verification code or confirmation link to your email.",
    email,
  };
}

export async function verifyEmailCodeAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const configError = assertConfigured();
  if (configError) return configError;

  const email = getString(formData, "email").toLowerCase();
  const token = getString(formData, "code").replace(/\s+/g, "");

  if (!email || !token) {
    return errorState("Enter the verification code from your email.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    return errorState(error.message);
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Email verified.",
    redirectTo: "/dashboard",
  };
}

export async function resendVerificationAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const configError = assertConfigured();
  if (configError) return configError;

  const email = getString(formData, "email").toLowerCase();

  if (!email) {
    return errorState("Enter your email before requesting another code.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${await getOrigin()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return errorState(error.message);
  }

  return {
    status: "verification",
    message: "We sent another verification email.",
    email,
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const configError = assertConfigured();
  if (configError) return configError;

  const email = getString(formData, "email").toLowerCase();

  if (!email) {
    return errorState("Enter the email for your account.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getOrigin()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return errorState(error.message);
  }

  return {
    status: "success",
    message: "If an account exists for that email, a reset link is on its way.",
    email,
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const configError = assertConfigured();
  if (configError) return configError;

  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");

  if (password.length < 8) {
    return errorState("Use at least 8 characters for your new password.");
  }

  if (password !== confirmPassword) {
    return errorState("Passwords do not match.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return errorState(error.message);
  }

  // End the recovery session so the user explicitly signs in with the new
  // password. Password reset changes credentials; only login authenticates.
  await supabase.auth.signOut();
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Your password has been updated. Sign in with your new password.",
    redirectTo: "/login",
  };
}

export async function logoutAction() {
  if (getIsSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  }
}
