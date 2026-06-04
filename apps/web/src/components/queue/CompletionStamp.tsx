import { useReducedMotion } from "../../hooks/useReducedMotion.js";

export function CompletionStamp() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-blackops/80 border-2 border-amber pointer-events-none">
        <span className="text-amber font-mono font-bold text-2xl tracking-widest uppercase">
          Complete
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-amber/10 animate-pulse" />
      <span 
        className="text-amber font-mono font-bold text-4xl tracking-widest uppercase opacity-0"
        style={{ animation: 'stamp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
      >
        Complete
      </span>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes stamp {
          0% { opacity: 0; transform: scale(3) rotate(-15deg); }
          50% { opacity: 1; transform: scale(1.1) rotate(-5deg); }
          100% { opacity: 1; transform: scale(1) rotate(-5deg); }
        }
      `}} />
    </div>
  );
}
