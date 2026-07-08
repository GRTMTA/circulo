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
      title="Login"
      description="Use your email and password to access your Circulo account."
    >
      <LoginForm nextPath={params?.next} />
    </AuthShell>
  );
}
