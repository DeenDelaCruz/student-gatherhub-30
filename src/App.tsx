
import { BrowserRouter as Router } from "react-router-dom";
import { createRoutes } from "@/routes";
import { AuthProvider } from "@/context/auth";
import { Toaster } from "@/components/ui/sonner";
import { useRoutes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import PageLoader from "@/components/ui/page-loader";

/**
 * Main application component
 */
function App() {
  const routes = createRoutes();
  const routeElements = useRoutes(routes);
  
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            {routeElements}
          </Suspense>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
