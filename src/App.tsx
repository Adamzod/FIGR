import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Goals from "./pages/Goals";
import Subscriptions from "./pages/Subscriptions";
import Incomes from "./pages/Incomes";
import PendingActions from "./pages/PendingActions";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={
                hasIncomes === false ? <Navigate to="/onboarding" /> : <Dashboard />
              } />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/incomes" element={<Incomes />} />
              <Route path="/pending" element={<PendingActions />} />
              <Route path="/settings" element={<Settings />} />
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
