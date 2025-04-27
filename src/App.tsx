
import { BrowserRouter as Router } from "react-router-dom";
import { createRoutes } from "@/routes";
import { AuthProvider } from "@/context/auth";
import { Toaster } from "@/components/ui/sonner";
import { useRoutes } from "react-router-dom";
import { Suspense } from "react";

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </Router>
  );
};

export default App;
