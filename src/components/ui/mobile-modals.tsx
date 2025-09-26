import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MobileBottomSheet,
  MobileBottomSheetContent,
  MobileBottomSheetHeader,
  MobileBottomSheetTitle,
  MobileBottomSheetBody,
  MobileBottomSheetFooter,
} from "@/components/ui/mobile-bottom-sheet";
import {
  MobileFormField,
  MobileInput,
  MobileTextarea,
  MobileActionButton,
  QuickAmountButtons,
  MobileFormSection,
} from "@/components/ui/mobile-form-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  Calendar, 
  Target, 
  CreditCard, 
  PiggyBank,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  Receipt,
  Briefcase,
  Wallet,
  Bell,
  Zap
} from "lucide-react";

// Base Mobile Modal Component
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  height?: 'auto' | 'full' | 'half';
  showHandle?: boolean;
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  height = 'auto',
  showHandle = true,
}: MobileModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileBottomSheet open={isOpen} onOpenChange={onClose}>
        <MobileBottomSheetContent height={height} showHandle={showHandle}>
          <MobileBottomSheetHeader>
            <MobileBottomSheetTitle>{title}</MobileBottomSheetTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </MobileBottomSheetHeader>
          <MobileBottomSheetBody>
            {children}
          </MobileBottomSheetBody>
          {footer && (
            <MobileBottomSheetFooter>
              {footer}
            </MobileBottomSheetFooter>
          )}
        </MobileBottomSheetContent>
      </MobileBottomSheet>
    );
  }

  // Desktop fallback
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {footer && <div className="pt-4">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}

// Transaction Modal
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionData) => void;
  categories: Array<{ id: string; name: string }>;
  editingTransaction?: TransactionData | null;
  loading?: boolean;
}

interface TransactionData {
  name: string;
  amount: string;
  category_id: string;
  date: string;
  note: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  editingTransaction,
  loading = false,
}: TransactionModalProps) {
  const [formData, setFormData] = React.useState<TransactionData>({
    name: '',
    amount: '',
    category_id: 'none',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const [selectedQuickAmount, setSelectedQuickAmount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (editingTransaction) {
      setFormData(editingTransaction);
    } else {
      setFormData({
        name: '',
        amount: '',
        category_id: 'none',
        date: new Date().toISOString().split('T')[0],
        note: '',
      });
    }
  }, [editingTransaction, isOpen]);

  const handleQuickAmount = (amount: number) => {
    setSelectedQuickAmount(amount);
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.amount) return;
    onSubmit(formData);
  };

  const quickAmounts = [10, 25, 50, 100];

  const footer = (
    <MobileActionButton
      onClick={handleSubmit}
      loading={loading}
      className="w-full"
      disabled={!formData.name || !formData.amount}
      icon={<Plus className="w-4 h-4" />}
    >
      {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
    </MobileActionButton>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      description="Record a new expense or income"
      footer={footer}
    >
      <div className="space-y-6">
        <MobileFormSection>
          <MobileFormField label="Transaction Name" required icon={<Receipt className="w-4 h-4" />}>
            <MobileInput
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Coffee, Groceries"
            />
          </MobileFormField>

          <MobileFormField label="Amount" required icon={<DollarSign className="w-4 h-4" />}>
            <MobileInput
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, amount: e.target.value }));
                setSelectedQuickAmount(null);
              }}
              placeholder="0.00"
            />
            <QuickAmountButtons
              amounts={quickAmounts}
              selectedAmount={selectedQuickAmount}
              onAmountSelect={handleQuickAmount}
            />
          </MobileFormField>

          <MobileFormField label="Category" icon={<Target className="w-4 h-4" />}>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger className="h-12 text-base">
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
          </MobileFormField>

          <MobileFormField label="Date" icon={<Calendar className="w-4 h-4" />}>
            <MobileInput
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </MobileFormField>

          <MobileFormField label="Note (optional)">
            <MobileTextarea
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Add a note..."
            />
          </MobileFormField>
        </MobileFormSection>
      </div>
    </MobileModal>
  );
}

// Goal Modal
interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalData) => void;
  editingGoal?: GoalData | null;
  loading?: boolean;
}

interface GoalData {
  goal_name: string;
  target_amount: string;
  target_date: string;
}

export function GoalModal({
  isOpen,
  onClose,
  onSubmit,
  editingGoal,
  loading = false,
}: GoalModalProps) {
  const [formData, setFormData] = React.useState<GoalData>({
    goal_name: '',
    target_amount: '',
    target_date: '',
  });

  React.useEffect(() => {
    if (editingGoal) {
      setFormData(editingGoal);
    } else {
      setFormData({
        goal_name: '',
        target_amount: '',
        target_date: '',
      });
    }
  }, [editingGoal, isOpen]);

  const handleSubmit = () => {
    if (!formData.goal_name || !formData.target_amount) return;
    onSubmit(formData);
  };

  const footer = (
    <MobileActionButton
      onClick={handleSubmit}
      loading={loading}
      className="w-full"
      disabled={!formData.goal_name || !formData.target_amount}
      icon={<Target className="w-4 h-4" />}
    >
      {editingGoal ? 'Update Goal' : 'Create Goal'}
    </MobileActionButton>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingGoal ? 'Edit Goal' : 'Create Savings Goal'}
      description="Set a new financial target"
      footer={footer}
    >
      <div className="space-y-6">
        <MobileFormSection>
          <MobileFormField label="Goal Name" required icon={<Target className="w-4 h-4" />}>
            <MobileInput
              value={formData.goal_name}
              onChange={(e) => setFormData(prev => ({ ...prev, goal_name: e.target.value }))}
              placeholder="e.g., Emergency Fund, Vacation"
            />
          </MobileFormField>

          <MobileFormField label="Target Amount" required icon={<DollarSign className="w-4 h-4" />}>
            <MobileInput
              type="number"
              step="0.01"
              value={formData.target_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
              placeholder="0.00"
            />
          </MobileFormField>

          <MobileFormField label="Target Date (optional)" icon={<Calendar className="w-4 h-4" />}>
            <MobileInput
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
            />
          </MobileFormField>
        </MobileFormSection>
      </div>
    </MobileModal>
  );
}

// Contribution Modal
interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  goalName: string;
  remainingAmount: number;
  loading?: boolean;
}

export function ContributionModal({
  isOpen,
  onClose,
  onSubmit,
  goalName,
  remainingAmount,
  loading = false,
}: ContributionModalProps) {
  const [amount, setAmount] = React.useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSelectedQuickAmount(null);
    }
  }, [isOpen]);

  const handleQuickAmount = (quickAmount: number) => {
    setSelectedQuickAmount(quickAmount);
    setAmount(quickAmount.toString());
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onSubmit(parseFloat(amount));
  };

  const quickAmounts = [10, 25, 50, 100, 200, 500];

  const footer = (
    <MobileActionButton
      onClick={handleSubmit}
      loading={loading}
      className="w-full"
      disabled={!amount || parseFloat(amount) <= 0}
      icon={<PiggyBank className="w-4 h-4" />}
    >
      Make Contribution
    </MobileActionButton>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Contribute to ${goalName}`}
      description="Add money to your savings goal"
      footer={footer}
    >
      <div className="space-y-6">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Remaining to Goal</p>
              <p className="text-2xl font-bold text-success">${remainingAmount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <MobileFormSection>
          <MobileFormField label="Contribution Amount" required icon={<DollarSign className="w-4 h-4" />}>
            <MobileInput
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSelectedQuickAmount(null);
              }}
              placeholder="0.00"
            />
            <QuickAmountButtons
              amounts={quickAmounts}
              selectedAmount={selectedQuickAmount}
              onAmountSelect={handleQuickAmount}
            />
          </MobileFormField>
        </MobileFormSection>
      </div>
    </MobileModal>
  );
}

// Subscription Modal
interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubscriptionData) => void;
  editingSubscription?: SubscriptionData | null;
  loading?: boolean;
}

interface SubscriptionData {
  name: string;
  payment_type: string;
  amount: string;
  total_loan_amount: string;
  payoff_period_months: string;
  next_due_date: string;
  billing_cycle: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSubmit,
  editingSubscription,
  loading = false,
}: SubscriptionModalProps) {
  const [formData, setFormData] = React.useState<SubscriptionData>({
    name: '',
    payment_type: 'recurring',
    amount: '',
    total_loan_amount: '',
    payoff_period_months: '',
    next_due_date: new Date().toISOString().split('T')[0],
    billing_cycle: 'monthly',
  });

  React.useEffect(() => {
    if (editingSubscription) {
      setFormData(editingSubscription);
    } else {
      setFormData({
        name: '',
        payment_type: 'recurring',
        amount: '',
        total_loan_amount: '',
        payoff_period_months: '',
        next_due_date: new Date().toISOString().split('T')[0],
        billing_cycle: 'monthly',
      });
    }
  }, [editingSubscription, isOpen]);

  const handleSubmit = () => {
    if (!formData.name || !formData.next_due_date) return;
    onSubmit(formData);
  };

  const paymentTypes = [
    { value: 'recurring', label: 'Recurring', icon: <CreditCard className="w-4 h-4" />, description: 'Fixed amount each period' },
    { value: 'fixed_term', label: 'Fixed Term', icon: <Calendar className="w-4 h-4" />, description: 'Loan or payment plan' },
    { value: 'variable_recurring', label: 'Variable', icon: <TrendingUp className="w-4 h-4" />, description: 'Amount changes each period' },
  ];

  const footer = (
    <MobileActionButton
      onClick={handleSubmit}
      loading={loading}
      className="w-full"
      disabled={!formData.name || !formData.next_due_date}
      icon={<CreditCard className="w-4 h-4" />}
    >
      {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
    </MobileActionButton>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSubscription ? 'Edit Subscription' : 'Add Subscription'}
      description="Track your recurring payments"
      footer={footer}
      height="full"
    >
      <div className="space-y-6">
        <MobileFormSection>
          <MobileFormField label="Subscription Name" required icon={<CreditCard className="w-4 h-4" />}>
            <MobileInput
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Netflix, Gym Membership"
            />
          </MobileFormField>

          <MobileFormField label="Payment Type" required>
            <div className="space-y-3">
              {paymentTypes.map((type) => (
                <Card
                  key={type.value}
                  className={cn(
                    "cursor-pointer transition-colors",
                    formData.payment_type === type.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => setFormData(prev => ({ ...prev, payment_type: type.value }))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{type.label}</h4>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      {formData.payment_type === type.value && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </MobileFormField>

          {formData.payment_type === 'recurring' && (
            <MobileFormField label="Amount" required icon={<DollarSign className="w-4 h-4" />}>
              <MobileInput
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
              />
            </MobileFormField>
          )}

          {formData.payment_type === 'fixed_term' && (
            <>
              <MobileFormField label="Total Loan Amount" required icon={<DollarSign className="w-4 h-4" />}>
                <MobileInput
                  type="number"
                  step="0.01"
                  value={formData.total_loan_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_loan_amount: e.target.value }))}
                  placeholder="0.00"
                />
              </MobileFormField>
              <MobileFormField label="Payoff Period (months)" required icon={<Calendar className="w-4 h-4" />}>
                <MobileInput
                  type="number"
                  value={formData.payoff_period_months}
                  onChange={(e) => setFormData(prev => ({ ...prev, payoff_period_months: e.target.value }))}
                  placeholder="12"
                />
              </MobileFormField>
              {formData.total_loan_amount && formData.payoff_period_months && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        Monthly payment: ${(parseFloat(formData.total_loan_amount) / parseInt(formData.payoff_period_months)).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <MobileFormField label="Next Due Date" required icon={<Calendar className="w-4 h-4" />}>
            <MobileInput
              type="date"
              value={formData.next_due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, next_due_date: e.target.value }))}
            />
          </MobileFormField>

          <MobileFormField label="Billing Cycle" icon={<Calendar className="w-4 h-4" />}>
            <Select
              value={formData.billing_cycle}
              onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value }))}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </MobileFormField>
        </MobileFormSection>
      </div>
    </MobileModal>
  );
}

// Category Modal
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryData) => void;
  editingCategory?: CategoryData | null;
  totalIncome: number;
  loading?: boolean;
}

interface CategoryData {
  name: string;
  allocated_percentage: number;
  display_schedule: string;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  editingCategory,
  totalIncome,
  loading = false,
}: CategoryModalProps) {
  const [formData, setFormData] = React.useState<CategoryData>({
    name: '',
    allocated_percentage: 0,
    display_schedule: 'monthly',
  });

  React.useEffect(() => {
    if (editingCategory) {
      setFormData(editingCategory);
    } else {
      setFormData({
        name: '',
        allocated_percentage: 0,
        display_schedule: 'monthly',
      });
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = () => {
    if (!formData.name || formData.allocated_percentage === 0) return;
    onSubmit(formData);
  };

  const monthlyBudget = totalIncome * formData.allocated_percentage;

  const footer = (
    <MobileActionButton
      onClick={handleSubmit}
      loading={loading}
      className="w-full"
      disabled={!formData.name || formData.allocated_percentage === 0}
      icon={<Wallet className="w-4 h-4" />}
    >
      {editingCategory ? 'Update Category' : 'Create Category'}
    </MobileActionButton>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? 'Edit Category' : 'Create Category'}
      description="Set up a new budget category"
      footer={footer}
    >
      <div className="space-y-6">
        <MobileFormSection>
          <MobileFormField label="Category Name" required icon={<Wallet className="w-4 h-4" />}>
            <MobileInput
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Groceries, Entertainment"
            />
          </MobileFormField>

          <MobileFormField label="Budget Allocation">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {Math.round(formData.allocated_percentage * 100)}%
                </span>
                <Badge variant="secondary">
                  ${monthlyBudget.toFixed(2)}/month
                </Badge>
              </div>
              <div className="px-2">
                <Slider
                  value={[formData.allocated_percentage * 100]}
                  onValueChange={([value]) => 
                    setFormData(prev => ({ ...prev, allocated_percentage: value / 100 }))
                  }
                  max={100}
                  step={1}
                  className="h-2"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map((percentage) => (
                  <Button
                    key={percentage}
                    variant={formData.allocated_percentage * 100 === percentage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, allocated_percentage: percentage / 100 }))}
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
            </div>
          </MobileFormField>

          <MobileFormField label="Display Schedule" icon={<Calendar className="w-4 h-4" />}>
            <Select
              value={formData.display_schedule}
              onValueChange={(value) => setFormData(prev => ({ ...prev, display_schedule: value }))}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </MobileFormField>
        </MobileFormSection>
      </div>
    </MobileModal>
  );
}

// Income Modal
interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IncomeData) => void;
  editingIncome?: IncomeData | null;
  loading?: boolean;
}

interface IncomeData {
  source_name: string;
  amount: string;
  frequency: string;
}

export function IncomeModal({
  isOpen,
  onClose,
  onSubmit,
  editingIncome,
  loading = false,
}: IncomeModalProps) {
  const [formData, setFormData] = React.useState<IncomeData>({
    source_name: '',
    amount: '',
    frequency: 'monthly',
  });

  React.useEffect(() => {
    if (editingIncome) {
      setFormData(editingIncome);
    } else {
      setFormData({
        source_name: '',
        amount: '',
        frequency: 'monthly',
      });
    }
  }, [editingIncome, isOpen]);

  const handleSubmit = () => {
    if (!formData.source_name || !formData.amount) return;
    onSubmit(formData);
  };

  const normalizeToMonthly = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'bi-weekly': return amount * 2.17;
      case 'monthly': return amount;
      default: return amount;
    }
  };

  const monthlyAmount = formData.amount ? normalizeToMonthly(parseFloat(formData.amount), formData.frequency) : 0;

  const footer = (
    <MobileActionButton
      onClick={handleSubmit}
      loading={loading}
      className="w-full"
      disabled={!formData.source_name || !formData.amount}
      icon={<Briefcase className="w-4 h-4" />}
    >
      {editingIncome ? 'Update Income' : 'Add Income'}
    </MobileActionButton>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingIncome ? 'Edit Income Source' : 'Add Income Source'}
      description="Track your income sources"
      footer={footer}
    >
      <div className="space-y-6">
        <MobileFormSection>
          <MobileFormField label="Source Name" required icon={<Briefcase className="w-4 h-4" />}>
            <MobileInput
              value={formData.source_name}
              onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
              placeholder="e.g., Main Job, Freelance"
            />
          </MobileFormField>

          <MobileFormField label="Amount" required icon={<DollarSign className="w-4 h-4" />}>
            <MobileInput
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </MobileFormField>

          <MobileFormField label="Frequency" icon={<Calendar className="w-4 h-4" />}>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </MobileFormField>

          {formData.amount && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Monthly equivalent: ${monthlyAmount.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </MobileFormSection>
      </div>
    </MobileModal>
  );
}

// Pending Action Modal
interface PendingActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  actionTitle: string;
  dueDate: string;
  loading?: boolean;
}

export function PendingActionModal({
  isOpen,
  onClose,
  onSubmit,
  actionTitle,
  dueDate,
  loading = false,
}: PendingActionModalProps) {
  const [amount, setAmount] = React.useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSelectedQuickAmount(null);
    }
  }, [isOpen]);

  const handleQuickAmount = (quickAmount: number) => {
    setSelectedQuickAmount(quickAmount);
    setAmount(quickAmount.toString());
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onSubmit(parseFloat(amount));
  };

  const quickAmounts = [25, 50, 100, 150, 200, 300];

  const footer = (
    <MobileActionButton
      onClick={handleSubmit}
      loading={loading}
      className="w-full"
      disabled={!amount || parseFloat(amount) <= 0}
      icon={<CheckCircle2 className="w-4 h-4" />}
    >
      Complete Payment
    </MobileActionButton>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Action"
      description="Enter the payment amount"
      footer={footer}
    >
      <div className="space-y-6">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-medium">{actionTitle}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <MobileFormSection>
          <MobileFormField label="Payment Amount" required icon={<DollarSign className="w-4 h-4" />}>
            <MobileInput
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setSelectedQuickAmount(null);
              }}
              placeholder="Enter this month's amount"
            />
            <QuickAmountButtons
              amounts={quickAmounts}
              selectedAmount={selectedQuickAmount}
              onAmountSelect={handleQuickAmount}
            />
          </MobileFormField>
        </MobileFormSection>
      </div>
    </MobileModal>
  );
}

// Reconciliation Modal
interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (decision: 'rollover' | 'goal_contribution', goalId?: string) => void;
  surplusAmount: number;
  goals: Array<{ id: string; goal_name: string; current_amount: number; target_amount: number }>;
  loading?: boolean;
}

export function ReconciliationModal({
  isOpen,
  onClose,
  onSubmit,
  surplusAmount,
  goals,
  loading = false,
}: ReconciliationModalProps) {
  const [decision, setDecision] = React.useState<'rollover' | 'goal_contribution'>('rollover');
  const [selectedGoalId, setSelectedGoalId] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setDecision('rollover');
      setSelectedGoalId('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (decision === 'goal_contribution' && !selectedGoalId) return;
    onSubmit(decision, decision === 'goal_contribution' ? selectedGoalId : undefined);
  };

  const footer = (
    <MobileActionButton
      onClick={handleSubmit}
      loading={loading}
      className="w-full"
      disabled={decision === 'goal_contribution' && !selectedGoalId}
      icon={<CheckCircle2 className="w-4 h-4" />}
    >
      Confirm Decision
    </MobileActionButton>
  );

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Monthly Reconciliation"
      description="You have a surplus from last month. How would you like to handle it?"
      footer={footer}
    >
      <div className="space-y-6">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Last Month's Surplus</p>
              <p className="text-3xl font-bold text-success">${surplusAmount.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <MobileFormSection>
          <div className="space-y-4">
            <Card
              className={cn(
                "cursor-pointer transition-colors",
                decision === 'rollover' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
              onClick={() => setDecision('rollover')}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Rollover to Current Month</h4>
                    <p className="text-sm text-muted-foreground">
                      Add the surplus to this month's available funds
                    </p>
                  </div>
                  {decision === 'rollover' && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-colors",
                decision === 'goal_contribution' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
              onClick={() => setDecision('goal_contribution')}
            >
              <CardContent className="p4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PiggyBank className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">Contribute to a Goal</h4>
                    <p className="text-sm text-muted-foreground">
                      Put the surplus towards one of your savings goals
                    </p>
                  </div>
                  {decision === 'goal_contribution' && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {decision === 'goal_contribution' && (
            <MobileFormField label="Select Goal" required icon={<Target className="w-4 h-4" />}>
              <Select
                value={selectedGoalId}
                onValueChange={setSelectedGoalId}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Choose a goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.goal_name} (${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFormField>
          )}
        </MobileFormSection>
      </div>
    </MobileModal>
  );
}
