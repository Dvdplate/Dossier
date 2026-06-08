import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App.js";
import { queryClient } from "./lib/queryClient.js";
import "./index.css";

const CHUNK_RELOAD_KEY = "chunk-reload-attempted";

function isChunkLoadError(message: string): boolean {
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Loading chunk") ||
    message.includes("Importing a module script failed") ||
    message.includes("error loading dynamically imported module")
  );
}

function handleChunkLoadFailure() {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  location.reload();
}

window.addEventListener("error", (event) => {
  if (isChunkLoadError(event.message)) {
    handleChunkLoadFailure();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message =
    reason instanceof Error ? reason.message : String(reason ?? "");
  if (isChunkLoadError(message)) {
    handleChunkLoadFailure();
  }
});

// Remove splash screen immediately before React mounts
const splash = document.getElementById("splash");
if (splash) splash.remove();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    let reloadedForUpdate = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadedForUpdate) return;
      reloadedForUpdate = true;
      location.reload();
    });

    navigator.serviceWorker.register(`/sw.js?v=${__BUILD_ID__}`).catch((err) => {
      console.warn("SW registration failed: ", err);
    });
  });
}
