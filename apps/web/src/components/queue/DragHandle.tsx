import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { cn } from "../../lib/cn.js";

interface Props {
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
  className?: string;
}

export function DragHandle({ listeners, attributes, className }: Props) {
  return (
    <button
      type="button"
      className={cn(
        "p-2 rounded text-ash/50 hover:text-amber transition-colors touch-none cursor-grab active:cursor-grabbing",
        className,
      )}
      aria-label="Reorder"
      {...attributes}
      {...listeners}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
      </svg>
    </button>
  );
}
