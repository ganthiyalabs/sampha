import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    // If not authenticated, redirect to login
    // In a real app, this should probably be done in beforeLoad, but for now client-side is fine
    // Or we could show a generic public page here if "app's mainpage" implies something else.
    // Given the user wants "app's mainpage" and "rn / is blank", and asked for a login page, implies strict separation.

    // We can't easily redirect in render without useEffect, or just render the login link.
    // Let's perform a navigation effect.
    setTimeout(() => router.navigate({ to: "/login" }), 0);
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">Welcome, {session.user.name}</h1>
      <p className="text-muted-foreground">Select a workspace to get started.</p>
      {/* Placeholder for workspace selector */}
      <div className="mt-8">
        <Button
          onClick={async () => {
            await authClient.signOut();
            router.navigate({ to: "/login" });
          }}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
