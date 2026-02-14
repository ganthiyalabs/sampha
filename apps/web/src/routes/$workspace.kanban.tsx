import { useState, useEffect } from "react";
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
import { Calendar as CalendarIcon, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/$workspace/kanban")({
  component: KanbanPage,
});

const COLUMNS = [
  { id: "backlog", name: "Backlog" },
  { id: "todo", name: "To Do" },
  { id: "in_progress", name: "In Progress" },
  { id: "done", name: "Done" },
  { id: "canceled", name: "Canceled" },
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
  
  const tasks = useQuery(
    (api as any).tasks.list, 
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  
  const updateTask = useMutation((api as any).tasks.update);
  
  const members = useQuery(api.workspaces.listMembers, workspace ? { workspaceId: workspace._id } : "skip");
  const me = useQuery(api.users.me);

  const [kanbanData, setKanbanData] = useState<KanbanItemProps[]>([]);

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

    // If dropped over a card, find the column of that card
    // We search in the *current* kanbanData which might have been updated by onDragOver/onDataChange
    // However, the event.over.id refers to a droppableID. 
    // In our kanban components:
    // - Columns have droppable ID = column.id (via useDroppable in KanbanBoard)
    // - Cards have sortable ID = card.id (via useSortable in KanbanCard)
    
    // So if over.id matches a column ID, it was dropped on the column/empty space.
    // If it matches a card ID, it was dropped on a card.

    const isOverColumn = COLUMNS.some(c => c.id === newStatus);
    
    if (!isOverColumn) {
      // Find the card it was dropped over to determine the column
      const overCard = kanbanData.find(c => c.id === over.id);
      if (overCard) {
        newStatus = overCard.column;
      } else {
        // Fallback or error case
        return;
      }
    }

    // Check if status actually changed
    // We need to look at the *original* task status to decide if we should call update
    // But local state might have already updated via onDataChange during drag.
    // However, onDataChange updates the 'column' property of the items.
    // So we can just ensure we call the mutation. The mutation is idempotent-ish (update status).
    // To avoid redundant calls, maybe check if the backend status differs?
    // But 'tasks' query might not have refreshed yet. 
    
    // Simplest approach: Just call update.
    
    try {
      if (newStatus) {
         await updateTask({
          taskId: activeId,
          status: newStatus,
        });
        // We don't toast success on every drag to avoid spam, but maybe on error.
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update task status");
      // Force refresh data from query if possible or revert local state logic could be added here
    }
  };

  if (!workspace) return <div className="flex items-center justify-center h-full text-muted-foreground">Loading workspace...</div>;

  return (
    <div className="h-full px-4 py-2 flex flex-col overflow-hidden">
       {/* Height calculation to fit within the layout without double scrollbars */}
       <KanbanProvider
        columns={COLUMNS}
        data={kanbanData}
        onDataChange={setKanbanData}
        onDragEnd={onDragEnd}
        className="h-full pb-4"
      >
        {(column) => (
          <KanbanBoard id={column.id} key={column.id} className="bg-muted/30 border-none shadow-none">
            <KanbanHeader className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{column.name}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                   {kanbanData.filter(d => d.column === column.id).length}
                </span>
              </div>
            </KanbanHeader>
            <KanbanCards id={column.id} className="px-2">
              {(item: KanbanTask) => (
                <KanbanCard key={item.id} {...item} className="mb-2 bg-background border shadow-sm group hover:border-primary/50 transition-colors">
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
                          <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-tight border shadow-sm transition-all duration-300",
                            isPast(item.dueDate) && !isToday(item.dueDate)
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/5"
                              : isToday(item.dueDate)
                                ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-indigo-500/5 ring-1 ring-indigo-500/10"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5"
                          )}>
                            <CalendarIcon className="h-3 w-3 shrink-0" />
                            <span>
                              {isToday(item.dueDate) ? "Today" : format(item.dueDate, "MMM d")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {typeof item.priority === 'string' && (
                                <span className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded-sm border uppercase font-black tracking-tighter",
                                  item.priority === 'high' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                  item.priority === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                  'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                )}>
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
                                    {item.assigneeName?.substring(0, 2).toUpperCase()}
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
    </div>
  );
}
