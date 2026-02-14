import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { FloatingNav } from "./floating-nav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { workspace } = useWorkspace();
  const location = useLocation();

  // Simple Breadcrumb Logic
  // pathSegments: ["timeline"] or ["projects", "projectc-1", "timeline"]
  // We want to skip the workspace part since it's the root breadcrumb
  const pathSegments = location.pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== workspace);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <FloatingNav />

      <main className="min-h-screen w-full p-6 pl-[88px] transition-[padding] duration-300 ease-in-out">
        <header className="mb-4 flex items-center h-14">
          <Breadcrumb className="w-full border p-4 rounded-2xl bg-background/50 backdrop-blur-sm">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/$workspace" params={{ workspace }} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {workspace}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathSegments.map((segment, index) => {
                const isLast = index === pathSegments.length - 1;
                const path = `/${workspace}/${pathSegments.slice(0, index + 1).join("/")}`;

                return (
                  <React.Fragment key={segment}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="capitalize">
                          {segment.replace(/-/g, " ")}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={path as any} className="capitalize">
                            {segment.replace(/-/g, " ")}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
