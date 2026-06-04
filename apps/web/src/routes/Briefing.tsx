import { useQueue } from "../hooks/useQueue.js";
import { FocusCarousel } from "../components/queue/FocusCarousel.js";
import { QuickAdd } from "../components/queue/QuickAdd.js";
import { ContactsThisWeek } from "../components/birthdays/ContactsThisWeek.js";

export default function Briefing() {
  const { data: queue, isLoading } = useQueue();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] pb-safe">
      <header className="px-4 pt-6 pb-2">
        <h1 className="font-mono text-xl tracking-widest text-ash uppercase">Briefing</h1>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <FocusCarousel tasks={queue || []} />
          <QuickAdd />
          <div className="mt-auto">
            <ContactsThisWeek />
          </div>
        </div>
      )}
    </div>
  );
}
