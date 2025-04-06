import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requireAuth?: boolean;
}

export function ProtectedRoute({ path, component: Component, requireAuth = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // For components that require authentication
  if (requireAuth && !user) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
          <h2 className="text-xl font-bold mb-4 text-[#c0c0c0]">Login Required</h2>
          <p className="text-center mb-6">You need to be logged in to access this feature.</p>
          <a 
            href="/auth" 
            className="px-4 py-2 bg-gradient-to-r from-[#c0c0c0] to-gray-500 text-[#242235] font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Login or Register
          </a>
        </div>
      </Route>
    );
  }

  // Render the component for all users
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}