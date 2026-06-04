import { useState, FormEvent } from "react";
import { useCreateReminder, useUpdateReminder } from "../hooks/useReminders.js";
import { Button } from "../components/ui/Button.js";
import type { RecurringRule } from "@dossier/core";

interface Props {
  id?: number;
  rules: RecurringRule[];
  onClose: () => void;
}

export default function OrderEdit({ id, rules, onClose }: Props) {
  const createMutation = useCreateReminder();
  const updateMutation = useUpdateReminder();
  
  const existing = id ? rules.find(r => r.id === id) : null;

  const [title, setTitle] = useState(existing?.title || "");
  const [type, setType] = useState<"daily" | "weekly" | "monthly">(existing?.type as any || "daily");
  const [timeOfDay, setTimeOfDay] = useState(existing?.timeOfDay || "09:00");
  const [dayOfWeek, setDayOfWeek] = useState(existing?.dayOfWeek?.toString() || "1");
  const [dayOfMonth, setDayOfMonth] = useState(existing?.dayOfMonth?.toString() || "1");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const input = {
      title: title.trim(),
      type,
      timeOfDay,
      dayOfWeek: type === "weekly" ? parseInt(dayOfWeek) : undefined,
      dayOfMonth: type === "monthly" ? parseInt(dayOfMonth) : undefined,
    };

    if (id) {
      updateMutation.mutate({ id, input }, { onSuccess: onClose });
    } else {
      createMutation.mutate(input, { onSuccess: onClose });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="font-mono text-lg tracking-widest text-amber uppercase mb-2">
        {id ? "Edit Order" : "New Order"}
      </h2>

      <div>
        <label className="block hud-label mb-1">Title</label>
        <input 
          autoFocus
          className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Daily Standup"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block hud-label mb-1">Type</label>
          <select 
            className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
            value={type}
            onChange={e => setType(e.target.value as any)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="block hud-label mb-1">Time</label>
          <input 
            type="time"
            className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
            value={timeOfDay}
            onChange={e => setTimeOfDay(e.target.value)}
          />
        </div>
      </div>

      {type === "weekly" && (
        <div>
          <label className="block hud-label mb-1">Day of Week</label>
          <select 
            className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
            value={dayOfWeek}
            onChange={e => setDayOfWeek(e.target.value)}
          >
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
            <option value="7">Sunday</option>
          </select>
        </div>
      )}

      {type === "monthly" && (
        <div>
          <label className="block hud-label mb-1">Day of Month</label>
          <input 
            type="number" min="1" max="31"
            className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
            value={dayOfMonth}
            onChange={e => setDayOfMonth(e.target.value)}
          />
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
          Save
        </Button>
      </div>
    </form>
  );
}
