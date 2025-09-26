import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FAB } from '@/components/layout/FAB';
import { EnhancedDashboard } from '@/components/dashboard/EnhancedDashboard';
import { useAuth } from '@/hooks/useAuth';
import ReconciliationModal from '@/components/ReconciliationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { normalizeToMonthly, getMonthDateRange } from '@/lib/finance-utils';
import { Plus, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  allocated_percentage: number;
  spent: number;
  budget: number;
  is_system?: boolean;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  next_due_date: string;
  billing_cycle: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [availableFunds, setAvailableFunds] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [currentMonthRollover, setCurrentMonthRollover] = useState(0);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    name: '',
    amount: '',
    category_id: 'none',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      checkUserIncomes();
      loadDashboardData();
      checkForRollover();
    }
  }, [user]);

  const checkUserIncomes = async () => {
    if (!user) return;
    
    const { data: incomes } = await supabase
      .from('incomes')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (!incomes || incomes.length === 0) {
      navigate('/onboarding');
    }
  };

  const checkForRollover = async () => {
    if (!user) return;
    
    try {
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0];
      
      const { data: rollover } = await supabase
        .from('rollovers')
        .select('amount')
        .eq('user_id', user.id)
        .eq('month_start', monthStart)
        .maybeSingle();
      
      if (rollover) {
        setCurrentMonthRollover(Number(rollover.amount));
      }
    } catch (error) {
      console.error('Error checking rollover:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { start, end } = getMonthDateRange();
      
      // Load income data
      const { data: incomes } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id);
      
      const monthlyIncome = incomes?.reduce((sum, income) => {
        return sum + normalizeToMonthly(income.amount, income.frequency);
      }, 0) || 0;
      
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      // Load transactions for the current month
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .lte('date', new Date().toISOString().split('T')[0]); // Exclude future-dated transactions
      
      // Calculate spent amount per category
      const categoriesWithSpending = categoriesData?.map(cat => {
        const categoryTransactions = transactions?.filter(t => t.category_id === cat.id) || [];
        const spent = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const budget = (cat.allocated_percentage) * monthlyIncome;
        
        return {
          ...cat,
          spent,
          budget,
        };
      }) || [];
      
      // Load subscriptions
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_due_date');
      
      // Calculate total spent (excluding future transactions and goal contributions)
      const totalSpentAmount = transactions
        ?.filter(t => t.type !== 'goal_contribution')
        ?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const available = monthlyIncome - totalSpentAmount;
      
      setTotalIncome(monthlyIncome);
      setTotalSpent(totalSpentAmount);
      setAvailableFunds(available);
      setCategories(categoriesWithSpending);
      setSubscriptions(subscriptionsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: newTransaction.name,
          amount: parseFloat(newTransaction.amount),
          category_id: newTransaction.category_id === 'none' ? null : newTransaction.category_id,
          date: newTransaction.date,
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      
      setIsTransactionModalOpen(false);
      setNewTransaction({
        name: '',
        amount: '',
        category_id: 'none',
        date: new Date().toISOString().split('T')[0],
      });
      loadDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 md:top-16  z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:rounded-md border-b-2 border-gray-200">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Welcome back</p>
                <h1 className="text-sm font-bold">
                  {user?.user_metadata?.full_name || user?.email || "User"}
                </h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/transactions')}
              >
                View All
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          <EnhancedDashboard
            user={user}
            availableFunds={availableFunds}
            totalIncome={totalIncome}
            totalSpent={totalSpent}
            categories={categories}
            currentMonthRollover={currentMonthRollover}
          />
        </div>

        {/* Reconciliation Modal */}
        <ReconciliationModal />

        {/* FAB */}
        <FAB onClick={() => setIsTransactionModalOpen(true)} />

        {/* Add Transaction Modal */}
        <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newTransaction.name}
                  onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                  placeholder="e.g., Coffee"
                />
              </div>
              
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newTransaction.category_id} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.filter(cat => !cat.is_system).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
              </div>
              
              <Button 
                onClick={handleAddTransaction} 
                className="w-full"
                disabled={!newTransaction.name || !newTransaction.amount}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}