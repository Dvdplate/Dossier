import { useEffect, useState } from "react";
import { Button } from "../ui/Button.js";

/**
 * The non-standard event Chromium fires when a PWA meets installability
 * criteria. It isn't in the DOM lib, so we type only the parts we use.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_UNTIL_KEY = "dossier:install-dismissed-until";
const DISMISS_DAYS = 7;

function isSnoozed(): boolean {
  const until = Number(localStorage.getItem(DISMISS_UNTIL_KEY));
  return until > Date.now();
}

/**
 * Surfaces a custom install affordance on Android, where Chrome offers no
 * address-bar install button (the only reliable path is catching
 * `beforeinstallprompt` and replaying it on tap). Desktop keeps its own
 * omnibox button; this banner only appears when the browser says we're
 * installable, and stays hidden once snoozed or installed.
 */
export function InstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      // Stop Chrome's auto mini-infobar; we drive the prompt ourselves.
      event.preventDefault();
      if (!isSnoozed()) setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent) return null;

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    // The event is single-use; drop it whether or not they accepted.
    setInstallEvent(null);
  }

  function snooze() {
    localStorage.setItem(
      DISMISS_UNTIL_KEY,
      String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000)
    );
    setInstallEvent(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-16 md:bottom-4 z-40 px-4 pointer-events-none">
      <div className="mx-auto max-w-md sm:max-w-lg pointer-events-auto flex items-center gap-3 rounded-md border border-gunmetal bg-blackops/95 px-4 py-3 shadow-xl backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm uppercase tracking-wider text-amber">Install DOSSIER</p>
          <p className="text-xs text-ash">Add to your home screen for offline access.</p>
        </div>
        <Button variant="ghost" onClick={snooze} aria-label="Dismiss install prompt" className="px-2">
          ✕
        </Button>
        <Button variant="primary" onClick={install}>
          Install
        </Button>
      </div>
    </div>
  );
}
