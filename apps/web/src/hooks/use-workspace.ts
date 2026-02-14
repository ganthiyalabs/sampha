import { useParams } from "@tanstack/react-router";
import * as React from "react";

const WORKSPACE_STORAGE_KEY = "sampha_last_workspace";

export function useWorkspace() {
  const params = useParams({ strict: false }) as { workspace?: string };
  const [lastWorkspace, setLastWorkspace] = React.useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(WORKSPACE_STORAGE_KEY);
    }
    return null;
  });

  // Derived workspace: URL param > localStorage > "default"
  const workspace = params.workspace || lastWorkspace || "default";

  React.useEffect(() => {
    if (params.workspace && params.workspace !== lastWorkspace) {
      setLastWorkspace(params.workspace);
      localStorage.setItem(WORKSPACE_STORAGE_KEY, params.workspace);
    }
  }, [params.workspace, lastWorkspace]);

  return {
    workspace,
    isDefault: workspace === "default" && !params.workspace,
    activeWorkspace: params.workspace,
  };
}
