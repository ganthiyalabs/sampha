import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { FloatingNav } from "./floating-nav";
import { SearchCommand } from "../search-command";
import { SearchTrigger } from "./search-trigger";
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
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

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
          <div className="flex w-full items-center gap-4 border p-2 rounded-2xl bg-background/50 backdrop-blur-sm shadow-sm ring-offset-background transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <Breadcrumb className="flex-1 border-none p-2 rounded-none bg-transparent backdrop-blur-none">
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
            <SearchTrigger onClick={() => setIsSearchOpen(true)} className="md:w-40 lg:w-48 border-none bg-muted/50 hover:bg-muted" />
          </div>
        </header>

        <SearchCommand 
          open={isSearchOpen} 
          setOpen={setIsSearchOpen} 
          workspace={workspace} 
        />

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
