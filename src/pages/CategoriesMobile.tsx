import React, { useState, useEffect, useCallback } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FAB } from '@/components/layout/FAB';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, normalizeToMonthly, getMonthDateRange } from '@/lib/finance-utils';
import { 
  Wallet, 
  Edit, 
  Trash2, 
  TrendingUp, 
  AlertCircle,
  PiggyBank,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  allocated_percentage: number;
  display_schedule: string;
  linked_goal_id: string | null;
  is_system: boolean;
  spent?: number;
  budget?: number;
}

export default function CategoriesMobile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    allocated_percentage: 0,
    display_schedule: 'monthly',
  });
  const [totalAllocated, setTotalAllocated] = useState(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load income
      const { data: incomes } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id);
      
      const monthlyIncome = incomes?.reduce((sum, income) => {
        return sum + normalizeToMonthly(income.amount, income.frequency);
      }, 0) || 0;
      
      setTotalIncome(monthlyIncome);

      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      // Load current month spending
      const { start, end } = getMonthDateRange();
      const { data: transactions } = await supabase
        .from('transactions')
        .select('category_id, amount')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end);
      
      // Calculate spending per category
      const categoriesWithSpending = categoriesData?.map(cat => {
        const categoryTransactions = transactions?.filter(t => t.category_id === cat.id) || [];
        const spent = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const budget = cat.allocated_percentage * monthlyIncome;
        
        return {
          ...cat,
          spent,
          budget,
        };
      }) || [];
      
      setCategories(categoriesWithSpending);
      
      // Calculate total allocated
      const total = categoriesWithSpending.reduce((sum, cat) => sum + cat.allocated_percentage, 0);
      setTotalAllocated(total);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleSaveCategory = async () => {
    if (!user) return;
    
    // Validate total allocation
    const newTotal = editingCategory 
      ? totalAllocated - editingCategory.allocated_percentage + newCategory.allocated_percentage
      : totalAllocated + newCategory.allocated_percentage;
    
    if (newTotal > 1) {
      toast({
        title: "Invalid allocation",
        description: "Total category allocation cannot exceed 100%",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const categoryData = {
        user_id: user.id,
        name: newCategory.name,
        allocated_percentage: newCategory.allocated_percentage,
        display_schedule: newCategory.display_schedule,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        
        toast({
          title: "Category updated",
          description: "Your category has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);
        
        if (error) throw error;
        
        toast({
          title: "Category created",
          description: "Your new category has been created",
        });
      }

      setIsAddModalOpen(false);
      setEditingCategory(null);
      setNewCategory({
        name: '',
        allocated_percentage: 0,
        display_schedule: 'monthly',
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if category has transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('category_id', id)
      .limit(1);
    
    if (transactions && transactions.length > 0) {
      toast({
        title: "Cannot delete",
        description: "This category has transactions. Please reassign them first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Category deleted",
        description: "Your category has been deleted",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: Category) => {
    if (category.is_system) {
      toast({
        title: "System category",
        description: "System-managed categories cannot be edited",
        variant: "destructive",
      });
      return;
    }
    
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      allocated_percentage: category.allocated_percentage,
      display_schedule: category.display_schedule,
    });
    setIsAddModalOpen(true);
  };

  const remainingPercentage = 1 - totalAllocated;
  const isOverBudget = totalAllocated > 1;

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur md:border-b-1 md:border-gray-200 md:top-16 supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-3">Categories</h1>
            
            {/* Allocation Summary */}
            <Card className={cn(
              "mb-3",
              isOverBudget && "border-danger"
            )}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Total Allocated</span>
                  <span className={cn(
                    "text-sm font-bold",
                    isOverBudget ? "text-danger" : "text-foreground"
                  )}>
                    {formatCurrency(totalIncome * totalAllocated)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(totalAllocated * 100, 100)} 
                  className={cn(
                    "h-3",
                    isOverBudget && "[&>div]:bg-danger"
                  )}
                />
                {!isOverBudget && remainingPercentage > 0 && (
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatCurrency(totalIncome -  (totalIncome * totalAllocated))} ({Math.round(remainingPercentage * 100)}%) available
                    </p>
                    <span className={cn(
                      "text-sm font-bold",
                      isOverBudget ? "text-danger" : "text-foreground"
                    )}>
                      {Math.round(totalAllocated * 100)}%
                    </span>
                  </div>
                  
                )}
                {isOverBudget && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Categories exceed 100%. Adjust percentages to continue.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No categories yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first budget category
                </p>
              </CardContent>
            </Card>
          ) : (
            categories.map(category => {
              const spentPercentage = category.budget && category.budget > 0
                ? (category.spent! / category.budget) * 100
                : 0;
              const isOverSpent = category.spent! > category.budget!;
              
              return (
                <Card key={category.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {category.name}
                          {category.is_system && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              System
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(category.allocated_percentage * 100)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {category.display_schedule}
                          </Badge>
                        </div>
                      </div>
                      
                      {!category.is_system && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-danger hover:text-danger"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Spent: {formatCurrency(category.spent || 0)}
                        </span>
                        <span className={cn(
                          "font-medium",
                          isOverSpent ? "text-danger" : "text-muted-foreground"
                        )}>
                          of {formatCurrency(category.budget || 0)}
                        </span>
                      </div>
                      
                      <Progress 
                        value={Math.min(spentPercentage, 100)} 
                        className={cn(
                          "h-2",
                          isOverSpent && "[&>div]:bg-danger"
                        )}
                      />
                      
                      {category.budget! > category.spent! && (
                        <p className="text-xs text-success">
                          {formatCurrency(category.budget! - category.spent!)} remaining
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* FAB */}
        <FAB onClick={() => {
          setEditingCategory(null);
          setNewCategory({
            name: '',
            allocated_percentage: 0,
            display_schedule: 'monthly',
          });
          setIsAddModalOpen(true);
        }} />

        {/* Add/Edit Category Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Groceries"
                />
              </div>
              
              <div>
                <Label htmlFor="percentage">
                  Budget Allocation: {Math.round(newCategory.allocated_percentage * 100)}%
                </Label>
                <Slider
                  id="percentage"
                  min={0}
                  max={100}
                  step={1}
                  value={[newCategory.allocated_percentage * 100]}
                  onValueChange={([value]) => 
                    setNewCategory({ ...newCategory, allocated_percentage: value / 100 })
                  }
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Monthly budget: {formatCurrency(totalIncome * newCategory.allocated_percentage)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="schedule">Display Schedule</Label>
                <Select 
                  value={newCategory.display_schedule} 
                  onValueChange={(value) => setNewCategory({ ...newCategory, display_schedule: value })}
                >
                  <SelectTrigger id="schedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleSaveCategory} 
                className="w-full"
                disabled={!newCategory.name || newCategory.allocated_percentage === 0}
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}