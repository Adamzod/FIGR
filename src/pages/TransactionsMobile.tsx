import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FAB } from '@/components/layout/FAB';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MobileTransactionModal } from '@/components/mobile/MobileTransactionModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TransactionSkeleton } from '@/components/ui/skeletons';
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
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateFilter]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      setCategories(categoriesData || []);

      // Load transactions based on date filter
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (dateFilter === 'month') {
        const { start, end } = getMonthDateRange();
        query = query.gte('date', start).lte('date', end);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('date', weekAgo.toISOString().split('T')[0]);
      }

      const { data: transactionsData } = await query;
      setTransactions(transactionsData || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (transaction: typeof newTransaction) => {
    if (!user) return;
    
    try {
      const transactionData = {
        user_id: user.id,
        name: transaction.name,
        amount: parseFloat(transaction.amount),
        category_id: transaction.category_id === 'none' ? null : transaction.category_id,
        date: transaction.date,
        note: transaction.note || null,
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
        date: new Date().toISOString().split('T')[0],
        note: '',
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
      date: transaction.date,
      note: transaction.note || '',
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

                <Tabs value={dateFilter} onValueChange={(v) => setDateFilter(v as any)} className="flex-1">
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
              <TransactionSkeleton />
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
            date: new Date().toISOString().split('T')[0],
            note: '',
          });
          setIsAddModalOpen(true);
        }} />

        {/* Add/Edit Transaction Modal */}
        <MobileTransactionModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          transaction={newTransaction}
          categories={categories}
          onSave={handleAddTransaction}
          isEditing={!!editingTransaction}
        />
      </div>
    </MobileLayout>
  );
}