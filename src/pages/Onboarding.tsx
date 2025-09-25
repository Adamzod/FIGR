import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, DollarSign, PieChart, Target } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Income state
  const [incomeName, setIncomeName] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeFrequency, setIncomeFrequency] = useState('monthly');
  
  // Categories state
  const [categories, setCategories] = useState([
    { name: 'Housing', percentage: 30 },
    { name: 'Food', percentage: 15 },
    { name: 'Transportation', percentage: 15 },
    { name: 'Utilities', percentage: 10 },
  ]);
  
  // Goal state
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);

  const handleIncomeSubmit = async () => {
    if (!incomeName || !incomeAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all income fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('incomes')
      .insert({
        user_id: user?.id,
        source_name: incomeName,
        amount: parseFloat(incomeAmount),
        frequency: incomeFrequency,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStep(2);
    }
    setIsLoading(false);
  };

  const handleCategoriesSubmit = async () => {
    if (totalPercentage > 100) {
      toast({
        title: "Invalid Allocation",
        description: "Total percentage cannot exceed 100%",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const categoriesToInsert = categories.map(cat => ({
      user_id: user?.id,
      name: cat.name,
      allocated_percentage: cat.percentage / 100,
    }));

    const { error } = await supabase
      .from('categories')
      .insert(categoriesToInsert);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStep(3);
    }
    setIsLoading(false);
  };

  const handleGoalSubmit = async () => {
    setIsLoading(true);
    
    if (goalName && goalAmount) {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user?.id,
          goal_name: goalName,
          target_amount: parseFloat(goalAmount),
          target_date: goalDate || null,
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    navigate('/');
    setIsLoading(false);
  };

  const updateCategory = (index: number, field: 'name' | 'percentage', value: string | number) => {
    const newCategories = [...categories];
    if (field === 'percentage') {
      newCategories[index][field] = Math.min(100, Math.max(0, Number(value)));
    } else {
      newCategories[index][field] = value as string;
    }
    setCategories(newCategories);
  };

  const addCategory = () => {
    setCategories([...categories, { name: '', percentage: 0 }]);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Welcome to FinanceTracker</h1>
          <p className="text-muted-foreground">Let's set up your budget in just a few steps</p>
          <Progress value={(step / 3) * 100} className="mt-4" />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Add Your First Income Source
              </CardTitle>
              <CardDescription>
                Tell us about your primary income source
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="income-name">Income Source Name</Label>
                <Input
                  id="income-name"
                  placeholder="e.g., Main Job, Freelancing"
                  value={incomeName}
                  onChange={(e) => setIncomeName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="income-amount">Amount</Label>
                <Input
                  id="income-amount"
                  type="number"
                  placeholder="0.00"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={incomeFrequency} onValueChange={setIncomeFrequency}>
                  <SelectTrigger id="frequency">
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
                className="w-full"
                onClick={handleIncomeSubmit}
                disabled={isLoading}
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Set Up Budget Categories
              </CardTitle>
              <CardDescription>
                Allocate percentages to different spending categories (Total: {totalPercentage}%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categories.map((category, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Category name"
                    value={category.name}
                    onChange={(e) => updateCategory(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={category.percentage}
                      onChange={(e) => updateCategory(index, 'percentage', e.target.value)}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  {categories.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCategory(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addCategory}
                className="w-full"
              >
                Add Category
              </Button>
              <div className={`p-3 rounded-lg ${totalPercentage > 100 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                Total Allocated: {totalPercentage}% / 100%
              </div>
              <Button
                className="w-full"
                onClick={handleCategoriesSubmit}
                disabled={isLoading || totalPercentage > 100}
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Create Your First Goal (Optional)
              </CardTitle>
              <CardDescription>
                Set a savings goal to work towards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g., Emergency Fund, Vacation"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="goal-amount">Target Amount</Label>
                <Input
                  id="goal-amount"
                  type="number"
                  placeholder="0.00"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="goal-date">Target Date (Optional)</Label>
                <Input
                  id="goal-date"
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/')}
                  disabled={isLoading}
                >
                  Skip for Now
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleGoalSubmit}
                  disabled={isLoading}
                >
                  Complete Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}