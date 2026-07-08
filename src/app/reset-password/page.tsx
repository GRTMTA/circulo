import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Save a new password after opening your recovery email."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
