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
import { Calendar as CalendarIcon, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const groups = useQuery(
    api.groups.list,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const seedGroups = useMutation(api.groups.seed);
  const createGroup = useMutation(api.groups.create);
  const updateGroup = useMutation(api.groups.update);
  const removeGroup = useMutation(api.groups.remove);

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[5]);
  
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [deletingGroup, setDeletingGroup] = useState<any>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const seededRef = useRef(false);

  // Auto-seed default groups on first load
  useEffect(() => {
    if (
      workspace &&
      groups !== undefined &&
      groups.length === 0 &&
      !seededRef.current
    ) {
      seededRef.current = true;
      seedGroups({ workspaceId: workspace._id });
    }
  }, [workspace, groups, seedGroups]);

  // Build columns from groups
  const columns =
    groups && groups.length > 0
      ? groups.map((g: any) => ({
          id: g.name.toLowerCase().replace(/\s+/g, "_"),
          rawId: g._id, // Keep the actual DB ID for mutations
          name: g.name,
          color: g.color,
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

  const handleCreateGroup = async () => {
    if (!workspace || !newGroupName.trim()) return;

    setIsProcessing(true);
    try {
      await createGroup({
        workspaceId: workspace._id,
        name: newGroupName.trim(),
        color: newGroupColor,
      });
      toast.success(`Created "${newGroupName.trim()}" group`);
      setNewGroupName("");
      setNewGroupColor(PRESET_COLORS[5]);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create group");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;

    setIsProcessing(true);
    try {
      await updateGroup({
        groupId: (editingGroup as any).rawId,
        name: newGroupName.trim(),
        color: newGroupColor,
      });
      toast.success(`Updated group`);
      setEditDialogOpen(false);
      setEditingGroup(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update group");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;

    setIsProcessing(true);
    try {
      await removeGroup({
        groupId: (deletingGroup as any).rawId,
      });
      toast.success(`Deleted group and all its tasks`);
      setDeleteDialogOpen(false);
      setDeletingGroup(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete group");
    } finally {
      setIsProcessing(false);
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
            <KanbanHeader className="flex justify-between items-center px-4 py-3 group/header">
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setEditingGroup(column);
                    setNewGroupName(column.name);
                    setNewGroupColor((column as any).color);
                    setEditDialogOpen(true);
                  }}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Group
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    variant="destructive"
                    onClick={() => {
                      setDeletingGroup(column);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Add New Group button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          onClick={() => {
            setNewGroupName("");
            setNewGroupColor(PRESET_COLORS[5]);
            setCreateDialogOpen(true);
          }}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Review, QA, Staging..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newGroupName.trim()) {
                    handleCreateGroup();
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
                    onClick={() => setNewGroupColor(color)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-200 border-2",
                      newGroupColor === color
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
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isProcessing}
            >
              {isProcessing ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Review, QA, Staging..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newGroupName.trim()) {
                    handleUpdateGroup();
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
                    onClick={() => setNewGroupColor(color)}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all duration-200 border-2",
                      newGroupColor === color
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
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateGroup}
              disabled={!newGroupName.trim() || isProcessing}
            >
              {isProcessing ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the group <strong>"{deletingGroup?.name}"</strong>? 
              This will <strong className="text-destructive">permanently delete all tasks</strong> within this group.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={isProcessing}
            >
              {isProcessing ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
