import { useState, FormEvent } from "react";
import type { Task } from "@dossier/core";
import { useUpdateTask } from "../../hooks/useQueue.js";
import { Button } from "../ui/Button.js";

interface Props {
  task: Task;
  onClose: () => void;
}

export function TaskEdit({ task, onClose }: Props) {
  const updateMutation = useUpdateTask();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

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
        Edit Objective
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

      <div className="flex gap-3 mt-4">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
          Save
        </Button>
      </div>
    </form>
  );
}
