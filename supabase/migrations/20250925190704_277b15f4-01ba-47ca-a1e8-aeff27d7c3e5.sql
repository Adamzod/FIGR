-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incomes table
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  allocated_percentage NUMERIC NOT NULL CHECK (allocated_percentage >= 0 AND allocated_percentage <= 1),
  display_schedule TEXT NOT NULL DEFAULT 'monthly' CHECK (display_schedule IN ('weekly', 'bi-weekly', 'monthly')),
  linked_goal_id UUID NULL,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint after goals table exists
ALTER TABLE public.categories 
  ADD CONSTRAINT categories_linked_goal_id_fkey 
  FOREIGN KEY (linked_goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  note TEXT NULL,
  type TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goal_schedules table
CREATE TABLE public.goal_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  day_of_month INT NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 28),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('recurring', 'fixed_term', 'variable_recurring')),
  amount NUMERIC NULL CHECK (amount IS NULL OR amount > 0),
  total_loan_amount NUMERIC NULL CHECK (total_loan_amount IS NULL OR total_loan_amount > 0),
  payoff_period_months INT NULL CHECK (payoff_period_months IS NULL OR payoff_period_months > 0),
  next_due_date DATE NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pending_actions table
CREATE TABLE public.pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  due_date DATE NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reconciliation_decisions table
CREATE TABLE public.reconciliation_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  surplus_amount NUMERIC NOT NULL,
  decision TEXT NULL CHECK (decision IS NULL OR decision IN ('rollover', 'goal_contribution')),
  target_goal_id UUID NULL REFERENCES public.goals(id) ON DELETE SET NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rollovers table for tracking monthly rollovers
CREATE TABLE public.rollovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start DATE NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month_start)
);

-- Create indexes for performance
CREATE INDEX idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goal_schedules_user_id ON public.goal_schedules(user_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_due_date ON public.subscriptions(next_due_date);
CREATE INDEX idx_pending_actions_user_id ON public.pending_actions(user_id);
CREATE INDEX idx_pending_actions_due_date ON public.pending_actions(due_date);
CREATE INDEX idx_reconciliation_decisions_user_id ON public.reconciliation_decisions(user_id);
CREATE INDEX idx_rollovers_user_id ON public.rollovers(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rollovers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Incomes
CREATE POLICY "Users can view own incomes" ON public.incomes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own incomes" ON public.incomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incomes" ON public.incomes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incomes" ON public.incomes
  FOR DELETE USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Goals
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- Goal Schedules
CREATE POLICY "Users can view own goal schedules" ON public.goal_schedules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own goal schedules" ON public.goal_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goal schedules" ON public.goal_schedules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goal schedules" ON public.goal_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON public.subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Pending Actions
CREATE POLICY "Users can view own pending actions" ON public.pending_actions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own pending actions" ON public.pending_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending actions" ON public.pending_actions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pending actions" ON public.pending_actions
  FOR DELETE USING (auth.uid() = user_id);

-- Reconciliation Decisions
CREATE POLICY "Users can view own reconciliation decisions" ON public.reconciliation_decisions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reconciliation decisions" ON public.reconciliation_decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reconciliation decisions" ON public.reconciliation_decisions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reconciliation decisions" ON public.reconciliation_decisions
  FOR DELETE USING (auth.uid() = user_id);

-- Rollovers
CREATE POLICY "Users can view own rollovers" ON public.rollovers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own rollovers" ON public.rollovers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rollovers" ON public.rollovers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rollovers" ON public.rollovers
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update subscription category percentage
CREATE OR REPLACE FUNCTION public.update_subscription_category_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_total_monthly_income NUMERIC;
  v_total_subscription_cost NUMERIC;
  v_subscription_percentage NUMERIC;
  v_subscriptions_category_id UUID;
BEGIN
  -- Get the user_id from the relevant row
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Calculate total monthly income for the user
  SELECT COALESCE(SUM(
    CASE frequency
      WHEN 'weekly' THEN amount * 4
      WHEN 'bi-weekly' THEN amount * 2
      WHEN 'monthly' THEN amount
    END
  ), 0) INTO v_total_monthly_income
  FROM public.incomes
  WHERE user_id = v_user_id;

  -- Calculate total monthly subscription cost
  SELECT COALESCE(SUM(
    CASE payment_type
      WHEN 'fixed_term' THEN 
        CASE 
          WHEN total_loan_amount IS NOT NULL AND payoff_period_months IS NOT NULL 
          THEN total_loan_amount / payoff_period_months
          ELSE amount
        END
      ELSE amount
    END
  ), 0) INTO v_total_subscription_cost
  FROM public.subscriptions
  WHERE user_id = v_user_id
    AND payment_type IN ('recurring', 'fixed_term');

  -- Calculate percentage
  IF v_total_monthly_income > 0 THEN
    v_subscription_percentage := v_total_subscription_cost / v_total_monthly_income;
  ELSE
    v_subscription_percentage := 0;
  END IF;

  -- Find or create the Subscriptions category
  SELECT id INTO v_subscriptions_category_id
  FROM public.categories
  WHERE user_id = v_user_id AND name = 'Subscriptions' AND is_system = true;

  IF v_subscriptions_category_id IS NULL AND v_subscription_percentage > 0 THEN
    -- Create the system Subscriptions category
    INSERT INTO public.categories (user_id, name, allocated_percentage, is_system)
    VALUES (v_user_id, 'Subscriptions', v_subscription_percentage, true);
  ELSIF v_subscriptions_category_id IS NOT NULL THEN
    -- Update the existing Subscriptions category
    IF v_subscription_percentage = 0 THEN
      -- Delete the category if no subscriptions
      DELETE FROM public.categories WHERE id = v_subscriptions_category_id;
    ELSE
      UPDATE public.categories
      SET allocated_percentage = v_subscription_percentage
      WHERE id = v_subscriptions_category_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers for subscription changes
CREATE TRIGGER update_subscription_category_on_insert
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_category_percentage();

CREATE TRIGGER update_subscription_category_on_update
  AFTER UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_category_percentage();

CREATE TRIGGER update_subscription_category_on_delete
  AFTER DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_category_percentage();

-- Create trigger for income changes to update subscription percentage
CREATE TRIGGER update_subscription_category_on_income_change
  AFTER INSERT OR UPDATE OR DELETE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_category_percentage();