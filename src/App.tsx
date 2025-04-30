
import { BrowserRouter as Router } from "react-router-dom";
import { createRoutes } from "@/routes";
import { AuthProvider } from "@/context/auth";
import { Toaster } from "@/components/ui/sonner";
import { useRoutes } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { useTheme } from "next-themes";

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
  </div>
);

// AppRoutes component to use the useRoutes hook
const AppRoutes = () => {
  const routes = createRoutes();
  const { theme } = useTheme();
  
  // Apply theme class to the body
  useEffect(() => {
    if (theme) {
      document.body.className = theme;
    }
  }, [theme]);
  
  return useRoutes(routes);
};

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Router>
        <AuthProvider>
          <Toaster position="top-center" />
          <Suspense fallback={<PageLoader />}>
            <AppRoutes />
          </Suspense>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
