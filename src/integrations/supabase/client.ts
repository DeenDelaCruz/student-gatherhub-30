import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

// Define Supabase URL and key directly from project config
const supabaseUrl = "https://nsjyerikykwbitksdurq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zanllcmlreWt3Yml0a3NkdXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.Yh3DJlLkv8_PXa3Zrmva1A_YVC-oBFzrB6Y3IXvEVGg";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    // Important: don't use the default UI, we're making our own
    flowType: 'pkce',
  },
});

// Make sure we're setting the right redirect URL
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out, redirecting to /auth');
    window.location.href = '/auth';
  }
});

// Event interest and attendance functions
export const getEventInterestCount = async (eventId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("event_interested")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
      
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting event interest count:", error);
    return 0;
  }
};

export const getEventCheckedInCount = async (eventId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("event_attendees_new")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
      
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting event checked-in count:", error);
    return 0;
  }
};

export const isUserInterestedInEvent = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("event_interested")
      .select("*")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();
      
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking user interest in event:", error);
    return false;
  }
};

export const markEventInterest = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("event_interested")
      .insert({ 
        event_id: eventId,
        user_id: userId
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking event interest:", error);
    return false;
  }
};

export const removeEventInterest = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("event_interested")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing event interest:", error);
    return false;
  }
};

// User events functions
export const getUserAttendedEvents = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("event_attendees_new")
      .select("event_id")
      .eq("user_id", userId);
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    const eventIds = data.map(item => item.event_id);
    
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .in("id", eventIds);
      
    if (eventsError) throw eventsError;
    
    return eventsData || [];
  } catch (error) {
    console.error("Error getting user attended events:", error);
    return [];
  }
};

export const getUserInterestedEvents = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("event_interested")
      .select("event_id")
      .eq("user_id", userId);
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    const eventIds = data.map(item => item.event_id);
    
    const { data: eventsData, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .in("id", eventIds);
      
    if (eventsError) throw eventsError;
    
    return eventsData || [];
  } catch (error) {
    console.error("Error getting user interested events:", error);
    return [];
  }
};

// Check-in functions
export const checkInUserToEvent = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("event_attendees_new")
      .insert({
        event_id: eventId,
        user_id: userId
      });
      
    if (error) throw error;
    
    // Update the user's attended events count - fixing the previous RPC call
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('events_attended')
      .eq('id', userId)
      .single();
      
    if (!profileError && profile) {
      const newCount = (profile.events_attended || 0) + 1;
      await supabase
        .from('profiles')
        .update({ events_attended: newCount })
        .eq('id', userId);
    }
    
    return true;
  } catch (error) {
    console.error("Error checking in user to event:", error);
    return false;
  }
};

// Event attendees and interested users functions
export const getEventAttendees = async (eventId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("event_attendees_new")
      .select("user_id, check_in_time")
      .eq("event_id", eventId);
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    const userIds = data.map(item => item.user_id);
    
    const { data: usersData, error: usersError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
      
    if (usersError) throw usersError;
    
    // Merge the check-in time with the user data
    return (usersData || []).map(user => {
      const attendeeRecord = data.find(item => item.user_id === user.id);
      return {
        ...user,
        check_in_time: attendeeRecord?.check_in_time
      };
    });
  } catch (error) {
    console.error("Error getting event attendees:", error);
    return [];
  }
};

export const getEventInterestedUsers = async (eventId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("event_interested")
      .select("user_id")
      .eq("event_id", eventId);
      
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    const userIds = data.map(item => item.user_id);
    
    const { data: usersData, error: usersError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
      
    if (usersError) throw usersError;
    
    return usersData || [];
  } catch (error) {
    console.error("Error getting event interested users:", error);
    return [];
  }
};

// Admin functions
export const getTotalUsers = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
      
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting total users:", error);
    return 0;
  }
};

export const getTotalEvents = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });
      
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting total events:", error);
    return 0;
  }
};

export const getAllEvents = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting all events:", error);
    return [];
  }
};

export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    // Delete related records first
    await supabase.from("event_interested").delete().eq("event_id", eventId);
    await supabase.from("event_attendees_new").delete().eq("event_id", eventId);
    
    // Then delete the event
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
    return false;
  }
};

export const promoteStudentToInfoOfficer = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "information_officer"
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error promoting student to info officer:", error);
    return false;
  }
};

// Notification functions
export const createEventReminderNotifications = async (eventId: string, title: string, message: string): Promise<boolean> => {
  try {
    // Get all users interested in the event
    const { data: interestedUsers, error: interestedError } = await supabase
      .from("event_interested")
      .select("user_id")
      .eq("event_id", eventId);
      
    if (interestedError) throw interestedError;
    
    if (!interestedUsers || interestedUsers.length === 0) return true;
    
    // Create notifications for each interested user
    const notifications = interestedUsers.map(user => ({
      user_id: user.user_id,
      title,
      message,
      type: "event_reminder",
      related_id: eventId
    }));
    
    const { error } = await supabase
      .from("notifications")
      .insert(notifications);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error creating event reminder notifications:", error);
    return false;
  }
};
