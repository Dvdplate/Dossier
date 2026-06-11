import { useState, FormEvent } from "react";
import type { Task } from "@dossier/core";
import { useCreateTask, useUpdateTask } from "../../hooks/useQueue.js";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/cn.js";

interface Props {
  task?: Task;
  onClose: () => void;
}

export function TaskEdit({ task, onClose }: Props) {
  const isCreate = task === undefined;
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const isPending = isCreate ? createMutation.isPending : updateMutation.isPending;

  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [urgent, setUrgent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isCreate) {
      createMutation.mutate(
        {
          title: title.trim(),
          notes: notes.trim() || null,
          ...(urgent ? { urgent: true } : {}),
        },
        { onSuccess: onClose },
      );
      return;
    }

    updateMutation.mutate(
      {
        id: task.id,
        input: {
          title: title.trim(),
          notes: notes.trim() || null,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="font-mono text-lg tracking-widest text-amber uppercase mb-2">
        {isCreate ? "New Objective" : "Edit Objective"}
      </h2>

      <div>
        <label className="block hud-label mb-1">Title</label>
        <input
          autoFocus
          className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Objective title"
        />
      </div>

      <div>
        <label className="block hud-label mb-1">Notes</label>
        <textarea
          className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber min-h-[120px] resize-y"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />
      </div>

      {isCreate && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={urgent}
            aria-label="Mark as urgent"
            disabled={isPending}
            onClick={() => setUrgent((v) => !v)}
            className="w-10 h-6 bg-blackops border border-gunmetal rounded-full relative disabled:opacity-50"
          >
            <div
              className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform",
                urgent ? "translate-x-4 bg-amber" : "bg-steel",
              )}
            />
          </button>
          <span className="text-xs text-ash">Urgent</span>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isCreate ? "Add" : "Save"}
        </Button>
      </div>
    </form>
  );
}
