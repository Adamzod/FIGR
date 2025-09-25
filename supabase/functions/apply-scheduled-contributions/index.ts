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

    const today = new Date().toISOString().split('T')[0]
    const currentDay = new Date().getDate()

    // Get all goal schedules due today
    const { data: schedules, error: schedulesError } = await supabase
      .from('goal_schedules')
      .select('*, goals(*)')
      .eq('day_of_month', currentDay)

    if (schedulesError) throw schedulesError

    for (const schedule of schedules || []) {
      if (!schedule.goals || schedule.goals.is_completed) continue

      // Create goal contribution transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: schedule.user_id,
          name: `Scheduled contribution to ${schedule.goals.goal_name}`,
          amount: schedule.amount,
          date: today,
          type: 'goal_contribution',
          note: 'Automated scheduled contribution'
        })

      if (transactionError) {
        console.error(`Error creating transaction for schedule ${schedule.id}:`, transactionError)
        continue
      }

      // Update goal current amount
      const newAmount = parseFloat(schedule.goals.current_amount) + parseFloat(schedule.amount)
      const isCompleted = newAmount >= parseFloat(schedule.goals.target_amount)

      const { error: goalError } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          is_completed: isCompleted
        })
        .eq('id', schedule.goal_id)

      if (goalError) {
        console.error(`Error updating goal ${schedule.goal_id}:`, goalError)
      } else {
        console.log(`Applied scheduled contribution for goal ${schedule.goal_id}`)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Scheduled contributions applied' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error applying scheduled contributions:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})