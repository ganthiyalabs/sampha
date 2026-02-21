import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AIChatPanel } from "@/components/dashboard/ai-chat-panel";
import { TaskDashboardPanel } from "@/components/dashboard/task-dashboard-panel";

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
      <div className="flex gap-4 h-[calc(100vh-7rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Left Panel — AI Chat */}
        <div className="w-[42%] min-w-0 shrink-0">
          <AIChatPanel />
        </div>

        {/* Right Panel — Task Dashboard */}
        <div className="flex-1 min-w-0">
          <TaskDashboardPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}
