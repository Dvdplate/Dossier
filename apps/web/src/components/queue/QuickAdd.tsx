import { useState } from "react";
import { Sheet } from "../ui/Sheet.js";
import { Button } from "../ui/Button.js";
import { TaskEdit } from "./TaskEdit.js";

export function QuickAdd() {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-4 pb-4">
      <Button className="w-full" onClick={() => setOpen(true)}>
        New Objective
      </Button>

      <Sheet open={open} onOpenChange={(next) => !next && setOpen(false)}>
        {open && <TaskEdit onClose={() => setOpen(false)} />}
      </Sheet>
    </div>
  );
}
