
import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Database } from "@/integrations/supabase/types";

// Type definition for user roles
type UserRole = Database["public"]["Enums"]["app_role"];

// Lazy load pages for better performance
const Index = lazy(() => import("@/pages/Index"));
const Profile = lazy(() => import("@/pages/Profile"));
const Scanner = lazy(() => import("@/pages/Scanner"));
const People = lazy(() => import("@/pages/People"));
const Auth = lazy(() => import("@/pages/Auth"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const CreateEvent = lazy(() => import("@/pages/CreateEvent"));
const EditEvent = lazy(() => import("@/pages/EditEvent"));
const EventDetails = lazy(() => import("@/pages/EventDetails"));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-campus-accent"></div>
  </div>
);

// Define route types
type RouteConfig = {
  path: string;
  element: React.ReactNode;
  requiresAuth?: boolean;
  allowedRoles?: UserRole[];
};

// Routes configuration
const routesConfig: RouteConfig[] = [
  {
    path: "/auth",
    element: <Auth />,
    requiresAuth: false,
  },
  {
    path: "/",
    element: <Index />,
    requiresAuth: true,
  },
  {
    path: "/profile",
    element: <Profile />,
    requiresAuth: true,
  },
  {
    path: "/scanner",
    element: <Scanner />,
    requiresAuth: true,
  },
  {
    path: "/people",
    element: <People />,
    requiresAuth: true,
  },
  {
    path: "/create-event",
    element: <CreateEvent />,
    requiresAuth: true,
    allowedRoles: ["information_officer", "admin"],
  },
  {
    path: "/edit-event/:eventId",
    element: <EditEvent />,
    requiresAuth: true,
    allowedRoles: ["information_officer", "admin"],
  },
  {
    path: "/event/:eventId",
    element: <EventDetails />,
    requiresAuth: true,
  },
  {
    path: "*",
    element: <NotFound />,
    requiresAuth: false,
  },
];

// Create React Router compatible routes
export const createRoutes = (): RouteObject[] => {
  return routesConfig.map(({ path, element, requiresAuth, allowedRoles }) => {
    // Wrap element in suspense for lazy loading
    const lazyElement = <Suspense fallback={<PageLoader />}>{element}</Suspense>;
    
    // Apply ProtectedRoute for auth-required routes
    const routeElement = requiresAuth ? (
      <ProtectedRoute allowedRoles={allowedRoles}>{lazyElement}</ProtectedRoute>
    ) : (
      lazyElement
    );

    return {
      path,
      element: routeElement,
    };
  });
};
