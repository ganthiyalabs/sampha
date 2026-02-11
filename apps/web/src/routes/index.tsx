import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaskList } from "@/components/dashboard/task-list";
import { SmartTaskInput } from "@/components/dashboard/smart-task-input";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    if (typeof window !== "undefined") {
      router.navigate({ to: "/login" });
    }
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <header className="">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {session.user.name?.split(" ")[0]}.
          </h1>
        </header>

        <div className="space-y-6">
          <SmartTaskInput />
          <TaskList />
        </div>
      </div>
    </DashboardLayout>
  );
}
