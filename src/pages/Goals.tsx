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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/finance-utils';
import { ArrowLeft, Plus, Target, TrendingUp, Calendar, DollarSign, Edit, Trash2, CheckCircle } from 'lucide-react';

export default function Goals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  
  // Goal form state
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  
  // Contribution form state
  const [contributionAmount, setContributionAmount] = useState('');
  
  // Schedule form state
  const [scheduleAmount, setScheduleAmount] = useState('');
  const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState('1');

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    setLoading(true);
    
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*, goal_schedules(*)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setGoals(goalsData || []);
    
    // Flatten schedules for easy access
    const allSchedules = goalsData?.flatMap(g => g.goal_schedules || []) || [];
    setSchedules(allSchedules);
    
    setLoading(false);
  };

  const handleGoalSubmit = async () => {
    if (!goalName || !targetAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const goalData = {
      user_id: user?.id,
      goal_name: goalName,
      target_amount: parseFloat(targetAmount),
      target_date: targetDate || null,
      current_amount: 0,
      is_completed: false,
    };

    if (editingGoalId) {
      const { error } = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', editingGoalId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Goal updated successfully" });
        resetGoalForm();
        loadGoals();
      }
    } else {
      const { error } = await supabase
        .from('goals')
        .insert(goalData);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Goal created successfully" });
        resetGoalForm();
        loadGoals();
      }
    }
  };

  const handleContribution = async () => {
    if (!contributionAmount || !selectedGoalId) {
      toast({
        title: "Missing Information",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    // Create transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user?.id,
        name: `Contribution to ${goal.goal_name}`,
        amount: parseFloat(contributionAmount),
        date: new Date().toISOString().split('T')[0],
        type: 'goal_contribution',
        note: 'Manual goal contribution',
      });

    if (transactionError) {
      toast({
        title: "Error",
        description: transactionError.message,
        variant: "destructive",
      });
      return;
    }

    // Update goal amount
    const newAmount = parseFloat(goal.current_amount) + parseFloat(contributionAmount);
    const isCompleted = newAmount >= parseFloat(goal.target_amount);

    const { error: goalError } = await supabase
      .from('goals')
      .update({
        current_amount: newAmount,
        is_completed: isCompleted,
      })
      .eq('id', selectedGoalId);

    if (goalError) {
      toast({
        title: "Error",
        description: goalError.message,
        variant: "destructive",
      });
    } else {
      toast({ 
        title: isCompleted ? "Goal completed! 🎉" : "Contribution added successfully",
        description: isCompleted ? "Congratulations on reaching your goal!" : undefined,
      });
      setContributionAmount('');
      setIsContributionDialogOpen(false);
      loadGoals();
    }
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleAmount || !selectedGoalId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('goal_schedules')
      .insert({
        user_id: user?.id,
        goal_id: selectedGoalId,
        amount: parseFloat(scheduleAmount),
        day_of_month: parseInt(scheduleDayOfMonth),
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Schedule created successfully" });
      setScheduleAmount('');
      setScheduleDayOfMonth('1');
      setIsScheduleDialogOpen(false);
      loadGoals();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Goal deleted successfully" });
      loadGoals();
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    const { error } = await supabase
      .from('goal_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Schedule deleted successfully" });
      loadGoals();
    }
  };

  const resetGoalForm = () => {
    setGoalName('');
    setTargetAmount('');
    setTargetDate('');
    setEditingGoalId(null);
    setIsGoalDialogOpen(false);
  };

  const handleEditGoal = (goal: any) => {
    setGoalName(goal.goal_name);
    setTargetAmount(goal.target_amount);
    setTargetDate(goal.target_date || '');
    setEditingGoalId(goal.id);
    setIsGoalDialogOpen(true);
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
              <h1 className="text-2xl font-bold">Savings Goals</h1>
            </div>
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetGoalForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingGoalId ? 'Edit Goal' : 'Create New Goal'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="goal-name">Goal Name</Label>
                    <Input
                      id="goal-name"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      placeholder="e.g., Emergency Fund, Vacation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="target-amount">Target Amount</Label>
                    <Input
                      id="target-amount"
                      type="number"
                      step="0.01"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="target-date">Target Date (Optional)</Label>
                    <Input
                      id="target-date"
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleGoalSubmit} className="w-full">
                    {editingGoalId ? 'Update Goal' : 'Create Goal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Goals Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">Loading goals...</div>
              </CardContent>
            </Card>
          ) : goals.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No goals yet. Create your first savings goal!</p>
              </CardContent>
            </Card>
          ) : (
            goals.map(goal => {
              const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
              const remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
              
              return (
                <Card key={goal.id} className={`hover:shadow-md transition-shadow ${goal.is_completed ? 'border-success' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {goal.goal_name}
                          {goal.is_completed && (
                            <CheckCircle className="h-5 w-5 text-success" />
                          )}
                        </CardTitle>
                        {goal.target_date && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Target: {formatDate(goal.target_date)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditGoal(goal)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{formatCurrency(parseFloat(goal.current_amount))}</span>
                          <span className="font-semibold">{formatCurrency(parseFloat(goal.target_amount))}</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className={goal.is_completed ? 'bg-success/20' : ''} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {goal.is_completed ? 'Goal completed!' : `${formatCurrency(remaining)} remaining`}
                        </p>
                      </div>
                      
                      {/* Schedules */}
                      {goal.goal_schedules && goal.goal_schedules.length > 0 && (
                        <div className="border-t pt-2">
                          <p className="text-xs text-muted-foreground mb-1">Scheduled contributions:</p>
                          {goal.goal_schedules.map((schedule: any) => (
                            <div key={schedule.id} className="flex items-center justify-between text-sm">
                              <span>{formatCurrency(parseFloat(schedule.amount))} on day {schedule.day_of_month}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleDeleteSchedule(schedule.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Actions */}
                      {!goal.is_completed && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedGoalId(goal.id);
                              setIsContributionDialogOpen(true);
                            }}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Contribute
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedGoalId(goal.id);
                              setIsScheduleDialogOpen(true);
                            }}
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            Schedule
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Contribution Dialog */}
      <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make a Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="contribution-amount">Amount</Label>
              <Input
                id="contribution-amount"
                type="number"
                step="0.01"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button onClick={handleContribution} className="w-full">
              Add Contribution
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Monthly Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="schedule-amount">Monthly Amount</Label>
              <Input
                id="schedule-amount"
                type="number"
                step="0.01"
                value={scheduleAmount}
                onChange={(e) => setScheduleAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="schedule-day">Day of Month (1-28)</Label>
              <Input
                id="schedule-day"
                type="number"
                min="1"
                max="28"
                value={scheduleDayOfMonth}
                onChange={(e) => setScheduleDayOfMonth(e.target.value)}
              />
            </div>
            <Button onClick={handleScheduleSubmit} className="w-full">
              Create Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}