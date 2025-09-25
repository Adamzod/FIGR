import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FAB } from '@/components/layout/FAB';
import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { CategoryList } from '@/components/dashboard/CategoryList';
import { SubscriptionsList } from '@/components/dashboard/SubscriptionsList';
import { ReconciliationModal } from '@/components/ReconciliationModal';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { getMonthDateRange, normalizeToMonthly } from '@/lib/finance-utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
  allocated_percentage: number;
  spent: number;
  budget: number;
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
  const [loading, setLoading] = useState(true);
  const [availableFunds, setAvailableFunds] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    name: '',
    amount: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
      checkUserIncomes();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
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
        .eq('user_id', user.id);
      
      // Load transactions for the current month
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end);
      
      // Calculate spent amount per category
      const categoriesWithSpending = categoriesData?.map(cat => {
        const categoryTransactions = transactions?.filter(t => t.category_id === cat.id) || [];
        const spent = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const budget = (cat.allocated_percentage / 100) * monthlyIncome;
        
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
        .eq('user_id', user.id);
      
      const totalSpentAmount = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const available = monthlyIncome - totalSpentAmount;
      
      setTotalIncome(monthlyIncome);
      setTotalSpent(totalSpentAmount);
      setAvailableFunds(available);
      setCategories(categoriesWithSpending);
      setSubscriptions(subscriptionsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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
          category_id: newTransaction.category_id || null,
          date: newTransaction.date,
        });
      
      if (error) throw error;
      
      toast.success('Transaction added successfully');
      setIsTransactionModalOpen(false);
      setNewTransaction({
        name: '',
        amount: '',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadDashboardData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-xl font-semibold">{user?.email?.split('@')[0]}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/onboarding')}
            >
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-4 pb-20">
        {/* Budget Overview Card */}
        <BudgetCard
          availableFunds={availableFunds}
          totalIncome={totalIncome}
          totalSpent={totalSpent}
        />
        
        {/* Categories List */}
        <CategoryList
          categories={categories}
          totalIncome={totalIncome}
        />
        
        {/* Subscriptions */}
        <SubscriptionsList subscriptions={subscriptions} />
      </div>

      {/* Floating Action Button */}
      <FAB onClick={() => setIsTransactionModalOpen(true)} />

      {/* Add Transaction Modal */}
      <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Record a new expense or income transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Transaction Name</Label>
              <Input
                id="name"
                placeholder="e.g., Grocery shopping"
                value={newTransaction.name}
                onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTransaction.category_id}
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsTransactionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTransaction}
              disabled={!newTransaction.name || !newTransaction.amount}
            >
              Add Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reconciliation Modal */}
      <ReconciliationModal />
    </>
  );
}