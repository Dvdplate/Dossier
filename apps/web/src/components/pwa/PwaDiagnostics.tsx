import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/cn.js";

/**
 * Debug-only PWA installability panel. Mount it anywhere; it renders nothing
 * unless the URL has a `?debug` query param (e.g. `/?debug`). It reports every
 * signal Chrome uses to decide installability and logs the install lifecycle
 * live, so a phone you can't attach devtools to can report its own state.
 *
 * This is a diagnostic tool, not product UI — delete the component and its
 * mount in App.tsx once the install issue is understood.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Status = "ok" | "warn" | "bad" | "info";
interface Row {
  label: string;
  value: string;
  status: Status;
}

function statusColor(status: Status): string {
  if (status === "bad") return "text-alert";
  if (status === "info") return "text-ash";
  return "text-amber"; // ok + warn both read as amber against the dark panel
}

function isDebugEnabled(): boolean {
  return new URLSearchParams(window.location.search).has("debug");
}

export function PwaDiagnostics() {
  const [enabled] = useState(isDebugEnabled);
  const [rows, setRows] = useState<Row[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [hasEvent, setHasEvent] = useState(false);
  const installEvent = useRef<BeforeInstallPromptEvent | null>(null);

  const addLog = useCallback((line: string) => {
    const stamp = new Date().toISOString().slice(11, 19);
    setLog((prev) => [...prev, `${stamp}  ${line}`]);
  }, []);

  const collect = useCallback(async () => {
    const next: Row[] = [];
    const push = (label: string, value: string, status: Status) =>
      next.push({ label, value, status });

    const secure = window.isSecureContext;
    push("Secure context (HTTPS)", secure ? "yes" : "NO", secure ? "ok" : "bad");

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    push("Display mode", standalone ? "standalone (installed)" : "browser tab", standalone ? "ok" : "info");

    push(
      "beforeinstallprompt",
      installEvent.current ? "FIRED — installable" : "not fired yet",
      installEvent.current ? "ok" : "warn"
    );

    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      push("Manifest <link>", "MISSING", "bad");
    } else {
      push("Manifest <link>", link.href, "ok");
      try {
        const res = await fetch(link.href, { cache: "no-store" });
        const type = res.headers.get("content-type") ?? "?";
        push("Manifest fetch", `${res.status} ${type}`, res.ok ? "ok" : "bad");
        if (res.ok) {
          const manifest = (await res.json()) as {
            name?: string;
            display?: string;
            icons?: { sizes?: string }[];
          };
          push("name / display", `${manifest.name ?? "?"} / ${manifest.display ?? "?"}`, "info");
          const sizes = (manifest.icons ?? []).map((i) => i.sizes ?? "").join(" ");
          const ok192 = sizes.includes("192");
          const ok512 = sizes.includes("512");
          push("icons 192 / 512", `${ok192 ? "yes" : "NO"} / ${ok512 ? "yes" : "NO"}`, ok192 && ok512 ? "ok" : "bad");
        }
      } catch (err) {
        push("Manifest fetch", `error: ${String(err)}`, "bad");
      }
    }

    if (!("serviceWorker" in navigator)) {
      push("Service worker", "UNSUPPORTED", "bad");
    } else {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          push("Service worker", "not registered", "bad");
        } else {
          const state = reg.active ? "active" : reg.installing ? "installing" : reg.waiting ? "waiting" : "unknown";
          push("Service worker", state, reg.active ? "ok" : "warn");
          push("SW scope", reg.scope, "info");
          push("SW controlling page", navigator.serviceWorker.controller ? "yes" : "no", navigator.serviceWorker.controller ? "ok" : "warn");
        }
      } catch (err) {
        push("Service worker", `error: ${String(err)}`, "bad");
      }
    }

    const related = (navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    }).getInstalledRelatedApps;
    if (typeof related === "function") {
      try {
        const apps = await related.call(navigator);
        push("Installed related apps", String(apps.length), apps.length ? "warn" : "info");
      } catch {
        /* not fatal */
      }
    }

    push("User agent", navigator.userAgent, "info");
    setRows(next);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    addLog("diagnostics mounted");
    void collect();

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      installEvent.current = event as BeforeInstallPromptEvent;
      setHasEvent(true);
      addLog("beforeinstallprompt FIRED");
      void collect();
    }
    function onInstalled() {
      addLog("appinstalled FIRED");
      void collect();
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [enabled, addLog, collect]);

  if (!enabled) return null;

  async function tryInstall() {
    if (!installEvent.current) return;
    addLog("calling prompt()…");
    await installEvent.current.prompt();
    const choice = await installEvent.current.userChoice;
    addLog(`userChoice: ${choice.outcome}`);
  }

  function copyAll() {
    const text = [
      "=== DOSSIER PWA diagnostics ===",
      ...rows.map((r) => `${r.label}: ${r.value}`),
      "--- log ---",
      ...log,
    ].join("\n");
    navigator.clipboard?.writeText(text).then(
      () => addLog("copied to clipboard"),
      () => addLog("clipboard blocked — long-press to select instead")
    );
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[60] max-h-[75vh] overflow-y-auto border-b border-amber bg-blackops/95 p-3 font-mono text-[11px] leading-relaxed text-ash backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="uppercase tracking-wider text-amber">PWA Diagnostics</span>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => void collect()} className="underline">recheck</button>
          <button onClick={copyAll} className="underline">copy</button>
          {hasEvent && <button onClick={() => void tryInstall()} className="text-amber underline">install</button>}
          <button onClick={() => setCollapsed((c) => !c)} className="underline">{collapsed ? "show" : "hide"}</button>
        </div>
      </div>

      {!collapsed && (
        <>
          <dl className="space-y-1">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2">
                <dt className="shrink-0 text-gunmetal">{row.label}:</dt>
                <dd className={cn("min-w-0 break-all", statusColor(row.status))}>{row.value}</dd>
              </div>
            ))}
          </dl>
          {log.length > 0 && (
            <div className="mt-2 space-y-0.5 border-t border-gunmetal pt-2">
              {log.map((line, i) => (
                <div key={i} className="break-all text-gunmetal">{line}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
