import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { redirectAuthenticatedUserHome } from "@/lib/auth";

export default async function RegisterPage() {
  await redirectAuthenticatedUserHome();

  return (
    <AuthShell
      title="Create account"
      description="Register directly with your name, email, and password."
    >
      <RegisterForm />
    </AuthShell>
  );
}
