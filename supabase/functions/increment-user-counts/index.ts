
// Supabase Edge Function for incrementing/decrementing user event counts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { action, userId } = await req.json();

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate input
    if (!userId || !action) {
      return new Response(
        JSON.stringify({ error: 'User ID and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    
    if (action === 'increment_attended') {
      // Increment attended count
      const { data, error } = await supabase.rpc('increment_user_attended_events', { user_id_param: userId });
      if (error) throw error;
      result = { success: true, action, userId, data };
    } 
    else if (action === 'increment_upcoming') {
      // Increment upcoming count
      const { data, error } = await supabase.rpc('increment_user_upcoming_events', { user_id_param: userId });
      if (error) throw error;
      result = { success: true, action, userId, data };
    }
    else if (action === 'decrement_upcoming') {
      // Decrement upcoming count
      const { data, error } = await supabase.rpc('decrement_user_upcoming_events', { user_id_param: userId });
      if (error) throw error;
      result = { success: true, action, userId, data };
    }
    else {
      throw new Error(`Invalid action: ${action}`);
    }

    // Return the result
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating user count:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
