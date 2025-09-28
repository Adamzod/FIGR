import React, { useState, useEffect, useCallback } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FAB } from '@/components/layout/FAB';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, getMonthDateRange } from '@/lib/finance-utils';
import { Search, Calendar, Filter, Receipt, TrendingDown, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  category_id: string | null;
  type: string | null;
  note: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function TransactionsMobile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Array<{ id: string; goal_name: string }>>([]);
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('month');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    name: '',
    amount: '',
    category_id: 'none',
    goal_id: 'none',
    subscription_id: 'none',
    date: new Date().toISOString().split('T')[0],
    note: '',
    type: 'expense',
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);
      
      setCategories(categoriesData || []);

      // Load goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, goal_name')
        .eq('user_id', user.id)
        .eq('is_completed', false);
      
      setGoals(goalsData || []);

      // Load subscriptions
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('id, name')
        .eq('user_id', user.id);
      
      setSubscriptions(subscriptionsData || []);

      // Load transactions based on date filter
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (dateFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte('date', oneWeekAgo.toISOString().split('T')[0]);
      } else if (dateFilter === 'month') {
        const { start, end } = getMonthDateRange();
        query = query.gte('date', start).lte('date', end);
      }

      const { data: transactionsData } = await query;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateFilter, loadData]);

  const handleAddTransaction = async () => {
    if (!user) return;
    
    try {
      const transactionData = {
        user_id: user.id,
        name: newTransaction.name,
        amount: parseFloat(newTransaction.amount),
        category_id: newTransaction.category_id === 'none' ? null : newTransaction.category_id,
        date: newTransaction.date,
        note: newTransaction.note || null,
        type: newTransaction.type === 'expense' ? null : newTransaction.type,
        // TODO: Add goal_id and subscription_id once database migration is applied
        // goal_id: newTransaction.goal_id === 'none' ? null : newTransaction.goal_id,
        // subscription_id: newTransaction.subscription_id === 'none' ? null : newTransaction.subscription_id,
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);
        
        if (error) throw error;
        
        toast({
          title: "Transaction updated",
          description: "Your transaction has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert(transactionData);
        
        if (error) throw error;
        
        toast({
          title: "Transaction added",
          description: "Your transaction has been added successfully",
        });
      }

      setIsAddModalOpen(false);
      setEditingTransaction(null);
      setNewTransaction({
        name: '',
        amount: '',
        category_id: 'none',
        goal_id: 'none',
        subscription_id: 'none',
        date: new Date().toISOString().split('T')[0],
        note: '',
        type: 'expense',
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Transaction deleted",
        description: "Your transaction has been deleted",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      name: transaction.name,
      amount: transaction.amount.toString(),
      category_id: transaction.category_id || 'none',
      goal_id: (transaction as any).goal_id || 'none',
      subscription_id: (transaction as any).subscription_id || 'none',
      date: transaction.date,
      note: transaction.note || '',
      type: transaction.type || 'expense',
    });
    setIsAddModalOpen(true);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.note?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 md:top-16 bg-background/95 backdrop-blur md:rounded-md md:border-b-2 md:border-gray-200 supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-3">Transactions</h1>
            
            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Tabs value={dateFilter} onValueChange={(v: 'week' | 'month' | 'all') => setDateFilter(v)} className="flex-1">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          {filteredTransactions.length > 0 && (
            <div className="px-4 pb-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {filteredTransactions.length} transactions
              </span>
              <span className="font-semibold">
                Total: {formatCurrency(totalAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Transactions List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            ) : Object.keys(groupedTransactions).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No transactions found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Add your first transaction'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
                <div key={date} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {formatDate(date)}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(dayTransactions.reduce((sum, t) => sum + t.amount, 0))}
                    </span>
                  </div>
                  
                  {dayTransactions.map(transaction => (
                    <Card key={transaction.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{transaction.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {getCategoryName(transaction.category_id)}
                              </Badge>
                              {transaction.type === 'goal_contribution' && (
                                <Badge variant="default" className="text-xs">
                                  Goal
                                </Badge>
                              )}
                            </div>
                            {transaction.note && (
                              <p className="text-sm text-muted-foreground mt-2">{transaction.note}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-bold text-lg",
                              transaction.type === 'goal_contribution' ? "text-success" : "text-foreground"
                            )}>
                              {formatCurrency(transaction.amount)}
                            </span>
                            
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEditTransaction(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-danger hover:text-danger"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* FAB */}
        <FAB onClick={() => {
          setEditingTransaction(null);
          setNewTransaction({
            name: '',
            amount: '',
            category_id: 'none',
            goal_id: 'none',
            subscription_id: 'none',
            date: new Date().toISOString().split('T')[0],
            note: '',
            type: 'expense',
          });
          setIsAddModalOpen(true);
        }} />

        {/* Add/Edit Transaction Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newTransaction.name}
                  onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                  placeholder="e.g., Grocery shopping"
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
                <Label htmlFor="type">Transaction Type</Label>
                <Select 
                  value={newTransaction.type} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="goal_contribution">Goal Contribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic selector based on transaction type */}
              {newTransaction.type === 'expense' && (
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
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newTransaction.type === 'goal_contribution' && (
                <div>
                  <Label htmlFor="goal">Goal</Label>
                  <Select 
                    value={newTransaction.goal_id} 
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, goal_id: value })}
                  >
                    <SelectTrigger id="goal">
                      <SelectValue placeholder="Select a goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No goal</SelectItem>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.goal_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newTransaction.type === 'subscription' && (
                <div>
                  <Label htmlFor="subscription">Subscription</Label>
                  <Select 
                    value={newTransaction.subscription_id} 
                    onValueChange={(value) => setNewTransaction({ ...newTransaction, subscription_id: value })}
                  >
                    <SelectTrigger id="subscription">
                      <SelectValue placeholder="Select a subscription" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No subscription</SelectItem>
                      {subscriptions.map((subscription) => (
                        <SelectItem key={subscription.id} value={subscription.id}>
                          {subscription.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  value={newTransaction.note}
                  onChange={(e) => setNewTransaction({ ...newTransaction, note: e.target.value })}
                  placeholder="Add a note..."
                />
              </div>
              
              <Button 
                onClick={handleAddTransaction} 
                className="w-full"
                disabled={!newTransaction.name || !newTransaction.amount}
              >
                {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}