import { useQuery, useMutation } from "convex/react";
import { api } from "@sampha/backend/convex/_generated/api";
import { CheckCircle2, Calendar, ChevronRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TaskList() {
  const tasks = useQuery(api.tasks.listMyTasks);

  if (tasks === undefined) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded border bg-muted/50" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">Tasks</CardTitle>
          <CardDescription>
            {tasks.filter((t) => t.status !== "done").length} task{tasks.length !== 1 ? "s" : ""}{" "}
            remaining
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
            <p className="text-sm font-medium">No tasks found</p>
            <p className="text-xs opacity-60 mt-1">Add one using the input above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskItem key={task._id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskItem({ task }: { task: any }) {
  const toggleStatus = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const isOverdue = task.dueDate < Date.now() && task.status !== "done";
  const isDone = task.status === "done";

  const handleToggle = async () => {
    try {
      await toggleStatus({
        taskId: task._id,
        status: isDone ? "todo" : "done",
      });
    } catch (err) {
      toast.error("Failed to update task");
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeTask({ taskId: task._id });
      toast.success("Task deleted");
    } catch (err) {
      toast.error("Failed to delete task");
      console.error(err);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all group relative",
        isDone
          ? "bg-muted/30 border-transparent"
          : "bg-card hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
      )}
    >
      <button
        onClick={handleToggle}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          isDone
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary/50",
        )}
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-transparent" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-sm font-semibold truncate transition-all",
            isDone &&
              "text-muted-foreground line-through decoration-muted-foreground/50 font-normal",
          )}
        >
          {task.title}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-medium">
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 rounded-md",
                isOverdue
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-muted/50 border border-border/50",
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(task.dueDate, "MMM d")}
            </span>
          )}
          {task.priority && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-md uppercase tracking-wider text-[9px] font-black border",
                task.priority === "high"
                  ? "bg-red-500/10 text-red-500 border-red-500/20"
                  : task.priority === "medium"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20",
              )}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
