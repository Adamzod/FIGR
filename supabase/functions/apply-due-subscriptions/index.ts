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

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Get all subscriptions due today
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .lte('next_due_date', todayStr)

    if (subscriptionsError) throw subscriptionsError

    for (const subscription of subscriptions || []) {
      if (subscription.payment_type === 'variable_recurring') {
        // Create pending action for variable recurring subscriptions
        const { error: pendingError } = await supabase
          .from('pending_actions')
          .insert({
            user_id: subscription.user_id,
            kind: 'variable_bill',
            payload: {
              subscription_id: subscription.id,
              subscription_name: subscription.name,
              category_id: subscription.category_id
            },
            due_date: todayStr,
            resolved: false
          })

        if (pendingError) {
          console.error(`Error creating pending action for subscription ${subscription.id}:`, pendingError)
        } else {
          console.log(`Created pending action for variable subscription ${subscription.id}`)
        }
      } else if (subscription.payment_type === 'recurring' || subscription.payment_type === 'fixed_term') {
        // Auto-create transaction for fixed amount subscriptions
        let amount = subscription.amount
        
        if (subscription.payment_type === 'fixed_term' && subscription.total_loan_amount && subscription.payoff_period_months) {
          amount = parseFloat(subscription.total_loan_amount) / subscription.payoff_period_months
        }

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: subscription.user_id,
            name: subscription.name,
            amount: amount,
            date: todayStr,
            category_id: subscription.category_id,
            type: 'subscription',
            note: 'Automated subscription payment'
          })

        if (transactionError) {
          console.error(`Error creating transaction for subscription ${subscription.id}:`, transactionError)
          continue
        }

        console.log(`Created transaction for subscription ${subscription.id}`)
      }

      // Update next_due_date
      let nextDueDate = new Date(subscription.next_due_date)
      
      switch (subscription.billing_cycle) {
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7)
          break
        case 'bi-weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 14)
          break
        case 'monthly':
        default:
          nextDueDate.setMonth(nextDueDate.getMonth() + 1)
          break
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ next_due_date: nextDueDate.toISOString().split('T')[0] })
        .eq('id', subscription.id)

      if (updateError) {
        console.error(`Error updating subscription ${subscription.id}:`, updateError)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Due subscriptions processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing due subscriptions:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})