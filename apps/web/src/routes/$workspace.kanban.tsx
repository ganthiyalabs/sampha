import { useState, useEffect, useRef } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@sampha/backend/convex/_generated/api";
import type { Id } from "@sampha/backend/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanItemProps,
} from "@/components/ui/kanban";
import type { DragEndEvent } from "@dnd-kit/core";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, isPast, isToday } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/$workspace/kanban")({
  component: KanbanPage,
});

const PRESET_COLORS = [
  "#6b7280",
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

interface KanbanTask extends KanbanItemProps {
  description?: string;
  priority?: string;
  dueDate?: number;
  project?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
}

function KanbanPage() {
  const { workspace: slug } = useParams({ from: "/$workspace/kanban" });
  const workspace = useQuery(api.workspaces.getBySlug, { slug });

  const statusConfigs = useQuery(
    (api as any).statusConfigs.list,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const seedStatuses = useMutation((api as any).statusConfigs.seed);
  const createStatus = useMutation((api as any).statusConfigs.create);

  const tasks = useQuery(
    (api as any).tasks.list,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const updateTask = useMutation((api as any).tasks.update);

  const members = useQuery(
    api.workspaces.listMembers,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const me = useQuery(api.users.me);

  const [kanbanData, setKanbanData] = useState<KanbanItemProps[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState(PRESET_COLORS[5]);
  const [isCreating, setIsCreating] = useState(false);
  const seededRef = useRef(false);

  // Auto-seed default statuses on first load
  useEffect(() => {
    if (
      workspace &&
      statusConfigs !== undefined &&
      statusConfigs.length === 0 &&
      !seededRef.current
    ) {
      seededRef.current = true;
      seedStatuses({ workspaceId: workspace._id });
    }
  }, [workspace, statusConfigs, seedStatuses]);

  // Build columns from statusConfigs
  const columns =
    statusConfigs && statusConfigs.length > 0
      ? statusConfigs.map((c: any) => ({
          id: c.name.toLowerCase().replace(/\s+/g, "_"),
          name: c.name,
          color: c.color,
        }))
      : [];

  useEffect(() => {
    if (tasks && members) {
      const mappedTasks = tasks.map((task: any) => {
        const assigneeRef = task.assigneeIds?.[0];
        const member = members.find((m: any) => m.userId === assigneeRef);
        const name = member?.user?.name || me?.name || "Unassigned";

        return {
          id: task._id,
          name: task.title,
          column: task.status || "backlog",
          priority: task.priority,
          description: task.description,
          dueDate: task.dueDate,
          assigneeName: name,
          assigneeAvatar: member?.user?.avatarUrl,
        };
      });
      setKanbanData(mappedTasks as KanbanTask[]);
    }
  }, [tasks, members, me]);

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as Id<"tasks">;
    let newStatus = over.id as string;

    const isOverColumn = columns.some((c: any) => c.id === newStatus);

    if (!isOverColumn) {
      const overCard = kanbanData.find((c) => c.id === over.id);
      if (overCard) {
        newStatus = overCard.column;
      } else {
        return;
      }
    }

    try {
      if (newStatus) {
        await updateTask({
          taskId: activeId,
          status: newStatus,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update task status");
    }
  };

  const handleCreateList = async () => {
    if (!workspace || !newListName.trim()) return;

    setIsCreating(true);
    try {
      await createStatus({
        workspaceId: workspace._id,
        name: newListName.trim(),
        color: newListColor,
      });
      toast.success(`Created "${newListName.trim()}" list`);
      setNewListName("");
      setNewListColor(PRESET_COLORS[5]);
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create list");
    } finally {
      setIsCreating(false);
    }
  };

  if (!workspace)
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading workspace...
      </div>
    );

  if (columns.length === 0)
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Setting up board...
      </div>
    );

  return (
    <div className="h-full px-4 py-2 flex flex-col overflow-hidden">
      <KanbanProvider
        columns={columns}
        data={kanbanData}
        onDataChange={setKanbanData}
        onDragEnd={onDragEnd}
        className="h-full pb-4"
      >
        {(column) => (
          <KanbanBoard
            id={column.id}
            key={column.id}
            className="bg-muted/30 border-none shadow-none"
          >
            <KanbanHeader className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: (column as any).color }}
                />
                <span className="font-semibold text-sm">{column.name}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                  {kanbanData.filter((d) => d.column === column.id).length}
                </span>
              </div>
            </KanbanHeader>
            <KanbanCards id={column.id} className="px-2">
              {(item: KanbanTask) => (
                <KanbanCard
                  key={item.id}
                  {...item}
                  className="mb-2 bg-background border shadow-sm group hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors text-foreground/90">
                        {item.name}
                      </span>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {item.dueDate && (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight border shadow-sm transition-all duration-300",
                            isPast(item.dueDate) && !isToday(item.dueDate)
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5"
                              : isToday(item.dueDate)
                                ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-indigo-500/5 ring-1 ring-indigo-500/10"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5"
                          )}
                        >
                          <CalendarIcon className="h-3 w-3 shrink-0" />
                          <span>
                            {isToday(item.dueDate)
                              ? "Today"
                              : format(item.dueDate, "MMM d")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {typeof item.priority === "string" && (
                          <span
                            className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-sm border uppercase font-black tracking-tighter",
                              item.priority === "high"
                                ? "bg-red-500/10 text-red-600 border-red-500/20"
                                : item.priority === "medium"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            )}
                          >
                            {item.priority}
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm border uppercase font-black tracking-tighter bg-muted text-muted-foreground border-border/50">
                          {String(item.column).replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden ml-2">
                        <Avatar className="h-5 w-5 border border-border/50 ring-2 ring-background">
                          <AvatarFallback className="text-[9px] bg-primary text-primary-foreground font-bold">
                            {item.assigneeName
                              ?.substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground font-semibold truncate max-w-[60px]">
                          {item.assigneeName}
                        </span>
                      </div>
                    </div>
                  </div>
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>

      {/* Add New List button — positioned after all columns */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          onClick={() => setDialogOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* New List Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Review, QA, Staging..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newListName.trim()) {
                    handleCreateList();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewListColor(color)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-200 border-2",
                      newListColor === color
                        ? "border-foreground scale-110 ring-2 ring-foreground/20"
                        : "border-transparent hover:scale-105 hover:border-muted-foreground/30"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateList}
              disabled={!newListName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
