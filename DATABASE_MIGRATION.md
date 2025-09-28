# Database Migration Required

## Issue
The application is trying to insert `goal_id` and `subscription_id` columns into the `transactions` table, but these columns don't exist in the database yet.

## Solution
Run the following SQL in your Supabase SQL Editor:

```sql
-- Add goal_id and subscription_id columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;
```

## Steps to Apply Migration

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run the SQL command above
4. Once applied, uncomment the lines in `src/pages/TransactionsMobile.tsx`:
   ```typescript
   // Uncomment these lines after migration is applied:
   // goal_id: newTransaction.goal_id === 'none' ? null : newTransaction.goal_id,
   // subscription_id: newTransaction.subscription_id === 'none' ? null : newTransaction.subscription_id,
   ```

## Current Status
- ✅ UI implementation complete
- ✅ Dynamic selectors working
- ⏳ Database migration pending
- ⏳ Data persistence for goal_id/subscription_id pending

The application will work without errors once the migration is applied.
