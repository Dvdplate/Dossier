import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@dossier/core";
import { cn } from "../../lib/cn.js";
import { CurrentObjectiveFrame } from "./CurrentObjectiveFrame.js";
import { DragHandle } from "./DragHandle.js";
import { EditButton } from "./EditButton.js";
import { DeleteButton } from "./DeleteButton.js";

interface Props {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  disabled?: boolean;
  deleteDisabled?: boolean;
}

export function TaskQueueItem({ task, index, onEdit, onDelete, disabled, deleteDisabled }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isFocus = index === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "z-10 opacity-80")}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <EditButton onClick={() => onEdit(task)} />
        <DeleteButton onClick={() => onDelete(task)} disabled={deleteDisabled} />
        <DragHandle listeners={listeners} attributes={attributes} />
      </div>
      <CurrentObjectiveFrame task={task} isFocus={isFocus} />
    </div>
  );
}
