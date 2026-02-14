import * as React from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useMutation, useQuery } from "convex/react";
import { api } from "@sampha/backend/convex/_generated/api";
import {
  Calendar as CalendarIcon,
  Loader2,
  Layers,
  Flag,
  Clock,
  Command,
  HelpCircle,
} from "lucide-react";
import {
  addDays,
  nextDay,
  format,
  startOfToday,
  setHours,
  setMinutes,
  addMinutes,
  addHours,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";

/**
 * TYPES & INTERFACES
 */
interface ParsedTask {
  title: string;
  priority?: "low" | "medium" | "high";
  dueDate?: number;
  projectName?: string;
}

type SuggestionType = "project" | "priority" | "due" | null;

interface IntellisenseState {
  type: SuggestionType;
  query: string;
  startIndex: number;
}

/**
 * CORE PARSING LOGIC
 */
function parseTaskInput(text: string, projects: any[]): ParsedTask {
  let cleanedText = text;
  let priority: "low" | "medium" | "high" | undefined;
  let dueDate: number | undefined;
  let projectName: string | undefined;

  // Triggers: p: project: d: due: pr: priority:

  // 1. Priority (@p: or pr:)
  const prMatch = cleanedText.match(/\b(priority|pr):([^\s]+)\b/i);
  if (prMatch) {
    const val = prMatch[2].toLowerCase();
    if (["high", "h"].includes(val)) priority = "high";
    else if (["medium", "m"].includes(val)) priority = "medium";
    else if (["low", "l"].includes(val)) priority = "low";

    if (priority) cleanedText = cleanedText.replace(prMatch[0], "");
  }

  // 2. Project (p:)
  const pMatch = cleanedText.match(/\b(project|p):([^\s]+)\b/i);
  if (pMatch) {
    const pQ = pMatch[2].toLowerCase();
    const matched = projects.find((p) => p.name.toLowerCase().includes(pQ));
    if (matched) projectName = matched.name;
    else projectName = pMatch[2];
    cleanedText = cleanedText.replace(pMatch[0], "");
  }

  // 3. Due Date (d:)
  const dMatch = cleanedText.match(/\b(due|d):([^\s]+)\b/i);
  if (dMatch) {
    const val = dMatch[2].toLowerCase();
    cleanedText = cleanedText.replace(dMatch[0], "");

    // Relatives
    const offMatch = val.match(/^(\d+)([mhd])$/);
    if (offMatch) {
      const n = parseInt(offMatch[1]);
      const u = offMatch[2];
      if (u === "m") dueDate = addMinutes(Date.now(), n).getTime();
      else if (u === "h") dueDate = addHours(Date.now(), n).getTime();
      else if (u === "d") dueDate = addDays(Date.now(), n).getTime();
    } else {
      const today = startOfToday();
      const map: Record<string, Date> = {
        today,
        tom: addDays(today, 1),
        tomorrow: addDays(today, 1),
        mon: nextDay(today, 1),
        tue: nextDay(today, 2),
        wed: nextDay(today, 3),
        thu: nextDay(today, 4),
        fri: nextDay(today, 5),
        sat: nextDay(today, 6),
        sun: nextDay(today, 0),
      };
      if (map[val]) dueDate = setHours(setMinutes(map[val], 0), 18).getTime();
    }
  }

  return {
    title: cleanedText.replace(/\s+/g, " ").trim() || "Untitled Task",
    priority,
    dueDate,
    projectName,
  };
}

/**
 * COMPONENT: SmartTaskInput
 */
export function SmartTaskInput() {
  const [text, setText] = React.useState("");
  const { workspace: workspaceSlug } = useWorkspace();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState<string | null>(null);
  const [intel, setIntel] = React.useState<IntellisenseState>({
    type: null,
    query: "",
    startIndex: -1,
  });
  const [suggestionIdx, setSuggestionIdx] = React.useState(0);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Queries
  const workspaces = useQuery(api.workspaces.list);
  const user = useQuery(api.users.me);
  const projects = useQuery(
    api.projects.list,
    selectedWorkspaceId ? { workspaceId: selectedWorkspaceId as any } : "skip",
  );

  // Mutations
  const createTask = useMutation(api.tasks.create);
  const ensureDefault = useMutation(api.projects.ensureDefaultProjectAndPhase);

  // Sync selectedWorkspaceId with current workspace context
  React.useEffect(() => {
    const valid = workspaces?.filter((w): w is NonNullable<typeof w> => !!w) || [];
    if (valid.length > 0) {
      // Priority 1: Current selectedWorkspaceId (if manually changed in this component session)
      // Priority 2: Matches workspaceSlug from URL/persistence
      // Priority 3: First valid workspace
      const matchBySlug = valid.find(w => w.slug === workspaceSlug);
      if (matchBySlug && selectedWorkspaceId !== matchBySlug._id) {
        setSelectedWorkspaceId(matchBySlug._id);
      } else if (!selectedWorkspaceId && !matchBySlug) {
        setSelectedWorkspaceId(valid[0]._id);
      }
    }
  }, [workspaces, workspaceSlug]);

  const parsed = React.useMemo(() => parseTaskInput(text, projects || []), [text, projects]);

  const suggestions = React.useMemo(() => {
    if (!intel.type) return [];
    const q = intel.query.toLowerCase();
    switch (intel.type) {
      case "priority":
        return ["high", "medium", "low"].filter((p) => p.startsWith(q));
      case "project":
        return (projects || []).map((p) => p.name).filter((n) => n.toLowerCase().includes(q));
      case "due":
        return ["today", "tomorrow", "mon", "fri", "1h", "1d"].filter((d) => d.startsWith(q));
      default:
        return [];
    }
  }, [intel, projects]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!selectedWorkspaceId) {
      toast.error("Please select a workspace");
      return;
    }
    if (!user) {
      toast.error("User profile not loaded yet");
      return;
    }

    setIsSubmitting(true);
    try {
      const { projectId, phaseId } = await ensureDefault({
        workspaceId: selectedWorkspaceId as any,
      });

      let finalProjectId = projectId;
      if (parsed.projectName) {
        const match = projects?.find(
          (p) => p.name.toLowerCase() === parsed.projectName?.toLowerCase(),
        );
        if (match) finalProjectId = match._id;
      }

      await createTask({
        workspaceId: selectedWorkspaceId as any,
        projectId: finalProjectId as any,
        phaseId: phaseId as any,
        title: parsed.title,
        status: "todo",
        startDate: Date.now(),
        dueDate: parsed.dueDate || addDays(Date.now(), 1).getTime(),
        priority: parsed.priority || "medium",
        assigneeIds: [user._id],
      });

      setText("");
      setIntel({ type: null, query: "", startIndex: -1 });
      toast.success("Task created");
    } catch (err) {
      console.error("[SmartTaskInput] Creation failed:", err);
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySuggestion = (s: string) => {
    const before = text.slice(0, intel.startIndex);
    const cursor = textareaRef.current?.selectionStart || text.length;
    const after = text.slice(cursor);
    setText(before + s + " " + after.trim());
    setIntel({ type: null, query: "", startIndex: -1 });
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Suggestion Logic
    if (intel.type && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySuggestion(suggestions[suggestionIdx]);
        return;
      }
      if (e.key === "Escape") {
        setIntel({ type: null, query: "", startIndex: -1 });
        return;
      }
    }

    // 2. Submit Logic
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setText(val);

    const before = val.slice(0, pos);
    const words = before.split(/\s+/);
    const lastWord = words[words.length - 1] || "";

    if (lastWord.includes(":")) {
      const [pre, q] = lastWord.split(":");
      const n = pre.toLowerCase();
      let type: SuggestionType = null;
      if (["p", "project"].includes(n)) type = "project";
      else if (["pr", "priority"].includes(n)) type = "priority";
      else if (["d", "due"].includes(n)) type = "due";

      if (type) {
        setIntel({ type, query: q || "", startIndex: pos - q.length });
        setSuggestionIdx(0);
        return;
      }
    }
    setIntel({ type: null, query: "", startIndex: -1 });
  };

  return (
    <div className="relative w-full">
      {/* INTELLISENSE BOX */}
      {intel.type && suggestions.length > 0 && (
        <Card className="absolute bottom-full left-0 mb-2 w-64 shadow-2xl z-50 border-2 border-primary/30 p-0 overflow-hidden">
          <div className="bg-muted px-2 py-1 flex items-center justify-between border-b">
            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground flex items-center gap-1">
              <Command className="h-3 w-3" />
              {intel.type}
            </span>
            <span className="text-[9px] text-muted-foreground/60 font-mono">TAB to pick</span>
          </div>
          <div className="p-1 max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={s}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm text-left transition-colors",
                  i === suggestionIdx ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
                onClick={() => applySuggestion(s)}
              >
                {intel.type === "priority" && <Flag className="h-3 w-3" />}
                {intel.type === "project" && <Layers className="h-3 w-3" />}
                {intel.type === "due" && <Clock className="h-3 w-3" />}
                <span className="flex-1 font-medium">{s}</span>
                {i === suggestionIdx && <span className="text-[10px] opacity-50">↵</span>}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* INPUT CARD */}
      <Card className="p-0 border-2 focus-within:border-primary/50 transition-all shadow-md overflow-hidden bg-card/80 backdrop-blur-sm">
        <textarea
          ref={textareaRef}
          placeholder="I need to... (p:proj d:tom pr:high)"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[100px] bg-transparent p-4 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/30 antialiased font-medium"
        />

        <CardContent className="flex items-center justify-between px-3 py-2 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] font-bold px-2 rounded"
                >
                  <Layers className="mr-1.5 h-3 w-3 opacity-60" />
                  {workspaces
                    ?.filter((w): w is NonNullable<typeof w> => !!w)
                    .find((w) => w._id === selectedWorkspaceId)?.name || "Workspace"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="start">
                {workspaces
                  ?.filter((w): w is NonNullable<typeof w> => !!w)
                  .map((ws) => (
                    <Button
                      key={ws._id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs font-normal h-8"
                      onClick={() => setSelectedWorkspaceId(ws._id)}
                    >
                      {ws.name}
                    </Button>
                  ))}
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-1.5 border-l pl-2 border-border/50">
              {parsed.projectName && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase border border-blue-500/20">
                  #{parsed.projectName}
                </div>
              )}
              {parsed.dueDate && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase border border-amber-500/20">
                  <CalendarIcon className="h-3 w-3" />
                  {format(parsed.dueDate, "MMM d")}
                </div>
              )}
              {parsed.priority && (
                <div
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                    parsed.priority === "high"
                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                      : parsed.priority === "medium"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {parsed.priority}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/40 hover:text-muted-foreground"
              title="Syntax: p:project d:due priority:l/m/h"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="h-7 px-4 text-[11px] font-black uppercase tracking-tight"
              onClick={handleSubmit}
              disabled={!text.trim() || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "CREATE"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
