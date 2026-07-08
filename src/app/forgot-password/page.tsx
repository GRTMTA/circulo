import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

interface ForgotPasswordPageProps {
  searchParams?: Promise<{
    email?: string;
  }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Reset password"
      description="Enter your email and we will send a secure recovery link."
    >
      <ForgotPasswordForm defaultEmail={params?.email} />
    </AuthShell>
  );
}
