import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, getMonthDateRange, normalizeToMonthly } from '@/lib/finance-utils';
import { DollarSign, TrendingUp, PieChart, Plus, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [availableFunds, setAvailableFunds] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    const { start, end } = getMonthDateRange();
    
    // Load incomes
    const { data: incomes } = await supabase
      .from('incomes')
      .select('*')
      .eq('user_id', user?.id);

    const monthlyIncome = incomes?.reduce((sum, income) => 
      sum + normalizeToMonthly(income.amount, income.frequency), 0) || 0;
    
    setTotalIncome(monthlyIncome);

    // Load current month transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user?.id)
      .gte('date', start)
      .lte('date', end);

    const spent = transactions?.reduce((sum, t) => 
      t.type !== 'goal_contribution' ? sum + parseFloat(t.amount as string) : sum, 0) || 0;
    
    setTotalSpent(spent);
    setAvailableFunds(monthlyIncome - spent);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold gradient-text">FinanceTracker</h1>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Funds</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(availableFunds)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">Monthly normalized</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/transactions">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Plus className="h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Add & manage expenses</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/categories">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart className="h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Manage budget allocations</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/goals">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <CardTitle>Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendingUp className="h-8 w-8 text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Track savings goals</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}