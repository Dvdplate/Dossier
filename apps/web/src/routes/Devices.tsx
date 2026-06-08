import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/Button.js";
import { Sheet } from "../components/ui/Sheet.js";
import { useCreateDevice, useDeleteDevice, useDevices } from "../hooks/useDevices.js";
import { generateDeviceKeys, makeDeviceCredential } from "../lib/deviceKeys.js";

function formatDate(ms: number) {
  return new Date(ms).toLocaleString();
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function Devices() {
  const { data: devices, isLoading } = useDevices();
  const createMutation = useCreateDevice();
  const deleteMutation = useDeleteDevice();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [generatedCredential, setGeneratedCredential] = useState<string>("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [localError, setLocalError] = useState("");
  const credentialRef = useRef<HTMLTextAreaElement>(null);

  const sorted = useMemo(() => {
    return (devices ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
  }, [devices]);

  const handleCreate = async () => {
    setLocalError("");
    setGeneratedCredential("");
    const trimmed = nickname.trim();
    if (!trimmed) {
      setLocalError("Nickname is required.");
      return;
    }

    const deviceId = crypto.randomUUID();
    const { privateJwk, publicJwk } = await generateDeviceKeys();

    await createMutation.mutateAsync({
      deviceId,
      nickname: trimmed,
      publicKeyJwk: publicJwk,
    });

    const cred = makeDeviceCredential({ deviceId, nickname: trimmed, privateJwk });
    setCopyState("idle");
    setGeneratedCredential(JSON.stringify(cred, null, 2));
  };

  useEffect(() => {
    if (!generatedCredential) return;
    const el = credentialRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "nearest" });
    el.focus();
    el.select();
  }, [generatedCredential]);

  const handleCopyCredential = async () => {
    if (!generatedCredential) return;
    const ok = await copyText(generatedCredential);
    setCopyState(ok ? "copied" : "failed");
    if (ok) window.setTimeout(() => setCopyState("idle"), 2000);
  };

  if (isLoading) return null;

  return (
    <div className="px-4 pt-6 pb-24 min-h-[calc(100vh-4rem)]">
      <header className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xl tracking-widest text-ash uppercase">Devices</h1>
        <Button variant="ghost" onClick={() => { setIsAddOpen(true); setNickname(""); setGeneratedCredential(""); setCopyState("idle"); setLocalError(""); }} className="px-2">
          + Add
        </Button>
      </header>

      {(!sorted || sorted.length === 0) ? (
        <p className="text-ash text-center mt-12">No devices registered.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-4 p-4 bg-midnight border border-gunmetal rounded-lg">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-ash truncate">{d.nickname}</h3>
                  {d.isCurrent && (
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-amber/40 text-amber">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-xs text-ash mt-1 font-mono">
                  <div className="truncate">ID: {d.id}</div>
                  <div>Created: {formatDate(d.createdAt)}</div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (d.isCurrent) return;
                    if (confirm(`Delete device "${d.nickname}"?`)) deleteMutation.mutate(d.id);
                  }}
                  disabled={deleteMutation.isPending || d.isCurrent}
                  className={[
                    "p-2 rounded text-ash hover:text-alert",
                    d.isCurrent ? "opacity-40 cursor-not-allowed" : "hover:bg-gunmetal/30",
                  ].join(" ")}
                  title={d.isCurrent ? "Cannot delete current device" : "Delete device"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={isAddOpen} onOpenChange={(o) => !o && setIsAddOpen(false)}>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-mono tracking-widest text-amber uppercase text-sm">Add device</h2>
            <p className="text-ash text-xs mt-1">
              This generates a new key pair in your browser and returns a credential JSON you can paste into the target device.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-ash uppercase tracking-widest">Nickname</label>
            <input
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setLocalError(""); }}
              className="w-full bg-midnight border border-gunmetal p-3 rounded font-mono text-xs text-amber focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber transition-colors"
              placeholder="e.g. Work Laptop"
              autoFocus
            />
            {localError && <p className="text-red-400 text-xs font-mono">{localError}</p>}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending || !nickname.trim()}
              className="flex-1"
            >
              {createMutation.isPending ? "Creating..." : "Generate credential"}
            </Button>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="px-4">
              Close
            </Button>
          </div>

          {createMutation.error && (
            <p className="text-red-400 text-xs font-mono">
              {(createMutation.error as Error).message}
            </p>
          )}

          {generatedCredential && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-mono text-ash uppercase tracking-widest">Credential JSON</label>
                <Button variant="secondary" onClick={() => void handleCopyCredential()} className="h-8 px-3 text-xs">
                  {copyState === "copied" ? "Copied!" : copyState === "failed" ? "Copy failed" : "Copy JSON"}
                </Button>
              </div>
              <textarea
                ref={credentialRef}
                readOnly
                rows={8}
                className="w-full select-text bg-midnight border border-gunmetal p-3 rounded font-mono text-xs text-amber focus:outline-none resize-none"
                value={generatedCredential}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
              />
              <p className="text-ash text-xs">
                {copyState === "failed"
                  ? "Clipboard blocked — tap the JSON above, then use your device’s copy gesture."
                  : "Copy this JSON to the new device, then paste it on first open."}
              </p>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}

