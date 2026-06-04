import { Link, useLocation } from "wouter";
import { cn } from "../../lib/cn.js";

const navItems = [
  { href: "/", label: "Briefing", icon: BriefingIcon },
  { href: "/orders", label: "Orders", icon: OrdersIcon },
  { href: "/blackbook", label: "Black Book", icon: BlackBookIcon },
  { href: "/log", label: "Log", icon: LogIcon },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-blackops border-t border-gunmetal z-40 pb-safe">
      <div className="flex justify-around items-center h-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto">
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

// Simple inline SVG icons
function BriefingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function OrdersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BlackBookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
