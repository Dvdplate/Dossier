import type { Task } from "@dossier/core";
import { useReorderTask } from "../../hooks/useQueue.js";
import { cn } from "../../lib/cn.js";

interface Props {
  task: Task;
  index: number;
  total: number;
}

export function MoveControls({ task, index, total }: Props) {
  const reorder = useReorderTask();

  const handleMove = (direction: "top" | "up" | "down") => {
    reorder.mutate({ id: task.id, direction });
  };

  return (
    <div className="flex items-center gap-2 mt-4 border-t border-gunmetal/30 pt-4">
      <button
        onClick={() => handleMove("top")}
        disabled={index === 1} // 0 is focus, 1 is next. Cannot move 1 to top because it's already next. Wait, top means index 0!
        className={cn(
          "p-2 rounded bg-midnight text-ash hover:text-amber transition-colors disabled:opacity-30 disabled:hover:text-ash",
        )}
        title="Move to Focus"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 11 12 6 7 11" />
          <polyline points="17 18 12 13 7 18" />
        </svg>
      </button>
      <button
        onClick={() => handleMove("up")}
        disabled={index === 1}
        className="p-2 rounded bg-midnight text-ash hover:text-ash transition-colors disabled:opacity-30 disabled:hover:text-ash"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
      <button
        onClick={() => handleMove("down")}
        disabled={index === total - 1}
        className="p-2 rounded bg-midnight text-ash hover:text-ash transition-colors disabled:opacity-30 disabled:hover:text-ash"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      </button>
    </div>
  );
}
