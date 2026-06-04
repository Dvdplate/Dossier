import { useState, FormEvent } from "react";
import { useCreateTask } from "../../hooks/useQueue.js";
import { cn } from "../../lib/cn.js";

export function QuickAdd() {
  const [title, setTitle] = useState("");
  const createMutation = useCreateTask();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || createMutation.isPending) return;

    createMutation.mutate({ title: title.trim() }, {
      onSuccess: () => setTitle("")
    });
  };

  return (
    <div className="px-4 pb-4">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New objective..."
          disabled={createMutation.isPending}
          className={cn(
            "w-full bg-midnight border border-gunmetal rounded-lg px-4 py-3 pl-10",
            "text-ash placeholder:text-ash focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber",
            "transition-colors disabled:opacity-50"
          )}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ash">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
      </form>
    </div>
  );
}
