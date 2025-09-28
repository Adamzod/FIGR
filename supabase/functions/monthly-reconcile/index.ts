import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id')

    if (usersError) throw usersError

    const now = new Date()
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    for (const user of users || []) {
      // Check if reconciliation already exists for this month
      const { data: existing } = await supabase
        .from('reconciliation_decisions')
        .select('id')
        .eq('user_id', user.id)
        .eq('month_start', firstDayOfLastMonth.toISOString().split('T')[0])
        .single()

      if (existing) continue

      // Calculate last month's income
      const { data: incomes } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)

      // Calculate last month's total income (including one-time payments)
      const lastMonth = now.getMonth() - 1
      const lastYear = lastMonth < 0 ? now.getFullYear() - 1 : now.getFullYear()
      const adjustedMonth = lastMonth < 0 ? 11 : lastMonth
      
      let totalMonthlyIncome = 0
      
      // Add recurring income
      for (const income of incomes || []) {
        if (income.is_recurring !== false) {
          const amount = parseFloat(income.amount)
          switch (income.frequency) {
            case 'weekly':
              totalMonthlyIncome += amount * 4
              break
            case 'bi-weekly':
              totalMonthlyIncome += amount * 2
              break
            case 'monthly':
              totalMonthlyIncome += amount
              break
          }
        }
        // Add one-time payments for the specific month
        else if (income.payment_date) {
          const paymentDate = new Date(income.payment_date)
          if (paymentDate.getMonth() === adjustedMonth && paymentDate.getFullYear() === lastYear) {
            totalMonthlyIncome += parseFloat(income.amount)
          }
        }
      }

      // Calculate last month's expenses
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .gte('date', firstDayOfLastMonth.toISOString().split('T')[0])
        .lte('date', lastDayOfLastMonth.toISOString().split('T')[0])

      let totalExpenses = 0
      let totalGoalContributions = 0

      for (const transaction of transactions || []) {
        const amount = parseFloat(transaction.amount)
        if (transaction.type === 'goal_contribution') {
          totalGoalContributions += amount
        } else {
          totalExpenses += amount
        }
      }

      // Calculate surplus/deficit
      const surplus = totalMonthlyIncome - totalExpenses - totalGoalContributions

      // Only create reconciliation decision if there's a surplus
      if (surplus > 0) {
        const { error: insertError } = await supabase
          .from('reconciliation_decisions')
          .insert({
            user_id: user.id,
            month_start: firstDayOfLastMonth.toISOString().split('T')[0],
            surplus_amount: surplus,
            decision: null,
            processed: false
          })

        if (insertError) {
          console.error(`Error creating reconciliation for user ${user.id}:`, insertError)
        } else {
          console.log(`Created reconciliation for user ${user.id} with surplus ${surplus}`)
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Monthly reconciliation completed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in monthly reconciliation:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})