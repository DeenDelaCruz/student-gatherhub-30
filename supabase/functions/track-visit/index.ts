
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing user ID" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables for Supabase");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Track user visit
    const now = new Date().toISOString();
    
    // Check if there's already a visit record for this user today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Try to use the RPC first
    const { data: visitData, error: visitQueryError } = await supabase
      .rpc("get_user_visit", {
        user_id_param: userId,
        date_param: today.toISOString()
      });
      
    if (visitQueryError) {
      // If RPC fails, try direct query
      console.error("Error using RPC get_user_visit:", visitQueryError);
      
      const { data: directVisitData, error: directQueryError } = await supabase
        .from("user_visits")
        .select("id")
        .eq("user_id", userId)
        .gte("visit_time", today.toISOString())
        .order("visit_time", { ascending: false })
        .limit(1);
        
      if (directQueryError) {
        throw new Error(`Error querying visits: ${directQueryError.message}`);
      }
      
      if (directVisitData && directVisitData.length > 0) {
        // Update existing visit
        const { error: updateError } = await supabase
          .from("user_visits")
          .update({ visit_time: now })
          .eq("id", directVisitData[0].id);
          
        if (updateError) {
          throw new Error(`Error updating visit: ${updateError.message}`);
        }
      } else {
        // Create new visit
        const { error: insertError } = await supabase
          .from("user_visits")
          .insert({ user_id: userId, visit_time: now });
          
        if (insertError) {
          throw new Error(`Error creating visit: ${insertError.message}`);
        }
      }
    } else {
      // RPC worked, use the data
      if (visitData && visitData.length > 0) {
        // Update existing visit
        const { error: updateError } = await supabase
          .rpc("update_user_visit", {
            visit_id_param: visitData[0].id,
            time_param: now
          });
          
        if (updateError) {
          throw new Error(`Error updating visit via RPC: ${updateError.message}`);
        }
      } else {
        // Create new visit
        const { error: createError } = await supabase
          .rpc("create_user_visit", {
            user_id_param: userId,
            time_param: now
          });
          
        if (createError) {
          throw new Error(`Error creating visit via RPC: ${createError.message}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "User visit tracked" }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error("Error in track-visit function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error tracking visit",
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
