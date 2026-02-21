import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@sampha/backend/convex/_generated/api";
import {
  ChevronDown,
  ChevronRight,
  Pin,
  Circle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isToday,
  isTomorrow,
  isBefore,
  startOfToday,
  startOfTomorrow,
  addDays,
} from "date-fns";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  dueDate: number;
  priority?: string;
  [key: string]: any;
}

// ============================================================================
// HELPERS
// ============================================================================
function groupTasks(tasks: Task[]) {
  const today: Task[] = [];
  const tomorrow: Task[] = [];
  const future: Task[] = [];
  const done: Task[] = [];

  const todayStart = startOfToday();
  const tomorrowEnd = addDays(startOfTomorrow(), 1);

  for (const task of tasks) {
    if (task.status === "done") {
      done.push(task);
    } else if (isToday(task.dueDate)) {
      today.push(task);
    } else if (isTomorrow(task.dueDate)) {
      tomorrow.push(task);
    } else if (isBefore(task.dueDate, todayStart)) {
      // Overdue tasks go into "Today"
      today.push(task);
    } else {
      future.push(task);
    }
  }

  return { today, tomorrow, future, done };
}

function getPriorityColor(priority?: string) {
  switch (priority) {
    case "high":
      return "bg-red-500";
    case "medium":
      return "bg-amber-500";
    case "low":
      return "bg-blue-500";
    default:
      return "bg-muted-foreground/30";
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 px-4 py-2.5 rounded-xl border min-w-[90px]",
        accent
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-muted/30 border-border/50",
      )}
    >
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wider",
          accent ? "text-emerald-400" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className="text-lg font-bold tracking-tight">{value}</span>
    </div>
  );
}

function PinnedTaskCard({ task }: { task: Task }) {
  return (
    <div className="relative flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5 group transition-all hover:border-primary/30">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
        <CheckCircle2 className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{task.title}</p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {task.description}
          </p>
        )}
      </div>
      <CheckCircle2 className="h-5 w-5 text-primary/60 shrink-0" />
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const toggleStatus = useMutation(api.tasks.update);
  const isDone = task.status === "done";

  const handleToggle = async () => {
    try {
      await toggleStatus({
        taskId: task._id as any,
        status: isDone ? "todo" : "done",
      });
    } catch {
      toast.error("Failed to update task");
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 group">
      <button
        onClick={handleToggle}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          isDone
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary/60",
        )}
      >
        {isDone && <CheckCircle2 className="h-3 w-3" />}
      </button>
      <span
        className={cn(
          "flex-1 text-sm truncate transition-all",
          isDone
            ? "text-muted-foreground line-through"
            : "text-foreground font-medium",
        )}
      >
        {task.title}
      </span>
      <div
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          getPriorityColor(task.priority),
        )}
      />
    </div>
  );
}

function CollapsibleSection({
  title,
  tasks,
  defaultOpen = true,
}: {
  title: string;
  tasks: Task[];
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {title}
        {tasks.length > 0 && (
          <span className="ml-auto text-[10px] font-normal opacity-60">
            {tasks.length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="pl-1">
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 py-2 pl-6">
              No tasks
            </p>
          ) : (
            tasks.map((task) => <TaskRow key={task._id} task={task} />)
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TaskDashboardPanel() {
  const tasks = useQuery(api.tasks.listMyTasks);
  const isLoading = tasks === undefined;

  const grouped = React.useMemo(
    () => groupTasks(tasks ?? []),
    [tasks],
  );

  const totalTasks = tasks?.length ?? 0;
  const todayCount = grouped.today.length;
  const highPriority = (tasks ?? []).filter(
    (t) => t.priority === "high" && t.status !== "done",
  ).length;

  // Use first non-done task as "pinned" for visual completeness
  const pinnedTask = (tasks ?? []).find((t) => t.status !== "done") ?? null;

  return (
    <div className="flex flex-col h-full min-h-0 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Your tasks</h2>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors hover:bg-emerald-500/20">
          <Zap className="h-3 w-3" />
          Context
        </button>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-2 px-6 pb-4">
        <StatCard label="Context" value={highPriority > 0 ? "High" : "Low"} accent />
        <StatCard label="All tasks" value={totalTasks} />
        <StatCard label="Today" value={todayCount} />
      </div>

      {/* Scrollable task area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded-lg bg-muted/30"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Pinned */}
            {pinnedTask && (
              <div className="pb-3">
                <div className="flex items-center gap-1.5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Pin className="h-3 w-3" />
                  Pinned
                </div>
                <PinnedTaskCard task={pinnedTask} />
              </div>
            )}

            {/* Grouped Sections */}
            <CollapsibleSection
              title="Today"
              tasks={grouped.today}
              defaultOpen={true}
            />
            <CollapsibleSection
              title="Tomorrow"
              tasks={grouped.tomorrow}
              defaultOpen={true}
            />
            <CollapsibleSection
              title="Future"
              tasks={grouped.future}
              defaultOpen={false}
            />
            <CollapsibleSection
              title="Done"
              tasks={grouped.done}
              defaultOpen={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
