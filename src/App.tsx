import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

// Lazy load all page components
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Categories = lazy(() => import("./pages/Categories"));
const Goals = lazy(() => import("./pages/Goals"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Incomes = lazy(() => import("./pages/Incomes"));
const PendingActions = lazy(() => import("./pages/PendingActions"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

const App = () => {
  const [hasIncomes, setHasIncomes] = useState<boolean | null>(null);

  useEffect(() => {
    checkUserIncomes();
  }, []);

  const checkUserIncomes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: incomes } = await supabase
        .from('incomes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      setHasIncomes(incomes && incomes.length > 0);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={
              <Suspense fallback={<DashboardSkeleton />}>
                <Auth />
              </Suspense>
            } />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Suspense fallback={<DashboardSkeleton />}>
                  <Onboarding />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={
                hasIncomes === false ? <Navigate to="/onboarding" /> : (
                  <Suspense fallback={<DashboardSkeleton />}>
                    <Dashboard />
                  </Suspense>
                )
              } />
              <Route path="/transactions" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Transactions />
                </Suspense>
              } />
              <Route path="/categories" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Categories />
                </Suspense>
              } />
              <Route path="/goals" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Goals />
                </Suspense>
              } />
              <Route path="/subscriptions" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Subscriptions />
                </Suspense>
              } />
              <Route path="/incomes" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Incomes />
                </Suspense>
              } />
              <Route path="/pending" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <PendingActions />
                </Suspense>
              } />
              <Route path="/settings" element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Settings />
                </Suspense>
              } />
            </Route>
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="text-xl text-muted-foreground">Page not found</p>
                  <a href="/" className="text-primary hover:underline">Return to Home</a>
                </div>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
