import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Goals from "./pages/Goals";
import ProtectedRoute from "./components/ProtectedRoute";

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
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            {/* Placeholder routes for future pages */}
            <Route path="/transactions" element={
              <ProtectedRoute>
                <div className="min-h-screen p-8 text-center">
                  <h1 className="text-2xl font-bold">Transactions Page (Coming Soon)</h1>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <div className="min-h-screen p-8 text-center">
                  <h1 className="text-2xl font-bold">Categories Page (Coming Soon)</h1>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/goals" element={
              <ProtectedRoute>
                <div className="min-h-screen p-8 text-center">
                  <h1 className="text-2xl font-bold">Goals Page (Coming Soon)</h1>
                </div>
              </ProtectedRoute>
            } />
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
