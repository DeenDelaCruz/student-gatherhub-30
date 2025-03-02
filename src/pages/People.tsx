
import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const PEOPLE = [
  { id: 1, name: "Alex Johnson", role: "Computer Science", year: "Senior" },
  { id: 2, name: "Maya Patel", role: "Data Science", year: "Junior" },
  { id: 3, name: "Jackson Lee", role: "Software Engineering", year: "Senior" },
  { id: 4, name: "Sophie Chen", role: "Information Technology", year: "Sophomore" },
  { id: 5, name: "Noah Williams", role: "Computer Science", year: "Freshman" }
];

const People = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredPeople = PEOPLE.filter(person => 
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleConnect = (id: number) => {
    // In a real app, this would send a connection request
    toast.success("Connection request sent", {
      position: "top-center",
    });
  };
  
  return (
    <div className="min-h-screen bg-campus-bg flex flex-col pb-20">
      <Header />
      
      <main className="flex-1 p-4">
        <h2 className="text-xl font-medium mb-4">People Network</h2>
        
        <div className="search-bar mb-5">
          <input
            type="text"
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-campus-accent transition-all"
          />
        </div>
        
        <div className="people-list">
          {filteredPeople.map((person, index) => (
            <motion.div
              key={person.id}
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
                  <h3 className="font-medium">{person.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{person.role}</span>
                    <span className="mx-2">&bull;</span>
                    <span>{person.year}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleConnect(person.id)}
                className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
              >
                <UserPlus size={16} className="text-gray-600" />
              </button>
            </motion.div>
          ))}
          
          {filteredPeople.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No people found for "{searchTerm}"
            </div>
          )}
        </div>
      </main>
      
      <Navigation />
    </div>
  );
};

export default People;
