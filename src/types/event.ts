
import { Database } from '@/integrations/supabase/types';

// This alias points to the Supabase database schema for the events table
export type EventRow = Database['public']['Tables']['events']['Row'];

// Our application Event interface, compatible with Supabase types
export interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  event_date: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  interest_count?: number; // Added interest count property
}

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  event_date: Date;
  image_url: string;
  is_active: boolean;
}

// Helper functions to convert between Supabase rows and our Event interface
export const convertSupabaseEventToEvent = (eventRow: EventRow): Event => {
  return {
    id: eventRow.id,
    title: eventRow.title,
    description: eventRow.description,
    image_url: eventRow.image_url,
    location: eventRow.location,
    event_date: eventRow.event_date,
    is_active: eventRow.is_active === null ? true : eventRow.is_active, // Default to true if null
    created_by: eventRow.created_by,
    created_at: eventRow.created_at || new Date().toISOString(),
    updated_at: eventRow.updated_at || new Date().toISOString(),
  };
};

// Helper function to convert array of EventRows to Event[]
export const convertSupabaseEventsToEvents = (eventRows: EventRow[]): Event[] => {
  return eventRows.map(convertSupabaseEventToEvent);
};
