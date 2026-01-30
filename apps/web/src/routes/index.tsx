import { convexQuery } from "@convex-dev/react-query";
import { api } from "@sampha/backend/convex/_generated/api";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery(convexQuery(api.healthCheck.get, {}));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
    </div>
  );
}
