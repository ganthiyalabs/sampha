import type { ConvexQueryClient } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";

import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ConvexProvider } from "convex/react";

import { Toaster } from "@/components/ui/sonner";

import appCss from "../index.css?url";

export interface RouterAppContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Sampha",
      },
      {
        name: "description",
        content: "A planning-first task system built for fast-moving individuals and teams.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const { convexQueryClient } = Route.useRouteContext();
  return (
    <ConvexProvider client={convexQueryClient.convexClient}>
      <html lang="en" className="dark">
        <head>
          <HeadContent />
        </head>
        <body>
          <div className="grid h-svh grid-rows-[auto_1fr] bg-background">
            <Outlet />
          </div>
          <Toaster richColors />
          <TanStackRouterDevtools position="bottom-left" />
          <Scripts />
        </body>
      </html>
    </ConvexProvider>
  );
}
