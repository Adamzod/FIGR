// Shared type definitions for the application

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  category_id: string | null;
  type: string | null;
  note: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  is_system?: boolean;
  budget?: number;
  user_id: string;
  created_at: string;
}

export interface Goal {
  id: string;
  goal_name: string;
  current_amount: number;
  target_amount: number;
  target_date: string;
  user_id: string;
  is_completed: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billing_cycle: string;
  next_due_date: string;
  category_id: string;
  user_id: string;
  is_active: boolean;
  is_variable: boolean;
  created_at: string;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: string;
  user_id: string;
  created_at: string;
  is_recurring?: boolean;
  payment_date?: string;
}

export interface PendingAction {
  id: string;
  type: string;
  description: string;
  amount: number;
  user_id: string;
  created_at: string;
}

export interface ReconciliationDecision {
  id: string;
  surplus_amount: number;
  user_id: string;
  processed: boolean;
  created_at: string;
  decision?: string;
  month_start?: string;
  target_goal_id?: string;
}

export interface GoalSchedule {
  id: string;
  goal_id: string;
  contribution_amount: number;
  frequency: string;
  next_contribution_date: string;
}
