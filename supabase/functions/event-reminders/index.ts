
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type NotificationData = {
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string;
  read: boolean;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Checking for upcoming events...");
    
    // Get the current time
    const now = new Date();
    
    // Get tomorrow's date at 11:59 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    console.log(`Looking for events between ${now.toISOString()} and ${tomorrow.toISOString()}`);
    
    // Get all active events happening within the next 24 hours that have not ended yet
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .gte("event_date", now.toISOString())
      .lte("event_date", tomorrow.toISOString())
      .eq("is_active", true);
      
    if (eventsError) {
      throw eventsError;
    }
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      console.log("No upcoming events in the next 24 hours");
      return new Response(
        JSON.stringify({ message: "No upcoming events found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${upcomingEvents.length} upcoming events in the next 24 hours`);
    
    let notificationsCreated = 0;
    
    // For each upcoming event
    for (const event of upcomingEvents) {
      console.log(`Processing event: ${event.title} (ID: ${event.id})`);
      
      // Get all users interested in this event
      const { data: interestedUsers, error: interestedError } = await supabase
        .from("event_interested")
        .select("user_id")
        .eq("event_id", event.id);
        
      if (interestedError) {
        console.error(`Error getting interested users for event ${event.id}:`, interestedError);
        continue;
      }
      
      if (!interestedUsers || interestedUsers.length === 0) {
        console.log(`No interested users for event ${event.id}`);
        continue;
      }
      
      console.log(`Found ${interestedUsers.length} interested users for event ${event.id}`);
      
      // Get event time in a readable format
      const eventDate = new Date(event.event_date);
      const formattedTime = eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formattedDate = eventDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      // Notify each interested user
      for (const user of interestedUsers) {
        // Check if user already has a reminder notification for this event
        const { data: existingNotifications, error: checkError } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.user_id)
          .eq("related_id", event.id.toString())
          .eq("type", "reminder");
          
        if (checkError) {
          console.error(`Error checking existing notification for user ${user.user_id}:`, checkError);
          continue;
        }
        
        // Skip if user already has a reminder notification for this event
        if (existingNotifications && existingNotifications.length > 0) {
          console.log(`User ${user.user_id} already has ${existingNotifications.length} reminder notification(s) for event ${event.id}`);
          continue;
        }
        
        // Create notification
        const notification: NotificationData = {
          user_id: user.user_id,
          title: "Event Reminder",
          message: `Your event "${event.title}" is happening soon at ${formattedTime} on ${formattedDate} ${event.location ? `at ${event.location}` : ''}`,
          type: "reminder",
          related_id: event.id.toString(),
          read: false
        };
        
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(notification);
          
        if (notificationError) {
          console.error(`Error creating notification for user ${user.user_id}:`, notificationError);
          continue;
        }
        
        notificationsCreated++;
        console.log(`Created reminder notification for user ${user.user_id} for event ${event.id}`);
      }
      
      // Also notify information officers about the upcoming event
      const { data: infoOfficers, error: officersError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "information_officer");
        
      if (officersError) {
        console.error("Error getting information officers:", officersError);
      } else if (infoOfficers && infoOfficers.length > 0) {
        console.log(`Found ${infoOfficers.length} information officers to notify about event ${event.id}`);
        
        for (const officer of infoOfficers) {
          // Skip if the officer is the event creator
          if (officer.user_id === event.created_by) {
            console.log(`Officer ${officer.user_id} is the event creator, skipping notification`);
            continue;
          }
          
          // Check if officer already has a reminder notification for this event
          const { data: existingNotifications, error: checkError } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", officer.user_id)
            .eq("related_id", event.id.toString())
            .eq("type", "reminder");
            
          if (checkError) {
            console.error(`Error checking existing notification for officer ${officer.user_id}:`, checkError);
            continue;
          }
          
          // Skip if officer already has a reminder notification for this event
          if (existingNotifications && existingNotifications.length > 0) {
            console.log(`Officer ${officer.user_id} already has ${existingNotifications.length} reminder notification(s) for event ${event.id}`);
            continue;
          }
          
          // Create notification for information officer
          const notification: NotificationData = {
            user_id: officer.user_id,
            title: "Event Status Update",
            message: `The event "${event.title}" you're overseeing is happening soon at ${formattedTime} on ${formattedDate} ${event.location ? `at ${event.location}` : ''}`,
            type: "reminder",
            related_id: event.id.toString(),
            read: false
          };
          
          const { error: notificationError } = await supabase
            .from("notifications")
            .insert(notification);
            
          if (notificationError) {
            console.error(`Error creating notification for officer ${officer.user_id}:`, notificationError);
            continue;
          }
          
          notificationsCreated++;
          console.log(`Created reminder notification for officer ${officer.user_id} for event ${event.id}`);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${notificationsCreated} notifications for upcoming events`,
        eventsProcessed: upcomingEvents.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in event-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
