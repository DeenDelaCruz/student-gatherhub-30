import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrCode, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QrCodeGeneratorProps {
  userId: string;
}

const QrCodeGenerator = ({ userId }: QrCodeGeneratorProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingQrCode, setExistingQrCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, title, created_by, qr_code_data")
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      // Check if the selected event has an existing QR code
      const event = events.find(e => e.id.toString() === selectedEvent);
      if (event && event.qr_code_data) {
        setExistingQrCode(event.qr_code_data);
        setQrCodeUrl(event.qr_code_data);
      } else {
        setExistingQrCode(null);
        setQrCodeUrl(null);
      }
    }
  }, [selectedEvent, events]);

  const generateQrCode = async () => {
    if (!selectedEvent) return;
    
    setLoading(true);
    try {
      // Create QR code data
      const eventData = { eventId: selectedEvent };
      const jsonString = JSON.stringify(eventData);
      
      // Generate QR code URL using a service like QR Server API
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(jsonString)}&size=200x200`;
      
      // Save the QR code URL to the database FIRST
      const { error } = await supabase
        .from("events")
        .update({ qr_code_data: qrApiUrl })
        .eq("id", selectedEvent);
        
      if (error) throw error;
      
      // After successful database update, update the UI states
      setQrCodeUrl(qrApiUrl);
      setExistingQrCode(qrApiUrl);
      
      // Also update the local events array to keep it in sync
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id.toString() === selectedEvent 
            ? { ...event, qr_code_data: qrApiUrl } 
            : event
        )
      );
      
      toast.success("QR code generated and saved successfully");
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const downloadQrCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `event-qr-${selectedEvent}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-center text-xl">
          <QrCode className="mr-2 h-6 w-6" />
          Event QR Code
        </CardTitle>
        <CardDescription className="text-center">
          View or create a QR code for event attendance tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select an Event</label>
          <Select onValueChange={setSelectedEvent} value={selectedEvent || undefined}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedEvent && (
          <>
            {existingQrCode ? (
              <div className="mt-4 space-y-4 flex flex-col items-center">
                <div className="text-sm text-muted-foreground mb-2">
                  QR code for this event:
                </div>
                <img 
                  src={existingQrCode} 
                  alt="Event QR Code" 
                  className="border border-gray-200 rounded-lg"
                />
                
                <div className="flex flex-col gap-2 w-full">
                  <Button variant="outline" onClick={downloadQrCode}>
                    Download QR Code
                  </Button>
                  
                  <Button 
                    onClick={generateQrCode}
                    disabled={loading}
                    className="flex items-center"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate New QR Code
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <Button 
                  className="w-full" 
                  onClick={generateQrCode}
                  disabled={!selectedEvent || loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : "Generate QR Code"}
                </Button>
                
                {qrCodeUrl && (
                  <div className="space-y-4 flex flex-col items-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="Event QR Code" 
                      className="border border-gray-200 rounded-lg"
                    />
                    <Button variant="outline" onClick={downloadQrCode}>
                      Download QR Code
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QrCodeGenerator;
