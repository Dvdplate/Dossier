import { useLog } from "../hooks/useLog.js";
import { Button } from "../components/ui/Button.js";

function formatDate(ms: number) {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(new Date(ms));
}

export default function Log() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useLog();

  if (isLoading) return null;

  const items = data?.pages.flatMap(p => p.items) || [];

  return (
    <div className="px-4 pt-6 pb-24 min-h-[calc(100vh-4rem)]">
      <header className="mb-6">
        <h1 className="font-mono text-xl tracking-widest text-ash uppercase">Mission Log</h1>
      </header>

      {items.length === 0 ? (
        <p className="text-ash text-center mt-12">No operations logged.</p>
      ) : (
        <div className="flex flex-col relative border-l border-gunmetal/50 ml-2 pl-4 py-2 space-y-6">
          {items.map(task => (
            <div key={task.id} className="relative">
              <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-amber shadow-[0_0_8px_rgba(217,143,43,0.8)]" />
              <div className="text-xs text-amber mb-1 font-mono">{formatDate(task.completedAt || task.createdAt)}</div>
              <div className="font-medium text-ash">{task.title}</div>
              {task.notes && <div className="text-sm text-gunmetal mt-1 line-clamp-2">{task.notes}</div>}
              {task.origin !== "manual" && (
                <div className="inline-block mt-2 px-2 py-0.5 bg-midnight text-ash text-[10px] uppercase font-mono tracking-wider rounded">
                  Standing Order
                </div>
              )}
            </div>
          ))}

          {hasNextPage && (
            <div className="pt-4">
              <Button 
                variant="ghost" 
                className="w-full text-xs" 
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Decrypting..." : "Load Archive"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
