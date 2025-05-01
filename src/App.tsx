
import { BrowserRouter as Router } from "react-router-dom";
import { createRoutes } from "@/routes";
import { AuthProvider } from "@/context/auth";
import { Toaster } from "@/components/ui/sonner";
import { useRoutes } from "react-router-dom";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import PageLoader from "@/components/ui/page-loader";

/**
 * Routes component that uses the useRoutes hook inside the Router context
 */
const AppRoutes = () => {
  const routes = createRoutes();
  const routeElements = useRoutes(routes);
  
  return (
    <Suspense fallback={<PageLoader />}>
      {routeElements}
    </Suspense>
  );
};

/**
 * Main application component
 */
function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="w-full min-h-screen">
            <AppRoutes />
            <Toaster />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
