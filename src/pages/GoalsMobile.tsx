import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FAB } from '@/components/layout/FAB';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { 
  Target, 
  TrendingUp, 
  Calendar,
  DollarSign,
  CheckCircle2,
  Edit,
  Trash2,
  Plus,
  PiggyBank,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
}

interface GoalSchedule {
  id: string;
  goal_id: string;
  amount: number;
  day_of_month: number;
}

export default function GoalsMobile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalSchedules, setGoalSchedules] = useState<GoalSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [enableRoundUp, setEnableRoundUp] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    target_amount: '',
    target_date: '',
  });
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setGoals(goalsData || []);

      // Load goal schedules
      const { data: schedulesData } = await supabase
        .from('goal_schedules')
        .select('*')
        .eq('user_id', user.id);
      
      setGoalSchedules(schedulesData || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to load goals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    
    try {
      const goalData = {
        user_id: user.id,
        goal_name: newGoal.goal_name,
        target_amount: parseFloat(newGoal.target_amount),
        target_date: newGoal.target_date || null,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoal.id);
        
        if (error) throw error;
        
        toast({
          title: "Goal updated",
          description: "Your goal has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('goals')
          .insert(goalData);
        
        if (error) throw error;
        
        toast({
          title: "Goal created",
          description: "Your new savings goal has been created",
        });
      }

      setIsAddModalOpen(false);
      setEditingGoal(null);
      setNewGoal({
        goal_name: '',
        target_amount: '',
        target_date: '',
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save goal",
        variant: "destructive",
      });
    }
  };

  const handleContribute = async () => {
    if (!user || !selectedGoal) return;
    
    try {
      // Create contribution transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: `Contribution to ${selectedGoal.goal_name}`,
          amount: parseFloat(contributionAmount),
          date: new Date().toISOString().split('T')[0],
          type: 'goal_contribution',
        });
      
      if (transactionError) throw transactionError;

      // Update goal amount
      const newAmount = selectedGoal.current_amount + parseFloat(contributionAmount);
      const isCompleted = newAmount >= selectedGoal.target_amount;
      
      const { error: goalError } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted,
        })
        .eq('id', selectedGoal.id);
      
      if (goalError) throw goalError;
      
      toast({
        title: "Contribution successful",
        description: `Added ${formatCurrency(parseFloat(contributionAmount))} to ${selectedGoal.goal_name}`,
      });
      
      setIsContributeModalOpen(false);
      setContributionAmount('');
      setSelectedGoal(null);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to make contribution",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      // Delete associated schedules first
      await supabase
        .from('goal_schedules')
        .delete()
        .eq('goal_id', id);
      
      // Delete the goal
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Goal deleted",
        description: "Your goal has been deleted",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoal({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount.toString(),
      target_date: goal.target_date || '',
    });
    setIsAddModalOpen(true);
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);
  const displayGoals = activeTab === 'active' ? activeGoals : completedGoals;

  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 md:border-b-1 backdrop-blur md:border-gray-200 md:top-16 supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-3">Savings Goals</h1>
            
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-success/10 to-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Saved</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(totalSaved)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Target</p>
                    <p className="text-xl font-bold">{formatCurrency(totalTarget)}</p>
                  </div>
                </div>
                {totalTarget > 0 && (
                  <Progress 
                    value={(totalSaved / totalTarget) * 100} 
                    className="h-2 mt-3"
                  />
                )}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Active ({activeGoals.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedGoals.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Goals List */}
        <div className="flex-1 p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading goals...</p>
            </div>
          ) : displayGoals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {activeTab === 'active' 
                    ? "No active goals yet" 
                    : "No completed goals yet"}
                </p>
                {activeTab === 'active' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first savings goal
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            displayGoals.map(goal => {
              const progress = goal.target_amount > 0 
                ? (goal.current_amount / goal.target_amount) * 100
                : 0;
              const schedule = goalSchedules.find(s => s.goal_id === goal.id);
              
              return (
                <Card key={goal.id} className={cn(
                  "overflow-hidden",
                  goal.is_completed && "bg-success/5 border-success/20"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {goal.goal_name}
                          {goal.is_completed && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </CardTitle>
                        {goal.target_date && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Target: {formatDate(goal.target_date)}
                            </span>
                          </div>
                        )}
                        {schedule && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Auto: {formatCurrency(schedule.amount)}/month
                          </Badge>
                        )}
                      </div>
                      
                      {!goal.is_completed && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-danger hover:text-danger"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {formatCurrency(goal.current_amount)}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(goal.target_amount)}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(progress, 100)} 
                          className={cn(
                            "h-3",
                            goal.is_completed && "[&>div]:bg-success"
                          )}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(progress)}% complete
                        </p>
                      </div>
                      
                      {!goal.is_completed && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setIsContributeModalOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Contribute
                        </Button>
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
          setEditingGoal(null);
          setNewGoal({
            goal_name: '',
            target_amount: '',
            target_date: '',
          });
          setIsAddModalOpen(true);
        }} />

        {/* Add/Edit Goal Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Goal' : 'Create Savings Goal'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={newGoal.goal_name}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })}
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              
              <div>
                <Label htmlFor="target">Target Amount</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  value={newGoal.target_amount}
                  onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="date">Target Date (optional)</Label>
                <Input
                  id="date"
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="roundup">Enable Round-ups</Label>
                <Switch 
                  id="roundup"
                  checked={enableRoundUp}
                  onCheckedChange={setEnableRoundUp}
                />
              </div>
              
              <Button 
                onClick={handleSaveGoal} 
                className="w-full"
                disabled={!newGoal.goal_name || !newGoal.target_amount}
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contribute Modal */}
        <Dialog open={isContributeModalOpen} onOpenChange={setIsContributeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contribute to {selectedGoal?.goal_name}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="contribution">Amount</Label>
                <Input
                  id="contribution"
                  type="number"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="0.00"
                />
                {selectedGoal && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Remaining: {formatCurrency(selectedGoal.target_amount - selectedGoal.current_amount)}
                  </p>
                )}
              </div>
              
              <Button 
                onClick={handleContribute} 
                className="w-full"
                disabled={!contributionAmount || parseFloat(contributionAmount) <= 0}
              >
                <PiggyBank className="h-4 w-4 mr-2" />
                Make Contribution
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}