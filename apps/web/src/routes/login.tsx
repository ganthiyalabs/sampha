import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/login-form";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <LoginForm />
    </div>
  );
}
