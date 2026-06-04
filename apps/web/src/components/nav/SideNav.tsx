import { Link, useLocation } from "wouter";
import { cn } from "../../lib/cn.js";
import { navItems } from "./navItems.js";

export function SideNav() {
  const [location] = useLocation();

  return (
    <nav className="hidden md:flex flex-col w-20 lg:w-56 shrink-0 bg-blackops border-r border-gunmetal min-h-screen sticky top-0">
      <div className="px-3 py-6 border-b border-gunmetal">
        <span className="hidden lg:block font-mono text-amber tracking-widest uppercase text-xs">Quest Maker</span>
        <span className="lg:hidden font-mono text-amber tracking-widest uppercase text-xs">QM</span>
      </div>
      <div className="flex flex-col gap-1 p-2 pt-4 flex-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded transition-colors",
                isActive
                  ? "text-amber bg-gunmetal"
                  : "text-ash hover:text-amber/70 hover:bg-gunmetal/50"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block text-xs font-mono uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
