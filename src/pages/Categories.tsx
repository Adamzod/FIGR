import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, PieChart, AlertCircle } from 'lucide-react';

export default function Categories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [displaySchedule, setDisplaySchedule] = useState('monthly');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*, goals(goal_name)')
      .eq('user_id', user?.id)
      .order('name');
    
    setCategories(categoriesData || []);

    // Load goals for linking
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_completed', false);
    
    setGoals(goalsData || []);
    setLoading(false);
  };

  const totalPercentage = categories.reduce((sum, cat) => 
    sum + (cat.allocated_percentage * 100), 0
  );

  const handleSubmit = async () => {
    if (!categoryName || !percentage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newPercentage = parseFloat(percentage) / 100;
    const projectedTotal = editingId 
      ? totalPercentage - (categories.find(c => c.id === editingId)?.allocated_percentage * 100 || 0) + parseFloat(percentage)
      : totalPercentage + parseFloat(percentage);

    if (projectedTotal > 100) {
      toast({
        title: "Invalid Allocation",
        description: `Total would be ${projectedTotal.toFixed(1)}%. Maximum is 100%.`,
        variant: "destructive",
      });
      return;
    }

    const categoryData = {
      user_id: user?.id,
      name: categoryName,
      allocated_percentage: newPercentage,
      display_schedule: displaySchedule,
      linked_goal_id: linkedGoalId || null,
      is_system: false,
    };

    if (editingId) {
      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Category updated successfully" });
        resetForm();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert(categoryData);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Category added successfully" });
        resetForm();
        loadData();
      }
    }
  };

  const handleEdit = (category: any) => {
    setCategoryName(category.name);
    setPercentage((category.allocated_percentage * 100).toString());
    setDisplaySchedule(category.display_schedule);
    setLinkedGoalId(category.linked_goal_id || '');
    setEditingId(category.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Check if category has transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (transactions && transactions.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "This category has transactions. Please re-categorize them first.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Category deleted successfully" });
      loadData();
    }
  };

  const resetForm = () => {
    setCategoryName('');
    setPercentage('');
    setDisplaySchedule('monthly');
    setLinkedGoalId('');
    setEditingId(null);
    setIsDialogOpen(false);
  };

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
              <h1 className="text-2xl font-bold">Budget Categories</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="e.g., Housing, Food, Entertainment"
                    />
                  </div>
                  <div>
                    <Label htmlFor="percentage">Allocated Percentage</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={percentage}
                        onChange={(e) => setPercentage(e.target.value)}
                        placeholder="0"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="schedule">Display Schedule</Label>
                    <Select value={displaySchedule} onValueChange={setDisplaySchedule}>
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
                  <div>
                    <Label htmlFor="goal">Link to Goal (Optional)</Label>
                    <Select value={linkedGoalId} onValueChange={setLinkedGoalId}>
                      <SelectTrigger id="goal">
                        <SelectValue placeholder="No linked goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No linked goal</SelectItem>
                        {goals.map(goal => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.goal_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingId ? 'Update Category' : 'Add Category'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Allocation Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Budget Allocation
            </CardTitle>
            <CardDescription>
              Track how your budget is distributed across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress 
                value={totalPercentage} 
                className={totalPercentage > 100 ? 'bg-danger/20' : ''}
              />
              <div className="flex justify-between text-sm">
                <span className={totalPercentage > 100 ? 'text-danger' : 'text-muted-foreground'}>
                  Total Allocated: {totalPercentage.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">
                  Remaining: {Math.max(0, 100 - totalPercentage).toFixed(1)}%
                </span>
              </div>
              {totalPercentage > 100 && (
                <div className="flex items-center gap-2 text-danger text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Your categories exceed 100%. Please adjust percentages.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">Loading categories...</div>
              </CardContent>
            </Card>
          ) : categories.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No categories yet. Add your first category to get started!</p>
              </CardContent>
            </Card>
          ) : (
            categories.map(category => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {category.name}
                        {category.is_system && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded">System</span>
                        )}
                      </CardTitle>
                      {category.goals && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Linked to: {category.goals.goal_name}
                        </p>
                      )}
                    </div>
                    {!category.is_system && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        {(category.allocated_percentage * 100).toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {category.display_schedule}
                      </span>
                    </div>
                    <Progress value={category.allocated_percentage * 100} />
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