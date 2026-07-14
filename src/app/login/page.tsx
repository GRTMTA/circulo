import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { redirectAuthenticatedUserHome } from "@/lib/auth";

interface LoginPageProps {
  searchParams?: Promise<{
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectAuthenticatedUserHome();
  const params = await searchParams;

  return (
    <AuthShell
      eyebrow="Secure member access"
      title="Welcome back"
      description="Sign in to manage your circles, contributions, and payout timeline."
      panelTitle="Your circle is ready when you are."
      panelDescription="Sign back into the private workspace for contribution schedules, member agreements, wallet status, and payout coordination."
    >
      <LoginForm nextPath={params?.next} />
    </AuthShell>
  );
}
