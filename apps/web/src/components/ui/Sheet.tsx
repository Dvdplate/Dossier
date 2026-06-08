import { useEffect, ReactNode } from "react";
import { cn } from "../../lib/cn.js";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div 
        className="absolute inset-0 bg-blackops/80 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-h-[85vh] overflow-y-auto bg-blackops border-t border-gunmetal rounded-t-xl p-6 shadow-xl animate-in slide-in-from-bottom-full duration-300">
        {children}
      </div>
    </div>
  );
}
