import { useState, FormEvent } from "react";
import { useCreateContact, useUpdateContact } from "../hooks/useContacts.js";
import { Button } from "../components/ui/Button.js";
import { MONTH_NAMES, type Birthday } from "@dossier/core";

interface Props {
  contact?: Birthday;
  onClose: () => void;
}

export default function ContactEdit({ contact, onClose }: Props) {
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();

  const [name, setName] = useState(contact?.name || "");
  const [birthMonth, setBirthMonth] = useState(contact?.birthMonth?.toString() || "1");
  const [birthDay, setBirthDay] = useState(contact?.birthDay?.toString() || "1");
  const [birthYear, setBirthYear] = useState(contact?.birthYear?.toString() || "");
  const [note, setNote] = useState(contact?.note || "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const input = {
      name: name.trim(),
      birthMonth: parseInt(birthMonth),
      birthDay: parseInt(birthDay),
      birthYear: birthYear ? parseInt(birthYear) : undefined,
      note: note.trim() || undefined,
    };

    if (contact) {
      updateMutation.mutate({ id: contact.id, input }, { onSuccess: onClose });
    } else {
      createMutation.mutate(input, { onSuccess: onClose });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="font-mono text-lg tracking-widest text-amber uppercase mb-2">
        {contact ? "Edit Contact" : "New Contact"}
      </h2>

      <div>
        <label className="block hud-label mb-1">Name</label>
        <input 
          autoFocus
          className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block hud-label mb-1">Month</label>
          <select
            className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
            value={birthMonth}
            onChange={e => setBirthMonth(e.target.value)}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block hud-label mb-1">Day</label>
          <input 
            type="number" min="1" max="31"
            className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
            value={birthDay}
            onChange={e => setBirthDay(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block hud-label mb-1">Year (Optional)</label>
        <input 
          type="number" min="1900" max={new Date().getFullYear()}
          className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber placeholder:text-gunmetal"
          placeholder="YYYY"
          value={birthYear}
          onChange={e => setBirthYear(e.target.value)}
        />
      </div>

      <div>
        <label className="block hud-label mb-1">Notes</label>
        <textarea 
          className="w-full bg-blackops border border-gunmetal rounded p-3 text-ash focus:outline-none focus:border-amber"
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-3 mt-4">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
          Save
        </Button>
      </div>
    </form>
  );
}
