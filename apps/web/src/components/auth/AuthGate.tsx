import { useState, useEffect, FormEvent } from "react";
import { setToken } from "../../lib/auth.js";
import { Button } from "../ui/Button.js";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(() => {
    const handler = () => setNeedsAuth(true);
    window.addEventListener("auth-required", handler);
    return () => window.removeEventListener("auth-required", handler);
  }, []);

  if (!needsAuth) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      setToken(tokenInput.trim());
      setNeedsAuth(false);
      // Reload page to retry failed queries
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-blackops z-[100] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="font-mono text-xl tracking-widest text-amber uppercase mb-2">Secure Connection</h1>
          <p className="text-ash text-sm">Please provide your clearance code to continue.</p>
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full bg-midnight border border-gunmetal p-3 rounded font-mono text-center text-amber focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-colors"
            placeholder="ACCESS CODE"
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full">Authenticate</Button>
      </form>
    </div>
  );
}
