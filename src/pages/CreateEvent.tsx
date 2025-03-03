
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import EventForm from "@/components/EventForm";
import { useAuth } from "@/context/auth";
import { toast } from "sonner";

const CreateEvent = () => {
  const { hasRole, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user has permission to create events
    if (!loading && !hasRole('information_officer') && !hasRole('admin')) {
      toast.error("You don't have permission to create events");
      navigate("/");
    }
  }, [hasRole, loading, navigate]);

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-medium mb-6">Create New Event</h1>
          <EventForm />
        </div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default CreateEvent;
