import { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";
import { BottomNav } from "./components/nav/BottomNav.js";
import { AuthGate } from "./components/auth/AuthGate.js";
import { ToastProvider } from "./components/ui/Toaster.js";

const Briefing = lazy(() => import("./routes/Briefing.js"));
const Orders = lazy(() => import("./routes/Orders.js"));
const BlackBook = lazy(() => import("./routes/BlackBook.js"));
const Log = lazy(() => import("./routes/Log.js"));

function LoadingFallback() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthGate>
        <main className="w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto relative min-h-screen bg-blackops shadow-2xl">
          <Suspense fallback={<LoadingFallback />}>
            <Switch>
              <Route path="/" component={Briefing} />
              <Route path="/orders" component={Orders} />
              <Route path="/blackbook" component={BlackBook} />
              <Route path="/log" component={Log} />
              <Route>
                <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8 text-center text-ash">
                  <h2 className="font-mono text-amber tracking-widest uppercase mb-4 text-xl">404 - Invalid Sector</h2>
                  <p>Signal lost. Return to briefing.</p>
                </div>
              </Route>
            </Switch>
          </Suspense>
          <BottomNav />
        </main>
      </AuthGate>
    </ToastProvider>
  );
}
