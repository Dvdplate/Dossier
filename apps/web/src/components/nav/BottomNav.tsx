import { Link, useLocation } from "wouter";
import { cn } from "../../lib/cn.js";
import { navItems } from "./navItems.js";

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-blackops border-t border-gunmetal z-40 pb-safe">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-amber" : "text-ash hover:text-amber/70"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-mono uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
