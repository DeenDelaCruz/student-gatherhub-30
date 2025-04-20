
import { BrowserRouter as Router } from "react-router-dom";
import { createRoutes } from "@/routes";
import { AuthProvider } from "@/context/auth";
import { Toaster } from "@/components/ui/sonner";
import { useRoutes } from "react-router-dom";

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
