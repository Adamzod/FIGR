-- Add goal_id and subscription_id columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;
