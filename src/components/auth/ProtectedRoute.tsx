import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../../pages/admin/components/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ("admin" | "manager")[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = "/",
}) => {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (!allowedRoles.includes(user.role as "admin" | "manager")) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
