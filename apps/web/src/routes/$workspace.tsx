import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const Route = createFileRoute("/$workspace")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
