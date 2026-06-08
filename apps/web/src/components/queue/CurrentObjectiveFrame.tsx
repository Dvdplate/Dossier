import { useState } from "react";
import type { Task } from "@dossier/core";
import { useCompleteTask } from "../../hooks/useQueue.js";
import { CompletionStamp } from "./CompletionStamp.js";

interface Props {
  task: Task;
  isFocus?: boolean;
}

export function CurrentObjectiveFrame({ task, isFocus = true }: Props) {
  const completeMutation = useCompleteTask();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    // Vibrate if supported
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    
    // Give animation time to play before mutation
    setTimeout(() => {
      completeMutation.mutate(task.id);
    }, 700);
  };

  return (
    <div className="relative bg-blackops border border-amber/30 p-6 rounded-none min-h-[280px] flex flex-col shadow-[0_0_15px_rgba(217,143,43,0.1)]">
      {/* Corner Brackets */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber" />

      <div className="hud-label text-amber mb-4 flex items-center gap-2">
        {isFocus && <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />}
        {isFocus ? "Current Objective" : "Objective"}
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-bold text-ash tracking-wide mb-3">{task.title}</h2>
        {task.notes && (
          <p className="text-sm text-ash leading-relaxed whitespace-pre-wrap">{task.notes}</p>
        )}
      </div>

      <div className="mt-8 relative">
        <button
          onClick={handleComplete}
          disabled={isCompleting || completeMutation.isPending}
          className="w-full h-14 bg-amber/10 border border-amber text-amber font-mono tracking-widest uppercase text-sm hover:bg-amber hover:text-blackops transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isCompleting ? "Transmitting..." : "Objective Complete"}
        </button>
        {isCompleting && <CompletionStamp />}
      </div>
    </div>
  );
}
