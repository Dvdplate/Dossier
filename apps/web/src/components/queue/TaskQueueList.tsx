import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { reorder } from "@dossier/core";
import type { Task } from "@dossier/core";
import { useReorderTask } from "../../hooks/useQueue.js";
import { TaskQueueItem } from "./TaskQueueItem.js";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  deleteDisabled?: boolean;
}

export function TaskQueueList({ tasks, onEdit, onDelete, deleteDisabled }: Props) {
  const reorderMutation = useReorderTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = reorder(tasks, oldIndex, newIndex);
    reorderMutation.mutate({ order: reordered.map((t) => t.id) });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul id="task-queue-list" className="flex flex-col gap-3" role="list">
          {tasks.map((task, index) => (
            <li key={task.id}>
              <TaskQueueItem
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                disabled={reorderMutation.isPending}
                deleteDisabled={deleteDisabled}
              />
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
