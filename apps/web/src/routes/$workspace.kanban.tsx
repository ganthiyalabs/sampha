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

function KanbanPage() {
  const { workspace: slug } = useParams({ from: "/$workspace/kanban" });
  const workspace = useQuery(api.workspaces.getBySlug, { slug });
  
  const tasks = useQuery(
    (api as any).tasks.list, 
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  
  const updateTask = useMutation((api as any).tasks.update);

  const [kanbanData, setKanbanData] = useState<KanbanItemProps[]>([]);

  useEffect(() => {
    if (tasks) {
      const mappedTasks = tasks.map((task: any) => ({
        id: task._id,
        name: task.title,
        column: task.status || "backlog",
        priority: task.priority,
        description: task.description,
      }));
      setKanbanData(mappedTasks);
    }
  }, [tasks]);

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
              {(item) => (
                <KanbanCard key={item.id} {...item} className="mb-2 bg-background border shadow-sm">
                   <div className="flex flex-col gap-1.5">
                      <span className="font-medium text-sm leading-tight">{item.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {typeof item.priority === 'string' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${
                                item.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                item.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                            {item.priority as string}
                            </span>
                        )}
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
