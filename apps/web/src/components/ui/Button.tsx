import { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-mono text-sm tracking-wider uppercase transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber disabled:opacity-50 disabled:pointer-events-none",
        "px-4 py-2 h-10",
        variant === "primary" && "bg-amber text-blackops hover:bg-opacity-90",
        variant === "secondary" && "bg-gunmetal text-amber hover:bg-opacity-80",
        variant === "danger" && "bg-alert text-blackops hover:bg-opacity-90",
        variant === "ghost" && "bg-transparent text-ash hover:text-amber",
        className
      )}
      {...props}
    />
  );
}
