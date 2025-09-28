-- Add columns for one-time payments
ALTER TABLE incomes 
ADD COLUMN is_recurring BOOLEAN DEFAULT true,
ADD COLUMN payment_date DATE;

-- Update existing records to be recurring
UPDATE incomes SET is_recurring = true WHERE is_recurring IS NULL;

-- Drop old constraint if exists
ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_frequency_check;

-- Add new constraint to allow 'one-time' frequency
ALTER TABLE incomes 
ADD CONSTRAINT incomes_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'one-time'));

-- Create validation function for income data
CREATE OR REPLACE FUNCTION validate_income_data()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.frequency = 'one-time' THEN
    IF NEW.payment_date IS NULL THEN
      RAISE EXCEPTION 'Payment date is required for one-time payments';
    END IF;
    NEW.is_recurring = false;
  ELSE
    NEW.is_recurring = true;
    -- Clear payment_date for recurring incomes
    NEW.payment_date = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_income_before_insert ON incomes;
CREATE TRIGGER validate_income_before_insert
BEFORE INSERT OR UPDATE ON incomes
FOR EACH ROW EXECUTE FUNCTION validate_income_data();