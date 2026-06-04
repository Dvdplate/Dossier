import { useState } from "react";
import { useReminders, useToggleReminder, useDeleteReminder } from "../hooks/useReminders.js";
import { Button } from "../components/ui/Button.js";
import { Sheet } from "../components/ui/Sheet.js";
import { RecurringRule } from "@dossier/core";
import OrderEdit from "./OrderEdit.js";

function formatTime(t: string) {
  const [h, m] = t.split(':');
  const d = new Date();
  d.setHours(parseInt(h, 10), parseInt(m, 10));
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);
}

function formatCadence(rule: RecurringRule) {
  if (rule.type === 'weekly') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `Every ${days[rule.dayOfWeek! % 7]}`;
  }
  if (rule.type === 'monthly') {
    return `Day ${rule.dayOfMonth}`;
  }
  return 'Daily';
}

export default function Orders() {
  const { data: rules, isLoading } = useReminders();
  const toggleMutation = useToggleReminder();
  const deleteMutation = useDeleteReminder();
  
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  if (isLoading) return null;

  return (
    <div className="px-4 pt-6 pb-24 min-h-[calc(100vh-4rem)]">
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xl tracking-widest text-ash uppercase">Standing Orders</h1>
        <Button variant="ghost" onClick={() => setEditingId("new")} className="px-2">
          + Add
        </Button>
      </header>

      {(!rules || rules.length === 0) ? (
        <p className="text-ash text-center mt-12">No standing orders established.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rules.map(rule => (
            <div 
              key={rule.id} 
              className={`p-4 bg-midnight border border-gunmetal rounded-lg transition-opacity ${rule.active ? "opacity-100" : "opacity-50"}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-ash">{rule.title}</h3>
                  <div className="text-sm text-ash mt-1 flex items-center gap-2">
                    <span className="capitalize">{rule.type}</span>
                    <span>•</span>
                    <span>{formatTime(rule.timeOfDay)}</span>
                    {rule.type !== "daily" && (
                      <>
                        <span>•</span>
                        <span>{formatCadence(rule)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleMutation.mutate({ id: rule.id, active: !rule.active })}
                    className="w-10 h-6 bg-blackops border border-gunmetal rounded-full relative"
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform ${rule.active ? "translate-x-4 bg-amber" : "bg-steel"}`} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" className="flex-1 h-8 text-xs" onClick={() => setEditingId(rule.id)}>Edit</Button>
                <Button 
                  variant="danger" 
                  className="flex-none w-12 h-8" 
                  onClick={() => {
                    if (confirm("Delete this standing order?")) deleteMutation.mutate(rule.id);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={editingId !== null} onOpenChange={(o) => !o && setEditingId(null)}>
        {editingId !== null && (
          <OrderEdit 
            id={editingId === "new" ? undefined : editingId} 
            onClose={() => setEditingId(null)} 
            rules={rules || []}
          />
        )}
      </Sheet>
    </div>
  );
}
