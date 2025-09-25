import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { decision, target_goal_id, reconciliation_id } = await req.json()
    
    // Get auth header
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the reconciliation decision
    const { data: reconciliation, error: recError } = await supabase
      .from('reconciliation_decisions')
      .select('*')
      .eq('id', reconciliation_id)
      .eq('user_id', user.id)
      .eq('processed', false)
      .single()

    if (recError || !reconciliation) {
      return new Response(
        JSON.stringify({ error: 'Reconciliation not found or already processed' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    if (decision === 'rollover') {
      // Create or update rollover for current month
      const { error: rolloverError } = await supabase
        .from('rollovers')
        .upsert({
          user_id: user.id,
          month_start: firstDayOfMonth.toISOString().split('T')[0],
          amount: reconciliation.surplus_amount
        }, {
          onConflict: 'user_id,month_start'
        })

      if (rolloverError) throw rolloverError

    } else if (decision === 'goal_contribution' && target_goal_id) {
      // Get the goal
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', target_goal_id)
        .eq('user_id', user.id)
        .single()

      if (goalError || !goal) {
        return new Response(
          JSON.stringify({ error: 'Goal not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create goal contribution transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          name: `Surplus contribution to ${goal.goal_name}`,
          amount: reconciliation.surplus_amount,
          date: today.toISOString().split('T')[0],
          type: 'goal_contribution',
          note: 'Monthly surplus contribution'
        })

      if (transactionError) throw transactionError

      // Update goal amount
      const newAmount = parseFloat(goal.current_amount) + parseFloat(reconciliation.surplus_amount)
      const isCompleted = newAmount >= parseFloat(goal.target_amount)

      const { error: updateGoalError } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted
        })
        .eq('id', target_goal_id)

      if (updateGoalError) throw updateGoalError
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid decision or missing target_goal_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark reconciliation as processed
    const { error: updateError } = await supabase
      .from('reconciliation_decisions')
      .update({
        decision: decision,
        target_goal_id: target_goal_id,
        processed: true
      })
      .eq('id', reconciliation_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, message: 'Reconciliation decision applied' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error applying reconciliation decision:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})