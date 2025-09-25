-- Add updated_at column to subscriptions if not exists
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create or replace the income change trigger function (fixed)
CREATE OR REPLACE FUNCTION public.update_subscription_percentage_on_income_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_subscription_id UUID;
BEGIN
  -- Get user_id from the relevant row
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Get one subscription ID for this user
  SELECT id INTO v_subscription_id
  FROM public.subscriptions 
  WHERE user_id = v_user_id 
  LIMIT 1;

  -- Trigger the subscription percentage update for this user
  IF v_subscription_id IS NOT NULL THEN
    UPDATE public.subscriptions 
    SET updated_at = NOW() 
    WHERE id = v_subscription_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for income changes if not exists
DROP TRIGGER IF EXISTS update_subscriptions_on_income_change ON public.incomes;
CREATE TRIGGER update_subscriptions_on_income_change
AFTER INSERT OR UPDATE OR DELETE ON public.incomes
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_percentage_on_income_change();