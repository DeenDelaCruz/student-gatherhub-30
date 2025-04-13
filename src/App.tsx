
import { BrowserRouter as Router, Routes, Route, useRoutes } from "react-router-dom";
import { createRoutes } from "@/routes";
import { AuthProvider } from "@/context/auth/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

// AppRoutes component to use the useRoutes hook
const AppRoutes = () => {
  const routes = createRoutes();
  return useRoutes(routes);
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
