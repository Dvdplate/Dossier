import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { BottomNav } from "./components/nav/BottomNav.js";
import { SideNav } from "./components/nav/SideNav.js";
import { AuthGate } from "./components/auth/AuthGate.js";
import { ToastProvider } from "./components/ui/Toaster.js";

const Briefing = lazy(() => import("./routes/Briefing.js"));
const Orders = lazy(() => import("./routes/Orders.js"));
const BlackBook = lazy(() => import("./routes/BlackBook.js"));
const Log = lazy(() => import("./routes/Log.js"));

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthGate>
        {/* Mobile: stacked column + bottom nav. Desktop: sidebar rail + full-width content. */}
        <div className="flex min-h-screen bg-blackops">
          <SideNav />
          <main className="flex-1 min-w-0 relative">
            {/* Mobile: narrow centered column with bottom-nav clearance. Desktop: full width, no extra padding. */}
            <div className="w-full max-w-md sm:max-w-lg mx-auto pb-16 md:max-w-none md:pb-0">
              <Suspense fallback={<LoadingFallback />}>
                <Switch>
                  <Route path="/" component={Briefing} />
                  <Route path="/orders" component={Orders} />
                  <Route path="/blackbook" component={BlackBook} />
                  <Route path="/log" component={Log} />
                  <Route>
                    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center text-ash">
                      <h2 className="font-mono text-amber tracking-widest uppercase mb-4 text-xl">404 - Invalid Sector</h2>
                      <p>Signal lost. Return to briefing.</p>
                    </div>
                  </Route>
                </Switch>
              </Suspense>
            </div>
          </main>
          <BottomNav />
        </div>
      </AuthGate>
    </ToastProvider>
  );
}
