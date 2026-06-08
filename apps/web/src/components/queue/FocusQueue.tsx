import { useState } from "react";
import type { Task } from "@dossier/core";
import { useDeleteTask } from "../../hooks/useQueue.js";
import { Sheet } from "../ui/Sheet.js";
import { CurrentObjectiveFrame } from "./CurrentObjectiveFrame.js";
import { TaskEdit } from "./TaskEdit.js";
import { TaskQueueList } from "./TaskQueueList.js";
import { EditButton } from "./EditButton.js";
import { DeleteButton } from "./DeleteButton.js";
import { cn } from "../../lib/cn.js";

interface FocusQueueProps {
  tasks: Task[];
}

export function FocusQueue({ tasks }: FocusQueueProps) {
  const [queueExpanded, setQueueExpanded] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const deleteMutation = useDeleteTask();

  const handleDelete = (task: Task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    if (editingTask?.id === task.id) setEditingTask(null);
    deleteMutation.mutate(task.id);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-ash">
        <p className="font-mono text-sm tracking-widest uppercase mb-4">All objectives cleared.</p>
        <p className="text-xs">Stand by for orders.</p>
      </div>
    );
  }

  const remaining = tasks.length - 1;

  return (
    <div className="w-full px-4 py-8">
      {!queueExpanded ? (
        <div className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
              <EditButton onClick={() => setEditingTask(tasks[0])} />
              <DeleteButton
                onClick={() => handleDelete(tasks[0])}
                disabled={deleteMutation.isPending}
              />
            </div>
            <CurrentObjectiveFrame task={tasks[0]} />
          </div>

          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setQueueExpanded(true)}
              aria-expanded={false}
              aria-controls="task-queue-list"
              className={cn(
                "w-full py-3 font-mono text-xs tracking-widest uppercase",
                "text-ash/70 hover:text-amber border border-gunmetal/50 rounded-lg",
                "transition-colors",
              )}
            >
              Show queue ({remaining} more)
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setQueueExpanded(false)}
            aria-expanded={true}
            aria-controls="task-queue-list"
            className={cn(
              "w-full py-3 font-mono text-xs tracking-widest uppercase",
              "text-ash/70 hover:text-amber border border-gunmetal/50 rounded-lg",
              "transition-colors",
            )}
          >
            Hide queue
          </button>

          <div className="animate-in fade-in duration-200">
            <TaskQueueList
              tasks={tasks}
              onEdit={setEditingTask}
              onDelete={handleDelete}
              deleteDisabled={deleteMutation.isPending}
            />
          </div>
        </div>
      )}

      <Sheet open={editingTask !== null} onOpenChange={(open) => !open && setEditingTask(null)}>
        {editingTask && (
          <TaskEdit task={editingTask} onClose={() => setEditingTask(null)} />
        )}
      </Sheet>
    </div>
  );
}
