
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Profile from "@/pages/Profile";
import Scanner from "@/pages/Scanner";
import People from "@/pages/People";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import CreateEvent from "@/pages/CreateEvent";
import EditEvent from "@/pages/EditEvent";
import EventDetails from "@/pages/EventDetails";

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/scanner" 
            element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/people" 
            element={
              <ProtectedRoute>
                <People />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-event" 
            element={
              <ProtectedRoute allowedRoles={['information_officer', 'admin']}>
                <CreateEvent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-event/:eventId" 
            element={
              <ProtectedRoute allowedRoles={['information_officer', 'admin']}>
                <EditEvent />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/event/:eventId" 
            element={
              <ProtectedRoute>
                <EventDetails />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
