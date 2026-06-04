import { useRef } from "react";
import type { Task } from "@dossier/core";
import { CurrentObjectiveFrame } from "./CurrentObjectiveFrame.js";
import { MoveControls } from "./MoveControls.js";

interface FocusCarouselProps {
  tasks: Task[];
}

export function FocusCarousel({ tasks }: FocusCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-ash">
        <p className="font-mono text-sm tracking-widest uppercase mb-4">All objectives cleared.</p>
        <p className="text-xs">Stand by for orders.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative py-8">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pl-[5vw] pr-[5vw] pb-8 pt-4 gap-4 items-center"
      >
        {tasks.map((task, index) => {
          const isFocus = index === 0;
          return (
            <div 
              key={task.id} 
              className={`snap-center shrink-0 w-[85vw] transition-all duration-300 ${isFocus ? "scale-100 opacity-100" : "scale-95 opacity-50 grayscale"}`}
            >
              {isFocus ? (
                <CurrentObjectiveFrame task={task} />
              ) : (
                <div className="bg-midnight border border-gunmetal/50 rounded-lg p-6 min-h-[200px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-ash font-medium">{task.title}</h3>
                    {task.notes && <p className="text-xs text-ash/70 mt-2 line-clamp-3">{task.notes}</p>}
                  </div>
                  <MoveControls task={task} index={index} total={tasks.length} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
