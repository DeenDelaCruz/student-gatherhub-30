
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";

interface InformationOfficer {
  id: string;
  name: string | null;
  email: string | null;
  year: string | null;
}

const People = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [officers, setOfficers] = useState<InformationOfficer[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    // Only fetch data after authentication status is resolved
    if (authLoading) {
      return; // Don't fetch while auth is still loading
    }
    
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        console.log("Fetching information officers...");
        
        // First, fetch all user_ids with the information_officer role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'information_officer');
        
        if (roleError) {
          console.error("Error fetching officer roles:", roleError);
          toast.error("Failed to load information officers");
          return;
        }
        
        console.log("Role data:", roleData);
        
        if (!roleData || roleData.length === 0) {
          console.log("No information officers found");
          setOfficers([]);
          setLoading(false);
          return;
        }
        
        // Extract user_ids from the role data
        const officerIds = roleData.map(item => item.user_id);
        console.log("Found officer IDs:", officerIds);
        
        // Then, fetch the profile data for those user_ids
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email, year')
          .in('id', officerIds);
        
        if (profileError) {
          console.error("Error fetching profiles:", profileError);
          toast.error("Failed to load officer profiles");
          return;
        }
        
        console.log("Retrieved profiles:", profileData);
        
        // Set the officers state with the fetched profiles
        setOfficers(profileData || []);
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    // Only attempt to fetch if the user is authenticated
    if (user) {
      fetchOfficers();
    } else {
      // Clear officers if not authenticated
      setOfficers([]);
    }
  }, [user, authLoading]); // Depend on both user and authLoading
  
  const filteredOfficers = officers.filter(officer => 
    (officer.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     officer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     officer.year?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleConnect = (id: string) => {
    // In a real app, this would send a connection request
    toast.success("Connection request sent", {
      position: "top-center",
    });
  };
  
  // Show loading spinner if auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-campus-bg flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
        <p className="mt-4 text-gray-600">Verifying authentication...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <h2 className="text-xl font-medium mb-4">Information Officers</h2>
        
        <div className="search-bar mb-5">
          <input
            type="text"
            placeholder="Search information officers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-campus-accent transition-all"
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-campus-accent"></div>
          </div>
        ) : (
          <div className="people-list">
            {filteredOfficers.length > 0 ? (
              filteredOfficers.map((officer, index) => (
                <motion.div
                  key={officer.id}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm flex items-center justify-between"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className="flex items-center">
                    <div className="bg-campus-accent/10 rounded-full p-2 mr-3">
                      <User size={18} className="text-campus-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium">{officer.name || "No name"}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{officer.email || "No email"}</span>
                        {officer.year && (
                          <>
                            <span className="mx-2">&bull;</span>
                            <span>{officer.year}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(officer.id)}
                    className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                  >
                    <UserPlus size={16} className="text-gray-600" />
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {searchTerm 
                  ? `No information officers found for "${searchTerm}"`
                  : "No information officers found"}
              </div>
            )}
          </div>
        )}
      </main>
      
      <Navigation />
    </div>
  );
};

export default People;
