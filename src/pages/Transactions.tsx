import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate, getMonthDateRange } from '@/lib/finance-utils';
import { ArrowLeft, Plus, Search, Filter, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function Transactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateFilter, setDateFilter] = useState('current-month');
  
  // Form state
  const [transactionName, setTransactionName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateFilter]);

  const loadData = async () => {
    setLoading(true);
    
    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_system', false)
      .order('name');
    
    setCategories(categoriesData || []);

    // Load transactions based on date filter
    let query = supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', user?.id)
      .order('date', { ascending: false });

    if (dateFilter === 'current-month') {
      const { start, end } = getMonthDateRange();
      query = query.gte('date', start).lte('date', end);
    } else if (dateFilter === 'last-30-days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
    }

    const { data: transactionsData } = await query;
    setTransactions(transactionsData || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!transactionName || !amount || !date || !categoryId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const transactionData = {
      user_id: user?.id,
      name: transactionName,
      amount: parseFloat(amount),
      date,
      category_id: categoryId,
      note: note || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', editingId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Transaction updated successfully" });
        resetForm();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Transaction added successfully" });
        
        // Ask about round-up for goals
        const roundUpAmount = Math.ceil(parseFloat(amount)) - parseFloat(amount);
        if (roundUpAmount > 0) {
          // Could implement round-up feature here
        }
        
        resetForm();
        loadData();
      }
    }
  };

  const handleEdit = (transaction: any) => {
    setTransactionName(transaction.name);
    setAmount(transaction.amount);
    setDate(transaction.date);
    setCategoryId(transaction.category_id);
    setNote(transaction.note || '');
    setEditingId(transaction.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Transaction deleted successfully" });
      loadData();
    }
  };

  const resetForm = () => {
    setTransactionName('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategoryId('');
    setNote('');
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || t.category_id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Transactions</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Transaction' : 'Add New Transaction'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Transaction Name</Label>
                    <Input
                      id="name"
                      value={transactionName}
                      onChange={(e) => setTransactionName(e.target.value)}
                      placeholder="e.g., Groceries, Rent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="note">Note (Optional)</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add any additional details"
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingId ? 'Update Transaction' : 'Add Transaction'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
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
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-2">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">Loading transactions...</div>
              </CardContent>
            </Card>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No transactions found</p>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map(transaction => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{transaction.name}</h3>
                        {transaction.categories && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {transaction.categories.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.date)}
                        </span>
                        {transaction.note && (
                          <span className="italic">{transaction.note}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">
                        {formatCurrency(parseFloat(transaction.amount))}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}