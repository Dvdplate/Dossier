import { useState } from "react";
import { useContacts, useDeleteContact } from "../hooks/useContacts.js";
import { Button } from "../components/ui/Button.js";
import { Sheet } from "../components/ui/Sheet.js";
import ContactEdit from "./ContactEdit.js";
import type { Birthday } from "@dossier/core";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function BlackBook() {
  const { data: groups, isLoading } = useContacts();
  const deleteMutation = useDeleteContact();
  
  const [editingContact, setEditingContact] = useState<Birthday | "new" | null>(null);

  if (isLoading) return null;

  return (
    <div className="px-4 pt-6 pb-24 min-h-[calc(100vh-4rem)]">
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xl tracking-widest text-ash uppercase">Black Book</h1>
        <Button variant="ghost" onClick={() => setEditingContact("new")} className="px-2">
          + Add
        </Button>
      </header>

      {(!groups || groups.length === 0) ? (
        <p className="text-ash text-center mt-12">No contacts registered.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(group => (
            <div key={group.month}>
              <h2 className="hud-label text-amber border-b border-amber/30 pb-1 mb-4">{MONTH_NAMES[group.month - 1]}</h2>
              <div className="flex flex-col gap-3">
                {group.contacts.map(contact => (
                  <div key={contact.id} className="flex flex-col p-4 bg-midnight border border-gunmetal rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-ash">{contact.name}</h3>
                        <div className="text-xs text-ash mt-1 flex items-center gap-2">
                          <span>{contact.birthMonth}/{contact.birthDay}</span>
                          {contact.birthYear && (
                            <>
                              <span>•</span>
                              <span>Born {contact.birthYear}</span>
                            </>
                          )}
                        </div>
                        {contact.note && <p className="text-sm text-gunmetal mt-2">{contact.note}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setEditingContact(contact)}>Edit</Button>
                        <button 
                          onClick={() => { if (confirm("Delete contact?")) deleteMutation.mutate(contact.id); }}
                          className="text-ash hover:text-alert p-2 -mr-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={editingContact !== null} onOpenChange={(o) => !o && setEditingContact(null)}>
        {editingContact !== null && (
          <ContactEdit 
            contact={editingContact === "new" ? undefined : editingContact} 
            onClose={() => setEditingContact(null)} 
          />
        )}
      </Sheet>
    </div>
  );
}
