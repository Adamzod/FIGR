-- Fix security warning: Set search_path for the validation function
ALTER FUNCTION validate_income_data() SET search_path = public;

-- Fix security warning: Set search_path for other functions that don't have it
ALTER FUNCTION update_subscription_percentage_on_income_change() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;
ALTER FUNCTION update_subscription_category_percentage() SET search_path = public;