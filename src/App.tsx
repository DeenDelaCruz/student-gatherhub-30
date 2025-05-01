
import { BrowserRouter as Router } from "react-router-dom";
import { createRoutes } from "@/routes";
import { AuthProvider } from "@/context/auth";
import { Toaster } from "@/components/ui/sonner";
import { useRoutes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ThemeProvider } from "@/components/theme-provider";

// Lazy load components
const PageLoader = lazy(() => import("@/components/ui/page-loader"));

// Create a dedicated PageLoader component
<lov-write file_path="src/components/ui/page-loader.tsx">
import React from "react";

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
  </div>
);

export default PageLoader;
